import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Redirect} from 'react-router'
import { Link } from 'react-router-dom'
import { List } from 'immutable'
import PropTypes from 'prop-types'
import { Motion, spring } from 'react-motion'
import njuSoftwareInstitute from 'images/nju_software_institute.png'
import Children from '../../components/route/SubRoute'
import styles from './CourseIndexContainer.scss'
import { ContentPanelHOC } from '../../enhancers/Content'
import { getUserRole } from '../../actions/user'
import { USER_ROLE_TYPE, USER_ROLE_TYPES } from 'member-role-type'
import { AFFAIR_TYPE } from '../header/HeaderContainer'
const NAVIGATION_TAB = ['info', 'member', 'activity', 'file', 'group', 'chat']
const NAVIGATION_TAB_NAME = ['课程信息', '人员', '课程活动', '课程资料', '小组', '会话']
const GUEST_NAV_TAB = ['info', 'member']
const GUEST_NAV_TAB_NAME = ['课程信息', '人员']
const NAVIGATION_TAB_WIDTH = [67, 42, 67, 68, 42, 42]
const GUEST_NAV_TAB_WIDTH = [68, 42]
const NAVIGATION_TAB_LEFT = [-5, 67, 113, 185, 258, 302]
const GUEST_NAV_TAB_LEFT = [-6, 66]
const GROUP_NAV_TAB = ['activity', 'member', 'file', 'chat']
const GROUP_NAV_TAB_NAME = ['小组活动', '人员', '文件库', '会话']
const GROUP_NAV_TAB_WIDTH = [68, 42, 58, 42]
const GROUP_NAV_TAB_LEFT = [-5, 66, 117, 183]
const DEPARTMENT_NAV_TAB = ['info']
const DEPARTMENT_NAV_TAB_NAME = ['学院首页']
const DEPARTMENT_NAV_WIDTH = [68]
const DEPARTMENT_NAV_LEFT = [-6]
class NavigationContainer extends React.Component {
  state = {
    affairId: '',
    parentAffairId: '',
    affairType: null,
  }
  componentWillMount() {
    this.initializeAffair(this.props.location.pathname)
  }
  initializeAffair = (pathname) => {
    let { affairId, affairType, parentAffairId } = this.state
    const pathResult = pathname.split('/')
    // const regex = /^\/index\/course\/(\d*)\/group\/(\d*)\/.*$/
    // const regexResult = regex.exec(pathname)
    // console.log(pathname, regexResult)
    if (pathResult[2] === 'course') {
      // 至少匹配到了courseid
      const groupId = pathResult[5]
      const courseId = pathResult[3]
      if (groupId && pathResult[4] === 'group') {
        // 匹配到了groupid
        affairId = groupId
        affairType = AFFAIR_TYPE.GROUP
        parentAffairId = courseId
      } else {
        // 只匹配到courseid
        affairId = courseId
        affairType = AFFAIR_TYPE.COURSE
      }
    } else if (pathResult[2] === 'department'){
      // 没有匹配到符合条件的字符串
      affairType = AFFAIR_TYPE.DEPARTMENT
      affairId = pathResult[3]
    }
    if (affairId && affairId != this.state.affairId) {
      this.props.getUserRole(affairId)
    }
    this.setState({
      affairId: affairId,
      parentAffairId,
      affairType, // 不需要每次判断是否为小组，判断一次即可
    })
  }
  componentWillReceiveProps(nextProps) {
    this.initializeAffair(nextProps.location.pathname)
  }
  handleSwitchTab = (tabName) => {
    const pathArr = this.props.location.pathname.split('/')
    const actualPathArr = pathArr.slice(1, pathArr.length)
    const affairType = this.state.affairType
    let partPath = ''
    if (affairType == AFFAIR_TYPE.GROUP) {
      partPath = actualPathArr.slice(0, 5).join('/')
    } else if (affairType == AFFAIR_TYPE.COURSE || affairType == AFFAIR_TYPE.DEPARTMENT) {
      partPath = actualPathArr.slice(0, 3).join('/')
    } else {
      partPath = actualPathArr.slice(0).join('/')
    }
    let path = `/${partPath}/${tabName}`
    if (tabName === 'file') {
      path = path + `/0/path=%2F`
    }
    if (path.slice(1) != actualPathArr.slice(0).join('/')) {
      this.props.history.push(path)
    }
  }
  switchMapToList = (courseMap) => {
    let courseList = List()
    courseMap.toList().flatten(1).forEach((v) => {
      v.forEach(value => {
        value.forEach(vv => {
          courseList = courseList.push(vv)
        })
      })
    })
    return courseList
  }
  renderCourseTab = (navigationTabLeft, navigationTabWidth, currentTabIndex, currentTab, isMember) => {
    const { affairType } = this.state
    const { role } = this.props
    switch (affairType) {
      case AFFAIR_TYPE.COURSE:
      return (
        <div className={styles.courseTab}>
          {/* 当前导航指示 */}
          {
            navigationTabWidth[currentTabIndex] != 0 && navigationTabLeft[currentTabIndex] &&
              <Motion style={{ width: spring(navigationTabWidth[currentTabIndex]), left: spring(navigationTabLeft[currentTabIndex]) }}>
                {(interpolatingStyle) => <div className={styles.activeCourseTabBar} style={{ left: interpolatingStyle.left, width: interpolatingStyle.width }} />}
              </Motion>
          }
          {
            role != USER_ROLE_TYPE.ADMIN && isMember ?
            [
              <div
                key="info"
                className={currentTab === 'info' ? styles.activeCourseTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'info')}
              >
                课程信息
              </div>,
              <div
                key="member"
                className={currentTab === 'member' ? styles.activeCourseTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'member')}
              >
                人员
              </div>,
              <div
                key="activity"
                className={currentTab === 'activity' ? styles.activeCourseTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'activity')}
              >
                课程活动
              </div>,
              <div
                key="file"
                className={currentTab === 'file' ? styles.activeCourseTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'file')}
              >
                课程资料
              </div>,
              <div
                key="group"
                className={currentTab === 'group' ? styles.activeCourseTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'group')}
              >
                小组
              </div>,
              <div
                key="chat"
                className={currentTab === 'chat' ? styles.activeCourseTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'chat')}
              >
                会话
              </div>
            ]
            :
            [
              <div
                key="info"
                className={currentTab === 'info' ? styles.activeCourseTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'info')}
              >
                课程信息
              </div>,
              <div
                key="member"
                className={currentTab === 'member' ? styles.activeCourseTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'member')}
              >
                人员
              </div>
            ]
          }
        </div>
      )
      case AFFAIR_TYPE.GROUP:
        return (
          <div className={styles.courseTab}>
            {/* 当前导航指示 */}
            {navigationTabWidth[currentTabIndex] != 0 &&
            <Motion style={{ width: spring(navigationTabWidth[currentTabIndex]), left: spring(navigationTabLeft[currentTabIndex]) }}>
              {(interpolatingStyle) => <div className={styles.activeCourseTabBar} style={{ left: interpolatingStyle.left, width: interpolatingStyle.width }} />}
            </Motion>
            }
            <div
              key="activity"
              className={currentTab === 'activity' ? styles.activeCourseTab : ''}
              onClick={this.handleSwitchTab.bind(this, 'activity')}
            >
              小组活动
            </div>
            <div
              key="member"
              className={currentTab === 'member' ? styles.activeCourseTab : ''}
              onClick={this.handleSwitchTab.bind(this, 'member')}
            >
              人员
            </div>
            <div
              key="file"
              className={currentTab === 'file' ? styles.activeCourseTab : ''}
              onClick={this.handleSwitchTab.bind(this, 'file')}
            >
              课程资料
            </div>

            <div
              key="chat"
              className={currentTab === 'chat' ? styles.activeCourseTab : ''}
              onClick={this.handleSwitchTab.bind(this, 'chat')}
            >
              会话
            </div>

          </div>
        )
      case AFFAIR_TYPE.DEPARTMENT:
        return (
          <div className={styles.courseTab}>
            {/* 当前导航指示 */}
            {navigationTabWidth[currentTabIndex] != 0 &&
            <Motion style={{ width: spring(navigationTabWidth[currentTabIndex]), left: spring(navigationTabLeft[currentTabIndex]) }}>
              {(interpolatingStyle) => <div className={styles.activeCourseTabBar} style={{ left: interpolatingStyle.left, width: interpolatingStyle.width }} />}
            </Motion>
            }
            <div
              key="info"
              className={currentTab === 'info' ? styles.activeCourseTab : ''}
              onClick={this.handleSwitchTab.bind(this, 'info')}
            >
              学院首页
            </div>
          </div>
        )
      default:
        return null
    }
  }
  render() {
    const { myCourse, allCourse, role, roleId } = this.props
    if (roleId === -2) {
      return null
    }
    const { affairId, affairType, parentAffairId } = this.state
    let currentGroup, currentAffair
    const regex = /^\/index\/course\/\d*\/(\w*)$/
    const regexResult = regex.exec(this.props.location.pathname)
    let locationTab = regexResult ? regexResult[1] : null
    let currentTab = locationTab ? locationTab : 'info'
    let navigationTabWidth = NAVIGATION_TAB_WIDTH.slice()
    let navigationTabLeft = NAVIGATION_TAB_LEFT.slice()
    let navigationTab = NAVIGATION_TAB.slice()
    // 判断是否为已参与的课程
    const isMember = role && (role > USER_ROLE_TYPE.NULL)
    if (affairType == AFFAIR_TYPE.DEPARTMENT) {
      // 部门级别
      currentAffair = myCourse.find((v) => {
        return v.get('id') == affairId
      })
      locationTab = 'info'
      currentTab = 'info'
      navigationTabWidth = DEPARTMENT_NAV_WIDTH.slice()
      navigationTabLeft = DEPARTMENT_NAV_LEFT.slice()
      navigationTab = DEPARTMENT_NAV_TAB.slice()
    } else if (affairType == AFFAIR_TYPE.GROUP) {
      // 小组
      locationTab = this.props.location.pathname.split('/')[6]
      currentTab = locationTab ? locationTab : 'member'
      currentTabIndex = GROUP_NAV_TAB.indexOf(currentTab)
      navigationTabWidth = GROUP_NAV_TAB_WIDTH.slice()
      navigationTabLeft = GROUP_NAV_TAB_LEFT.slice()
      navigationTab = GROUP_NAV_TAB
      currentGroup = myCourse.find((v) => {
        return v.get('id') == parentAffairId
      }).get('groupSimpleList').filter((v) => {
        return v.get('id') == this.state.affairId
      }).get(0)
    } else {
      // 课程
      locationTab = this.props.location.pathname.split('/')[4]
      currentTab = locationTab ? locationTab : 'info'
      let courseList = this.switchMapToList(allCourse)
      currentAffair = courseList.find((v) => {
        return v.get('id') == affairId
      })
      // 排除没有找到对应课程的情况
      if (!currentAffair || typeof(currentAffair) == 'undefined') {
        return null
      }
      /* 在fetch成功之前course为null，这时候显示空的navbar */
      if (currentAffair == null || (courseList || List()).size == 0) {
        return <div className={styles.navigation} />
      }
      switch(role){
        case USER_ROLE_TYPE.ADMIN:
          navigationTabWidth = GUEST_NAV_TAB_WIDTH
          navigationTabLeft = GUEST_NAV_TAB_LEFT
          navigationTab = GUEST_NAV_TAB
          break;
        default:
          if(!isMember){
            navigationTabWidth = GUEST_NAV_TAB_WIDTH
            navigationTabLeft = GUEST_NAV_TAB_LEFT
            navigationTab = GUEST_NAV_TAB
          }
      }
    }
    let currentTabIndex = navigationTab.indexOf(currentTab)
    if (currentTabIndex < 0) {
      this.handleSwitchTab('info')
      return null
    }
    return (
      <div className={styles.navigation}>
        {affairType == AFFAIR_TYPE.GROUP ?
          <p>{currentGroup ? currentGroup.get('name') : '小组名称'}</p>
          :
          <p>{currentAffair.get('name')}</p>
        }
          {/* 事务内容导航 */}
        <div className={styles.rightPanel}>
          {/* 事务设置 */}
          {this.renderCourseTab(navigationTabLeft, navigationTabWidth, currentTabIndex, currentTab, isMember)}
          <div key="split1" className={styles.splitLine} />
          <div key="myrole" className={styles.position}>
            <span>我的角色：</span>
            <span className={styles.roleType}>{USER_ROLE_TYPES[role] ? USER_ROLE_TYPES[role] : '无'}</span>
          </div>
        </div>
      </div>
    )
  }
}
// NavigationContainer.defaultProps = {
//   role: USER_ROLE_TYPE.STUDENT,
//   isMember: true
// }
class IndexContainer extends React.Component {
  render() {
    // let needRedirect = false
    // const regex = /^\/index\/course\/\d*$/
    // const pathname = this.props.location.pathname
    // if (regex.exec(pathname)) {
    //   needRedirect = true
    // }
    return (
      <div className={styles.indexContainer} ref={(el) => this.indexContainer=el}>
        {/* {needRedirect &&
          <Redirect to={`/index/course/${this.props.match.params.id}/info`}/>
        } */}
        <Children routes={this.props.routes}/>
      </div>
    )
  }
}
class LogoContainer extends React.Component {
  render() {
    // const pathname = this.props.location.pathname
    // console.log(pathname.slice('/'))
    // if (pathname.slice('/').length > 3) return null
    return (
      <div className={styles.logoContainer} >
        <img key="image" src={njuSoftwareInstitute} />
      </div>
    )
  }
}
function mapStateToProps(state, props) {
  return {
    role: state.getIn(['user', 'role', 'roleType']),
    roleId: state.getIn(['user', 'role', 'roleId']),
    myCourse: state.getIn(['course', 'myCourse']),
    allCourse: state.getIn(['course', 'allCourse']),
  }
}
function mapDispatchToProps(dispatch) {
  return {
    getUserRole: bindActionCreators(getUserRole, dispatch),
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(ContentPanelHOC(LogoContainer, NavigationContainer, IndexContainer))
