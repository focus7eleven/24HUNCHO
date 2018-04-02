import React from 'react'
import { Popover } from 'antd'
import _ from 'underscore'
import Infinite from 'react-infinite'

import { ChatGroupIcon, MoreIcon } from 'svg'
import styles from './ChatWindow.scss'
import ChatBox from './ChatBoxX'
import ChatMessage, { MESSAGE_POSITION } from './ChatMessage'

const PropTypes = React.PropTypes

const ChatWindow = React.createClass({
  PropTypes: {
    userId: PropTypes.number.isRequired, // 当前登录用户id，用来判断是否是用户本人发送的消息,
    affair: PropTypes.object.isRequired, // 当前公告所在的事务
    group: PropTypes.object.isRequired, // 当前讨论组
    containerHeight: PropTypes.number.isRequired, // 聊天窗口高度
    isOfficial: PropTypes.bool.isRequired, // 是否是官方
    members: PropTypes.object.isRequired, // 当前讨论组的所有成员
    chatMessages: PropTypes.object.isRequired, // 当前讨论组的消息列表

    onSend: PropTypes.func.isRequired, // 发送会话消息
    showMembers: PropTypes.func.isRequired, //显示组内成员
    openChatRecordPanel: PropTypes.func, // 打开查找聊天记录面板
    openSettingModal: PropTypes.func, // 打开设置讨论组面板
    enterConference: PropTypes.func.isRequired, // 点击进入某个视频会议
  },

  getInitialState() {
    return {
      isInfiniteLoading: false,
      messageHeights: [],
      optionsVisible: false,
      containerHeight: 1
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
    const containerHeight = this.infiniteContainer ? this.infiniteContainer.offsetHeight : 300
    
    this.setState({
      containerHeight
    })
    this.handleScrollToBottom()
  },

  // 更新infinite高度（chatMessages的大小改变）
  componentWillReceiveProps(nextProps) {
    if (!this.props.chatMessages || this.props.chatMessages.size != nextProps.chatMessages.size) {
      if (nextProps.chatMessages) {
        let newMessageHeights = []
        for (let i = 0; i < nextProps.chatMessages.size; i++) {
          newMessageHeights[i] = 54 + 10
        }
        this.setState({ messageHeights: newMessageHeights, isInfiniteLoading: false })
      } else {
        this.setState({ messageHeights: [] })
      }
    }
    const containerHeight = this.infiniteContainer ? this.infiniteContainer.offsetHeight : 300
    this.setState({
      containerHeight
    })
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

  // //scroll to top
  // handleInfiniteLoad() {
  //   if (this.props.chatMessages.size === 0 || this._isInfiniteLoading) {
  //     return
  //   }
    
  //   this._isInfiniteLoading = true
  //   let load = () => {
  //     this.props.loadMoreMessage().then(() => {
  //       setTimeout(() => {
  //         this.setState({ isInfiniteLoading: false })
  //         this._isInfiniteLoading = false
  //       }, 100)
  //     })
  //   }
  //   this.setState({
  //     isInfiniteLoading: true
  //   }, load)
  // },

  // 下拉加载更多
  handleScrollTop(e) {
    if (e.scrollTop < 2) {
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
    let role = members.find((m) => m.id === roleId)
    if (role) {
      this._roleCache[roleId] = role      
    } 
    // else {
    //   role = {
    //     roleId: 0,
    //     avatar: DEFAULT_AVATOR,
    //     roleTitle: '已移除',
    //     username: '角色'
    //   }
    // }
    return role
  },

  renderOptions() {
    const { isOfficial } = this.props
    const content = (
      <div className={styles.optionsList}>
        <div
          className={styles.optionItem}
          onClick={() => {
            this.setState({ optionsVisible: false })
            this.props.openChatRecordPanel()
          }}
        >聊天记录</div>
        {isOfficial ?
          <div
            className={styles.optionItem}
            onClick={() => {
              this.setState({ optionsVisible: false })
              this.props.openDisbandModal(this.props.group)
            }}
          >解散讨论组</div> : null
        }
        {isOfficial ?
          <div
            className={styles.optionItem}
            onClick={() => {
              this.setState({ optionsVisible: false })
              this.props.openSettingModal()
            }}
          >设置</div> : null
        }
        
      </div>
    )

    return (
      <div className={styles.groupIcon}>
        <span style={{ marginRight: '4px' }} onClick={this.props.showMembers}><ChatGroupIcon /></span>
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

  render(){
    const { members, chatMessages, onSend, userId, affair, group } = this.props
    const { messageHeights, containerHeight, isInfiniteLoading } = this.state
        
    if (!group) {
      return null
    }

    const currentRoleId = affair.get('roleId')

    return (
      <div className={styles.chatContainer}>
        <div className={styles.header}>
          <div className={styles.groupName}>{group.name}</div>
          {this.renderOptions()}
        </div>
        <div className={styles.infiniteContainer} ref={(c) => this.infiniteContainer = c}>
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
            groupId={group.id}
            onSend={onSend}
            initFileMessage={this.props.initFileMessage}
            affairId={parseInt(affair.get('id'))}
            userId={userId}
            affair={affair}
            members={this.props.members}
          />
        </div>
      </div>
    )
  }
})

export default ChatWindow
