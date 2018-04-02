import {
  FETCH_DRAFT_LIST,
  DELETE_DRAFT,
  TOGGLE_CONTAIN_CHILDREN,
} from '../actions/announcement'
import {
  fromJS
} from 'immutable'

const initialState = fromJS({
  draft: {},
  draftDetail: {},
  isContainChildren: false,
})

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_DRAFT_LIST:
      return state.setIn(['draft', action.payload.affairId], fromJS(action.payload.data))
    case DELETE_DRAFT:
      if (action.payload.draftId) {
        return state.updateIn(['draft', action.payload.affairId], (v) => v.filter((w) => w.get('id') != action.payload.draftId))
      } else {
        return state
      }
    case TOGGLE_CONTAIN_CHILDREN:
      return state.update('isContainChildren', (v) => !v)
    default:
      return state
  }
}
