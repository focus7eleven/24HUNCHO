import { fromJS, Map, List } from 'immutable'
import _ from 'lodash'
import {
  GET_FILE_LIST,
  ADD_NEW_FOLDER,
  DELETE_FOLDER,
  DELETE_FILE,
  ADD_FILE,
  GET_NAVIGATION_INFO,
  SEARCH_FILE,
} from '../actions/file'

const initialState = fromJS({
  fileMap: Map(),
  navigationInfo: fromJS([{
    id: 0,
    name: ''
  }]),
})

const formatter = (state, payload) => {
  const { data, path, folderId } = payload
  // const { folders, files } = data
  const folders = data.folders || []
  const files = data.files || []
  folders.sort((a, b) => b.modifyTime > a.modifyTime)
  files.sort((a, b) => b.modifyTime > a.modifyTime)
  return state.setIn(['fileMap', path], fromJS({folderId, folders, files}))
}

export default (state = initialState, action) => {
	switch (action.type) {
    case GET_FILE_LIST[1]:
      return formatter(state, action.response)
    case SEARCH_FILE:
      return formatter(state, action.payload)
    case ADD_FILE:
      return state.updateIn(['fileMap', action.payload.path, 'files'], v => v.insert(0, fromJS(action.payload.file)))
    case ADD_NEW_FOLDER:
      let newFolder = _.extend({}, action.payload.folder)
      newFolder['folderId'] = newFolder.id
      delete newFolder['id']
      return state.updateIn(['fileMap', action.payload.path, 'folders'], v => v.insert(0, fromJS(newFolder)))
    case DELETE_FOLDER:
      return state.updateIn(['fileMap', action.payload.path, 'folders'], v => v.filter(w => w.get('folderId') !== action.payload.folderId))
    case DELETE_FILE:
      return state.updateIn(['fileMap', action.payload.path, 'files'], v => v.filter(w => w.get('id') !== action.payload.fileId))
    case GET_NAVIGATION_INFO:
      return state.set('navigationInfo', fromJS([{id: 0, name: ''}].concat(action.payload)))
    default:
      return state
  }
}
