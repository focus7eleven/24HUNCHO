import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { findDOMNode } from "react-dom"
import { withRouter } from 'react-router-dom'
import { bindActionCreators } from 'redux'
import { Map, List, fromJS } from 'immutable'
import _ from 'lodash'
import { Popover, Modal } from 'antd'
import Infinite from 'react-infinite'
import { ChatGroupIcon, MoreIcon } from 'svg'
import styles from './MessagePanel.scss'
import GroupSettingModal from './GroupSettingModal'
import ChatBox from '../../components/chat/ChatBox'
import ChatMessage, { MESSAGE_POSITION } from '../../components/chat/ChatMessage'
import { CHAT_TYPE, MESSAGE_LOAD_COUNT } from 'chat-contants'
import { leaveGroup, disbandGroup, getGroupChatList, getGroupAuth, updateRecentChat, addRecentChat } from '../../actions/chat'

const Client = window.SocketClient
const Constants = Client.Constants
const MESSAGE_HEIGHT = 54 + 10

class MessagePanel extends React.Component {
  static propTypes = {
    // group: PropTypes.object.isRequired, // 当前讨论组
    // chatMessages: PropTypes.object.isRequired, // 当前讨论组的消息列表
    // members: PropTypes.object.isRequired, // 当前讨论组的所有成员
    fetchSingleChatMessage: PropTypes.func.isRequired, // 发送会话消息
    fetchGroupChatMessage: PropTypes.func.isRequired, // 发送会话消息
    // showMembers: PropTypes.func.isRequired, //显示组内成员
    // openChatRecordPanel: PropTypes.func, // 打开查找聊天记录面板
    // openChatFilesPanel: PropTypes.func, // 打开查找聊天文件面板
    // openSettingModal: PropTypes.func, // 打开设置讨论组面板
    // enterConference: PropTypes.func.isRequired, // 点击进入某个视频会议
  }

  state = {
    settingModalVisible: false,
    isInfiniteLoading: false,
    messageHeights: [],
    optionsVisible: false,
    containerHeight: 1,
    currentMessageList: Map(),
    groupAuth: {},
    lastMessageId: ''
  }

  componentWillMount() {
    this.initMessageList()
    this.addListeners()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectedChat.get('_key') !== this.props.selectedChat.get('_key')) {
      this.initMessageList(nextProps)
    }
    const containerHeight = this.infiniteContainer ? this.infiniteContainer.offsetHeight : 620
    this.setState({ containerHeight })
  }

  componentDidMount() {
    const containerHeight = this.infiniteContainer ? this.infiniteContainer.offsetHeight : 620
    this.setState({ containerHeight })
    this.handleScrollToBottom()
  }

  // componentDidUpdate() {
  //   this.handleScrollToBottom()
  // }

  addListeners = () => {
    Client.addHandler('MSG', this.receiveMessageListener)
  }

  initMessageList = (props = this.props) => {
    if (props.selectedChat.get('_key')) {
      const toRoleId = props.selectedChat.getIn(['toUserInfo', 'toRoleId'])
      const groupId = props.selectedChat.getIn(['groupInfo', 'groupId'])
      if (toRoleId) {
        this.props.fetchSingleChatMessage(toRoleId).then(success => {
          const messageHeights = Array(success.msgList.length).fill(MESSAGE_HEIGHT)
          this.setState({ currentMessageList: fromJS(success), messageHeights })
          this.handleScrollToBottom()
        })
      } else if(groupId){
        this.props.getGroupAuth(props.affairId, props.roleId, groupId).then(res => {
          this.setState({ groupAuth: res })
        })
        this.props.fetchGroupChatMessage(groupId).then(success => {
          const messageHeights = Array(success.msgList.length).fill(MESSAGE_HEIGHT)
          this.setState({ currentMessageList: fromJS(success), messageHeights })
          this.handleScrollToBottom()
        })
      }
    } else {
      this.setState({
        messageHeights: [],
        currentMessageList: Map(),
        groupAuth: {},
        lastMessageId: ''
      })
    }
  }

  receiveMessageListener = (message) => {
    console.log('new message: ', message);
    if(this.state.lastMessageId === message._id || !this.getUserFromMembers(message.fromRoleId)) {
      return
    } else {
      this.setState({ lastMessageId: message._id})
    }
    const newMessage = fromJS(message)
    const currentChatKey = this.props.selectedChat.get('_key')
    let isUnread = 1
    if (newMessage.get('_key') === currentChatKey) {
      let { currentMessageList, messageHeights } = this.state
      currentMessageList = currentMessageList.update('msgList', v => v.push(newMessage))
      messageHeights.push(MESSAGE_HEIGHT)
      this.setState({ currentMessageList, messageHeights })
      this.handleScrollToBottom()
      isUnread = 0
    }

    this.handleUpdateRecentChat(newMessage, isUnread)
  }

  handleUpdateRecentChat = (newMessage, isUnread = 1) => {
    if (this.props.recentChat.find(v => v.get('_key') === newMessage.get('_key'))) {
      this.props.updateRecentChat(newMessage, isUnread)
    } else {
      let newRecentChat = Map()
      newRecentChat = newRecentChat.set('_key', newMessage.get('_key'))
                                  .set('time', newMessage.get('time'))
                                  .set('type', newMessage.get('type'))
                                  .set('lastMsg', newMessage)
                                  .set('unreadCount', isUnread)
      if (newMessage.get('type') === CHAT_TYPE.SINGLE) {
        const role = isUnread ? this.getUserFromMembers(newMessage.get('fromRoleId')) : this.getUserFromMembers(newMessage.get('toRoleId'))
        const toUserInfo = {
          avatar: role.avatar,
          name: role.title + '-' + role.realName,
          toRoleId: role.id,
          toUserId: role.userId,
        }
        newRecentChat = newRecentChat.set('toUserInfo', fromJS(toUserInfo))
        this.props.addRecentChat(newRecentChat)
      } else if (newMessage.get('type') === CHAT_TYPE.GROUP) {
        this.props.getGroupChatList(this.props.affairId, this.props.roleId).then(res => {
          const group = res.find(v => v.id === newMessage.get('groupId'))
          newRecentChat = newRecentChat.set('groupInfo', fromJS({groupId: group.id, name: group.name, avatar: group.avatar}))
          this.props.addRecentChat(newRecentChat)
        })
      }
    }
  }

  // componentDidUpdate(prevProps) {
  //   const prevLastMessage = prevProps.chatMessages.get(0)
  //   const lastMessage = this.props.chatMessages.get(0)
  //   if (prevLastMessage && lastMessage) {
  //     if (prevLastMessage.time > lastMessage.time) {
  //       // 根据消息列表里的第一条消息的时间判断是否需要滚动
  //       this.scrollToTop()
  //     } else {
  //       if (prevProps.chatMessages.size < this.props.chatMessages.size) {
  //         this.handleScrollToBottom()
  //       }
  //     }
  //   } else {
  //     this.handleScrollToBottom()
  //   }
  // }
  // 滚动到顶部
  scrollToTop = () => {
    let scrollContainer = this.scrollContainer && this.scrollContainer.scrollable
    if (scrollContainer) {
      scrollContainer.scrollTop = 2
    }
  }

  //滚动到底部
  handleScrollToBottom = () => {
    const inifiniteScrollContainer= findDOMNode(this.scrollContainer)
    if(inifiniteScrollContainer){
      inifiniteScrollContainer.scrollTop = inifiniteScrollContainer.scrollHeight
    }
  }

  //消息mount后重设高度
  resetMessageHeight = (element) => {
    if (element) {
      let newMessageHeights = this.state.messageHeights
      newMessageHeights[element.getAttribute('data-index')] = element.clientHeight + 10
      this.setState({ messageHeights: newMessageHeights })
    }
  }

  handleLoadMoreMessage = () => {
    const { affairId, roleId, selectedChat } = this.props
    const { currentMessageList } = this.state
    const endTime = currentMessageList.getIn(['msgList', 0, 'time'])
    let params = {}
    return new Promise(resolve => {
      if (selectedChat.get('type') === CHAT_TYPE.GROUP) {
        params = {
          groupId: selectedChat.getIn(['groupInfo', 'groupId']),
          roleId,
          limit: MESSAGE_LOAD_COUNT,
          endTime
        }

        Client.groupChatService.loadGroupMsg(params, success => {
          const messageHeights = Array(success.msgList.length).fill(MESSAGE_HEIGHT)
          this.setState({ currentMessageList: fromJS(success), messageHeights })
          resolve()
        })
      } else {
        params = {
          roleId,
          affairId,
          toRoleId: selectedChat.getIn(['toUserInfo', 'toRoleId']),
          limit: MESSAGE_LOAD_COUNT,
          endTime
        }

        Client.privateChatService.loadPrivateChatMsg(params, success => {
          const messageHeights = Array(success.msgList.length).fill(MESSAGE_HEIGHT)
          this.setState({ currentMessageList: fromJS(success), messageHeights })
          resolve()
        })
      }
    })
  }

  // 下拉加载更多
  handleScrollTop = (e) => {
    if (e.scrollTop < 15) {
      if (this.state.currentMessageList.length === 0 || this._isInfiniteLoading) {
        return
      }
      this._isInfiniteLoading = true
      let load = () => {
        this.handleLoadMoreMessage().then(() => {
          setTimeout(() => {
            this.setState({ isInfiniteLoading: false })
            this._isInfiniteLoading = false
          }, 100)
        })
      }
      this.setState({
        isInfiniteLoading: true
      }, load)
    }
  }

	// 进入视频会议
  handleEnterConference = (message) => {
    let content = null

    try {
      content = JSON.parse(message.content)
    } catch (err) {
      content = {}
    }

    if (content.conferenceId) {
      this.props.enterConference(content.conferenceId, this.props.affair.get('roleId'))
    }
  }

  // 根据 roleId 获取角色信息
  getUserFromMembers = (roleId) => {
    const affairRoles = this.props.match.params.groupId ? this.props.groupRole : this.props.courseRole

    for(let i = 0; i < affairRoles.size; i++) {
      const target = affairRoles.get(i).get('roleList').find(vv => vv.get('id') === roleId)
      if (target) {
        return target.toJS()
      }
    }
    return null
  }

  handleSendMessage = (content, subType = Client.Constants.CHAT_SUBTYPE.DEFAULT) => {
    const { selectedChat } = this.props

    if (selectedChat.get('type') === CHAT_TYPE.GROUP) {
      this.sendGroupMessage(selectedChat.get('groupInfo'), content, subType)
    } else {
      this.sendPrivateMessage(selectedChat.get('toUserInfo'), content, subType)
    }
  }

  sendGroupMessage = (group, content, subType) => {
    const { roleId, userRealName, userId } = this.props

    const params = {
      type: CHAT_TYPE.GROUP,
      fromRoleId: roleId,
      groupId: group.get('groupId'),
      sub: subType,
      name: userRealName,
      apns: [],
      fromUserId: userId,
      content
    }

    Client.groupChatService.sendGroupMsg(params, (success) => {
      this.handleSendMessageSuccess(success)
    })
  }

  sendPrivateMessage = (toUser, content, subType) => {
    const { affairId, roleId, userRealName, userId } = this.props

    const params = {
      type: CHAT_TYPE.SINGLE,
      fromRoleId: roleId,
      affairId,
      toUserId: toUser.get('toUserId'),
      toRoleId: toUser.get('toRoleId'),
      sub: subType,
      name: userRealName,
      fromUserId: userId,
      content
    }

    Client.privateChatService.sendPrivateChatMsg(params, (success) => {
      this.handleSendMessageSuccess(success)
    })
  }

  handleSendMessageSuccess = (success) => {
    success.fromUserId = this.props.userId
    success._key = this.props.selectedChat.get('_key')
    const newMessage = fromJS(success)
    let { currentMessageList, messageHeights } = this.state
    currentMessageList = currentMessageList.update('msgList', v => v.push(newMessage))
    messageHeights.push(MESSAGE_HEIGHT)
    this.setState({ currentMessageList, messageHeights })
    this.handleScrollToBottom()
    this.handleUpdateRecentChat(newMessage, 0)
  }

  initFileMessage = (file, subType) => {
    // const { affair, user, selectedChatKey, recentChats } = this.props
    const { selectedChat, recentChat, affairId, roleId, userId, userRealName } = this.props
    let { currentMessageList, messageHeights } = this.state

    let message = null
    if (selectedChat.get('type') === CHAT_TYPE.GROUP) {
      const group = selectedChat.get('groupInfo')
      const params = {
        type: CHAT_TYPE.GROUP,
        fromRoleId: roleId,
        groupId: group.get('groupId'),
        sub: subType,
        name: userRealName,
        apns: [],
        fromUserId: userId
      }
      message = Object.assign({ file, _key: selectedChat.get('_key') }, params)
      message['callback'] = (content) => {
        Client.groupChatService.sendGroupMsg(Object.assign({ content }, params), (success) => {
          currentMessageList = currentMessageList.update('msgList', v => v.set(v.indexOf(fromJS(message)), fromJS(success)))
          this.setState({ currentMessageList })
          this.handleScrollToBottom()
          this.handleUpdateRecentChat(fromJS(success), 0)
        })
      }
      message['cancel'] = () => {
        currentMessageList = currentMessageList.update('msgList', v => v.splice(v.indexOf(fromJS(message)), 1))
        this.setState({ currentMessageList })
      }
    } else {
      const toUser = selectedChat.get('toUserInfo')
      const params = {
        type: CHAT_TYPE.SINGLE,
        fromRoleId: roleId,
        affairId: affairId,
        toUserId: toUser.get('toUserId'),
        toRoleId: toUser.get('toRoleId'),
        sub: subType,
        name: userRealName,
        fromUserId: userId,
      }
      message = Object.assign({ file, _key: selectedChat.get('_key') }, params)
      message['callback'] = (content) => {
        Client.privateChatService.sendPrivateChatMsg(Object.assign({ content }, params), (success) => {
          currentMessageList = currentMessageList.update('msgList', v => v.set(v.indexOf(fromJS(message)), fromJS(success)))
          this.setState({ currentMessageList })
          this.handleScrollToBottom()
          this.handleUpdateRecentChat(fromJS(success), 0)
        })
      }

      message['cancel'] = () => {
        currentMessageList = currentMessageList.update('msgList', v => v.splice(v.indexOf(fromJS(message)), 1))
        this.setState({ currentMessageList })
      }
    }
    currentMessageList = currentMessageList.update('msgList', v => v.push(fromJS(message)))
    messageHeights.push(MESSAGE_HEIGHT)
    this.setState({ currentMessageList, messageHeights })
  }

  showConfirmQuitGroup = (groupInfo) => {
    const { affairId, roleId } = this.props
    Modal.confirm({
      iconType: 'exclamation-circle',
      className: styles.affairChatConfrim,
      title: `确定退出讨论组“${groupInfo.get('name')}”吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => this.props.leaveGroup(affairId, roleId, groupInfo.get('groupId')).then(res => this.setState({ messageHeights: [], currentMessageList: Map() }))
    })
  }

  renderOptions() {
    const { selectedChat } = this.props
    const { groupAuth } = this.state
    const isGroup = selectedChat.get('type') === CHAT_TYPE.GROUP

    const content = (
      <div className={styles.optionsList}>
        <div
          className={styles.optionItem}
          onClick={() => {
            this.setState({ optionsVisible: false })
            this.props.showRecord()
          }}
        >查找聊天记录</div>
        {(isGroup && groupAuth.hasPermissionInGroup) ?
          <div
            className={styles.optionItem}
            onClick={() => {
              this.setState({ optionsVisible: false })
              this.handleSettingModalState(true)
            }}
          >设置讨论组</div> : null
        }
        {(isGroup && groupAuth.isRoleInGroup) ?
          <div
            className={styles.optionItem}
            onClick={() => {
              this.setState({ optionsVisible: false })
              this.showConfirmQuitGroup(selectedChat.get('groupInfo'))
            }}
          >退出讨论组</div> : null
        }
        {/* {(isGroup && groupAuth.hasPermissionInGroup) ?
          <div
            className={styles.optionItem}
            onClick={() => {
              this.setState({ optionsVisible: false })
              this.props.openDisbandModal(selectedChat.get('groupInfo'))
            }}
          >解散讨论组</div> : null
        } */}
      </div>
    )

    return (
      <div className={styles.groupIcon}>
        {isGroup ?
          <span style={{ marginRight: '4px' }} onClick={this.props.showMember}><ChatGroupIcon /></span> : null
        }
        <span>
          <Popover placement="bottomRight"
            content={content}
            trigger="click"
            arrowPointAtCenter
            overlayClassName={styles.optionsPopover}
            ref="popover"
            visible={this.state.optionsVisible}
            onVisibleChange={(v) => this.setState({ optionsVisible: v })}
          >
            <MoreIcon />
          </Popover>
        </span>
      </div>
    )
  }

  handleUpdateMessageHeight = (index, clientHeight) => {
    // console.log(clientHeight);
    let messageHeights = this.state.messageHeights
    messageHeights[index] = clientHeight
    // console.log(messageHeights);
  }

  handleSettingModalState = (state) => {
    this.setState({ settingModalVisible: state })
  }

  render() {
    const { settingModalVisible, messageHeights, containerHeight, isInfiniteLoading, currentMessageList } = this.state
    const { affairId, roleId, courseRole, groupRole, selectedChat } = this.props

    const affairRoles = this.props.match.params.groupId ? groupRole : courseRole

    return (
      <div className={styles.affairChatWindow}>
        <div className={styles.header}>
          <div>{selectedChat.getIn(['groupInfo', 'name']) || selectedChat.getIn(['toUserInfo', 'name'])}</div>
          {selectedChat.size ? this.renderOptions() : null}
        </div>
        <div className={styles.infiniteContainer} ref={c => this.infiniteContainer = c} >
          <Infinite
            className={styles.content}
            elementHeight={messageHeights}
            containerHeight={containerHeight}
            isInfiniteLoading={isInfiniteLoading}
            handleScroll={_.debounce(this.handleScrollTop, 400)}
            ref={s => this.scrollContainer = s}
          >
            {
              currentMessageList.get('msgList') ? currentMessageList.get('msgList').map((message, index) => {
                const isRightPosition = (roleId === message.get('fromRoleId'))
                const role = this.getUserFromMembers(message.get('fromRoleId'))

                return (
                  <div key={index} data-index={index} data-type={message.get('sub')} ref={this.resetMessageHeight}>
                    <ChatMessage
                      inAffair
                      message={message.toJS()}
                      position={isRightPosition ? MESSAGE_POSITION.RIGHT : MESSAGE_POSITION.LEFT}
                      affairId={affairId}
                      roleId={roleId}
                      role={role}
                      currentRoleId={roleId}
                      scrollToBottom={this.handleScrollToBottom}
                      updateMessageHeight={this.handleUpdateMessageHeight.bind(this, index)}
                      // onSend={onSend}
                      // members={members}
                      // enterConference={this.handleEnterConference}
                    />
                  </div>
                )
              }) : null
            }
          </Infinite>
        </div>

        {
          selectedChat.get('_key') ?
        <div className={styles.chatBox}>
          <ChatBox
            onSend={this.handleSendMessage}
            initFileMessage={this.initFileMessage}
            affairId={affairId}
          />
        </div> : null
        }
        {
          settingModalVisible ?
            <GroupSettingModal
              onCancel={this.handleSettingModalState.bind(this, false)}
              visible={settingModalVisible}
            />
            :
            null
        }
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  return {
    userRealName: state.getIn(['user', 'realName']),
    userId: state.getIn(['user', 'id']),
    roleId: state.getIn(['user', 'role', 'roleId']),
    courseRole: state.getIn(['role', 'courseRole']),
    groupRole: state.getIn(['role', 'groupRole']),
    recentChat: state.getIn(['chat', 'recentChat']),
    selectedChat: state.getIn(['chat', 'selectedChat']),
    groupChatList: state.getIn(['chat', 'groupChatList']),
    affairId: props.match.params.groupId || props.match.params.id,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getGroupChatList: bindActionCreators(getGroupChatList, dispatch),
    getGroupAuth: bindActionCreators(getGroupAuth, dispatch),
    updateRecentChat: bindActionCreators(updateRecentChat, dispatch),
    addRecentChat: bindActionCreators(addRecentChat, dispatch),
    leaveGroup: bindActionCreators(leaveGroup, dispatch),
    disbandGroup: bindActionCreators(disbandGroup, dispatch),
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MessagePanel))
