import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import moment from 'moment'
import { fromJS, List } from 'immutable'
import { Spin, Select, Input, DatePicker, Dropdown, Button, Menu } from 'antd'
import { SearchIcon, ArrowDropDown } from 'svg'
import imageNoRelease from 'images/img_no_release.png'
import imageNoPermissions from 'images/img_no_permissions.png'
import styles from './ActivityList.scss'
import InnerActivity from './InnerActivity'
import { USER_ROLE_TYPE } from 'member-role-type'
import CreateActivityModal from '../../components/modal/CreateActivityModal'
import { getCourseDetail } from '../../actions/course'
import { getActivities } from '../../actions/activity'
import { getUserRole } from '../../actions/user'

export const ACTIVITY_TYPE = {
  TEACH: 0,
  HOMEWORK: 1,
  EXAM: 2,
  OTHERS: 3,
  PROJECT: 4,
}

export const ACTIVITY_ATTRS = [{
  text: '教学',
  color: '#66b966'
}, {
  text: '作业',
  color: '#e78c24'
}, {
  text: '考试',
  color: '#f45b6c'
}, {
  text: '其它',
  color: '#4a90e2'
}, {
  text: '活动',
  color: '#000000'
}]

const TEMPLATE_ALL = {
  index: -1,
  name: '全部活动',
}

const Option = Select.Option
const RangePicker = DatePicker.RangePicker

class CourseActivityList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      activityList: this.props.activityList,
      creator: {
        show: false,
        title: '',
        type: ACTIVITY_TYPE.OTHERS
      },
      filters: {
        courseType: TEMPLATE_ALL.index,
        keyword: '',
        dateRange: null,
      },
      affairId: this.props.match.params.id,
      isLoading: false,
      isGroup: false,
    }
  }

  componentWillMount() {
    if (this.props.roleId !== -2) {
      this.fetchActivities()
    }
  }

  fetchActivities = (props = this.props) => {
    const pathname = props.location.pathname
    const regex = /^\/index\/course\/\d*\/group\/(\d*)\/.*$/
    const hasGroupId = regex.exec(pathname)
    const affairId = hasGroupId ? hasGroupId[1] : props.match.params.id
    this.setState({
      isLoading: true,
      affairId
    })
    this.props.getActivities(affairId, props.roleId).then(res =>{
      if (res) {
        this.setState({
          isLoading: false,
          activityList: this.props.activityList,
        })
      }
    })
  }

  componentWillReceiveProps(nextProps) {
    const nextCourseId = nextProps.match.params.id
    const nextGroupId = nextProps.match.params.groupId
    const courseId = this.props.match.params.id
    const groupId = this.props.match.params.groupId
    if ((nextCourseId != courseId) || (nextGroupId && nextGroupId != groupId) || (this.props.roleId !== nextProps.roleId)) {
      this.fetchActivities(nextProps)
    }
  }

  handleShowActivityDetail = (id) => {
    this.props.history.push(`${this.props.location.pathname}/${id}`)
  }

  onSearch(){
    const allActivities = this.props.activityList
    const { courseType, keyword, dateRange } = this.state.filters

    let activityList = allActivities.filter((v) => {
      return v.get('title').indexOf(keyword) >= 0
    })
    if (courseType != TEMPLATE_ALL.index) {
      activityList = activityList.filter((v) => {
        return v.get('type') == courseType
      })
    }
    if (dateRange && dateRange.length > 0) {
      const startDate = dateRange[0]
      const endDate = dateRange[1]
      activityList = activityList.filter((v) => {
        const createTime = moment(v.get('createTime'))
        return createTime.isBetween(startDate, endDate)
      })
    }
    this.setState({
      activityList,
    })
  }

  onSearchTextChange = (e) => {
    this.setState({
      filters: {
        ...this.state.filters,
        keyword: e.target.value,
      }
    }, this.onSearch)
  }

  onActivityTypeChange = (key) => {
    this.setState({
      filters: {
        ...this.state.filters,
        courseType: Number.parseInt(key)
      }
    }, this.onSearch)
  }

  onDateRangeChange = (dates) => {
    this.setState({
      filters: {
        ...this.state.filters,
        dateRange: dates
      }
    }, this.onSearch)
  }

  handleCreate = (e) => {
    const key = e.key
    this.setState({
      creator: {
        show: true,
        title: ACTIVITY_ATTRS[key].text,
        type: key
      }
    })
  }

  handleActivityCreated = () => {
    this.fetchActivities()
    this.handleCancelModal()
  }

  handleCancelModal = () => {
    this.setState({
      creator: {
        show: false,
        title: '',
        type: ACTIVITY_TYPE.OTHERS
      }
    })
  }

  render() {
    const {
      creator,
      affairId,
      isLoading,
      activityList,
    } = this.state

    const {
      currentCourse,
      role
    } = this.props;

    const menu = (
      <Menu className={styles.createMenu} onClick={this.handleCreate}>
        {ACTIVITY_ATTRS.map((v,k) => {
          return (<Menu.Item key={k}>{v.text}</Menu.Item>)
        })}
      </Menu>
    )

    const isGroup = affairId != this.props.match.params.id

    if (isLoading) {
      return (
        <div className={styles.container} style={{textAlign: 'center', paddingTop: '40px'}}>
          <Spin />
        </div>
      )
    }


    return (
      <div className={styles.container}>
        <div className={styles.body}>
          <div className={styles.toolGroup}>
            <div className={styles.filterGroup}>
              {
                !isGroup &&
                <div className={styles.typeField}>
                  <div className={styles.label}>类型：</div>
                  <Select defaultValue={`${TEMPLATE_ALL.index}`} onChange={this.onActivityTypeChange}>
                    <Option key={TEMPLATE_ALL.index} value={`${TEMPLATE_ALL.index}`}>{TEMPLATE_ALL.name}</Option>
                    {Object.values(ACTIVITY_TYPE).map((val) => {
                      const text = ACTIVITY_ATTRS[val].typeName || ACTIVITY_ATTRS[val].text
                      return (
                        <Option key={val} value={`${val}`}>{text}活动</Option>
                      )
                    })}
                  </Select>
                </div>
              }
              <RangePicker value={this.state.filters.dateRange} onChange={this.onDateRangeChange} />
              <div className={styles.searchField}>
                <Input placeholder={'请输入关键词'} value={this.state.filters.keyword} onChange={this.onSearchTextChange} />
                <span className={styles.searchIcon}><SearchIcon/></span>
              </div>
            </div>
            {
              isGroup ?
              ((role.get('roleType') == USER_ROLE_TYPE.MANAGER || role.get('roleType') == USER_ROLE_TYPE.MEMBER) &&
              <Button type="primary" className={styles.createBtn} onClick={() => this.handleCreate({key: ACTIVITY_TYPE.PROJECT})}>创建活动</Button>)
              :
              ((role.get('roleType') == USER_ROLE_TYPE.ASSISTANT || role.get('roleType') == USER_ROLE_TYPE.TEACHER) &&
              <Dropdown trigger={['click']} overlay={menu}>
                <Button type="primary" className={styles.createBtn}>创建课程活动 <ArrowDropDown /></Button>
              </Dropdown>)
            }

          </div>
          <div className={styles.listContainer}>
            {role.get('roleType') == USER_ROLE_TYPE.NULL ?
              <div className={styles.nullPage} >
                <img key="img" src={imageNoPermissions}/>
                <div key="text">权限不足</div>
              </div>
              :
              activityList.size ==0 ?
                <div className={styles.nullPage}>
                  <img key="img" src={imageNoRelease}/>
                  <div key="text">暂无活动</div>
                </div>
                :
                activityList.map((activity, index) => {
                  return (
                    <InnerActivity
                      key={index}
                      activity={activity}
                      onClick={this.handleShowActivityDetail}
                    />
                  )
                })
            }
          </div>
        </div>
        <CreateActivityModal affairId={affairId} title={creator.title} visible={creator.show} onClose={this.handleCancelModal} onSuccess={this.handleActivityCreated} />
      </div>
    )
  }
}

CourseActivityList.defaultProps = {
  course: fromJS({
    inviteCode: '123456',
    isMember: true,
    userType: USER_ROLE_TYPE.TEACHER,
    teacher: {
      avatar: '',
      roleTitle: '副教授',
      username: '硕彦慧'
    }
  })
}
// 因为只有是课程成员的时候才能看到活动列表，所以只返回myCourse即可
function mapStateToProps(state, props) {
  return {
    currentCourse: state.getIn(['course', 'currentCourse']),
    role: state.getIn(['user', 'role']),
    roleId: state.getIn(['user', 'role', 'roleId']),
    activityList: state.getIn(['activity', 'activityList'])
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getActivities: bindActionCreators(getActivities, dispatch),
    getCourseDetail: bindActionCreators(getCourseDetail, dispatch),
    getUserRole: bindActionCreators(getUserRole, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CourseActivityList)
