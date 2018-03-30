import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'

import classNames from 'classnames'
import styles from './ChatContainer.scss'
import ListPanel from './ListPanel'
import MessagePanel from './MessagePanel'
import { MESSAGE_INIT_LIMIT } from 'chat-contants'
import GroupMembersPanel from './GroupMembersPanel'
import ChatRecordPanel from './ChatRecordPanel'
import { getGroupMember } from '../../actions/chat'

const Client = window.SocketClient
const Constants = Client.Constants

class ChatContainer extends React.Component {
  state = {
    membersVisible: false,
    chatRecordPanelVisible: false,
  }

  fetchGroupChatMessage = (id) => {
    const { roleId } = this.props
    const params = {
      groupId: id,
      roleId,
      limit: MESSAGE_INIT_LIMIT
    }
    return new Promise((resolve, reject) => {
      Client.groupChatService.openGroupChat(params, (success) => {
        resolve(success)
      }, (fail) => {
        reject(fail)
      })
    })
  }

  fetchSingleChatMessage = (toRoleId) => {
    const { affairId, roleId } = this.props
    const params = {
      affairId,
      roleId,
      toRoleId: toRoleId,
      limit: MESSAGE_INIT_LIMIT
    }
    return new Promise((resolve, reject) => {
      Client.privateChatService.openPrivateChat(params, (success) => {
        resolve(success)
      }, (fail) => {
        reject(fail)
      })
    })
  }

  handleMemberPanelState = (state) => {
    if (state) {
      const groupId = this.props.selectedChat.getIn(['groupInfo', 'groupId'])
      this.props.getGroupMember(groupId).then(res => {
        this.setState({ membersVisible: state})
      })
    } else {
      this.setState({ membersVisible: state})
    }
  }

  handleRecordPanelState = (state) => {
    if (state) {
      // const groupId = this.props.selectedChat.getIn(['groupInfo', 'groupId'])
      // this.props.getGroupMember(groupId).then(res => {
        this.setState({ chatRecordPanelVisible: state})
      // })
    } else {
      this.setState({ chatRecordPanelVisible: state})
    }
  }

  // 讨论组内成员面板, 聊天文件面板, 聊天记录面板
  renderMembersPanel = () => {
    const { membersVisible } = this.state
    return (
      <div
        className={classNames(styles.panelContainer, { visible: membersVisible })}
      >
        <GroupMembersPanel
          close={this.handleMemberPanelState.bind(this, false)}
        />
      </div>
    )
  }

  renderChatRecordsPanel = () => {
    // const { affairId, selectedChat } = this.props
    const { chatRecordPanelVisible } = this.state

    // let group = {
    //   key: selectedChat ? selectedChat.get('_key') : ''
    // }
    return (
      <div
        className={classNames(styles.panelContainer, { visible: chatRecordPanelVisible })}
      >
        <ChatRecordPanel
          // isGroup
          // affair={affair}
          // group={group}
          // visible
          // members={this.getCurrentMembers(members)}
          close={this.handleRecordPanelState.bind(this, false)}
        />
      </div>
    )
  }

  render() {
    return (
      <div className={styles.container}>
        <div className={styles.listPanel}>
          <ListPanel
            fetchSingleChatMessage={this.fetchSingleChatMessage}
            fetchGroupChatMessage={this.fetchGroupChatMessage}
          />
        </div>
        <div className={styles.messagePanel}>
          <MessagePanel
            fetchSingleChatMessage={this.fetchSingleChatMessage}
            fetchGroupChatMessage={this.fetchGroupChatMessage}
            showMember={this.handleMemberPanelState.bind(this, true)}
            showRecord={this.handleRecordPanelState.bind(this, true)}
          />

          {this.renderMembersPanel()}
          {this.renderChatRecordsPanel()}
          {/* {this.state.chatRecordPanel ? this.renderChatRecordsPanel() : null} */}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state, props) {
	return {
		roleId: state.getIn(['user', 'role', 'roleId']),
    affairId: props.match.params.groupId || props.match.params.id,
    selectedChat: state.getIn(['chat', 'selectedChat']),
    currentGroupMember: state.getIn(['chat', 'currentGroupMember']),
	}
}

function mapDispatchToProps(dispatch) {
	return {
    getGroupMember: bindActionCreators(getGroupMember, dispatch),
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ChatContainer))
