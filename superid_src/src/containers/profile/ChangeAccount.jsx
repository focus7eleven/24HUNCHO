import React, { PropTypes } from 'react'
import styles from './ChangeAccount.scss'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fetchChangeAccountVerifyCode, verifyVerificationCode, changeMobileorEemail, fetchNewAccountVerifyCode } from '../../actions/auth'
import { Input, Form, Row, Col, Modal, Select, Menu, Dropdown, Icon } from 'antd'
import { NormalButton } from '../../components/button/Button'
import { InputWithLabel } from '../../components/input/Input'
import { ChangeAccountSteps } from '../../components/steps/Steps'
import { AlertIcon } from '../../components/svgrepo/TipsIcon'
import _ from 'underscore'
const FormItem = Form.Item
const createForm = Form.create
// const Step = Steps.Step
const Option = Select.Option
const tipsStyle = {
  color: '#999999',
  fontSize: '14px',
}
const EMAIL_TYPE = ['163.com', 'qq.com', 'superid.com']
const PHONE_MAP = [{ num: '+86', region: '中国' }, { num: '+852', region: '中国香港' }, { num: '+853', region: '中国澳门' }, { num: '+886', region: '中国台湾' }, { num: '+1', region: '美国/加拿大' }]
/* 已舍弃 */
const ChangeAccount = React.createClass({
  PropTypes: {
    information: PropTypes.shape({
      mailAccount: PropTypes.string,
      phoneAccount: PropTypes.string,
      type: PropTypes.string, // 判断用户的目的是进行邮箱的修改还是进行手机号码的修改。
    }),
    shutDownModal: PropTypes.func
  },
  getInitialState() {
    return {
      regionNum: '+86',
      chosenAccount: '', // 验证身份时选择的账号。
      canNext: false, // 用户是否可以进入下一步
      currentStep: 2, // 用户当前位于哪一步
      originAccountVerifyCode: '', // 验证原始账号收到的验证码
      newAccountVerifyCode: '', // 验证原始账号收到的验证码
      emailOptions: [], // 邮箱列表
    }
  },
  getNewPhoneNumbProps() {
    return this.props.form.getFieldDecorator('newAccount', {
      validate: [{
        rules: [{
          pattern: /^[0-9]+$/i,
          message: '手机号不合法',
        }],
        trigger: ['onBlur', 'onChange'],
      }],
    })
  },
  getNewEmailDecorator(){
    let that = this
    return this.props.form.getFieldDecorator('newAccount', {
      onChange(value){
        let options
        if (!value || value.indexOf('@') >= 0 ){
          options = []
        } else {
          options = EMAIL_TYPE.map(function(item){
            const email = `${value}@${item}`
            return (
              <Option key={email}>{email}</Option>
            )
          })
        }

        that.setState({
          emailOptions: options
        })
      },
      validate: [{
        rules: [
          { required: true, message: '请输入新的邮箱' },
        ],
        trigger: 'onBlur',
      }, {
        rules: [
          { type: 'email', message: '请输入正确的邮箱地址' },
        ],
        trigger: ['onBlur'],
      }],
    })
  },
  // Handle
  //邮箱号输入显示下拉列表
  handleEmailInput(value){
    let options
    if (!value || value.indexOf('@') >= 0 ){
      options = []
    } else {
      options = EMAIL_TYPE.map(function(item){
        const email = `${value}@${item}`
        return (
          <Option key={email}>{email}</Option>
        )
      })
    }
    this.setState({
      emailOptions: options
    })
  },
  //控制手机区号下拉框的隐藏与显示
  handleVisibleChange(){
    this.setState({
      phoneNumbDropdownvisible: !this.state.phoneNumbDropdownvisible
    })
  },
  handleOriginAccountVerifyCodeInputChange(evt) {
    const value = evt.target.value
    this.setState({
      originAccountVerifyCode: value,
      canNext: !!value,
    })
  },
  handleNewAccountVerifyCodeInputChange(evt) {
    const value = evt.target.value
    this.setState({
      newAccountVerifyCode: value,
      canNext: !!value,
    })
  },
  handleMenuClick({
    key
  }) {
    this.setState({
      regionNum: PHONE_MAP[{
        key
      }.key].num,
      phoneNumbDropdownvisible: false
    })
  },
  // 用户获取验证码
  handleVerifyCodeClick(value) {
    !this.props.sentVerifyCode && this.props.fetchVerifyCode(value)
  },
  handleNewAccountVerifyCodeClick(value) {
    !this.props.sentVerifyCode && this.props.fetchNewAccountVerifyCode(value)
  },
  // 用户点击下一步
  handleClickNextStepButton() {
    switch (this.state.currentStep) {
      case 0:
        // 验证原账号的身份
        this.props.verifyVerificationCode(this.state.originAccountVerifyCode, this.state.chosenAccount, () => {
          // 验证成功
          this.setState({
            canNext: false,
            currentStep: 1,
          })
        }, () => {
          // 验证失败
          this.setState({
            verificationError: true
          })
        })
        break
      case 1:
      // 修改账号
        this.props.changeMobileorEemail(this.state.newAccountVerifyCode, this.props.form.getFieldValue('newAccount'), this.props.information.type, () => {
        // 验证成功
          this.setState({
            canNext: true,
            currentStep: 2,
          })
        }, () => {
          // 验证失败
          this.setState({
            verificationError: true
          })
        })
        break
      case 2:
        this.props.shutDownModal()
        break
    }
  },
  // Render
  showTheAccout(){
    if (this.state.chosenAccount)
      return (this.state.chosenAccount.substring(0, 3) + '****' + this.state.chosenAccount.substring(7, 3))
  },
  renderModalBody() {
    const newAccountDecorator = this.props.form.getFieldDecorator('newAccount', {
      validate: [{
        rules: [
          { required: true, message: '请输入新的手机号' },
        ],
        trigger: 'onBlur',
      }, {
        rules: [
          { pattern: /^[0-9]+$/i, message: '手机号不合法' },
        ],
        trigger: ['onBlur', 'onChange'],
      }],
    })

    const step = this.state.currentStep
    const {
      information,
      sentVerifyCode,
      verifyCodeCoolDown
    } = this.props
    const type = information.type

    const sendVerifyCodeInputProps = {
      text: sentVerifyCode ? `${verifyCodeCoolDown}秒后重发` : '获取验证码',
      enableLabelClick: this.state.chosenAccount,
      onLabelClick: this.handleVerifyCodeClick.bind(this, this.state.chosenAccount),
      placeholder: '填写验证码',
      onChange: this.handleOriginAccountVerifyCodeInputChange,
    }
    const sendNewAccountVerifyCodeInputProps = {
      text: sentVerifyCode ? `${verifyCodeCoolDown}秒后重发` : '获取验证码',
      enableLabelClick: !!this.props.form.getFieldValue('newAccount'),
      onLabelClick: this.handleNewAccountVerifyCodeClick.bind(this, this.props.form.getFieldValue('newAccount')),
      placeholder: '填写验证码',
      onChange: this.handleNewAccountVerifyCodeInputChange,
    }
    if (step == 0){
      // 验证身份步骤
      return (
        <Row style={{ marginTop: '64px' }} type="flex" key={0}>
          <Col span={15} offset={5}>
            <Form layout="horizontal">
              {/* 选择验证账号 */}
              <FormItem
                id="verifySelect"
                wrapperCol={{ span: 24 }}
              >
                <div className={styles.wrapperSelect}>
                  <Select style={{ width: 342, height: 40, borderRadius: 0, lineHeight: 40 }} id="verifySelect" placeholder="选择验证方式" onChange={(value) => {this.setState({ chosenAccount: value })}}>
                    <Option value={information.phoneAccount} disabled={!information.phoneAccount} key={0}><span style={{ display: 'inline-block' }}>手机验证</span></Option>
                    <Option value={information.mailAccount} disabled={!information.mailAccount} key={1}><span style={{ display: 'inline-block' }}>邮箱验证</span></Option>
                  </Select>
                </div>
              </FormItem>
              {this.state.chosenAccount ? <div style={_.extend({ marginTop: '0px', marginBottom: '20px' }, tipsStyle)}>您当前的手机号/邮箱账号是：{this.showTheAccout()}</div> : null}
              {/* 输入收到的验证码 */}
              {
                this.state.chosenAccount ? (
                  <FormItem wrapperCol={{ span: 24 }} >
                    <InputWithLabel height={40} width={342} {...sendVerifyCodeInputProps}/>
                    {this.state.verificationError ? <div style={{ color: '#DF3D3E' }}>验证码错误</div> : null}
                  </FormItem>
                ) : null
              }
            </Form>
          </Col>
        </Row>
      )
    } else if (step == 1 && type == 'phone'){
      // 修改手机账号
      const menu = (
        <Menu style={{ borderColor: '#B8B5B2', marginLeft: '-8px', borderRadius: '0px', width: '354px', marginTop: '10px', backgroundColor: '#F9F6F5' }} onClick={this.handleMenuClick}>
          {PHONE_MAP.map(function(item, index){
            return (
              <Menu.Item key={index}><span style={{ display: 'inline-block', width: '100px' }}>{item.num}</span><span >{item.region}</span></Menu.Item>
            )
          })}
        </Menu>
      )
      const selectBefore = (
        <div className={styles.selectBeforeBorder}>
          <Dropdown overlay={menu}
            onVisibleChange = {this.handleVisibleChange}
            visible={this.state.phoneNumbDropdownvisible}
            trigger={['click']}
          >
            <div className={styles.menuStyle}><span>{this.state.regionNum}</span><span><Icon type="down" /></span></div>
          </Dropdown>
        </div>
      )
      return (
        <Row style={{ marginTop: '64px' }} type="flex" key={1}>
          <Col span={15} offset={5}>
            <Form layout="horizontal">
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}><AlertIcon /><div style={{ display: 'inline-block', marginLeft: '10px', fontSize: '14px', color: '#999999' }}>身份验证成功，请输入新的手机号码</div></div>
              {/* 输入新的手机号 */}
              <FormItem
                id="newPhoneNumber"
                wrapperCol={{ span: 24 }}
              >
                {newAccountDecorator(<Input style={{ height: 40, borderLeft: '0px', borderColor: '#B8B5B2', width: '262px' }} addonBefore={selectBefore} />)}
              </FormItem>
              {/* 新手机号码收到的验证码 */}
              <FormItem
                wrapperCol={{ span: 24 }}
              >
                <InputWithLabel height={40} width={342} text={this.state.inputLabelText} enableLabelClick={this.state.enable} {...sendNewAccountVerifyCodeInputProps}/>
                {this.state.verificationError ? <div style={{ color: '#DF3D3E', marginBottom: '-31px' }}>验证码错误</div> : null}
              </FormItem>
            </Form>
          </Col>
        </Row>
      )
    } else if (step == 1 && type == 'mail'){
      return (
        <Row style={{ marginTop: '64px' }} type="flex" key={3}>
          <Col span={15} offset={5}>
            <Form layout="horizontal">
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}><AlertIcon /><div style={{ display: 'inline-block', marginLeft: '10px', fontSize: '14px', color: '#999999' }}>身份验证成功，请输入新的邮箱</div></div>

              {/* 输入新的邮箱 */}
              <FormItem
                id="newPhoneNumber"
                wrapperCol={{ span: 24 }}
              >
                {/* <Input style={{height:40,borderLeft:'0px',borderColor:'#B8B5B2',width:'262px'}} addonBefore={selectBefore} {...newAccountProps}/> */ }
                {this.getNewEmailDecorator(
                  <Select
                    combobox
                    style={{ height: 40, borderLeft: '0px', borderColor: '#B8B5B2', width: '342px' }}
                    onChange={this.handleEmailInput}
                    filterOption={false}
                    placeholder="请输入账户名"
                  >
                    {this.state.emailOptions}
                  </Select>
                )}
              </FormItem>

              {/* 新邮箱收到的验证码 */}
              <FormItem
                wrapperCol={{ span: 24 }}
              >
                <InputWithLabel height={40} width={342} text={this.state.inputLabelText} enableLabelClick={this.state.enable} {...sendNewAccountVerifyCodeInputProps}/>
                {this.state.verificationError ? <div style={{ color: '#DF3D3E', marginBottom: '-31px' }}>验证码错误</div> : null}
              </FormItem>
            </Form>
          </Col>
        </Row>
      )
    } else if (step == 2){
      return (
        <Row style={{ marginTop: '64px' }} type="flex" key={4}>
          <Col span={18} offset={7}>
            {
            this.props.information.type == 'phone' ? (
              <div style={{ marginBottom: '50px' }}>
                <span style={{ fontSize: '28px', color: '#A75123', fontFamily: 'PingFang SC', fontWeight: 'Medium' }}>手机号已修改成功!</span><br/>
                <span style={{ fontSize: '14px', color: '#A75123', fontFamily: 'PingFang SC', fontWeight: 'Medium' }}>您可以使用新的手机号登录SuperID</span>
              </div>
            ) : (
              <div style={{ marginBottom: '50px' }}>
                <span style={{ fontSize: '28px', color: '#A75123', fontFamily: 'PingFang SC', fontWeight: 'Medium' }}>邮箱已修改成功!</span><br/>
                <span style={{ fontSize: '14px', color: '#A75123', fontFamily: 'PingFang SC', fontWeight: 'Medium' }}>您可以使用新的邮箱登录SuperID</span>
              </div>
            )
          }
          </Col>
        </Row>
      )
    }
  },
  render(){
    const {
      information,
    } = this.props

    const type = information.type

    // Modal框的名称
    let title = ''
    if (type == 'phone') {
      title = '修改手机'
    } else if (type == 'mail') {
      title = '修改邮箱'
    }

    return (
      <Modal
        title={title}
        visible
        onCancel={this.props.shutDownModal}
        wrapClassName={styles.whiteModalHead}
        style={{ width: 598 }}
        footer={[
          <Row key="row1" type="flex">
            <Col key="col1" span={6} offset={5}>
              <NormalButton key="0" height={40} width={342} style={{ marginLeft: '6px' }} disabled={!this.state.canNext} content="确定" onClick={this.handleClickNextStepButton}/>
            </Col>
          </Row>
        ]}
      >
        {/* 步骤条 */}
        <Row style={{ marginTop: '30px' }} type="flex" >
          <Col span={24}>
            <ChangeAccountSteps type={type} step={this.state.currentStep} style={{ marginBottom: '10px', padding: '0 40px 0 40px' }}/>
          </Col>
        </Row>
        {
          // 主要内容
          this.renderModalBody()
        }
      </Modal>
    )
  }
})

function mapStateToProps(state) {
  return {
    verifyCodeCoolDown: state.getIn(['auth', 'changeAccountCoolDown']), // 验证码的冷却时间
    sentVerifyCode: state.getIn(['auth', 'sentChangeAccountVerifyCode']), // 验证码是否已经被发送
  }
}
function mapDispatchToProps(dispatch) {
  return {
    fetchVerifyCode: bindActionCreators(fetchChangeAccountVerifyCode, dispatch),
    fetchNewAccountVerifyCode: bindActionCreators(fetchNewAccountVerifyCode, dispatch),
    verifyVerificationCode: bindActionCreators(verifyVerificationCode, dispatch),
    changeMobileorEemail: bindActionCreators(changeMobileorEemail, dispatch),
  }
}
export default createForm()(connect(mapStateToProps, mapDispatchToProps)(ChangeAccount))
