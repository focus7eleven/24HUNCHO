import { fromJS, Map, List } from 'immutable'
import { USER_ROLE_TYPE } from 'member-role-type'
import {
  GET_COURSE_ROLE,
  GET_GROUP_ROLE,
} from '../actions/role'

const initialState = fromJS({
  courseRole: List(),
  groupRole: List(),
  teachers: List(),
  students: List(),
  assistants: List(),
  managers: List(),
  members: List(),
})

export default (state = initialState, action) => {
	switch (action.type) {
    case GET_COURSE_ROLE[1]:
      let teachers = action.payload.find(v => v.roleType === USER_ROLE_TYPE.TEACHER)
      let assistants = action.payload.find(v => v.roleType === USER_ROLE_TYPE.ASSISTANT)
      let students = action.payload.find(v => v.roleType === USER_ROLE_TYPE.STUDENT)
      teachers = teachers ? teachers.roleList : []
      assistants = assistants ? assistants.roleList : []
      students = students ? students.roleList : []
      return state.set('courseRole', fromJS(action.payload)).set('teachers', fromJS(teachers)).set('assistants', fromJS(assistants)).set('students', fromJS(students))
    case GET_GROUP_ROLE[1]:
      let managers = action.payload.find(v => v.roleType === USER_ROLE_TYPE.MANAGER)
      let group_assistants = action.payload.find(v => v.roleType === USER_ROLE_TYPE.ASSISTANT)
      let members = action.payload.find(v => v.roleType === USER_ROLE_TYPE.MEMBER)
      managers = managers ? managers.roleList : []
      group_assistants = group_assistants ? group_assistants.roleList : []
      members = members ? members.roleList : []
      return state.set('groupRole', fromJS(action.payload)).set('managers', fromJS(managers)).set('assistants', fromJS(group_assistants)).set('members', fromJS(members))
    default:
      return state
  }
}
