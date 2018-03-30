import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { Dropdown, Menu } from 'antd'
import { ArrowDropDown } from 'svg'
import styles from './UserProfileContainer.scss'
import { logout } from '../../actions/user'

class UserProfileContainer extends React.Component {
  handleLogout = () => {
    this.props.logout().then(() => {
			if (this.props.cbAfterLogout) {
				this.props.cbAfterLogout()
			} else {
				this.props.history.push('/login')
			}
		})
  }

  handleProfile = () => {
		this.props.onProfile()
	}

  render() {
		const menu = (
			<Menu className={styles.extra}>
				<Menu.Item key="0">
					<div onClick={this.handleLogout}>退出登录</div>
				</Menu.Item>
				<Menu.Item key="1">
					<div onClick={this.handleProfile}>个人中心</div>
				</Menu.Item>
			</Menu>
		)

		return (
			<Dropdown overlay={menu} trigger={['click']}>
				<div className={styles.profile}>
					<div className={styles.avatar} style={{ backgroundImage: `url(${this.props.user.get('avatar')})` }} />
					<span className={styles.name}>{this.props.user.get('realName')}</span>
					<span className="ant-dropdown-link"><ArrowDropDown /></span>
				</div>
			</Dropdown>
		)
	}
}

function mapStateToProps(state) {
	return {
		user: state.get('user')
	}
}

function mapDispatchToProps(dispatch) {
	return {
		logout: bindActionCreators(logout, dispatch),
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(UserProfileContainer))
