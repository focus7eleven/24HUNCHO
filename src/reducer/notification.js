import { fromJS, Map, List } from 'immutable'
import { UPDATE_NOTIFICATION_LIST, FLUSH_NOTIFICATION_LIST, CLEAR_NOTICE_NEWS, INITIALIZE_USER_NOTIFICATION, INITIALIZE_ROLE_NOTIFICATION } from '../actions/notification'
import { LOGOUT_SUCCESS } from '../actions/user'
import { READ_STATE, MSG_TYPE, MSG_TYPE_NAME } from '../actions/notification'
import {
  GET_DEADLINE,
} from '../actions/notification'

// state: 0 - 未读, 1 - 已读
// type: 1 - @我的, 2 - 任务提醒, 3 - 系统通知
const initialState = Map()

export default (state = initialState, action) => {
	let roleId, data, isPushedMessage, isDetailMessage, newMessageId, newMessageIndex, noticeCount, index, newDetail, notice, type
	// let mode = 'exception'
  //
	switch (action.type) {
	case UPDATE_NOTIFICATION_LIST:
		roleId = action.payload.roleId
		data = action.payload.data
		// mode = action.payload.mode
		isPushedMessage = action.payload.isPushedMessage
		// 如果不存在列表，初始化
		if (state.get(roleId) == null) {
			state = state.set(roleId, List())
		}

		// 如果推送的是发送方子消息, 则需要合并到发送方消息对应的父消息中
		// if (isPushedMessage && isDetailMessage) {
		// 	newDetail = fromJS(data[0])
		// 	index = state
		// 		.getIn([roleId, mode], List())
		// 		.findIndex((message) => (newDetail.get('fNoticeId') == message.get('noticeId')))
		// 	// 如果消息列表中存在父消息，则标记父消息为未读，增加未读消息数量1，更新父消息发送时间，并且将子消息合并到消息列表中(根据id查找，存在则覆盖，否则在末尾添加)
		// 	if (index >= 0) {
		// 		notice = state.getIn([roleId, mode, index])
		// 		state = state.updateIn(['news', roleId, mode, MSG_TYPE_NAME[notice.get('msgType')]], (val) => (val != null ? val+1 : null))
		// 			.updateIn(['news', roleId, mode, 'all'], (val) => (val != null? val+1 : 1))
		// 		return state.updateIn(
		// 				[roleId, mode, index],
		// 				(message) => {
		// 					return message.set('readState', READ_STATE.UNREAD)
		// 						.set('sendTime', newDetail.get('sendTime'))
		// 						.update('details', List(), (details) => {
		// 							index = details.findIndex((detail) => (newDetail.get('noticeId') == detail.get('noticeId')))
		// 							if (index >= 0) {
		// 								return details.set(index, newDetail)
		// 							} else {
		// 								return details.push(newDetail)
		// 							}
		// 						})
		// 				}
		// 			)
		// 	} else {
		// 		return state
		// 	}
		// }
    // 查找是否存在同id的消息，如果存在则覆盖，否则在列表末尾添加
    data = data.filter((v) => {
      v = fromJS(v)
      const msgType = v.get('msgType')
      return msgType == MSG_TYPE.COMMENT || msgType == MSG_TYPE.COURSE || msgType == MSG_TYPE.GROUP
    }).forEach((newMessage) => {
      let isSameMessage = false
      let oldMessage = null
			newMessage = fromJS(newMessage)
			newMessageId = newMessage.get('noticeId')
			state = state.updateIn([roleId], (list) => {
				list = (list==null) ? List() : list
				newMessageIndex = list.findIndex((message) => (message.get('noticeId') == newMessageId))
				if (newMessageIndex >= 0) {
          isSameMessage = list.get(newMessageIndex).equals(newMessage)
          oldMessage = list.get(newMessageIndex)
          list = list.set(newMessageIndex, newMessage)
					// list = list.set(newMessageIndex, list.get(newMessageIndex).mergeDeep(newMessage))
				} else {
					list = list.push(newMessage)
				}
				return list
			})
			// 如果是推送的消息&&未读消息，需要增加新消息数
			if (isPushedMessage && newMessage.get('readState') != READ_STATE.READ && !isSameMessage) {
				state = state.updateIn(['news', roleId, MSG_TYPE_NAME[newMessage.get('msgType')]], (val) => (val != null ? val+1 : null))
				state = state.updateIn(['news', roleId, 'all'], (val) => (val != null ? val + 1 : 1))
			}
			// 如果是读缓冲消息，则减少新消息数
			if (
        (newMessage.get('readState') == READ_STATE.READ && (oldMessage && oldMessage.get('readState') == READ_STATE.UNREAD))
      || (newMessage.get('readFlush') && newMessage.get('readState') == READ_STATE.UNREAD)
      ) {
				state = state.updateIn(['news', roleId, MSG_TYPE_NAME[newMessage.get('msgType')]], (val) => (val != null && val > 0 ? val-1 : 0))
				state = state.updateIn(['news', roleId, 'all'], (val) => (val != null && val > 0 ? val-1 : 0))
			}
		})
		// 按时间排序
		state = state.updateIn([roleId], (list) => (list.sort((a, b) => (b.get('sendTime')-a.get('sendTime')))))
		return state

	case FLUSH_NOTIFICATION_LIST:
		state = state.map((role) => {
			return role.map((message) => {
				return message.get('readFlush') == true ? message.set('readFlush', false).set('readState', READ_STATE.READ) : message
			})
		})
		return state
	case CLEAR_NOTICE_NEWS:
		roleId = action.payload.roleId
    type = action.payload.type
    if (type === 'all') {
      fromJS(MSG_TYPE_NAME).forEach((v) => {
        if (v) {
          state = state.setIn(['news', roleId, v], 0)
        }
      })
    } else {
      noticeCount = state.getIn(['news', roleId, type], 0)
  		if (noticeCount != 0) {
  			state = state.updateIn(['news', roleId, 'all'], (val) => {
          return val - noticeCount
        })
        .setIn(['news', roleId, type], 0)
  		}
    }

		return state

	case INITIALIZE_USER_NOTIFICATION:
		// mode = action.payload.mode
		action.payload.data.forEach((obj) => {
			state = state.setIn(['news', obj.roleId, 'all'], obj.count)
		})
		return state
	case INITIALIZE_ROLE_NOTIFICATION:
		roleId = action.payload.roleId
		// mode = action.payload.mode
		data = action.payload.data
		state = state.setIn(['news', roleId], fromJS(data))
		return state

	case LOGOUT_SUCCESS:
		state = Map()
		return state


	default:
		return state
	}
}
