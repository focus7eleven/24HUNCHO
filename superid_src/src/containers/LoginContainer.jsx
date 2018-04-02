import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { login, refreshCaptcha, loginByPhone, loginByQR } from '../actions/user'
import { pushURL } from 'actions/route'
import styles from './LoginContainer.scss'
import { Form, Input, Button, Select, Message } from 'antd'
import QRCode from 'qrcode.react'
import config from '../config'
import TimerMixin from 'react-timer-mixin'
import imageMenkorLogin from 'images/img_menkor_login.png'
import rules from 'rules'
import { Carousel } from 'antd'
import classNames from 'classnames'
import { Logo } from 'svg'
import messageHandler from '../utils/messageHandler'

const createForm = Form.create
const FormItem = Form.Item
const Option = Select.Option

const noop = () => {
}
const LOGIN_PANEL = 'LOGIN_PANEL'
const LOGIN_PANEL_PHONE = 'LOGIN_PANEL_PHONE'
const LOGIN_PANEL_QR = 'LOGIN_PANEL_QR'
const SIGNUP_PANEL = 'SIGNUP_PANEL'
const RESET_PANEL_0 = 'RESET_PANEL_0'
const RESET_PANEL_1 = 'RESET_PANEL_1'
const LOGIN = 'LOGIN'
const REGIST = 'REGIST'

const WAIT_SCAN = 0
const WAIT_CONFIRM = 1
const CONFIRMED = 2
const SCAN_FAILED = 3
const CODE_OVERDUE = 4

const BASE_URL = 'https://menkor.com/'

const LOGIN_PWD_FIELDS = ['id', 'password', 'captcha']
const LOGIN_PHONE_FIELDS = ['mobile', 'verify']

let LoginPanel = React.createClass({
  mixins: [TimerMixin],
  propTypes: {
    cbAfterLogin: PropTypes.func,
    enterResetPasswordCb: PropTypes.func,
    exitResetPasswordCb: PropTypes.func,
    wrapClassName: PropTypes.string,
  },
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  getDefaultProps() {
    return {
      initialPanel: LOGIN_PANEL,
      initialQRCode: 'https://menkor.com/'
    }
  },
  getInitialState() {
    //把现在的时间和本地存储的发送验证码的时间进行对比，如果在60秒以内，需要继续计时
    const current = new Date()
    const signupMailTime = Date.parse(localStorage.getItem('signupMailTime')) || 0
    const signupPhoneTime = Date.parse(localStorage.getItem('signupPhoneTime')) || 0
    const resetPasswordTime = Date.parse(localStorage.getItem('resetPasswordTime')) || 0
    const loginVerifyTime = Date.parse(localStorage.getItem('loginVerifyTime')) || 0

    const signupMailSeconds = Math.round((current - signupMailTime) / 1000)
    const signupPhoneSeconds = Math.round((current - signupPhoneTime) / 1000)
    const resetPasswordSeconds = Math.round((current - resetPasswordTime) / 1000)
    const loginVerifySeconds = Math.round((current - loginVerifyTime) / 1000)

    return {
      signupByMail: false,
      signupCoolDown: 0,
      signupMailCoolDown: signupMailSeconds < 60 ? 60 - signupMailSeconds : 0,
      signupPhoneCoolDown: signupPhoneSeconds < 60 ? 60 - signupPhoneSeconds : 0,
      resetCoolDown: resetPasswordSeconds < 60 ? 60 - resetPasswordSeconds : 0,
      loginVerifyCoolDown: loginVerifySeconds < 60 ? 60 - loginVerifySeconds : 0,
      currentPanel: this.props.initialPanel,
      currendQRCode: this.props.initialQRCode,
      isQRValid: false,
      qrState: WAIT_SCAN, //0--二维码有效（等待扫描），1--已扫描未确认，2--已确认，3--扫描失败，4--二维码过期，
      qrCreateTime: 0,
      phoneAreaCode: '+86',
      currentResetAccount: null, // 正在进行密码找回的账号
      isSending: false, // 发送验证码的等待状态
      operationType: LOGIN,
      hideOtherOperation: true,
      captchaStatus: '',
      captchaHelp: '',
    }
  },
  getFormStyle() {
    const isGoldTheme = this.props.isGoldTheme
    const isResetPanel = this.state.currentPanel === RESET_PANEL_0 || this.state.currentPanel === RESET_PANEL_1
    const backgroundColor = isGoldTheme && isResetPanel ? 'rgba(255, 255, 255, 0.9)' : undefined

    switch (this.state.currentPanel) {
      case LOGIN_PANEL :
        return {
          height: this.props.needCaptcha ? 507 : 455,
          marginTop: 40,
          backgroundColor,
        }
      case LOGIN_PANEL_PHONE :
        return {
          height: 455,
          marginTop: 40,
          backgroundColor,
        }
      case LOGIN_PANEL_QR:
        return {
          height: 455,
          marginTop: 40,
          backgroundColor,
        }
      case SIGNUP_PANEL:
        return {
          height: 540,
          marginTop: 20,
          backgroundColor,
        }
      case RESET_PANEL_0:
        return {
          height: 380,
          width: 420,
          backgroundColor,
        }
      case RESET_PANEL_1:
        return {
          height: 520,
          width: 420,
          backgroundColor,
        }
      default:
        return {}
    }
  },
  componentWillMount() {
    if (this.props.auth && !this.props.disableRoute) {
      this.props.pushURL('/workspace')
    }
  },
  componentDidMount() {
    // 重启发送验证码的计时
    this._signupMailTimerId = this.setInterval(() => {
      if (this.state.signupMailCoolDown === 0) {
        this.clearInterval(this._signupMailTimerId)
      } else {
        this.setState({
          signupMailCoolDown: this.state.signupMailCoolDown - 1,
        })
      }
    }, 1000)
    this._signupPhoneTimerId = this.setInterval(() => {
      if (this.state.signupPhoneCoolDown === 0) {
        this.clearInterval(this._signupPhoneTimerId)
      } else {
        this.setState({
          signupPhoneCoolDown: this.state.signupPhoneCoolDown - 1,
        })
      }
    }, 1000)
    this._resetTimerId = this.setInterval(() => {
      if (this.state.resetCoolDown === 0) {
        this.clearInterval(this._resetTimerId)
      } else {
        this.setState({
          resetCoolDown: this.state.resetCoolDown - 1,
        })
      }
    }, 1000)
    this._loginTimerId = this.setInterval(() => {
      if (this.state.loginVerifyCoolDown === 0) {
        this.clearInterval(this._loginTimerId)
      } else {
        this.setState({
          loginVerifyCoolDown: this.state.loginVerifyCoolDown - 1,
        })
      }
    }, 1000)
  },
  componentWillReceiveProps(nextProps) {
    if (nextProps.auth && !this.props.auth) {
      this.props.cbAfterLogin && this.props.cbAfterLogin()
      if (!this.props.disableRoute) {
        this.props.pushURL('/workspace')
      }
    }
    if (nextProps.initialPanel != this.props.initialPanel) {
      this.setState({
        currentPanel: nextProps.initialPanel,
        operationType: nextProps.initialPanel == LOGIN_PANEL ? LOGIN : REGIST
      })
    }
  },
  getPasswordFieldDecorator(shouldCheckRePasswd = false) {
    return this.props.form.getFieldDecorator('passwd', {
      initialValue: '',
      rules: [{
        validator: (rule, value, callback) => {
          if (value == null || value == '') {
            callback('请输入新密码')
          } else if (value.length < 6) {
            callback('密码长度不能小于6位')
          } else if (value.length > 32) {
            callback('密码长度不能大于32位')
          } else if (
            /^((?=.*[a-zA-Z])(?=.*[0-9])|(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])).{2,32}$/
              .test(value) == false) {
            callback('必须包含字母、数字、特殊符号中的2种')
          } else {
            if (shouldCheckRePasswd) {
              const rePasswd = this.props.form.getFieldValue('rePasswd')

              if (rePasswd != null && rePasswd !== '') {
                this.props.form.validateFields(['rePasswd'], { force: true })
              }
            }
            callback()
          }
        }
      }]
    })
  },

  // Handle
  handleSendLoginVerifyCode(){

    if (this.state.loginVerifyCoolDown !== 0) {
      Message.error(`发送失败，请${this.state.loginVerifyCoolDown}秒后再尝试发送`)
      return
    }

    const that = this
    this.props.form.validateFields(['mobile'], (errors, values) => {
      if (errors){
        return
      }
      fetch(config.api.verifyCode.login(values.mobile), {
        method: 'GET',
        credentials: 'include',
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code == 0){
          Message.success('验证码发送成功')
          localStorage.setItem('loginVerifyTime', new Date())
          that.setState({
            loginVerifyCoolDown: 60,
          })

          that._loginTimerId = that.setInterval(() => {
            if (that.state.loginVerifyCoolDown === 0){
              that.clearInterval(that._loginTimerId)
            } else {
              that.setState({
                loginVerifyCoolDown: that.state.loginVerifyCoolDown - 1,
              })
            }
          }, 1000)

        }
      })
    })
  },

  handleLoginSubmit(e) {
    e.preventDefault()
    this.props.form.validateFields(LOGIN_PWD_FIELDS, (errors, values) => {
      if (errors) {
        return
      }
      this.props.login(values.id, values.password, values.captcha).then((json) => {
        if (!json.code) {
          localStorage.setItem('username', values.id)
        } else {
          const code = json.code
          if (code == 1007) {
            this.setState({
              captchaStatus: 'error',
              captchaHelp: '密码错误，请输入验证码'
            })
          } else if (this.props.needCaptcha && code == 1006){
            this.setState({
              captchaStatus: 'error',
              captchaHelp: '密码错误',
            })
          } else if (code == 1005) {
            this.setState({
              captchaStatus: 'error',
              captchaHelp: '验证码错误'
            })
          } else {
            this.setState({
              captchaStatus: '',
              captchaHelp: '',
            })
          }
        }

      })
    })
  },
  handleLoginByPhoneSubmit(e) {
    e.preventDefault()
    // const that = this
    this.props.form.validateFields(LOGIN_PHONE_FIELDS, (errors, values) => {
      if (errors) {
        return
      }
      this.props.loginByPhone(values.mobile, values.verify).then(messageHandler).then((json) => {
        if (json.code == 0){
          localStorage.setItem('username', values.mobile)
        }
      })
      // const formData = new FormData()
      // formData.append('token', (values.mobile))
      // formData.append('verifyCode', values.verify)

      // fetch(config.api.login.verify, {
      //   method: 'POST',
      //   credentials: 'include',
      //   body: formData,
      // }).then((res) => res.json()).then(messageHandler).then((json) => {
      //   if (json.code == 0){
      //     Message.success('登录成功')
      //     that.clearInterval(that._loginTimerId)
      //     // todo ? 登录成功，要跳转到登录界面
      //     localStorage.setItem('username',values.id)
      //   }
      // })
    })
  },
  handleSignupSubmit(e) {
    e.preventDefault()

    // const that = this
    const method = this.state.signupByMail ? 'mail' : 'phone'
    const SIGNUP_FIELDS = ['name', method, 'verifyCode', 'passwd', 'rePasswd']
    this.setState({ isLoginValidating: true }, () => {
      this.props.form.validateFields(SIGNUP_FIELDS, { force: true }, (errors, values) => {
        this.setState({ isLoginValidating: false })

        if (errors) {
          return
        }

        fetch(config.api.user.post, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            account: (values.phone && ('+86 ' + values.phone)) || values.mail,
            password: values.passwd,
            username: values.name,
            verifyCode: values.verifyCode,
          }),
        }).then((res) => res.json()).then(messageHandler).then((json) => {
          if (json.code === 0) {
            Message.success('账号注册成功')

            this.props.login(this.state.signupByMail ? values.mail : values.phone, values.passwd, '').then(messageHandler).then((json) => {
              if (json.code == 0){
                localStorage.setItem('username', this.state.signupByMail ? values.mail : values.phone)
              }
            })
          }
        })
      })
    })
  },

  handleCheckPass(rule, value, callback) {
    if (value == null || value == '') {
      callback('请输入新密码')
    } else if (value.length < 6) {
      callback('密码长度不能小于6位')
    } else if (value.length > 32) {
      callback('密码长度不能大于32位')
    } else if (
      /^((?=.*[a-zA-Z])(?=.*[0-9])|(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])).{2,32}$/
        .test(value) == false) {
      callback('必须包含字母、数字、特殊符号中的2种')
    } else {
      callback()
    }
  },

  handleCheckPass2(rule, value, callback) {
    const {
      getFieldValue
    } = this.props.form
    if (this.state.isLoginValidating){
      if (value !== getFieldValue('passwd')){
        callback('两次输入密码不一致！')
      }
    }
    for (var i = 0;i < value.length;i++){
      if (value[i] !== getFieldValue('passwd')[i]){
        callback('两次输入密码不一致！')
        break
      }
    }
    if (value.length >= getFieldValue('passwd').length && value !== getFieldValue('passwd')){
      callback('两次输入密码不一致！')
    }
    else {
      callback()
    }
  },

  handleTabChange() {
    const { currentPanel, operationType } = this.state
    if (currentPanel == LOGIN_PANEL || currentPanel == LOGIN_PANEL_QR || currentPanel == LOGIN_PANEL_PHONE) {
      this.setState({
        currentPanel: SIGNUP_PANEL,
      })
    } else {
      this.setState({
        currentPanel: LOGIN_PANEL
      })
    }
    if (operationType == LOGIN){
      this.setState({
        operationType: REGIST,
      })
    }
    else {
      this.setState({
        operationType: LOGIN,
      })
    }
  },
  sendResetPasswordVerifyCode(token) {
    if (token === this.state.currentResetAccount && this.state.resetCoolDown) {
      Message.error(`请${this.state.resetCoolDown}秒后再尝试重置该账号的密码。`)
      return
    }

    this.setState({ isSending: true })

    const that = this

    fetch(config.api.verifyCode.resetPassword.get(token), {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        Message.success('验证码发送成功')

        // 启动倒计时
        localStorage.setItem('resetPasswordTime', new Date())
        that.setState({
          resetCoolDown: 60,
          currentPanel: RESET_PANEL_1,
        })
        that._resetTimerId = that.setInterval(() => {
          if (that.state.resetCoolDown === 0) {
            that.clearInterval(that._resetTimerId)
          } else {
            that.setState({
              resetCoolDown: that.state.resetCoolDown - 1,
            })
          }
        }, 1000)
      }
      that.setState({ isSending: false })
    })
  },
  handleSendResetPasswordVerifyCode(e) {
    e.preventDefault()

    this.props.form.validateFields(['token'], (errors, values) => {
      if (errors) {
        return
      }

      this.setState({
        currentResetAccount: values.token,
      })
      this.sendResetPasswordVerifyCode(values.token)
    })
  },
  handleSendSignupCode() {
    const targetField = this.state.signupByMail ? 'mail' : 'phone'

    this.props.form.validateFields([targetField], (errors, values) => {
      if (errors) {
        return
      }



      const that = this
      fetch(config.api.user.regist.get(this.state.signupByMail ? values[targetField] : encodeURIComponent('+86 ') + values[targetField]), {
        method: 'GET',
        credentials: 'include',
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code == 0) {
          Message.success('验证码发送成功')

          // 启动倒计时
          if (this.state.signupByMail) {
            localStorage.setItem('signupMailTime', new Date())
            this.setState({
              signupMailCoolDown: 60,
            })
            this._signupMailTimerId = this.setInterval(() => {
              if (this.state.signupMailCoolDown === 0) {
                this.clearInterval(this._signupMailTimerId)
              } else {
                this.setState({
                  signupMailCoolDown: this.state.signupMailCoolDown - 1,
                })
              }
            }, 1000)
          } else {
            localStorage.setItem('signupPhoneTime', new Date())
            this.setState({
              signupPhoneCoolDown: 60,
            })
            this._signupPhoneTimerId = this.setInterval(() => {
              if (this.state.signupPhoneCoolDown === 0) {
                this.clearInterval(this._signupPhoneTimerId)
              } else {
                this.setState({
                  signupPhoneCoolDown: this.state.signupPhoneCoolDown - 1,
                })
              }
            }, 1000)
          }

        } else if (json.code == 18) {
          // 已经被注册
          if (that.state.signupByMail) {
            that.setState({ signupMailCoolDown: 0, })
          } else {
            that.setState({ signupPhoneCoolDown: 0, })
          }
        }
      })
    })
  },
  handleResetSubmit(e) {
    e.preventDefault()
    const that = this
    this.props.form.validateFields(['verifyCode', 'passwd', 'rePasswd'], (errors, values) => {
      if (errors) {
        return
      }
      that.setState({ isSending: true })

      const formData = new FormData()
      formData.append('account', this.state.currentResetAccount)
      formData.append('verifyCode', values.verifyCode)
      formData.append('newPwd', values.passwd)

      fetch(config.api.user.reset, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code === 0) {
          Message.success('密码重置成功')
          that.clearInterval(that._resetTimerId)
          that.props.exitResetPasswordCb && that.props.exitResetPasswordCb()
          that.setState({
            currentPanel: 'LOGIN_PANEL',
            currentResetAccount: null,
            resetCoolDown: 0,
          })
        }
        that.setState({ isSending: false })
      })
    })
  },

  //二维码登录handler
  handleCreateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = Math.random() * 16 | 0
      let v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    }).toUpperCase()
  },


  handleQRState(qrCode) {
    const that = this

    const formData = new FormData()
    formData.append('uuid', qrCode)

    this.raceFetch(fetch(config.api.qrLoginScan, {
      method: 'POST',
      credentials: 'include',
      body: formData
    }), 120000).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {

        Message.success('扫码成功')
        that.setState({
          isQRValid: true,
          qrState: WAIT_CONFIRM, //已扫描未确认
        })

        that.raceFetch(fetch(config.api.qrLoginConfirm, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }), 120000).then((res) => res.json()).then(messageHandler).then((json) => {
          if (json.code == 0) {
            Message.success('已在手机端成功确认登录')
            that.setState({
              isQRValid: true,
              qrState: CONFIRMED,
            })
            this.props.loginByQR(qrCode, json.data['access_token']).then(messageHandler).then((json) => {
              if (json.code == 0){
                localStorage.setItem('username', )
              }
            })
          } else {
            that.setState({
              isQRValid: false,
              qrState: CODE_OVERDUE,
            })
          }
        }).catch(() => {
          this.state.currentPanel == LOGIN_PANEL_QR && Message.error('超时未确认')
          that.setState({
            isQRValid: false,
            qrState: CODE_OVERDUE,
          })
        })

      } else {
        that.setState({
          isQRValid: true,
          qrState: SCAN_FAILED, //扫描失败
        })
      }
    }).catch(() => {
      this.state.currentPanel == LOGIN_PANEL_QR && Message.error('超时')
      that.setState({
        isQRValid: false,
        qrState: CODE_OVERDUE, //扫描失败
      })
    })
  },


  handleQRLogin() {
    if (!this.state.isQRValid) {

      const uuid = this.handleCreateUUID()
      this.setState({
        currentPanel: LOGIN_PANEL_QR,
        currentQRCode: uuid,
        isQRValid: true,
        qrCreateTime: new Date().getTime(),
        qrState: WAIT_SCAN,
      })
      this.handleQRState(uuid)
    } else {
      this.setState({ currentPanel: LOGIN_PANEL_QR })
    }
  },
  //长连接
  raceFetch(fetch, timeout) {
    return Promise.race([
      fetch,
      new Promise(function (resolve, reject) {
        setTimeout(() => reject(new Error('request timeout')), timeout)
      })
    ])
  },


  // Render
  renderTitle(title) {
    return (
      <div className={styles.panelTitle}>
        {title ? <p>{title}</p> : <Logo/>}
        <div className={styles.panelTitleBar}/>
      </div>
    )
  },
  renderLoginForm() {
    switch (this.state.currentPanel) {
      case LOGIN_PANEL:
        return this.renderLoginByPasswordForm()
      case LOGIN_PANEL_PHONE:
        return this.renderLoginByPhoneForm()
      case LOGIN_PANEL_QR:
        return this.renderLoginByQRForm()
      default:
        return this.renderLoginByPasswordForm()
    }
  },
  renderLoginByPasswordForm() {
    const { getFieldDecorator, getFieldValue } = this.props.form
    const { captchaStatus, captchaHelp } = this.state
    const username = localStorage.getItem('username')
    // const captchaStatus = this.props.captchaStatus

    // const captchaStatus = this.props.captchaStatus == 1 ? 'error' : null
    // const captchaHelp = this.props.captchaStatus == 1 ? '密码输入错误5次，请填写验证码' : null
    const idDecorator = (username == null || username == '') ? getFieldDecorator('id', {
      rules: [{
        required: true,
        message: '请输入用户名'
      }],
    }) : getFieldDecorator('id', {
      initialValue: username,
      rules: [{
        required: true,
        message: '请输入用户名'
      }],
    })

    const pwdDecorator = getFieldDecorator('password', {
      initialValue: '',
      rules: [{
        required: true,
        message: '请输入密码',
      }],
    })

    const captchaDecorator = this.props.needCaptcha ? getFieldDecorator('captcha', {
      rules: [{
        required: true,
        message: '请输入验证码',
      }],
    }) : (el) => el

    return (
      <div
        ref={(el) => {
          this._login_password_form = el
        }}
      >
        <Form horizontal onSubmit={this.handleLoginSubmit} className={`${styles.form} ${styles.loginForm}`}>
          <Input className="cheatedInput" />
          <Input className="cheatedInput" type="password" />
          {/* 账号 */}
          <FormItem className={styles.id}>
            {idDecorator(<Input placeholder="邮箱 / 手机号" autoComplete="off"/>)}
          </FormItem>
          <FormItem className={styles.password}>
            {pwdDecorator(<Input type="password" placeholder="密码" autoComplete="new-password"/>)}
            <div className={styles.addonAfter} onClick={() => {
              this.props.enterResetPasswordCb && this.props.enterResetPasswordCb()
              this.setState({ currentPanel: RESET_PANEL_0 })
            }}
            >忘记密码?
            </div>
          </FormItem>
          {this.props.needCaptcha &&
            <FormItem className={styles.captchaContainer} validateStatus={captchaStatus} help={captchaHelp}>
              {captchaDecorator(<Input style={{ width: 175 }} placeholder="请输入验证码"/>)}
              <img
                style={{ width: 65, height: 32, marginLeft: 10, position: 'absolute', cursor: 'pointer' }}
                src={this.props.captchaUrl}
                onClick={() => this.props.refreshCaptcha(getFieldValue('id'))}
              />
            </FormItem>
          }
          <FormItem style={{ marginTop: 40 }}>
            <Button type="primary" htmlType="submit"
              className={styles.loginBtn}
            >登录
            </Button>
          </FormItem>
          <div className={styles.tip}>
            <span
              onClick={() => {
                this.setState({ currentPanel: LOGIN_PANEL_PHONE })
              }}
            >手机验证码登录
            </span>
            <span className={styles.split} />
            <span onClick={this.handleQRLogin}>二维码登录</span>
          </div>
        </Form>
      </div>
    )
  },
  renderLoginByPhoneForm() {
    const { getFieldDecorator } = this.props.form

    const phoneDecorator = getFieldDecorator('mobile', {
      rules: [{
        required: true,
        message: '请输入手机号'
      }],
    })

    const verifyDecorator = getFieldDecorator('verify', rules.verifyCode)

    return (
      <Form horizontal onSubmit={this.handleLoginByPhoneSubmit} className={`${styles.form} ${styles.loginForm}`}>
        {/*手机号*/}
        <FormItem className={styles.phone}>
          {phoneDecorator(<Input placeholder="手机号"/>)}
          <Select value={this.state.phoneAreaCode} onSelect={(v) => this.setState({ phoneAreaCode: v })}>
            <Option value="+86">+86</Option>
          </Select>
        </FormItem>
        {/*验证码*/}
        <FormItem className={styles.verifyCode}>
          {verifyDecorator(<Input placeholder="短信验证码"/>)}
          <Button type="primary" disabled={this.state.loginVerifyCoolDown} onClick={this.handleSendLoginVerifyCode}>{this.state.loginVerifyCoolDown ? `重新发送(${this.state.loginVerifyCoolDown})` : '发送验证码'}</Button>
        </FormItem>
        <FormItem style={{ marginTop: 40 }}>
          <Button type="primary" htmlType="submit" className={styles.loginBtn}>登录</Button>
        </FormItem>

        <div className={styles.tip}>
          <span onClick={() => {
            this.setState({ currentPanel: LOGIN_PANEL })
          }}
          >账号密码登录</span>
          <span className={styles.split} />
          <span onClick={() => {
            this.setState({ currentPanel: LOGIN_PANEL_QR })
          }}
          >二维码登录</span>
        </div>
      </Form>
    )
  },

  renderQRCode(){
    const { qrState } = this.state
    switch (qrState){
      case WAIT_SCAN:
        return (<QRCode value={BASE_URL + this.state.currentQRCode} size={170}/>)
      case WAIT_CONFIRM:
        return (<span className={styles.qrCover}>已扫描未确认</span>)
      case CONFIRMED:
        return (<span className={styles.qrCover}>已确认</span>)
      case CODE_OVERDUE:
        return (<span className={styles.qrCover} onClick={this.handleQRLogin}>已过期，点击刷新</span>)
      case SCAN_FAILED:
        return (<span className={styles.qrCover}>扫描失败，请重新扫描</span>)
    }
  },

  renderLoginByQRForm() {

		// const { qrState } = this.state

    return (
      <div className={`${styles.form} ${styles.loginForm}`}>
        <div className={styles.QRCodeContainer}>
          <div className={styles.QRCode}>
            {this.renderQRCode()}
          </div>
          {/*<p>{this.state.qrState}</p>*/}
        </div>
        <div className={styles.tip}>
          <span onClick={() => {
            this.setState({ currentPanel: LOGIN_PANEL })
          }}
          >账号密码登录</span>
          <span className={styles.split} />
          <span onClick={() => {
            this.setState({ currentPanel: LOGIN_PANEL_PHONE })
          }}
          >手机验证登录</span>
        </div>
      </div>
    )
  },

  renderSignupForm() {
    const { getFieldDecorator } = this.props.form
    const nameDecorator = getFieldDecorator('name', {
      validate: rules.username,
      validateFirst: true,
    })
    const phoneDecorator = this.state.signupByMail ? {} : getFieldDecorator('phone', rules.phone(this.state.phoneAreaCode))
    const mailDecorator = this.state.signupByMail ? getFieldDecorator('mail', {
      validate: [{
        rules: [{
          pattern: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
          message: '请输入正确的邮箱',
        }, {
          required: true,
          message: '请输入邮箱',
        }],
        trigger: ['onBlur'],
      }],
    }) : {}
    const passwordDecorator = this.getPasswordFieldDecorator(true)
    const checkPasswordDecorator = getFieldDecorator('rePasswd', {
      initialValue: '',
      rules: [{
        required: true,
        whitespace: true,
        message: '请确认密码',
      }, {
        validator: this.handleCheckPass2,
      }],
    })
    const verifyCodeDecorator = getFieldDecorator('verifyCode', rules.verifyCode)

    return (
      <div ref={(el) => this._signup_form = el}>
        <Form layout="horizontal" onSubmit={this.handleSignupSubmit} className={`${styles.form} ${styles.signupForm}`}>
          {/* 姓名 */}
          <FormItem className={styles.name}>
            {nameDecorator(<Input placeholder="姓名" />)}
          </FormItem>
          {/* 手机号或邮箱 */}
          {!this.state.signupByMail ? (
            <FormItem className={styles.phone}>
              {phoneDecorator(<Input placeholder="手机号" autoComplete="username" />)}
              <Select value={this.state.phoneAreaCode} onSelect={(v) => this.setState({ phoneAreaCode: v })}>
                <Option value="+86">+86</Option>
              </Select>
            </FormItem>
          ) : (
            <FormItem className={styles.mail}>
              {mailDecorator(<Input placeholder="邮箱" autoComplete="username" />)}
            </FormItem>
          )}

          {/* 验证码 */}
          <FormItem className={styles.verificationCode}>
            <FormItem className={styles.verificationCodeInput}>
              {verifyCodeDecorator(<Input autoComplete="off" placeholder={this.state.signupByMail ? '邮箱验证码' : '短信验证码'} />)}
            </FormItem>
            {this.state.signupByMail ? (
              <FormItem className={styles.verificationCodeButton}>
                <Button type="primary" disabled={this.state.signupMailCoolDown} onClick={() => this.handleSendSignupCode()}>{this.state.signupMailCoolDown ? `重新发送(${this.state.signupMailCoolDown})` : '发送验证码'}</Button>
              </FormItem>
            ) : (
              <FormItem className={styles.verificationCodeButton}>
                <Button type="primary" disabled={this.state.signupPhoneCoolDown} onClick={() => this.handleSendSignupCode()}>{this.state.signupPhoneCoolDown ? `重新发送(${this.state.signupPhoneCoolDown})` : '发送验证码'}</Button>
              </FormItem>
            )}
          </FormItem>

          {/* 输入密码 */}
          <FormItem className={styles.password} tem style={{ marginBottom: 20 }}>
            {passwordDecorator(
              <Input
                placeholder="密码"
                type="password"
                autoComplete="password"
                onContextMenu={noop}
                onPaste={noop}
                onCopy={noop}
                onCut={noop}
              />
            )}
          </FormItem>
          {/* 再次输入密码 */}
          <FormItem className={styles.checkPassword}>
            {checkPasswordDecorator(
              <Input
                placeholder="确认密码"
                type="password"
                autoComplete="password"
                onContextMenu={noop}
                onPaste={noop}
                onCopy={noop}
                onCut={noop}
              />
          )}
          </FormItem>
          {/* 注册 */}
          <FormItem style={{ marginBottom: 17 }}><Button type="primary" className={styles.signupBtn} htmlType="submit">注册</Button></FormItem>

          <div className={styles.tip}>
            {
            this.state.signupByMail ? (
              <div style={{ cursor: 'pointer' }} onClick={() => {this.setState({ signupByMail: false })}}>
                <span>使用手机号注册</span>
              </div>
            ) : (
              <div style={{ cursor: 'pointer' }} onClick={() => {this.setState({ signupByMail: true })}}>
                <span>使用邮箱注册</span>
              </div>
            )
          }

          </div>
        </Form>
      </div>
    )
  },
  renderResetForm(){
    const { getFieldDecorator } = this.props.form

    const passwordDecorator = this.getPasswordFieldDecorator(true)
    const checkPasswordDecorator = getFieldDecorator('rePasswd', {
      initialValue: '',
      rules: [{
        required: true,
        whitespace: true,
        message: '请确认密码',
      }, {
        validator: this.handleCheckPass2,
      }],
    })

    return (
      <Form layout="horizontal" className={`${styles.form} ${styles.resetForm}`} style={{ height: '490px' }} onSubmit={this.handleResetSubmit}>
        {this.renderTitle('密码重置')}
        <FormItem style={{ marginBottom: '20px', position: 'relative' }}>
          <div className={styles.tiplabel}>验证码已发送至“{this.state.currentResetAccount}”，请及时查收</div>
          <Input disabled value={this.state.currentResetAccount}/>
          {/*<Input value={this.state.resetToken} disabled value={this.state.currentResetAccount}/>*/}
        </FormItem>
        <FormItem style={{ marginBottom: '20px', position: 'relative' }}>
          {getFieldDecorator('verifyCode', rules.verifyCode)(<Input placeholder="验证码" />)}
          <div
            className={styles.resendLabel}
            style={!this.state.resetCoolDown ? { color: '#4990E2' } : {}}
            onClick={!this.state.resetCoolDown ? () => {this.sendResetPasswordVerifyCode(this.state.currentResetAccount)} : noop}
          >{this.state.resetCoolDown ? `重新发送(${this.state.resetCoolDown})` : '发送验证码'}</div>
        </FormItem>
        <FormItem style={{ marginBottom: '40px' }}>
          {passwordDecorator(<Input placeholder="新密码" type="password" autoComplete="off" onContextMenu={noop} onPaste={noop} onCopy={noop} onCut={noop} />)}
        </FormItem>
        <FormItem style={{ marginBottom: '40px' }}>
          {checkPasswordDecorator(
            <Input
              placeholder="确认新密码"
              type="password"
              autoComplete="off"
              onContextMenu={noop}
              onPaste={noop}
              onCopy={noop}
              onCut={noop}
            />
          )}
        </FormItem>
        <FormItem style={{ marginBottom: '20px' }}>
          <Button loading={this.state.isSending} type="primary" style={{ width: '100%' }} htmlType="submit">重置密码</Button>
        </FormItem>
        <div className={styles.tip}><span onClick={() => {this.setState({ currentPanel: RESET_PANEL_0 })}}>上一步</span></div>
      </Form>
    )
  },
  renderSendVerifyCodeForm() {
    const { getFieldDecorator } = this.props.form
    const { resetCoolDown } = this.state

    return (
      <Form layout="horizontal" className={`${styles.form} ${styles.resetForm}`} onSubmit={this.handleSendResetPasswordVerifyCode}>
        {this.renderTitle('找回密码')}

        <FormItem style={{ marginBottom: '40px' }}>
          {getFieldDecorator('token', { rules: [{ required: true, message: '请输入邮箱或手机号' }] })(<Input placeholder="您的工作邮箱或手机号" />)}
        </FormItem>
        <FormItem style={{ marginBottom: '20px' }}>
          {resetCoolDown ? (
            <Button disabled type="primary" style={{ width: '100%' }} htmlType="submit">重新发送({resetCoolDown})</Button>
          ) : (
            <Button loading={this.state.isSending} type="primary" style={{ width: '100%' }} htmlType="submit">发送验证码</Button>
          )}
        </FormItem>
        <div className={styles.tip}><span onClick={() => {this.props.exitResetPasswordCb && this.props.exitResetPasswordCb(); this.setState({ currentPanel: LOGIN_PANEL })}}>返回登录</span></div>
      </Form>
    )
  },
  render() {
    const isGoldTheme = this.props.isGoldTheme
    const isResetPanel = this.state.currentPanel === RESET_PANEL_0 || this.state.currentPanel === RESET_PANEL_1
    return (
      <div className={classNames(this.props.wrapClassName, styles.formContainer, isGoldTheme ? styles.goldForm : null)} style={this.getFormStyle()}>
        {/* 金色主题下四周有四个小球 */}
        {isGoldTheme && !isResetPanel ? <div className={styles.goldBall} style={{ left: 16, top: 16 }} /> : null}
        {isGoldTheme && !isResetPanel ? <div className={styles.goldBall} style={{ right: 16, top: 16 }} /> : null}
        {isGoldTheme && !isResetPanel ? <div className={styles.goldBall} style={{ left: 16, bottom: 16 }} /> : null}
        {isGoldTheme && !isResetPanel ? <div className={styles.goldBall} style={{ right: 16, bottom: 16 }}/> : null}

        {(this.state.currentPanel !== RESET_PANEL_0 && this.state.currentPanel !== RESET_PANEL_1) && (
          <div className={styles.formWrapper}>
            {this.renderTitle()}

            <div className={styles.tabs}>
              <div
                className={styles.tab}
                data-status={this.state.operationType == LOGIN && 'active'}
                onClick={() => {
                  this.setState({ operationType: LOGIN, currentPanel: LOGIN_PANEL, hideOtherOperation: false })
                  setTimeout(() => this.setState({ hideOtherOperation: true }), 300)
                }}
              >登录</div>
              <div className={styles.dot} />
              <div
                className={styles.tab}
                data-status={this.state.operationType == REGIST && 'active'}
                onClick={() => {
                  this.setState({ operationType: REGIST, currentPanel: SIGNUP_PANEL, hideOtherOperation: false })
                  setTimeout(() => this.setState({ hideOtherOperation: true }), 300)
                }}
              >注册</div>
              <div className={styles.activeBar} style={{ left: this.state.operationType == LOGIN ? 82 : 137 }}/>
            </div>
            <div
              className={styles.opacityFormWrapper}
              data-status={this.state.operationType == LOGIN && 'active'}
              data-type="login"
              style={this.state.hideOtherOperation && this.state.operationType == REGIST && { zIndex: -10 } || {}}
            >{this.renderLoginForm()}</div>
            <div
              className={styles.opacityFormWrapper}
              data-status={this.state.operationType == REGIST && 'active'}
              data-type="regist"
              style={this.state.hideOtherOperation && this.state.operationType == LOGIN && { zIndex: -10 } || {}}
            >{this.renderSignupForm()}</div>
            <div style={{ height: this.state.operationType == LOGIN ? '238' : '351' }} />
          </div>
        )}
        {this.state.currentPanel === RESET_PANEL_0 ? this.renderSendVerifyCodeForm() : null}
        {this.state.currentPanel === RESET_PANEL_1 ? this.renderResetForm() : null}
      </div>
    )
  },
})

function mapStateToProps(state) {
  return {
    auth: state.getIn(['user', 'auth']),
    needCaptcha: state.getIn(['user', 'needCaptcha']),
    captchaUrl: state.getIn(['user', 'captchaUrl']),
    captchaStatus: state.getIn(['user', 'captchaStatus'])
  }
}

function mapDispatchToProps(dispatch) {
  return {
    login: bindActionCreators(login, dispatch),
    loginByPhone: bindActionCreators(loginByPhone, dispatch),
    loginByQR: bindActionCreators(loginByQR, dispatch),
    refreshCaptcha: bindActionCreators(refreshCaptcha, dispatch),
    pushURL: bindActionCreators(pushURL, dispatch),
  }
}

LoginPanel = connect(mapStateToProps, mapDispatchToProps)(createForm()(LoginPanel))

export { LoginPanel }

const LoginContainer = React.createClass({
  getInitialState() {
    return {
      isResetPassword: false,
    }
  },

  renderCarousel() {
    return (
      <div className={styles.carousel}>
        <Carousel>
          <div className={styles.carouselPage}>
            <img src={imageMenkorLogin} />
          </div>
          <div className={styles.carouselPage}>
            <img src={imageMenkorLogin} />
          </div>
        </Carousel>
      </div>
    )
  },
  render() {
    return (
      <div className={styles.container}>
        {/* 背景 */}
        <div className={styles.background} />

        <div className={styles.content}>
          <div className={classNames(styles.loginPanelContainer, this.state.isResetPassword ? styles.centerPanel : null)}>
            <LoginPanel
              {...this.props}
              isGoldTheme
              enterResetPasswordCb={() => this.setState({ isResetPassword: true })}
              exitResetPasswordCb={() => this.setState({ isResetPassword: false })}
            />
          </div>

          {!this.state.isResetPassword ? this.renderCarousel() : null}
        </div>
      </div>
    )
  }
})

export default LoginContainer
