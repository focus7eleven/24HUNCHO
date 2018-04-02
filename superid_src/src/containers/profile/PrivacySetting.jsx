import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fromJS } from 'immutable'
import styles from './PrivacySetting.scss'
import { Switch, message } from 'antd'
import messageHandler from '../../utils/messageHandler'
import { updateUser } from '../../actions/user'



const PrivacySetting = React.createClass({

  getInitialState(){
    const { user } = this.props
    return {
      showName: user.getIn(['personInfoPublic', 'realname']),
      showBirthday: user.getIn(['personInfoPublic', 'birthday']),
      showEmail: user.getIn(['personInfoPublic', 'email']),
      showPhone: user.getIn(['personInfoPublic', 'mobile']),
    }
  },
  handleNameChange(){
    this.setState({
      showName: !this.state.showName
    }, this.handleUpdatePublicType)
  },

  handleBirthdayChange(){
    this.setState({
      showBirthday: !this.state.showBirthday
    }, this.handleUpdatePublicType)
  },

  handleEmailChange(){
    this.setState({
      showEmail: !this.state.showEmail
    }, this.handleUpdatePublicType)
  },

  handlePhoneChange(){
    this.setState({
      showPhone: !this.state.showPhone
    }, this.handleUpdatePublicType)
  },

  handleUpdatePublicType(){
    const { showName, showBirthday, showEmail, showPhone } = this.state
    return this.props.updateUser({
      publicType: fromJS({
        birthday: showBirthday,
        email: showEmail,
        mobile: showPhone,
        realname: showName,
      })
    })
      .then((res) => res.response)
      .then(messageHandler)
      .then((json) => {
        if (json.code == 0) {
          message.success('修改已保存', 0.5)
        }
        return json
      })
  },


  render(){
    const { showName, showBirthday, showEmail, showPhone } = this.state
    const { user } = this.props
    return (
      <div className={styles.container}>
        <div className={styles.title}>需要公开的信息：</div>
        <div className={styles.switchGroup}>
          <div className={styles.row}>
            <div className={styles.label}>真实姓名: </div>
            <div className={styles.content}> {user.get('username') ? user.get('username') : '未设置'}</div>
            <Switch style={styles.switch} checkedChildren="开" unCheckedChildren="关" defaultChecked={showName} onChange={this.handleNameChange}/>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>出生日期: </div>
            <div className={styles.content}> {user.get('birthday') ? user.get('birthday') : '未设置'} </div>
            <Switch style={styles.switch} checkedChildren="开" unCheckedChildren="关" defaultChecked={showBirthday} onChange={this.handleBirthdayChange}/>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>电子邮箱:</div>
            <div className={styles.content}> {user.get('email') ? user.get('email') : '未设置'} </div>
            <Switch style={styles.switch} checkedChildren="开" unCheckedChildren="关" defaultChecked={showEmail} onChange={this.handleEmailChange}/>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>手机号码:</div>
            <div className={styles.content}> {user.get('mobile') ? user.get('mobile') : '未设置'} </div>
            <Switch style={styles.switch} checkedChildren="开" unCheckedChildren="关" defaultChecked={showPhone} onChange={this.handlePhoneChange}/>
          </div>
        </div>
      </div>

    )
  }
})

function mapStateToProps(state){
  return {
    user: state.get('user'),
  }
}

function mapDispatchToProps(dispatch){
  return {
    updateUser: bindActionCreators(updateUser, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PrivacySetting)
