import { fromJS, Map, List } from 'immutable'
import {
  GET_GROUPS
} from '../actions/group'

const initialState = fromJS({
  currentGroup: Map(),
  myGroupList: List(),
  allGroupList: List(),
})

export default (state = initialState, action) => {
  switch (action.type) {
  case GET_GROUPS[1]:
    return state.set('myGroupList', fromJS(action.payload).first()).set('allGroupList', fromJS(action.payload).last())
  default:
    return state
  }
}
