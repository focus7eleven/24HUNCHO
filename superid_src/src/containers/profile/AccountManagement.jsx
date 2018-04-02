import React from 'react'
import { Input, Form, Row, Col, notification, Button } from 'antd'
import styles from './AccountManagement.scss'
import { fetchUser, updateUser } from '../../actions/user'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import config from '../../config'
import ChangeAccount from './ChangeAccount'

const CHANGE_PHONE = 'phone'
const CHANGE_MAIL = 'mail'

const FormItem = Form.Item

function noop() {
  return false
}
/* 已舍弃 */
const Passcode = React.createClass({
  getInitialState() {
    return {
      // 重新设置密码
      isChangingPwd: false,
      passBarShow: false,
      passStrength: 'L',
      rePassBarShow: false,
      rePassStrength: 'L',

      // 用户通过Modal来进行手机号或者邮箱账户的修改。
      changeAccountType: false,
    }
  },
  componentDidMount() {
    this.props.fetchUser()
  },

  getPassStrength(value, type) {
    if (value) {
      let strength
      // 密码强度的校验规则自定义，这里只是做个简单的示例
      if (value.length < 6) {
        strength = 'L'
      } else if (value.length <= 9) {
        strength = 'M'
      } else {
        strength = 'H'
      }
      if (type === 'pass') {
        this.setState({
          passBarShow: true,
          passStrength: strength
        })
      } else {
        this.setState({
          rePassBarShow: true,
          rePassStrength: strength
        })
      }
    } else {
      if (type === 'pass') {
        this.setState({
          passBarShow: false
        })
      } else {
        this.setState({
          rePassBarShow: false
        })
      }
    }
  },
  checkPass2(rule, value, callback) {
    const {
      getFieldValue
    } = this.props.form

    this.getPassStrength(value, 'rePass')
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
        this.setState({ isChangingPwd: true, })
        const oldPwd = this.props.form.getFieldValue('originPasswd')
        const newPwd = this.props.form.getFieldValue('rePasswd')

        return new Promise(() => {
          return fetch(config.api.user.password.update(oldPwd, newPwd), {
            method: 'POST',
            credentials: 'include',
          }).then((res) => {
            return res.json()
          }).then((json) => {
            this.setState({ isChangingPwd: false, })

            if (json.code == -1){
              notification.error({
                message: '密码修改失败！',
                description: '原密码不正确。',
              })
            } else {
              notification.success({
                message: '密码修改成功！',
                description: '请牢记您的密码，切勿泄露给他人。',
              })
            }
            this.props.form.resetFields()
          })
        })
      }
    })
  },

  getNameFieldDecorator() {
    let that = this
    return this.props.form.getFieldDecorator('passwd', {
      onChange(e){
        that.getPassStrength(e.target.value, 'pass')
      },
      validate: [{
        rules: [{
          required: true,
          message: '请输入新密码',
        }],
        trigger: ['onBlur', 'onChange'],
      }, {
        rules: [{
          required: true,
          pattern: /^((?=.*[a-zA-Z])(?=.*[0-9])|(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])).{6,32}$/,
          message: '必须包含由字母、数字、特殊符号中的至少两种',
        }],
        trigger: ['onBlur', 'onChange'],
      }, {
        rules: [{
          max: 32,
          message: '密码长度不能超过32位',
        }],
        trigger: ['onBlur', 'onChange'],
      }, {
        rules: [{
          min: 6,
          message: '密码长度不能少于6位',
        }],
        trigger: ['onBlur', 'onChange'],
      }],
    })
  },

  renderChangeAccountModal(){
    const information = {
      phoneAccount: this.props.userInfo.get('phoneAccount'),
      mailAccount: this.props.userInfo.get('mailAccount'),
      type: this.state.changeAccountType,
    }

    return (
      <ChangeAccount
        information={information}
        shutDownModal={() => {
          this.props.fetchUser()
          this.setState({ changeAccountType: false })
        }}
      />
    )
  },

  renderPassStrengthBar(type) {
    const strength = type === 'pass' ? this.state.passStrength : this.state.rePassStrength
    const level = {
      L: '低',
      M: '中',
      H: '高',
    }

    return (
      <div>
        <ul className={styles.antPwdStrength + ' ' + ((strength === 'H') ? styles.antPwdStrengthHigh : ((strength === 'M') ? styles.antPwdStrengthMedium : styles.antPwdStrengthLow))}>
          <li className={styles.antPwdStrengthItem + ' ' + styles.antPwdStrengthItem1} />
          <li className={styles.antPwdStrengthItem + ' ' + styles.antPwdStrengthItem2} />
          <li className={styles.antPwdStrengthItem + ' ' + styles.antPwdStrengthItem3} />
          <span>
            {level[strength]}
          </span>
        </ul>
      </div>
    )
  },

  render() {
    const {
      userInfo,
      form: {
        getFieldDecorator,
      },
    } = this.props

    const labelColLayout = {
      offset: 1,
      span: 3,
    }
    const formItemLayout = {
      labelCol: { span: 4, offset: 1 },
      wrapperCol: { span: 8 },
    }
    const originPasswdDecorator = getFieldDecorator('originPasswd', {
      rules: [
        { required: true, whitespace: true, message: '请输入原密码' },
      ],
    })
    const rePasswdDecorator = getFieldDecorator('rePasswd', {
      rules: [
        { required: true, whitespace: true, message: '请再次输入密码', },
        { validator: this.checkPass2 },
      ],
    })

    return (
      <div className={styles.container}>
        {/* 登录账号信息 */}
        <div className={styles.topPanel}>
          <Row type="flex" justify="start" >
            <Col {...labelColLayout}>
              <label className={styles.passcodeLabel}>登录账号:</label>
            </Col>
            <Col>
              <label className={styles.passcodeLabel}>{userInfo.get('phoneAccount')}</label>
            </Col>
          </Row>
        </div>

        {/* 绑定账号信息 */}
        <div className={styles.middlePanel}>
          <Row type="flex" justify="start">
            <Col>
              <label className={styles.passcodeTitle}>绑定账户</label>
            </Col>
          </Row>
          <Row type="flex" justify="start" className={styles.rowLayout}>
            <Col {...labelColLayout}>
              <label className={styles.passcodeLabel}>手机账户:</label>
            </Col>
            <Col span={8}>
              <label className={styles.passcodeLabel}>{userInfo.get('phoneAccount')}</label>
            </Col>
            <Col offset={1}>
              <Button height={32} width={120} onClick={() => {this.setState({ changeAccountType: CHANGE_PHONE })}}>修改手机账户</Button>
            </Col>
          </Row>
          <Row type="flex" justify="start" >
            <Col {...labelColLayout}>
              <label className={styles.passcodeLabel}>邮箱账户:</label>
            </Col>
            <Col span={8}>
              <label className={styles.passcodeLabel}>{userInfo.get('mailAccount')}</label>
            </Col>
            <Col offset={1}>
              <Button height={32} width={120} onClick={() => {this.setState({ changeAccountType: CHANGE_MAIL })}}>修改邮箱账户</Button>
            </Col>
          </Row>
        </div>

        {/* 修改密码 */}
        <div className={styles.bottomPanel}>
          <Row type="flex" justify="space-between">
            <Col>
              <label className={styles.passcodeTitle}>修改密码</label>
            </Col>
            <Col>
              <Button height={40} width={80} loading={this.state.isChangingPwd} onClick={this.handleSubmit}>保存</Button>
            </Col>
          </Row>

          <Form layout="horizontal">
            <FormItem
              labelCol={{ span: 3, offset: 1 }}
              wrapperCol={{ span: 8 }}
              label="原密码"
            >
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


            <Row>
              <Col span="13">
                <FormItem
                  {...formItemLayout}
                  label="新密码"
                  hasFeedback
                >
                  {this.getNameFieldDecorator()(
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
              </Col>
              <Col span="11">
                {this.state.passBarShow ? this.renderPassStrengthBar('pass') : null}
              </Col>
            </Row>


            <Row>
              <Col span="13">
                <FormItem
                  {...formItemLayout}
                  label="确认新密码"
                  hasFeedback
                >
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
              </Col>
              <Col span="11">
                {this.state.rePassBarShow ? this.renderPassStrengthBar('rePass') : null}
              </Col>
            </Row>

          </Form>
        </div>

        {/* 修改邮箱或手机的对话框 */}
        {this.state.changeAccountType ? this.renderChangeAccountModal() : null}
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

export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(Passcode))
