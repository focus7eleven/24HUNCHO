import { fromJS } from 'immutable'

export const LOAD_LIMIT = 100

//当前操作者的角色
export const OPT_ROLE = {
  // OFFICIAL: 0,
  // CUSTOMER: 1,
  // RESPONSE: 2,
  // COOPERATOR: 3,
  // DEFAULT: 4,
  AFFAIR: 0, //事务内
  ALLIANCE: 1, //盟内
  GUEST: 2, //客方
  OFFICIAL: 3, //官方
}

//发布公开类型
export const PUBLIC_TYPE = {
  ALL: 0,
  TO_ALLIANCE: 1,
  TO_CHILDREN: 2,
  TO_AFFAIR_MEMBER: 3,
  ADMIN: 4,
}

export const PublicTypeList = fromJS([
  { type: PUBLIC_TYPE.ALL, name: '完全公开' },
  { type: PUBLIC_TYPE.TO_ALLIANCE, name: '盟内公开' },
  { type: PUBLIC_TYPE.TO_CHILDREN, name: '事务内公开' },
  { type: PUBLIC_TYPE.TO_AFFAIR_MEMBER, name: '本事务公开' },
  { type: PUBLIC_TYPE.ADMIN, name: '私密' }
])

//发布中的参与者类型（分为官方和客房）
export const PARTICIPANT_TYPE = {
  OFFICIAL: 0,
  CUSTOMER: 1,
}

export const MODAL_TYPE = {
  CREATE: 0,
  EDIT: 1,
}

//工作状态
export const WORK_STATE = {
  WAIT_BEGIN: 0,
  ONGOING: 1,
  PENDING: 2,
  FINISHED: 3,
  CANCELED: 4,
}
export const workStateList = fromJS([
  { state: WORK_STATE.WAIT_BEGIN, icon: '#c98be9', text: '待开始' },
  { state: WORK_STATE.ONGOING, icon: '#926dea', text: '进行中' },
  { state: WORK_STATE.PENDING, icon: '#f5a623', text: '暂停中' },
  { state: WORK_STATE.FINISHED, icon: '#6ba6eb', text: '已完成' },
  { state: WORK_STATE.CANCELED, icon: '#dddddd', text: '已取消' }
])

// 工作优先级
export const WORK_PRIO = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
}

export const WORK_PRIOS = [
  { state: WORK_PRIO.LOW, text: '低' },
  { state: WORK_PRIO.MEDIUM, text: '中' },
  { state: WORK_PRIO.HIGH, text: '高' }
]

// 任务类型
export const TASK_TYPE = {
  WORK: 0,
  MEETING: 1,
  MEMO: 2,
}

export const TASK_TYPES = [
  { type: TASK_TYPE.WORK, icon: '#f5a623', text: '普通任务' },
  { type: TASK_TYPE.MEETING, icon: '#66b966', text: '会议' },
  { type: TASK_TYPE.MEMO, icon: '#b39479', text: '备忘' },
]

export const KEY_STATE = {
  NOT_KEY: 0,
  KEY: 1,
}

export const KEY_STATES = [
  { state: KEY_STATE.NOT_KEY, icon: '#cccccc' },
  { state: KEY_STATE.KEY, icon: '#F45B6C' },
]
