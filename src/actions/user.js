import { actionNames } from 'action-utils'
import { fromJS } from 'immutable'
import { notification } from 'antd'
import config, { getHost, getChatHost, getPort } from '../config'
import { createJWT } from './auth'
import { AFFAIR_TYPE } from '../containers/header/HeaderContainer'
import { onMessage } from './notification'
import _ from 'lodash'

const {
    baseURL,
    authURL,
    tssURL,
    fileURL,
    affairURL,
    debug,
} = config
const api = {
	user: {
		login: {
			normal:`${authURL}/api/external/login`,
			test: `${authURL}/api/external/login`,
            // verify: `${qrTestURL}/api/verify/checkVerifyCode`,
		},
		password: {
			update: (oldPwd, newPwd) => `${authURL}/api/change-pwd?oldPwd=${oldPwd}&newPwd=${newPwd}`,
      check: (pwd) => `${authURL}/api/check-pwd?password=${pwd}`,
      reset: (account, verifyCode, newPwd) => `${authURL}/api/external/forget-pwd?account=${account}&verifyCode=${verifyCode}&newPwd=${newPwd}`,
		},
    publicType: {
      update: `${authURL}/api/modify-public`,
    },
		get: `${tssURL}/api/user/getUserInfo`,
    role: (affairId) => `${tssURL}/api/role/getRoleInAffair?affairId=${affairId}`,
		register: `${authURL}/api/external/register`,
		reset: `${authURL}/api/external/forget-pwd`,
		baseInfo: `${authURL}/api/modify-base`,
		avatar: (url) => `${fileURL}/condense-user-avatar?url=${url}`,
    roleList: `${affairURL}/role/list`,
    changeMobileOrEmail: (account, verifyCode) => `${authURL}/api/change-mobile-or-email?account=${account}&verifyCode=${verifyCode}`,
    teacherList: `${tssURL}/api/user/getTeachersOfDepartment`,
	},
	verifyCode: {
		register: (token) => `${authURL}/api/external/register-code?token=${token}`, // 注册时获取验证码
		get: (token) => `${baseURL}/user/verify_code?token=${token}`, // unused
		changeToken: (token) => `${authURL}/api/token-change-code?token=${token}`,
		resetPassword: (token) => `${authURL}/api/external/reset-code?token=${token}`,
		verfiyAccount: (token, verifyCode) => `${baseURL}/user/check_token?token=${token}&verifyCode=${verifyCode}`, // TODO
		login: (token) => `${authURL}/api/external/login-code?token=${token}`,
		// 登录图片验证码
		picCode: (token) => `${authURL}/api/external/validate-code?token=${token}`,
	},
}

const initSocket = userId => {
  // 初始化 socket 连接
  const Client = window.SocketClient
  Client.setServerAddress(getHost(), getPort())
  const ip = getHost() + ':7041'
  // const ip = getChatHost() + ':7041'
  Client.start(ip, userId, 'xxx', { debug: true }, {
    NOTICE: [(notification) => { onMessage(notification) }],
  })
}

export const LOGIN_SUCCESS = 'LOGIN_SUCCESS'
export function login(id, pwd, captcha) {
  return (dispatch) => {
    return createJWT(id, pwd, captcha).then((json) => {
      /* 如果res.code存在则代表失败，否则代表成功，成功时不存在res.code属性，这里和正常的逻辑不一样 */
      if (json.code) {
        /* code 1007 means requiring verify code */
        /* code 1005 means verify code error*/
        (json.code == 1007 || json.code == 1005) && fetch(api.verifyCode.picCode(id), {
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
      }
    })
  }
}

export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS'
export const logout = () => dispatch => Promise.resolve().then(() => {
  dispatch({
    type: LOGOUT_SUCCESS
  })
  const Client = window.SocketClient
  Client.signOut()
})

export const FETCH_USER = actionNames('FETCH_USER')
export const fetchUser = () => ({
	types: FETCH_USER,
	shouldCallAPI: (state) => {
		// 不会重复获取自己的个人信息。
		return !state.getIn(['user', 'fetched'])
	},
	callAPI: () => fetch(api.user.get, {
		method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
	}).then(res => {
		return res.json()
	}).then(json => {
		if (json.code === 0) {
			initSocket(json.data.id)
			return json.data
		}
	})
})

//更新用户信息
export const UPDATE_USER = actionNames('UPDATE_USER')
export function updateUser(newInfo, userId){
	const baseInfo = [
		['gender', 'gender'],
		['avatar', 'avatar'],
		['mobile','mobile'],
		['username', 'username'],
	];
	const newBaseInfo = baseInfo.reduce((mem, field) => {
		if(newInfo.hasOwnProperty(field[0])){
			mem[field[1]] = newInfo[field[0]]
		}
		return mem
	}, {});

	//更新基础信息
	if (Object.keys(newBaseInfo).length > 0){
		return {
			types: UPDATE_USER,
			callAPI: () => fetch(api.user.baseInfo, {
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				method: 'POST',
				userId: userId,
				body: JSON.stringify(newBaseInfo),
			}).then((res => {
				return res.json()
			})).then((json) => {
				return json
			}),
			payload: {
				data: newBaseInfo
			}
		}
	}

	//更新隐私设置
	if (newInfo.hasOwnProperty('personInfoPublic')){
		return {
			types: UPDATE_USER,
			callAPI: () => fetch(api.user.publicType.update, {
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				method: 'POST',
				userId: userId,
				body: JSON.stringify(newInfo['personInfoPublic'])
			}).then((res) => res.json()).then((json) => {
				return json
			}),
			payload: {
				data: newInfo
			}
		}
	}
}

// 修改手机号绑定
export const UPDATE_USER_MOBILE_OR_EMAIL = 'UPDATE_USER_MOBILE_OR_EMAIL'
export const changeMobileOrEmail = (isMobile, account, verifyCode) => dispatch => fetch(api.user.changeMobileOrEmail(account, verifyCode), {
  method: 'POST'
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    dispatch({
      type: UPDATE_USER_MOBILE_OR_EMAIL,
      payload: {
        isMobile: isMobile,
        token: account,
      }
    })
  }
  return json
})

// 修改手机号绑定 获取验证码
export const getChangeToken = (token) => dispatch => fetch(api.verifyCode.changeToken(token), {
  method: 'GET',
}).then(res => res.json())

// 判断密码是否正确
export const checkPwd = (passwd) => dispatch => fetch(api.user.password.check(passwd), {
  method: 'POST',
}).then(res => res.json())

// 缩放用户头像并更新用户头像信息
export const uploadAvatar = (url, userId) => dispatch => fetch(api.user.avatar(url), {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json'
	},
	userId: userId,
}).then(res => res.json())

// 根据 type 获取验证码
export const getVerifyCode = (type, token) => dispatch => fetch(api.verifyCode[type](token), {
  method: 'GET'
}).then(res => res.json())

// 通过手机登录
export const loginByPhone = formData => dispatch => fetch(api.user.login.verify, {
  method: 'POST',
  body: formData
}).then(res => res.json())

export const signUp = json => dispatch => fetch(api.user.register, {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
		'Content-Type': 'application/json'
  },
  body: json
}).then(res => res.json())

//重置密码
export const NEED_CAPTCHA = 'NEED_CAPTCHA'
export const resetPassword = (oldPwd, newPwd, userId) => dispatch => fetch(api.user.password.update(oldPwd, newPwd), {
  method: 'POST',
	userId: userId
}).then(res => res.json())

// 忘记密码
export const forgetPassword = (account, verifyCode, newPwd) => dispatch => fetch(api.user.password.reset(account, verifyCode, newPwd), {
  method: 'POST',
}).then(res => res.json())

// 刷新图形验证码
export const refreshCaptcha = id => dispatch => fetch(api.verifyCode.picCode(id), {
	method: 'GET',
}).then(res => {
	const reader = new window.FileReader()
	res.blob().then(blob => {
		reader.readAsDataURL(blob)
		reader.onloadend = () => {
			const base64data = reader.result
			dispatch({
				type: NEED_CAPTCHA,
				status: 0, // 0代表刷新验证码（未点击登录按钮）
				captchaUrl: base64data,
			})
		}
	})
})

// 获取在课程或小组中的角色
export const GET_USER_ROLE = actionNames('GET_USER_ROLE')
export function getUserRole(affairId) {
  return {
    types: GET_USER_ROLE,
    callAPI: () => {
      return fetch(api.user.role(affairId), {
        	method: 'GET',
      }).then(res => res.json()).then(res => {
        return res
      })
    }
  }


}

// export const getUserRole = affairId => dispatch => fetch(api.user.role(affairId), {
//   method: 'GET',
// }).then(res => res.json()).then(res => {
//   if (res.code === 0) {
//     dispatch({
//   		type: GET_USER_ROLE[1],
//   		role: res.data ? {roleId: res.data.id, roleType: res.data.roleType} : {}
//   	})
//   } else {
//     notification['error']({
//       message: '获取角色失败',
//       description: res.data
//     })
//   }
// })




// export const getUserRole = (affairId) => ({
// 	types: GET_USER_ROLE,
// 	shouldCallAPI: (state) => {
// 		return true
// 	},
// 	callAPI: () => fetch(api.user.role(affairId), {
// 		method: 'GET',
// 	}).then(res => {
// 		return res.json()
// 	}).then(json => {
// 		if (json.code === 0) {
// 			return json.data ? {roleId: json.data.id, roleType: json.data.roleType} : {}
// 		}
// 	})
// })


// 获取这个user当前的所有角色列表
export const UPDATE_USER_ROLE_LIST = 'UPDATE_USER_ROLE_LIST'
export function fetchUserRoleList() {
  return (dispatch) => {
    return fetch(api.user.roleList, {
      method: 'GET',
    }).then((res) => res.json()).then((json) => {
      let data = fromJS(json.data)
      data = data.filter((v) => {
        const type = v.get('mold')
        return type == AFFAIR_TYPE.COURSE || type == AFFAIR_TYPE.DEPARTMENT || type == AFFAIR_TYPE.GROUP
      })
      if (json.code === 0) {
        dispatch({
          type: UPDATE_USER_ROLE_LIST,
          payload: data.toJS(),
        })
      }
    })
  }
}
// 教务员获取所有老师
export const GET_ALL_TEACHER = actionNames('GET_ALL_TEACHER')
export const getAllTeacher = () => dispatch => fetch(api.user.teacherList, {
	method: 'GET',
}).then(res => res.json()).then(res => {
  if (res.code === 0) {
    return res.data
  } else {
    return false
  }
})
