import config from '../config'
import {
  message
} from 'antd'
import {
  fromJS
} from 'immutable'
import { LOGIN_SUCCESS } from './user'

let _intervalIdChangeAccount = null

export const SENT_CHANGE_ACCOUNT_VERIFY_CODE = 'SENT_CHANGE_ACCOUNT_VERIFY_CODE'
export const SENT_CHANGE_ACCOUNT_COOL_DOWN = 'SENT_CHANGE_ACCOUNT_COOL_DOWN'
export const VERIFIED_CODE_SUCCESS = 'VERIFIED_CODE_SUCCESS'
export const COOL_DOWN = 5

export function createJWT(account, password, verifyCode) {
  const formData = new FormData()
  formData.append('username', account)
  formData.append('password', password)
  formData.append('client', 'frontend')
  if (verifyCode) {
    formData.append('verifyCode', verifyCode)
  }

  return fetch(`${config.gwURL}/oauth/token?grant_type=password`, {
    headers: {
      'Authorization': 'Basic ZnJvbnRlbmQ6ZnJvbnRlbmQ=',
    },
    method: 'POST',
    credentials: 'include',
    body: formData,
  }).then((res) => res.json())
}

export function createJWTByPhone(account, verifyCode) {
  const formData = new FormData()
  formData.append('username', account)
  formData.append('password', verifyCode)
  formData.append('client', 'frontend')
  formData.append('type', 'VERIFYCODE')

  return fetch(`${config.gwURL}/oauth/token?grant_type=password`, {
    headers: {
      'authorization': 'Basic ZnJvbnRlbmQ6ZnJvbnRlbmQ=',
    },
    method: 'POST',
    credentials: 'include',
    body: formData,
  }).then((res) => res.json())
}

export function createJWTByQR(account, verifyCode) {
  const formData = new FormData()
  formData.append('username', account)
  formData.append('password', verifyCode)
  formData.append('client', 'frontend')
  formData.append('type', 'QRSCAN')
  return fetch(`${config.gwURL}/oauth/token?grant_type=password`, {
    headers: {
      'authorization': 'Basic ZnJvbnRlbmQ6ZnJvbnRlbmQ=',
    },
    method: 'POST',
    credentials: 'include',
    body: formData,
  }).then((res) => res.json())
}

export function refreshJWT(refreshToken) {
  return (dispatch) => {
    return fetch(`${config.gwURL}/oauth/token?grant_type=refresh_token&refresh_token=${refreshToken}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ZnJvbnRlbmQ6ZnJvbnRlbmQ=',
      },
    }).then((res) => res.json()).then((res) => {
      if (res) {
        dispatch({
          type: LOGIN_SUCCESS,
          payload: res
        })
      }
    })
  }
}

export function checkJWT(token) {
  const formData = new FormData()
  formData.append('token', token.get('access_token'))

  return fetch(`${config.gwURL}/oauth/check_token`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Authorization': 'Basic ZnJvbnRlbmQ6ZnJvbnRlbmQ=',
    },
    body: formData,
  }).then((res) => res.json()).then((json) => {
    if (json && json.active) {
      return null
    } else {
      // 需要重新获取 token
      return token.get('refresh_token')
    }
  })
}

export function fetchChangeAccountVerifyCode(chosenAccount) {
  // 在一段时间内无法重复发送验证码
  if (_intervalIdChangeAccount) return

  return (dispatch) => {
    return fetch(config.api.verifyCode.get(chosenAccount), {
      method: 'GET',
      credentials: 'include',
    }).then((res) => {
      return res.json()
    }).then((res) => {
      if (!res.data) {
        message.error('发送验证码过于频繁')
        return
      }

      if (res.code === 18) {
        message.error('该账号已被使用')
        return
      }

      dispatch({
        type: SENT_CHANGE_ACCOUNT_VERIFY_CODE,
        payload: true,
      })

      let cooldown = COOL_DOWN
      // 进行倒计时
      _intervalIdChangeAccount = setInterval(() => {
        if (cooldown > 1) {
          dispatch({
            type: SENT_CHANGE_ACCOUNT_COOL_DOWN,
            payload: {
              count: --cooldown,
            },
          })
        } else {
          clearInterval(_intervalIdChangeAccount)
          _intervalIdChangeAccount = null

          dispatch({
            type: SENT_CHANGE_ACCOUNT_VERIFY_CODE,
            payload: false,
          })

          dispatch({
            type: SENT_CHANGE_ACCOUNT_COOL_DOWN,
            payload: {
              count: COOL_DOWN,
            },
          })
        }
      }, 1000)
    })
  }
}

export function fetchNewAccountVerifyCode(chosenAccount) {
  // 在一段时间内无法重复发送验证码
  if (_intervalIdChangeAccount) return

  return (dispatch) => {
    return fetch(config.api.verifyCode.newAccount.post(chosenAccount), {
      method: 'GET',
      credentials: 'include',
    }).then((res) => {
      return res.json()
    }).then((res) => {
      if (!res.data) {
        message.error('发送验证码过于频繁')
        return
      } else if (res.code === 18) {
        message.error('该账号已被使用')
      } else if (res.code === 0) {
        dispatch({
          type: SENT_CHANGE_ACCOUNT_VERIFY_CODE,
          payload: true,
        })

        let cooldown = COOL_DOWN
        // 进行倒计时
        _intervalIdChangeAccount = setInterval(() => {
          if (cooldown > 1) {
            dispatch({
              type: SENT_CHANGE_ACCOUNT_COOL_DOWN,
              payload: {
                count: --cooldown,
              },
            })
          } else {
            clearInterval(_intervalIdChangeAccount)
            _intervalIdChangeAccount = null

            dispatch({
              type: SENT_CHANGE_ACCOUNT_VERIFY_CODE,
              payload: false,
            })

            dispatch({
              type: SENT_CHANGE_ACCOUNT_COOL_DOWN,
              payload: {
                count: COOL_DOWN,
              },
            })
          }
        }, 1000)
      }
    })
  }
}

export function verifyVerificationCode(verificationCode, token, correctCb, wrongCb) {
  return (dispatch) => {
    fetch(config.api.verifyCode.verfiyAccount.post(token, verificationCode), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        verifyCode: verificationCode,
        token,
      }),
    }).then((res) => {
      return res.json()
    }).then((json) => {
      if (json.code === 0) {
        //验证码正确
        if (_intervalIdChangeAccount) clearInterval(_intervalIdChangeAccount)

        dispatch({
          type: SENT_CHANGE_ACCOUNT_VERIFY_CODE,
          payload: false,
        })
        dispatch({
          type: SENT_CHANGE_ACCOUNT_COOL_DOWN,
          payload: {
            count: COOL_DOWN,
          },
        })
        correctCb()
      } else {
        //验证码错误
        wrongCb()
      }
    })
  }
}


export function changeMobileorEemail(verificationCode, newAccount, type, corretCb, wrongCb) {
  return (dispatch) => {
    fetch(config.api.verifyCode.updateAccount.post(newAccount, verificationCode), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        verifyCode: verificationCode,
        token: newAccount
      }),
    }).then((res) => {
      return res.json()
    }).then((json) => {
      if (json.code === 0) {
        //验证码正确
        if (_intervalIdChangeAccount) clearInterval(_intervalIdChangeAccount)

        dispatch({
          type: SENT_CHANGE_ACCOUNT_VERIFY_CODE,
          payload: false,
        })
        dispatch({
          type: SENT_CHANGE_ACCOUNT_COOL_DOWN,
          payload: {
            count: COOL_DOWN,
          }
        })
        dispatch({
          type: VERIFIED_CODE_SUCCESS,
          payload: {
            newAccount: newAccount,
            type: type
          }
        })
        corretCb()
      } else if (json.code === 15) {
        message.error('验证码错误')
        wrongCb()
      } else if (json.code === 18) {
        message.error('改账号已存在')
        wrongCb()
      } else {
        wrongCb()
      }
    })
  }
}

export const FETCH_PERMISSION_SETTING = 'FETCH_PERMISSION_SETTING'
export function fetchPermissionSetting() {
  return (dispatch) => {
    return fetch(config.api.permission.settings(), {
      method: 'GET',
      json: true,
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        // let permissionInformationList = json.data.sort((a, b) => {
        //   if (a.level != b.level) {
        //     return a.level - b.level
        //   } else {
        //     return a.category - b.category
        //   }
        // })
        let permissionInformationList = json.data
        permissionInformationList = fromJS(permissionInformationList)
        dispatch({
          type: FETCH_PERMISSION_SETTING,
          payload: {
            permissionInformationList: permissionInformationList
          }
        })
      }
    })
  }
}

export const FETCH_AFFAIR_PERMISSION = 'FETCH_AFFAIR_PERMISSION'
export function fetchAffairPermission(affairId, roleId, resourceId = 0) {
  return (dispatch) => {
    return fetch(config.api.permission.roleMaps(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roleId: roleId,
        affairId: affairId,
      }),
      resourceId
    }).then((res) => res.json()).then((json) => {
      dispatch({
        type: FETCH_AFFAIR_PERMISSION,
        payload: {
          affairId,
          roleId,
          permission: json,
        }
      })
    })
  }
}
