import { actionNames } from 'action-utils'
import { notification } from 'antd'
import config from '../config'
import _ from 'lodash'

const {
  tssURL,
} = config

const api = {
  create: `${tssURL}/api/activity/create`,
  update: `${tssURL}/api/activity/modify`,
  list: (id) => `${tssURL}/api/activity/getActivities?courseId=${id}`,
  detail: (activityId) => `${tssURL}/api/activity/getActivityDetail?activityId=${activityId}`,
  simpleActivity: (activityId) => `${tssURL}/api/activity/getSimpleActivity?activityId=${activityId}`,
  homework: {
    list: (activityId) => `${tssURL}/api/file/getHomeworkSubmits?activityId=${activityId}`,
    statistics: (activityId) => `${tssURL}/api/file/getSubmitCount?activityId=${activityId}`,
    submit: (activityId) => `${tssURL}/api/file/submitHomework?activityId=${activityId}`,
  },
  comments: {
    list: (activityId) => `${tssURL}/api/comment/getComments?activityId=${activityId}`,
    create: () => `${tssURL}/api/comment/addComment`,
    delete: (activityId, commentId) => `${tssURL}/api/comment/deleteComment?activityId=${activityId}&commentId=${commentId}`,
  },
  attachment: {
    list: (activityId) => `${tssURL}/api/file/getAttachments?activityId=${activityId}`,
    upload: (activityId) => `${tssURL}/api/file/uploadAttachment?activityId=${activityId}`,
    delete: (attachmentId) => `${tssURL}/api/file/deleteAttachment?attachmentId=${attachmentId}`,
    deleteByPath: (attachmentUrl) => `${tssURL}/api/file/deleteAttachmentByPath?attachment_url=${attachmentUrl}`,
  }
}

// course activity
export const GET_ACTIVITIES = actionNames('GET_ACTIVITIES')
export const getActivities = (courseId, roleId) => dispatch => fetch(api.list(courseId), {
  method: 'GET',
  affairId: courseId,
  roleId,
}).then(res => res.json()).then(json => {
  if (json.code !== 0) {
    // notification['error']({
    //   message: '获取课程活动列表失败',
    //   description: json.data
    // })
    return false
  } else {
    dispatch({
      type: GET_ACTIVITIES[1],
      payload: json.data
    })
    return true
  }

})

export const getActivityDetail = (activityId, affairId, roleId) => dispatch => fetch(api.detail(activityId), {
  method: 'GET',
  affairId,
  roleId
}).then(res => res.json())

// activity homework
export const getHomeworkStatistics = (affairId, roleId, activityId) => dispatch => fetch(api.homework.statistics(activityId), {
  method: 'GET',
  affairId,
  roleId
}).then(res => res.json())

export const getHomeworkSubmits = (affairId, roleId, activityId) => dispatch => fetch(api.homework.list(activityId), {
  method: 'GET',
  affairId,
  roleId,
}).then(res => res.json())

export const submitHomework = (affairId, roleId, activityId, fileName, size, url) => dispatch => fetch(api.homework.submit(activityId), {
  method: 'POST',
  affairId,
  roleId,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fileName,
    size,
    url
  })
}).then(res => res.json())

// activity file
export const getAttachments = (affairId, roleId, activityId) => dispatch => fetch(api.attachment.list(activityId), {
  method: 'GET',
  affairId,
  roleId,
}).then(res => res.json())

export const uploadAttachment = (affairId, roleId, activityId, files) => dispatch => fetch(api.attachment.upload(activityId), {
  method: 'POST',
  affairId,
  roleId,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(files)
}).then(res => res.json())

export const deleteAttachment = (affairId, roleId, attachmentId) => dispatch => fetch(api.attachment.delete(attachmentId), {
  method: 'POST',
  affairId,
  roleId
}).then(res => res.json())

export const deleteAttachmentByPath = (affairId, roleId, attachmentUrl) => dispatch => fetch(api.attachment.deleteByPath(attachmentUrl), {
  method: 'POST',
  affairId,
  roleId,
}).then(res => res.json())

// activity Comments
export const getComments = (affairId, roleId, activityId) => dispatch => fetch(api.comments.list(activityId), {
  method: 'GET',
  affairId,
  roleId,
}).then(res => res.json())

export const createComment = (affairId, roleId, comment) => dispatch => fetch(api.comments.create(), {
  method: 'POST',
  affairId,
  roleId,
  body: comment,
}).then(res => res.json())

export const deleteComment = (affairId, roleId, activityId, commentId) => dispatch => fetch(api.comments.delete(activityId, commentId), {
  method: 'POST',
  affairId,
  roleId,
}).then(res => res.json())

// 根据activityId获取所属的courseId和groupId
export const getSimpleActivity = (activityId) => dispatch => fetch(api.simpleActivity(activityId), {
  method: 'GET'
}).then(res => res.json())

export const createActivity = (affairId, roleId, activity) => dispatch => fetch(api.create, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  affairId,
  roleId,
  body: activity
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    notification['success']({
      message: '创建成功',
      description: null
    })
    return true
  } else {
    notification['error']({
      message: '创建失败',
      description: json.data
    })
    return false
  }
})

export const UPDATE_ACTIVITY = 'UPDATE_ACTIVITY'
export const updateActivity = (affairId, roleId, activity) => dispatch => fetch(api.update, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  affairId,
  roleId,
  body: activity
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    console.log(json.data);
    notification['success']({
      message: '编辑成功',
      description: null
    })
    // dispatch({
    //   type: UPDATE_ACTIVITY,
    //   payload: json.data
    // })
    return true
  } else {
    notification['error']({
      message: '编辑失败',
      description: json.data
    })
    return false
  }
})
