import React from 'react'
import { Badge, Button, Tooltip } from 'antd'
import classnames from 'classnames'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { addGroupMessages, updateGroupUnreadCount, pushGroupMessage, updateAnnouncementAllianceInfo, updateScroll } from '../../actions/message'
import { enterConference } from '../../actions/conference'
import { sendMessage } from 'net'
import Constants from 'net/constants/constants'
import styles from './AnnouncementChat.scss'
import { ChatGroupIcon, Dehaze } from 'svg'
import ChatWindow from '../../components/chat/ChatWindow'
import GroupModal, { GROUP_MODAL_TYPE } from '../../components/chat/GroupModal'
import { fromJS, List } from 'immutable'
import config from '../../config'

const PropTypes = React.PropTypes

const NONE_SESSION = -1

const AnnouncementChat = React.createClass({
  propTypes: {
    affair: PropTypes.object.isRequired, //发布所在事务
    isOfficial: PropTypes.bool.isRequired, //该角色在发布中是否属于官方，官方
    scope: PropTypes.number.isRequired, //域，事务内、盟内、盟客
    announcementId: PropTypes.number.isRequired,
    officials: PropTypes.array.isRequired, //官方列表
    guests: PropTypes.object.isRequired//客方列表
  },

  getDefaultProps() {
    return {
      isOfficial: false,
    }
  },

  getInitialState() {
    return {
      messages: List(), //store中的messages
      sessionList: List(), //官方的会话列表
      activeSession: {
        id: NONE_SESSION
      }, //活跃会话
      loadingMessages: false, //是否正在获取聊天消息
      guestInfo: null, //当角色为客方时，客方的主事务信息
      groupModalVisible: false //控制讨论组modal的显示
    }
  },

  componentDidMount() {
    this.fetchSessionList()
  },

  componentDidUpdate(preProps, preState) {
    const { messages, affair } = this.props

    if (preProps.scope !== this.props.scope) {
      this.fetchSessionList()
    }

    //mark
    if (this.state.activeSession.id != preState.activeSession.id
      || (this.scroll
        && messages.get(this.state.activeSession.id, fromJS({ messages: [] })).get('messages', List()).size
          != preProps.messages.get(this.state.activeSession.id, fromJS({ messages: [] })).get('messages', List()).size
        )
      ) {
      this.refs.chatWindow && this.refs.chatWindow.handleScrollToBottom()
      this.scroll = false
    }

    //拉取消息, 判断是否要去查询消息
    if (this.state.activeSession.id !== NONE_SESSION && !this.state.loadingMessages && this.props.user.get('id') && (!messages.get(this.state.activeSession.id))) {
      this.queryMessages(affair, this.props, this.state.activeSession.id)
    }
  },

  //标记消息为已读
  markMessage(aid, rid, frRid, frUid) {
    const chat = { type: Constants.CHAT_TYPE.GROUP, sub: 0, aid: parseInt(aid), rid: rid, frRid: frRid, frUid: frUid }

    sendMessage(Constants.MSG_TYPE.MARK_READ_TIME, chat, () => {})
  },

  //获取会话列表
  fetchSessionList() {
    const { isOfficial, scope, affair, announcementId } = this.props

    if (isOfficial) {
      // 官方获得讨论组列表
      fetch(config.api.announcement.chat.groupList(announcementId, scope), {
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        method: 'GET',
        credentials: 'include'
      }).then((res) => res.json()).then((res) => {
        if (res.code === 0) {
          this.setState({
            sessionList: List(res.data),
            activeSession: res.data.length ? res.data[0] : { id: NONE_SESSION }
          })
        }
      })
    } else {
      //客方直接获得对应的讨论组id，在讨论组中的权限，以及该角色的主事务id
      fetch(config.api.announcement.chat.guestGroupList(announcementId, affair.get('allianceId')), {
        method: 'GET',
        credentials: 'include',
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
      }).then((res) => res.json()).then((res) => {
        if (res.code === 0) {
          this.setState({
            sessionList: List(res.data),
            activeSession: res.data.length ? res.data[0] : { id: NONE_SESSION }
          })
        }
      })

      //获取客方在这条公告中的状态（权限和该角色的主事务）
      fetch(config.api.announcement.chat.guestInfo(announcementId), {
        method: 'GET',
        credentials: 'include',
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
      }).then((res) => res.json()).then((res) => {
        if (res.code === 0) {
          this.setState({
            guestInfo: res.data
          })
        }
      })
    }
  },

  //查询讨论组消息
  queryMessages(affair, props, groupId) {
    if (this.state.loadingMessages) return

    //如果是官方需要查询所有客方的消息,并且只查询一次(通过判断messages中是否已经有消息判断)
    this.setState({ loadingMessages: true })
    const chat = { type: Constants.CHAT_TYPE.GROUP, sub: 0, aid: parseInt(affair.get('id')), rid: groupId, frRid: affair.get('roleId'), frUid: props.user.get('id') }

    sendMessage(Constants.MSG_TYPE.ROOM_MSG_QUERY, chat, (c2c) => {
      if (!c2c.data) return
      setTimeout(() => this.setState({ loadingMessages: false }), 1000)//1s 内不会重复查询
      const data = JSON.parse(c2c.data)
      props.addGroupMessages(c2c.msgList || [], groupId)
      props.updateGroupUnreadCount(data.count, groupId)
    })
  },

  /* scroll listener */
  handleScroll() {
    return
    // const { affair, user, addGroupMessages } = this.props
    //
    // if (this.state.loadingMessages) return
    //
    // this.setState({ loadingMessages: true })
    // const chat = { type: Constants.CHAT_TYPE.GROUP, sub: 0, aid: parseInt(affair.get('id')), rid: groupId, frRid: affair.get('roleId'), frUid: user.get('id') }
    //
    // return new Promise((resolve) => sendMessage(Constants.MSG_TYPE.ROOM_MSG_QUERY, chat, (c2c) => {
    //   this.setState({ loadingMessages: false })
    //   if (c2c.msgList) {
    //     addGroupMessages(c2c.msgList, groupId)
    //   } else {
    //     resolve()
    //   }
    // }, { limit: 100, endTime: time }))
  },

  /* message send */
  handleSendMessage(content, subType = Constants.CHAT_SUBTYPE.DEFAULT, send = true) {
    const { affair, user, pushGroupMessage, currentRole, updateGroupUnreadCount } = this.props
    const chat = {
      type: Constants.CHAT_TYPE.GROUP,
      sub: subType,
      aid: parseInt(affair.get('id')),
      rid: this.state.activeSession.id,
      frRid: affair.get('roleId'),
      frUid: user.get('id'),
      name: currentRole.get('roleName') + '－' + currentRole.get('allianceName'),
      content: content,
      time: Date.now()
    }

    //消息的sub不同时进行不同的操作
    if (Constants.CHAT_SUBTYPE.IMAGE) chat.onLoad = true // 图片加载
    switch (subType) {
      case Constants.CHAT_SUBTYPE.IMAGE:
      case Constants.CHAT_SUBTYPE.DEFAULT:
      case Constants.CHAT_SUBTYPE.FUND:
      case Constants.CHAT_SUBTYPE.TRADE:
        send && sendMessage(Constants.MSG_TYPE.MSG, chat, () => {
        })
        break
      case Constants.CHAT_SUBTYPE.FILE:
        if (send) {
          sendMessage(Constants.MSG_TYPE.MSG, chat, () => {
            return
          })
          return
        } else {
          chat.file = content
          chat.content = null
        }
        break
      case Constants.CHAT_SUBTYPE.MEETING_INVITATION:
        if (send) {
          sendMessage(Constants.MSG_TYPE.MSG, chat, () => {
            return
          })
        }
        break
      default:
        break
    }

    const messages = this.props.messages.getIn([this.state.activeSession.id, 'messages'], List())
    chat.index = messages.get(messages.size - 1, { index: -1 }).index + 1
    this.scroll = true
    setTimeout(() => {
      pushGroupMessage(chat, this.state.activeSession.id)
      updateGroupUnreadCount(0, this.state.activeSession.id)
    }, 0)
  },

  //活跃会话改变，标记新会话为已读
  handleSessionChange(session) {
    const { affair, user, updateGroupUnreadCount, messages } = this.props

    this.setState({
      activeSession: session
    })

    this.markMessage(affair.get('id'), session.id, affair.get('roleId'), user.get('id'))
    messages.get(session.id) && updateGroupUnreadCount(0, session.id)
  },

  //将会话列表按照最后一条消息时间排序，优先使用store中的的数据，其次是sessionList
  sortSessionList(sessionList) {
    const { messages } = this.props

    return sessionList.sort((a, b) => {
      const messagesA = messages.get(a.id), messagesB = messages.get(b.id)

      if (messagesA && messagesB) {
        //两个会话都获取过消息,比较最后一条消息的时间
        const messageA = messages.getIn([a.id, 'messages']), messageB = messages.getIn([b.id, 'messages'])
        return messageB.get(messageB.size - 1, { time: 0 }).time - messageA.get(messageA.size - 1, { time: 0 }).time
      } else if (messagesA && !messagesB) {
        const messageA = messages.getIn([a.id, 'messages'])
        return ((b.lastMessage && b.lastMessage.timeOfLastMessage) || 0) - messageA.get(messageA.size - 1, { time: 0 }).time
      } else if (!messagesA && messagesB) {
        const messageB = messages.getIn([b.id, 'messages'])
        return messageB.get(messageB.size - 1, { time: 0 }).time - ((a.lastMessage && a.lastMessage.timeOfLastMessage) || 0)
      } else {
        return ((b.lastMessage && b.lastMessage.timeOfLastMessage) || 0) - ((a.lastMessage && a.lastMessage.timeOfLastMessage) || 0)
      }
    })
  },

  //创建讨论组后加入sessionList
  handleCreateGroup(session) {
    this.setState({
      sessionList: this.state.sessionList.push(session)
    })
  },


  //改变讨论组名称
  handleEditGroupName(groupId, groupName) {
    this.setState({
      sessionList: this.state.sessionList.update(this.state.sessionList.findIndex((v) => v.id === groupId), (v) => {v.name = groupName; return v})
    })
  },

  //退出讨论组，在会话列表中删除
  handleExitGroup(groupId) {
    this.setState({
      sessionList: this.state.sessionList.delete(this.state.sessionList.findIndex((v) => v.id === groupId))
    })
  },

  //渲染会话列表中最后一条消息，优先使用store中messages
  renderLastMessage(session) {
    const { messages } = this.props
    let lastMessage = null

    if (messages.get(session.id)) {
      const chatMessages = messages.getIn([session.id, 'messages'])
      lastMessage = chatMessages.size ? chatMessages.get(chatMessages.size - 1) : null
    } else {
      lastMessage = session.lastMessage && {
        sub: session.lastMessage.messageType,
        content: session.lastMessage.lastMessage,
        name: session.lastMessage.nameOfMessageSender
      }
    }

    return lastMessage ? `${lastMessage.name}：${this.renderMessageContent(lastMessage)}` : null
  },

  //渲染最后一条消息的内容，文字直接显示，图片、文件等其他显示符号
  renderMessageContent(message) {
    if (message.sub === Constants.CHAT_SUBTYPE.DEFAULT) {
      return message.content
    } else {
      return `[${Constants.SUBTYPE_STRING[message.sub]}]`
    }
  },

  render() {
    const { isOfficial, affair, scope, messages, user, announcementId, officials, guests, style } = this.props
    const { sessionList, activeSession, guestInfo, sessionListOpen } = this.state

    if ((!activeSession || !sessionList.size) && isOfficial) return <div /> //是官方视角且无有效会话

    const chatMessages = messages && messages.getIn([activeSession.id, 'messages'])

    return (
      <div className={styles.container} style={style}>
        <div className={styles.chatContainer}>
          {/* 官方有会话列表和创建讨论组 */}
          <div className={styles.fakeLeft} />
          <div className={styles.chatRight}>
            <ChatWindow userId={user.get('id')}
              affairId={parseInt(affair.get('id'))}
              affair={this.props.affair}
              chatMessages={chatMessages || List()}
              onSend={this.handleSendMessage}
              onScrollToTop={(callback) => chatMessages && chatMessages.get(0) && this.handleScroll(chatMessages.get(0).rid, chatMessages.get(0).time, callback)}
              title={isOfficial ? activeSession.name : (activeSession.targetId === 0 ? activeSession.name : '发布官方')}
              scope={scope}
              groupId={activeSession.id}
              isOfficial={isOfficial}
              scrollSession={this.props.scrollSession}
              updateScroll={this.props.updateScroll}
              guestInfo={guestInfo}
              announcementId={announcementId}
              guests={guests}
              officials={officials}
              isNewGroup={activeSession.targetId === 0}
              editGroupName={this.handleEditGroupName}
              exitGroup={this.handleExitGroup}
              enterConference={this.props.enterConference}
              ref="chatWindow"
            />
          </div>
        </div>
        <div className={classnames(styles.chatLeft, sessionListOpen ? styles.open : null)}>
          <div className={styles.fold}>
            <span onClick={() => this.setState({ sessionListOpen: !sessionListOpen })}><Dehaze/></span>
          </div>
          <div style={{ height: '100%', overflowX: 'hidden', overflowY: 'auto' }}>
            {this.sortSessionList(sessionList).map((session, index) => {
              return (
                <div key={index} onClick={() => this.handleSessionChange(session)} className={classnames(styles.session, session.id === activeSession.id ? styles.active : null)}>
                  <Badge dot={!!(messages.get(session.id) ? messages.getIn([session.id, 'unread']) : session.unreadCount)} className={styles.badge}>
                    <div className={styles.avatar}>
                      {/*targetId为0代表为手动创建的讨论组*/}
                      {session.targetId === 0 ?
                        <div className={styles.groupIcon}><ChatGroupIcon /></div>
                      :
                        <img src={session.avatar} />
                      }
                    </div>
                  </Badge>

                  {
                    this.state.sessionListOpen ? (
                      <div className={styles.content}>
                        <span className={styles.name}>
                          {isOfficial ? session.name : (session.targetId === 0 ? session.name : '发布官方')}
                        </span>
                      </div>
                    ) : null
                  }
                </div>
              )
            })}
          </div>
          {isOfficial ?
            <div className={styles.create}>
              <Tooltip title="创建讨论组" position="top">
                <Button type="dashed" onClick={() => {this.setState({ groupModalVisible: true })}}>+</Button>
              </Tooltip>
              <span className={styles.createText}>创建讨论组</span>
            </div>
          : null
          }
        </div>

        {this.state.groupModalVisible ?
          <GroupModal
            onCancel={() => this.setState({ groupModalVisible: false })}
            type={GROUP_MODAL_TYPE.CREATE}
            visible={this.state.groupModalVisible}
            guests={guests}
            officials={officials}
            roleId={affair.get('roleId')}
            affairId={affair.get('id')}
            scope={scope}
            announcementId={announcementId}
            onOk={this.handleCreateGroup}
          /> : null
        }
      </div>
    )
  }
})

function mapStateToProps(state, props) {
  const user = state.get('user')
  //当前角色所在的盟id
  const currentRole = user.get('roles').find((v) => v.get('roleId') === props.affair.get('roleId'))

  return {
    user,
    messages: state.getIn(['message', 'group']),
    currentRole,
    scrollSession: state.getIn(['message', 'scrollSession']) //滚动状态
  }
}

function mapDispatchToProps(dispatch) {
  return {
    addGroupMessages: bindActionCreators(addGroupMessages, dispatch),
    updateGroupUnreadCount: bindActionCreators(updateGroupUnreadCount, dispatch),
    pushGroupMessage: bindActionCreators(pushGroupMessage, dispatch),
    updateAnnouncementAllianceInfo: bindActionCreators(updateAnnouncementAllianceInfo, dispatch),
    updateScroll: bindActionCreators(updateScroll, dispatch),
    enterConference: bindActionCreators(enterConference, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(AnnouncementChat)
