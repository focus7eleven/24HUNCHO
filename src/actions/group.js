import config from '../config'
import { actionNames } from 'action-utils'
import { notification } from 'antd'

const {
  tssURL,
} = config

const api = {
  create: () => `${tssURL}/api/group/create`,
  delete: (groupId) => `${tssURL}/api/group/delete?groupId=${groupId}`,
  exitGroup: (groupId) => `${tssURL}/api/group/exit?groupId=${groupId}`,
  list: () => `${tssURL}/api/group/getGroupsOfCourse`,
  invite: (roleIds) => `${tssURL}/api/group/invite?roleIds=${roleIds}`,
}

export const GET_GROUPS = actionNames('GET_GROUPS')
export const getGroupList = (courseId, roleId) => dispatch => fetch(api.list(), {
  method: 'GET',
  affairId: courseId,
  roleId
}).then(res => res.json()).then(res => {
  if (res.code === 0) {
    dispatch({
      type: GET_GROUPS[1],
      payload: res.data
    })
  }
  return res
})


export const createGroup = (affairId, roleId, group) => dispatch => fetch(api.create(), {
  method: 'POST',
  affairId,
  roleId,
  body: group
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    return {
      type: 'success',
      message: '创建成功',
      description: null
    }
  } else {
    return {
      type: 'error',
      message: '创建失败',
      description: json.data
    }
  }
})

export const deleteGroup = (affairId, roleId, groupId) => dispatch => fetch(api.delete(groupId), {
  method: 'GET',
  affairId,
  roleId
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    notification['success']({
      message: '删除成功'
    })
  } else {
    notification['error']({
      message: '删除失败',
      description: json.data
    })
  }
  return json
})

export const exitGroup = (affairId, roleId, groupId) => dispatch => fetch(api.exitGroup(groupId), {
  method: 'GET',
  affairId,
  roleId,
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    notification['success']({
      message:'退出成功'
    })
  } else {
    notification['error']({
      message: '退出失败',
      description: json.data
    })
  }
  return json
})

export const inviteMembers = (affairId, roleId, roleIds) => dispatch => fetch(api.invite(roleIds), {
  method: 'POST',
  affairId,
  roleId,
}).then(res => res.json())
