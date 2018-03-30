import { actionNames } from 'action-utils'
import config from '../config'
import _ from 'lodash'

const {
  tssURL,
} = config

const api = {
  getCourseRole: (courseId) => `${tssURL}/api/role/getCourseRole?courseId=${courseId}`,
  getRoles: `${tssURL}/api/group/getRoles`,
  applyToJoin: (reason, applyId, affairType) => `${tssURL}/api/role/applyJoin?reason=${reason}&applyId=${applyId}&affairType=${affairType}`,
  deleteRole: (toDeleteRoleId, affairType) => `${tssURL}/api/role/deleteRole?toDeleteRoleId=${toDeleteRoleId}&affairType=${affairType}`,
  getTeachersOfDept: `${tssURL}/api/user/getTeachersOfDepartment`,
  getStudentsOfDeptWithGrade: (grade) => `${tssURL}/api/user/getStudentsOfDepartmentWithGrade?grade=${grade}`,
  invite: {
    teachers: (roleIds) => `${tssURL}/api/role/inviteTeacher?roleIds=${roleIds}`,
    tutors: (roleIds) => `${tssURL}/api/role/inviteTutor?roleIds=${roleIds}`,
    students: (roleIds) => `${tssURL}/api/role/inviteStudent?roleIds=${roleIds}`,
  },
  rejectJoin: (roleId, reason, affairType) => `${tssURL}/api/role/rejectJoin?roleId=${roleId}&reason=${reason}&affairType=${affairType}`,
}

// 获取课程人员
export const GET_COURSE_ROLE = actionNames('GET_COURSE_ROLE')
export const getCourseRole = (courseId, roleId) => dispatch => fetch(api.getCourseRole(courseId), {
  method: 'GET',
  affairId: courseId,
  roleId,
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    dispatch({
      type: GET_COURSE_ROLE[1],
      payload: json.data
    })
  }
})

// 获取小组成员
export const GET_GROUP_ROLE = actionNames('GET_GROUP_ROLES')
export const getRoles = (groupId, roleId) => dispatch => fetch(api.getRoles, {
  method: 'GET',
  affairId: groupId,
  roleId,
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    dispatch({
      type: GET_GROUP_ROLE[1],
      payload: json.data
    })
  }
})

// 申请加入课程/小组
export const applyToJoin = (affairId, roleId, reason, applyId, affairType) => dispatch => fetch(api.applyToJoin(reason, applyId, affairType), {
  method: 'GET',
  affairId,
  roleId
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    return {
      type: 'success',
      message: '申请成功',
      description: null
    }
  } else {
    return {
      type: 'error',
      message: '申请失败',
      description: json.data
    }
  }
})

// 从课程/小组里删除人员
export const deleteRole = (affairId, roleId, toDeleteRoleId, affairType) => dispatch => fetch(api.deleteRole(toDeleteRoleId, affairType), {
  method: 'POST',
  affairId,
  roleId,
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    return {
      type: 'success',
      message: '删除成功',
      description: null,
    }
  } else {
    return {
      type: 'error',
      message: '删除失败',
      description: json.data
    }
  }
})

// 获取本学院所有老师
export const getTeachersOfDept = () => dispatch => fetch(api.getTeachersOfDept, {
  method: 'GET',
}).then(res => res.json())

// 获取本学院某年级的所有学生
export const getStudentsOfDeptWithGrade = (grade) => dispatch => fetch(api.getStudentsOfDeptWithGrade(grade), {
  method: 'GET'
}).then(res => res.json())

// 邀请老师
export const inviteTeachers = (affairId, roleId, roleIds) => dispatch => fetch(api.invite.teachers(roleIds), {
  method: 'POST',
  affairId,
  roleId,
}).then(res => res.json())

// 邀请助教
export const inviteTutors = (affairId, roleId, roleIds) => dispatch => fetch(api.invite.tutors(roleIds), {
  method: 'POST',
  affairId,
  roleId,
}).then(res => res.json())

// 邀请学生（批准学生加入课程/小组）
export const inviteStudents = (affairId, roleId, roleIds) => dispatch => fetch(api.invite.students(roleIds), {
  method: 'POST',
  affairId,
  roleId,
}).then(res => res.json())

// 拒绝学生加入课程/小组
export const rejectStudent = (affairId, optRoleId, roleId, reason, affairType) => dispatch => fetch(api.rejectJoin(roleId, reason, affairType), {
  method: 'GET',
  affairId,
  roleId: optRoleId,
}).then(res => res.json())
