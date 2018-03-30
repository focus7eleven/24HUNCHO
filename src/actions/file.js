import { actionNames } from 'action-utils'
import { notification } from 'antd'
import { config } from 'oss'
import _ from 'lodash'

export const ADD_FILE = "ADD_FILE"
export const addFile = (affairId, roleId, newFile, path) => dispatch => fetch(config.api.file.add, {
  method: 'POST',
  affairId,
  roleId,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: newFile
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    // dispatch({
    //   type: ADD_FILE,
    //   payload: {
    //     file: json.data,
    //     path,
    //   }
    // })
  } else {
    notification['error']({
      message: '上传失败',
      description: json.data
    })
  }
  return json.data
})

export const ADD_NEW_FOLDER = "ADD_NEW_FOLDER"
export const addNewFolder = (affairId, roleId, rootFolderId, newFolderName, path) => dispatch => fetch(config.api.file.folder.add(rootFolderId, newFolderName), {
  method: 'POST',
  affairId,
  roleId,
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    notification['success']({
      message: '新建成功',
      description: null
    })
  } else {
    notification['error']({
      message: '新建失败',
      description: json.data
    })
  }
  return json.data
})

export const GET_FILE_LIST = actionNames('GET_FILE_LIST')
export const getFileList = (folderId, path, affairId, roleId) => dispatch => fetch(config.api.file.fileList.get(folderId), {
  method: 'GET',
  affairId,
  roleId
}).then(res => res.json()).then(res => {
  if (res.code === 0) {
    return res.data
  } else {
    notification['error']({
      message: '获取文件列表失败',
      description: res.data
    })
  }
})

export const getAllChildrenList = (affairId, roleId, folderId) => dispatch => fetch(config.api.file.fileList.getAllChildren(folderId), {
  method: 'GET',
  affairId,
  roleId,
}).then(res => res.json()).then((res) => {
  if (res.code === 0) {
    return res.data
  } else {
    notification['error']({
      message: '获取子文件列表失败',
      description: res.data
    })
  }
})


export const DELETE_FOLDER = "DELETE_FOLDER"
export const deleteFolder = (affairId, roleId, path, folderId) => dispatch => fetch(config.api.file.deleteFolder(folderId), {
  method: 'POST',
  affairId,
  roleId
}).then(res => res.json()).then(res => {
  if (res.code === 0) {
    notification['success']({
      message: '删除成功',
      description: null
    })
    return true
  } else {
    if (res.code === 4001) {
      notification['error']({
        message: '删除失败',
        description: '该文件夹不为空，不能删除'
      })
    }
    return false
  }
})

export const DELETE_FILE = "DELETE_FILE"
export const deleteFile = (affairId, roleId, path, fileId) => dispatch => fetch(config.api.file.delete(fileId), {
  method: 'POST',
  affairId,
  roleId
}).then(res => res.json()).then(res => {
  if (res.data) {
    notification['success']({
      message: '删除成功',
      description: null
    })
    return true
  } else {
    notification['error']({
      message: '删除失败',
      description: res.data
    })
    return false
  }
})

export const GET_NAVIGATION_INFO = "GET_NAVIGATION_INFO"
export const getNavigationInfo = (folderId, affairId, roleId) => dispatch => fetch(config.api.file.navigationInfo(folderId), {
  method: 'GET',
  affairId,
  roleId,
}).then(res => res.json()).then(json => {
  if (json.code === 0) {
    dispatch({
      type: GET_NAVIGATION_INFO,
      payload: json.data || []
    })
  }
})

export const SEARCH_FILE = "SEARCH_FILE"
export const searchFile = (keyword, path, folderId, affairId, roleId) => dispatch => fetch(config.api.file.search(keyword), {
  method: 'GET',
  affairId,
  roleId,
}).then(res => res.json()).then(res => {
  if (res.code === 0) {
    return res.data
    // dispatch({
    //   type: SEARCH_FILE,
    //   payload: {
    //     path,
    //     folderId,
    //     data: res.data
    //   }
    // })
  } else {
    notification['error']({
      message: '搜索失败',
      description: res.data
    })
  }
})
