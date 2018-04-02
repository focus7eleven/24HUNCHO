import {
    actionNames
} from 'action-utils'
import config from '../config'
import { notification } from 'antd'
import messageHandler from 'messageHandler'

export const ALLIANCE_CREATE = actionNames('ALLIANCE_CREATE')
export function createAlliance(alliance, cb) {
  return {
    types: ALLIANCE_CREATE,
    callAPI: () => {
      cb(true)
      return fetch(config.api.alliance.post(alliance.name, alliance.code, alliance.affairs), {
        method: 'POST',
        credentials: 'include'
      }).then((res) => {
        return res.json()
      }).then(messageHandler).then((json) => {
        cb(false)
        return json
      })
    }
  }
}

export const ALLIANCE_VERIFICATION_SUBMITTED = 'ALLIANCE_VERIFICATION_SUBMITTED'
export function verificationSubmitted(allianceId) {
  return (dispatch) => {
    dispatch({
      type: ALLIANCE_VERIFICATION_SUBMITTED,
      payload: {
        allianceId,
      },
    })
  }
}

export const FETCH_ALLIANCE_LIST = actionNames('FETCH_ALLIANCE_LIST')
export function fetchAllianceList(userId) {
  return {
    types: FETCH_ALLIANCE_LIST,
    callAPI: () => {
      return fetch(config.api.alliance.get(userId), {
        method: 'GET',
        credentials: 'include'
      }).then((res) => {
        return res.json()
      }).then((json) => {
        return json
      })
    }
  }
}

//获取某个盟底下的事务树
export const GET_SINGLE_TREE = 'GET_SINGLE_TREE'
export function getSingleTree(allianceId){
  return (dispatch) => {
    return fetch(config.api.alliance.affairTree.singleTree(allianceId), {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        dispatch({
          type: GET_SINGLE_TREE,
          payload: {
            allianceId: allianceId,
            data: json.data,
          }
        })

      }
      else {
        notification.error({
          message: '获取事务树失败'
        })
      }
    })
  }
}
