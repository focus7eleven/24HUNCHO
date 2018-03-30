import React from 'react'
import { connect } from 'react-redux'
import { fromJS } from 'immutable'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { Switch, message } from 'antd'
import styles from './PrivacySetting.scss'
import { updateUser } from '../../actions/user'

class PrivacySetting extends React.Component {
  state = {
    showName: this.props.user.getIn(['personInfoPublic','realname']),
    showPhone: this.props.user.getIn(['personInfoPublic','mobile']),
  }

  // componentWillMount(){
  //   console.log('reload')
  //   this.setState({
  //     showName: this.props.user.getIn(['personInfoPublic','realname']),
  //     showPhone: this.props.user.getIn(['personInfoPublic','mobile']),
  //   })
  // }

  handleNameChange = () => {
    this.setState({
        showName: !this.state.showName
    }, this.handleUpdatePrivacyPublic)
  }

  handlePhoneChange = () => {
      this.setState({
          showPhone: !this.state.showPhone
      }, this.handleUpdatePrivacyPublic)
  }

  handleUpdatePrivacyPublic = () => {
      const { showName, showPhone } = this.state;
      return this.props.updateUser({
          personInfoPublic: fromJS({
              realname: showName,
              mobile: showPhone,
              birthday: false,
              email: false,
          })
      }, this.props.user.getIn(['auth','X-SIMU-UserId'])).then((res) => res.response).then((json) => {
          if(json.code == 0){
              message.success('修改已保存', 0.5)
          }

      })
  }

  render() {
    const { showName, showPhone } = this.state
    const { user } = this.props
    const privacyPublic = user.get('personInfoPublic')
      return (
          <div className={styles.container}>
              <div className={styles.title}>需要公开的信息：</div>
              <div className={styles.switchGroup}>
                  <div className={styles.row}>
                      <div className={styles.label}>真实姓名: </div>
                      <div className={styles.content}> { user.get('realName') ? user.get('realName') : '未设置' }</div>
                      <Switch style={styles.switch} checkedChildren="公开" unCheckedChildren="隐藏" defaultChecked={privacyPublic.get('realname')} onChange={this.handleNameChange}/>
                  </div>
                  <div className={styles.row}>
                      <div className={styles.label}>手机号码:</div>
                      <div className={styles.content}> { user.get('mobile') ? user.get('mobile') : '未设置' } </div>
                      <Switch style={styles.switch} checkedChildren="公开" unCheckedChildren="隐藏" defaultChecked={privacyPublic.get('mobile')} onChange={this.handlePhoneChange}/>
                  </div>
              </div>
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
		// fetchUser: bindActionCreators(fetchUser, dispatch),
		updateUser: bindActionCreators(updateUser, dispatch),
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PrivacySetting))
