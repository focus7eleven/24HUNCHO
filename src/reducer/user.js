import {
  FETCH_USER,
  UPDATE_USER,
  LOGIN_SUCCESS,
  NEED_CAPTCHA,
  LOGOUT_SUCCESS,
  GET_USER_ROLE,
  // UPDATE_HOMEPAGE_AFFAIR,
  UPDATE_USER_ROLE_LIST,
  UPDATE_USER_MOBILE_OR_EMAIL,
  // SET_HOMEPAGE,
  // UPDATE_USER_EMAIL,
  // UPDATE_USER_MOBILE,
  // UPDATE_SUPER_ID,
  // UPDATE_AUTH_INFO,
} from '../actions/user'
// import {
// 	ALLIANCE_CREATE
// } from '../actions/alliance'
import {
	fromJS,
	List,
} from 'immutable'
import {
	UserRoleSet
} from '../models/Affair'

const initialState = fromJS({
	// localstorage can not store boolean.
	fetched: false, // 避免用户信息重复获取

	// 判断用户是否已经登录。
	auth: JSON.parse(localStorage.getItem('auth')),
	needCaptcha: false,
	captchaUrl: '',
	captchaStatus: 1,
	gender: 0,
	phoneAccount: '',
	mailAccount: '',
	isUpdating: 1,
	publicType: 0,
	personInfoPublic: {
		realname: false,
		mobile: false,
    birthday: false,
    email: false,
	},
  role: {
    // -2 作为默认值，代表还没有取到服务器的值，与 -1 做区分。
    roleType: -2,
    roleId: -2,
  },
	// homepageAffairId: 0,
	// members: new UserRoleSet(),
	roles: [],
  isFetchingRoleId: 0,
	// nicknames: [],
})

const mergeUserInfo = (state, info) => {
	return state.update('username', (v) => info['username'] !== undefined ? info['username'] : v)
		.update('realName', (v) => info['realname'] ? info['realname'] : v)
		.update('nicknames', (v) => info.hasOwnProperty('nicknames') ? ((info['nicknames'] == '' ||info['nicknames'] == null) ? [] : info['nicknames'].split(',')) : v)
		.update('gender', (v) => info['gender'] !== undefined ? info['gender'] : v)
		.update('avatar', (v) => info['avatar'] !== undefined ? info['avatar'] : v)
		.update('phoneAccount', (v) => info['mobile'] !== undefined ? info['mobile'] : v)
		.update('mailAccount', (v) => info['email'] || v)
		.update('publicType', (v) => info['publicType'] || v)
    .update('personInfoPublic', (v) => info['personInfoPublic'] || v)
		// .update('members', (v) => (info['members'] && new UserRoleSet(info['members'])) || v)
		// .update('id', (v) => info['id'] || v)
		// .update('homepageAffairId', (v) => info['homepageAffairId'] || v)
		.update('roles', (v) => info['roles'] || v)
		// .update('personalAllianceId', (v) => info['personalAllianceId'] || v)
		// .update('personalRoleId', (v) => info['personalRoleId'] || v)
		// .update('personalAffairId', (v) => info['personalAffairId'] || v)
}

export default (state = initialState, action) => {
	switch (action.type) {
	// case ALLIANCE_CREATE[1]:
	// 	return state.update('members', (members) => members.addRole(action.response.data.affairMember))
	case LOGIN_SUCCESS:
		localStorage.setItem('auth', JSON.stringify(action.payload))
		return state.set('auth', action.payload).set('needCaptcha', false).set('captchaUrl', '').set('userId', action.payload['X-SIMU-UserId'])
	case NEED_CAPTCHA:
		return state.set('needCaptcha', true).set('captchaUrl', action.captchaUrl).set('captchaStatus', action.status)
	case LOGOUT_SUCCESS:
		state = state.set('fetched', false).set('auth', false).set('id', 0).set('needCaptcha', false).set('captchaUrl', '')
		localStorage.setItem('auth', false)
		localStorage.setItem('username', '')
		return state
	// case SET_HOMEPAGE:
	// 	return state.set('homepageAffairId', action.payload.affair.get('affairId'))
	case FETCH_USER[0]:
		return state
	// 获取用户信息成功
	case FETCH_USER[1]:
		if (action.response) {
      const userId = state.getIn(['auth', 'X-SIMU-UserId'])
			// action.response.nicknames = action.response.nickNames
			state = state.merge(fromJS(action.response)).set('fetched', true).set('id', userId)
		}
		return state
	// 更新自己的个人信息
	case UPDATE_USER[0]:
		return state.set('isUpdating', 0)
	case UPDATE_USER[1]:
		return mergeUserInfo(state, action.data).set('isUpdating', 1)
	case UPDATE_USER[2]:
		return state.set('isUpdating', 2)
  case GET_USER_ROLE[0]:
    return state.setIn(['role', 'roleId'], -2).setIn(['role', 'roleType'], -1)
	case GET_USER_ROLE[1]:
    if (action.response.data) {
      return state.setIn(['role', 'roleType'], action.response.data.roleType).setIn(['role', 'roleId'], action.response.data.id)
    } else {
      return state.setIn(['role', 'roleId'], -1).setIn(['role', 'roleType'], -1)
    }
  case GET_USER_ROLE[2]:
    return state.setIn(['role', 'roleId'], -2).setIn(['role', 'roleType'], -1)
    // case GET_USER_ROLE[2]:
    // return state.setIn(['role', 'roleType'], -2).setIn(['role', 'roleId'], null).setIn(['role', 'isUpdating'], false)
	// case UPDATE_SUPER_ID:
	// 	return state.set('superid', action.payload)
	// case UPDATE_HOMEPAGE_AFFAIR:
	// 	return state.update('homepageAffairId', (v) => action.payload.affairId || v)
	case UPDATE_USER_ROLE_LIST:
		return state.set('roles', fromJS(action.payload) || List())
			// 矫正服务器异常数据
			.update('roles', (roles) => roles.map((role) => role.update('permissions', (per) => per || '')))
	case UPDATE_USER_MOBILE_OR_EMAIL:
    if (action.payload.isMobile) {
      return state.set('mobile', action.payload.token)
    } else {
      return state.set('email', action.payload.token)
    }
	// case UPDATE_USER_EMAIL:
	// 	return state.set('email', action.payload.email)
	// case UPDATE_AUTH_INFO:
	// 	return state.setIn(['authInfo', 'credentialsId'], action.payload.credentialsId)
  //       .setIn(['authInfo', 'credentialsType'], action.payload.credentialsType)
  //       .setIn(['authInfo', 'credentialsPhotoUrl1'], action.payload.credentialsPhotoUrl1)
  //       .setIn(['authInfo', 'credentialsPhotoUrl2'], action.payload.credentialsPhotoUrl2)
  //       .setIn(['authInfo', 'realname'], action.payload.realname)
	default:
		return state
	}
}
