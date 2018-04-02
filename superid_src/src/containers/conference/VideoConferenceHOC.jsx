import React from 'react'
import { Modal, message } from 'antd'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import ConferenceContainer from './ConferenceContainer'
import { enterConference, fetchConferenceInformation, endConference, remindAttendeeJoin, refuseConferenceInvitation, inviteOthers, enterBoard } from '../../actions/conference'
import styles from './VideoConferenceHOC.scss'

let WEBRTC_AVAILABLE = true

try {
  require('!erizo') // eslint-disable-line
} catch (e) {
  WEBRTC_AVAILABLE = false
}

const INVITATION_TYPE = {
  SINGLE_CHAT: 0,
  AFFAIR_GROUP: 1,
  ANNOUNCEMENT_GROUP: 2,
}

export const VideoConferenceHOC = (Component) => {
  function mapStateToProps(state, props) {
    const roleId = state.getIn(['affair', 'affairMap', props.params.id, 'roleId'])

    return {
      user: state.get('user'),
      conference: state.get('conference'),
      role: state.getIn(['user', 'roles']).find((v) => v.get('roleId') == roleId),
      affair: state.getIn(['affair', 'affairMap', props.params.id]),
    }
  }
  function mapDispatchToProps(dispatch) {
    return {
      enterConference: bindActionCreators(enterConference, dispatch),
      endConference: bindActionCreators(endConference, dispatch),
      fetchConferenceInformation: bindActionCreators(fetchConferenceInformation, dispatch),
      remindAttendeeJoin: bindActionCreators(remindAttendeeJoin, dispatch),
      refuseConferenceInvitation: bindActionCreators(refuseConferenceInvitation, dispatch),
      inviteOthers: bindActionCreators(inviteOthers, dispatch),
      enterBoard: bindActionCreators(enterBoard, dispatch),
    }
  }

  let VideoConferenceContainer = React.createClass({
    contextTypes: {
      router: React.PropTypes.object.isRequired,
    },

    renderEnterConference() {
      const invitations = this.props.conference.get('receiveInvitation')

      return invitations.map((invitation, key) => {
        let content = null
        let type = invitation.get('meetingOrigin')
        if (type === INVITATION_TYPE.ANNOUNCEMENT_GROUP) {
          content = `${invitation.get('roleTitle')}-${invitation.get('username')}在${invitation.get('announcementTitle')}发布${invitation.get('chatGroupName')}中发起了视频通话`
        } else if (type === INVITATION_TYPE.AFFAIR_GROUP) {
          content = `${invitation.get('roleTitle')}-${invitation.get('username')}在${invitation.get('affairName')}事务讨论组${invitation.get('chatGroupName')}中发起了视频通话`
        } else if (type === INVITATION_TYPE.SINGLE_CHAT) {
          content = `${invitation.get('roleTitle')}-${invitation.get('username')}在${invitation.get('affairName')}事务中发起了视频通话`
        }
        return (
          <Modal
            key={key}
            width={500}
            okText="加入通话"
            wrapClassName={styles.enterConferenceModal}
            onCancel={() => this.props.refuseConferenceInvitation(invitation.get('id'))}
            onOk={
              () => {
                this.props.endConference()
                this.props.enterConference(invitation.get('conferenceId'), invitation.get('receiverRoleId'))
                  .then(() => this.props.refuseConferenceInvitation(invitation.get('id')))
              }
            }
            closable={false}
            visible
          >
            <div className={styles.enterConferenceInformation}>
              <div className={styles.avatar}>
                {invitation.get('avatar') ? <img src={invitation.get('avatar')} /> : null}
              </div>
              {content}
            </div>
          </Modal>
        )
      })
    },

    renderConference() {
      const {
        conference,
        role,
        affair,
        inviteOthers,
      } = this.props


      if (!WEBRTC_AVAILABLE) {
        message.error('您的浏览器暂不支持视频会话')
        return null
      } else if (conference.get('roomToken') && role) {
        return (
          <ConferenceContainer
            affair={affair}
            role={role}
            inviteOthers={inviteOthers}
            endConference={this.props.endConference}
            fetchConferenceInformation={this.props.fetchConferenceInformation}
            remindAttendeeJoin={this.props.remindAttendeeJoin}
            conference={conference}
            user={this.props.user}
            enterBoard={this.props.enterBoard}
          />
        )
      } else {
        return null
      }
    },

    render() {
      return (
        <div>
          <Component {...this.props}/>

          {this.renderEnterConference()}

          {this.renderConference()}
        </div>
      )
    }
  })

  return connect(mapStateToProps, mapDispatchToProps)(VideoConferenceContainer)
}
