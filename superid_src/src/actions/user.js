import {
  actionNames
} from 'action-utils'
import {
  getHost
} from '../api/URLConfig'
import config from '../config'
import _ from 'underscore'
import {
  RESET_AFFAIR
} from './affair'
import {
  ACTION_TAG,
  CLEAR_MESSAGE
} from './message'

import messageHandler from 'messageHandler'
import {
  createJWT,
  createJWTByPhone,
  createJWTByQR
} from './auth'
import { onMessage } from './notification'

export const SET_HOMEPAGE = 'SET_HOMEPAGE'
export function setHomepage(affair) {
  return (dispatch) => {
    dispatch({
      type: SET_HOMEPAGE,
      payload: {
        affair,
      },
    })
  }
}

export const LOGIN_SUCCESS = 'LOGIN_SUCCESS'
export const NEED_CAPTCHA = 'NEED_CAPTCHA'
export function login(id, pwd, captcha) {
  return (dispatch) => {
    return createJWT(id, pwd, captcha).then(messageHandler).then((json) => {
      /* 如果res.code存在则代表失败，否则代表成功，成功时不存在res.code属性，这里和正常的逻辑不一样 */
      if (json.code) {
        /* code 1007 means requiring verify code */
        /* code 1005 means verify code error*/
        (json.code == 1007 || json.code == 1005) && fetch(config.api.verifyCode.picCode.get(id), {
          method: 'GET',
          credentials: 'include',
        }).then((res) => {
          const reader = new window.FileReader()
          res.blob().then((blob) => {
            reader.readAsDataURL(blob)
            reader.onloadend = () => {
              const base64data = reader.result
              dispatch({
                type: NEED_CAPTCHA,
                status: 1, //1代表登录后用户名密码错误，而需要验证码
                captchaUrl: base64data,
              })
            }
          })
        })

        return json
      } else {
        dispatch({
          type: LOGIN_SUCCESS,
          payload: json,
        })
        return json
      }
    })
  }
}

export const LOGIN_BY_PHONE_SUCCESS = 'LOGIN_BY_PHONE_SUCCESS'
export function loginByPhone(mobile, verifyCode) {
  return (dispatch) => {
    const formData = new FormData()
    formData.append('token', mobile)
    formData.append('verifyCode', verifyCode)

    return fetch(config.api.login.verify, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        createJWTByPhone(mobile, verifyCode).then((res) => {
          if (res) {
            dispatch({
              type: LOGIN_BY_PHONE_SUCCESS,
              payload: res,
            })
          }
        })
      }
      return json
    })
  }
}

export const LOGIN_BY_QR_SUCCESS = 'LOGIN_BY_QR_SUCCESS'
export function loginByQR(qrCode, access_token) {
  return (dispatch) => {
    createJWTByQR(qrCode, access_token).then((res) => {
      if (res) {
        dispatch({
          type: LOGIN_BY_QR_SUCCESS,
          payload: res,
        })
      }
    })
  }
}

export function refreshCaptcha(id) {
  return (dispatch) => fetch(config.api.verifyCode.picCode.get(id), {
    method: 'GET',
    credentials: 'include',
  }).then((res) => {
    const reader = new window.FileReader()
    res.blob().then((blob) => {
      reader.readAsDataURL(blob)
      reader.onloadend = () => {
        const base64data = reader.result
        dispatch({
          type: NEED_CAPTCHA,
          status: 0, //0代表刷新验证码（未点击登录按钮）
          captchaUrl: base64data,
        })
      }
    })
  })
}

export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS'
export function logout() {
  return (dispatch) => {
    return Promise.resolve().then(() => {

      dispatch({
        type: LOGOUT_SUCCESS,
      })
      dispatch({
        type: RESET_AFFAIR,
      })
      // 清空聊天缓存数据
      dispatch({
        tag: ACTION_TAG.ALL,
        type: CLEAR_MESSAGE,
      })

      closeSocket()
    })
  }
}

export const FETCH_USER = actionNames('FETCH_USER')
export function fetchUser() {
  return {
    types: FETCH_USER,
    shouldCallAPI: (state) => {
      // 不会重复获取自己的个人信息。
      return !state.getIn(['user', 'fetched'])
    },
    callAPI: () => {
      return fetch(config.api.user.get, {
        method: 'GET',
        credentials: 'include',
      }).then((res) => {
        return res.json()
      }).then((json) => {
        if (json.code === 0) {
          initSocket(json.data.id)
          return json.data
        }
      })
    },
  }
}

export const UPDATE_USER = actionNames('UPDATE_USER')
export function updateUser(newInfo) {
  // 将表单字段对应到发送更新请求的字段上。
  const newBaseInfo = _.reduce([
    ['gender', 'gender'],
    ['dob', 'birthday'],
    ['name', 'username'],
    ['avatar', 'avatar'],
    ['nicknames', 'nicknames'],
    ['address', 'address'],
    ['username', 'username'],
  ], (mem, field) => {
    if (_.has(newInfo, field[0])) {
      mem[field[1]] = newInfo[field[0]]
    }
    return mem
  }, {})

  // 更新基础信息
  if (_.keys(newBaseInfo).length > 0) {
    return {
      types: UPDATE_USER,
      callAPI: () => fetch(config.api.user.baseinfo.update, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(newBaseInfo),
      }).then((res) => {
        return res.json()
      }).then((json) => {
        return json
      }),
      payload: {
        data: newBaseInfo
      }
    }
  }
  // 更新详细信息公开性
  if (_.has(newInfo, 'publicType')) {
    return {
      types: UPDATE_USER,
      callAPI: () => fetch(config.api.user.publicType.update, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(newInfo['publicType']),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      }).then((res) => {
        return res.json()
      }).then((json) => {
        return json
      }),
      payload: {
        data: {
          publicType: newInfo['publicType']
        }
      }
    }
  }

  //更新tags
  if (_.has(newInfo, 'tags')) {
    return {
      types: UPDATE_USER,
      callAPI: () => fetch(config.api.user.tags.update, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(newInfo),
        headers: {
          'Content-Type': 'application/json'
        }
      }).then((res) => {
        return res.json()
      }).then((json) => {
        return json
      }),
      payload: {
        data: {
          tags: newInfo['tags']
        }
      }
    }
  }
}

export const UPDATE_SUPER_ID = 'UPDATE_SUPER_ID' //还没有加理由，不知道给谁申请
export function updateSuperID(value) {
  return (dispatch) => {
    return fetch(config.api.user.superId.update(value), {
      method: 'POST',
      credentials: 'include',
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        dispatch({
          type: UPDATE_SUPER_ID,
          payload: value,
        })
      }
      return json
    })
  }
}

export const UPDATE_USER_ROLE_LIST = 'UPDATE_USER_ROLE_LIST'
export function fetchUserRoleList() {
  return (dispatch) => {
    return fetch(config.api.user.roleList, {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        dispatch({
          type: UPDATE_USER_ROLE_LIST,
          payload: json.data,
        })
      }
      return json
    })
  }
}

export const UPDATE_HOMEPAGE_AFFAIR = 'UPDATE_HOMEPAGE_AFFAIR'
export function updateHomepageAffair(affairId) {
  return (dispatch) => {
    dispatch({
      type: UPDATE_HOMEPAGE_AFFAIR,
      payload: {
        affairId: affairId
      }
    })
  }
}

export const UPDATE_USER_AVATAR = 'UPDATE_USER_AVATAR'
export function updateUserAvatar(avatar) {
  return (dispatch) => {
    fetch(config.api.file.condense.userAvatar(avatar), {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        url: avatar,
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then((res) => {
      return res.json()
    }).then((json) => {
      if (json.code === 0) {
        dispatch({
          type: UPDATE_USER_AVATAR,
          payload: {
            avatar: json.data,
          }
        })

        return json.data
      }
    })
  }
}


export const UPDATE_USER_MOBILE = 'UPDATE_USER_MOBILE'
export function updateUserMobile(token, code) {
  return (dispatch) => {
    return fetch(config.api.user.updateMobileOrEmail(token, code), {
      method: 'POST',
      credentials: 'include',
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        dispatch({
          type: UPDATE_USER_MOBILE,
          payload: {
            mobile: token,
          }
        })
      }
      return json
    })
  }
}

export const UPDATE_USER_EMAIL = 'UPDATE_USER_EMAIL'
export function updateUserEmail(token, code) {
  return (dispatch) => {
    return fetch(config.api.user.updateMobileOrEmail(token, code), {
      method: 'POST',
      credentials: 'include',
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        dispatch({
          type: UPDATE_USER_EMAIL,
          payload: {
            email: token,
          }
        })
      }
      return json
    })
  }
}

export const UPDATE_AUTH_INFO = 'UPDATE_AUTH_INFO'
export function updateAuthInfo(body) {
  return (dispatch) => {
    return fetch(config.api.user.authInfo.update, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        body
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        dispatch({
          type: UPDATE_AUTH_INFO,
          payload: {
            credentialsId: body.credentialId,
            credentialsType: body.credentialsType,
            credentialsPhotoUrl1: body.credentialsPhotoUrl1,
            credentialsPhotoUrl2: body.credentialsPhotoUrl2,
            realname: body.realname,
          }
        })
      }
      return json
    })
  }
}


const initSocket = (userId) => {
  // 初始化 socket 连接
  const Client = window.SocketClient
  const SOCKET_PORT = 7041
  Client.setServerAddress(getHost(), SOCKET_PORT)

  const ip = getHost() + ':' + SOCKET_PORT
  Client.start(ip, userId, 'xxx', { debug: true }, {
    NOTICE: [(notification) => { onMessage(notification) }],
  })

  // fetch(config.api.chat.getConnector(userId), {
  //   method: 'GET',
  //   credentials: 'include',
  // }).then((res) => res.json()).then(() => {
  //   // const ip = json.data

  // })
}

const closeSocket = () => {

  // 关闭 socket 连接
  const Client = window.SocketClient
  Client.signOut()

}
