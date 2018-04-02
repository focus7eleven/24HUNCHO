import React from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Input, Collapse, Button } from 'antd'
import { Motion, spring } from 'react-motion'
import emojione from 'emojione.js'

import { fetchAffairChatGroups } from '../../actions/message'
import styles from './AffairChatGroupPanel.scss'
import { RecentChatIcon, ContactsIcon } from 'svg'
import AffairChatGroupModal, { GROUP_MODAL_TYPE } from './AffairChatGroupModal'
import { relativeTime } from 'time'
import { CHAT_TYPE } from 'chat-contants'

const Panel = Collapse.Panel
// const Search = Input.Search
const Constants = window.SocketClient.Constants
const DEFAULT_AVATOR = 'http://superid-public.oss-cn-shanghai.aliyuncs.com/person_default.png'
const TAB_TYPE = {
  RECENT: 0,
  CONTACTS: 1,
}

class AffairChatGroupPanel extends React.Component {

  static defaultProps = {
    affair: {}, // 当前事务
    affairRoles: {}, // 事务相关角色
    recentChats: {}, // 最近会话列表
    selectedChat: null, // 选中的当前会话
    affairChatGroups: [], // 事务内群聊
  }

  static propTypes = {
    affair: React.PropTypes.object.isRequired,
    affairRoles: React.PropTypes.object.isRequired,
    recentChats: React.PropTypes.object.isRequired,
    selectedChat: React.PropTypes.object,
  }


  constructor(props) {
    super(props)
    this.fetchChatGroups(props.affair)
  }

  state = {
    tab: TAB_TYPE.RECENT, // 当前 tab
    keyword: '', // 搜索关键词
    createGroupModalVisible: false, // 显示创建讨论组 Modal
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.affair.get('id') !== this.props.affair.get('id')) {
      this.fetchChatGroups(nextProps.affair)
    }
  }

  fetchChatGroups = (affair) => {
    if (affair) {
      const affairId = affair.get('id')
      const roleId = affair.get('roleId')
      this.props.fetchAffairChatGroups(affairId, roleId)
    }
  }

  handleOpenGroupChat = (group) => {
    this.setState({
      tab: TAB_TYPE.RECENT
    })
    this.props.startGroupChat(group)
  }

  handleOpenSingleChat = (role) => {
    this.setState({
      tab: TAB_TYPE.RECENT
    })
    this.props.startSingleChat(role)
  }

  renderLastMessage = (message) => { 
    const { affair } = this.props
    const currentRoleId = affair.get('roleId')
    
    let apns, content
    switch (message.sub) {
      case Constants.CHAT_SUBTYPE.DEFAULT:
        apns = message.apns ? JSON.parse(message.apns) : []
        content = emojione.shortnameToUnicode(message.content)
        if (apns.length > 0 && apns.indexOf(currentRoleId) > -1) {
          return (
            <div className="mention-content">
              <span className="mention">[有人@我]</span>
              <span className="content">{content}</span>
            </div>
          )
        }
        return content
      case Constants.CHAT_SUBTYPE.FUND.SEND:
        return '[资金消息]'
      case Constants.CHAT_SUBTYPE.FUND.ACCEPT:
        return '[系统通知资金接收]'
      case Constants.CHAT_SUBTYPE.FUND.REJECT:
        return '[系统通知资金拒收]'
      case Constants.CHAT_SUBTYPE.FILE:
        return '[文件消息]'
      case Constants.CHAT_SUBTYPE.MATERIAL.SEND:
        return '[物资消息]'
      case Constants.CHAT_SUBTYPE.MATERIAL.ACCEPT:
        return '[系统通知物资接收]'
      case Constants.CHAT_SUBTYPE.MATERIAL.ACCEPT_MUTI:
        return '[系统通知物资批量接收]'
      case Constants.CHAT_SUBTYPE.MATERIAL.SENDBACK:
        return '[系统通知物资退回]'
      case Constants.CHAT_SUBTYPE.MATERIAL.ACCEPT_SENDBACK:
        return '[系统通知物资接收退回]'
      case Constants.CHAT_SUBTYPE.MATERIAL.REJECT_SENDBACK:
        return '[系统通知物资拒绝退回]'
      case Constants.CHAT_SUBTYPE.VIDEO.INVITATION:
        return '[视频邀请]'
      default:
        return ''
    }
  }

  renderRecentChats = (chats, keyword) => {
    const renderGroupChat = (chat) => {
      const group = chat.groupInfo
      const lastMsg = chat.lastMsg
      const unreadCount = chat.unreadCount
      return (
        <div className={styles.groupChat}>
          <div className={styles.avatar}>
            <img src={group.avatar ? group.avatar : DEFAULT_AVATOR} />
            {unreadCount > 0 ? <span className={classNames('unread', { 'more': unreadCount > 99 })}>{unreadCount > 99 ? '99+' : unreadCount}</span> : null}
          </div>
          <div className={styles.groupInfo}>
            <div className="name">{group.name}</div>
            <div className="last">{lastMsg ? this.renderLastMessage(lastMsg) : ''}</div>
          </div>
          <div className={styles.time}>
            {lastMsg.time ? relativeTime(lastMsg.time) : ''}
          </div>
        </div>
      )
    }

    const renderSingleChat = (chat) => {
      const user = chat.toUserInfo
      const lastMsg = chat.lastMsg
      const unreadCount = chat.unreadCount
      return (
        <div className={styles.singleChat}>
          <div className={styles.avatar}>
            <img src={user.avatar ? user.avatar : DEFAULT_AVATOR} />
            {unreadCount > 0 ? <span className={classNames('unread', { 'more': unreadCount > 99 })}>{unreadCount > 99 ? '99+' : unreadCount}</span> : null}
          </div>
          <div className={styles.userInfo}>
            <div className="name">{user.name}</div>
            <div className="last">{lastMsg ? this.renderLastMessage(lastMsg) : ''}</div>
          </div>
          <div className={styles.time}>
            {lastMsg.time ? relativeTime(lastMsg.time) : ''}
          </div>
        </div>
      )
    }

    const filterRecentChat = (chat) => {
      // const selected = selectedChat ? selectedChat.get('_key') === chat.get('_key') : false

      // if (selected) {
      //   return true
      // }

      let name, res
      if (chat.get('type') === CHAT_TYPE.GROUP) {
        name = chat.get('groupInfo').name
      } else {
        name = chat.get('toUserInfo').name
      }
      res = name.includes(keyword)
      return res
    }

    const { selectedChat } = this.props

    let filterChats

    if (keyword) {
      
      filterChats = chats.filter(filterRecentChat)
    } else {
      filterChats = chats
    }


    return (
      <ol className={styles.recentChats}>
        {filterChats.map((chat, k) => {
          
          
          const selected = selectedChat ? selectedChat.get('_key') === chat.get('_key') : false
          return (
            <li className={classNames(styles.recentChatItem, { selected })} key={k} onClick={() => this.props.selectRecentChat(chat)}>
              {chat.get('type') === CHAT_TYPE.GROUP ?
                renderGroupChat(chat.toJS()) : renderSingleChat(chat.toJS())
              }
            </li>
          )
        })}
      </ol>
    )
  }

  renderContactRoles = (affairRoles, keyword) => {
    if (!affairRoles) {
      return null
    }

    const { roles, allianceRoles, guestRoles } = affairRoles
    const { affairChatGroups, affair } = this.props
    
    const filterChatGroup = (group) => {
      return group.name.includes(keyword)
    }

    let filterChatGroups

    if (keyword) {
      filterChatGroups = affairChatGroups.filter(filterChatGroup)
    } else {
      filterChatGroups = affairChatGroups
    }

    const currentRoleId = affair.get('roleId')
    const filterAffairRoles = roles ? roles.filter((a) => a.roleId !== currentRoleId).filter((a) => a.state === 0) : []
    const filterAllianceRoles = allianceRoles ? allianceRoles.filter((a) => a.state === 0) : []
    const filterGuestRoles = guestRoles ? guestRoles.filter((a) => a.state === 0) : []

    const renderRole = (role, k) => {
      let roleName = role.roleTitle + '-' + role.username
      if (!roleName.includes(keyword)) {
        return null
      }
      return (
        <li className={styles.memberItem} key={k} onClick={() => this.handleOpenSingleChat(role)}>
          <div className={styles.avatar}>
            <img src={role.avatar ? role.avatar : DEFAULT_AVATOR} />
          </div>
          <div className={styles.userName}>
            {roleName}
          </div>
        </li>
      )
    }

    return (
      <div className={styles.contactsRoles}>
        <Collapse bordered={false} defaultActiveKey={['0']}>
          {filterChatGroups ?
            <Panel header={`群聊（${filterChatGroups.size}）`} key="0">
              <ol className={styles.groupMemberList}>
                {filterChatGroups.map((group, k) => {
                  return (
                    <li className={styles.memberItem} key={k} onClick={() => this.handleOpenGroupChat(group)}>
                      <div className={styles.avatar}>
                        <img src={group.avatar ? group.avatar : DEFAULT_AVATOR} />
                      </div>
                      <div className={styles.userName}>
                        {group.name}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </Panel> : null
          }
          {filterAffairRoles ?
            <Panel header={`本事务角色（${filterAffairRoles.length}）`} key="1">
              <ol className={styles.groupMemberList}>
                {filterAffairRoles.filter((v) => v.state === 0).map(renderRole)}
              </ol>
            </Panel> : null
          }
          {allianceRoles ?
            <Panel header={`盟内角色（${filterAllianceRoles.length}）`} key="2">
              <ol className={styles.groupMemberList}>
                {filterAllianceRoles.map(renderRole)}
              </ol>
            </Panel> : null
          }
          {guestRoles ?
            <Panel header={`盟外角色（${filterGuestRoles.length}）`} key="3">
              <ol className={styles.groupMemberList}>
                {filterGuestRoles.map(renderRole)}
              </ol>
            </Panel> : null
          }
        </Collapse>
      </div>
    )
  }

  render() {
    const { affair, affairRoles, recentChats } = this.props
    const { tab, createGroupModalVisible, keyword } = this.state
    

    return (
      <div className={styles.panel}>
        <div className={styles.tabs}>
          <div
            className={classNames({
              [styles.recentChatsTab]: true,
              'selected': (tab === TAB_TYPE.RECENT)
            })}
            onClick={() => this.setState({ tab: TAB_TYPE.RECENT })}
          >
            <RecentChatIcon />
            <span className="text">最近会话</span>
          </div>
          <div className="split-line" />
          <div
            className={classNames({
              [styles.contactsTab]: true,
              'selected': (tab === TAB_TYPE.CONTACTS)
            })}
            onClick={() => this.setState({ tab: TAB_TYPE.CONTACTS })}
          >
            <ContactsIcon />
            <span className="text">通讯录</span>
          </div>
        </div>
        <div className={styles.search}>
          <Input
            placeholder="搜索关键词"
            onChange={(e) => this.setState({ keyword: e.target.value })}
            value={keyword}
            style={{ width: 270, height: 28 }}
          />
        </div>

        <div className={styles.panelContent}>
          <Motion style={{ left: spring(tab === TAB_TYPE.CONTACTS ? (-300) : 0) }}>
            {({ left }) =>
              <div
                className={styles.contentWrapper}
                style={{
                  WebkitTransform: `translate3d(${left}px, 0, 0)`,
                  transform: `translate3d(${left}px, 0, 0)`,
                }}
              >
                <div className={styles.recentChatPanel}>
                  {this.renderRecentChats(recentChats, keyword.trim())}
                </div>
                <div className={styles.contactsPanel}>
                  {this.renderContactRoles(affairRoles, keyword.trim())}
                  <div className={styles.createBtn}>
                    <Button onClick={() => this.setState({ createGroupModalVisible: true })} style={{ width: 162 }}>
                      创建讨论组
                    </Button>
                  </div>
                </div>
              </div>
            }
          </Motion>

        </div>
        {createGroupModalVisible ?
          <AffairChatGroupModal
            type={GROUP_MODAL_TYPE.CREATE}
            visible={createGroupModalVisible}
            affairId={parseInt(affair.get('id'))}
            roleId={affair.get('roleId')}
            affairRoles={affairRoles}
            onOk={() => this.fetchChatGroups(affair)}
            onCancel={() => this.setState({ createGroupModalVisible: false })}
          /> : null
        }
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    affairChatGroups: state.getIn(['message', 'affair', 'affairChatGroups'])
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchAffairChatGroups: bindActionCreators(fetchAffairChatGroups, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AffairChatGroupPanel)
