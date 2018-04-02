import { fromJS, List, Map } from 'immutable'

import {
  ACTION_TAG, 
  AffairActions,
  AnnouncementActions
} from '../actions/message'
import { TOPICTYPE } from 'chat-contants'





const initialState = fromJS({
  affair: { // 事务内会话相关
    isFetchingRecentChat: false, 
    recentChats: List([]), // 最近会话列表（包括群聊和单聊）
    affairChatGroups: List([]), // 事务内群聊列表
    selectedChatKey: '', // selectedChat Key
    chatRole: null, // 角色库开启会话入口
  },

  announcement: { // 发布内会话相关
    scopeGroups: Map({}), // 跟域相关的讨论组
    guestGroups: List([]), // 客方视角下的相关讨论组
    groupsMap: Map({}), // key 为 groupId, 只存放消息列表
  }

})

export default (state = initialState, action) => {
  switch (action.tag) {
    case ACTION_TAG.AFFAIR:
      state = state.set('affair', affairChatReducer(state.get('affair'), action))
      return state
    case ACTION_TAG.ANNOUNCEMENT:
      state = state.set('announcement', announcementChatReducer(state.get('announcement'), action))
      return state
    case ACTION_TAG.ALL:
      state = initialState
      return state
    default:
      return state
  }
}

const announcementChatReducer = (state, action) => {
  let scopeGroups, groupsMap, group, groupId
  switch (action.type) {
    case AnnouncementActions.FETCH_SCOPEGROUPS:
      scopeGroups = Map({})
      scopeGroups = scopeGroups.set(TOPICTYPE.ANNOUNCEMENT_IN_AFFAIR, fromJS(action.scopeGroups['affairGroups']))
                              .set(TOPICTYPE.ANNOUNCEMENT_IN_AlLIANCE, fromJS(action.scopeGroups['allianceGroups']))
                              .set(TOPICTYPE.ANNOUNCEMENT_IN_GUEST, fromJS(action.scopeGroups['guestGroups']))
                              .set(TOPICTYPE.ANNOUNCEMENT_IN_FOLLOWER, fromJS(action.scopeGroups['followerGroups']))
      state = state.set('scopeGroups', scopeGroups)
      return state
    case AnnouncementActions.FETCH_GUESTGROUPS:
      state = state.set('guestGroups', fromJS(action.guestGroups))
      return state
    case AnnouncementActions.INIT_GROUPSMAP:
      groupsMap = state.get('groupsMap')
      
      action.groups.filter((g) => !groupsMap.get(g.id)).forEach((g) => {
        let group = Map(g).set('open', false).set('unread', 0).set('msgList', List([]))
        groupsMap = groupsMap.set(g.id, group)
      })

      state = state.set('groupsMap', groupsMap)
      return state
    case AnnouncementActions.UPDATE_GROUPSMAP:
      state = state.setIn(['groupsMap', action.group.get('id')], action.group)
      return state
    case AnnouncementActions.ADD_ANNOUNCEMENT_MESSAGE:
      group = state.getIn(['groupsMap', action.content.message.groupId])
      group = group.update('msgList', (list) => list.push(action.content.message))
      if (!action.content.isCurrent) {
        group = group.update('unread', (count) => count + 1)
      }
      state = state.setIn(['groupsMap', action.content.message.groupId], group)
      return state
    case AnnouncementActions.UPDATE_ANNOUNCEMENT_FILE_MESSAGE:
      groupId = action.message.groupId
      state = state.setIn(['groupsMap', groupId, 'msgList', action.index], action.message)
      return state
    case AnnouncementActions.DELETE_ANNOUNCEMENT_FILE_MESSAGE:
      groupId = action.message.groupId
      state = state.updateIn(['groupsMap', groupId, 'msgList'], (list) => list.delete(action.index))
      return state
    case AnnouncementActions.ADD_ANNOUNCEMENT_GROUP:
      groupId = action.group.id
      if (action.scope < 0) {
        state = state.update('guestGroups', (list) => list.push(fromJS(action.group)))
      } else {
        state = state.updateIn(['scopeGroups', action.scope], (list) => list.push(fromJS(action.group)))
      }
      return state
    case AnnouncementActions.UPDATE_ANNOUNCEMENT_GROUP:
      groupId = action.group.id
      if (action.scope < 0) {
        state = state.update('guestGroups', (list) => list.map((group) => {
          if (group.get('id') === action.group.id) {
            group = group.set('name', group.name)
          }
          return group
        }))
      } else {
        state = state.updateIn(['scopeGroups', action.scope], (list) => list.map((group) => {
          if (group.get('id') === action.group.id) {
            group = group.set('name', action.group.name)
          }
          return group
        }))
      }
      return state
    case AnnouncementActions.DELETE_ANNOUNCEMENT_GROUP:
      groupId = action.group.id
      if (action.scope < 0) {
        state = state.update('guestGroups', (list) => list.filter((group) => group.get('id') !== groupId))
      } else {
        state = state.updateIn(['scopeGroups', action.scope], (list) => list.filter((group) => group.get('id') !== groupId))
      }
      return state
    default:
      return state
  }
}

const affairChatReducer = (state, action) => {
  let recentChats, message, chat, index
  switch (action.type) {
    case AffairActions.FETCHING_RECENTCHATS:
      state = state.set('isFetchingRecentChat', true).set('recentChats', List([])).set('selectedChatKey', '')
      return state
    case AffairActions.FETCH_RECENTCHATS:
      recentChats = List(action.recentChats.map((c) => Map(c).set('open', false)))
      state = state.set('recentChats', recentChats).set('selectedChatKey', '').set('isFetchingRecentChat', false)
      return state
    case AffairActions.FETCH_AFFAIR_CHATGROUPS:
      state = state.set('affairChatGroups', List(action.groups))
      return state
    case AffairActions.ADD_RECENT_CHAT:
      if (state.get('recentChats').find((c) => c.get('_key') === action.chat.get('_key'))) {
        return state
      }
      state = state.update('recentChats', (chats) => chats.unshift(action.chat))
                  .set('selectedChatKey', action.chat.get('_key')).set('chatRole', null)
      return state
    case AffairActions.CREATE_RECENT_CHAT:
      state = state.update('recentChats', (chats) => chats.insert(1, action.chat))
      return state
    case AffairActions.OPEN_RECENT_CHAT:
      index = state.get('recentChats').findIndex((c) => c.get('_key') === action.chat.get('_key'))      
      state = state.setIn(['recentChats', index], action.chat).set('selectedChatKey', action.chat.get('_key')).set('chatRole', null)
      return state
    case AffairActions.ADD_MESSAGE:
      message = action.message
      chat = state.get('recentChats').find((c) => c.get('_key') === state.get('selectedChatKey'))
                  .set('lastMsg', message)
                  .update('msgList', (list) => !list ? List([]) : list.push(message))
      state = state.update('recentChats', (chats) =>
        chats.filterNot((c) => c.get('_key') === chat.get('_key')).unshift(chat)
      )
      return state
    case AffairActions.RECEIVE_MESSAGE:
      message = action.message

      if (message._key === state.get('selectedChatKey')) {
        index = state.get('recentChats').findIndex((c) => c.get('_key') === state.get('selectedChatKey'))
        chat = state.get('recentChats').find((c) => c.get('_key') === state.get('selectedChatKey'))
                  .set('lastMsg', message)
                  .update('msgList', (list) => !list ? List([]) : list.push(message))

        state = state.setIn(['recentChats', index], chat)
      } else {
        chat = state.get('recentChats').find((c) => c.get('_key') === message._key)
                    .set('lastMsg', message)
                    .update('msgList', (list) => !list ? List([message]) : list.push(message))
                    .update('unreadCount', (count) => count + 1)
        state = state.update('recentChats', (chats) =>
          chats.filterNot((c) => c.get('_key') === chat.get('_key')).insert(1, chat)
        )
      }
      return state
    case AffairActions.UPDATE_FILE_MESSAGE:
      message = action.message
      chat = state.get('recentChats').find((c) => c.get('_key') === action.key)
                  .set('lastMsg', message)
                  .setIn(['msgList', action.index], message)
      state = state.update('recentChats', (chats) =>
        chats.filterNot((c) => c.get('_key') === chat.get('_key')).unshift(chat)
      )
      return state
    case AffairActions.DELETE_FILE_MESSAGE:
      message = action.message
      chat = state.get('recentChats').find((c) => c.get('_key') === action.key).update('msgList', (list) => list.delete(action.index))
      chat = chat.set('lastMsg', chat.get('msgList').last())
      state = state.update('recentChats', (chats) =>
        chats.filterNot((c) => c.get('_key') === chat.get('_key')).unshift(chat)
      )
      return state
    case AffairActions.LOAD_MORE_MESSAGE:
      index = state.get('recentChats').findIndex((c) => c.get('_key') === action.key)
      state = state.setIn(['recentChats', index, 'msgList'], List(action.msgList))
      return state
    case AffairActions.UPDATE_GROUP_NAME:
      index = state.get('recentChats').findIndex((c) => c.get('_key') === action.key)
      state = state.updateIn(['recentChats', index, 'groupInfo'], (group) => {
        group.name = action.name
        return group
      }).update('affairChatGroups', (groups) => groups.map((g) => {
        if (g.id === action.groupId) {
          g.name = action.name
        }
        return g
      }))
      return state
    case AffairActions.REMOVE_CHAT_GROUP:
      state = state.update('recentChats', (chats) => chats.filterNot((c) => c.get('_key') === action.key))
                  .update('affairChatGroups', (groups) => groups.filterNot((g) => g.id === action.groupId))
      if (action.key === state.get('selectedChatKey')) {
        state = state.set('selectedChatKey', '')
      }        
      return state
    case AffairActions.UPDATE_CHAT_ROLE:
      state = state.set('chatRole', action.role)
      return state
    default:
      return state
  }
}
