import config from '../config'
import messageHandler from 'messageHandler'
import { Map, fromJS } from 'immutable'

export const FETCH_DRAFT_LIST = 'FETCH_DRAFT_LIST'
export const fetchDraftList = (affair) => {
  return (dispatch) => {
    fetch(config.api.announcement.draft.list.get(), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => {
      return res.json()
    }).then((json) => {
      dispatch({
        type: FETCH_DRAFT_LIST,
        payload: {
          affairId: affair.get('id'),
          data: json.data,
        },
      })
    })
  }
}

export const fetchDraftDetail = (draftId, affair) => {
  return fetch(config.api.announcement.draft.get(draftId), {
    method: 'GET',
    credentials: 'include',
    affairId: affair.get('id'),
    roleId: affair.get('roleId'),
  }).then((res) => {
    return res.json()
  })
}

export const TOGGLE_CONTAIN_CHILDREN = 'TOGGLE_CONTAIN_CHILDREN'
export const toggleContainerChildrenAnnouncements = function() {
  return (dispatch) => {
    dispatch({
      type: TOGGLE_CONTAIN_CHILDREN,
    })
  }
}

export const DELETE_DRAFT = 'DELETE_DRAFT'
export const deleteDraft = (draftId, affair) => {
  return (dispatch) => {
    const data = new FormData()
    data.append('draftId', draftId)

    return fetch(config.api.announcement.draft.delete, {
      method: 'POST',
      credentials: 'include',
      body: data,
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => {
      return res.json()
    }).then(messageHandler).then((json) => {
      dispatch({
        type: DELETE_DRAFT,
        payload: {
          draftId,
          affairId: affair.get('id'),
          data: json.data,
        },
      })
      return json
    })
  }
}

export const fetchAnnouncementGuest = (announcementId, affairId, roleId) => {
  // 事务内角色作为客方
  const innerAffiarReq = fetch(config.api.announcement.detail.guests.innerAffair.get(announcementId), {
    affairId: affairId,
    roleId: roleId,
    method: 'GET',
    credentials: 'include',
  }).then((res) => res.json())

  // 盟内以事务作为分类的客方
  const innerAllianceReq = fetch(config.api.announcement.detail.guests.innerAlliance.get(announcementId), {
    affairId: affairId,
    roleId: roleId,
    method: 'GET',
    credentials: 'include',
  }).then((res) => res.json())

  // 盟客网以盟作为分类的客方
  const menkorReq = fetch(config.api.announcement.detail.guests.menkor.get(announcementId), {
    affairId: affairId,
    roleId: roleId,
    method: 'GET',
    credentials: 'include',
  }).then((res) => res.json())

  return Promise.all([innerAffiarReq, innerAllianceReq, menkorReq]).then((res) => {
    return Map().update('innerAffair', (innerAffair) => res[0].code === 0 ? fromJS(res[0].data) : innerAffair)
      .update('innerAlliance', (innerAlliance) => res[0].code === 0 ? fromJS(res[1].data) : innerAlliance)
      .update('menkor', (menkor) => res[0].code === 0 ? fromJS(res[2].data) : menkor)
  })
}
