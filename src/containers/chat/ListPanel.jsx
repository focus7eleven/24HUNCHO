import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { bindActionCreators } from 'redux'
import { Input, Collapse, Button, Spin } from 'antd'
import { Motion, spring } from 'react-motion'
import emojione from 'emojione.js'
import { RecentChatIcon, ContactsIcon } from 'svg'
import { Map, List, fromJS } from 'immutable'
import _ from 'lodash'
import styles from './ListPanel.scss'
import { getGroupChatList, getRecentChat, setCurrentChat } from '../../actions/chat'
import { getCourseRole, getRoles } from '../../actions/role'
import { USER_ROLE_TYPE } from 'member-role-type'
import CreateGroupChatModal from './CreateGroupChatModal'
import { relativeTime } from 'time'
import { CHAT_TYPE, MESSAGE_INIT_LIMIT } from 'chat-contants'

const Panel = Collapse.Panel
const Search = Input.Search
const DEFAULT_AVATOR = 'http://superid-public.oss-cn-shanghai.aliyuncs.com/person_default.png'

const Client = window.SocketClient
const Constants = Client.Constants

const TAB_TYPE = {
  RECENT: 0,
  CONTACTS: 1,
}

class ListPanel extends React.Component {
  static defaultProps = {
    fetchSingleChatMessage: () => {},
    fetchGroupChatMessage: () => {},
  }

  static propTypes = {
    fetchSingleChatMessage: PropTypes.func.isRequired, // 发送会话消息
    fetchGroupChatMessage: PropTypes.func.isRequired, // 发送会话消息
  }

  state = {
    tab: TAB_TYPE.RECENT, // 当前 tab
    keyword: '', // 搜索关键词
    createGroupModalVisible: false, // 显示创建讨论组 Modal
  }

  componentWillMount() {
    const { roleId, affairId } = this.props
    if (roleId > -1) {
      this.initContacts()
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.roleId !== this.props.roleId) {
      this.initContacts(nextProps)
    }
  }

  initContacts = (props = this.props) => {
    const groupId = props.match.params.groupId
    const { affairId, roleId } = props
    this.props.getGroupChatList(affairId, roleId)
    this.props.getRecentChat(affairId, roleId)
    if (groupId) {
      this.props.getGroupRole(affairId, roleId)
    } else {
      this.props.getCourseRole(affairId, roleId)
    }
  }

  handleOpenGroupChat = (group) => {
    let currentChat = Map()
    const groupInfo = Map({
      groupId: group.get('id'),
      name: group.get('name'),
      avatar: group.get('avatar')
    })
    currentChat = currentChat.set('groupInfo', groupInfo).set('type', CHAT_TYPE.GROUP)
    this.props.fetchGroupChatMessage(group.get('id')).then(response => {
      currentChat = currentChat.set('_key', response.key)
      this.props.setCurrentChat(currentChat)
    })
  }

  handleOpenSingleChat = (toRoleId) => {
    let role
    const affairRoles = this.props.match.params.groupId ? this.props.groupRole : this.props.courseRole

    for(let i = 0; i < affairRoles.size; i++) {
      const target = affairRoles.get(i).get('roleList').find(vv => vv.get('id') === toRoleId)
      if (target) {
        role = fromJS({
          name: target.get('title') + '-' + target.get('realName'),
          toRoleId: target.get('id'),
          toUserId: target.get('userId'),
          avatar: target.get('avatar')
        })
        break
      }
    }
    let currentChat = Map()
    currentChat = currentChat.set('toUserInfo', role).set('type', CHAT_TYPE.SINGLE)
    this.props.fetchSingleChatMessage(toRoleId).then(response => {
      currentChat = currentChat.set('_key', response.key)
      this.props.setCurrentChat(currentChat)
    })
  }

  handleSelectChat = (chat) => {
    this.props.setCurrentChat(chat)
  }

  handleModalControl = (state) => {
    this.setState({ createGroupModalVisible: state })
  }


  debounceSetKeyword = _.debounce(keyword => this.setState({ keyword }), 300)

  handleFilterList = (e) => {
    this.debounceSetKeyword(e.target.value.trim())
  }

  renderLastMessage = (message) => {
    let preview = emojione.shortnameToUnicode(message.content)
    if (message.type === CHAT_TYPE.GROUP && message.fromRoleId !== this.props.roleId) {
      preview = message.name + ': ' + emojione.shortnameToUnicode(message.content)
    }
    if (message.sub >= Constants.CHAT_SUBTYPE.GROUP.CREATE && message.sub <= Constants.CHAT_SUBTYPE.GROUP.INVALID_ROLE) {
      return '[系统消息]'
    }
    switch (message.sub) {
      case Constants.CHAT_SUBTYPE.DEFAULT:
        return preview
      case Constants.CHAT_SUBTYPE.FILE:
        return '[文件消息]'
      case Constants.CHAT_SUBTYPE.IMAGE:
        return '[图片]'
      case Constants.CHAT_SUBTYPE.VIDEO.INVITATION:
        return '[视频邀请]'
      default:
        return ''
    }
  }

  renderRecentChat = (chats) => {
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
            {unreadCount > 0 ? <span className="unread">{unreadCount}</span> : null}
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

    const { selectedChat, roleId } = this.props
    const { keyword } = this.state

    return (
      <ol className={styles.recentChats}>
        {chats.map((chat, k) => {
          const name = chat.getIn(['toUserInfo', 'name']) || chat.getIn(['groupInfo', 'name'])
          if (name && !~name.indexOf(keyword)) {
            return null
          }
          const selected = selectedChat.get('_key') === chat.get('_key')
          return chat.getIn(['toUserInfo', 'toRoleId']) === roleId ? null : (
            <li className={classNames(styles.recentChatItem, { selected })} key={k} onClick={this.handleSelectChat.bind(this, chat)}>
              {chat.get('type') === CHAT_TYPE.GROUP ?
                renderGroupChat(chat.toJS()) : renderSingleChat(chat.toJS())
              }
            </li>
          )
        })}
      </ol>
    )
  }

  renderContactRoles = () => {
    const { roleId, groupChatList, teachers, assistants, students, managers, members } = this.props
    const { keyword } = this.state

    const renderPanel = (list, title, key) => (
      <Panel header={`${title} (${list.size}）`} key={key}>
        <ol className={styles.groupMemberList}>
          {
            list.map(renderRole)
          }
        </ol>
      </Panel>
    )

    const renderRole = (role, k) => (
      role.get('id') === roleId || !~role.get('realName').indexOf(keyword) ? null :
      // role.get('id') === roleId || role.get('realName').indexOf(keyword) > -1 ? null :
      <li className={styles.memberItem} key={role.get('id') || k} onClick={this.handleOpenSingleChat.bind(this, role.get('id'))}>
        <div className={styles.avatar}>
          <img src={role.get('avatar') ? role.get('avatar') : DEFAULT_AVATOR} />
        </div>
        <div className={styles.userName}>
          {role.get('realName')}
        </div>
      </li>
    )


    return (
      <div className={styles.contactsRoles}>
        <Collapse bordered={false} defaultActiveKey={['0', '1', '2', '3']}>
          <Panel header={`群聊（${groupChatList.size}）`} key="0">
            <ol className={styles.groupMemberList}>
              {
                groupChatList.map((group, k) => !~group.get('name').indexOf(keyword) ? null : (
                  <li className={styles.memberItem} key={k} onClick={this.handleOpenGroupChat.bind(this, group)}>
                    <div className={styles.avatar}>
                      <img src={group.get('avatar') ? group.get('avatar') : DEFAULT_AVATOR} />
                    </div>
                    <div className={styles.userName}>
                      {group.get('name')}
                    </div>
                  </li>
                ))
              }
            </ol>
          </Panel>
          {
            this.props.match.params.groupId ?
            [
              renderPanel(managers, '组长', 1),
              renderPanel(members, '组员', 2),
              renderPanel(assistants, '助教', 3),
            ]
            :
            [
              renderPanel(teachers, '教师', 1),
              renderPanel(assistants, '助教', 2),
              renderPanel(students, '学生', 3),
            ]
          }
        </Collapse>
      </div>
    )
  }

  render() {
    const { recentChat } = this.props
    const { tab, createGroupModalVisible } = this.state

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
            onChange={this.handleFilterList}
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
                  {
                    recentChat ? this.renderRecentChat(recentChat) : null
                  }
                </div>
                <div className={styles.contactsPanel}>
                  {this.renderContactRoles()}
                  <div className={styles.createBtn}>
                    <Button onClick={this.handleModalControl.bind(this, true)} style={{ width: 162 }}>
                      创建讨论组
                    </Button>
                  </div>
                </div>
              </div>
            }
          </Motion>
        </div>
        {
          createGroupModalVisible ?
          <CreateGroupChatModal
            visible={createGroupModalVisible}
            onCancel={this.handleModalControl.bind(this, false)}
            isCreate
          /> : null
        }
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  return {
    roleId: state.getIn(['user', 'role', 'roleId']),
    groupChatList: state.getIn(['chat', 'groupChatList']),
    recentChat: state.getIn(['chat', 'recentChat']),
    selectedChat: state.getIn(['chat', 'selectedChat']),
    // 角色
		courseRole: state.getIn(['role', 'courseRole']),
		teachers: state.getIn(['role', 'teachers']),
		students: state.getIn(['role', 'students']),
		assistants: state.getIn(['role', 'assistants']),
		managers: state.getIn(['role', 'managers']),
		members: state.getIn(['role', 'members']),
    groupRole: state.getIn(['role', 'groupRole']),
    // props re-formatted
    affairId: props.match.params.groupId || props.match.params.id,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getGroupChatList: bindActionCreators(getGroupChatList, dispatch),
    getCourseRole: bindActionCreators(getCourseRole, dispatch),
    getGroupRole: bindActionCreators(getRoles, dispatch),
    getRecentChat: bindActionCreators(getRecentChat, dispatch),
    setCurrentChat: bindActionCreators(setCurrentChat, dispatch),
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ListPanel))
