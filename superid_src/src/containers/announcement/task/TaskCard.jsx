import React from 'react'
import moment from 'moment'
import classNames from 'classnames'
import { Icon, Popover, Tooltip, message } from 'antd'
import { ICReleaseWorkIcon, FlagIcon, ICReleaseMeetingIcon, ICReleaseMemorandumIcon } from 'svg'
import config from 'config'
import messageHandler from 'messageHandler'
import RoleItem from 'components/role/RoleItem'
import AvatarList from 'components/avatar/AvatarList'
import styles from './TaskCard.scss'
import {
  TASK_TYPE,
  TASK_TYPES,
  WORK_PRIOS,
  KEY_STATES,
  WORK_STATE,
  workStateList,
} from '../constant/AnnouncementConstants'
import EditTaskModal from '../modal/EditTaskModal'
class TaskCard extends React.Component {
  state = {
    showPriSelector: false,
    showStateSelector: false,
    showEditWorkModal: false,
    permission: null,
  }
  componentDidMount(){
    const { task } = this.props
    const { isLoading } = this.state
    if (isLoading){
      return
    }
    const that = this
    this.card.addEventListener('click', function(e){
      if (e.target.getAttribute('class').indexOf('ant-select') >= 0 || e.target.getAttribute('class').indexOf('icon') >= 0){
        return
      } else if (e.target.getAttribute('id') === 'keyState'){
        return
      } else {
        if (task.get('type') == TASK_TYPE.MEETING && task.get('state') == WORK_STATE.CANCELED) {
          return
        }
        that.setState({
          showEditWorkModal: true,
        })
      }
    }, false)
  }
  handleChangePri = (pri) => {
    this.setState({
      showPriSelector: false,
    })
    this.handleModifyTask(
      this.props.task.get('announcementTaskId'),
      {
        priority: pri,
      },
      TASK_TYPE.WORK,
    )
  }
  handleChangeState = (state) => {
    this.setState({
      showStateSelector: false,
    })
    this.handleModifyTask(
      this.props.task.get('announcementTaskId'),
      {
        state: state,
      },
      TASK_TYPE.WORK,
    )
  }
  //标记
  handleKeyTask = () => {
    const { affair, announcement } = this.props
    const taskId = this.props.task.get('announcementTaskId')
    return fetch (config.api.announcement.detail.task.keyTask(taskId), {
      method: 'POST',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcement.get('announcementId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        message.success('标记成功', 0.5)
        this.props.reloadCallback()
      }
      return json
    })
  }
  // 更改任务
  handleModifyTask = (taskId, modi, type) => {
    const { affair, announcement } = this.props
    modi.announcementId = announcement.get('announcementId')
    fetch (config.api.announcement.detail.task.modify(taskId, type), {
      method: 'POST',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcement.get('announcementId'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modi),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        message.success('修改成功', 0.5)
        this.setState({
          showEditWorkModal: false
        })
        this.props.reloadCallback()
      }
    })
  }
  //更新列表
  handleUpdateWork = () => {
    this.setState({
      showEditWorkModal: false,
    })
    this.props.reloadCallback()
  }
  renderPriSelector = (defaultValue) => {
    const { showPriSelector } = this.state
    const content = (
      WORK_PRIOS.map((v, k) => {
        return (
          <div className={styles.selectItem} onClick={() => this.handleChangePri(v.state)} key={k}>
            {WORK_PRIOS[v.state].text}
          </div>
        )
      })
    )
    return (
      <Popover
        overlayClassName={styles.selector}
        content={content}
        visible={showPriSelector}
        trigger="click"
        placement="bottom"
        onVisibleChange={() => this.setState({ showPriSelector: !showPriSelector })}
      >
        <span className={styles.defaultValue}>{WORK_PRIOS[defaultValue].text}</span>
        <Icon type="caret-down" style={{ color: '#ccc', fontSize: 8, marginLeft: 5 }} />
      </Popover>
    )
  }
  renderStateSelector = (defaultValue) => {
    const { showStateSelector } = this.state
    const content = (
      workStateList.map((v, k) => {
        return (
          <div className={styles.selectItem} onClick={this.handleChangeState.bind(this, v.get('state'))} key={k}>
            <span className={styles.dot} style={{ backgroundColor: workStateList.get(v.get('state')).get('icon') }} />
            <span className={styles.text}>
              {workStateList.get(v.get('state')).get('text')}
            </span>
          </div>
        )
      })
    )
    return (
      <Popover
        overlayClassName={styles.selector}
        content={content}
        visible={showStateSelector}
        trigger="click"
        placement="bottom"
        onVisibleChange={() => this.setState({ showStateSelector: !showStateSelector })}
      >
        <span className={styles.defaultValue}>
          <span className={styles.dot} style={{ backgroundColor: workStateList.get(defaultValue).get('icon') }}/>
          <span className={styles.text}>{ workStateList.get(defaultValue).get('text')}</span>
        </span>
        <Icon type="caret-down" style={{ color: '#ccc', fontSize: 8, marginLeft: 5 }} />
      </Popover>
    )
  }
  renderTaskIcon = (type) => {
    switch (type) {
      case TASK_TYPE.WORK:
        return <ICReleaseWorkIcon />
      case TASK_TYPE.MEETING:
        return <ICReleaseMeetingIcon />
      case TASK_TYPE.MEMO:
        return <ICReleaseMemorandumIcon />
    }
  }
  getTaskOwnerLabel = (type) => {
    switch (type * 1) {
      case TASK_TYPE.WORK:
        return '负责人'
      case TASK_TYPE.MEETING:
        return '创建者'
      case TASK_TYPE.MEMO:
        return '记录人'
    }
  }
  render() {
    const { task, permission, affair, announcement, officialList, guestList } = this.props
    const owner = {
      avatar: task.getIn(['ownerRole', 'avatar']),
      roleTitle: task.getIn(['ownerRole', 'roleTitle']),
      roleName: task.getIn(['ownerRole', 'username'])
    }
    const type = task.get('type')
    const joinRolesSize = task.get('joinRolesSize')
    const canModify = permission.some((v) => v === 508)
    return (
      <div
        className={styles.cardContainer}
        ref={(el) => {
          if (el) this.card = el
        }}
      >
        {type == TASK_TYPE.MEETING && task.get('state') == WORK_STATE.CANCELED &&
          <div className={styles.cover} />
        }
        <div className={styles.container}>
          <div className={styles.header} >
            <div className={styles.svgWrapper} style={{ backgroundColor: TASK_TYPES[type].icon }}>
              {this.renderTaskIcon(type)}
            </div>
            <div className={styles.taskName}>{task.get('name')}{(type == TASK_TYPE.MEETING && task.get('state') == WORK_STATE.CANCELED) ? '(已取消)' : null}</div>
            {type == TASK_TYPE.WORK &&
              <div className={styles.key} onClick={this.handleKeyTask}><FlagIcon id="keyState" style={{ fill: KEY_STATES[task.get('keyState')].icon }}/></div>
            }
          </div>
          <div className={styles.contentContainer} >
            <div className={styles.contentItem} style={{ width: '30%' }}>
              <span className={styles.label}>{this.getTaskOwnerLabel(type)}:</span>
              <div className={styles.content}><RoleItem role={owner} /></div>
            </div>
            {type == TASK_TYPE.WORK &&
              <div className={styles.contentItem} style={{ width: '20%' }}>
                <span className={styles.label}>优先级：</span>
                <div className={styles.content}>{canModify ? this.renderPriSelector(task.get('priority')) : task.get('priority')}</div>
              </div>
            }
            {type == TASK_TYPE.WORK &&
              <div className={styles.contentItem}>
                <span className={styles.label}>状态：</span>
                <div className={styles.content}>{canModify ? this.renderStateSelector(task.get('state')) : task.get('state')}</div>
              </div>
            }
            {type == TASK_TYPE.WORK && joinRolesSize != 0 &&
              <div className={styles.contentItem}>
                <span className={styles.label}>协作者：</span>
                <div className={classNames(styles.content, styles.joinRoles)}>
                  <AvatarList roleList={task.get('joinRoles')} avatarSize={23} style={{ verticalAlign: 'middle' }}/>
                  {/* { joinRolesSize > 3 && */}
                  <div className={styles.moreRoles}>等{joinRolesSize}人</div>
                  {/* } */}
                </div>
              </div>
            }
            {type == TASK_TYPE.WORK &&
              (task.get('beginTime') || task.get('offTime')) &&
              <div className={styles.contentItem} style={{ width: 'auto' }}>
                <div className={styles.label}>计划时间：</div>
                <div className={styles.content}>{moment(task.get('beginTime')).format('YYYY/MM/DD hh:mm')} - {moment(task.get('offTime')).format('YYYY/MM/DD hh:mm')}</div>
              </div>
            }
            {(type == TASK_TYPE.MEETING || type == TASK_TYPE.MEMO) &&
              <div className={styles.contentItem} style={{ width: '40%' }}>
                <span className={styles.label}>{type == TASK_TYPE.MEETING ? '开始时间' : '记录时间'}:</span>
                <div className={styles.content}>{moment(task.get('createTime')).format('YYYY/MM/DD hh:mm')}</div>
              </div>
            }
            {type == TASK_TYPE.MEETING &&
              <div className={styles.contentItem} style={{ width: '20%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span className={styles.label}>地点：</span>
                <Tooltip
                  title={task.get('address')}
                >
                  <div className={styles.content}>{task.get('address')}</div>
                </Tooltip>
              </div>
            }
            {type == TASK_TYPE.MEETING &&
              <div className={styles.contentItem} style={{ width: '100%' }}>
                <span className={styles.label}>参与者：</span>
                <div className={classNames(styles.content, styles.avatarList)}>
                  {task.get('joinRoles').map((role, key) => {
                    return (
                      <Tooltip title={`${role.get('roleTitle')} ${role.get('username')}`} key={key}>
                        <span className={styles.avatarWrapper}>
                          <img src={role.get('avatar')} />
                        </span>
                      </Tooltip>
                    )
                  })}
                </div>
              </div>
            }
            {this.state.showEditWorkModal &&
            <EditTaskModal
              taskId={task.get('announcementTaskId')}
              announcementId={announcement.get('announcementId')}
              affair={affair}
              permission={permission}
              officialList={officialList}
              guestList={guestList}
              onCancelCallback={() => this.setState({ showEditWorkModal: false })}
              submitCallback={this.handleUpdateWork}
              onKeyCallback={this.handleKeyTask}
              onChangeCallback={(taskId, modi, type) => this.handleModifyTask(taskId, modi, type)}
            />
          }
          </div>
        </div>
      </div>
    )
  }
}
export default TaskCard
