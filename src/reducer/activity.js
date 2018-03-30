import { fromJS, List, Map } from 'immutable'
import {
  GET_ACTIVITIES,
  UPDATE_ACTIVITY
} from '../actions/activity'

const initialState = fromJS({
  activityList: List()
})

export default (state = initialState, action) => {
  switch(action.type) {
  case GET_ACTIVITIES[1]:
    return state.set('activityList', fromJS(action.payload))
  // case UPDATE_ACTIVITY:
  //   const { activity } = action.payload
  //   return state.update('activityList', fromJS(action.payload))
  default:
    return state
  }
}
