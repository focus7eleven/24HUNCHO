import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { fetchUser } from '../../actions/user'
import { Motion, spring } from 'react-motion'
import { DropUpIcon } from 'svg'
import styles from './ProfileContainer.scss'

import BasicInfo from './BasicInfo'
import AccountBinding from './AccountBinding'
import PrivacySetting from './PrivacySetting'
import PasswordReset from './PasswordReset'

const SETTING_NAMES = ['私人信息', '账号绑定', '隐私设置', '密码重置']

class ProfileContainer extends React.Component {
  state = {
    settingIndex: 0,
  }

  handleSwitchSetting = index => {
    this.setState({ settingIndex: index })
  }

  render() {
    const { settingIndex } = this.state

    let settingContainer = null
    switch (settingIndex) {
      case 0:
        settingContainer = <BasicInfo />
        break;
      case 1:
        settingContainer = <AccountBinding />
        break;
      case 2:
        settingContainer = <PrivacySetting />
        break;
      case 3:
        settingContainer = <PasswordReset />
        break;
      default:
        settingContainer = <BasicInfo />
    }

    return (
      <div className={styles.container}>
				{/* 左侧nav */}
				<div className={styles.navigation}>
					<div className={styles.title}>个人中心</div>
					<div className={styles.navBar}>
						<Motion style={{ top: spring(40*settingIndex) }}>
							{(interpolatingStyle) => <div className={styles.selectPointer} style={{ top: interpolatingStyle.top }} />}
						</Motion>
						{
							SETTING_NAMES.map((setting, index) => {
								const style = index == settingIndex ? `${styles.navItem} ${styles.navItemSelected}` : styles.navItem
								return (
									<div className={style} key={index} onClick={this.handleSwitchSetting.bind(this, index)}>
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
						<div className={styles.close}>
							<div onClick={this.props.onCancel}><DropUpIcon width="28" height="28"/></div>
						</div>
					</div>
					{/* 下侧设置项容器 */}
					<div className={styles.wrapper}>
            {settingContainer}
						{/* {React.cloneElement(settingContainer, {
							user: user,
							fetchUser: fetchUser,
							updateUser: updateUser,
						})} */}
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
		fetchUser: bindActionCreators(fetchUser, dispatch),
		// updateUser: bindActionCreators(updateUser, dispatch),
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ProfileContainer))
