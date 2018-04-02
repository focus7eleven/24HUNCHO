import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { fromJS, List } from 'immutable'
// import { Spin } from 'antd'
import config from 'config'
import SecondaryButton from 'components/button/SecondaryButton'
import DynamicScrollPane from 'components/scrollpane/DynamicScrollPane'
import styles from './TaskContainer.scss'
import { TASK_TYPE, LOAD_LIMIT } from '../constant/AnnouncementConstants'
import TaskCreateInput from './TaskCreateInput'
// import MeetingItem from './item/MeetingItem'
// import WorkItem from './item/WorkItem'
// import MemoItem from './item/MemoItem'
import TaskCard from './TaskCard'

class TaskContainer extends React.Component {
  state = {
    isEdit: false,
    editType: TASK_TYPE.WORK,
    taskList: List(),
    hasMore: false,
    isFetching: true,
  }

  componentWillMount() {
    // fetch 列表

    this.fetchTaskList()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.announcement.get('announcementId') != this.props.announcement.get('announcementId')) {
      this.fetchTaskList(List(), LOAD_LIMIT, nextProps)
    }
  }

  // 如果taskList为空则说明这里用到的是更新数据，不是获取最新数组
  fetchTaskList = (taskList = List(), limit = LOAD_LIMIT, props = this.props) => {
    const { affair, announcement } = props
    this.setState({
      isFetching: true,
    })
    fetch(config.api.announcement.detail.task.getList(announcement.get('announcementId')), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify({
        lastTime: taskList.size !== 0 ? taskList.get(taskList.size - 1).get('createTime') + 1 : null,
        limit: limit
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        const data = json.data
        this.setState({
          taskList: taskList.concat(fromJS(data.taskVOList)),
          hasMore: data.hasMore,
          isFetching: false,
        })
      }
    })
  }

  // handleKeyTask = (taskId) => {
  //   const { affair, announcement } = this.props
  //   fetch (config.api.announcement.detail.task.keyTask(taskId), {
  //     method: 'POST',
  //     affairId: affair.get('id'),
  //     roleId: affair.get('roleId'),
  //     resourceId: announcement.get('announcementId'),
  //   }).then((res) => res.json()).then(messageHandler).then((json) => {
  //     if (json.code === 0) {
  //       message.success('标记成功', 0.5)
  //       this.fetchTaskList()
  //     }
  //   })
  // }
  //
  // handleModifyTask = (taskId, modi, type) => {
  //   const { affair, announcement } = this.props
  //   modi.announcementId = announcement.get('announcementId')
  //   fetch (config.api.announcement.detail.task.modify(taskId, type), {
  //     method: 'POST',
  //     affairId: affair.get('id'),
  //     roleId: affair.get('roleId'),
  //     resourceId: announcement.get('announcementId'),
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify(modi),
  //   }).then((res) => res.json()).then(messageHandler).then((json) => {
  //     if (json.code == 0) {
  //       message.success('修改成功', 0.5)
  //       this.fetchTaskList()
  //     }
  //   })
  // }

  render() {
    const {
      isEdit,
      taskList,
      isFetching,
      hasMore,
    } = this.state
    const {
      affair,
      announcement,
      roles,
      officialList,
      guestList,
    } = this.props



    const findRole = roles.find((role) => {
      return role.get('roleId') == affair.get('roleId')
    })
    const permission = announcement.get('permission')
    const announcementId = announcement.get('announcementId')

    const isOfficial = officialList.toJS().find((o) => o.roleId === affair.get('roleId')) ? true : false

    const optRole = findRole.merge(fromJS({
      avatar: this.props.avatar,
      username: this.props.username,
      roleTitle: findRole.get('roleName')
    }))
    const respCandidates = isOfficial ? officialList.concat(guestList) : List([optRole])

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span>任务列表：</span>
          {permission.some((v) => v == 507) &&
            <SecondaryButton type="primary" size="small" onClick={() => this.setState({ isEdit: true })}>新建任务</SecondaryButton>
          }

        </div>
        <div className={styles.listContainer}>
          {isEdit &&
            <TaskCreateInput
              optRole={optRole}
              respCandidates={respCandidates}
              meetingCandidates={officialList.concat(guestList)}
              affair={affair}
              announcementId={announcementId}
              onCancel={() => this.setState({ isEdit: false })}
              onSuccess={() => this.fetchTaskList(taskList, 1)}
            />
          }
          <DynamicScrollPane
            onLoad={() => this.fetchTaskList(taskList)}
            isLoading={isFetching}
            hasMore={hasMore}
            wrapClassName={styles.scrollListContainer}
          >
            {taskList.map((task, key) => {
            // const type = task.get('type')
              return (
                <div key={key}>
                  <TaskCard
                    task={task}
                    affair={affair}
                    announcement={announcement}
                    officialList={officialList}
                    guestList={guestList}
                    permission={permission}
                    reloadCallback={this.fetchTaskList}
                  />
                </div>
              )

            })}
          </DynamicScrollPane>
        </div>
      </div>
    )

  }
}

TaskContainer.propTypes = {
  affair: PropTypes.object.isRequired,
  announcement: PropTypes.object.isRequired,
  // isOfficial: PropTypes.bool.isRequired,
  // officialList: PropTypes.instanceOf(immutable.List).isRequired,
  // guestList: PropTypes.instanceOf(immutable.List).isRequired,
}

function mapStateToProps(state) {
  return {
    roles: state.getIn(['user', 'roles']),
    avatar: state.getIn(['user', 'avatar']),
    username: state.getIn(['user', 'username']),
  }
}

export default connect(mapStateToProps)(TaskContainer)
