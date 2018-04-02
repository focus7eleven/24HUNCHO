import React from 'react'
import { Popover } from 'antd'
import _ from 'underscore'
import Infinite from 'react-infinite'

import { ChatGroupIcon, MoreIcon } from 'svg'
import styles from './AffairChatWindow.scss'
import ChatBox from '../../components/chat/ChatBoxX'
import ChatMessage, { MESSAGE_POSITION } from '../../components/chat/ChatMessage'
import { CHAT_TYPE } from 'chat-contants'
import config from '../../config'

const PropTypes = React.PropTypes

const ChatWindow = React.createClass({
  PropTypes: {
    userId: PropTypes.number.isRequired, // 当前登录用户id，用来判断是否是用户本人发送的消息,
    affair: PropTypes.object.isRequired, // 当前公告所在的事务
    group: PropTypes.object.isRequired, // 当前讨论组
    containerHeight: PropTypes.number.isRequired, // 聊天窗口高度
    isOfficial: PropTypes.bool.isRequired, // 是否是官方
    chatMessages: PropTypes.object.isRequired, // 当前讨论组的消息列表
    members: PropTypes.object.isRequired, // 当前讨论组的所有成员
    onSend: PropTypes.func.isRequired, // 发送会话消息
    showMembers: PropTypes.func.isRequired, //显示组内成员
    openChatRecordPanel: PropTypes.func, // 打开查找聊天记录面板
    openChatFilesPanel: PropTypes.func, // 打开查找聊天文件面板
    openSettingModal: PropTypes.func, // 打开设置讨论组面板
    enterConference: PropTypes.func.isRequired, // 点击进入某个视频会议
  },

  getInitialState() {
    return {
      isInfiniteLoading: false,
      messageHeights: [],
      optionsVisible: false,
      chatAuth: {},
      containerHeight: 1,
      roleCache: {}
    }
  },

  componentWillMount() {
    if (this.props.chatMessages) {
      let newMessageHeights = []
      for (let i = 0; i < this.props.chatMessages.size; i++) {
        newMessageHeights[i] = 54 + 10
      }
      this.setState({ messageHeights: newMessageHeights, isInfiniteLoading: false })
    }
    this._roleCache = {} // 缓存角色个人信息
  },

  componentDidMount() {
    const containerHeight = this.infiniteContainer ? this.infiniteContainer.offsetHeight : 620
    
    this.setState({
      containerHeight
    })
    this.handleScrollToBottom()
  },

  // 更新infinite高度（chatMessages的大小改变）
  componentWillReceiveProps(nextProps) {
    const containerHeight = this.infiniteContainer ? this.infiniteContainer.offsetHeight : 620
    if (this.state.containerHeight !== containerHeight) {
      this.setState({
        containerHeight
      })
    }
    
    if (!this.props.chatMessages || this.props.chatMessages.size !== nextProps.chatMessages.size) {
      if (nextProps.chatMessages) {
        let newMessageHeights = []
        for (let i = 0; i < nextProps.chatMessages.size; i++) {
          newMessageHeights[i] = 54 + 10
        }
        this.setState({ 
          messageHeights: newMessageHeights,
          isInfiniteLoading: false 
        })
      } else {
        this.setState({ messageHeights: [] })
      }
    }
    if (nextProps.selectedChat && nextProps.selectedChatKey !== this.props.selectedChatKey) {
      if (nextProps.selectedChat.get('type') === CHAT_TYPE.GROUP) {
        this.getGroupAuth(nextProps.selectedChat.get('groupInfo'))
      }
    }
  },

  componentDidUpdate(prevProps) {
    const prevLastMessage = prevProps.chatMessages.get(0)
    const lastMessage = this.props.chatMessages.get(0)
    if (prevLastMessage && lastMessage) {
      if (prevLastMessage.time > lastMessage.time) {
        // 根据消息列表里的第一条消息的时间判断是否需要滚动        
        this.scrollToTop()
      } else {
        if (prevProps.chatMessages.size < this.props.chatMessages.size) {
          this.handleScrollToBottom()
        }
      }
    } else {
      this.handleScrollToBottom()
    }
  },

  getGroupAuth(group) {
    const { affair } = this.props
    fetch(config.api.chat.groupPermission(group.groupId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.setState({
          chatAuth: res.data
        })
      }
    })
  },

  // 滚动到顶部
  scrollToTop() {
    let scrollContainer = this.refs.scrollContainer && this.refs.scrollContainer.scrollable
    if (scrollContainer) {
      scrollContainer.scrollTop = 2
    }
  },

  //滚动到底部
  handleScrollToBottom() {
    let scrollContainer = this.refs.scrollContainer && this.refs.scrollContainer.scrollable
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  },

  //消息mount后重设高度
  resetMessageHeight(element) {
    if (element) {      
      let newMessageHeights = this.state.messageHeights
      newMessageHeights[element.getAttribute('data-index')] = element.clientHeight + 10
      this.setState({ messageHeights: newMessageHeights })
    }
  },

  //图片加载后重设高度
  resetMessageHeightOnImageLoad(image, index, onLoad = false) {
    if (image) {
      let newMessageHeights = this.state.messageHeights
      newMessageHeights[index] = image.clientHeight + 40
      this.setState({ messageHeights: newMessageHeights })
    }

    if (onLoad) {
      this.handleScrollToBottom()
    }
  },

  //scroll to top
  handleInfiniteLoad() {    
    
  },

  // 下拉加载更多
  handleScrollTop(e) {
    if (e.scrollTop < 5) {
      if (this.props.chatMessages.size === 0 || this._isInfiniteLoading) {
        return
      }
      this._isInfiniteLoading = true
      let load = () => {
        this.props.loadMoreMessage().then(() => {
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
  },

	// 进入视频会议
  handleEnterConference(message) {
    let content = null

    try {
      content = JSON.parse(message.content)
    } catch (err) {
      content = {}
    }

    if (content.conferenceId) {
      this.props.enterConference(content.conferenceId, this.props.affair.get('roleId'))
    }
  },

  // 根据 roleId 获取角色信息
  getUserFromMembers(roleId) {
    const roleMap = this._roleCache
    if (roleMap[roleId]) {
      return roleMap[roleId]
    }
    const { members } = this.props
    const role = members.find((m) => m.id === roleId)

    if (role) {
      this._roleCache[roleId] = role      
    } 
    return role

    // if (role) {
    //   roleMap[roleId] = role
    //   this.setState({
    //     roleCache: roleMap
    //   })
    //   return role
    // } else {
    //   // 获取角色信息
    //   // fetch(config.api.user.roleInfo(), {
    //   //   method: 'GET',
    //   //   credentials: 'include',
    //   //   affairId: affair.get('id'),
    //   //   roleId
    //   // }).then((res) => res.json()).then((res) => {
    //   //   console.log(res)
        
    //   // })
    // }

  },

  getChatInfo(selectedChat) {
    let chatInfo = null
    if (selectedChat) {
      if (selectedChat.get('type') === CHAT_TYPE.GROUP) {
        chatInfo = selectedChat.get('groupInfo')
        chatInfo.groupId = chatInfo.groupId
      } else if (selectedChat.get('type') === CHAT_TYPE.SINGLE) {
        chatInfo = selectedChat.get('toUserInfo')
        chatInfo.groupId = -1
      }
    }
    return chatInfo
  },

  renderOptions() {
    const { selectedChat } = this.props
    const { chatAuth } = this.state
    const isGroup = (selectedChat && selectedChat.get('type') === CHAT_TYPE.GROUP)
    
    const content = (
      <div className={styles.optionsList}>
        <div
          className={styles.optionItem}
          onClick={() => {
            this.setState({ optionsVisible: false })
            this.props.openChatRecordPanel()
          }}
        >查找聊天记录</div>
        {(isGroup && chatAuth.hasPermissionInGroup) ? 
          <div
            className={styles.optionItem}
            onClick={() => {
              this.setState({ optionsVisible: false })
              this.props.openSettingModal()
            }}
          >设置讨论组</div> : null
        }
        {(isGroup && chatAuth.isRoleInGroup) ? 
          <div
            className={styles.optionItem}
            onClick={() => {
              this.setState({ optionsVisible: false })
              this.props.openQuitModal(selectedChat.get('groupInfo'))
            }}
          >退出讨论组</div> : null
        }
        {(isGroup && chatAuth.hasPermissionInGroup) ? 
          <div
            className={styles.optionItem}
            onClick={() => {
              this.setState({ optionsVisible: false })
              this.props.openDisbandModal(selectedChat.get('groupInfo'))
            }}
          >解散讨论组</div> : null
        }
      </div>
    )

    return (
      <div className={styles.groupIcon}>
        {isGroup ? 
          <span style={{ marginRight: '4px' }} onClick={this.props.showMembers}><ChatGroupIcon /></span> : null
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
  },

  render() {
    const { members, chatMessages, onSend, userId, affair, selectedChat } = this.props
    const { messageHeights, containerHeight, isInfiniteLoading } = this.state
    const chatInfo = this.getChatInfo(selectedChat)

		// if (groupId < 0 || !groupId || !members.size) {
		// 	return null
    // }

    if (!selectedChat) {
      return null
    }

    const currentRoleId = affair.get('roleId')
        
    return (
      <div className={styles.affairChatWindow}>
        <div className={styles.header}>
          <div>{chatInfo ? chatInfo.name : ''}</div>
          {this.renderOptions()}
        </div>
        <div className={styles.infiniteContainer} ref={(c) => this.infiniteContainer = c} >
          <Infinite
            className={styles.content}
            elementHeight={messageHeights}
            containerHeight={containerHeight}
            isInfiniteLoading={isInfiniteLoading}
            handleScroll={_.debounce(this.handleScrollTop, 800)}
            ref="scrollContainer"
          >
            {chatMessages && chatMessages.map((message, index) => {
              const isRightPosition = (currentRoleId === message.fromRoleId)
              const role = this.getUserFromMembers(message.fromRoleId)
              
              return (
                <div key={index} data-index={index} ref={this.resetMessageHeight}>
                  <ChatMessage
                    inAffair
                    message={message}
                    position={isRightPosition ? MESSAGE_POSITION.RIGHT : MESSAGE_POSITION.LEFT}
                    affair={affair}
                    role={role}
                    currentRoleId={currentRoleId}
                    onSend={onSend}
                    members={members}
                    enterConference={this.handleEnterConference}
                  />
                </div>
              )
            })}
          </Infinite>
        </div>

        <div className={styles.chatBox}>
          <ChatBox
            groupId={chatInfo ? chatInfo.groupId : 0}
            onSend={onSend}
            initFileMessage={this.props.initFileMessage}
            affairId={parseInt(affair.get('id'))}
            userId={userId}
            affair={affair}
            members={members}
          />
        </div>
      </div>
    )
  }
})

export default ChatWindow
