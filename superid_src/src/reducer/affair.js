import {
  FETCH_AFFAIR_TREE_SUCCESS,
  READ_TREND,
  TOGGLE_STICK,
  CHANGE_AFFAIR_COVER,
  FETCH_AFFAIR_INFO_SUCCESS,
  MODIFY_AFFAIR_INFO_SUCCESS,
  CHANGE_AFFAIR_SETTING,
  CHANGE_AFFAIR_ROLE,
  ADD_AFFAIR_TO_LIST,
  MOVE_AFFAIR,
  UPDATE_AFFAIR_ANNOUNCEMENT,
  UPDATE_AFFAIR_ANNOUNCEMENT_INDEX,
  UPDATE_ANNOUNCEMENT_PUBLICTYPE_SUCCESS,
  UPDATE_ANNOUNCEMENT_ISTOP_SUCCESS,
  FETCH_ALL_AFFAIR_IN_ALLIANCE,
  MODIFY_ANNOUNCEMENT_SUCCESS,
  RESET_AFFAIR,
  GET_AFFAIR_ROLES,
  UPDATE_PERMISSIONS,
  FETCH_AFFAIR_LIST,
  FETCH_FOLLOWED_AFFAIR_LIST,
  UPDATE_AFFAIR_TASK_LIST,
  FETCH_AFFAIR_CHILDREN_SUCCESS,
  FETCH_AFFAIR_HISTORY_LIST,
  UPDATE_AFFAIR_TAGS,
  GET_AFFAIR_TASKS,
  CHANGE_TASK_OWNER,
  CREATE_NEW_ROLE,
  CHANGE_AFFAIR_DESCRIPTION,
  CHANGE_AFFAIR_TAG,
} from '../actions/affair'
import {
  ALLIANCE_CREATE
} from '../actions/alliance'
import {
  FETCH_AFFAIR_PERMISSION,
} from '../actions/auth'
import {
  fromJS,
  List,
  Map,
} from 'immutable'
import {
  Affair,
} from '../models/Affair'

/*
 * 为每个事务节点添加_path
 * 方便索引
 */
export const indexAffairTree = (tree, path = List()) => {
  return tree.map((node, index) => {
    const newPath = path.push(index)

    if (newPath !== node.get('_path')) {
      node = node.set('_path', newPath)
    }
    return node.update('children', (children) => {
      if (children) {
        return indexAffairTree(children, newPath.push('children'))
      } else {
        return List()
      }
    })
  })
}

export const flattenAffairTree = (affairTree) => {
  let affairList = List()

  const loop = (affairTree) => {
    affairTree.forEach((affair) => {
      affairList = affairList.push(affair)
      if (affair.get('children')) {
        loop(affair.get('children'))
      }
    })
  }
  loop(affairTree)

  return affairList
}

export const findAffairInTree = (tree, targetId) => tree.find((v) => v.get('id') == targetId) || tree.reduce((reduction, v) => {
  return reduction || findAffairInTree(v.get('children'), targetId) || null
}, null)

const _updateAffairInfo = (state, newAffair) => {
  return state.update('affairList', (affairList) => {

    return affairList.update(affairList.findIndex((affair) => affair.get('affairId') == newAffair.get('id')), (affair) => {
      if (!affair) return affair

      return affair.update('affairName', (v) => newAffair.get('name') || v)
        .update('avatar', (v) => newAffair.get('avatar') || v)
        .update('shortName', (v) => newAffair.get('shortName') || v)
    })
  })
}

const initialSetting = {
  isShow: false,
  tab: 0,
  isAdding: false,
}
const initialAttender = {
  currentRoles: Map(),
  historyRoles: Map(),
}
const initialState = fromJS({
  affairSetting: initialSetting,
  affairMap: Map(),
  affairList: List(),
  affairTree: List(),
  affairHistoryList: List(),
  permissionList: List(),
  affairAttender: initialAttender,
  affairTask: Map(),
  affairTaskList: List(),
})

export default (state = initialState, action) => {
  let affair, trendIndex, affairId, announcementId, role, taskId, list, affairTask, obj, active, modifyResult, isTop, publicType, deletedAffair, info, parentAffair, newAffair, data, affairTree

  switch (action.type) {
    case FETCH_AFFAIR_PERMISSION:
      return state.setIn(['affairMap', action.payload.affairId, 'permissions'], fromJS(action.payload.permission.operationIdList))
    case CREATE_NEW_ROLE:
      return state.updateIn(['affairMap', action.payload.affairId, 'joinedRoles'], (roles) => roles ? roles.push(action.payload.role.roleId) : null)
    case UPDATE_PERMISSIONS:
      return state.set('permissionList', action.payload)
    case FETCH_ALL_AFFAIR_IN_ALLIANCE:
      affair = action.payload.affair

      return state.update('affairTree', (affairTree) => {
        return indexAffairTree(affairTree.map((v) => {
          if (v.get('allianceId') == affair.allianceId) {
            return v.set('children', fromJS(affair).get('children'))
          } else {
            return v
          }
        }))
      })
    case ADD_AFFAIR_TO_LIST:
      newAffair = action.payload.newAffair

      // 更新事务列表
      state = state
        .update('affairList', (affairList) => affairList.filter((v) => v.get('affairId') != newAffair.affairId)
          .push(fromJS(newAffair))
        )

      //更新事务树
      parentAffair = action.payload.parentAffair
      parentAffair = findAffairInTree(state.get('affairTree'), parentAffair.get('id'))
      if (parentAffair) {
        state = state.updateIn(
          List(['affairTree']).concat(parentAffair.get('_path')).concat('children'),
          (v) => v.push(
            fromJS(newAffair)
              .set('children', List())
              .set('_path', parentAffair
                .get('_path')
                .push('children')
                .push(parentAffair.get('children').size)
              )
            )
          )
          .update('affairTree', (v) => indexAffairTree(v))
      }
      return state

    case RESET_AFFAIR:
      return initialState
    case FETCH_AFFAIR_TREE_SUCCESS:
      affairTree = indexAffairTree(fromJS(action.payload.affairTree).filter((v) => v.get('id')))
      return state.set('affairTree', affairTree)
    case ALLIANCE_CREATE[1]:
      data = action.response.data.affairTree
      return state
        .update('affairList', (affairList) => affairList.push(fromJS({
          level: 1,
          affairId: data.id,
          shortName: data.shortName,
          isPersonal: data.isPersonal,
          isStuck: data.isStuck,
          avatar: data.avatar,
          allianceId: data.allianceId,
          affairName: data.name,
          rootName: data.name,
          affairMessages: [],
        })))
    case FETCH_AFFAIR_LIST:
      if (typeof action.payload === 'string') {
        return state
      }
      return state.set('affairList', fromJS(action.payload))
    case FETCH_FOLLOWED_AFFAIR_LIST:
      return state.set('followedAffairList', fromJS(action.payload))
    case FETCH_AFFAIR_CHILDREN_SUCCESS:
      // 更新事务详情中的的子事务。
      state = state.setIn(['affairMap', action.payload.affairId, 'children'], fromJS(action.payload.children))
      // 更新事务列表。
      return state

    case UPDATE_AFFAIR_TASK_LIST:
      return state.set('affairTaskList', List(action.payload).map((v) => Map({
        name: v.name,
        rate: v.priority,
        id: v.id,
        from: `${v.affairName}－${v.allianceName}`,
        endTime: v.endTime,
      })))

    case FETCH_AFFAIR_HISTORY_LIST:
      return state.set('affairHistoryList', fromJS(action.payload))
    case READ_TREND:
      ({
        affair,
        trendIndex
      } = action.payload)
      return state.updateIn(List(['affairTree']).concat(affair.get('_path')).concat(['trends', trendIndex]), (v) => v.set('read', true))
    case TOGGLE_STICK:
      ({
        affair
      } = action.payload)
      return state.update('affairList', (affairList) => affairList.map((v) => v.get('affairId') == affair.get('affairId') ? v.update('isStuck', (w) => !w) : v))
    case CHANGE_AFFAIR_COVER:
      return state.setIn(['affairMap', action.payload.get('id').toString()], action.payload)
    case CHANGE_AFFAIR_DESCRIPTION:
      return state.setIn(['affairMap', action.payload.get('id').toString()], action.payload)
    case CHANGE_AFFAIR_TAG:
      return state.setIn(['affairMap', action.payload.get('id').toString()], action.payload)
    case CHANGE_AFFAIR_SETTING:
      return state.update('affairSetting', (v) => v.merge(action.payload))
    case CHANGE_AFFAIR_ROLE:
      return state.updateIn(List(['affairTree']).concat(action.payload.affair.get('_path')), (affair) => affair.set('roleId', action.payload.roleId))
    case FETCH_AFFAIR_INFO_SUCCESS:
      // Fix server response error
      if (!action.payload.info.covers) {
        action.payload.info.covers = '[]'
      }
      // if (!action.payload.info.permissions) {
      //   action.payload.info.permissions = "*"
      // }
      action.payload.info.id = action.payload.info.id.toString()
      affair = new Affair(fromJS(action.payload.info))
      if (state.getIn(['affairMap', action.payload.affairId.toString(), 'children'])) {
        affair = affair.set('children', state.getIn(['affairMap', action.payload.affairId.toString(), 'children']))
      }
      // return _updateAffairInfo(state.setIn(['affairMap', action.payload.affairId.toString()], affair), affair)
      return state.setIn(['affairMap', action.payload.affairId.toString()], affair)
    case MODIFY_AFFAIR_INFO_SUCCESS:
      ({
        affair,
        info
      } = action.payload)
      info = fromJS(info)
      return _updateAffairInfo(state.updateIn(['affairMap', affair.get('id')], (affair) => affair.mergeDeep(info)), affair.mergeDeep(info))
    case MOVE_AFFAIR:
      deletedAffair = state.getIn(List(['affairTree']).concat(action.payload.affair.get('_path')))
      return state.deleteIn(List(['affairTree']).concat(action.payload.affair.get('_path')))
        .updateIn(List(['affairTree']).concat(action.payload.targetAffair.get('_path').concat('children')), (children) => children.push(deletedAffair))
        .update('affairTree', (v) => indexAffairTree(v))
    // case TERMINATE_AFFAIR_SUCCESS:
    //   return state.update('affairList', (affairList) => affairList.filter((affair) => affair.get('affairId') != action.payload.affair.get('id')))
    //     .deleteIn(List(['affairTree']).concat(action.payload.affair.get('_path')))
    //     .update('affairTree', (v) => indexAffairTree(v))
    case UPDATE_AFFAIR_ANNOUNCEMENT:
      action.payload.forEach((announcement) => {
        affair = findAffairInTree(state.get('affairTree'), announcement.affairId)
        state = state.update('affairTree', (tree) => tree.updateIn(affair.get('_path'), (affair) => affair.mergeIn(['announcement', announcement.announcementId], fromJS(announcement))))
      })
      return state
    case UPDATE_AFFAIR_ANNOUNCEMENT_INDEX:
      action.payload.sort((a, b) => b['modifyTime'] - a['modifyTime']).forEach((announcement) => {
        affair = findAffairInTree(state.get('affairTree'), announcement.affairId)
        state = state.update('affairTree', (tree) => tree.updateIn(affair.get('_path'), (affair) => affair.updateIn(['announcement', announcement.announcementId], (announcementItem) => {
          return (announcementItem || Map()).merge(fromJS(announcement))
        })))
      })
      return state
    case UPDATE_ANNOUNCEMENT_PUBLICTYPE_SUCCESS:
      publicType = action.payload.publicType
      affairId = action.payload.affairId
      announcementId = action.payload.announcementId
      affair = findAffairInTree(state.get('affairTree'), affairId)
      state = state.update('affairTree', (tree) => tree.updateIn(affair.get('_path'), (affair) => affair.updateIn(['announcement', Number.parseInt(announcementId)], (v) => v.set('publicType', publicType))))
      return state
    case UPDATE_ANNOUNCEMENT_ISTOP_SUCCESS:
      isTop = action.payload.isTop
      affairId = action.payload.affairId
      announcementId = action.payload.announcementId
      affair = findAffairInTree(state.get('affairTree'), affairId)
      state = state.update('affairTree', (tree) => tree.updateIn(affair.get('_path'), (affair) => affair.updateIn(['announcement', Number.parseInt(announcementId)], (v) => v.set('isTop', isTop))))
      return state
    case MODIFY_ANNOUNCEMENT_SUCCESS:
      affairId = action.payload.affairId
      modifyResult = action.payload.modifyResult
      affair = findAffairInTree(state.get('affairTree'), affairId)
      state = state.update('affairTree', (tree) => tree.updateIn(affair.get('_path'), (affair) => affair.mergeIn(['announcement', modifyResult.announcementId], (fromJS(modifyResult)))))
      return state
    case GET_AFFAIR_ROLES:
      obj = action.payload.data
      active = action.payload.active
      affairId = action.payload.affairId
      if (active) {
        let currentRoles = state.getIn(['affairAttender', 'currentRoles'])
        if (currentRoles.find((v, k) => {
          k == affairId
        })) {
          state = state.updateIn(['affairAttender', 'currentRoles'], (v) => v.merge(obj))
        } else {
          state = state.updateIn(['affairAttender', 'currentRoles'], (v) => v.set(affairId, obj))
        }
      } else {
        let historyRoles = state.getIn(['affairAttender', 'historyRoles'])
        if (historyRoles.find((v, k) => {
          k == affairId
        })) {
          state = state.updateIn(['affairAttender', 'historyRoles'], (v) => v.merge(obj))
        } else {
          state = state.updateIn(['affairAttender', 'historyRoles'], (v) => v.set(affairId, obj))
        }
      }

      return state
    case UPDATE_AFFAIR_TAGS:
      return state.setIn(['affairMap', action.payload.affairId, 'tags'], action.payload.tagsJSONString)
    case GET_AFFAIR_TASKS:
      list = action.payload.data
      affairId = action.payload.affairId
      affairTask = state.get('affairTask')
      if (affairTask.find((v, k) => {
        k == affairId
      })) {
        state = state.update('affairTask', (v) => v.merge(list))
      } else {
        state = state.update('affairTask', (v) => v.set(affairId, list))
      }
      return state
    case CHANGE_TASK_OWNER:
      affair = action.payload.affair
      role = action.payload.role
      taskId = action.payload.taskId
      state = state.updateIn(['affairTask', affair.get('id')], (v) => {
        let newlist = []
        v.map((v) => {
          if (v.id == taskId) {
            let newtask = {
              id: v.id,
              key: v.key,
              tableId: v.tableId,
              taskState: v.taskState,
              taskName: v.taskName,
            }
            let newmember = []
            v.taskMember.map((v) => {
              if (v.type != 0) {
                newmember.push(v)
              }
            })
            newmember.push(role)
            newtask.taskMember = newmember
            newlist.push(newtask)
          } else {
            newlist.push(v)
          }
        })
        return newlist
      })

      return state
    default:
      return state
  }
}

export const constructAffairTree = (rawTree) => {
  let newAffair = fromJS(rawTree)
  // if (rawTree.children) {
  //   rawTree.children.forEach(child => {
  //     newAffair = newAffair.set('children', List(), children => {
  //       return children.push(constructAffairTree(child))
  //     })
  //   })
  // }

  return newAffair
}
