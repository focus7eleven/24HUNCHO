import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styles from './NoticeContainer.scss'
import urlFormat from 'urlFormat'
import { DropUpIcon } from 'svg'
import { Motion, spring } from 'react-motion'
import {
  updateNotificationList,
  flushNotificationList,
  clearNoticeNews,
  initializeRoleNotification,
  getNotificationOfType,
  readAll,
  READ_STATE,
  MSG_TYPE
} from '../../../actions/notification'
import { AFFAIR_TYPE } from '../../header/HeaderContainer'
import { fromJS, List, Map } from 'immutable'
import moment from 'moment'
import { Select, Tooltip, Spin } from 'antd'
import NoticeListContainer from './NoticeListContainer'
const Option = Select.Option

const NOTIFICATION_NAMES = ['全部','', '', '', '', '', '', '', '课程', '小组', '评论']
const NOTIFICATION_TYPES = ['all','', '', '', '', '', '', '', 'course', 'group', 'comment']
const NOTIFICATION_STATE_NAME = ['所有消息', '已读消息', '未读消息']
const NOTIFICATION_STATES = ['', 'READ', 'UNREAD']
const LOAD_MESSAGE_COUNT = 20


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

class NoticeContainer extends React.Component{

  state = {
    roleIndex: 0,
    notificationTypeIndex: 8,
    notificationStateIndex: 0,
    notificationListState: Map(),
    isInitializing: true,
    // messageMode: MESSAGE_MODE.RECEIVE,
    // messageGroup: MESSAGE_GROUP.DEFAULT,
  }
  componentWillMount(){
    /*
      消息一系列接口调用为superid原先的接口，
      过滤那些superid中独有的角色因为某些操作而收到的tss无法处理的消息
      redux store 里的 user, roles 中只包含tss相关的角色
     */
    const { roleList, notificationList } = this.props
    const news = notificationList.get('news')
    news && news.keySeq().forEach((roleId) => {
      const r = roleList.find((v) => {
        return v.get('roleId') == roleId
      })
      if (!r) {
        this.props.readAll(0, roleId, moment([3000]).valueOf())
        this.props.clearNoticeNews(roleId, 'all')
      }
    })

    /*
      为了处理在rolelist中的角色，但是initializeusernotification（只获取all消息数量）的时候
      这些消息的type可能不是8，9，10，但是只有all无法判断，
      所以在刚进来的时候所有role都调一次根据roleid获取各种类型消息数量的接口，过滤调那些跟tss无关的消息类型
     */
    let promiseList = []
    roleList.forEach((role) => {
      promiseList.push(this.props.initializeRoleNotification(role.get('roleId')))
    })
    Promise.all(promiseList).then((res=>{
      this.setState({
        isInitializing: false,
      })
    }))
    this.handleSwitchRole(0, true)
  }
  //传给子组件直到提供给NoticeItem调用
  handleContainerClose(){
    this.props.onCancel()
  }
  // 选择事务角色需要获取该角色的消息，消息类型、消息状态不变
  handleSwitchRole(roleIndex, firstTime){
    // const mode = this.getMessageMode()
    // 如果消息类型是所有或者通知，则需要清空原本角色的通知的消息提示数量(第一次进入不需要清空通知的数量提示)
    if (!firstTime) {
      // this.props.clearNoticeNews(this.getRoleId(), this.getNotificationType())
      this.clearNoticeNews()
    }

    this.setState({
      roleIndex: roleIndex,
    }, () => {
      // 初次切换角色需要加载角色消息数量
      if (this.props.notificationList.getIn(['news', this.getRoleId(), 'comment']) == null) {
        this.props.initializeRoleNotification(this.getRoleId()).then(() => {
          this.fetchMessage()
        })
      } else {
        this.fetchMessage()
      }
    })
  }
  // 选择消息类型后的回调
  handleSwitchNotificationType(index){

    this.clearNoticeNews().then(() => {
      this.setState({
        notificationTypeIndex: index,
      }, () => {
        this.fetchMessage()
      })
    })


  }
  handleSwitchMessageState(index){
    // this.props.clearNoticeNews(this.getRoleId(), this.getNotificationType())

      this.setState({
        notificationStateIndex: index,
      }, () => {
        this.fetchMessage()
      })

    // this.setState({
    //   notificationStateIndex: index,
    // })

  }
  // 再次加载
  handleLoad(){
    this.fetchMessage()
  }
  fetchMessage() {

    // 把标记为缓冲已读的消息更新为真正的已读状态
    this.props.flushNotificationList()

    const { notificationListState, notificationTypeIndex, notificationStateIndex } = this.state

    // 默认分组（无分组）消息
    const roleId = this.getRoleId()
    const type = this.getNotificationType()
    const state = this.getNotificationState()
    const currentListState = notificationListState.getIn([roleId, type, state], Map())
    const time = currentListState.get('time', moment([3000]).valueOf())
    this.setState({ notificationListState: notificationListState.setIn([roleId, type, state, 'isLoading'], true) })

    // get 参数
    let params = {}
    params['readState'] = notificationStateIndex
    params['sendTime'] = (time == null || time == '') ? moment([3000]).valueOf() : time
    params['limit'] = LOAD_MESSAGE_COUNT

    this.props.getNotificationOfType(notificationTypeIndex, roleId, params).then((res) => {
      if (res.code != 0) {
        return
      }
      const data = res.data.notices.sort((a, b) => (b.sendTime - a.sendTime))
      const hasMore = res.data.hasMore
      const earliestTime = data.length > 0 ? data[data.length - 1].sendTime : ''
      // 更新 redux state
      this.props.updateNotificationList(roleId, data)
      //
      const nextNotificationListState = notificationListState.setIn([roleId, type, state], fromJS({
        time: earliestTime,
        isLoading: false,
        hasMore: hasMore,
      }))
      this.setState({
        notificationListState: nextNotificationListState
      })

    })


  }
  clearNoticeNews(){
    const { notificationListState, notificationTypeIndex } = this.state
    const roleId = this.getRoleId()
    const notificationType = this.getNotificationType()
    const type = this.getNotificationType()
    const state = this.getNotificationState()

    const noticeList = this.props.notificationList.get(roleId)
    const time = (noticeList && noticeList.size != 0) ? noticeList.get(0).get('sendTime') : moment([3000]).valueOf()

    if (state == '' || state == 'UNREAD') {
      return this.props.readAll(notificationTypeIndex, roleId, time)
          .then(() => {
            let messageList = this.props.notificationList.getIn([roleId], List())
            messageList = messageList.map((message) => {
              if (notificationTypeIndex === MSG_TYPE.ALL) {
                message = message.set('readFlush', true)
              } else if (message.get('readState') == READ_STATE.UNREAD && message.get('msgType') == notificationTypeIndex) {
                message = message.set('readFlush', true)
              }
              return message
            })
            // this.props.clearNoticeNews(roleId, notificationType)
            this.props.updateNotificationList(roleId, messageList)

          }).then(() => {
            this.props.flushNotificationList()
          })
    } else {
      return new Promise((resolve, reject) => {
        resolve()
      })
    }

    // }
  }
  getRoleId(){
    const { roleList } = this.props
    const { roleIndex } = this.state
    return roleList.get(roleIndex) && roleList.get(roleIndex).get('roleId')
  }
  getNotificationType(){
    const { notificationTypeIndex } = this.state
    const type = NOTIFICATION_TYPES[notificationTypeIndex]
    return type
  }
  getNotificationState(){
    const { notificationStateIndex } = this.state
    const state = NOTIFICATION_STATES[notificationStateIndex]
    return state
  }
  getCurrentListState(){
    const { notificationListState } = this.state
    const roleId = this.getRoleId()
    const type = this.getNotificationType()
    const state = this.getNotificationState()
    return notificationListState.getIn([roleId, type, state], Map())
  }
  // getMessageMode(){
  //   const { messageMode } = this.state
  //   return MESSAGE_MODES[messageMode]
  // }
  // getMessageGroupName(){
  //   const { messageGroup } = this.state
  //   // messageGroup有1位偏移
  //   return MESSAGE_GROUP_NAME[Number.parseInt(messageGroup) + 1]
  // }
  // isGroupMode(){
  //   const { messageMode, messageGroup } = this.state
  //   return messageMode == MESSAGE_MODE.SEND && messageGroup != MESSAGE_GROUP.DEFAULT
  // }
  render() {
    const { roleList, notificationList } = this.props
    const { roleIndex, notificationTypeIndex, notificationStateIndex, isInitializing } = this.state
    const roleId = this.getRoleId()
    const type = this.getNotificationType()
    const state = this.getNotificationState()

    const currentListState = this.getCurrentListState()
    //const time = currentListState.get('time')
    const isLoading = currentListState.get('isLoading')
    const hasMore = currentListState.get('hasMore')


    // 根据角色、消息类型和状态获取当前要显示的消息
    const typeFilter = (type == 'all') ? () => {return true} : (message) => (message.get('msgType') == notificationTypeIndex)
    let stateFilter = null
    if (state == NOTIFICATION_STATES[0]) {
      stateFilter = () => (true)
    } else if (state == NOTIFICATION_STATES[1]) {
      stateFilter = (message) => (message.get('readState') == READ_STATE.READ || message.get('readFlush') == true)
    } else if (state == NOTIFICATION_STATES[2]) {
      stateFilter = (message) => (message.get('readState') == READ_STATE.UNREAD)
    }
    const currentList = notificationList.getIn([roleId], List()).filter(typeFilter).filter(stateFilter)

    const currentRole = roleList.get(roleIndex)

    if (isInitializing) {
      return (
        <div style={{ textAlign: 'center', padding: 500, width: '100%' }}>
          <Spin style={{ margin: 'auto' }}/>
        </div>
      )
    }

    return (
      <div className={styles.container}>
        {/* 左侧nav选择事务角色 */}
        <div className={styles.navigation}>
          <div className={styles.titleGroup}>
            <div className={styles.title}>消息中心</div>
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
                const newsCount = notificationList.getIn(['news', roleId, 'all'], 0)
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
                  if (!notificationName) {
                    return null
                  }
                  const currentType = NOTIFICATION_TYPES[index]
                  const notificationNum = notificationList.getIn(['news', roleId, currentType], 0)
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
                <Select className={styles.select} defaultValue={NOTIFICATION_STATE_NAME[0]} onChange={(index) => {this.handleSwitchMessageState(index)}}>
                  {NOTIFICATION_STATE_NAME.map((value, index) => {
                    return (
                      <Option key={index} value={`${index}`}>{value}</Option>
                    )
                  })}
                </Select>
              </div>
            </div>
            <div className={styles.close}>
              <div onClick={() => {this.props.onCancel()}}><DropUpIcon width="28" height="28"/></div>
            </div>
          </div>
          {/* 下侧通知列表 parentAffairId为该角色所处事务的父事务（课程->null/小组->课程） */}
          <div className={styles.listContent}>
            <NoticeListContainer
              notificationList={currentList}
              type={type}
              role={currentRole}
              isLoading={isLoading}
              hasMore={hasMore}
              handleLoad={() => {this.handleLoad()}}
              handleContainerClose={() => {this.handleContainerClose()}}
              updateNotificationList={(roleId, data) => { this.props.updateNotificationList(roleId, data);}}
            />
          </div>
        </div>
      </div>
    )
  }
}
NoticeContainer.defaultProps = {
  roleList: [],
  notificationList: Map(),
  show: false, //是否显示
}

function mapStateToProps(state) {
  return {
    userId: state.getIn(['user', 'id']),
    roleList: state.getIn(['user', 'roles']),
    notificationList: state.getIn(['notification']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    updateNotificationList: bindActionCreators(updateNotificationList, dispatch),
    flushNotificationList: bindActionCreators(flushNotificationList, dispatch),
    clearNoticeNews: bindActionCreators(clearNoticeNews, dispatch),
    initializeRoleNotification: bindActionCreators(initializeRoleNotification, dispatch),
    getNotificationOfType: bindActionCreators(getNotificationOfType, dispatch),
    readAll: bindActionCreators(readAll, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NoticeContainer)
