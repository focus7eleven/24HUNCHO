import { fromJS, List, Map } from 'immutable'
import {
  EDIT_GROUP_INFO,
  UPDATE_GROUP_MEMBER,
  DISBAND_GROUP,
  LEAVE_GROUP,
  GET_GROUP_CHAT_LIST,
  GET_RECENT_CHAT,
  ADD_RECENT_CHAT,
  UPDATE_RECENT_CHAT,
  GET_GROUP_AUTH,
  SET_CURRENT_CHAT,
  GET_GROUP_MEMBER,
  CREATE_GROUP_CHAT
} from '../actions/chat'

import { CHAT_TYPE } from 'chat-contants'

const CHAT_SUBTYPE = {
  GROUP: {
    CREATE: 70,
    INVITATION: 71,
    REMOVE: 72,
    EXIT: 73,
    DISMISS: 74,
    MODIFY_NAME: 75,
    INVALID_ROLE: 76
  }
}

const initialState = fromJS({
  groupChatList: List(),
  // 正在获取最近会话列表
  isFetchingRecentChat: false,
  // 最近会话列表
  recentChat: null,
  // 当前激活的会话
  selectedChat: Map(),
  // 当前激活群聊的成员
  currentGroupMember: Map(),
})

const updateName = (groupId, name, state) => {
  const editGroupIndex = state.get('groupChatList').findIndex(v => v.get('id') === groupId)
  const editGroupIndexInRecent = state.get('recentChat').findIndex(v => v.getIn(['groupInfo', 'groupId']) === groupId)
  return state.update('groupChatList', v => v.update(editGroupIndex, g => g.set('name', name)))
              .update('selectedChat', v => v.setIn(['groupInfo', 'name'], name))
              .update('recentChat', v => v.update(editGroupIndexInRecent, vv => vv.setIn(['groupInfo', 'name'], name)))
}

export default (state = initialState, action) => {
  let chatKey, chat
  switch(action.type) {
    case DISBAND_GROUP:
      return state.update('groupChatList', v => v.splice(v.findIndex(vv => vv.get('id') === action.payload), 1))
    case LEAVE_GROUP:
      return state.update('groupChatList', v => v.splice(v.findIndex(vv => vv.get('id') === action.payload), 1))
                  .update('recentChat', v => v.splice(v.findIndex(vv => vv.getIn(['groupInfo', 'groupId']) === action.payload), 1))
                  .set('selectedChat', Map())
    case CREATE_GROUP_CHAT:
      return state.update('groupChatList', v => v.push(fromJS(action.payload)))
    case GET_GROUP_CHAT_LIST:
      return state.set('groupChatList', fromJS(action.payload))
    case GET_GROUP_MEMBER:
      return state.set('currentGroupMember', fromJS(action.payload))
    case UPDATE_GROUP_MEMBER:
      return state.set('currentGroupMember', fromJS(action.payload))
    case EDIT_GROUP_INFO:
      return updateName(action.payload.groupId, action.payload.name, state)
    case GET_RECENT_CHAT[0]:
      return state.set('isFetchingRecentChat', true)
    case GET_RECENT_CHAT[1]:
      state = state.set('recentChat', fromJS(action.response))
                  .set('isFetchingRecentChat', false)
                  // .setIn(['recentChat', 0, 'unreadCount'], 0)
                  .set('selectedChat', fromJS(action.response[0] || {}))
      if (state.get('recentChat').size) {
        state = state.updateIn(['recentChat', 0], v => v.set('unreadCount', 0))
      }
      return state
    case GET_RECENT_CHAT[2]:
      return state.set('isFetchingRecentChat', false)
    case SET_CURRENT_CHAT:
      chatKey = action.payload.get('_key')
      const chatIndex = state.get('recentChat').findIndex(c => c.get('_key') === chatKey)
      if (~chatIndex) {
        state = state.update('recentChat', v => v.update(chatIndex, vv => vv.set('unreadCount', 0)))
      }
      return state.set('selectedChat', action.payload)
    case ADD_RECENT_CHAT:
      // if (~state.get('groupChatList').findIndex(v => v.get('id') === action.payload.getIn(['groupInfo', 'groupId']))) {
      //   const newGroup = {
      //     id: action.payload.getIn(['groupInfo', 'groupId']),
      //     name: action.payload.getIn(['groupInfo', 'name']),
      //     avatar: action.payload.getIn(['groupInfo', 'avatar']),
      //   }
      //   state = state.update('groupChatList', v => v.push(fromJS(newGroup)))
      // }
      return state.update('recentChat', v => v.unshift(action.payload))
    case UPDATE_RECENT_CHAT:
      chat = action.payload.chat
      chatKey = chat.get('_key')
      let newMessage = state.get('recentChat')
                            .find(v => v.get('_key') === chatKey)
                            .update('unreadCount', u => u + action.payload.isUnread)
                            .set('lastMsg', chat)

      state = state.update('recentChat', v => v.splice(v.findIndex(vv => vv.get('_key') === chatKey), 1).unshift(newMessage))

      let content
      if (chat.get('sub') === CHAT_SUBTYPE.GROUP.MODIFY_NAME) {
        content = JSON.parse(chat.get('content'))
        return updateName(chat.get('groupId'), content.newGroupName, state)
      }

    default:
      return state
  }
}
