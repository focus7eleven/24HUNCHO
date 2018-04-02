import { combineReducers } from 'redux-immutablejs'
import user from './user'
import auth from './auth'
import alliance from './alliance'
import affair from './affair'
import announcement from './announcement'
import notifications from './notification'
import conference from './conference'
import message from './message'
import { routerReducer } from 'react-router-redux'

const reducer = combineReducers({
  user,
  auth,
  alliance,
  affair,
  announcement,
  notifications,
  message,
  conference,
  routing: routerReducer,
})

export default reducer
