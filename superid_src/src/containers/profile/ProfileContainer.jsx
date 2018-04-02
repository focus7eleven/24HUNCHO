import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fetchUser, updateUser } from '../../actions/user'
import { Motion, spring } from 'react-motion'
import { Icon } from 'antd'
import BasicInformation from './BasicInformation'
import PasswordReset from './PasswordReset'
import PersonVerification from './PersonVerification'
import AccountBinding from './AccountBinding'
import PrivacySetting from './PrivacySetting'
import LoginRecord from './LoginRecord'
import ActivityInformation from './ActivityInformation'

import styles from './ProfileContainer.scss'

const SETTING_NAMES = ['基本信息', '密码重置', '身份认证', '账号绑定', '隐私设置', '登录记录', '盟与角色']

const ProfileContainer = React.createClass({
  getInitialState(){
    return {
      settingIndex: 0,
    }
  },
  handleSwitchSetting(index){
    this.setState({ settingIndex: index })
  },
  render() {
    const { settingIndex } = this.state
    const { user, fetchUser, updateUser } = this.props

    let settingContainer = null
    switch (settingIndex) {
      case 0:
        settingContainer = <BasicInformation />
        break
      case 1:
        settingContainer = <PasswordReset />
        break
      case 2:
        settingContainer = <PersonVerification />
        break
      case 3:
        settingContainer = <AccountBinding />
        break
      case 4:
        settingContainer = <PrivacySetting />
        break
      case 5:
        settingContainer = <LoginRecord />
        break
      default:
        settingContainer = <ActivityInformation />
    }
    return (
      <div className={styles.container}>
        {/* 左侧nav */}
        <div className={styles.navigation}>
          <div className={styles.title}>个人中心</div>
          <div className={styles.navBar}>
            <Motion style={{ top: spring(45 * settingIndex) }}>
              {(interpolatingStyle) => <div className={styles.selectPointer} style={{ top: interpolatingStyle.top }} />}
            </Motion>
            {
              SETTING_NAMES.map((setting, index) => {
                const style = index == settingIndex ? `${styles.navItem} ${styles.navItemSelected}` : styles.navItem
                return (
                  <div className={style} key={index} onClick={() => {this.handleSwitchSetting(index)}}>
                    {setting}
                  </div>
                )
              })
            }
          </div>
        </div>
        {/* 右侧内容框 */}
        <div className={styles.content}>
          {/* 上侧标题与按钮 */}
          <div className={styles.bar}>
            <div className={styles.title}>{SETTING_NAMES[settingIndex]}</div>
            <Icon type="close" onClick={() => {this.props.onCancel()}} className={styles.closeButton} />
          </div>
          {/* 下侧设置项容器 */}
          <div className={styles.wrapper}>
            {React.cloneElement(settingContainer, {
              user: user,
              fetchUser: fetchUser,
              updateUser: updateUser,
            })}
          </div>
        </div>
      </div>
    )
  }
})

function mapStateToProps(state) {
  return {
    user: state.get('user'),
  }
}
function mapDispatchToProps(dispatch) {
  return {
    fetchUser: bindActionCreators(fetchUser, dispatch),
    updateUser: bindActionCreators(updateUser, dispatch),
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(ProfileContainer)
