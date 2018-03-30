import {
	combineReducers
} from 'redux-immutable'
import user from './user'
import course from './course'
import role from './role'
import file from './file'
import chat from './chat'
import notification from './notification'
import group from './group'
import activity from './activity'

const reducer = combineReducers({
	user,
	course,
	role,
	file,
	chat,
	notification,
  group,
  activity
})

export default reducer
