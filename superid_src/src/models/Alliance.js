import {
  Record,
} from 'immutable'

const AllianceRecord = Record({
  code: '00000000',
  id: 0,
  ownerRoleId: 0,
  name: '',
  // 盟认证已提交: 0认证成功;1未提交认证;2已提认证交
  verified: 1,
})
export class Alliance extends AllianceRecord {}
