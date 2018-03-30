import React from 'react'
import createClass from 'create-react-class'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { Form, Input, Button, notification } from 'antd'
import rules from 'rules'
import { getVerifyCode, forgetPassword } from '../../../actions/user'
import { RESET_TYPE} from './ResetPasswordModal'
import styles from './ResetPasswordModal.scss'

const Item = Form.Item

class ResetPasswordForm extends React.Component{
  state = {
    resetCoolDown: 0,
  }

	onSendResetPasswordVerifyCode() {
		const { user } = this.props
		const token = (this.props.resetType == RESET_TYPE.PHONE) ? user.get('mobile') : user.get('email')
		if (this.state.resetCoolDown) {
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
				this.setState({ resetCoolDown: 60 })
				this._Timer = setInterval(() => {
					if (this.state.resetCoolDown === 0) {
						clearInterval(this._Timer)
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
	}
	onResetPassword() {
		this.props.form.validateFields((errors, values) => {
			if (errors) {
				return
			}
			this.setState({ isSubmitting: true })

      const account = this.props.resetType == RESET_TYPE.PHONE ? this.props.user.get('mobile') : this.props.user.get('email')

      this.props.forgetPassword(account, values.verifyCode, values.passwd).then(json => {
        if (json.code == 0) {
					notification.success({
						message: '成功',
						description: '密码重置成功。',
					})
					clearInterval(this._Timer)
					this.setState({ resetCoolDown: 0 })
					this.handleCancel()
				} else if (json.code == 16) {
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
				this.setState({ isSubmitting: false })
      })
		})
	}
	handleCancel(){
		this.props.handleCancel()
	}
	checkPass2 = (rule, value, callback) => {
		const {
			getFieldValue
		} = this.props.form

		if (value && value !== getFieldValue('passwd')) {
			callback('两次输入密码不一致！')
		} else {
			callback()
		}
	}
	getPasswdFieldDecorator() {
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

            if (rePasswd != '' && rePasswd != null) {
              validateFields(['rePasswd'], {force: true})
            }
						callback()
					}
				}
			}]
		})
	}
	render(){
		const { user } = this.props
		const { getFieldDecorator } = this.props.form
		const verifyCodeDecorator = getFieldDecorator('verifyCode', {
			rules: [
				{ required: true, min: 6, max: 6, message: '请输入6位验证码' },
			],
		})
		const rePasswdDecorator = getFieldDecorator('rePasswd', {
			rules: [
        { required: true, whitespace: true, message: '请再次输入密码' },
        { validator: this.checkPass2 },
			],
		})
		return (
			<div className={styles.phoneContainer}>
				<div className={styles.content}>
					<span className={styles.title}>请确认是您本人的操作并完成以下验证</span>
					<Form>
						{this.props.resetType == RESET_TYPE.PHONE ?
							<Item className={styles.row}>
								<span className={styles.label}>手机号:</span>
								<span className={styles.value}>{user.get('mobile').slice(0, 3) + '****' + user.get('mobile').slice(7, 11)}</span>
							</Item>
						:
							<Item className={styles.row}>
								<span className={styles.label}>邮箱号:</span>
								<span className={styles.value}>{user.get('email')}</span>
							</Item>
						}
						<Item className={styles.row} hasFeedback>
							<span className={styles.label}>验证码:</span>
							<div className={styles.btn}>
								{verifyCodeDecorator(<Input style={{ width: 175 }} placeholder="请输入验证码" />)}
								{this.state.resetCoolDown ?
									<Button disabled type="primary">发送验证码({this.state.resetCoolDown})</Button>
								:
									<Button type="primary" onClick={() => this.onSendResetPasswordVerifyCode()}>发送验证码</Button>
								}
							</div>
						</Item>
						<Item className={styles.row} hasFeedback>
							<span className={styles.label}>新密码:</span>
							{this.getPasswdFieldDecorator()(
								<Input style={{ width: 300 }} placeholder="至少包含字母,符号或数字中的两项且长度超过6位" type="password" autoComplete="off" />
							)}
						</Item>
						<Item className={styles.row} hasFeedback>
							<span className={styles.label}>确认新密码:</span>
							{rePasswdDecorator(
								<Input
									style={{ width: 300 }}
									placeholder="请再次输入密码"
									type="password"
									autoComplete="off"
								/>
							)}
						</Item>
					</Form>
				</div>
				<div className={styles.footer}>
					<Button type="ghost" onClick={() => this.handleCancel()}>取消</Button>
					<Button type="primary" onClick={() => this.onResetPassword()}>确定</Button>
				</div>
			</div>
		)
	}
}

function mapStateToProps(state) {
	return {}
}

function mapDispatchToProps(dispatch) {
	return {
    getVerifyCode: bindActionCreators(getVerifyCode, dispatch),
    forgetPassword: bindActionCreators(forgetPassword, dispatch),
	}
}

const WrappedResetPasswordFrom = Form.create()(ResetPasswordForm)

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(WrappedResetPasswordFrom))
