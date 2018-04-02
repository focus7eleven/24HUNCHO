import {
  SENT_CHANGE_ACCOUNT_VERIFY_CODE,
  SENT_CHANGE_ACCOUNT_COOL_DOWN,
  COOL_DOWN, VERIFIED_CODE_SUCCESS,
  FETCH_PERMISSION_SETTING,
} from '../actions/auth'
import { fromJS, List } from 'immutable'

const initialState = fromJS({
  sentChangeAccountVerifyCode: false,
  changeAccountCoolDown: COOL_DOWN, // x秒内无法再次发送验证码
  permissionCategoryList: List(),
})

export default (state = initialState, action) => {
  switch (action.type) {
    case SENT_CHANGE_ACCOUNT_VERIFY_CODE:
      return state.set('sentChangeAccountVerifyCode', action.payload)
    case SENT_CHANGE_ACCOUNT_COOL_DOWN:
      return state.set('changeAccountCoolDown', action.payload.count)
    case VERIFIED_CODE_SUCCESS:
      if (action.payload.type == 'mail'){
        return state.setIn(['user', 'mailAccount'], action.payload.newAccount)
      } else {
        return state.setIn(['user', 'phoneAccount'], action.payload.newAccount)
      }
    case FETCH_PERMISSION_SETTING:
      return state
        .set('permissionInformationList', action.payload.permissionInformationList)
        .set('permissionLevelNameList', action.payload.permissionInformationList
          .map((information) => information.get('levelName'))
          .toOrderedSet().toList()
      )
        .set('permissionTypeNameList', action.payload.permissionInformationList
          .map((information) => information.get('categoryName'))
          .toOrderedSet().toList()
      )
        .set('defaultPermissionList', action.payload.permissionInformationList
          .filter((information) => information.get('level') == 1)
          .map((information) => information.get('id'))
      )
    default:
      return state
  }
}
