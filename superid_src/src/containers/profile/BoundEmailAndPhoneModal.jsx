import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styles from './BoundEmailAndPhoneModal.scss'
import { Modal, Form, Input, Button, Message } from 'antd'
import config from '../../config'
import { updateUserMobile, updateUserEmail } from '../../actions/user'
import messageHandler from 'messageHandler'

function noop() {
  return false
}

const MODAL_TYPE = {
  BOUND_EMAIL: 'BOUND_EMAIL', //绑定邮箱
  MODIFY_EMAIL: 'MODIFY_EMAIL', //修改绑定邮箱
  BOUND_PHONE: 'BOUND_PHONE', //绑定手机号
  MODIFY_PHONE: 'MODIFY_PHONE', //修改手机号
}


const Item = Form.Item
const BoundEmailModal = React.createClass({
  getInitialState() {
    return {
      resetCoolDown: 0,
    }
  },

  PropTypes: {
    type: PropTypes.string.isRequired,
  },
  getDefaultProps() {
    return {
      type: MODAL_TYPE.BOUND_EMAIL,
    }
  },

  componentWillUnmount() {
    clearInterval(this._Timer)
  },

  handleCancel() {
    this.props.callback()
  },

  onSendVerifyCode(token) {
    const field = (this.props.type == MODAL_TYPE.BOUND_EMAIL || this.props.type == MODAL_TYPE.MODIFY_EMAIL) ? ['email'] : ['mobile']
    this.props.form.validateFields(field, (errors) => {
      if (errors) {
        return
      }

      if (this.state.resetCoolDown) {
        Message.error(`请${this.state.resetCoolDown}秒后再尝试绑定。`)
        return
      }

      this.setState({ isSending: true })

      fetch(config.api.verifyCode.changeToken(token), {
        method: 'GET',
        credentials: 'include',
      }).then((res) => (res.json())).then(messageHandler).then((json) => {
        if (json.code === 0) {
          Message.success('验证码发送成功。')

          this.setState({
            resetCoolDown: 60,
          })

          this._Timer = setInterval(() => {
            if (this.state.resetCoolDown === 0) {
              clearInterval(this._Timer)
            } else {
              this.setState({
                resetCoolDown: this.state.resetCoolDown - 1,
              })
            }
          }, 1000)
        }
        this.setState({
          isSending: false
        })
      })
    })

  },

  onEmailChange() {
    this.props.form.validateFields((errors, values) => {
      if (errors) {
        return
      }

      this.setState({ isSubmitting: true })
      this.props.updateEmail(values.email, values.verifyCode).then(messageHandler).then((res) => {
        if (res.code == 0) {
          Message.success('绑定成功')
          clearInterval(this._Timer)
          this.setState({ resetCoolDown: false })
          this.handleCancel()

        }
      })
      this.setState({ isSubmitting: false })
    })
  },

  onPhoneChange() {
    this.props.form.validateFields((errors, values) => {
      if (errors) {
        return
      }

      this.setState({ isSubmitting: true })

      this.props.updateMobile(values.mobile, values.verifyCode).then(messageHandler).then((res) => {
        if (res.code == 0) {
          Message.success('绑定成功')
          clearInterval(this._Timer)
          this.setState({ resetCoolDown: false })
          this.handleCancel()
        }
      })

      this.setState({ isSubmitting: false })
    })
  },

  onForgetPassword() {
    this.props.onShowResetPasswordModal()
  },

  getVerifyCodeDecorator() {
    return this.props.form.getFieldDecorator('verifyCode', {
      rules: [{
        required: true,
        min: 6,
        max: 6,
        message: '请输入6位验证码'
      }]
    })
  },

  checkPassword(rule, value, callback){
    fetch(config.api.user.password.check(value), {
      method: 'POST'
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0){
        callback()
      } else {
        callback('密码错误，请输入登录密码以完成验证')
      }
    })
  },


  renderBoundEmail() {
    const { getFieldDecorator } = this.props.form
    const { resetCoolDown } = this.state
    const passwordDecorator = getFieldDecorator('password', {
      rules: [
        { required: true, whitespace: true, message: '请输入原密码' },
        { validator: this.checkPassword },
      ],

    })
    const emailDecorator = getFieldDecorator('email', {
      validate: [{
        rules: [{
          required: true,
          message: '请输入绑定邮箱',
        }],
        trigger: ['onBlur', 'onChange'],
      }, {
        rules: [{
          required: true,
          pattern: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/,
          message: '邮箱格式为xxx@xxx.xxx的格式',
        }],
        trigger: ['onBlur', 'onChange'],
      }]
    })

    return (
      <Modal
        title={this.props.type == MODAL_TYPE.BOUND_EMAIL ? '绑定邮箱' : '修改绑定邮箱'}
        visible
        wrapClassName={styles.boundEmailModal}
        width={500}
        onCancel={this.handleCancel}
        maskClosable={false}
        footer={[]}
      >
        <div className={styles.container}>
          <div className={styles.content}>
            <span className={styles.title}>请输入SuperID登录密码以验证身份</span>
            <Form layout="horizontal">
              <Item className={styles.row}>
                <span className={styles.label}>登录密码:</span>
                {passwordDecorator(
                  <Input
                    style={{ width: 300 }}
                    type="password"
                    autoComplete="off"
                    placeholder="输入原密码"
                    onContextMenu={noop}
                    onPaste={noop}
                    onCopy={noop}
                    onCut={noop}
                  />
                )}
              </Item>
              <Item className={styles.row}>
                <span className={styles.label}>电子邮箱:</span>
                {emailDecorator(
                  <Input
                    style={{ width: 300 }}
                    placeholder="请输入邮箱账号"
                    ref={(el) => {
                      this.email = el
                    }}
                  />
                )}
              </Item>
              <Item className={styles.row}>
                <span className={styles.label}>验证码:</span>
                {this.getVerifyCodeDecorator()(
                  <Input
                    style={{ width: 175 }}
                    placeholder="请输入验证码"
                  />
                )}
                {resetCoolDown === 0 ?
                  <Button type="primary"
                    onClick={() => this.onSendVerifyCode(this.props.form.getFieldValue('email'))}
                  >发送验证码</Button>
                  :
                  <Button type="primary" disabled>发送验证码({resetCoolDown})</Button>
                }

              </Item>
            </Form>
          </div>
          <div className={styles.footer}>
            <div
              className={styles.forget}
              onClick={() => {
                this.onForgetPassword()
              }}
            >忘记密码?</div>
            <div className={styles.btn}>
              <Button type="ghost" onClick={() => this.handleCancel()}>取消</Button>
              <Button type="primary" onClick={() => this.onEmailChange()}>确定</Button>
            </div>
          </div>
        </div>
      </Modal>
    )
  },
  renderBoundPhone() {
    const { getFieldDecorator } = this.props.form
    const { resetCoolDown } = this.state
    const passwordDecorator = getFieldDecorator('password', {
      rules: [
        { required: true, whitespace: true, message: '请输入原密码' },
        { validator: this.checkPassword }
      ],

    })
    const mobileDecorator = getFieldDecorator('mobile', {
      validate: [{
        rules: [{
          required: true,
          message: '请输入绑定手机'
        }],
        trigger: ['onBlur', 'onChange']
      }, {
        rules: [{
          required: true,
          pattern: /^1(3|4|5|7|8)\d{9}$/,
          message: '请输入有效的手机号'
        }],
        trigger: ['onBlur', 'onChange']
      }]
    })

    return (
      <Modal
        title={this.props.type == MODAL_TYPE.BOUND_PHONE ? '绑定手机号' : '修改绑定手机号'}
        visible
        wrapClassName={styles.boundEmailModal}
        width={500}
        onCancel={this.handleCancel}
        maskClosable={false}
        footer={[]}
      >
        <div className={styles.container}>
          <div className={styles.content}>
            <span className={styles.title}>请输入SuperID登录密码以验证身份</span>
            <Form layout="horizontal">
              <Item className={styles.row}>
                <span className={styles.label}>登录密码:</span>
                {passwordDecorator(
                  <Input
                    style={{ width: 300 }}
                    type="password"
                    autoComplete="off"
                    placeholder="输入原密码"
                    onContextMenu={noop}
                    onPaste={noop}
                    onCopy={noop}
                    onCut={noop}
                  />
                )}
              </Item>
              <Item className={styles.row}>
                <span className={styles.label}>手机号:</span>
                {mobileDecorator(<Input style={{ width: 300 }} />)}
              </Item>
              <Item className={styles.row}>
                <span className={styles.label}>验证码:</span>
                {this.getVerifyCodeDecorator()(<Input style={{ width: 175 }} placeholder="请输入验证码"/>)}
                {resetCoolDown === 0 ?
                  <Button type="primary" onClick={() => this.onSendVerifyCode(this.props.form.getFieldValue('mobile'))}>发送验证码</Button>
                  :
                  <Button type="primary" disabled>发送验证码({resetCoolDown})</Button>
                }

              </Item>
            </Form>
          </div>
          <div className={styles.footer}>
            <div
              className={styles.forget}
              onClick={() => {
                this.onForgetPassword()
              }}
            >忘记密码?</div>
            <div className={styles.btn}>
              <Button type="ghost" onClick={() => this.handleCancel()}>取消</Button>
              <Button type="primary" onClick={() => this.onPhoneChange()}>确定</Button>
            </div>
          </div>
        </div>
      </Modal>
    )
  },
  render() {
    return (
      <div>
        {(this.props.type == MODAL_TYPE.BOUND_EMAIL || this.props.type == MODAL_TYPE.MODIFY_EMAIL) ? (
          this.renderBoundEmail()
        ) : (
          this.renderBoundPhone()
        )}
      </div>
    )
  },
})

function mapDispatchToProps(dispatch) {
  return {
    updateMobile: bindActionCreators(updateUserMobile, dispatch),
    updateEmail: bindActionCreators(updateUserEmail, dispatch),
  }
}


export default connect(() => ({}), mapDispatchToProps)(Form.create()(BoundEmailModal))
