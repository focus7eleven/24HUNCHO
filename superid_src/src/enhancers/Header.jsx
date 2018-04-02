import React from 'react'
import styles from './Header.scss'
import { fetchUser, logout } from '../actions/user'
import { fetchPermissionSetting } from '../actions/auth'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Map } from 'immutable'
import { Tooltip, Badge, Dropdown, Menu } from 'antd'
import { Logo, AddIcon, NotificationIcon, NoticeSolid, ArrowDropDown } from 'svg'
import AllianceCreateContainer from '../containers/alliance/AllianceCreateContainer'

import NoticeContainer from '../containers/notice/NoticeContainer'
import { updateNotificationList } from '../actions/notification'
import { fetchAffairList } from '../actions/affair'
import { fetchUserRoleList } from '../actions/user'
import { initializeUserNotification } from '../actions/notification'
import { pushURL } from 'actions/route'
import ProfileContainer from '../containers/profile/ProfileContainer'
import MineContainer from '../containers/mine/MineContainer'

let UserProfile = React.createClass({
  contextTypes: {
  },

  handleLogout() {
    this.props.logout().then(() => {
      if (!this.props.disableLogout) {
        this.props.pushURL('/workspace')
      }
    })
  },

  handleProfile() {
    this.props.onProfile()
  },

  render() {
    const menu = (
      <Menu className={styles.extra}>
        <Menu.Item key="0">
          <div onClick={this.handleLogout}>退出登录</div>
        </Menu.Item>
        {!this.props.disableUserCenter &&
          <Menu.Item key="1">
            <div onClick={this.handleProfile}>个人中心</div>
          </Menu.Item>
        }
      </Menu>
    )

    return (
      <Dropdown overlay={menu} trigger={['click']}>
        <div className={styles.profile}>
          <div className={styles.avatar} style={{ backgroundImage: `url(${this.props.user.get('avatar')})` }} />
          <span className={styles.name}>{this.props.user.get('username')}</span>
          <span className="ant-dropdown-link"><ArrowDropDown /></span>
        </div>
      </Dropdown>
    )
  }
})

UserProfile = connect((state) => ({
  user: state.get('user'),
}), (dispatch) => ({
  fetchUser: bindActionCreators(fetchUser, dispatch),
  logout: bindActionCreators(logout, dispatch),
  pushURL: bindActionCreators(pushURL, dispatch),
}))(UserProfile)

export { UserProfile }

export const DefaultHeaderHOC = (Component) => {
  const DefaultHeader = React.createClass({
    contextTypes: {
      router: React.PropTypes.object
    },

    getInitialState() {
      return {
        createAllianceModalShow: false,
        noticeContainerShow: false,
        profileContainerShow: false,
        // 记录通知容器是否显示过，显示过之后即使paperShow==false仍然会显示容器，只是用平移操作移到屏幕外
        paperHasShown: false,
        paperShow: false,
      }
    },

    componentDidMount() {
      const user = this.props.user
      if (user != null && user.get('id', 0) != 0) {
        this.props.initializeUserNotification(user.get('id'))
      } else {
        this.props.fetchUser().then((data) => {
          if (data.response.id) {
            this.props.initializeUserNotification(data.response.id)
          }
        })
      }
      this.props.fetchPermissionSetting()
    },

    //显示创建盟modal
    showCreateModal() {
      this.setState({
        createAllianceModalShow: true
      })
    },

    //取消创建盟
    onCancel() {
      this.setState({
        createAllianceModalShow: false
      })
    },

    //查看全部通知,跳转到消息中心,或者隐藏消息中心
    //如果paper显示，并且显示为当前容器，此时按下按钮则拉回paper，其他情况下均显示paper
    handleClickNotifications(){
      if (!(this.state.paperShow && this.state.noticeContainerShow)){
        this.props.fetchAffairList()
        this.props.fetchUserRoleList()
      }

      this.setState({
        noticeContainerShow: true,
        profileContainerShow: false,
        mineContainerShow: false,
        paperHasShown: true,
        paperShow: !(this.state.paperShow && this.state.noticeContainerShow),
      })
    },
    handleProfile(){
      this.setState({
        noticeContainerShow: false,
        profileContainerShow: true,
        mineContainerShow: false,
        paperHasShown: true,
        paperShow: !(this.state.paperShow && this.state.profileContainerShow),
      })
    },
    handleClickMine() {
      this.setState({
        noticeContainerShow: false,
        profileContainerShow: false,
        mineContainerShow: true,
        paperHasShown: true,
        paperShow: !(this.state.paperShow && this.state.mineContainerShow),
      })
    },
    render() {
      let {
        createAllianceModalShow,
        noticeContainerShow,
        mineContainerShow,
        profileContainerShow,
        paperHasShown,
        paperShow,
      } = this.state

      const { notifications } = this.props

      // 判断是否存在新消息, 也就是右上角铃铛是否要有小红点
      let hasNews = false
      notifications.get('news', Map()).forEach((v) => {
        if (v.getIn(['receive', 'all'], 0) != 0 || v.getIn(['send', 'all'], 0) != 0) {
          hasNews = true
          return false
        }
      })

      //幕布动画效果
      let paperClassNames = paperShow ? `${styles.paper} ${styles.paperIn}` : `${styles.paper} ${styles.paperOut}`

      return (
        <div className={styles.container}>
          <div className={styles.defaultHeader}>
            <div className={styles.headerContainer}>
              {/* 商标 */}
              <Logo onClick={() => {this.props.pushURL('/workspace')}}/>

              {/* 导航与个人设置 */}
              <div className={styles.rightPanel}>
                <div className={styles.menkor} onClick={() => this.props.pushURL('/menkor')}>
                  盟客网
                </div>

                <div className={`${styles.line} ${styles.item}`} />

                {/* 创建盟 */}
                <span>
                  <Tooltip title="创建盟">
                    <AddIcon className={styles.item} onClick={this.showCreateModal} height="24px"/>
                  </Tooltip>
                </span>

                {/* 个人消息通知 */}
                <span className={styles.item} onClick={this.handleClickNotifications}>
                  {/* 如果有新消息需要显示小红点 */}
                  {hasNews ?
                    <Badge dot={this.props.notifications.size > 0} style={{ left: 18, top: 2 }}>
                      {paperShow && noticeContainerShow ? <NoticeSolid /> : <NotificationIcon /> }
                    </Badge>
                  : (
                    <div>
                      {paperShow && noticeContainerShow ? <NoticeSolid /> : <NotificationIcon /> }
                    </div>
                  )}

                </span>

                {/* 我的 */}
                <div
                  className={styles.mine}
                  onClick={this.handleClickMine}
                >
                  我的
                </div>

                {/* 当前用户操作 */}
                <UserProfile onProfile={() => {this.handleProfile()}}/>
              </div>
            </div>
          </div>
          {paperHasShown &&
            <div className={paperClassNames}>
              {noticeContainerShow &&
                <NoticeContainer
                  show
                  onCancel={() => {
                    this.setState({ paperShow: false })
                    this.props.fetchAffairList()
                    this.props.fetchUserRoleList()
                  }}
                  {...this.props}
                />
              }
              {profileContainerShow &&
                <ProfileContainer
                  show
                  onCancel={() => {
                    this.setState({ paperShow: false })
                  }}
                  {...this.props}
                />
              }
              {mineContainerShow &&
                <MineContainer
                  show
                  onCancel={() => {
                    this.setState({ paperShow: false })
                  }}
                  {...this.props}
                />
              }
            </div>
          }
          {this.props.user.get('fetched') && <Component {...this.props} />}
          <AllianceCreateContainer visible={createAllianceModalShow} cancel={this.onCancel}/>
        </div>
      )
    },
  })

  function mapStateToProps(state) {
    return {
      user: state.get('user'),
      notifications: state.get('notifications'),
    }
  }

  function mapDispatchToProps(dispatch) {
    return {
      fetchUser: bindActionCreators(fetchUser, dispatch),
      fetchUserRoleList: bindActionCreators(fetchUserRoleList, dispatch),
      fetchPermissionSetting: bindActionCreators(fetchPermissionSetting, dispatch),
      logout: bindActionCreators(logout, dispatch),
      updateNotificationList: bindActionCreators(updateNotificationList, dispatch),
      fetchAffairList: bindActionCreators(fetchAffairList, dispatch),
      initializeUserNotification: bindActionCreators(initializeUserNotification, dispatch),
      pushURL: bindActionCreators(pushURL, dispatch),
    }
  }

  return connect(mapStateToProps, mapDispatchToProps)(DefaultHeader)
}
