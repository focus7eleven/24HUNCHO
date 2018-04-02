import { fromJS, Map, List } from 'immutable'
import {
  UPDATE_NOTIFICATION_LIST,
  FLUSH_NOTIFICATION_LIST,
  CLEAR_NOTICE_NEWS,
  INITIALIZE_USER_NOTIFICATION,
  INITIALIZE_ROLE_NOTIFICATION,
  INITIALIZE_AFFAIR_DYNAMIC,
  FETCH_MORE_DYNAMIC,
  FETCH_MORE_DYNAMIC_SUCCESS,
} from '../actions/notification'
import { LOGOUT_SUCCESS } from '../actions/user'
import { READ_STATE, MSG_TYPE, MSG_TYPE_NAME } from '../actions/notification'

// state: 0 - 未读, 1 - 已读
// type: 1 - @我的, 2 - 任务提醒, 3 - 系统通知
const initialState = Map()

const mergeNoticeListToState = (state, noticeList) => {
  fromJS(noticeList)
    .map((notice) => notice.set('dynamicShow', true))
    .groupBy((notice) => notice.get('receiverRoleId'))
    .mapEntries(([, list]) => [list.getIn([0, 'receiverRoleId']), list])
    .forEach((noticeList, roleId) => {
      state = state
        .updateIn([roleId, 'receive'], (list) => {
          if (list == null) return noticeList.map((msg) => msg.set('mode', 'receive'))
          noticeList.forEach((newMessage) => {
            newMessage = newMessage.set('mode', 'receive')
            const newMessageId = newMessage.get('noticeId')
            const newMessageIndex = list.findIndex((message) => (message.get('noticeId') == newMessageId))
            if (newMessageIndex >= 0) {
              list = list.set(newMessageIndex, list.get(newMessageIndex).mergeDeep(newMessage))
            } else {
              list = list.push(newMessage)
            }
          })
          return list
        })
        .sort((a, b) => b.get('sendTime') - a.get('sendTime'))
        .updateIn([roleId, 'send'], (list) => list == null ? List() : list)
    })
  return state
}

export default (state = initialState, action) => {
  let roleId, data, isPushedMessage, isDetailMessage, newMessageId, newMessageIndex, noticeCount, index, newDetail, notice
  let mode = 'exception'

  switch (action.type) {
    case UPDATE_NOTIFICATION_LIST:
      roleId = action.payload.roleId
      data = action.payload.data
      mode = action.payload.mode
      isPushedMessage = action.payload.isPushedMessage
      isDetailMessage = action.payload.isDetailMessage
      // 如果不存在列表，初始化
      if (state.get(roleId) == null) {
        state = state.set(roleId, fromJS({ 'send': [], 'receive': [] }))
      }

      // 如果推送的是发送方子消息, 则需要合并到发送方消息对应的父消息中
      if (isPushedMessage && isDetailMessage) {
        newDetail = fromJS(data[0]).set('mode', mode)
        index = state
          .getIn([roleId, mode], List())
          .findIndex((message) => (newDetail.get('fNoticeId') == message.get('noticeId')))
        // 如果消息列表中存在父消息，则标记父消息为未读，增加未读消息数量1，更新父消息发送时间，并且将子消息合并到消息列表中(根据id查找，存在则覆盖，否则在末尾添加)
        if (index >= 0) {
          notice = state.getIn([roleId, mode, index])
          //如果完全一样的子消息已存在，则不更新(后端推送可能推送重复消息)
          if (notice.get('details', List()).some((item) => item.equals(newDetail))) {
            return
          }
          //父消息未读,则不能更新未读消息数量
          if (!notice.get('readState') == READ_STATE.UNREAD) {
            state = state
              .updateIn(['news', roleId, mode, MSG_TYPE_NAME[notice.get('msgType')]], (val) => (val != null ? val + 1 : null))
              .updateIn(['news', roleId, mode, 'all'], (val) => (val != null ? val + 1 : 1))
          }
          return state.updateIn(
            [roleId, mode, index],
            (message) => {
              return message.set('readState', READ_STATE.UNREAD)
                .set('sendTime', newDetail.get('sendTime'))
                .set('noticeShow', true)
                .update('details', List(), (details) => {
                  index = details.findIndex((detail) => (newDetail.get('noticeId') == detail.get('noticeId')))
                  if (index >= 0) {
                    return details.set(index, newDetail)
                  } else {
                    return details.push(newDetail)
                  }
                })
            }
          )
        } else {
          return state
        }
      }
      // 非推送发送方子消息的情况
      // 查找是否存在同id的消息，如果存在则覆盖，否则在列表末尾添加,
      // 如果是两条全等的消息，则不处理（后端推送存在问题，可能多次推送同一条消息）
      // 如果是推送的消息，左侧动态中也需要显示
      data.forEach((newMessage) => {
        let isSameMessage = false
        newMessage = fromJS(newMessage).set('noticeShow', true).set('mode', mode)
        if (isPushedMessage) newMessage = newMessage.set('dynamicShow', true).set('readFlush', false)
        newMessageId = newMessage.get('noticeId')
        state = state.updateIn([roleId, mode], (list) => {
          list = (list == null) ? List() : list
          newMessageIndex = list.findIndex((message) => (message.get('noticeId') == newMessageId))
          if (newMessageIndex >= 0) {
            isSameMessage = list.get(newMessageIndex).equals(newMessage)
            list = list.set(newMessageIndex, list.get(newMessageIndex).mergeDeep(newMessage))
          } else {
            list = list.push(newMessage)
          }
          return list
        })
        // 如果是推送的消息&&未读消息，需要增加新消息数
        if (isPushedMessage && newMessage.get('readState') != READ_STATE.READ && !isSameMessage) {
          state = state.updateIn(['news', roleId, mode, MSG_TYPE_NAME[newMessage.get('msgType')]], (val) => (val != null ? val + 1 : null))
          state = state.updateIn(['news', roleId, mode, 'all'], (val) => (val != null ? val + 1 : 1))
        }
        // 如果是读缓冲消息&&非通知，则减少新消息数
        if (newMessage.get('readFlush') && newMessage.get('msgType') != MSG_TYPE.NOTICE) {
          state = state.updateIn(['news', roleId, mode, MSG_TYPE_NAME[newMessage.get('msgType')]], (val) => (val != null ? Math.max(val - 1, 0) : null))
          state = state.updateIn(['news', roleId, mode, 'all'], (val) => (val != null && val > 0 ? val - 1 : 0))
        }
      })
      // 按时间排序
      state = state.updateIn([roleId, mode], (list) => (list.sort((a, b) => (b.get('sendTime') - a.get('sendTime')))))
      return state

    case FLUSH_NOTIFICATION_LIST:
      state = state.map((role, k) => {
        return isNaN(k) ? role : role.map((mode) => {
          return mode.map((message) => {
            return message.get('readFlush') == true ? message.set('readFlush', false).set('readState', READ_STATE.READ) : message
          })
        })
      })
      return state
    case CLEAR_NOTICE_NEWS:
      roleId = action.payload.roleId
      mode = action.payload.mode
      noticeCount = state.getIn(['news', roleId, mode, 'notice'], 0)
      if (noticeCount != 0) {
        state = state
      .updateIn(['news', roleId, mode, 'all'], (val) => {
        return val - noticeCount
      })
      .setIn(['news', roleId, mode, 'notice'], 0)
      }
      return state

    case INITIALIZE_USER_NOTIFICATION:
      mode = action.payload.mode
      action.payload.data.forEach((obj) => {
        state = state.setIn(['news', obj.roleId, mode, 'all'], obj.count)
      })
      return state
    case INITIALIZE_ROLE_NOTIFICATION:
      roleId = action.payload.roleId
      mode = action.payload.mode
      data = action.payload.data
      state = state.setIn(['news', roleId, mode], fromJS(data))
      return state
    case INITIALIZE_AFFAIR_DYNAMIC:
      state = state.set('affairHasMoreMap', fromJS(action.payload.hasMoreMap))
      return mergeNoticeListToState(state, action.payload.noticeList)
    case FETCH_MORE_DYNAMIC:
      state = state.update('affairLoadingMap', (map) => (map || Map()).set(action.payload.affairId + '', true))
      return state
    case FETCH_MORE_DYNAMIC_SUCCESS:
      state = state.update('affairLoadingMap', (map) => (map || Map()).set(action.payload.affairId + '', false))
      state = state.setIn(['affairHasMoreMap', action.payload.affairId + ''], action.payload.hasMore)
      return mergeNoticeListToState(state, action.payload.noticeList)
    case LOGOUT_SUCCESS:
      state = Map()
      return state
    default:
      return state
  }
}
