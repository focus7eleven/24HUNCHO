import { actionNames } from 'action-utils'
import { notification } from 'antd'
import config from '../config'
import _ from 'lodash'

const {
  tssURL,
} = config

const api = {
  create: `${tssURL}/api/course/createCourse`,
  update: `${tssURL}/api/course/modifyCourse`,
  myCourse: `${tssURL}/api/course/getMyCourses`,
  allCourse: `${tssURL}/api/course/getAllCourses`,
  courseDetail: (id) => `${tssURL}/api/course/getCourseDetail?courseId=${id}`,
  quitCourse: (id) => `${tssURL}/api/role/quitCourse?courseId=${id}`,
  setInviteCode: (id, inviteCode) => `${tssURL}/api/course/setInviteCode?id=${id}&inviteCode=${inviteCode}`,
  joinCourse: {
    code: (courseId, code) => `${tssURL}/api/role/joinCourseByCode?courseId=${courseId}&code=${code}`,
    apply: (reason, applyId, affairType) => `${tssURL}/api/role/applyJoin?reason=${reason}&applyId=${applyId}&affairType=${affairType}`,
  },
}

export const CREATE_COURSE = 'CREATE_COURSE'
export const createCourse = (affairId, roleId, course) => dispatch => fetch(api.create, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  affairId,
  roleId,
  body: course
}).then(res => res.json()).then(res => {
  if (res.code === 0) {
    return true
  } else {
    notification['error']({
      message: '创建失败',
      description: res.data
    })
    return false
  }
})

export const UPDATE_COURSE = 'UPDATE_COURSE'
export const updateCourse = (affairId, roleId, course) => dispatch => fetch(api.update, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  affairId,
  roleId,
  body: course
}).then(res => res.json()).then(res => {
  if (res.code === 0) {
    // dispatch({
    //   type: UPDATE_COURSE,
    //   payload: course
    // })
    return true
  } else {
    notification['error']({
      message: '编辑失败',
      description: res.data
    })
    return false
  }
})

export const GET_MY_COURSE = 'GET_MY_COURSE'
export const GET_ALL_COURSE = 'GET_ALL_COURSE'

export const getMyCourse = () => dispatch => fetch(api.myCourse, {
  method: 'GET'
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    dispatch({
      type: GET_MY_COURSE,
      payload: json.data
    })
  } else {
    return json
  }
})

export const getAllCourse = () => dispatch => fetch(api.allCourse, {
  method: 'GET'
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    dispatch({
      type: GET_ALL_COURSE,
      payload: json.data
    })
  } else {
    return json
  }
})

// course info
export const GET_COURSE_DETAIL = 'GET_COURSE_DETAIL'
export const getCourseDetail = (affairId, roleId) => dispatch => fetch(api.courseDetail(affairId), {
  method: 'GET',
  affairId,
  roleId
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    dispatch({
      type: GET_COURSE_DETAIL,
      payload: json.data
    })
  }
  return json
})

export const quitCourse = (affairId, roleId) => dispatch => fetch(api.quitCourse(affairId), {
  method: 'POST',
  affairId,
  roleId
}).then(res => res.json())

export const setInviteCode = (affairId, roleId, inviteCode) => dispatch => fetch(api.setInviteCode(affairId, inviteCode), {
  method: 'POST',
  affairId,
  roleId
}).then(res => res.json())

export const joinCoursebyCode = (affairId, roleId, code) => dispatch => fetch(api.joinCourse.code(affairId, code), {
  method: 'POST',
  affairId,
  roleId
}).then(res => res.json())


// course group list
