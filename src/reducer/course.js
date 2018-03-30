import { fromJS, Map, List } from 'immutable'
import {
  GET_MY_COURSE,
  GET_ALL_COURSE,
  GET_COURSE_DETAIL,
} from '../actions/course'

const initialState = fromJS({
  myCourse: Map(),
  allCourse: Map(),
  currentCourse: Map()
})

export default (state = initialState, action) => {
	switch (action.type) {
    case GET_MY_COURSE:
      return state.set('myCourse', fromJS(action.payload))
    case GET_ALL_COURSE:
      return state.set('allCourse', fromJS(action.payload))
    case GET_COURSE_DETAIL:
      return state.set('currentCourse', fromJS(action.payload))
    default:
      return state
  }
}
