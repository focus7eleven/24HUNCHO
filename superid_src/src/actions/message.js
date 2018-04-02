import config from '../config'

export const ACTION_TAG = {
  ALL: 'all',
  AFFAIR: 'affair',
  ANNOUNCEMENT: 'announcement' 
}

export const CLEAR_MESSAGE = 'CLEAR_MESSAGE'
export function clearMessage() {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.ALL,
      type: CLEAR_MESSAGE,
    })
  }
}

const AffairActions = {}

AffairActions.FETCH_RECENTCHATS = 'FETCH_RECENTCHATS'
AffairActions.FETCHING_RECENTCHATS = 'FETCHING_RECENTCHATS'
export function fetchRecentChats(affairId, roleId) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.AFFAIR,
      type: AffairActions.FETCHING_RECENTCHATS,
    })
    fetch(config.api.chat.message.recent(affairId, roleId), {
      method: 'GET',
      credentials: 'include',
      affairId,
      roleId,
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        dispatch({
          tag: ACTION_TAG.AFFAIR,
          type: AffairActions.FETCH_RECENTCHATS,
          recentChats: res.data
        })
      }
    })
  }
}

AffairActions.FETCH_AFFAIR_CHATGROUPS = 'FETCH_AFFAIR_CHATGROUPS'
export function fetchAffairChatGroups(affairId, roleId) {

  return (dispatch) => {
    fetch(config.api.chat.affair.getChatGroups(affairId), {
      method: 'GET',
      credentials: 'include',
      affairId,
      roleId,
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        dispatch({
          tag: ACTION_TAG.AFFAIR,
          type: AffairActions.FETCH_AFFAIR_CHATGROUPS,
          groups: res.data
        })
      }
    })
  }
}

AffairActions.ADD_RECENT_CHAT = 'ADD_RECENT_CHAT'
export function addRecentChat(chat) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.AFFAIR,
      type: AffairActions.ADD_RECENT_CHAT,
      chat: chat,
    })
  }
}

AffairActions.CREATE_RECENT_CHAT = 'CREATE_RECENT_CHAT'
export function createRecentChat(chat) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.AFFAIR,
      type: AffairActions.CREATE_RECENT_CHAT,
      chat: chat,
    })
  }
}

AffairActions.OPEN_RECENT_CHAT = 'OPEN_RECENT_CHAT'
export function openRecentChat(chat) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.AFFAIR,
      type: AffairActions.OPEN_RECENT_CHAT,
      chat: chat,
    })
  }
}

AffairActions.LOAD_MORE_MESSAGE = 'LOAD_MORE_MESSAGE'
export function loadMoreMessage({ msgList, key }) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.AFFAIR,
      type: AffairActions.LOAD_MORE_MESSAGE,
      key,
      msgList,
    })
  }
}

AffairActions.ADD_MESSAGE = 'ADD_MESSAGE'
export function addMessage(message) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.AFFAIR,
      type: AffairActions.ADD_MESSAGE,
      message,
    })
  }
}

AffairActions.RECEIVE_MESSAGE = 'RECEIVE_MESSAGE'
export function receiveMessage(message) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.AFFAIR,
      type: AffairActions.RECEIVE_MESSAGE,
      message,
    })
  }
}

AffairActions.UPDATE_GROUP_NAME = 'UPDATE_GROUP_NAME'
export function updateGroupName({ key, name, groupId }) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.AFFAIR,
      type: AffairActions.UPDATE_GROUP_NAME,
      key,
      name,
      groupId
    })
  }
}

AffairActions.REMOVE_CHAT_GROUP = 'REMOVE_CHAT_GROUP'
export function removeChatGroup({ key, groupId, isSelected = false }) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.AFFAIR,
      type: AffairActions.REMOVE_CHAT_GROUP,
      key: key,
      groupId,
      isSelected
    })
  }
}

AffairActions.UPDATE_FILE_MESSAGE = 'UPDATE_FILE_MESSAGE'
export function updateFileMessage({ message, key, index }) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.AFFAIR,
      type: AffairActions.UPDATE_FILE_MESSAGE,
      message,
      key,
      index
    })
  }
}

AffairActions.DELETE_FILE_MESSAGE = 'DELETE_FILE_MESSAGE'
export function deleteFileMessage({ key, index }) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.AFFAIR,
      type: AffairActions.DELETE_FILE_MESSAGE,
      key,
      index
    })
  }
}

AffairActions.UPDATE_CHAT_ROLE = 'UPDATE_CHAT_ROLE'
export function updateChatRole(role) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.AFFAIR,
      type: AffairActions.UPDATE_CHAT_ROLE,
      role
    })
  }
}

AffairActions.START_ROUTE_CHAT = 'START_ROUTE_CHAT'
export function startRouteChat(chat) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.AFFAIR,
      type: AffairActions.START_ROUTE_CHAT,
      chat
    })
  }
}


const AnnouncementActions = {}

AnnouncementActions.FETCH_SCOPEGROUPS = 'FETCH_SCOPEGROUPS'
export function fetchScopeGroups(announcementId, affair) {
  return (dispatch) => {
    fetch(config.api.chat.getOfficialChatGroups(announcementId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId')
    }).then((res) => {
      return res.json()
    }).then((json) => {
      if (json.code === 0) {
        dispatch({
          tag: ACTION_TAG.ANNOUNCEMENT,
          type: AnnouncementActions.FETCH_SCOPEGROUPS,
          scopeGroups: json.data
        })
      }
    })
  }
}

AnnouncementActions.FETCH_GUESTGROUPS = 'FETCH_GUESTGROUPS'
export function fetchGuestGroups(announcementId, affair) {
  return (dispatch) => {
    fetch(config.api.chat.getGuestChatGroups(announcementId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId')
    }).then((res) => {
      return res.json()
    }).then((json) => {
      if (json.code === 0) {
        dispatch({
          tag: ACTION_TAG.ANNOUNCEMENT,
          type: AnnouncementActions.FETCH_GUESTGROUPS,
          guestGroups: json.data
        })
      }
    })
  }
}

AnnouncementActions.INIT_GROUPSMAP = 'INIT_GROUPSMAP'
export function initGroupsMap(groups) {
  return (dispatch) => {  
    dispatch({
      tag: ACTION_TAG.ANNOUNCEMENT,
      type: AnnouncementActions.INIT_GROUPSMAP,
      groups
    })
  }
}

AnnouncementActions.UPDATE_GROUPSMAP = 'UPDATE_GROUPSMAP'
export function updateGroupsMap(group) {
  return (dispatch) => {  
    dispatch({
      tag: ACTION_TAG.ANNOUNCEMENT,
      type: AnnouncementActions.UPDATE_GROUPSMAP,
      group
    })
  }
}

AnnouncementActions.ADD_ANNOUNCEMENT_MESSAGE = 'ADD_ANNOUNCEMENT_MESSAGE'
export function addAnnouncementMessage(content) {
  return (dispatch) => {  
    dispatch({
      tag: ACTION_TAG.ANNOUNCEMENT,
      type: AnnouncementActions.ADD_ANNOUNCEMENT_MESSAGE,
      content
    })
  }
}

AnnouncementActions.UPDATE_ANNOUNCEMENT_FILE_MESSAGE = 'UPDATE_ANNOUNCEMENT_FILE_MESSAGE'
export function updateAnnouncementFileMessage({ message, index }) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.ANNOUNCEMENT,
      type: AnnouncementActions.UPDATE_ANNOUNCEMENT_FILE_MESSAGE,
      message,
      index
    })
  }
}

AnnouncementActions.DELETE_ANNOUNCEMENT_FILE_MESSAGE = 'DELETE_ANNOUNCEMENT_FILE_MESSAGE'
export function deleteAnnouncementFileMessage({ message, index }) {
  return (dispatch) => {
    dispatch({
      tag: ACTION_TAG.ANNOUNCEMENT,
      type: AnnouncementActions.DELETE_ANNOUNCEMENT_FILE_MESSAGE,
      message,
      index,
    })
  }
}

AnnouncementActions.ADD_ANNOUNCEMENT_GROUP = 'ADD_ANNOUNCEMENT_GROUP'
export function addAnnouncementGroup({ group, scope }) {
  return (dispatch) => {  
    dispatch({
      tag: ACTION_TAG.ANNOUNCEMENT,
      type: AnnouncementActions.ADD_ANNOUNCEMENT_GROUP,
      group,
      scope
    })
  }
}

AnnouncementActions.UPDATE_ANNOUNCEMENT_GROUP = 'UPDATE_ANNOUNCEMENT_GROUP'
export function updateAnnouncementGroup({ group, scope }) {
  return (dispatch) => {  
    dispatch({
      tag: ACTION_TAG.ANNOUNCEMENT,
      type: AnnouncementActions.UPDATE_ANNOUNCEMENT_GROUP,
      group,
      scope
    })
  }
}

AnnouncementActions.DELETE_ANNOUNCEMENT_GROUP = 'DELETE_ANNOUNCEMENT_GROUP'
export function deleteAnnouncementGroup({ group, scope }) {
  return (dispatch) => {  
    dispatch({
      tag: ACTION_TAG.ANNOUNCEMENT,
      type: AnnouncementActions.DELETE_ANNOUNCEMENT_GROUP,
      group,
      scope
    })
  }
}


export { AffairActions, AnnouncementActions }