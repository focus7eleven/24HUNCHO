import { actionNames } from 'action-utils'
import { fromJS } from 'immutable'
import { notification } from 'antd'
import config from '../config'
import _ from 'lodash'
import realtime from 'leancloud-realtime'
import urlFormat from 'urlFormat'
import uuidv5 from 'uuid/v5'
import { store } from '../index'

const {
  tssURL,
  connectURL,
  baseURL,
  messageURL
} = config

const api = {
  myDeadlines: `${tssURL}/api/activity/getMyDeadlines`,

  notification: {
    connect: () => `${connectURL}/api/external/notification/channel/installation`,

    userNotification: (userId) => `${messageURL}/api/msg/${userId}/roles/count`,
    roleNotification: (roleId) => `${messageURL}/api/msg/${roleId}/count`,

    get: (type, roleId) => `${messageURL}/api/msg/${type}/${roleId}/all`,

    receiverReadOne: (messageId, senderRoleId) => `${baseURL}/notice/read?messageId=${messageId}&senderRoleId=${senderRoleId}`, // 接收方阅读单条消息需要调用此接口，其余的情况调用以下两个接口
    readOne: (messageId) => `${messageURL}/api/msg/${messageId}`,
    readAll: (type, roleId, time) => `${messageURL}/api/msg/${type}/${roleId}/updates?sendTime=${time}`,

  }


}

export const READ_STATE = {
  ALL: 0,
  READ: 1,
  UNREAD: 2,
}

export const MSG_TYPE = {
  ALL: 0,
  COMMENT: 10,
  COURSE: 8,
  GROUP: 9,
}

export const RESOURCE_TYPE = {
  ACTIVITY: 3,
  COURSE: 21,
  GROUP: 22,
}
// export const MESSAGE_MODE = {
//   SEND: 0,
//   RECEIVE: 1,
// }
// export const MESSAGE_GROUP = {
//   DEFAULT: -1,
//   ROLE: 0,
//   TASK: 1,
// }
// export const MESSAGE_MODES = ['send', 'receive']
export const MSG_TYPE_NAME = ['all', '', '', '', '', '', '', '', 'course', 'group', 'comment']

// const DETAIL_MESSAGE = {
//   DEFAULT : 0,
//   DETAIL: 1,
// }

export const UPDATE_NOTIFICATION_LIST = 'UPDATE_NOTIFICATION_LIST'
export function updateNotificationList(roleId, data) {
  return (dispatch) => {
    dispatch({
      type: UPDATE_NOTIFICATION_LIST,
      payload: {
        roleId: roleId,
        data: data.toJS ? data.toJS() : data,
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
export function clearNoticeNews(roleId, type) {
  return (dispatch) => {
    dispatch({
      type: CLEAR_NOTICE_NEWS,
      payload: {
        roleId: roleId,
        type: type,
      },
    })
  }
}

export const INITIALIZE_NOTIFICATION_CENTER_SUCCESS = 'INITIALIZE_NOTIFICATION_CENTER_SUCCESS'
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
//     fetch(api.notification.connect(), {
//       method: 'POST',
//       json: true,
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         userId: userId,
//         channel: "public",
//         tenantId: userId,
//       })
//     }).then(res => {
//       return res.json()
//     }).then(json => {
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
//           const notice = message.msg.attr
//
//           if (notice.resourceType === 8) {
//             dispatch({
//               type: RECEIVE_CONFERENCE_INVITATION,
//               payload: notice,
//             })
//           }
//
//           /* 由于推送服务的稳定性，测试要求在100环境也加上推送的log记录，在发布版本需要删掉 */
//           console.log('DEBUG: 推送服务推送了一条消息')
//           console.log({
//             notice: notice,
//             roleId: notice.receiverRoleId,
//           })
//           // setTimeout(() => {
//           //   console.log('after debug', notification.content)
//           // }, 1000)
//           // detailMessageType用来判断是否是详细消息(子消息)
//           dispatch({
//             type: UPDATE_NOTIFICATION_LIST,
//             payload: {
//               roleId: notice.receiverRoleId,
//               data: [notice],
//               isPushedMessage: true,
//               // isDetailMessage: notification.detailMessageType == DETAIL_MESSAGE.DETAIL,
//               // mode: notification.isSender ? MESSAGE_MODES[MESSAGE_MODE.SEND] : MESSAGE_MODES[MESSAGE_MODE.RECEIVE]
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
export function onMessage(notice) {
  const dispatch = store.dispatch

  if (notice.optional) {
    try {
      notice.optional = JSON.parse(notice.optional)
    } catch(e) {}
  }

  if (notice.resourceType === 8) {
    dispatch({
      type: RECEIVE_CONFERENCE_INVITATION,
      payload: notice,
    })
  }

  /* 由于推送服务的稳定性，测试要求在100环境也加上推送的log记录，在发布版本需要删掉 */
  console.log('DEBUG: 推送服务推送了一条消息')
  console.log({
    message: notice,
    roleId: notice.receiverRoleId
  })
  // detailMessageType用来判断是否是详细消息(子消息)
  dispatch({
    type: UPDATE_NOTIFICATION_LIST,
    payload: {
      roleId: notice.receiverRoleId,
      data: [notice],
      isPushedMessage: true,
    },
  })
}
/* eslint-enable */

export const INITIALIZE_USER_NOTIFICATION = 'INITIALIZE_USER_NOTIFICATION'
export function initializeUserNotification(userId) {
  return (dispatch) => {
    fetch(api.notification.userNotification(userId), {
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
            // mode: MESSAGE_MODES[MESSAGE_MODE.RECEIVE],
            data: json.data,
          },
        })
      }
    })
  }
}

export const INITIALIZE_ROLE_NOTIFICATION = 'INITIALIZE_ROLE_NOTIFICATION'
export function initializeRoleNotification(roleId) {
  return (dispatch) => {
    return fetch(api.notification.roleNotification(roleId), {
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
          8: 'course',
          9: 'group',
          10: 'comment',
        }
        // 此处直接获取的 all 类型的消息数量无法过滤非tss的消息，all 根据 msgType 8,9,10 三种消息的和来设置
        let allCount = 0
        json.data.forEach((obj) => {
          const type = MESSAGE_TYPES[obj.msgType]
          if (type && typeof type != 'undefined' && type !== 'all') {
            data[type] = obj.count
            allCount = allCount + obj.count
          }
        })

        data['all'] = allCount
        
        data = {
          all: 0,
          comment: 0,
          course: 0,
          group: 0,
          ...data
        }
        dispatch({
          type: INITIALIZE_ROLE_NOTIFICATION,
          payload: {
            roleId: roleId,
            data: data,
          },
        })
      }
    })
  }
}

// 获取某角色某种类型的消息通知
export const getNotificationOfType = (type, roleId, params) => dispatch => fetch(urlFormat(api.notification.get(type, roleId), params), {
  method: 'GET',
  json: true,
}).then(res => res.json())

// 已读全部
export const readAll = (type, roleId, time) => dispatch => fetch(api.notification.readAll(type, roleId, time), {
  method: 'PUT',
  json: true
}).then(res => res.json())

// 已读单条
export const readOne = (messageId, senderRoleId) => dispatch => fetch(api.notification.receiverReadOne(messageId, senderRoleId), {
  method: 'POST',
  json: true,
  credentials: 'include',
}).then(res => res.json())

export { rt as Realtime }


// 我的消息
export const getMyDeadlines = () => dispatch => fetch(api.myDeadlines, {
  method: 'GET',
}).then(res => res.json())
