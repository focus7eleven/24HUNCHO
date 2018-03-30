import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fromJS, List } from 'immutable'
import { Spin, Button, notification } from 'antd'
import { TableInfoEdit } from 'svg'
import styles from './CourseInfoContainer.scss'
import RoleItem from '../../components/RoleItem'
import InviteCodeModal from './modal/InviteCodeModal'
import ApplyToJoinModal from '../../components/modal/ApplyToJoinModal'
import EditCourseModal from '../../components/modal/EditCourseModal'
import { USER_ROLE_TYPE } from 'member-role-type'
import { AFFAIR_TYPE } from '../header/HeaderContainer'
import {
  getCourseDetail,
  quitCourse,
  getMyCourse,
  getAllCourse,
  setInviteCode,
  joinCoursebyCode,
} from '../../actions/course'
import { applyToJoin } from '../../actions/role'
import { getUserRole } from '../../actions/user'

const COURSE_TYPE = {
  REQUIRED: 1, // 必修课
  OPTIONAL: 0, // 选修课
}
const COURSE_TYPES = [{
    type: COURSE_TYPE.OPTIONAL,
    color: '#f5a623',
    text: '选修'
  }, {
    type: COURSE_TYPE.REQUIRED,
    color: '#66b966',
    text: '必修'
}]

const TERM_TYPE = {
  SPRING: 0,
  SUMMER: 1,
  FALL: 2,
  WINTER: 3,
}

const TERM_TYPES = ['Spring', 'Summer', 'Fall', 'Winter']

class CourseInfoContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showEditCourseModal: false,
      showInviteCodeModal: false,
      showApplyModal: false,
      isLoading: true,
      isRequesting: false,
      isExiting: false,
    }
  }

  componentDidMount() {
    if (this.props.roleId !== -2) {
      this.fetchCourseDetail(this.props.match.params.id, this.props.roleId)
    }
  }

  componentWillReceiveProps(nextProps) {
    if ((nextProps.roleId !== this.props.roleId) || this.props.match.params.id !== nextProps.match.params.id) {
      this.fetchCourseDetail(nextProps.match.params.id, nextProps.roleId)
    }
  }

  fetchCourseDetail = (id, roleId) => {
    this.setState({
      isLoading: true
    })
    this.props.getCourseDetail(id, roleId).then(json => {
      if (json.code === 0) {
        this.setState({
          isLoading: false
        })
      }
    })
  }

  handleSubmitInviteCode = (code) => {
    const { course, role, baseRoleType } = this.props

    if (role.get('roleType') == USER_ROLE_TYPE.TEACHER) {
      // 老师设置邀请码
      this.handleSetInviteCode(course.get('id'), role.get('roleId'), code)
    } else if (role.get('roleType') == USER_ROLE_TYPE.NULL && (baseRoleType == USER_ROLE_TYPE.STUDENT || baseRoleType == USER_ROLE_TYPE.ASSISTANT)) {
      // 学生或助教填写邀请码加入课程
      this.handleJoinCourse(null, code)
    }
  }

  handleSetInviteCode = (id, roleId, code) => {
    this.setState({
      isRequesting: true,
    })
    this.props.setInviteCode(id, roleId, code).then((res) => {
      if (res.code === 0) {
        this.setState({
          showInviteCodeModal: false,
          isRequesting: false,
        })
        this.handleCourseUpdated()
      } else {
        notification['error']({
          message: '设置失败',
          description: res.data
        })
        this.setState({
          isRequesting: false,
        })
      }
    })
  }

  // 若code为null，说明为申请加入课程，若code不为null，则为填写邀请码的方式
  handleJoinCourse = (value, code) => {
    const { course, role } = this.props
    this.setState({
      isRequesting: true,
    })
    if (value != null) {
      // 点击申请加入课程
      this.props.applyToJoin(course.get('id'), role.get('roleId'), value.reason, course.get('id'), AFFAIR_TYPE.COURSE).then((res) => {
        notification[res.type]({
          message: res.message,
          description: res.description,
        })
        if (res.type === 'success') {
          this.setState({
            showApplyModal: false,
            isRequesting: false,
          })
        } else {
          this.setState({
            isRequesting: false,
          })
        }
      })
    } else {
      // 填写邀请码加入课程
      this.props.joinCoursebyCode(course.get('id'), role.get('roleId'), code).then((res) => {
        if (res.code === 0) {
          this.props.getAllCourse()
          this.props.getMyCourse()
          this.handleCourseUpdated()
          this.props.getUserRole(course.get('id'))
          this.setState({
            showInviteCodeModal: false,
            isRequesting: false,
          })
        } else {
          notification['error']({
            message: '加入课程失败',
            description: res.data
          })
          this.setState({
            isRequesting: false,
          })
        }
      })
    }
  }

  handleExitCourse = () => {
    this.setState({
      isExiting: true,
    })
    this.props.quitCourse(this.props.course.get('id'), this.props.role.get('roleId')).then((res) => {
      if (res.code === 0) {
        this.props.getMyCourse()
        this.props.getAllCourse()
        this.handleCourseUpdated()
        this.props.getUserRole(this.props.course.get('id'))
      } else {
        notification['error']({
          message: '退出课程失败',
          description: res.data,
        })
      }
      this.setState({
        isExiting: false,
      })
    })
  }

  handleCourseUpdated = () => {
    this.fetchCourseDetail(this.props.match.params.id, this.props.roleId)
    this.setState({ showEditCourseModal: false })
  }

  renderBtnPanel(userType){
    const { course, myCourse, baseRoleType } = this.props
    const { isRequesting, isExiting } = this.state

    switch(userType){
    case USER_ROLE_TYPE.ADMIN:
      return <Button type="primary" size="large" onClick={ () => this.setState({ showEditCourseModal: true }) }>编辑课程</Button>
    case USER_ROLE_TYPE.TEACHER:
      if (course.get('inviteCode')) {
        return (
          <div className={styles.inviteCode}>
            <span>邀请码：{course.get('inviteCode')}</span>
            <TableInfoEdit onClick={ () => this.setState({ showInviteCodeModal: true }) }/>
          </div>
        )
      } else {
        return (
          <Button type="primary" size="large" onClick={ () => this.setState({ showInviteCodeModal: true }) }>设置邀请码</Button>
        )
      }
    case USER_ROLE_TYPE.ASSISTANT:
    case USER_ROLE_TYPE.STUDENT:
      return <Button type="ghost" size="large" onClick={ this.handleExitCourse } loading={isExiting}>退出课程</Button>
    case USER_ROLE_TYPE.NULL:
      if (baseRoleType == USER_ROLE_TYPE.TEACHER || baseRoleType == USER_ROLE_TYPE.ADMIN) {
        // 未参与到当前课程的老师 or 教务员
        return null
      }
      return (
        <div>
          <Button type="ghost" size="large" onClick={ () => this.setState({ showInviteCodeModal: true }) }>邀请码选课</Button>
          <Button type="primary" size="large" onClick={ () => this.setState({ showApplyModal: true }) }>申请加入</Button>
        </div>
      )
    default:
      return null
    }
  }

  render() {
    const {
      showEditCourseModal,
      showInviteCodeModal,
      showApplyModal,
      isLoading,
      isRequesting,
    } = this.state
    const {
      course,
      baseRoleType
    } = this.props

    if (isLoading) {
      // return null
      return (
        <div className={styles.homepageContainer}>
          <Spin />
        </div>
      )
    }
    let inviteTitle = '设置邀请码'
    if (baseRoleType == USER_ROLE_TYPE.STUDENT || baseRoleType == USER_ROLE_TYPE.ASSISTANT){
      inviteTitle = '填写邀请码'
    }
    const courseType = course.get('courseType')
    const inviteCode = course.get('inviteCode')
    const term = course.get('term').split(' ')
    return (
      <div className={styles.homepageContainer}>
        <div className={styles.titleContainer}>
          <div className={styles.left}>
            <span
              className={styles.icon}
              style={{fontSize: 13, backgroundColor: COURSE_TYPES[courseType].color}}
            >
              {COURSE_TYPES[courseType].text}
            </span>
            <span className={styles.title}>{course.get('name')}</span>
          </div>
          <div className={styles.btnPanel}>
            { this.renderBtnPanel(course.get('roleType')) }
          </div>
        </div>
        <div className={styles.contentContainer}>
          {course.get('description')}
        </div>
        <div className={styles.courseInfo}>
          <div className={styles.courseItem} style={{ display: 'flex', flexWrap: 'wrap' }}>授课教师：
            {course.get('teachers').map((v, k) => {
              return (
                <RoleItem key={k} role={v} style={{ marginRight: 10 }}/>
              )
            })}
          </div>
          <div className={styles.courseItem}>课程编号：{course.get('number')}</div>
          <div className={styles.courseItem}>所属学期：{`${term[0]} ${TERM_TYPES[term[1]]}`}</div>
          <div className={styles.courseItem}>所属年级：{course.get('grade')}</div>
          <div className={styles.courseItem}>开始时间：{course.get('startDate')}</div>
          <div className={styles.courseItem}>结束时间：{course.get('endDate')}</div>
          <div className={styles.courseItem}>学分：{course.get('credit')}</div>
        </div>

        {showInviteCodeModal &&
          <InviteCodeModal
            title={inviteTitle}
            defaultValue={
              course.get('roleType') == USER_ROLE_TYPE.TEACHER ?
              // (
                // course.get('inviteCode').trim().length != 0 ?
                course.get('InviteCode')
                // : null)
              : null
            }
            isRequesting={isRequesting}
            submitCallback={ this.handleSubmitInviteCode }
            cancelCallback={ () => this.setState({ showInviteCodeModal: false }) }
          />
        }

        {showApplyModal &&
          <ApplyToJoinModal
            name={course.get('name')}
            type={AFFAIR_TYPE.COURSE}
            isRequesting={isRequesting}
            onSubmitCallback={this.handleJoinCourse}
            onCancelCallback={() => this.setState({ showApplyModal: false })}
          />

        }

        <EditCourseModal
          course={course}
          visible={showEditCourseModal}
          onClose={() => this.setState({ showEditCourseModal: false })}
          onSuccess={this.handleCourseUpdated}
        />
      </div>
    )
  }
}

function mapStateToProps(state) {

  return {
    myCourse: state.getIn(['course', 'myCourse']),
    course: state.getIn(['course', 'currentCourse']),
    userId: state.getIn(['user', 'userId']),
    role: state.getIn(['user', 'role']),
    roleId: state.getIn(['user', 'role', 'roleId']),
    baseRoleType: state.getIn(['user', 'type']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getCourseDetail: bindActionCreators(getCourseDetail, dispatch),
    quitCourse: bindActionCreators(quitCourse, dispatch),
    getMyCourse: bindActionCreators(getMyCourse, dispatch),
    getAllCourse: bindActionCreators(getAllCourse, dispatch),
    setInviteCode: bindActionCreators(setInviteCode, dispatch),
    joinCoursebyCode: bindActionCreators(joinCoursebyCode, dispatch),
    applyToJoin: bindActionCreators(applyToJoin, dispatch),
    getUserRole: bindActionCreators(getUserRole, dispatch),
  }
}



export default connect(mapStateToProps, mapDispatchToProps)(CourseInfoContainer)
