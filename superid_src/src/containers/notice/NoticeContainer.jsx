import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styles from './NoticeContainer.scss'
import config from '../../config'
import urlFormat from 'urlFormat'
import { Motion, spring } from 'react-motion'
import {
  updateNotificationList,
  flushNotificationList,
  clearNoticeNews,
  initializeRoleNotification,
  READ_STATE,
  HANDLE_STATE,
  MSG_TYPE,
  MESSAGE_MODE,
  MESSAGE_GROUP,
  MESSAGE_MODES
} from '../../actions/notification'
import { fromJS, List, Map } from 'immutable'
import moment from 'moment'
import { Select, Tooltip, Icon } from 'antd'
import NoticeListContainer from './NoticeListContainer'
import NoticeGroupContainer from './NoticeGroupContainer'
const Option = Select.Option

const NOTIFICATION_NAMES = ['全部', '通知', '邀请', '物资', '资金', '审批']
const NOTIFICATION_TYPES = ['all', 'notice', 'invitation', 'material', 'funds', 'audit']
const NOTIFICATION_STATE_NAME = ['所有消息', '已读消息', '未读消息', '未处理消息', '已处理消息']
const NOTIFICATION_STATES = ['', 'READ', 'UNREAD', 'UNHANDLED', 'HANDLED']
const LOAD_MESSAGE_COUNT = 20


const MESSAGE_GROUP_NAME = ['默认分组', '接收方分组', '任务分组']
const MESSAGE_GROUP_VALUE = [-1, 0, 1]

/*
  有关于更新用户各个角色、角色各个类型数据的需求：
  组件加载：更新各个角色的消息数量
  选择某角色：第一次选择该角色，更新各个类型的消息数量
  类型：(all/notice) => (any) 清空新通知数量
  角色切换：如果选择的类型是all或notice，则更新切换前角色的新通知数量
  标记已读：（通知）每次触发类型和角色的切换后，判断是否是all/notice类型，如果是，需要标记所有通知为已读；
           通知批量标记为已读后，不变灰，切换到消息中心其他页面则变灰
          （其他）点击后标记为已读，变灰

*/
const NoticeContainer = React.createClass({
  getDefaultProps(){
    return ({
      roleList: [],
      notificationList: Map(),
      show: false, //是否显示
    })
  },
  getInitialState(){
    return ({
      roleIndex: 0,
      notificationTypeIndex: 1,
      notificationStateIndex: 0,
      notificationListState: Map(),
      messageMode: MESSAGE_MODE.RECEIVE,
      messageGroup: MESSAGE_GROUP.DEFAULT,
    })
  },
  componentWillMount(){
    this.handleSwitchRole(0, true)
  },
  //传给子组件直到提供给NoticeItem调用
  handleContainerClose(){
    this.props.onCancel()
  },
  // 选择事务角色需要获取该角色的消息，消息类型、消息状态不变
  handleSwitchRole(roleIndex, firstTime){
    const mode = this.getMessageMode()
    // 如果消息类型是所有或者通知，则需要清空原本角色的通知的消息提示数量(第一次进入不需要清空通知的数量提示)
    if (!firstTime && (this.getNotificationType() == 'all' || this.getNotificationType() == 'notice')) {
      this.props.clearNoticeNews(this.getRoleId(), mode)
    }

    this.setState({
      roleIndex: roleIndex,
    }, () => {
      // 初次切换角色需要加载角色消息数量

      if (this.props.notificationList.getIn(['news', this.getRoleId(), mode, 'notice']) == null) {
        this.props.initializeRoleNotification(this.getRoleId(), mode).then(() => {
          this.fetchMessage()
        })
      } else {
        this.fetchMessage()
      }
    })
  },
  handleSwitchMessageMode(mode){
    const roleId = this.getRoleId()

    this.clearNoticeNews()

    this.setState({
      messageMode: mode,
    }, () => {
      // 初次切换需要加载角色消息数量
      if (this.props.notificationList.getIn(['news', roleId, mode, 'notice']) == null) {
        this.props.initializeRoleNotification(roleId, this.getMessageMode()).then(() => {
          this.fetchMessage()
        })
      } else {
        this.fetchMessage()
      }
    })
  },
  // 选择消息类型后的回调
  handleSwitchNotificationType(index){
    this.clearNoticeNews()

    this.setState({
      notificationTypeIndex: index,
    }, () => {
      this.fetchMessage()
    })
  },
  handleSwitchMessageGroup(val){
    this.setState({
      messageGroup: val,
    }, () => {
      this.fetchMessage()
    })
  },
  handleSwitchMessageState(index){
    this.clearNoticeNews()
    this.setState({
      notificationStateIndex: index,
    }, () => {
      this.fetchMessage()
    })
  },
  // 再次加载
  handleLoad(){
    this.fetchMessage()
  },
  fetchMessage() {

    // todo sender
    // 把标记为缓冲已读的消息更新为真正的已读状态
    this.props.flushNotificationList()


    const { notificationListState, notificationTypeIndex, notificationStateIndex, messageMode } = this.state

    // 如果是分组消息，跳转到分组处理
    if (this.isGroupMode()) {
      //this.fetchGroupMessage()
      return
    }

    // 发送方或接收方的默认分组（无分组）消息
    const roleId = this.getRoleId()
    const mode = this.getMessageMode()
    const type = this.getNotificationType()
    const state = this.getNotificationState()
    const currentListState = notificationListState.getIn([roleId, mode, type, state], Map())
    const time = currentListState.get('time', moment([3000]).valueOf())
    this.setState({ notificationListState: notificationListState.setIn([roleId, mode, type, state, 'isLoading'], true) })

    // get 参数
    let params = {}
    params['readState'] = notificationStateIndex
    params['sendTime'] = (time == null || time == '') ? moment([3000]).valueOf() : time
    params['limit'] = LOAD_MESSAGE_COUNT

    const requestURL =
      (messageMode == MESSAGE_MODE.RECEIVE) ?
        urlFormat(config.api.message.get(notificationTypeIndex, roleId), params)
      :
        urlFormat(config.api.message.sender.get(notificationTypeIndex, roleId), params)
    fetch(requestURL, {
      method: 'GET',
      json: true,
    }).then((res) => res.json()).then((res) => {
      if (res.code != 0) {
        return
      }
      const data = res.data.notices.sort((a, b) => (b.sendTime - a.sendTime))
      const hasMore = res.data.hasMore
      const earliestTime = data.length > 0 ? data[data.length - 1].sendTime : ''
      // 更新 redux state
      this.props.updateNotificationList(roleId, mode, data)
      //
      const nextNotificationListState = notificationListState.setIn([roleId, mode, type, state], fromJS({
        time: earliestTime,
        isLoading: false,
        hasMore: hasMore,
      }))
      this.setState({
        notificationListState: nextNotificationListState
      })
    })

    // 如果是获取(所有消息||通知)&&非已读消息情况，则需要标记所有通知为已读
    const shouldMarkAsRead = ((type == 'all' || type == 'notice') && state != 'read')
    if (shouldMarkAsRead) {
      // notice的typeNum == 1
      fetch(config.api.message.readAll(1, roleId, time), {
        method: 'PUT',
        json: true,
      }).then((res) => (res.json()))
        .then(() => {
          let messageList = this.props.notificationList.getIn([roleId, mode], Map())
          messageList = messageList.map((message) => {
            if (message.get('msgType') == MSG_TYPE.NOTICE && message.get('readState') == READ_STATE.UNREAD) {
              message = message.set('readFlush', true)
            }
            return message
          })
          this.props.updateNotificationList(roleId, mode, messageList)
        })
    }
  },
  fetchGroupMessage(){
    const { messageGroup } = this.state
    fetch(config.api.message.sender.getByGroup(messageGroup, this.getRoleId()), {
      method: 'GET',
      json: true,
    }).then((res) => (res.json()))
      .then((json) => {
        if (json.code == 0) {
          this.setState({ groupList: json.data.groups })
        }
      })
  },
  clearNoticeNews(){
    const roleId = this.getRoleId()
    const mode = this.getMessageMode()
    // 如果原本的消息类型是所有或者通知，则需要清空通知的消息提示数量
    if (this.getNotificationType() == 'all' || this.getNotificationType() == 'notice') {
      this.props.clearNoticeNews(roleId, mode)
    }
  },
  getRoleId(){
    const { roleList } = this.props
    const { roleIndex } = this.state
    return roleList.get(roleIndex).get('roleId')
  },
  getNotificationType(){
    const { notificationTypeIndex } = this.state
    const type = NOTIFICATION_TYPES[notificationTypeIndex]
    return type
  },
  getNotificationState(){
    const { notificationStateIndex } = this.state
    const state = NOTIFICATION_STATES[notificationStateIndex]
    return state
  },
  getCurrentListState(){
    const { notificationListState } = this.state
    const roleId = this.getRoleId()
    const mode = this.getMessageMode()
    const type = this.getNotificationType()
    const state = this.getNotificationState()
    return notificationListState.getIn([roleId, mode, type, state], Map())
  },
  getMessageMode(){
    const { messageMode } = this.state
    return MESSAGE_MODES[messageMode]
  },
  getMessageGroupName(){
    const { messageGroup } = this.state
    // messageGroup有1位偏移
    return MESSAGE_GROUP_NAME[Number.parseInt(messageGroup) + 1]
  },
  isGroupMode(){
    const { messageMode, messageGroup } = this.state
    return messageMode == MESSAGE_MODE.SEND && messageGroup != MESSAGE_GROUP.DEFAULT
  },
  render() {
    const { roleList, notificationList } = this.props
    const { roleIndex, notificationTypeIndex, notificationStateIndex, messageMode, messageGroup } = this.state
    const roleId = this.getRoleId()
    const mode = this.getMessageMode()
    const type = this.getNotificationType()
    const state = this.getNotificationState()

    const currentListState = this.getCurrentListState()
    //const time = currentListState.get('time')
    const isLoading = currentListState.get('isLoading')
    const hasMore = currentListState.get('hasMore')

    const messageGroupName = this.getMessageGroupName()

    // 根据角色、消息类型和状态获取当前要显示的消息
    const typeFilter = (type == 'all') ? () => {return true} : (message) => (message.get('msgType') == notificationTypeIndex)
    let stateFilter = null
    if (state == NOTIFICATION_STATES[0]) {
      stateFilter = () => (true)
    } else if (state == NOTIFICATION_STATES[1]) {
      stateFilter = (message) => (message.get('readState') == READ_STATE.READ || message.get('readFlush') == true)
    } else if (state == NOTIFICATION_STATES[2]) {
      stateFilter = (message) => (message.get('readState') == READ_STATE.UNREAD)
    } else if (state == NOTIFICATION_STATES[3]) {
      stateFilter = (message) => (message.get('state') == HANDLE_STATE.UNHANDLED)
    } else if (state == NOTIFICATION_STATES[4]) {
      stateFilter = (message) => (message.get('state') == HANDLE_STATE.HANDLED)
    }

    const currentList = notificationList.getIn([roleId, mode], List()).filter(typeFilter).filter(stateFilter)

    return (
      <div className={styles.container}>
        {/* 左侧nav选择事务角色 */}
        <div className={styles.navigation}>
          <div className={styles.titleGroup}>
            <div className={styles.title}>消息中心</div>
            <div className={messageMode == MESSAGE_MODE.RECEIVE ? `${styles.tabGroup} ${styles.switchedTabGroup}` : `${styles.tabGroup}`}>
              <div className={styles.tabContent}>
                <div className={styles.send}>
                  发送方
                  <div className={styles.sign} onClick={() => {this.handleSwitchMessageMode(MESSAGE_MODE.RECEIVE)}}>{'>'}</div>
                </div>
                <div className={styles.receive}>
                  <div className={styles.sign} onClick={() => {this.handleSwitchMessageMode(MESSAGE_MODE.SEND)}}>{'<'}</div>
                  接收方
                </div>
              </div>
            </div>
          </div>
          <div className={styles.navMask}>
            <div className={styles.navBlank} />
            <div className={styles.navBar}>
              <Motion style={{ top: spring(45 * roleIndex) }}>
                {(interpolatingStyle) => <div className={styles.selectPointer} style={{ top: interpolatingStyle.top }} />}
              </Motion>
              {roleList.map((role, index) => {
                const style = index == roleIndex ? `${styles.navItem} ${styles.navItemSelected}` : styles.navItem
                const roleId = role.get('roleId')
                const newsCount = notificationList.getIn(['news', roleId, mode, 'all'], 0)
                const title = `${role.get('affairName')}-${role.get('roleName')}`
                return (
                  <div className={style} key={index} onClick={() => {this.handleSwitchRole(index)}}>
                    <Tooltip key={index} title={title} placement="right">
                      <div className={styles.text}>{title}</div>
                    </Tooltip>
                    {newsCount > 0 ? <div className={styles.notice}>{newsCount > 99 ? '99+' : newsCount}</div> : null}
                  </div>
                )
              })}
            </div>
            <div className={styles.navBlank} />
          </div>
        </div>
        {/* 右侧内容框 */}
        <div className={styles.content}>
          {/* 上侧工具栏，包括按钮、选择以及关闭 */}
          <div className={styles.bar}>
            <div className={styles.tool}>
              <div className={styles.buttonGroup}>
                {NOTIFICATION_NAMES.map((notificationName, index) => {
                  const currentType = NOTIFICATION_TYPES[index]
                  const notificationNum = notificationList.getIn(['news', roleId, mode, currentType], 0)
                  const width = (notificationNum == null || notificationNum == 0) ? 60 : 80
                  const style = index == notificationTypeIndex ? `${styles.button} ${styles.buttonSelected}` : styles.button
                  return (
                    <div className={style} key={index} style={{ width: width }} onClick={() => {this.handleSwitchNotificationType(index)}}>
                      {notificationName}
                      {(notificationNum && notificationNum != 0) ?
                        <span>
                          <span style={{ color: '#f55b6c' }}>({notificationNum > 99 ? '99+' : notificationNum})</span>
                        </span>
                      :
                          null
                      }
                    </div>
                  )
                })}
              </div>

              <div className={styles.rightGroup}>
                {messageMode == MESSAGE_MODE.SEND &&
                  <Select className={styles.select} value={messageGroupName} onSelect={(val) => {this.handleSwitchMessageGroup(val)}}>
                    {MESSAGE_GROUP_NAME.map((value, index) => {
                      return (
                        <Option key={index} value={`${MESSAGE_GROUP_VALUE[index]}`}>{value}</Option>
                      )
                    })}
                  </Select>
                }
                <Select className={styles.select} defaultValue={NOTIFICATION_STATE_NAME[0]} onChange={(index) => {this.handleSwitchMessageState(index)}}>
                  {NOTIFICATION_STATE_NAME.map((value, index) => {
                    return (
                      <Option key={index} value={`${index}`}>{value}</Option>
                    )
                  })}
                </Select>
              </div>
            </div>
            <Icon type="close" onClick={() => {this.props.onCancel()}} className={styles.closeButton} />
          </div>
          {/* 下侧通知列表 */}
          <div className={styles.listContent}>
            {!this.isGroupMode() ?
              <NoticeListContainer
                notificationList={currentList}
                mode={mode}
                type={type}
                roleId={roleId}
                isLoading={isLoading}
                hasMore={hasMore}
                handleLoad={() => {this.handleLoad()}}
                handleContainerClose={() => {this.handleContainerClose()}}
                updateNotificationList={(roleId, mode, data) => {this.props.updateNotificationList(roleId, mode, data)}}
              />
            :
              <NoticeGroupContainer
                notificationList={currentList}
                key={`${type}${roleId}${messageGroup}${state}`}
                mode={mode}
                type={notificationTypeIndex}
                state={notificationStateIndex}
                roleId={roleId}
                groupType={messageGroup}
                handleContainerClose={() => {this.handleContainerClose()}}
                updateNotificationList={(roleId, mode, data) => {this.props.updateNotificationList(roleId, mode, data)}}
              />
            }
          </div>
        </div>
      </div>
    )
  },
})

function mapStateToProps(state) {
  return {
    userId: state.getIn(['user', 'id']),
    roleList: state.getIn(['user', 'roles']),
    notificationList: state.get('notifications'),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    updateNotificationList: bindActionCreators(updateNotificationList, dispatch),
    flushNotificationList: bindActionCreators(flushNotificationList, dispatch),
    clearNoticeNews: bindActionCreators(clearNoticeNews, dispatch),
    initializeRoleNotification: bindActionCreators(initializeRoleNotification, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NoticeContainer)
