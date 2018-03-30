import {
	Record,
	fromJS,
} from 'immutable'

// 事务中的角色
const AffairRoleRecord = Record({
	name: '',
})
export class AffairRole extends AffairRoleRecord {}

export class UserRoleSet {
	constructor(roles = {}) {
		this._immutable = fromJS(roles)
	}

	findMemberId(affairId, roleId) {
		return this._immutable.findKey((v) => v.get(0) == affairId && v.get(1).get('roleId') == roleId)
	}

	getRoleListByAffairId(affairId) {
		return this._immutable.filter((v) => v.get(0) == affairId).map((v) => v.get(1))
	}

	addRole(newRole) {
		this._immutable = this._immutable.merge(newRole)
		return this
	}

	toJS() {
		return this._immutable.toJS()
	}
}

// 事务中的动态
const AffairTrendRecord = Record({
	content: '',
	read: false,
})
export class AffairTrend extends AffairTrendRecord {}

// 事务
const AffairRecord = Record({
	name: '', // 事务名称
	allianceId: 0, //盟id
	avatar: '', // 事务头像
	shortName: '', // 事务简称
	id: null, //数据库事务id
	superid: null, //事务编号
	isStuck: false, // 是否被置顶
	guestLimit: 50, //客方数限制
	tags: '', // 事务标签
	publicType: 0, //事务公开性: 0完全公开 1盟内可见 2成员可见
	permissions: '',
	description: null, // 事务描述
	modifyTime: 0, // 最新动态的发生时间
	covers: null, //事务封面
	roleId: 0, //当前角色id
	affairMemberId: 0,
	level: 0,
	children: [],
	ownerRoleId:0,
	joinedRoles:[],
	allianceCode: '',
	memberPublic: fromJS({
		birthday: false,
		email: false,
		idCard: false,
		mobile: false,
		realname: false,
	}),
	rolePublic: fromJS({
		birthday: false,
		email: false,
		idCard: false,
		mobile: false,
		realname: false,
	}),
	allianceName: '',
	faith: -1,
	logoUrl: null,
	username: -1,
	core:false,
	star:false,
	resourcePublic:null,
})

export class Affair extends AffairRecord {
	hasPermission(permission) {
		if (this.permissions === '*') {
			return true
		} else {
			let permissions = this.permissions.split(',')
			return !!permissions.find((v) => v == permission)
		}
	}

	getTags() {
		try {
			const data = JSON.parse(this.get('tags'))
			return Array.isArray(data) ? data : []
		} catch (e) {
			return []
		}
	}
}
