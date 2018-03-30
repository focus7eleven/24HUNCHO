import React from 'react'
import { Motion, spring } from 'react-motion'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { Carousel, Form, Input, Button, Select, Tabs, notification } from 'antd'
import TimerMixin from 'react-timer-mixin'
import imageMenkorLogin from 'images/img_menkor_login.png'
import classNames from 'classnames'
import rules from 'rules'
import createClass from 'create-react-class'
import { Logo, EduChannel, EntChannel, PubChannel, AppaChannel, TripChannel, HouChannel, FoodChannel } from 'svg'
import styles from './LoginContainer.scss'
import { getVerifyCode, signUp, login, loginByPhone, forgetPassword, refreshCaptcha } from '../actions/user'

const createForm = Form.create
const FormItem = Form.Item
const Option = Select.Option
const TabPane = Tabs.TabPane

const noop = () => {}

const LOGIN_PANEL = 'LOGIN_PANEL'
const LOGIN_PANEL_PHONE = 'LOGIN_PANEL_PHONE'
const SIGNUP_PANEL = 'SIGNUP_PANEL'
const RESET_PANEL_0 = 'RESET_PANEL_0'
const RESET_PANEL_1 = 'RESET_PANEL_1'

const LOGIN_PWD_FIELDS = ['id', 'password', 'captcha']
const LOGIN_PHONE_FIELDS = ['mobile', 'verify']

let LoginPanel = createClass({
  mixins: [TimerMixin],

  PropTypes: {
    cbAfterLogin: PropTypes.func,
    enterResetPasswordCb: PropTypes.func,
    exitResetPasswordCb: PropTypes.func,
  },

  getDefaultProps() {
    return {
      initialPanel: LOGIN_PANEL,
    }
  },

  getInitialState() {
    // 把现在的时间和本地存储的发送验证码的时间进行对比，如果在60秒以内，需要继续计时
    const current = new Date()
    const signupMailTime = Date.parse(localStorage.getItem('signupMailTime')) || 0
    const signupPhoneTime = Date.parse(localStorage.getItem('signupPhoneTime')) || 0
    const resetPasswordTime = Date.parse(localStorage.getItem('resetPasswordTime')) || 0

    const signupMailSeconds = Math.round((current - signupMailTime) / 1000)
    const signupPhoneSeconds = Math.round((current - signupPhoneTime) / 1000)
    const resetPasswordSeconds = Math.round((current - resetPasswordTime) / 1000)

    return {
      signupByMail: false,
      signupCoolDown: 0,
      signupMailCoolDown: signupMailSeconds < 60 ? 60 - signupMailSeconds : 0,
      signupPhoneCoolDown: signupPhoneSeconds < 60 ? 60 - signupPhoneSeconds : 0,
      resetCoolDown: resetPasswordSeconds < 60 ? 60 - resetPasswordSeconds : 0,
      currentPanel: this.props.initialPanel,
      loginVerifyCoolDown: 0,
      phoneAreaCode: '+86',
      captchaStatus: '',
      captchaHelp: '',
      currentResetAccount: null, // 正在进行密码找回的账号
      isSending: false, // 发送验证码的等待状态
      isSubmittingLogin: false,
    }
  },

  componentWillMount() {
    if (this.props.auth) {
      this.props.fadeAway()
      // this.props.history.push('/index')
    }
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.auth && !this.props.auth) {
      if (this.props.cbAfterLogin) {
        this.props.cbAfterLogin()
      } else {
        this.props.fadeAway()
        // this.props.history.push('/index')
      }
    }
  },

  componentDidMount() {
    // 重启发送验证码的计时
    this._signupMailTimerId = this.setInterval(() => {
      if (this.state.signupMailCoolDown === 0) {
        this.clearInterval(this._signupMailTimerId)
      } else {
        this.setState({signupMailCoolDown: this.state.signupMailCoolDown - 1})
      }
    }, 1000)

    this._signupPhoneTimerId = this.setInterval(() => {
      if (this.state.signupPhoneCoolDown === 0) {
        this.clearInterval(this._signupPhoneTimerId)
      } else {
        this.setState({signupPhoneCoolDown: this.state.signupPhoneCoolDown - 1})
      }
    }, 1000)

    this._resetTimerId = this.setInterval(() => {
      if (this.state.resetCoolDown === 0) {
        this.clearInterval(this._resetTimerId)
      } else {
        this.setState({resetCoolDown: this.state.resetCoolDown - 1})
      }
    }, 1000)

    this._loginTimerId = this.setInterval(() => {
      if (this.state.loginVerifyCoolDown === 0) {
        this.clearInterval(this._loginTimerId)
      } else {
        this.setState({loginVerifyCoolDown: this.state.loginVerifyCoolDown - 1})
      }
    })
  },

  // 定义各个面板的样式
  getFormStyle() {
		const isResetPanel = this.state.currentPanel === RESET_PANEL_0 || this.state.currentPanel === RESET_PANEL_1
		const backgroundColor = isResetPanel ? 'rgba(255, 255, 255, 0.9)' : undefined

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

  getPasswordFieldDecorator() {
    const { getFieldValue, validateFields } = this.props.form
		return this.props.form.getFieldDecorator('passwd', {
			rules: [{
				validator: (rule, value, callback) => {
					if (value == null || value == '') {
						callback('请输入新密码')
					} else if (value.length < 6) {
						callback('密码长度不能小于6位')
					} else if (value.length > 32) {
						callback('密码长度不能大于32位')
					} else if (rules.regex.password.test(value) == false) {
						callback('必须包含字母、数字、特殊符号中的2种')
					} else {
            const rePasswd = getFieldValue('rePasswd')
            if (rePasswd != null && rePasswd != '') {
              validateFields(['rePasswd'], { force: true })
            }
						callback()
					}
				}
			}]
		})
	},

  handleSendLoginVerifyCode(){
		if (this.state.loginVerifyCoolDown !== 0) {
			notification.error({
				message: '失败',
				description: `请${this.state.loginVerifyCoolDown}秒后再尝试发送`
			})
			return
		}

		this.props.form.validateFields(['mobile'], (errors, values) => {
			if (errors){
				return
			}
      this.props.getVerifyCode('login', values.mobile).then(res => {
        if (res.code ===0 ) {
          notification.success({
            message: '成功',
            description: '验证码已成功发送'
          })

          this.setState({
            loginVerifyCoolDown: 180,
          })

          this._loginTimerId = this.setInterval(() => {
            if (this.state.loginVerifyCoolDown === 0){
              this.clearInterval(this._loginTimerId)
            } else {
              this.setState({loginVerifyCoolDown: this.state.loginVerifyCoolDown - 1})
            }
          }, 1000)
        } else {
          notification.error({
            message:'失败',
            description: res.data,
          })
        }
      })
		})
	},

  handleCaptchaErrorMessage(){
    const { captchaHelp, captchaStatus } = this.state
    if ( captchaStatus == 'error') {
      notification['error']({
        message: '登陆失败',
        description: captchaHelp,
      })
    }
  },

  handleLoginSubmit(e) {
    // this.props.fadeAway()
    // return
		e.preventDefault()
		this.props.form.validateFields(LOGIN_PWD_FIELDS, (errors, values) => {
			if (errors) {
				return
			}

      this.setState({ isSubmittingLogin: true })
      const formData = new FormData()
      formData.append('account', values.id)
      formData.append('password', values.password)
      if (values.captcha) {
        formData.append('verifyCode', values.captcha)
      }
			this.props.login(values.id, values.password, values.captcha).then(json => {
        this.setState({ isSubmittingLogin: false })

        if (this.props.auth) {
          this.props.fadeAway()
          // this.props.history.push('/index')
        } else {
          const code = json.code
          if (code && code == 1007) {
            this.setState({
              captchaStatus: 'error',
              captchaHelp: '密码错误，请输入验证码'
            })
            notification['error']({
              message: '登陆失败',
              description: '密码错误，请输入验证码'
            })
          } else if (code && code == 1006){
            if (this.props.needCaptcha) {
              this.setState({
                captchaStatus: 'error',
                captchaHelp: '密码错误',
              })
            }
              notification.error({
                message: '登陆失败',
                description: '密码错误'
              })


          } else if (code && code == 1005) {
            this.setState({
              captchaStatus: 'error',
              captchaHelp: '验证码错误'
            })
            notification['error']({
              message: '登陆失败',
              description: '验证码错误'
            })
          } else {
            notification['error']({
              message: '登陆失败',
              description: json.data
            })
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
		this.props.form.validateFields(LOGIN_PHONE_FIELDS, (errors, values) => {
			if (errors) {
				return
			}
			const formData = new FormData()
			formData.append('token', (values.mobile))
			formData.append('verifyCode', values.verify)

      this.props.loginByPhone(formData).then(res => {
        if (json.code == 0){
					notification.success({
						message:'成功',
						description: '登录成功',
					})
					this.clearInterval(this._loginTimerId)
          this.props.history.push('/index')
				} else {
					notification.error({
						message: '失败',
						description: json.data,
					})
				}
      })

		})
	},

  handleSignupSubmit(e) {
    e.preventDefault()
    const method = this.state.signupByMail ? 'mail' : 'phone'
		const SIGNUP_FIELDS = ['name', method, 'verifyCode', 'passwd', 'rePasswd']
    this.props.form.validateFields(SIGNUP_FIELDS, (errors, values) => {
      if (errors) {
        return
      }
      const json = JSON.stringify({
				account: (values.phone && ('+86 ' + values.phone)) || values.mail,
				password: values.passwd,
				username: values.name,
				verifyCode: values.verifyCode,
			})

      this.props.signUp(json).then(res => {
        let index = -1
        if (res.code == 0) {
					notification.success({
						message: '成功',
						description: '账号注册成功。'
					})
					this.setState({currentPanel: LOGIN_PANEL})
				} else if ((index = [1011, 16, 18].indexOf(res.code)) > -1) {
					notification.error({
						message: '失败',
						description: ['验证码不存在或已过期。', '验证码错误', '该账号已被注册'][index]
					})
				} else {
					notification.error({
						message: '失败',
						description: '服务器出错。'
					})
				}
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
		} else if (rules.regex.password.test(value) == false) {
			callback('必须包含字母、数字、特殊符号中的2种')
		} else {
			callback()
		}
	},

  handleCheckPass2(rule, value, callback) {
		const { getFieldValue } = this.props.form
		if (value && value !== getFieldValue('passwd')) {
			callback('两次输入密码不一致！')
		} else {
			callback()
		}
	},

  handleTabChange() {
		const { currentPanel } = this.state
		if (currentPanel == LOGIN_PANEL || currentPanel == LOGIN_PANEL_PHONE) {
			this.setState({currentPanel: SIGNUP_PANEL})
		} else {
			this.setState({currentPanel: LOGIN_PANEL})
		}
	},

  sendResetPasswordVerifyCode(token) {
		if (token === this.state.currentResetAccount && this.state.resetCoolDown) {
			notification.error({
				message: '失败',
				description: `请${this.state.resetCoolDown}秒后再尝试重置该账号的密码。`,
			})
			return
		}

		this.setState({ isSending: true })

    this.props.getVerifyCode('resetPassword', token).then(res => {
      if (res.code === 0) {
        notification.success({
					message: '成功',
					description: '验证码发送成功。'
				})

				// 启动倒计时
				localStorage.setItem('resetPasswordTime', new Date())
				this.setState({
					resetCoolDown: 60,
					currentPanel: RESET_PANEL_1,
				})
				this._resetTimerId = this.setInterval(() => {
					if (this.state.resetCoolDown === 0) {
						this.clearInterval(this._resetTimerId)
					} else {
						this.setState({
							resetCoolDown: this.state.resetCoolDown - 1,
						})
					}
				}, 1000)
      } else if (res.code === 20) {
				notification.error({
					message: '失败',
					description: '该账号不存在。'
				})
			} else {
				notification.error({
					message: '失败',
					description: '验证码发送失败,请稍后发送。'
				})
			}
			this.setState({ isSending: false })
    })
	},

  handleSendResetPasswordVerifyCode(e) {
		e.preventDefault()

		this.props.form.validateFields(['token'], (errors, values) => {
			if (errors) {
				return
			}
			this.setState({currentResetAccount: values.token})
			this.sendResetPasswordVerifyCode(values.token)
		})
	},

  handleSendSignupCode() {
		const targetField = this.state.signupByMail ? 'mail' : 'phone'
		this.props.form.validateFields([targetField], (errors, values) => {
			if (errors) {
				return
			}
			// 启动倒计时
			if (this.state.signupByMail) {
				localStorage.setItem('signupMailTime', new Date())
				this.setState({signupMailCoolDown: 60})
				this._signupMailTimerId = this.setInterval(() => {
					if (this.state.signupMailCoolDown === 0) {
						this.clearInterval(this._signupMailTimerId)
					} else {
						this.setState({signupMailCoolDown: this.state.signupMailCoolDown - 1})
					}
				}, 1000)
			} else {
				localStorage.setItem('signupPhoneTime', new Date())
				this.setState({signupPhoneCoolDown: 60})
				this._signupPhoneTimerId = this.setInterval(() => {
					if (this.state.signupPhoneCoolDown === 0) {
						this.clearInterval(this._signupPhoneTimerId)
					} else {
						this.setState({signupPhoneCoolDown: this.state.signupPhoneCoolDown - 1})
					}
				}, 1000)
			}
      const token = this.state.signupByMail ? values[targetField] : encodeURIComponent('+86 ') + values[targetField]
      this.props.getVerifyCode('register', token).then(res => {
        if (res.code === 0) {
          notification.success({
						message: '成功',
						description: '验证码发送成功。'
					})
        } else if (~[1004].indexOf(res.code)) {
          notification.error({
						message: '失败',
						description: '此账号已经被注册。'
					})
					if (this.state.signupByMail) {
						this.setState({
							signupMailCoolDown: 0,
						})
					} else {
						this.setState({
							signupPhoneCoolDown: 0,
						})
					}
        } else {
					notification.error({
						message: '失败',
						description: '验证码发送失败,请重新发送。'
					})
				}
      })
		})
	},

  handleResetSubmit(e) {
		e.preventDefault()
		this.props.form.validateFields(['verifyCode', 'passwd'], (errors, values) => {
			if (errors) {
				return
			}
			this.setState({ isSending: true })

      this.props.forgetPassword(this.state.currentResetAccount, values.verifyCode, values.passwd).then(res => {
        if (res.code === 0) {
          notification.success({
						message: '成功',
						description: '密码重置成功。',
					})
					this.clearInterval(this._resetTimerId)
					this.props.exitResetPasswordCb && this.props.exitResetPasswordCb()
					this.setState({
						currentPanel: 'LOGIN_PANEL',
						currentResetAccount: null,
						resetCoolDown: 0,
					})
        } else if (res.code === 16) {
          notification.error({
						message: '失败',
						description: '验证码错误。',
					})
        } else {
          notification.error({
						message: '失败',
						description: '请求失败。',
					})
        }
				this.setState({ isSending: false })
      })
		})
	},

  // Render
	renderTitle(title) {
		return (
			<div className={styles.panelTitle}>
				<p>{title}</p>
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
		default:
			return this.renderLoginByPasswordForm()
		}
	},

  renderLoginByPasswordForm() {
		const { getFieldDecorator, getFieldValue } = this.props.form
    const { captchaStatus, captchaHelp, isSubmittingLogin } = this.state
		const username = localStorage.getItem('username')

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
				<Form onSubmit={this.handleLoginSubmit} className={`${styles.form} ${styles.loginForm}`}>

					{/* 账号 */}
					<FormItem className={styles.id}>
						{/* {idDecorator(<Input placeholder="邮箱 / 手机号" autoComplete="off"/>)} */}
						{idDecorator(<Input placeholder="手机号" autoComplete="off"/>)}
					</FormItem>
					<FormItem className={styles.password}>
						{pwdDecorator(<Input type="password" placeholder="密码"/>)}
						<div className={styles.addonAfter} onClick={() => {
							this.props.enterResetPasswordCb && this.props.enterResetPasswordCb()
							this.setState({ currentPanel:RESET_PANEL_0 })
						}}
						>忘记密码?
						</div>
					</FormItem>
					{this.props.needCaptcha &&
						<FormItem className={styles.captchaContainer} validateStatus={captchaStatus} help={captchaHelp}>
							{captchaDecorator(<Input style={{ width: 175 }} placeholder="请输入验证码" />)}
							<img
								style={{ width: 65, height:32, marginLeft:10, position:'absolute', cursor: 'pointer' }}
								src={this.props.captchaUrl}
								onClick={() => this.props.refreshCaptcha(getFieldValue('id'))}
							/>
						</FormItem>
					}
					<FormItem style={{ marginTop: 40 }}>
						<Button type="primary" htmlType="submit"
							className={styles.loginBtn}
              loading={isSubmittingLogin}
						>登录
						</Button>
					</FormItem>
					{/* <div className={styles.tip}>
						<span
							onClick={() => {
								this.setState({ currentPanel: LOGIN_PANEL_PHONE })
							}}
						>手机验证码登录
						</span>
					</div> */}
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

		const verifyDecorator = getFieldDecorator('verify', {
			rules: [{
				required: true,
				message: '请输入验证码'
			}],
		})

		return (
			<Form  onSubmit={this.handleLoginByPhoneSubmit} className={`${styles.form} ${styles.loginForm}`}>
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
					<Button type="primary" onClick={this.handleSendLoginVerifyCode}>发送验证码</Button>
				</FormItem>
				<FormItem style={{ marginTop: 40 }}>
					<Button type="primary" htmlType="submit" className={styles.loginBtn}>登录</Button>
				</FormItem>

				<div className={styles.tip}>
					<span onClick={() => {
						this.setState({ currentPanel: LOGIN_PANEL })
					}}
					>账号密码登录</span>
					{/* <span className={styles.split} /> */}
				</div>
			</Form>
		)
	},

  renderSignupForm() {
		const { getFieldDecorator } = this.props.form
		const nameDecorator = getFieldDecorator('name', {
			validate: rules.username,
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
		const passwordDecorator = this.getPasswordFieldDecorator()
		const checkPasswordDecorator = getFieldDecorator('rePasswd', {
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
						{nameDecorator(<Input placeholder="姓名"/>)}
					</FormItem>
					{/* 手机号或邮箱 */}
					{!this.state.signupByMail ? (
						<FormItem className={styles.phone}>
							{phoneDecorator(<Input placeholder="手机号"/>)}
							<Select value={this.state.phoneAreaCode} onSelect={(v) => this.setState({ phoneAreaCode: v })}>
								<Option value="+86">+86</Option>
							</Select>
						</FormItem>
          ) : (
          	<FormItem className={styles.mail}>
          		{mailDecorator(<Input placeholder="邮箱"/>)}
          	</FormItem>
          )}

					{/* 验证码 */}
					<FormItem className={styles.verificationCode}>
						<FormItem className={styles.verificationCodeInput}>
							{verifyCodeDecorator(<Input placeholder={ this.state.signupByMail ? '邮箱验证码' : '短信验证码' } />)}
						</FormItem>
						{
  						this.state.signupByMail ?
  							<FormItem className={styles.verificationCodeButton}>
  								<Button type="primary" disabled={this.state.signupMailCoolDown} onClick={() => this.handleSendSignupCode()}>{this.state.signupMailCoolDown?`重新发送(${this.state.signupMailCoolDown})`:'发送验证码'}</Button>
  							</FormItem>
  						:
  							<FormItem className={styles.verificationCodeButton}>
  								<Button type="primary" disabled={this.state.signupPhoneCoolDown} onClick={() => this.handleSendSignupCode()}>{this.state.signupPhoneCoolDown?`重新发送(${this.state.signupPhoneCoolDown})`:'发送验证码'}</Button>
  							</FormItem>
  					}
					</FormItem>

					{/* 输入密码 */}
					<FormItem className={styles.password} tem style={{ marginBottom: 20 }}>
						{passwordDecorator(<Input placeholder="密码" type="password" autoComplete="off" onContextMenu={noop} onPaste={noop} onCopy={noop} onCut={noop} />)}
					</FormItem>
					{/* 再次输入密码 */}
					<FormItem className={styles.checkPassword}>
						{checkPasswordDecorator(
							<Input
								placeholder="确认密码"
								type="password"
								autoComplete="off"
								onContextMenu={noop}
								onPaste={noop}
								onCopy={noop}
								onCut={noop}
							/>
					)}
					</FormItem>

					{/* 注册 */}
					<FormItem style={{ marginBottom:17 }}><Button type="primary" className={styles.signupBtn} htmlType="submit">注册</Button></FormItem>

					{/* <div className={styles.tip}>
						{
						this.state.signupByMail ? (
							<div style={{ cursor: 'pointer' }} onClick={() => {this.setState({ signupByMail: false })}}>
								<span>使用手机号注册</span>
							</div>
						) :(
							<div style={{ cursor: 'pointer' }} onClick={() => {this.setState({ signupByMail: true })}}>
								<span>使用邮箱注册</span>
							</div>
						)
					}

					</div> */}
				</Form>
			</div>
		)
	},

	renderResetForm(){
		const { getFieldDecorator } = this.props.form

		const passwordDecorator = this.getPasswordFieldDecorator()
		const checkPasswordDecorator = getFieldDecorator('rePasswd', {
			rules: [{
				required: true,
				whitespace: true,
				message: '请确认密码',
			}, {
				validator: this.handleCheckPass2,
			}],
		})

		return (
			<Form layout="horizontal" className={`${styles.form} ${styles.resetForm}`} style={{ height:'490px' }} onSubmit={this.handleResetSubmit}>
				{this.renderTitle('密码重置')}
				<FormItem style={{ marginBottom:'20px', position:'relative' }}>
					<div className={styles.tiplabel}>验证码已发送，请及时查收</div>
					<Input disabled value={this.state.currentResetAccount}/>
					{/*<Input value={this.state.resetToken} disabled value={this.state.currentResetAccount}/>*/}
				</FormItem>
				<FormItem style={{ marginBottom:'20px', position:'relative' }}>
					{getFieldDecorator('verifyCode', rules.verifyCode)(<Input placeholder="验证码" />)}
					<div className={styles.resendLabel} style={!this.state.resetCoolDown?{ color:'#4990E2' }:{}} onClick={!this.state.resetCoolDown?() => {this.sendResetPasswordVerifyCode(this.state.currentResetAccount)}:noop}>{this.state.resetCoolDown?`重新发送(${this.state.resetCoolDown})`:'发送验证码'}</div>
				</FormItem>
				<FormItem style={{ marginBottom:'40px' }}>
					{passwordDecorator(<Input placeholder="新密码" type="password" autoComplete="off" onContextMenu={noop} onPaste={noop} onCopy={noop} onCut={noop} />)}
				</FormItem>
				<FormItem style={{ marginBottom:'40px' }}>
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
				<FormItem style={{ marginBottom:'20px' }}>
					<Button loading={this.state.isSending} type="primary" style={{ width:'100%' }} htmlType="submit">重置密码</Button>
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

				<FormItem style={{ marginBottom:'40px' }}>
					{/* {getFieldDecorator('token', { rules:[{ required:true, message:'请输入邮箱或手机号' }] })(<Input placeholder="您的工作邮箱或手机号" />)} */}
					{getFieldDecorator('token', { rules:[{ required:true, message:'请输入手机号' }] })(<Input placeholder="您的手机号" />)}
				</FormItem>
				<FormItem style={{ marginBottom:'20px' }}>
					{resetCoolDown ?
						<Button disabled type="primary" style={{ width:'100%' }} htmlType="submit">重新发送({resetCoolDown})</Button>
					:
						<Button loading={this.state.isSending} type="primary" style={{ width:'100%' }} htmlType="submit">发送验证码</Button>
					}
				</FormItem>
				<div className={styles.tip}><span onClick={() => {this.props.exitResetPasswordCb && this.props.exitResetPasswordCb(); this.setState({ currentPanel:LOGIN_PANEL })}}>返回登录</span></div>
			</Form>
		)
	},

  render() {
    const isResetPanel = this.state.currentPanel === RESET_PANEL_0 || this.state.currentPanel === RESET_PANEL_1

		return (
			<div className={classNames(styles.formContainer, styles.goldForm)} style={this.getFormStyle()}>
				{/* 金色主题下四周有四个小球 */}
				{!isResetPanel ? <div className={styles.goldBall} style={{ left: 16, top: 16 }} /> : null}
				{!isResetPanel ? <div className={styles.goldBall} style={{ right: 16, top: 16 }} /> : null}
				{!isResetPanel ? <div className={styles.goldBall} style={{ left: 16, bottom: 16 }} /> : null}
				{!isResetPanel ? <div className={styles.goldBall} style={{ right: 16, bottom: 16 }} /> : null}

				{this.state.currentPanel !== RESET_PANEL_0 && this.state.currentPanel !== RESET_PANEL_1 ?
          (
            <div className={styles.formWrapper}>
            	{/* {this.renderTitle('教学支持系统')} */}
              <Logo />
            	<Tabs defaultActiveKey={this.state.currentPanel} activeKey={this.state.currentPanel} size="small" tabBarExtraContent={<span>·</span>}
            		onChange={this.handleTabChange} className={styles.tabContainer}
            	>
            		<TabPane tab="登录" key={LOGIN_PANEL}>
            			{this.renderLoginForm()}
            		</TabPane>
            		<TabPane tab="注册" key={SIGNUP_PANEL}>
            			{this.renderSignupForm()}
            		</TabPane>
            	</Tabs>
            </div>
          ) : null
        }
				{this.state.currentPanel === RESET_PANEL_0 ? this.renderSendVerifyCodeForm() : null}
				{this.state.currentPanel === RESET_PANEL_1 ? this.renderResetForm() : null}
			</div>
    )
  }

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
		getVerifyCode: bindActionCreators(getVerifyCode, dispatch),
		signUp: bindActionCreators(signUp, dispatch),
		login: bindActionCreators(login, dispatch),
		loginByPhone: bindActionCreators(loginByPhone, dispatch),
		forgetPassword: bindActionCreators(forgetPassword, dispatch),
		refreshCaptcha: bindActionCreators(refreshCaptcha, dispatch),
	}
}

LoginPanel = withRouter(connect(mapStateToProps, mapDispatchToProps)(createForm()(LoginPanel)))

class LoginContainer extends React.Component {
  state = {
    isResetPassword: false,
    leftPos: 0,
    opacity: 1,
    mainPanelMarginLeft: 250,
    mainPanelMarginRight: 0,
    channels: [{
      name: '教育',
      englishName: 'Education',
      icon: EduChannel
    }, {
      name: '娱乐',
      englishName: 'Entertainment',
      icon: EntChannel
    }, {
      name: '公共服务',
      englishName: 'Public Service',
      icon: PubChannel
    }, {
      name: '餐饮',
      englishName: 'Food',
      icon: FoodChannel
    }, {
      name: '服饰',
      englishName: 'Apparel',
      icon: AppaChannel
    }, {
      name: '住房',
      englishName: 'Housing',
      icon: HouChannel
    }, {
      name: '出行',
      englishName: 'Trip',
      icon: TripChannel
    }]
  }

  handleFadeLoginPanel = () => {
    this.setState({
      leftPos: -200,
      opacity: 0,
      mainPanelMarginLeft: 125,
      mainPanelMarginRight: 125,
    })
  }

  handleJump = () => {
    this.props.history.push('/index')
  }

  renderChannel(channel) {
    const ChannelIcon = channel.icon

    return (
      <span onClick={this.handleJump} className={channel.englishName === 'Education' ? styles.item : styles.itemDisable} key={channel.englishName}>
        <ChannelIcon width={60} height={60} />
        <span className={styles.chineseName}>{channel.name}</span>
        <span className={styles.englishName}>{channel.englishName}</span>
      </span>
    )

  }

  renderCarousel() {
    const { channels, mainPanelMarginLeft, mainPanelMarginRight } = this.state
    return (
      <Motion style={{ marginLeft: spring(mainPanelMarginLeft), marginRight: spring(mainPanelMarginRight) }}>
        {({ marginLeft, marginRight }) =>
          (
            <div className={styles.carousel} style={{ marginRight: marginRight, marginLeft: marginLeft }}>
              {
                mainPanelMarginLeft === 125 ?
                <div className={styles.channels}>
                  {
                    channels.map(c => this.renderChannel(c))
                  }
                </div>
                :
                <Carousel>
                  <div className={styles.carouselPage}>
                    <img src={imageMenkorLogin} />
                  </div>
                  <div className={styles.carouselPage}>
                    <img src={imageMenkorLogin} />
                  </div>
                </Carousel>
              }
            </div>

          )
        }
      </Motion>
    )
  }

  render() {
    const { leftPos, opacity } = this.state
    return (
			<div className={styles.container}>
				<div className={styles.background} />
				<div className={styles.content}>
          <Motion style={{ left: spring(leftPos), opacity: spring(opacity) }}>
    				{({ left, opacity }) =>
    					(
                <div style={{left: left, opacity: opacity}} className={classNames(styles.loginPanelContainer, this.state.isResetPassword ? styles.centerPanel : null)}>
                  {
                    !opacity ? null :
                    <LoginPanel
                      {...this.props}
                      fadeAway={this.handleFadeLoginPanel}
                      enterResetPasswordCb={() => this.setState({ isResetPassword: true })}
                      exitResetPasswordCb={() => this.setState({ isResetPassword: false })}
                    />
                  }
                </div>
    					)
    				}
    			</Motion>
					{/* <div className={classNames(styles.loginPanelContainer, this.state.isResetPassword ? styles.centerPanel : null)}>
						<LoginPanel
							{...this.props}
							enterResetPasswordCb={() => this.setState({ isResetPassword: true })}
							exitResetPasswordCb={() => this.setState({ isResetPassword: false })}
						/>
					</div> */}
					{ !this.state.isResetPassword ? this.renderCarousel() : null }
				</div>
			</div>
		)
  }
}

export default withRouter(LoginContainer)
