import React from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { bindActionCreators } from 'redux'
import { List, Map } from 'immutable'
import { Modal } from 'antd'

import { getAffairRoles } from '../../actions/affair'
import { fetchRecentChats, fetchAffairChatGroups, openRecentChat, createRecentChat, addRecentChat, addMessage, receiveMessage, loadMoreMessage, updateGroupName, removeChatGroup, updateFileMessage, deleteFileMessage } from '../../actions/message'
import { enterConference } from '../../actions/conference'

import styles from './AffairChatContainer.scss'
import AffairChatGroupPanel from './AffairChatGroupPanel'
import GroupMembersPanel from './GroupMembersPanel'
import AffairChatWindow from './AffairChatWindow'
import GroupSettingModal from './GroupSettingModal'
import ChatRecordPanel from './ChatRecordPanel'
import config from '../../config'
import { MESSAGE_INIT_LIMIT, CHAT_TYPE, MESSAGE_LOAD_COUNT } from 'chat-contants'

const Client = window.SocketClient
const Constants = Client.Constants

const LIMIT = MESSAGE_INIT_LIMIT

class AffairChatContainer extends React.Component {

  static defaultProps = {
    user: {},
    affair: {}, // 当前事务
    affairRoles: {}, // 当前事务相关的角色，用于会话中的通讯录列表
  }

  static propTypes = {
    user: React.PropTypes.object.isRequired,
    affair: React.PropTypes.object.isRequired,
    affairRoles: React.PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)
    this.fetchAffairRoles(props.affair)
    this.fetchRecentChats(props.affair)
    this.addListeners()
  }

  state = {
    members: {}, // 选中会话的成员列表,
    settingModalVisible: false, // 设置讨论组
    membersVisible: false,
    chatRecordPanelVisible: false
  }

  componentDidMount() {

  }

  componentWillReceiveProps(nextProps) {    
    const { affair } = nextProps

    if ((affair.get('id') !== this.props.affair.get('id')) || (affair.get('roleId') !== this.props.affair.get('roleId'))){
      this.fetchAffairRoles(affair)
      
      if (!nextProps.isFetchingRecentChat) {
        this.fetchRecentChats(affair)
      }
    } else if (!nextProps.isFetchingRecentChat) {
      const { chatRole, selectedChatKey } = nextProps
      
      if (chatRole && nextProps.recentChats) {
        const chat = nextProps.recentChats.find((c) => c.get('_key') === selectedChatKey)
        if (!chat || !chat.get('toUserInfo') || chat.get('toUserInfo').toRoleId !== chatRole.roleId) {          
          
          this.handleStartSingleChat(chatRole)
        }
      } else {
        // 默认打开第一个讨论组
        if (nextProps.recentChats && nextProps.recentChats.size > 0 && nextProps.selectedChatKey === '') {
          
          this.handleSelectRecentChat(nextProps.recentChats.get(0))
        }
      }
    }
  }

  componentWillUnmount() {
    this.removeListeners()
  }

  addListeners = () => {
    Client.addHandler('MSG', this.receiveMessageListener)
  }

  removeListeners = () => {
    Client.removeHandler('MSG', this.receiveMessageListener)
  }

  receiveMessageListener = (message) => {
    const { recentChats, affair } = this.props    

    if (message.fromRoleId === affair.get('roleId')) {
      return
    }

    if (message.affairId !== parseInt(affair.get('id'))) {
      return
    }
    
    // console.log(message)
    
    if (message.type === CHAT_TYPE.SINGLE) {
      if (recentChats.find((c) => c.get('_key') === message._key)) {
        this.props.receiveMessage(message)
      } else {
        // 消息不在最近会话列表内, 开启单聊
        // 根据消息体中的 toRoleId, 找到 role 对象创建相关的会话对象，加入到最近会话中
        if (message.toRoleId === affair.get('roleId')) {
          this.createRecentChatByRoleId(message.fromRoleId, message)
        }        
        // this.props.createRecentChat(newRecentChat)
      }
    } else {
      this.groupMessageListener(message)
    }
  }

  groupMessageListener = (message) => {
    const { recentChats, affair } = this.props
    const affairId = affair.get('id')
    const roleId = affair.get('roleId')
    const groupMessageType = Constants.CHAT_SUBTYPE.GROUP
    const isInRecentChat = recentChats.find((c) => c.get('_key') === message._key) ? true : false
    let content

    switch (message.sub) {
      
      case groupMessageType.CREATE:
        // 创建讨论组的系统通知,更新群聊列表
        this.props.fetchAffairChatGroups(affairId, roleId)
        break

      case groupMessageType.INVITATION:
        // 邀请讨论组成员, 两种视角

        // 已经在讨论组中的成员视角：
        // 该消息的讨论组已存在最近会话列表：直接添加至最近会话的消息列表
        // 该消息的讨论组不在最近会话列表中：根据消息体中的 groupId 和 group 信息构造最近会话对象，加入至最近会话列表的 redux 中

        // 不在讨论组中的成员：
        // 更新群聊列表，根据消息体中的 groupId 和 group 信息构造最近会话对象，加入至最近会话列表中
        content = JSON.parse(message.content)

        if (content.inviteeRoleId === roleId) {
          this.props.fetchAffairChatGroups(affairId, roleId)
          // const newRecentChat = this.createRecentChatByGroupId(message.groupId, message)
          // this.props.createRecentChat(newRecentChat)
        } else {
          // 更新群聊，异步性，加入最近会话未做
          if (isInRecentChat) {
            this.props.receiveMessage(message)
          } else {
            const newRecentChat = this.createRecentChatByGroupId(message.groupId, message)
            this.props.createRecentChat(newRecentChat)
          }
        }
        break
      case groupMessageType.REMOVE:
        // 移除讨论组成员，两种视角
        // 被移除的成员视角：
        // 该消息的讨论组已存在最近会话列表：分是否是当前选中会话，移除 redux 中的最近会话，并更新群聊
        // 该消息的讨论组不在最近会话列表中：更新群聊

        // 仍在讨论组中的成员视角：
        // 该消息的讨论组已存在最近会话列表：直接添加至最近会话的消息列表
        // 该消息的讨论组不在最近会话列表中：根据消息体中的 groupId 和 group 信息构造最近会话对象，加入至最近会话列表的 redux 中

        content = JSON.parse(message.content)

        if (content.removeeRoleId === roleId) {
          if (isInRecentChat) {
            this.props.removeChatGroup({ key: message._key, groupId: message.groupId })
          } else {
            this.props.fetchAffairChatGroups(affairId, roleId)
          }
        } else {
          if (isInRecentChat) {
            this.props.receiveMessage(message)
          } else {
            const newRecentChat = this.createRecentChatByGroupId(message.groupId, message)
            this.props.createRecentChat(newRecentChat)
          }
        }
        break
      case groupMessageType.EXIT:
        // 退出讨论组，两种视角

        // 仍在讨论组中的成员视角：
        // 该消息的讨论组已存在最近会话列表：直接添加至最近会话的消息列表
        // 该消息的讨论组不在最近会话列表中：根据消息体中的 groupId 和 group 信息构造最近会话对象，加入至最近会话列表的 redux 中

        // 退出的成员视角：
        // 操作已在退出的回调后触发，这里暂时不需要

        content = JSON.parse(message.content)

        if (content.roleId !== roleId) {
          if (isInRecentChat) {
            this.props.receiveMessage(message)
          } else {
            const newRecentChat = this.createRecentChatByGroupId(message.groupId, message)
            this.props.createRecentChat(newRecentChat)
          }
        }

        break
      case groupMessageType.DISMISS:
        // 解散讨论组
      
        // 删除最近会话中的对象，删除被解散讨论组
        this.props.removeChatGroup({ key: message._key, groupId: message.groupId })

        break
      default:
        if (isInRecentChat) {
          this.props.receiveMessage(message)
        } else {
          // 消息不在最近会话列表内
          // 根据消息体中的 groupId, 找到 group 对象创建相关的会话对象，加入到最近会话中
          const newRecentChat = this.createRecentChatByGroupId(message.groupId, message)          
          this.props.createRecentChat(newRecentChat)
        }
        break
    }
  }

  createRecentChatByRoleId = (roleId, message) => {
    const { affairRoles } = this.props
    const { roles, allianceRoles, guestRoles } = affairRoles
    const allRoles = roles.concat(allianceRoles, guestRoles)
    let role = allRoles.find((r) => r.roleId === roleId)
    if (role) {
      let chat = Map(this.createChatData(role))
      chat = chat.set('msgList', List([message]))
                .set('_key', message._key)
                .set('unreadCount', 1)
                .set('lastMsg', message)
      this.props.createRecentChat(chat)
    } else {
      this.fetchRoleInfo(message.fromRoleId).then((res) => {
        role = res
        let chat = Map(this.createChatData(role))
        chat = chat.set('msgList', List([message]))
                  .set('_key', message._key)
                  .set('unreadCount', 1)
                  .set('lastMsg', message)
        this.props.createRecentChat(chat)
      })
    }
  }

  createRecentChatByGroupId = (groupId, message) => {
    const { affairChatGroups } = this.props
    const group = affairChatGroups.find((g) => g.id === groupId)
    let chat = Map(this.createChatData(group, true))
    chat = chat.set('msgList', List([message]))
              .set('_key', message._key)
              .set('unreadCount', 1)
              .set('lastMsg', message)
    return chat
  }

  fetchAffairRoles = (affair) => {
    if (affair) {
      this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true)
    }
  }

  fetchRecentChats = (affair) => {
    if (affair) {
      this.props.fetchRecentChats(affair.get('id'), affair.get('roleId'), true)
    }
  }

  // socket 发送消息
  handleSendMessage = (content, subType = Constants.CHAT_SUBTYPE.DEFAULT, apns = []) => {
    const { selectedChatKey, recentChats } = this.props
    const selectedChat = recentChats.find((c) => c.get('_key') === selectedChatKey)

    if (selectedChat.get('type') === CHAT_TYPE.GROUP) {
      this.sendGroupMessage(selectedChat.get('groupInfo'), content, subType, apns)
    } else {
      this.sendPrivateMessage(selectedChat.get('toUserInfo'), content, subType)
    }
  }

  sendGroupMessage = (group, content, subType, apns) => {
    const { affair, user } = this.props

    const currentRole = user.toJS().roles.find((r) => r.roleId === affair.get('roleId'))
    
    const params = {
      type: CHAT_TYPE.GROUP,
      affairId: affair.get('id'),
      fromRoleId: affair.get('roleId'),
      groupId: group.groupId,
      sub: subType,
      name: currentRole.roleName + '-' + user.get('username'),
      apns: apns,
      fromUserId: user.get('id')
    }

    params.content = content
    
    Client.groupChatService.sendGroupMsg(params, (success) => {
      success.fromUserId = user.get('id')
      this.props.addMessage(success)
    })
  }

  sendPrivateMessage = (toUser, content, subType) => {
    const { affair, user } = this.props
    const currentRole = user.toJS().roles.find((r) => r.roleId === affair.get('roleId'))

    const params = {
      type: CHAT_TYPE.SINGLE,
      fromRoleId: affair.get('roleId'),
      affairId: affair.get('id'),
      toUserId: toUser.toUserId,
      toRoleId: toUser.toRoleId,
      sub: subType,
      name: currentRole.roleName + '-' + user.get('username'),      
      fromUserId: user.get('id')
    }

    params.content = content

    Client.privateChatService.sendPrivateChatMsg(params, (success) => {
      success.fromUserId = user.get('id')
      this.props.addMessage(success)
    })
    
  }


  // 创建文件消息
  initFileMessage = (file, subType) => {
    const { affair, user, selectedChatKey, recentChats } = this.props
    const selectedChat = recentChats.find((c) => c.get('_key') === selectedChatKey)
    const currentRole = user.toJS().roles.find((r) => r.roleId === affair.get('roleId'))

    let message = null
    if (selectedChat.get('type') === CHAT_TYPE.GROUP) {
      const group = selectedChat.get('groupInfo')
      const params = {
        type: CHAT_TYPE.GROUP,
        fromRoleId: affair.get('roleId'),
        groupId: group.groupId,
        sub: subType,
        name: currentRole.roleName + '-' + user.get('username'),
        apns: [],
        fromUserId: user.get('id')
      }
      message = Object.assign({ file, _key: selectedChatKey }, params)
      message['callback'] = (content) => {
        const index = this.props.recentChats.find((c) => c.get('_key') === selectedChatKey).get('msgList').indexOf(message)
        
        Client.groupChatService.sendGroupMsg(Object.assign({ content }, params), (success) => {
          success.fromUserId = params.fromUserId
          this.props.updateFileMessage({ message: success, index, key: selectedChatKey })
        })
      }
      message['cancel'] = () => {
        const index = this.props.recentChats.find((c) => c.get('_key') === selectedChatKey).get('msgList').indexOf(message)
        this.props.deleteFileMessage({ index, key: selectedChatKey })
      }
    } else {
      const toUser = selectedChat.get('toUserInfo')
      const params = {
        type: CHAT_TYPE.SINGLE,
        fromRoleId: affair.get('roleId'),
        affairId: affair.get('id'),
        toUserId: toUser.toUserId,
        toRoleId: toUser.toRoleId,
        sub: subType,
        name: currentRole.roleName + '-' + user.get('username'),
        fromUserId: user.get('id')
      }
      message = Object.assign({ file, _key: selectedChatKey }, params)
      message['callback'] = (content) => {
        const index = this.props.recentChats.find((c) => c.get('_key') === selectedChatKey).get('msgList').indexOf(message)
        Client.privateChatService.sendPrivateChatMsg(Object.assign({ content }, params), (success) => {
          success.fromUserId = params.fromUserId
          this.props.updateFileMessage({ message: success, index, key: selectedChatKey })
        })
      }

      message['cancel'] = () => {
        const index = this.props.recentChats.find((c) => c.get('_key') === selectedChatKey).get('msgList').indexOf(message)
        this.props.deleteFileMessage({ index, key: selectedChatKey })
      }
    }

    this.props.addMessage(message)
  }

  // 下滑加载更多消息
  handleLoadMoreMessage = () => {
    const { affair, recentChats, selectedChatKey } = this.props
    let selectedChat = recentChats.find((c) => c.get('_key') === selectedChatKey)
    let params = null    
    let endTime = selectedChat.getIn(['msgList', 0]) ? selectedChat.getIn(['msgList', 0]).time : null
    return new Promise((resolve) => {
      if (selectedChat.get('type') === CHAT_TYPE.GROUP) {
        
        params = {
          groupId: selectedChat.get('groupInfo').groupId,
          roleId: affair.get('roleId'),
          limit: MESSAGE_LOAD_COUNT,
          endTime: endTime
        }
        
        Client.groupChatService.loadGroupMsg(params, (success) => {
          this.props.loadMoreMessage({
            key: selectedChatKey,
            msgList: success.msgList
          })
          resolve()
        })
      } else {
        params = {
          roleId: affair.get('roleId'),
          affairId: affair.get('id'),
          toRoleId: selectedChat.get('toUserInfo').toRoleId,
          limit: MESSAGE_LOAD_COUNT,
          endTime: endTime
        }
        
        Client.privateChatService.loadPrivateChatMsg(params, (success) => {
          this.props.loadMoreMessage({
            key: selectedChatKey,
            msgList: success.msgList
          })
          resolve()
        })
      }
    })
  }

  showMembers = () => {
    const { selectedChatKey, recentChats } = this.props
    const selectedChat = recentChats && recentChats.find((c) => c.get('_key') === selectedChatKey)
    this.fetchMemberList(selectedChat.get('groupInfo').groupId, () => {
      this.setState({ membersVisible: true })
    })
  }

  fetchMemberList = (id, callback = () => {}) => {
    fetch(config.api.chat.memberList(id), {
      method: 'GET',
      credentials: 'include',
    }).then((res) => {
      return res.json()
    }).then((res) => {
      if (res.code === 0) {
        const members = res.data
        this.setState({
          members: members
        }, callback)
      }
    })
  }

  fetchRoleInfo = (roleId) => {
    const { affair } = this.props
    return new Promise((resolve) => {
      fetch(config.api.user.roleInfo, {
        method: 'GET',
        credentials: 'include',
        affairId: affair.get('id'),
        roleId: roleId
      }).then((res) => {
        return res.json()
      }).then((res) => {
        if (res.code === 0) {
          const role = res.data
          role.roleTitle = role.roleName
          role.roleId = roleId
          resolve(role)
        }
      })
    })
  }

  getCurrentMembers = (members) => {
    const { selectedChatKey, recentChats, user, affair } = this.props
    const selectedChat = recentChats && recentChats.find((c) => c.get('_key') === selectedChatKey)
    let currentMembers = []
    if (selectedChatKey) {
      if ((selectedChat.get('type') === CHAT_TYPE.GROUP) && members.roles) {
        currentMembers = members.roles.concat(...members.groups.map((g) => g.members))
      } else if (selectedChat.get('type') === CHAT_TYPE.SINGLE) {
        const toUser = selectedChat.get('toUserInfo')
        const role = user.toJS().roles.find((r) => r.roleId === affair.get('roleId'))
        currentMembers = [
          {
            id: role.roleId,
            avatar: user.get('avatar'),
            roleId: role.roleId,
            roleTitle: role.roleName,
            userId: user.get('id'),
            username: user.get('username')
          },
          {
            id: toUser.toRoleId,
            avatar: toUser.avatar,
            roleId: toUser.toRoleId,
            name: toUser.name,
            roleTitle: toUser.name.split('-')[0],
            userId: toUser.toUserId,
            username: toUser.name.split('-')[1]
          }
        ]
      }
    }

    return List(currentMembers)
  }

  openGroupChat = (id) => {
    const { affair } = this.props
    const params = {
      groupId: id,
      roleId: affair.get('roleId'),
      limit: LIMIT
    }
    return new Promise((resolve, reject) => {
      Client.groupChatService.openGroupChat(params, (success) => {
        resolve(success)
      }, (fail) => {
        reject(fail)
      })
    })
  }

  openPrivateChat = (roleId) => {
    const { affair } = this.props
    const params = {
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      toRoleId: roleId,
      limit: LIMIT
    }
    return new Promise((resolve, reject) => {
      Client.privateChatService.openPrivateChat(params, (success) => {
        resolve(success)
      }, (fail) => {
        reject(fail)
      })
    })
  }

  // 构造会话列表
  createChatData = (chat, isGroup = false) => {
    if (isGroup) {
      return {
        type: CHAT_TYPE.GROUP,
        groupInfo: {
          groupId: chat.id,
          name: chat.name,
          avatar: chat.avatar
        }
      }
    } else {
      return {
        type: CHAT_TYPE.SINGLE,
        toUserInfo: {
          avatar: chat.avatar,
          name: chat.roleTitle + '-' + chat.username,
          toRoleId: chat.roleId,
          toUserId: chat.userId,
        }
      }
    }
  }

  // 开启群聊
  handleStartGroupChat = (group) => {
    const { recentChats } = this.props

    this.openGroupChat(group.id).then((success) => {
      let msgList = List(success.msgList)

      // 判断是否已经在最近会话中
      let chat = recentChats.filter((c) => c.get('type') === CHAT_TYPE.GROUP).find((c) => c.get('groupInfo').groupId === group.id)
      if (chat) {
        chat = chat.set('msgList', msgList)
                  .set('unreadCount', 0)
                  .set('lastMsg', msgList.size > 0 ? msgList.last() : {})
        this.props.openRecentChat(chat)
      } else {
        chat = Map(this.createChatData(group, true))
        chat = chat.set('msgList', msgList)
                  .set('_key', success.key)
                  .set('unreadCount', 0)
                  .set('lastMsg', msgList.size > 0 ? msgList.last() : {})
        this.props.addRecentChat(chat)
      }

      this.fetchMemberList(group.id)

    })
  }

  // 开启单聊
  handleStartSingleChat = (role) => {
    const { recentChats } = this.props
    this.openPrivateChat(role.roleId).then((success) => {

      let msgList = List(success.msgList)

      // 判断是否已经在最近会话中
      let chat = recentChats.filter((c) => c.get('type') === CHAT_TYPE.SINGLE).find((c) => c.get('toUserInfo').toRoleId === role.roleId)
      if (chat) {
        chat = chat.set('msgList', msgList)
                  .set('unreadCount', 0)
                  .set('lastMsg', msgList.size > 0 ? msgList.last() : {})
        this.props.openRecentChat(chat)
      } else {
        chat = Map(this.createChatData(role))
        chat = chat.set('msgList', msgList)
                  .set('_key', success.key)
                  .set('unreadCount', 0)
                  .set('lastMsg', msgList.size > 0 ? msgList.last() : {})
        this.props.addRecentChat(chat)
      }
    })
  }

  // 选择最近会话
  handleSelectRecentChat = (chat) => {

    if (chat.get('type') === CHAT_TYPE.GROUP) {
      this.openGroupChat(chat.get('groupInfo').groupId).then((success) => {
        let msgList = List(success.msgList)
        chat = chat.set('msgList', msgList).set('unreadCount', 0)
        this.props.openRecentChat(chat)
        this.fetchMemberList(chat.get('groupInfo').groupId)
      })
    } else {
      this.openPrivateChat(chat.get('toUserInfo').toRoleId).then((success) => {
        let msgList = List(success.msgList)
        chat = chat.set('msgList', msgList).set('unreadCount', 0)
        this.props.openRecentChat(chat)
      })
    }
  }

  // 设置讨论组
  handleEditGroup = (group) => {
    const { selectedChatKey } = this.props
    this.props.updateGroupName({
      key: selectedChatKey,
      name: group.name,
      groupId: group.id
    })
  }

  // 退出讨论组
  showConfirmQuitGroup = (group) => {
    const { affair, removeChatGroup, selectedChatKey } = this.props
    Modal.confirm({
      iconType: 'exclamation-circle',
      className: styles.affairChatConfrim,
      title: `确定退出讨论组“${group.name}”`,
      okText: '确定',
      cancelText: '取消',
      onOk() {
        
        fetch(config.api.chat.leaveGroup(), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          affairId: affair.get('id'),
          roleId: affair.get('roleId'),
          body: JSON.stringify({
            groupId: group.groupId,
          })
        }).then((res) => res.json()).then((res) => {
          if (res.code === 0) {
            removeChatGroup({ key: selectedChatKey, groupId: group.groupId, isSelected: true })
          }        
        })
      }
    })
  }

  // 解散讨论组
  showConfirmDisbandGroup = (group) => {
    const { affair, removeChatGroup, selectedChatKey } = this.props
    Modal.confirm({
      iconType: 'exclamation-circle',
      className: styles.affairChatConfrim,
      title: `确定解散讨论组“${group.name}”`,
      okText: '确定',
      cancelText: '取消',
      onOk() {
        fetch(config.api.chat.disbandGroup(), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          affairId: affair.get('id'),
          roleId: affair.get('roleId'),
          body: JSON.stringify({
            groupId: group.groupId,
          })
        }).then((res) => res.json()).then((res) => {
          if (res.code === 0) {
            removeChatGroup({ key: selectedChatKey, groupId: group.groupId, isSelected: true })
          }         
        })
      }
    })
  }

  // 讨论组内成员面板, 聊天文件面板, 聊天记录面板
  renderMembersPanel = (selectedChat) => {
    const { affair, affairRoles } = this.props
    const { members, membersVisible } = this.state
    return (
      <div 
        className={classNames(styles.panelContainer, { visible: membersVisible })}
      >
        <GroupMembersPanel
          affair={affair}
          affairRoles={affairRoles}
          group={selectedChat ? selectedChat.get('groupInfo') : {}}
          members={members}
          updateMembers={(data) => this.setState({ members: data })}
          close={() => this.setState({ membersVisible: false })}
        />  
      </div>
    )
  }

  renderChatRecordsPanel = (selectedChat) => {
    const { affair } = this.props
    const { members, chatRecordPanelVisible } = this.state
    
    let group = {
      key: selectedChat ? selectedChat.get('_key') : ''
    }
    return (
      <div 
        className={classNames(styles.panelContainer, { visible: chatRecordPanelVisible })}
      >
        <ChatRecordPanel
          isGroup
          affair={affair}
          group={group}
          visible
          members={this.getCurrentMembers(members)}
          close={() => this.setState({ chatRecordPanelVisible: false })}
        />  
      </div>
    )
  }



  render() {
    const { user, affair, affairRoles, recentChats, selectedChatKey } = this.props
    const { members, settingModalVisible } = this.state
    const selectedChat = (recentChats && recentChats.find((c) => c.get('_key') === selectedChatKey))
    const chatMessages = (selectedChat && selectedChat.get('msgList')) ? selectedChat.get('msgList') : List([])

    return (
      <div className={styles.container} ref={(c) => this.container = c}>
        <div className={styles.left}>
          <AffairChatGroupPanel
            affair={affair}
            affairRoles={affairRoles}
            recentChats={recentChats ? recentChats : List([])}
            selectedChat={selectedChat}
            startSingleChat={this.handleStartSingleChat}
            startGroupChat={this.handleStartGroupChat}
            selectRecentChat={this.handleSelectRecentChat}
          />
        </div>
        <div className={styles.right}>
          <AffairChatWindow
            userId={user.get('id')}
            affair={affair}
            selectedChat={selectedChat}
            selectedChatKey={selectedChatKey}
            members={this.getCurrentMembers(members)}
            onSend={this.handleSendMessage}
            chatMessages={chatMessages}
            loadMoreMessage={this.handleLoadMoreMessage}
            initFileMessage={this.initFileMessage}
            showMembers={this.showMembers}
            openChatRecordPanel={() => this.setState({ chatRecordPanelVisible: true })}
            openSettingModal={() => this.setState({ settingModalVisible: true })}
            openQuitModal={(group) => this.showConfirmQuitGroup(group)}
            openDisbandModal={(group) => this.showConfirmDisbandGroup(group)}
            enterConference={this.props.enterConference}
          />
          
          {this.renderMembersPanel(selectedChat)}
          {this.renderChatRecordsPanel(selectedChat)}

        </div>

        {settingModalVisible ?
          <GroupSettingModal
            onCancel={() => this.setState({ settingModalVisible: false })}
            visible={settingModalVisible}
            group={selectedChat ? selectedChat.get('groupInfo') : null}
            roleId={affair.get('roleId')}
            affairId={parseInt(affair.get('id'))}
            onOk={this.handleEditGroup}
          /> : null}
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  return {
    user: state.get('user'),
    affair: state.getIn(['affair', 'affairMap', props.params.id]),
    affairRoles: state.getIn(['affair', 'affairAttender', 'currentRoles', props.params.id]),
    isFetchingRecentChat: state.getIn(['message', 'affair', 'isFetchingRecentChat']),
    recentChats: state.getIn(['message', 'affair', 'recentChats']),
    affairChatGroups: state.getIn(['message', 'affair', 'affairChatGroups']),
    selectedChatKey: state.getIn(['message', 'affair', 'selectedChatKey']),
    chatRole: state.getIn(['message', 'affair', 'chatRole'])
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getAffairRoles: bindActionCreators(getAffairRoles, dispatch),
    fetchRecentChats: bindActionCreators(fetchRecentChats, dispatch),
    fetchAffairChatGroups: bindActionCreators(fetchAffairChatGroups, dispatch),
    openRecentChat: bindActionCreators(openRecentChat, dispatch),
    addRecentChat: bindActionCreators(addRecentChat, dispatch),
    createRecentChat: bindActionCreators(createRecentChat, dispatch),
    addMessage: bindActionCreators(addMessage, dispatch),
    receiveMessage: bindActionCreators(receiveMessage, dispatch),
    loadMoreMessage: bindActionCreators(loadMoreMessage, dispatch),
    updateGroupName: bindActionCreators(updateGroupName, dispatch),
    removeChatGroup: bindActionCreators(removeChatGroup, dispatch),
    updateFileMessage: bindActionCreators(updateFileMessage, dispatch),
    deleteFileMessage: bindActionCreators(deleteFileMessage, dispatch),
    enterConference: bindActionCreators(enterConference, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AffairChatContainer)

// const testSystemMessage = {
//   '_id': '5a65a71d073ea6298c5a7a0c',
//   'apns': [],
//   '_key': 'testId',
//   'fromUserId': 0,
//   'fromRoleId': 0,
//   'type': 3,
//   'sub': 51,
//   'time': 1516610564766.0,
//   'index': 8,
//   'content': JSON.stringify({
//     receiverRoleId: 1021404,
//     receiverUserId: 20209,
//     senderRoleId: 1021403,
//     senderUserId: 30207,
//     receiverName: 'test name'
//   }),
//   'groupId': 4
// }