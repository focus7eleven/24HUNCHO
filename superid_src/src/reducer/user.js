import {
  FETCH_USER,
  UPDATE_USER,
  LOGIN_SUCCESS,
  LOGIN_BY_PHONE_SUCCESS,
  LOGIN_BY_QR_SUCCESS,
  NEED_CAPTCHA,
  LOGOUT_SUCCESS,
  UPDATE_HOMEPAGE_AFFAIR,
  UPDATE_USER_ROLE_LIST,
  SET_HOMEPAGE,
  UPDATE_USER_AVATAR,
  UPDATE_USER_EMAIL,
  UPDATE_USER_MOBILE,
  UPDATE_SUPER_ID,
  UPDATE_AUTH_INFO,
} from '../actions/user'
import {
  ALLIANCE_CREATE
} from '../actions/alliance'
import {
  CREATE_NEW_ROLE,
} from '../actions/affair'
import {
  fromJS,
  List,
} from 'immutable'
import {
  UserRoleSet
} from '../models/Affair'

const initialState = fromJS({
  // localstorage can not store boolean.
  fetched: false, // 避免用户信心重复获取

  // 判断用户是否已经登录。
  auth: JSON.parse(localStorage.getItem('auth')),
  needCaptcha: false,
  captchaUrl: '',
  captchaStatus: 0,
  name: '',
  gender: 0,
  phoneAccount: '',
  mailAccount: '',
  dob: null,
  isUpdating: 1,
  publicType: 0,
  id: 0,
  homepageAffairId: 0,
  members: new UserRoleSet(),
  roles: [],
  nicknames: [],
})

const mergeUserInfo = (state, info) => {
  return state.update('name', (v) => info['username'] !== undefined ? info['username'] : v)
    .update('username', (v) => info['username'] !== undefined ? info['username'] : v)
    .update('realName', (v) => info['realname'] ? info['realname'] : v)
    .update('nicknames', (v) => info.hasOwnProperty('nicknames') ? ((info['nicknames'] == '' || info['nicknames'] == null) ? [] : info['nicknames'].split(',')) : v)
    .update('gender', (v) => info['gender'] !== undefined ? info['gender'] : v)
    .update('dob', (v) => !info.birthday ? new Date(info.birthday).getTime() : v)
    .update('avatar', (v) => info['avatar'] !== undefined ? info['avatar'] : v)
    .update('phoneAccount', (v) => info['mobile'] !== undefined ? info['mobile'] : v)
    .update('mailAccount', (v) => info['email'] || v)
    .update('publicType', (v) => info['publicType'] || v)
    .update('address', () => info['address'])
    .update('tags', (v) => info['tags'] || v)
    .update('personInfoPublic', (v) => info['publicType'] || v)
    .update('members', (v) => (info['members'] && new UserRoleSet(info['members'])) || v)
    .update('id', (v) => info['id'] || v)
    .update('homepageAffairId', (v) => info['homepageAffairId'] || v)
    .update('roles', (v) => info['roles'] || v)
    .update('personalAllianceId', (v) => info['personalAllianceId'] || v)
    .update('personalRoleId', (v) => info['personalRoleId'] || v)
    .update('personalAffairId', (v) => info['personalAffairId'] || v)
}

export default (state = initialState, action) => {
  switch (action.type) {
    case CREATE_NEW_ROLE:
      if (state.get('id') === action.payload.userId) {
        return state.update('roles', (roles) => roles.push(fromJS(action.payload.role)))
      } else {
        return state
      }
    case ALLIANCE_CREATE[1]:
      return state.update('members', (members) => members.addRole(action.response.data.affairMember))
      // 登录, 更新登录获得的个人信息。
    case LOGIN_SUCCESS:
      localStorage.setItem('auth', JSON.stringify(action.payload))
      return state.set('auth', action.payload).set('needCaptcha', false).set('captchaUrl', '')
    case LOGIN_BY_PHONE_SUCCESS:
      localStorage.setItem('auth', JSON.stringify(action.payload))
      return state.set('auth', action.payload)
    case LOGIN_BY_QR_SUCCESS:
      localStorage.setItem('auth', JSON.stringify(action.payload))
      return state.set('auth', JSON.stringify(action.payload))
    case NEED_CAPTCHA:
      return state.set('needCaptcha', true).set('captchaUrl', action.captchaUrl).set('captchaStatus', action.status)
    case LOGOUT_SUCCESS:
      state = state.set('fetched', false).set('auth', false).set('id', 0).set('needCaptcha', false).set('captchaUrl', '')
      localStorage.setItem('auth', false)
      return state
    case SET_HOMEPAGE:
      return state.set('homepageAffairId', action.payload.affair.get('affairId'))
    case FETCH_USER[0]:
      return state
      // 获取用户信息成功
    case FETCH_USER[1]:
      if (action.response) {
        action.response.nicknames = action.response.nickNames
        state = state.merge(fromJS(action.response)).set('fetched', true)
      }
      return state
      // 更新自己的个人信息
    case UPDATE_USER[0]:
      return state.set('isUpdating', 0)
    case UPDATE_USER[1]:
      return mergeUserInfo(state, action.data).set('isUpdating', 1)
    case UPDATE_USER[2]:
      return state.set('isUpdating', 2)
    case UPDATE_SUPER_ID:
      return state.set('superid', action.payload)
    case UPDATE_HOMEPAGE_AFFAIR:
      return state.update('homepageAffairId', (v) => action.payload.affairId || v)
    case UPDATE_USER_ROLE_LIST:
      return state.set('roles', fromJS(action.payload) || List())
        // 矫正服务器异常数据
        .update('roles', (roles) => roles.map((role) => role.update('permissions', (per) => per || List())))
    case UPDATE_USER_AVATAR:
      return state.set('avatar', action.payload.avatar)
    case UPDATE_USER_MOBILE:
      return state.set('mobile', action.payload.mobile)
    case UPDATE_USER_EMAIL:
      return state.set('email', action.payload.email)
    case UPDATE_AUTH_INFO:
      return state.setIn(['authInfo', 'credentialsId'], action.payload.credentialsId)
        .setIn(['authInfo', 'credentialsType'], action.payload.credentialsType)
        .setIn(['authInfo', 'credentialsPhotoUrl1'], action.payload.credentialsPhotoUrl1)
        .setIn(['authInfo', 'credentialsPhotoUrl2'], action.payload.credentialsPhotoUrl2)
        .setIn(['authInfo', 'realname'], action.payload.realname)
    default:
      return state
  }
}
