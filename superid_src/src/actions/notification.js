//import realtime from 'leancloud-realtime'
import config from '../config'
import urlFormat from 'utils/urlFormat'
import { store } from 'client'

export const READ_STATE = {
  ALL: 0,
  READ: 1,
  UNREAD: 2,
}
export const HANDLE_STATE = {
  UNHANDLED: 1,
  AGREE: 2,
  REFUSE: 3,
  HANDLED: 4,
}
export const MSG_TYPE = {
  ALL: 0,
  NOTICE: 1,
  INVITATION: 2,
  MATERIAL: 3,
  FUNDS: 4,
  AUDIT: 5,
}
export const MESSAGE_MODE = {
  SEND: 0,
  RECEIVE: 1,
}
export const MESSAGE_GROUP = {
  DEFAULT: -1,
  ROLE: 0,
  TASK: 1,
}
export const MESSAGE_MODES = ['send', 'receive']
export const MSG_TYPE_NAME = ['all', 'notice', 'invitation', 'material', 'funds', 'audit']

const DETAIL_MESSAGE = {
  DEFAULT: 0,
  DETAIL: 1,
}

export const UPDATE_NOTIFICATION_LIST = 'UPDATE_NOTIFICATION_LIST'
export function updateNotificationList(roleId, mode, data) {
  return (dispatch) => {
    dispatch({
      type: UPDATE_NOTIFICATION_LIST,
      payload: {
        roleId: roleId,
        mode: mode,
        data: data,
      },
    })
  }
}

export const FLUSH_NOTIFICATION_LIST = 'FLUSH_NOTIFICATION_LIST'
export function flushNotificationList() {
  return (dispatch) => {
    dispatch({
      type: FLUSH_NOTIFICATION_LIST,
    })
  }
}

export const CLEAR_NOTICE_NEWS = 'CLEAR_NOTICE_NEWS'
export function clearNoticeNews(roleId, mode) {
  return (dispatch) => {
    dispatch({
      type: CLEAR_NOTICE_NEWS,
      payload: {
        roleId: roleId,
        mode: mode,
      },
    })
  }
}

export const RECEIVE_CONFERENCE_INVITATION = 'RECEIVE_CONFERENCE_INVITATION'
// const SYSTEM_CONVERSATION_ID = '5980451a570c350057e51d45'
// let rt
// let conversation
// export function initializeNotificationCenter(userId) {
//   return (dispatch) => {
//     // Use random namespace
//     // userId = uuidv5(userId.toString(), '4ae111ec-0ee9-46f8-ac0c-e5cf8f4309af')
//
//     // 注册消息推送服务
//     fetch(config.api.message.connect(), {
//       method: 'POST',
//       json: true,
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         userId: userId,
//         channel: 'public',
//         tenantId: userId,
//       })
//     }).then((res) => {
//       return res.json()
//     }).then((json) => {
//       const { convId } = json.data
//
//       rt = realtime({
//         appId: config.LEAN_CLOUD_APP_ID,
//         clientId: userId,
//       })
//
//       rt && rt.on('open', () => {
//         // Connnect to system notification center.
//         conversation = rt.conv(convId, (data) => {
//           // conversation.list((data) => console.log(data))
//
//           if (data) {
//             data.log((logs) => {
//               if (logs) {
//                 // console.log(logs)
//               }
//             })
//           }
//         })
//
//         dispatch({
//           type: INITIALIZE_NOTIFICATION_CENTER_SUCCESS,
//         })
//
//         rt.on('message', (message) => {
//           let notification = message.msg.attr
//
//           if (notification.resourceType === 8) {
//             dispatch({
//               type: RECEIVE_CONFERENCE_INVITATION,
//               payload: notification,
//             })
//           }
//
//           /* 由于推送服务的稳定性，测试要求在100环境也加上推送的log记录，在发布版本需要删掉 */
//           console.log('DEBUG: 推送服务推送了一条消息')
//           console.log({
//             message: notification,
//             childMessage: notification.detailMessageType == DETAIL_MESSAGE.DETAIL,
//             mode: notification.isSender ? MESSAGE_MODES[MESSAGE_MODE.SEND] : MESSAGE_MODES[MESSAGE_MODE.RECEIVE]
//           })
//           // detailMessageType用来判断是否是详细消息(子消息)
//           dispatch({
//             type: UPDATE_NOTIFICATION_LIST,
//             payload: {
//               roleId: notification.detailMessageType == DETAIL_MESSAGE.DETAIL ? notification.roleId : notification.receiverRoleId,
//               data: [notification],
//               isPushedMessage: true,
//               isDetailMessage: notification.detailMessageType == DETAIL_MESSAGE.DETAIL,
//               mode: notification.isSender ? MESSAGE_MODES[MESSAGE_MODE.SEND] : MESSAGE_MODES[MESSAGE_MODE.RECEIVE]
//             },
//           })
//         })
//
//       })
//
//       rt && rt.on('close', () => {
//         console.log('close!')
//       })
//     })
//
//
//   }
// }

/* eslint-disable */
export function onMessage(notification) {
  const dispatch = store.dispatch

  if (notification.optional) {
    try {
      notification.optional = JSON.parse(notification.optional)
    } catch(e) {}
  }

  if (notification.resourceType === 8) {
    dispatch({
      type: RECEIVE_CONFERENCE_INVITATION,
      payload: notification,
    })
  }

  /* 由于推送服务的稳定性，测试要求在100环境也加上推送的log记录，在发布版本需要删掉 */
  console.log('DEBUG: 推送服务推送了一条消息')
  console.log({
    message: notification,
    childMessage: notification.detailMessageType == DETAIL_MESSAGE.DETAIL,
    mode: notification.isSender ? MESSAGE_MODES[MESSAGE_MODE.SEND] : MESSAGE_MODES[MESSAGE_MODE.RECEIVE]
  })
  // detailMessageType用来判断是否是详细消息(子消息)
  dispatch({
    type: UPDATE_NOTIFICATION_LIST,
    payload: {
      roleId: notification.detailMessageType == DETAIL_MESSAGE.DETAIL ? notification.roleId : notification.receiverRoleId,
      data: [notification],
      isPushedMessage: true,
      isDetailMessage: notification.detailMessageType == DETAIL_MESSAGE.DETAIL,
      mode: notification.isSender ? MESSAGE_MODES[MESSAGE_MODE.SEND] : MESSAGE_MODES[MESSAGE_MODE.RECEIVE]
    },
  })
}
/* eslint-enable */

export const INITIALIZE_USER_NOTIFICATION = 'INITIALIZE_USER_NOTIFICATION'
export function initializeUserNotification(userId) {
  return (dispatch) => {
    fetch(config.api.message.sender.userNotification(userId), {
      method: 'GET',
      json: true,
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then((res) => (res.json()))
      .then((json) => {
        if (json.code == 0) {
          dispatch({
            type: INITIALIZE_USER_NOTIFICATION,
            payload: {
              mode: MESSAGE_MODES[MESSAGE_MODE.SEND],
              data: json.data,
            },
          })
        }
      })
    fetch(config.api.message.userNotification(userId), {
      method: 'GET',
      json: true,
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then((res) => (res.json()))
      .then((json) => {
        if (json.code == 0) {
          dispatch({
            type: INITIALIZE_USER_NOTIFICATION,
            payload: {
              mode: MESSAGE_MODES[MESSAGE_MODE.RECEIVE],
              data: json.data,
            },
          })
        }
      })
  }
}

export const INITIALIZE_ROLE_NOTIFICATION = 'INITIALIZE_ROLE_NOTIFICATION'
export function initializeRoleNotification(roleId, mode) {
  return (dispatch) => {
    const url =
      mode == MESSAGE_MODES[MESSAGE_MODE.SEND] ?
        config.api.message.sender.roleNotification(roleId)
      :
        config.api.message.roleNotification(roleId)
    return fetch(url, {
      method: 'GET',
      json: true,
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then((res) => (res.json()))
      .then((json) => {
        if (json.code == 0) {
          let data = {}
          const MESSAGE_TYPES = {
            0: 'all',
            1: 'notice',
            2: 'invitation',
            3: 'material',
            4: 'funds',
            5: 'audit',
          }
          json.data.forEach((obj) => {
            const type = MESSAGE_TYPES[obj.msgType]
            data[type] = obj.count
          })
          data = {
            all: 0,
            notice: 0,
            invitation: 0,
            material: 0,
            funds: 0,
            audit: 0,
            ...data
          }
          dispatch({
            type: INITIALIZE_ROLE_NOTIFICATION,
            payload: {
              roleId: roleId,
              data: data,
              mode: mode,
            },
          })
        }
      })
  }
}

export const INITIALIZE_AFFAIR_DYNAMIC = 'INITIALIZE_AFFAIR_DYNAMIC'
export function initializeAffairDynamic(userId = 0, affairIds = []) {
  return (dispatch) => fetch(config.api.message.initialAffairDynamic(), {
    method: 'POST',
    json: true,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      affairIds,
    })
  })
    .then((res) => (res.json()))
    .then((json) => {
      if (json.code == 0) {
        const originalList = json.data
        let hasMoreMap = {}
        let noticeList = []
        originalList.forEach((obj) => {
          hasMoreMap[obj.affairId] = obj.hasMore
          noticeList = noticeList.concat(obj.notices)
        })
        dispatch({
          type: INITIALIZE_AFFAIR_DYNAMIC,
          payload: {
            hasMoreMap,
            noticeList
          }
        })
      }
    })
}

export const FETCH_MORE_DYNAMIC = 'FETCH_MORE_DYNAMIC'
export const FETCH_MORE_DYNAMIC_SUCCESS = 'FETCH_MORE_DYNAMIC_SUCCESS'
export function fetchMoreDynamic(userId, affairId, unreadTime = 0, readTime = 0, limit = 10) {
  return (dispatch) => {
    dispatch({
      type: FETCH_MORE_DYNAMIC,
      payload: {
        affairId
      }
    })
    return fetch(urlFormat(config.api.message.moreDynamic(), {
      userId,
      affairId,
      unreadTime,
      readTime,
      limit
    }), {
      method: 'GET'
    }).then((res) => (res.json()))
      .then((json) => {
        if (json.code == 0) {
          dispatch({
            type: FETCH_MORE_DYNAMIC_SUCCESS,
            payload: {
              affairId,
              hasMore: json.data.hasMore,
              noticeList: json.data.notices
            }
          })
        }
      })
  }
}
