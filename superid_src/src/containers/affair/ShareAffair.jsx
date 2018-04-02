import React, { PropTypes } from 'react'
import { Modal, Tabs, Select, Button, Input, Icon, Form, message } from 'antd'
import { ShareLink, ShareMail, ShareQR } from 'svg'
import QRCode from 'qrcode.react'
import CopyToClipboard from 'react-copy-to-clipboard'
import TimerMixin from 'react-timer-mixin'
import styles from './ShareAffair.scss'
import config from '../../config'

const TabPane = Tabs.TabPane
const Option = Select.Option
const FormItem = Form.Item

function fetchShareLink(affairId, roleId, periodOfValidity) {
  return fetch(config.api.share.affair.post(periodOfValidity), {
    method: 'GET',
    credentials: 'include',
    affairId,
    roleId,
  }).then((res) => res.json())
}

const ShareQRCode = React.createClass({
  propTypes: {
    value: PropTypes.string,
  },
  getDefaultProps() {
    return {
      value: '',
    }
  },
  handleSaveQRCode() {
    const link = document.createElement('a')

    link.download = '分享二维码.png'
    link.href = this._qrcanvas._canvas.toDataURL()
    link.click()
  },
  handleCopyQRCodeImage() {
    // Make a target image element.
    const img = document.createElement('img')
    img.src = this._qrcanvas._canvas.toDataURL()
    img.alt = '您的浏览器不支持图片复制功能，请使用另存为保存图片。'
    const div = document.createElement('div')
    div.contentEditable = true
    div.appendChild(img)
    document.body.appendChild(div)

    // Select the image element.
    if (document.body.createTextRange) {
      let range = document.body.createTextRange()
      range.moveToElementText(div)
      range.select()
    } else if (window.getSelection) {
      let selection = window.getSelection()
      let range = document.createRange()
      range.selectNodeContents(div)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    document.execCommand('Copy')
    document.body.removeChild(div)
    message.success('复制成功！')
  },

  render() {
    return (
      <div className={styles.shareQRCode}>
        <div className={styles.QRCode}>
          <QRCode ref={(ref) => this._qrcanvas = ref} value={this.props.value} size={170} />
        </div>
        <p>该二维码 24 小时内有效</p>
        <div className={styles.buttonGroup}>
          <Button size="large" onClick={this.handleCopyQRCodeImage}>复制</Button>
          <Button size="large" onClick={this.handleSaveQRCode}>下载</Button>
        </div>
      </div>
    )
  }
})

let EmailInvitation = React.createClass({
  propTypes: {
    value: PropTypes.string.isRequired,
    roleId: PropTypes.number.isRequired,
    affairId: PropTypes.number.isRequired,
  },
  mixins: [TimerMixin],

  getInitialState() {
    return {
      isSendingMail: false,
      sendMailCD: 0,
    }
  },

  startCoolDown() {
    // 开始发送邮件的冷却倒计时
    this.setState({
      sendMailCD: 60,
    })
    this.setInterval(() => {
      const cd = this.state.sendMailCD - 1

      if (cd <= 0) {
        this.clearInterval()
        this.setState({
          sendMailCD: 0,
        })
      } else {
        this.setState({
          sendMailCD: cd,
        })
      }
    }, 1000)
  },

  handleSendEmail(e) {
    e.preventDefault()

    this.props.form.validateFieldsAndScroll((errors, values) => {
      if (errors) {
        return
      }

      const {
        email,
      } = values

      const body = {
        url: this.props.value,
        roleId: this.props.roleId,
        emails: [email],
      }

      this.setState({
        isSendingMail: true,
      })

      this.startCoolDown()
      this.setState({
        isSendingMail: true,
      })
      fetch(config.api.share.affair.mail.post, {
        method: 'POST',
        credentials: 'include',
        roleId: this.props.roleId,
        affairId: this.props.affairId,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
      }).then((res) => res.json()).then((res) => {

        if (res.code === 0) {
          message.success('发送邮件成功！')
        } else {
          message.error('服务器出错！')
        }
        this.setState({
          isSendingMail: false,
        })
      })
    })
  },

  render() {
    const formItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 14 },
    }

    const { getFieldDecorator } = this.props.form

    return (
      <div className={styles.emailInvitation}>
        <Form layout="horizontal">
          <FormItem {...formItemLayout} label="邮箱地址">
            {getFieldDecorator('email', {
              validate: [{
                rules: [{
                  required: true,
                  message: '请输入邮箱地址',
                }, {
                  type: 'email',
                  message: '请输入正确的邮箱地址',
                }],
                trigger: 'onBlur',
              }],
            })(<Input />)}
          </FormItem>
        </Form>
        {
          this.state.sendMailCD ? (
            <Button type="primary" size="large" disabled >{`重新发送（${this.state.sendMailCD}）`}</Button>
          ) : (
            <Button type="primary" size="large" onClick={this.handleSendEmail} loading={this.state.isSendingMail}>发送</Button>
          )
        }
      </div>
    )
  }
})

EmailInvitation = Form.create()(EmailInvitation)

const ShareAffair = React.createClass({
  propTypes: {
    affair: PropTypes.object.isRequired,
    onClose: PropTypes.func,
  },

  getInitialState() {
    return {
      createdLink: null,
      QRCodeLink: null,
      emailCodeLink: null,
      currentSelectedPeriodOfValidity: '24',
    }
  },

  getShareLink(shareId) {
    return `${window.location.href.replace(window.location.pathname, '')}/share/${shareId}`
  },

  componentDidMount() {
    // 获取一个24小时内有效的链接作为二维码
    const affair = this.props.affair
    fetchShareLink(affair.get('id'), affair.get('roleId'), 24).then((res) => {
      if (res.code === 0) {
        const shareId = res.data

        this.setState({
          // QRCodeLink: `superid://com.simu.menkor/affair?shareId=${shareId}`,
          QRCodeLink: `${window.location.href.replace(window.location.pathname, '')}/mobile/share/${shareId}`,
          emailCodeLink: this.getShareLink(shareId),
        })
      }
    })
  },

  handleCreateLinkInvitation() {
    const affair = this.props.affair

    fetchShareLink(affair.get('id'), affair.get('roleId'), this.state.currentSelectedPeriodOfValidity).then((res) => {
      if (res.code === 0) {
        const shareId = res.data

        this.setState({
          createdLink: {
            url: this.getShareLink(shareId),
            pov: this.state.currentSelectedPeriodOfValidity,
          },
        })
      }
    })
  },

  renderLinkInvitation() {
    let content = null
    if (!this.state.createdLink) {
      content = (
        <div className={styles.createLink}>
          <span>有效期：</span>
          <Select
            style={{ width: 172, marginRight: 10 }}
            value={this.state.currentSelectedPeriodOfValidity}
            onSelect={(value) => this.setState({ currentSelectedPeriodOfValidity: value })}
          >
            <Option value="5">5小时</Option>
            <Option value="10">10小时</Option>
            <Option value="24">24小时</Option>
            <Option value="72">3天</Option>
            <Option value="168">7天</Option>
          </Select>
          <Button type="primary" size="large" onClick={this.handleCreateLinkInvitation}>创建链接</Button>
        </div>
      )
    } else {
      const {
        url,
        pov,
      } = this.state.createdLink

      content = (
        <div className={styles.showLinkUrl}>
          <div className={styles.showLinkToast}>
            <Icon type="check-circle" />
            <span>{`成功创建链接！该有效期为${pov}小时`}</span>
          </div>
          <div className={styles.copyLink}>
            <span>链接：</span>
            <Input value={url} />
            <CopyToClipboard text={url}>
              <Button type="primary" size="large" style={{ marginLeft: 10 }}>复制</Button>
            </CopyToClipboard>
          </div>
        </div>
      )
    }

    return (
      <div className={styles.linkInvitation}>
        { content }
      </div>
    )
  },
  renderTabs() {
    return (
      <Tabs>
        <TabPane tab={<span className={styles.tabIcon}><ShareLink />链接分享</span>} key="1" >{this.renderLinkInvitation()}</TabPane>
        <TabPane tab={<span className={styles.tabIcon}><ShareQR />二维码分享</span>} key="2" ><ShareQRCode value={this.state.QRCodeLink} /></TabPane>
        <TabPane tab={<span className={styles.tabIcon}><ShareMail />发到邮箱</span>} key="3" ><EmailInvitation value={this.state.emailCodeLink} roleId={this.props.affair.get('roleId')} affairId={this.props.affair.get('id')} /></TabPane>
      </Tabs>
    )
  },
  render() {
    return (
      <Modal
        visible
        maskClosable={false}
        footer={null}
        title="分享事务"
        onCancel={() => this.props.onClose && this.props.onClose()}
      >
        <div className={styles.container}>
          {/* 选择分享方式 */}
          {this.renderTabs()}
        </div>
      </Modal>
    )
  }
})

export default ShareAffair
