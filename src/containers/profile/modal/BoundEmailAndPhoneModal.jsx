import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styles from './BoundEmailAndPhoneModal.scss'
import { Modal, Form, Input, Button, message, notification } from 'antd'
import { changeMobileOrEmail, getChangeToken, checkPwd } from '../../../actions/user'

function noop() {
  return false
}

export const MODAL_TYPE = {
  BOUND_EMAIL: 0, //绑定邮箱
  MODIFY_EMAIL: 1, //修改绑定邮箱
  BOUND_PHONE: 2, //绑定手机号
  MODIFY_PHONE: 3, //修改手机号
}
const MODAL_TYPE_NAMES = ['绑定邮箱', '修改绑定邮箱', '绑定手机号', '修改绑定手机号']

const Item = Form.Item
class BoundEmailModal extends React.Component {
  state = {
    resetCoolDown: 0,
    pwdStatus: '',
    pwdHelp: '',
  }

  propTypes: {
    type: PropTypes.string.isRequired,
  }

  componentWillUnmount() {
    clearInterval(this._Timer)
  }

  handleCancel = () => {
    this.props.callback()
  }

  onSendVerifyCode = (isMobile) => {
    let token = this.props.form.getFieldValue('email')
    if (isMobile) {
      token = this.props.form.getFieldValue('mobile')
    }
    const field = isMobile ? ['mobile'] : ['email']
    this.props.form.validateFields(field, (errors) => {
      if (errors) {
        return
      }

      if (this.state.resetCoolDown) {
        Message.error(`请${this.state.resetCoolDown}秒后再尝试绑定。`)
        return
      }

      this.setState({ isSending: true })

      this.props.getChangeToken(token).then((json) => {
        if (json.code === 0) {
          notification['success']({
            message: '验证码发送成功',
          })

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
        } else {
          notification['error']({
            message: '验证码发送失败',
            description: json.data,
          })
        }
        this.setState({
          isSending: false
        })
      })
    })

  }

  handleSubmit = (isMobile) => {
    const {
      type,
     } = this.props
     const { pwdStatus } = this.state
    const fields = isMobile ? ['mobile', 'password', 'verifyCode'] : ['email', 'password', 'verifyCode']
    this.props.form.validateFields(fields, (errors, values) => {
      if (errors) {
        return
      }
      if (pwdStatus != 'success') {
        notification['error']({
          message: '密码错误',
          description: '请输入密码以完成验证'
        })
        return
      }
      this.setState({ isSubmitting: true })
      this.props.changeMobileOrEmail(isMobile, isMobile ? values.mobile : values.email, values.verifyCode).then((res) => {
        if (res.code === 0) {
          notification['success']({
            message: '绑定成功'
          })
          clearInterval(this._Timer)
          this.setState({
            resetCoolDown: false,
            isSubmitting: false,
          })
          this.handleCancel()
        } else {
          notification['error']({
            message: '绑定失败',
            description: res.data,
          })
          this.setState({
            isSubmitting: false
          })
        }

      })

    })
  }

  onForgetPassword = () => {
    this.props.onShowResetPasswordModal()
  }

  getVerifyCodeDecorator() {
    return this.props.form.getFieldDecorator('verifyCode', {
      rules: [{
        required: true,
        min: 6,
        max: 6,
        message: '请输入6位验证码'
      }]
    })
  }


  checkPassword = (e) => {
    const password = e.target.value
    this.props.checkPwd(password).then(res => {
      if (res.code === 0) {
        this.setState({
          pwdStatus: 'success',
          pwdHelp: `验证成功，请绑定您的${MODAL_TYPE_NAMES[this.props.type]}`
        })
      } else {
        this.setState({
          pwdStatus: 'error',
          pwdHelp: `密码错误，请输入登陆密码以完成验证`
        })
      }
    })
  }

  render() {
    const {
      form: {
        getFieldDecorator,
      },
      type,
      checkPwd,
    } = this.props
    const { resetCoolDown, pwdStatus, pwdHelp } = this.state
    const passwordDecorator = getFieldDecorator('password', {
      rules: [
        { required: true, whitespace: true, message: '请输入原密码' },
        // { validator: this.checkPassword }
      ],
      onChange: this.checkPassword,
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

    const isMobile = type == MODAL_TYPE.MODIFY_PHONE || type == MODAL_TYPE.BOUND_PHONE

    return (
      <div>
        {/* {(this.props.type == MODAL_TYPE.BOUND_EMAIL || this.props.type == MODAL_TYPE.MODIFY_EMAIL) ? (
          this.renderBoundEmail()
        ) : (
          this.renderBoundPhone()
        )} */}
        <Modal
          title={MODAL_TYPE_NAMES[type]}
          visible
          wrapClassName={styles.boundEmailModal}
          width={500}
          onCancel={this.handleCancel}
          maskClosable={false}
          footer={null}
        >
          <div className={styles.container}>
            <div className={styles.content}>
              <span className={styles.title}>请输入SuperID登录密码以验证身份</span>
              <Form layout="horizontal">
                <Item className={styles.row}
                  validateStatus={pwdStatus}
                  help={pwdHelp}
                  hasFeedback
                >
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
                  <span className={styles.label}>{isMobile ? '手机号:' : '电子邮箱:'}</span>
                  {isMobile ?
                    mobileDecorator(<Input style={{ width: 300}} />)
                    :
                    emailDecorator(<Input style={{ width: 300}} />)
                  }
                </Item>
                <Item className={styles.row}>
                  <span className={styles.label}>验证码:</span>
                  {this.getVerifyCodeDecorator()(<Input style={{ width: 175 }} placeholder="请输入验证码"/>)}
                  {resetCoolDown === 0 ?
                    <Button type="primary" onClick={() => this.onSendVerifyCode(isMobile)}>发送验证码</Button>
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
                <Button type="primary" onClick={() => this.handleSubmit(isMobile)}>确定</Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    )
  }
}

function mapDispatchToProps(dispatch) {
  return {
    changeMobileOrEmail: bindActionCreators(changeMobileOrEmail, dispatch),
    getChangeToken: bindActionCreators(getChangeToken, dispatch),
    checkPwd: bindActionCreators(checkPwd, dispatch),
  }
}


export default connect(() => ({}), mapDispatchToProps)(Form.create()(BoundEmailModal))
