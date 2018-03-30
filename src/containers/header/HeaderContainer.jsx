import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { Map } from 'immutable'
import classNames from 'classnames'
import { Tooltip, Badge } from 'antd'
import { Logo, AddIcon, NotificationIcon, NoticeSolid, ArrowDropDown } from 'svg'
import styles from './HeaderContainer.scss'
import UserProfileContainer from './UserProfileContainer'
import { fetchUser } from '../../actions/user'
import { getMyCourse, getAllCourse } from '../../actions/course'
import ProfileContainer from '../profile/ProfileContainer'

import NoticeContainer from '../notification/notice/NoticeContainer'
import {
  updateNotificationList,
  initializeUserNotification,
} from '../../actions/notification'
import { fetchUserRoleList } from '../../actions/user'

export const AFFAIR_TYPE = {
  COURSE: 1,
  DEPARTMENT: 2,
  GROUP: 3,
}
export const AFFAIR_TYPES = ['', '课程', '学院', '小组']

class HeaderContainer extends React.Component {
  state = {
    noticeContainerShow: false,
    profileContainerShow: false,
    myNoticeContainerShow: false,
    paperHasShown: false,
    paperShow: false,
  }

  componentWillMount(){
    // this.props.fetchUser();
  }

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
  }

  //查看全部通知,跳转到消息中心,或者隐藏消息中心
	//如果paper显示，并且显示为当前容器，此时按下按钮则拉回paper，其他情况下均显示paper
	handleClickNotifications = () => {
		if (!(this.state.paperShow && this.state.noticeContainerShow)){
			// this.props.fetchAffairList()
			this.props.fetchUserRoleList().then(() => {
        this.setState({
    			noticeContainerShow: true,
          myNoticeContainerShow: false,
    			profileContainerShow: false,
    			paperHasShown: true,
    			paperShow: !(this.state.paperShow && this.state.noticeContainerShow),
    		})
      })
		} else {
      this.setState({
  			noticeContainerShow: true,
        myNoticeContainerShow: false,
  			profileContainerShow: false,
  			paperHasShown: true,
  			paperShow: !(this.state.paperShow && this.state.noticeContainerShow),
  		})
    }

	}

  handleProfile = () => {
		this.setState({
			noticeContainerShow:false,
			profileContainerShow: true,
			paperHasShown: true,
			paperShow: !(this.state.paperShow && this.state.profileContainerShow),
		})
	}

  handleClosePaper = () => {
    this.setState({ paperShow: false })
  }

  render() {
    const { noticeContainerShow, profileContainerShow, myNoticeContainerShow, paperHasShown, paperShow } = this.state

    // 判断是否存在新消息, 也就是右上角铃铛是否要有小红点
		let hasNews = false
		this.props.notification.get('news', Map()).forEach((v) => {
			if (v.get('all') != 0 ) {
				hasNews = true
				return false
			}
		})

    const paperClassNames = classNames(styles.paper, paperShow ? styles.paperIn : styles.paperOut)

    return (
      <div>
        <div className={styles.container}>
          <div className={styles.headerContainer}>
            {/* <span className={styles.logo}>教学支持系统</span> */}
            <div className={styles.logo}>
              <Logo />
              <span> - 软件学院课程中心</span>
            </div>

            <div className={styles.rightPanel}>
              {/* 个人消息通知 */}
              <span className={styles.item} onClick={this.handleClickNotifications}>
                {/* 如果有新消息需要显示小红点 */}
                {hasNews ?
                  <Badge dot={this.props.notification.size > 0} style={{ left: 18, top: 2 }}>
                    {paperShow && noticeContainerShow ? <NoticeSolid /> : <NotificationIcon /> }
                  </Badge>
                  :
                  <div>
                    {paperShow && noticeContainerShow ? <NoticeSolid /> : <NotificationIcon /> }
                  </div>
                }
              </span>

              <UserProfileContainer onProfile={this.handleProfile} />
            </div>
          </div>
        </div>
        {paperHasShown &&
					<div className={paperClassNames}>
						{ profileContainerShow && <ProfileContainer onCancel={this.handleClosePaper} /> }
						{noticeContainerShow &&
							<NoticeContainer
								show
								onCancel={() => {
									this.setState({ paperShow: false })
									this.props.getMyCourse()
                  this.props.getAllCourse()
								}}
								{...this.props}
							/>
						}
					</div>
				}
      </div>
    )
  }
}

function mapStateToProps(state) {
	return {
		user: state.get('user'),
		notification: state.get('notification'),
	}
}

function mapDispatchToProps(dispatch) {
	return {
		fetchUser: bindActionCreators(fetchUser, dispatch),
		fetchUserRoleList: bindActionCreators(fetchUserRoleList, dispatch),
		// fetchPermissionSetting: bindActionCreators(fetchPermissionSetting, dispatch),
		// logout: bindActionCreators(logout, dispatch),
		updateNotificationList: bindActionCreators(updateNotificationList, dispatch),
		// fetchAffairList: bindActionCreators(fetchAffairList, dispatch),
		initializeUserNotification: bindActionCreators(initializeUserNotification, dispatch),
		// initializeNotificationCenter: bindActionCreators(initializeNotificationCenter, dispatch),
    getMyCourse: bindActionCreators(getMyCourse, dispatch),
    getAllCourse: bindActionCreators(getAllCourse, dispatch),
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(HeaderContainer))
