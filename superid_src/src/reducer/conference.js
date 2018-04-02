import { START_CONFERENCE, FETCH_CONFERENCE_INFORMATION, END_CONFERENCE, FETCH_CONFERENCE_ATTENDEES, REFUSE_CONFERENCE_INVITATION, FETCH_CONFERENCE_GROUP_MEMBER, ENTER_BOARD } from '../actions/conference'
import { RECEIVE_CONFERENCE_INVITATION } from '../actions/notification'
import { fromJS, List } from 'immutable'

let initialState = {
  receiveInvitation: [],

  // receiveInvitation: [{
  // 	id: 0,
  // 	announcementId: 1541,
  // 	announcementTitle: '视频测试发布',
  // 	avatar: "http://superid-public.oss-cn-shanghai.aliyuncs.com/person_default.png",
  // 	chatGroupId: 100005,
  // 	name: '店长-林祖华', // 讨论组名称
  // 	roleTitle: '总负责人',
  // 	username: '徐文声',
  // 	receiverRoleId: 4695,
  // 	conferenceId: 100041,
  // }], // 收到了一个视频会议的邀请

  name: null, // 会议名称
  attendees: null, // 会议的参与人
  chatGroupName: '',

  board: null, // 白板信息
  operationList: List(), // 操作集合
  groupMember: {
    groups: [],
    roles: [],
  },
}
initialState = fromJS(initialState)

export default (state = initialState, action) => {
  switch (action.type) {
    case START_CONFERENCE:
      return state.set('roomToken', action.payload.token)
        .set('conferenceId', action.payload.conferenceId)

    case FETCH_CONFERENCE_INFORMATION:
      return state.set('name', action.payload.name)
        .set('chatGroupName', action.payload.chatGroupName)
        .set('recordingOption', action.payload.recordState)

    case FETCH_CONFERENCE_GROUP_MEMBER:
      return state.set('groupMember', fromJS(action.payload))

    case RECEIVE_CONFERENCE_INVITATION:
      return state.update('receiveInvitation', (receiveInvitation) => {
        const invitationMessage = action.payload
        let invitation = fromJS(invitationMessage.optional)
        invitation = invitation.set('id', invitationMessage.noticeId)
        invitation = invitation.set('receiverRoleId', invitationMessage.receiverRoleId)
        invitation = invitation.set('conferenceId', invitationMessage.resourceId)

        return receiveInvitation.push(invitation)
      })

    case FETCH_CONFERENCE_ATTENDEES:
      return state.set('attendees', fromJS(action.payload))

    case END_CONFERENCE:
      return initialState

    case REFUSE_CONFERENCE_INVITATION:
      return state.update('receiveInvitation', (receiveInvitation) => receiveInvitation.filter((v) => {
        return v.get('id') != action.payload.notificationId
      }))

    case ENTER_BOARD:
      return state.set('board', fromJS(action.board))

    default:
      return state
  }
}
