import config from '../config'
import _ from 'underscore'
import messageHandler from 'messageHandler'
import {
  message,
} from 'antd'
import {
  fromJS,
  List,
} from 'immutable'
import {
  UPDATE_HOMEPAGE_AFFAIR,
} from './user'

// 清除上一个账号的事务信息
export const RESET_AFFAIR = 'RESET_AFFAIR'

export const FETCH_AFFAIR_LIST = 'FETCH_AFFAIR_LIST'
export function fetchAffairList() {
  return (dispatch) => {
    return fetch(config.api.affair.list.get, {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((body) => {
      dispatch({
        type: FETCH_AFFAIR_LIST,
        payload: body.data,
      })
      return body
    })
  }
}

export const CREATE_NEW_ROLE = 'CREATE_NEW_ROLE'
export function createNewRole(data) {
  return (dispatch) => {
    dispatch({
      type: CREATE_NEW_ROLE,
      payload: {
        role: {
          allianceId: data.allianceId,
          allianceName: '',
          roleId: data.id,
          roleName: data.title,
          permissions: data.permissions,
          logoUrl: '',
          affairName: data.affairName,
        },
        affairId: data.belongAffairId,
        userId: data.userId,
      }
    })
  }
}

export const FETCH_FOLLOWED_AFFAIR_LIST = 'FETCH_FOLLOWED_AFFAIR_LIST'
export function fetchFollowedAffairList() {
  return (dispatch) => {
    fetch(config.api.affair.starList(), {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        dispatch({
          type: FETCH_FOLLOWED_AFFAIR_LIST,
          payload: (json.data || []).map((affair) => {
            return {
              affairId: affair.id,
              affairName: affair.name,
              avatar: affair.avatar,
              time: affair.modifyTime,
            }
          }),
        })
      }
    })
  }
}

export const FETCH_AFFAIR_HISTORY_LIST = 'FETCH_AFFAIR_HISTORY_LIST'
export function fetchAffairHistoryList() {
  return (dispatch) => {
    fetch(config.api.affair.historyList.get, {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((body) => {
      dispatch({
        type: FETCH_AFFAIR_HISTORY_LIST,

        payload: body.data || [],
      })
    })
  }
}

export const FETCH_ALL_AFFAIR_IN_ALLIANCE = 'FETCH_ALL_AFFAIR_IN_ALLIANCE'
export function fetchAllAffairInAlliance(allianceId) {
  return (dispatch) => {
    return fetch(config.api.alliance.affairTree.singleTree(allianceId), {
      method: 'get',
      credentials: 'include',
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const data = res.data

        dispatch({
          type: FETCH_ALL_AFFAIR_IN_ALLIANCE,
          payload: {
            affair: res.data,
          }
        })

        return data
      }
    })
  }
}

export const UPDATE_AFFAIR_TASK_LIST = 'UPDATE_AFFAIR_TASK_LIST'
export function fetchUserTaskList() {
  return (dispatch) => {
    fetch(`${config.baseURL}/task/my`, {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        dispatch({
          type: UPDATE_AFFAIR_TASK_LIST,
          payload: json.data,
        })
      }
    })
  }
}

export const FETCH_AFFAIR_TREE_SUCCESS = 'FETCH_AFFAIR_TREE_SUCCESS'
export function fetchAffairTree() {
  return (dispatch) => {
    return fetch(config.api.affair.tree.get, {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        dispatch({
          type: FETCH_AFFAIR_TREE_SUCCESS,
          payload: {
            affairTree: res.data
          },
        })

        return res.data
      }
    })
  }
}

// 更新事务权限列表
export const UPDATE_PERMISSIONS = 'UPDATE_PERMISSIONS'
const flattenPermissionMap = (tree) => {
  if (!tree.get('childs').size) {
    return fromJS([{
      id: tree.get('id'),
      name: tree.get('name'),
    }])
  } else {
    return tree.get('childs').reduce((reduction, v) => reduction.concat(flattenPermissionMap(v)), List())
  }
}
export function fetchAffairPermission() {
  return (dispatch) => fetch(config.api.affair.permissions.get, {
    method: 'GET',
    credentials: 'include',
  }).then((res) => res.json()).then((body) => JSON.parse(body.data || '{}')).then((map) => {
    const permissions = flattenPermissionMap(fromJS({
      id: -1,
      name: 'temp',
      childs: map
    }))

    dispatch({
      type: UPDATE_PERMISSIONS,
      payload: permissions,
    })
  })
}

// 标记某个事务的动态为已读
export const READ_TREND = 'READ_TREND'
export function readTrend(affair, trendIndex) {
  return (dispatch) => {
    dispatch({
      type: READ_TREND,
      payload: {
        affair,
        trendIndex,
      },
    })
  }
}

// 改变某条事务的置顶属性
export const TOGGLE_STICK = 'TOGGLE_STICK'
export function toggleStick(affair) {
  return (dispatch) => {
    dispatch({
      type: TOGGLE_STICK,
      payload: {
        affair,
      },
    })
  }
}

//添加删除事务封面
export const CHANGE_AFFAIR_COVER = 'CHANGE_AFFAIR_COVER'
export function deleteOrAddCover({
  newAffair,
  affairMemberId
}, callback) {
  if (!_.isArray(JSON.parse(newAffair.get('covers')))) {
    newAffair = newAffair.set('covers', '[]')
  }
  return (dispatch) => {
    fetch(config.api.affair.homepage_change(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: newAffair.get('id'),
      roleId: newAffair.get('roleId'),
      body: JSON.stringify({
        covers: JSON.parse(newAffair.get('covers'))
      }),
    }).then((res) => res.json())
      .then((res) => {
        callback ? callback(res) : null
        newAffair = newAffair.set('covers', fromJS(newAffair.get('covers')))
        dispatch({
          type: CHANGE_AFFAIR_COVER,
          payload: newAffair,
        })
      })
  }
}

//修改事务描述
export const CHANGE_AFFAIR_DESCRIPTION = 'CHANGE_AFFAIR_DESCRIPTION'
export function changeAffairDescription(newAffair, callback) {
  return (dispatch) => {
    fetch(config.api.affair.homepage_change(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: newAffair.get('id'),
      roleId: newAffair.get('roleId'),
      body: JSON.stringify({
        description: newAffair.get('description')
      }),
    }).then((res) => res.json()).then((res) => {
      callback ? callback(res) : null
      dispatch({
        type: CHANGE_AFFAIR_DESCRIPTION,
        payload: newAffair,
      })
    })
  }
}

//修改事务标签
export const CHANGE_AFFAIR_TAG = 'CHANGE_AFFAIR_TAG'
export function changeAffairTag(newAffair, callback) {
  return (dispatch) => {
    fetch(config.api.affair.homepage_change(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: newAffair.get('id'),
      roleId: newAffair.get('roleId'),
      body: JSON.stringify({
        tags: newAffair.get('tags'),
      }),
    }).then((res) => res.json()).then((res) => {
      callback ? callback(res) : null
      newAffair = newAffair.set('tags', JSON.stringify(newAffair.get('tags')))
      dispatch({
        type: CHANGE_AFFAIR_TAG,
        payload: newAffair,
      })
    })
  }
}

// 获取事务信息
export const FETCH_AFFAIR_INFO_SUCCESS = 'FETCH_AFFAIR_INFO_SUCCESS'
export function getAffairInfo(affairId, roleId, withPermission = false) {
  return (dispatch) => {
    return fetch(config.api.affair.info.get(), {
      method: 'GET',
      credentials: 'include',
      affairId: affairId,
      roleId: roleId,
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      const affairData = json.data
      if (json.code == 0 && affairData && !withPermission) {
        dispatch({
          type: FETCH_AFFAIR_INFO_SUCCESS,
          payload: {
            affairId,
            info: affairData,
          }
        })
      } else {
        fetch(config.api.permission.roleMaps(), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roleId: affairData.roleId,
            affairId: affairId,
          }),
        }).then((res) => res.json()).then((json2) => {
          dispatch({
            type: FETCH_AFFAIR_INFO_SUCCESS,
            payload: {
              affairId,
              info: {
                ...affairData,
                permissions: json2.operationIdList,
              },
            }
          })
        })
      }
      return json
    })
  }
}

// 获取事务的直接子事务
export const FETCH_AFFAIR_CHILDREN_SUCCESS = 'FETCH_AFFAIR_CHILDREN_SUCCESS'
export function fetchAffairChildren(affairId, roleId) {
  return (dispatch) => fetch(config.api.affair.children.get(), {
    method: 'GET',
    credentials: 'include',
    affairId,
    roleId,
  }).then((res) => res.json()).then((res) => {
    dispatch({
      type: FETCH_AFFAIR_CHILDREN_SUCCESS,
      payload: {
        affairId,
        children: res.data,
      },
    })
  })
}

// 添加新事务到事务列表中
export const ADD_AFFAIR_TO_LIST = 'ADD_AFFAIR_TO_LIST'
export function addAffairToList(newAffair, parentAffair) {
  return (dispatch) => {
    dispatch({
      type: ADD_AFFAIR_TO_LIST,
      payload: {
        newAffair,
        parentAffair,
      },
    })
  }
}


//修改事务设置面板信息
export const CHANGE_AFFAIR_SETTING = 'CHANGE_AFFAIR_SETTING'
export function changeAffairSetting(isShow, tab, isAdding) {
  return (dispatch) => {
    dispatch({
      type: CHANGE_AFFAIR_SETTING,
      payload: {
        isShow: isShow,
        tab: tab,
        isAdding: isAdding,
      }
    })
  }
}

//修改事务信息
export const MODIFY_AFFAIR_INFO_SUCCESS = 'MODIFY_AFFAIR_INFO_SUCCESS'
export function modifyAffairInfo(affair, affairMemberId, newInfo, local = false) {
  affairMemberId = affair.get('affairMemberId')

  if (local) {
    //修改本地的事务信息，不提交给服务器
    return (dispatch) => {
      dispatch({
        type: MODIFY_AFFAIR_INFO_SUCCESS,
        payload: {
          affair: affair,
          info: newInfo
        }
      })
    }
  }

  return (dispatch) => {
    return fetch(config.api.affair.info.update(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify(newInfo),
    }).then((res) => {
      return res.json()
    }).then(messageHandler).then((json) => {
      if (json.code == 0) {
        message.success('修改已保存', 0.5)
        dispatch({
          type: MODIFY_AFFAIR_INFO_SUCCESS,
          payload: {
            affair: affair,
            info: newInfo
          }
        })
        if (newInfo.hasOwnProperty('Homepage')) {
          dispatch({
            type: UPDATE_HOMEPAGE_AFFAIR,
            payload: affair.get('id')
          })
        }
      }
    })
  }
}

//移动事务
export const MOVE_AFFAIR = 'MOVE_AFFAIR'
export function requestMoveAffair(affair, targetAffair) {
  return (dispatch) => {
    return fetch(config.api.affair.move.post(affair.get('affairMemberId'), targetAffair.get('id')), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId')
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code === 0) {
        dispatch({
          type: MOVE_AFFAIR,
          payload: {
            affair: affair,
            targetAffair: targetAffair
          }
        })
      }
      return res
    })
  }
}

//使事务失效
export const TERMINATE_AFFAIR_SUCCESS = 'TERMINATE_AFFAIR_SUCCESS'
export function terminateAffair(affair, roleId) {
  return (dispatch) => {
    return fetch(config.api.affair.terminate.post(), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: roleId,
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        dispatch({
          type: TERMINATE_AFFAIR_SUCCESS,
          payload: {
            affair: affair
          }
        })
      }
      return json
    })
  }
}

// 更新事务的发布信息
export const UPDATE_AFFAIR_ANNOUNCEMENT = 'UPDATE_AFFAIR_ANNOUNCEMENT'
export function updateAffairAnnouncement(announcements) {
  return (dispatch) => dispatch({
    type: UPDATE_AFFAIR_ANNOUNCEMENT,
    payload: announcements,
  })
}
export const UPDATE_AFFAIR_ANNOUNCEMENT_INDEX = 'UPDATE_AFFAIR_ANNOUNCEMENT_INDEX'
export function updateAffairAnnouncementIndex(indexes) {
  return (dispatch) => dispatch({
    type: UPDATE_AFFAIR_ANNOUNCEMENT_INDEX,
    payload: indexes,
  })
}

// 更新发布公开性
export const UPDATE_ANNOUNCEMENT_PUBLICTYPE_SUCCESS = 'UPDATE_ANNOUNCEMENT_PUBLICTYPE_SUCCESS'
export function updateAnnouncementPublictype(announcementId, publicType, affair) {
  return () => {
    return fetch(config.api.announcement.publicType.update(announcementId, publicType), {
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcementId,
      method: 'POST',
      credentials: 'include',
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      return json
    })
  }
}

// 设置发布置顶
export const UPDATE_ANNOUNCEMENT_ISTOP_SUCCESS = 'UPDATE_ANNOUNCEMENT_ISTOP_SUCCESS'
export function updateAnnouncementIsTop(announcementId, isTop, affairMemberId) {
  return () => {
    return fetch(config.api.announcement.isTop.update(announcementId, isTop, affairMemberId), {
      method: 'POST',
      credentials: 'include',
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      return json
    })
  }
}

// 变更发布
export const MODIFY_ANNOUNCEMENT_SUCCESS = 'MODIFY_ANNOUNCEMENT_SUCCESS'
export function modifyAnnouncement(data, affair) {
  return () => {
    return fetch(config.api.announcement.version.post, {
      method: 'POST',
      credentials: 'include',
      body: data,
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      return json
    })
  }
}

export const UPDATE_AFFAIR_TAGS = 'UPDATE_AFFAIR_TAGS'
export function updateAffairTags(affairId, tagsJSONString) {
  return (dispatch) => dispatch({
    type: UPDATE_AFFAIR_TAGS,
    payload: {
      affairId,
      tagsJSONString,
    }
  })
}


//获取某一个事务的所有活跃角色, 请注意参数的顺序。
export const GET_AFFAIR_ROLES = 'GET_AFFAIR_ROLES'
export function getAffairRoles(roleId, affairId, active, containChild = false) {
  return (dispatch) => {
    return fetch(config.api.affair.role.current(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      roleId,
      affairId,
      credentials: 'include',
      body: JSON.stringify({
        key: '',
        lastTitlePY: '',
        limit: 20,
        active: active,
        containChild: containChild,
      }),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        let data = json.data
        dispatch({
          type: GET_AFFAIR_ROLES,
          payload: {
            data: data,
            active: active,
            affairId: affairId,
          }
        })
      }
    })
  }
}

//获取一个事务的任务列表
export const GET_AFFAIR_TASKS = 'GET_AFFAIR_TASKS'
export function getAffairTasks(affairId, roleId) {
  const stateMap = {
    1: '未开始',
    2: '进行中',
    3: '已完成',
    4: '取消',
  }
  return (dispatch) => {
    return fetch(config.api.task.list(''), {
      method: 'GET',
      credentials: 'include',
      affairId,
      roleId,
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        let data = json.data
        let list = []
        data.map((v, k) => {
          let tmp = {}
          tmp.taskName = v.name
          tmp.taskState = stateMap[v.stateId]
          // tmp.taskMember = v.roles;
          tmp.taskMember = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
          tmp.id = v.id
          tmp.tableId = k + 1
          tmp.key = `${k + 1}`
          list.push(tmp)
        })
        dispatch({
          type: GET_AFFAIR_TASKS,
          payload: {
            data: list,
            affairId: affairId,
          },
        })
      }
    })
  }
}

//修改一个任务的负责人
export const CHANGE_TASK_OWNER = 'CHANGE_TASK_OWNER'
export function changeTaskOwner(affair, taskId, role) {
  return (dispatch) => {
    return fetch(config.api.task.change_admin(taskId, role.roleId), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        dispatch({
          type: CHANGE_TASK_OWNER,
          payload: {
            affair: affair,
            taskId: taskId,
            role: role,
          }
        })
      }
    })
  }
}

export function followAffair(affairId, follow) {
  return fetch(config.api.affair.star(affairId, follow), {
    method: 'POST',
    credentials: 'include',
  }).then((res) => res.json())
}
