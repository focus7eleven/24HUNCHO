import { actionNames } from 'action-utils'
import { notification } from 'antd'
import config from '../config'
import _ from 'lodash'

const {
  chatURL,
  affairURL
} = config

const api = {
  getConnector: (userId) => `${chatURL}/server/connector?userId=${userId}`,
  getOfficialChatGroups: (announcementId) => `${chatURL}/chatGroup/announcementChatGroups?announcementId=${announcementId}`,
  getGuestChatGroups: (announcementId) => `${chatURL}/chatGroup/announcementChatGroupsOfGuest?announcementId=${announcementId}`,

  memberList: (groupId) => `${chatURL}/chatGroup/chatGroupMembers?groupId=${groupId}`,
  groupPermission: (groupId) => `${chatURL}/chatGroup/permissionInGroup?groupId=${groupId}`,
  leaveGroup: () => `${chatURL}/chatGroup/leaveChatGroup`,
  disbandGroup: () => `${chatURL}/chatGroup/disbandChatGroup`,

  edit: () => `${chatURL}/chatGroup/updateChatGroupName`,
  affair: {
    getChatGroups: (affairId) => `${chatURL}/chatGroup/affairChatGroups?affairId=${affairId}`,
  },
  message: {
    recent: (affairId, roleId) => `${chatURL}/message/recent?affairId=${affairId}&roleId=${roleId}`,
    search: () => `${chatURL}/message/search`
  },
  create: () => `${affairURL}/affair_chat/create`,
  updateMembers: () => `${affairURL}/affair_chat/update_members`,
}

export const LEAVE_GROUP = 'LEAVE_GROUP'
export const leaveGroup = (affairId, roleId, groupId) => dispatch => fetch(api.leaveGroup(), {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  affairId,
  roleId,
  body: JSON.stringify({
    groupId,
  })
}).then(res => res.json()).then(res => {
  if (res.code === 0) {
    dispatch({
      type: LEAVE_GROUP,
      payload: groupId
    })
  }
})

export const DISBAND_GROUP = 'DISBAND_GROUP'
export const disbandGroup = (affairId, roleId, groupId) => dispatch => fetch(api.disbandGroup(), {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  affairId,
  roleId,
  body: JSON.stringify({ groupId })
}).then(res => res.json()).then(res => {
  if (res.code === 0) {
    dispatch({
      type: DISBAND_GROUP,
      payload: groupId
    })
  }
  return res
})

export const CREATE_GROUP_CHAT = 'CREATE_GROUP_CHAT'
export const createGroupChat = (groupChat, affairId, roleId) => dispatch => fetch(api.create(), {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  affairId,
  roleId,
  body: groupChat
}).then(res => res.json()).then(res => {
  if (res.code === 0) {
    dispatch({
      type: CREATE_GROUP_CHAT,
      payload: res.data
    })
    notification['success']({
      message: '创建成功',
    })
    return true
  } else {
    notification['error']({
      message: '创建失败',
      description: res.data
    })
    return false
  }
})

export const UPDATE_GROUP_MEMBER = 'UPDATE_GROUP_MEMBER'
export const updateGroupMember = (member, affairId, roleId) => dispatch => fetch(api.updateMembers(), {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  affairId,
  roleId,
  body: member
}).then(res => res.json()).then(res => {
  if (res.code === 0) {
    dispatch({
      type: UPDATE_GROUP_MEMBER,
      payload: res.data
    })
    notification['success']({
      message: '编辑成功',
    })
    return true
  } else {
    notification['error']({
      message: '编辑失败',
      description: res.data
    })
    return false
  }
})

export const EDIT_GROUP_INFO = 'EDIT_GROUP_INFO'
export const editGroupInfo = (body, affairId, roleId) => dispatch => fetch(api.edit(), {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  affairId,
  roleId,
  body: JSON.stringify(body)
}).then(res => res.json()).then(res => {
  if (res.code === 0) {
    dispatch({
      type: EDIT_GROUP_INFO,
      payload: body
    })
    notification['success']({
      message: '编辑成功',
    })
    return true
  } else {
    notification['error']({
      message: '编辑失败',
      description: res.data
    })
    return false
  }
})

export const SEARCH_RECORD = 'SEARCH_RECORD'
export const searchRecord= (affairId, roleId, body) => dispatch => fetch(api.message.search(), {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  affairId,
  roleId,
  body,
}).then(res => res.json()).then(res => {
  return res
})

export const GET_GROUP_CHAT_LIST = 'GET_GROUP_CHAT_LIST'
export const getGroupChatList = (affairId, roleId) => dispatch => fetch(api.affair.getChatGroups(affairId), {
  method: 'GET',
  affairId,
  roleId,
}).then(res => res.json()).then(res => {
  if (res.code === 0) {
    dispatch({
      type: GET_GROUP_CHAT_LIST,
      payload: res.data
    })
  }
  return res.data
})

export const GET_GROUP_MEMBER = 'GET_GROUP_MEMBER'
export const getGroupMember = groupId => dispatch => fetch(api.memberList(groupId), {
  method: 'GET',
}).then(res => res.json()).then(res => {
  if (res.code === 0) {
    dispatch({
      type: GET_GROUP_MEMBER,
      payload: res.data
    })
  }
  return res.data
})

export const GET_RECENT_CHAT = actionNames('GET_RECENT_CHAT')
export const getRecentChat = (affairId, roleId) => ({
	types: GET_RECENT_CHAT,
	shouldCallAPI: (state) => {
		return true
	},
	callAPI: () => fetch(api.message.recent(affairId, roleId), {
		method: 'GET',
    affairId,
    roleId
	}).then(res => {
		return res.json()
	}).then(json => {
		if (json.code === 0) {
			return json.data
		}
	})
})

// export const updateGroupName = (groupId, name) => dispatch => dispatch({
//   type: EDIT_GROUP_INFO,
//   payload: {
//     groupId,
//     name
//   }
// })

export const SET_CURRENT_CHAT = 'SET_CURRENT_CHAT'
export const setCurrentChat = chat => dispatch => dispatch({
  type: SET_CURRENT_CHAT,
  payload: chat
})

export const ADD_RECENT_CHAT = 'ADD_RECENT_CHAT'
export const addRecentChat = chat => dispatch => dispatch({
  type: ADD_RECENT_CHAT,
  payload: chat
})

export const UPDATE_RECENT_CHAT = 'UPDATE_RECENT_CHAT'
export const updateRecentChat = (chat, isUnread) => dispatch => dispatch({
  type: UPDATE_RECENT_CHAT,
  payload: {
    chat,
    isUnread
  }
})

export const GET_GROUP_AUTH = 'GET_GROUP_AUTH'
export const getGroupAuth = (affairId, roleId, chatGroupId) => dispatch => fetch(api.groupPermission(chatGroupId), {
  method: 'GET',
  affairId,
  roleId
}).then(res => res.json()).then(res => res.data)
