import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { Form, Input, Button, notification } from 'antd'
import rules from 'rules'
import styles from './PasswordReset.scss'
import ResetPasswordModal from './modal/ResetPasswordModal'

import { resetPassword } from '../../actions/user'

const FormItem = Form.Item

const noop = () => {}

class PasswordReset extends React.Component {
  state = {
    showPasswordReset: false,
    isChangingPwd: false,
  }

  checkPass = (rule, value, callback) => {
    const { getFieldValue, validateFields } = this.props.form
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
        validateFields(['rePasswd'], {force: true})
      }
			callback()
		}
	}

	checkPass2 = (rule, value, callback) => {
		const { getFieldValue } = this.props.form
		if (value && value !== getFieldValue('passwd')) {
			callback('两次输入密码不一致！')
		} else {
			callback()
		}
	}

  handleSwitchModal = (status) => {
    this.setState({showPasswordReset: status})
  }

	handleSubmit = (e) => {
  	const { user } = this.props;
  	const userId = user.getIn(['auth','X-SIMU-UserId'])
    e.preventDefault();
    const {
      form: {
        validateFieldsAndScroll,
        getFieldValue,
        resetFields,
      },
      resetPassword
    } = this.props;

    validateFieldsAndScroll((errors) => {
      if (errors) {
        return
      } else {
        this.setState({
          isChangingPwd: true
        })
        const oldPwd = getFieldValue('originPasswd')
        const newPwd = getFieldValue('rePasswd')

        return resetPassword(oldPwd, newPwd, userId).then((json) => {
          this.setState({
            isChangingPwd: false,
          })
          if (json.code === -1){
            notification.error({
               message: '密码修改失败！',
               description: '原密码不正确。'
            })
          } else if (json.code === 0) {
            notification.success({
              message: '密码修改成功！',
              description: '请牢记您的密码，切勿泄露给他人。',
            })
          }
          resetFields()
        })
      }
    })
  }

  handleForgetPassword = () => {

  }

  render() {
    const {
      form: {
        getFieldDecorator,
      },
    } = this.props

    const originPasswdDecorator = getFieldDecorator('originPasswd', {
			rules: [
				{ required: true, whitespace: true, message: '请输入原密码' },
			],
		})
		const passwdDecorator = getFieldDecorator('passwd', {
			rules: [
				{ validator: this.checkPass },
			],
		})
		const rePasswdDecorator = getFieldDecorator('rePasswd', {
			rules: [
				{ required: true, whitespace: true, message: '请再次输入新密码', },
				{ validator: this.checkPass2 },
			],
		})

    return (
      <div className={styles.container}>
				<Form layout="horizontal">
					<FormItem label="原密码">
						{originPasswdDecorator(
							<Input
								type="password"
								autoComplete="off"
								placeholder="输入原密码"
								onContextMenu={noop}
								onPaste={noop}
								onCopy={noop}
								onCut={noop}
							/>
						)}
					</FormItem>

					<FormItem label="新密码" hasFeedback>
						{passwdDecorator(
							<Input
								type="password"
								autoComplete="off"
								placeholder="输入新密码"
								onContextMenu={noop}
								onPaste={noop}
								onCopy={noop}
								onCut={noop}
							/>
						)}
					</FormItem>

					<FormItem label="确认新密码" hasFeedback>
						{rePasswdDecorator(
							<Input
								type="password"
								autoComplete="off"
								placeholder="再次输入新密码"
								onContextMenu={noop}
								onPaste={noop}
								onCopy={noop}
								onCut={noop}
							/>
						)}
					</FormItem>

					<div className={styles.btn}>
						<Button type="primary" size="large" loading={this.state.isChangingPwd} onClick={this.handleSubmit}>保存</Button>
						<span className={styles.forget} onClick={this.handleSwitchModal.bind(this, true)}>忘记密码?</span>
					</div>
				</Form>
				<ResetPasswordModal visible={this.state.showPasswordReset} user={this.props.user} callback={this.handleSwitchModal.bind(this, false)}/>
			</div>
    )
  }
}

function mapStateToProps(state) {
	return {
		user: state.get('user'),
	}
}
function mapDispatchToProps(dispatch) {
	return {
		resetPassword: bindActionCreators(resetPassword, dispatch)
	}
}

const PasswordResetForm = Form.create()(PasswordReset)

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PasswordResetForm))
