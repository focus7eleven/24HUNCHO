import { push } from 'react-router-redux'
import { fromJS } from 'immutable'
import config from 'config'
import messageHandler from 'utils/messageHandler'
import { FETCH_AFFAIR_INFO_SUCCESS } from 'actions/affair'
import PERMISSION from 'utils/permission'

/* push url without permission validation */
export const PUSH_URL = 'PUSH_URL'
export function pushURL(url = '') {
  return (dispatch) => dispatch(push(url))
}

/* push url with affair for local validation  */
export const PUSH_LOCAL_PERMITTED_URL = 'PUSH_LOCAL_PERMITTED_URL'
export function pushLocalPermittedURL(affair, url = '', validation = 'role') {
  return (dispatch) => {
    url = URLPermission.put(url, affair.get('permissions'), validation)
    dispatch(push(url))
  }
}

/*
* push url after permission validation and auto-jump to a legal one
* @param url: just like location.pathname
* @param validation : 'default' | 'affair' | 'role'
*  - 'affair' : 每次切换最多只保留二级标签页，根据权限进行验证
*  - 'role' : 切换可能保留当前路由，根据权限进行验证
*/
export const PUSH_PERMITTED_URL = 'PUSH_PERMITTED_URL'
export function pushPermittedURL(affairId = 0, roleId = 0, url = '', validation = 'role') {
  return (dispatch) => new Promise((onResolve, onError) => {
    if (affairId == 0) {
      console.error('You have passed affairId = 0') // eslint-disable-line no-console
      onError()
    }
    fetch(config.api.affair.info.get(), {
      method: 'GET',
      credentials: 'include',
      affairId: affairId,
      roleId: roleId,
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0 && json.data) {
        fetch(config.api.permission.roleMaps(), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roleId: json.data.roleId,
            affairId: affairId,
          }),
        }).then((res) => res.json()).then((json2) => {
          dispatch({
            type: FETCH_AFFAIR_INFO_SUCCESS,
            payload: {
              affairId,
              info: {
                ...json.data,
                permissions: json2.operationIdList,
              },
            }
          })
          url = URLPermission.put(url, json2.operationIdList, validation)
          dispatch(push(url))
          onResolve()
        })
      }
      return json
    })
  })
}

/* private module fields */

const ROUTE_MAP = fromJS({
  announcement: {
    _index: 'inner',
    _permissions: [PERMISSION.ENTER_PUBLISH_STORE],
  },
  file: {
    _permissions: [PERMISSION.ENTER_FILE_STORE],
    trash: {
      _permissions: [PERMISSION.CHECK_FILE_BIN],
    }
  },
  role: {
    _index: 'current',
    _permissions: [PERMISSION.ENTER_ROLE_STORE, PERMISSION.CHECK_HISTORY_ROLE],
    current: {
      _permissions: [PERMISSION.ENTER_ROLE_STORE]
    },
    history: {
      _permissions: [PERMISSION.CHECK_HISTORY_ROLE]
    }
  },
  repo: {
    _index: 'members',
    _permissions: [PERMISSION.ENTER_MEMBER_STORE, PERMISSION.ENTER_FUND_STORE, PERMISSION.ENTER_MATERIAL_STORE],
    members: {
      _permissions: [PERMISSION.ENTER_MEMBER_STORE],
    },
    funds: {
      _permissions: [PERMISSION.ENTER_FUND_STORE],
    },
    assets: {
      _permissions: [PERMISSION.ENTER_MATERIAL_STORE],
    }
  },
  setting: {
    _index: 'basic',
    _permissions: [PERMISSION.ENTER_AFFAIR_SETTING],
    basic: {
      _permissions: []
    },
    verification: {
      _permissions: []
    },
    auth: {
      _permissions: []
    },
    audit: {
      _permissions: [PERMISSION.SET_APPROVAL],
    },
    homepage: {
      _permissions: [PERMISSION.SET_AFFAIR_HOME],
    }
  },
})

const URLPermission = {
  put: (url, operationIdList, validation) => {
    /* makeup index path */
    let pathList = fromJS(url.split('/').splice(4))
    const indexPage = ROUTE_MAP.getIn([...pathList.toJS(), '_index'])
    if (indexPage != null) {
      url = fromJS(url.split('/')).push(indexPage).join('/')
    }
    switch (validation.toLowerCase()) {
      case 'affair':
        return URLPermission.putByAffair(url, operationIdList)
      case 'role':
        return URLPermission.putByRole(url, operationIdList)
      default:
        return URLPermission.putDefault(url)
    }
  },
  putDefault: (url) => url,
  putByAffair: (url, operationIdList) => {
    return URLPermission.putByRole(fromJS(url.split('/')).take(6).join('/'), operationIdList)
  },
  putByRole: (url, operationIdList) => {
    let pathList = fromJS(url.split('/').splice(4))
    if (pathList.size == 0) { return url }
    operationIdList = fromJS(operationIdList)
    const parentUrl = fromJS(url.split('/')).butLast().join('/')
    const permissions = ROUTE_MAP.getIn([...pathList.toJS(), '_permissions'])
    /* 找到权限的情况下验证该权限，通过则返回，不通过，如果是二级标签页（如物资库）则验证同级其他权限，否则跳转至验证上级 */
    if (permissions != null) {
      if (permissions.size == 0 || permissions.some((p) => operationIdList.contains(p))) {
        return url
      } else {
        if (pathList.size == 2) {
          const siblingMap = ROUTE_MAP
            .getIn([...pathList.butLast().toJS()])
            .filter((v, k) => !k.startsWith('_') && v.get('_permissions').some((p) => operationIdList.contains(p)))
          if (siblingMap.size != 0) {
            return fromJS(url.split('/')).butLast().push(siblingMap.keySeq().first()).join('/')
          }
        }
        return URLPermission.putByRole(parentUrl, operationIdList)
      }
    }
    /* 找不到的情况下只需要验证路径上最近的找得到的父级权限，父级权限通过则通过, 父级权限不通过则继续向上查找并跳转 */
    const realParentUrl = URLPermission.putByRole(parentUrl, operationIdList)
    return parentUrl == realParentUrl ? url : realParentUrl
  },
}
