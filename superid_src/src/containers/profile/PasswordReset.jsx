import React from 'react'
import { Input, Form, notification, Button } from 'antd'
import styles from './PasswordReset.scss'
import { fetchUser, updateUser } from '../../actions/user'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import config from '../../config'
import ResetPasswordModal from './ResetPasswordModal'

const FormItem = Form.Item

function noop() {
  return false
}

const PasswordReset = React.createClass({
  getInitialState() {
    return {
      // 重新设置密码
      passBarShow: false,
      passStrength: 'L',
      rePassBarShow: false,
      rePassStrength: 'L',
      showPasswordReset: false,
      shouldCheckRePasswd: false,
    }
  },
  componentDidMount() {
    this.props.fetchUser()
  },

  checkPass(rule, value, callback) {
    const {
      getFieldValue,
      validateFields
    } = this.props.form


    if (value == null || value == '') {
      callback('请输入新密码')
    } else if (value.length < 6) {
      callback('密码长度不能小于6位')
    } else if (value.length > 32) {
      callback('密码长度不能大于32位')
    } else if (/^((?=.*[a-zA-Z])(?=.*[0-9])|(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])).{2,32}$/.test(value) == false) {
      callback('必须包含字母、数字、特殊符号中的2种')
    } else {
      const rePasswd = getFieldValue('rePasswd')

      if (rePasswd != null && rePasswd !== '') {
        validateFields(['rePasswd'], { force: true })
      }

      callback()
    }
  },

  checkPass2(rule, value, callback) {
    const {
      getFieldValue
    } = this.props.form

    if (value && value !== getFieldValue('passwd')) {
      callback('两次输入密码不一致！')
    } else {
      callback()
    }
  },

  handleSubmit(e) {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll((errors) => {
      if (errors) {
        return
      } else {
        const oldPwd = this.props.form.getFieldValue('originPasswd')
        const newPwd = this.props.form.getFieldValue('rePasswd')

        return new Promise(() => {
          return fetch(config.api.user.password.update(oldPwd, newPwd), {
            method: 'POST',
            // credentials: 'include',
          }).then((res) => {
            return res.json()
          }).then((json) => {
            if (json.code == -1){
              notification.error({
                message: '密码修改失败！',
                description: '原密码不正确。',
              })
            } else if (json.code == 0){
              notification.success({
                message: '密码修改成功！',
                description: '请牢记您的密码，切勿泄露给他人。',
              })
              this.props.form.resetFields()
            }
          })
        })
      }
    })
  },
  handleForgetPassword(){
    this.setState({
      showPasswordReset: true,
    })
  },

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
            <Button type="primary" size="large" onClick={this.handleSubmit}>保存</Button>
            <span className={styles.forget} onClick={this.handleForgetPassword}>忘记密码?</span>
          </div>
        </Form>

        <ResetPasswordModal visible={this.state.showPasswordReset} user={this.props.user} callback={() => {this.setState({ showPasswordReset: false })}}/>

      </div>
    )
  },
})

function mapStateToProps(state) {
  return {
    userInfo: state.get('user'),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchUser: bindActionCreators(fetchUser, dispatch),
    updateUser: bindActionCreators(updateUser, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(PasswordReset))
