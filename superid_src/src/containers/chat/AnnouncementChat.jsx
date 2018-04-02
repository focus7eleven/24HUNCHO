import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Button, Collapse, Modal } from 'antd'
import classNames from 'classnames'
import { Map, fromJS, List } from 'immutable'

import styles from './AnnouncementChat.scss'
import { initGroupsMap, updateGroupsMap, addAnnouncementMessage, updateAnnouncementFileMessage, deleteAnnouncementFileMessage, updateAnnouncementGroup, deleteAnnouncementGroup } from '../../actions/message'
import { enterConference } from '../../actions/conference'
import config from '../../config'
import ChatWindow from '../../components/chat/ChatWindow'
import AnnouncementGroupModal, { GROUP_MODAL_TYPE } from './AnnouncementGroupModal'
import GroupSettingModal from './GroupSettingModal'
import { CloseIcon } from 'svg'
import { ANNOUNCEMENT_MEMBER, MESSAGE_INIT_LIMIT, MESSAGE_LOAD_COUNT } from 'chat-contants'
import ChatRecordPanel from './ChatRecordPanel'

const Panel = Collapse.Panel
const Client = window.SocketClient
const Constants = Client.Constants
const DEFAULT_AVATOR = 'http://superid-public.oss-cn-shanghai.aliyuncs.com/person_default.png'

const LIMIT = MESSAGE_INIT_LIMIT


class AnnouncementChat extends React.Component {

  static defaultProps = {
    scope: -1, // 事务内，盟内，盟客网，关注
    chatGroups: [], // 讨论组列表
    isOfficial: false, // 是否官方,

    groupsMap: Map({}), // 存储所有讨论组的消息队列，key 为 groupId
  };

  constructor(props) {
    super(props)

    this.addListeners()
  }

  state = {
    currentGroup: null, // 当前展开的讨论组
    currentGroupMembers: null, // 当前讨论组的成员组

    membersVisible: false, // 聊天成员显示

    editMembersModalVisible: false, // 编辑讨论组 Modal 显示
    chatRecordPanelVisible: false, // 搜索聊天记录的 Panel 显示
    chatFilesPanelVisible: false, // 查找聊天文件的 Panel 显示
    settingModalVisible: false, // 设置讨论组 Modal 显示
  }

  componentDidMount() {

  }


  componentWillReceiveProps(nextProps) {

    if (this.props.scope !== nextProps.scope) {
      this.props.initGroupsMap(nextProps.chatGroups)
      if (nextProps.chatGroups && nextProps.chatGroups.length > 0) {
        const first = nextProps.chatGroups[0]
        this.handleSelectGroup(first)
      } else {
        this.setState({
          currentGroup: null
        })
      }
    } else if (this.props.chatGroups.length !== nextProps.chatGroups.length) {
      if (nextProps.chatGroups.length > 0) {
        this.props.initGroupsMap(nextProps.chatGroups)
        if (nextProps.chatGroups && nextProps.chatGroups.length > 0) {
          const first = nextProps.chatGroups[0]
          this.handleSelectGroup(first)
        }
      } else {
        this.setState({
          currentGroup: null
        })
      }
    }

    // if (this.state.currentGroup === null) {
    //   if (nextProps.chatGroups && nextProps.chatGroups.length > 0) {
    //     const first = nextProps.chatGroups[0]
    //     if (nextProps.groupsMap.get(first.id)) {
    //       this.handleSelectGroup(first)
    //     }
    //   }
    // }
  }


  componentWillUnmount() {    
    this.removeListeners()
  }


  // socket message listeners
  addListeners = () => {
    Client.addHandler('MSG', this.messageListener)
  }

  removeListeners = () => {
    Client.removeHandler('MSG', this.messageListener)
  }

  messageListener = (message) => {
    const { affair } = this.props
    const { currentGroup } = this.state

    if (message.fromRoleId === affair.get('roleId')) {
      return
    }

    const content = {
      message,
      isCurrent: (currentGroup.id === message.groupId)
    }

    // console.log(message)
    

    this.props.addAnnouncementMessage(content)
  }

  fetchMemberList = (id) => {
    fetch(config.api.chat.memberList(id), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => {
      return res.json()
    }).then((json) => {
      if (json.code === 0) {
        this.setState({
          currentGroupMembers: fromJS(json.data).update('groups', (list) => list.map((item) => item.update('members', (members) => members.filter((m) => m))))
        })
      }
    })
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

  // 选中讨论组
  handleSelectGroup = (group) => {
    const { groupsMap } = this.props
    if (!group) {
      this.setState({
        currentGroup: group,
      })
      return
    }
    let selectedGroup = groupsMap.get(group.id)
    if (selectedGroup) {
      if (!selectedGroup.get('open')) {
        this.fetchMemberList(group.id)
        this.openGroupChat(group.id).then((success) => {
          selectedGroup = selectedGroup.set('msgList', List(success.msgList))
                                      .set('unread', 0)
                                      .set('open', true)
                                      .set('key', success.key)
          this.props.updateGroupsMap(selectedGroup)
          this.setState({
            currentGroup: group
          })
        })
      } else {
        this.fetchMemberList(group.id)
        selectedGroup = selectedGroup.set('unread', 0)
        this.props.updateGroupsMap(selectedGroup)
        this.setState({
          currentGroup: group,
        })
      }
    } else {
      selectedGroup = Map(group)
      this.fetchMemberList(group.id)
      this.openGroupChat(group.id).then((success) => {
        selectedGroup = selectedGroup.set('msgList', List(success.msgList))
                                    .set('unread', 0)
                                    .set('open', true)
                                    .set('key', success.key)
        this.props.updateGroupsMap(selectedGroup)
        this.setState({
          currentGroup: group
        })
      })
    }
  }

  // socket 发送消息
  handleSendMessage = (content, subType = Constants.CHAT_SUBTYPE.DEFAULT, apns = []) => {
    const { affair, user } = this.props
    const { currentGroup } = this.state
    const currentRole = user.toJS().roles.find((r) => r.roleId === affair.get('roleId'))
    const params = {
      fromRoleId: affair.get('roleId'),
      groupId: currentGroup.id,
      sub: subType,
      name: currentRole.roleName + '-' + user.get('username'),
      apns: apns,
      content
    }

    Client.groupChatService.sendGroupMsg(params, (success) => {
      success.fromUserId = user.get('id')
      this.props.addAnnouncementMessage({ message: success, isCurrent: true })
    })
  }


  // 创建文件消息
  initFileMessage = (file, subType) => {
    const { user, affair } = this.props
    const { currentGroup } = this.state
    const currentRole = user.get('roles').find((r) => r.roleId === affair.get('roleId'))
    const message = {
      groupId: currentGroup.id,
      sub: subType,
      name: currentRole.get('roleName') + '-' + user.get('username'),
      fromUserId: user.get('id'),
      fromRoleId: affair.get('roleId'),
      file: file,
      time: Date.now()
    }

    message['callback'] = (content) => {
      const index = this.props.groupsMap.getIn([currentGroup.id, 'msgList']).indexOf(message)
      const params = {
        fromRoleId: affair.get('roleId'),
        groupId: currentGroup.id,
        sub: subType,
        name: user.get('username'),
        apns: [],
        content
      }

      Client.groupChatService.sendGroupMsg(params, (success) => {
        success.fromUserId = user.get('id')
        this.props.updateAnnouncementFileMessage({ message: success, index })
      })
    }

    message['cancel'] = () => {
      const index = this.props.groupsMap.getIn([currentGroup.id, 'msgList']).indexOf(message)
      this.props.deleteAnnouncementFileMessage({ message, index })
    }

    this.props.addAnnouncementMessage({ message, isCurrent: true })

  }

  // 下滑加载更多消息
  handleLoadMoreMessage = () => {
    const { affair, groupsMap } = this.props
    const { currentGroup } = this.state
    const params = {
      groupId: currentGroup.id,
      roleId: affair.get('roleId'),
      limit: MESSAGE_LOAD_COUNT,
    }
    let selectGroup = groupsMap.get(currentGroup.id)
    const chatMessages = groupsMap.getIn([currentGroup.id, 'msgList'])
    if (chatMessages.get(0)) {
      params.endTime = chatMessages.get(0).time
    }

    return new Promise((resolve) => {
      if (chatMessages.size === 0) {
        resolve()
      } else {
        Client.groupChatService.loadGroupMsg(params, (success) => {
          selectGroup = selectGroup.set('msgList', List(success.msgList))
          this.props.updateGroupsMap(selectGroup)
          resolve()
        })
      }
    })

  }

  handleShowMembers = () => {
    const { currentGroup } = this.state
    this.fetchMemberList(currentGroup.id)
    this.setState({
      membersVisible: true
    })
  }

  handleEditGroupMembers = () => {
    const { currentGroup } = this.state
    this.fetchMemberList(currentGroup.id)
  }

  handleEditGroup = (group) => {
    const { scope } = this.props
    const { currentGroup } = this.state
    const newGroup = Object.assign({}, currentGroup)
    newGroup.name = group.name
    this.setState({
      currentGroup: newGroup
    })
    this.props.updateAnnouncementGroup({ group, scope })
  }

  // 解散讨论组
  showConfirmDisbandGroup = (group) => {
    const { affair, scope } = this.props
    let updateGroups = () => {
      this.setState({
        currentGroup: null
      })
      this.props.deleteAnnouncementGroup({ group, scope })
    }
    Modal.confirm({
      iconType: 'exclamation-circle',
      className: styles.groupChatConfrim,
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
            groupId: group.id,
          })
        }).then((res) => res.json()).then((res) => {
          if (res.code === 0) {
            updateGroups()
          }
        })
      }
    })
  }

  // 编辑讨论组时需要的组内成员
  getMembersInGroup = (members) => {
    const { guests } = this.props
    if (!members) {
      return []
    }
    const groups = members.get('groups')
    const membersInGroup = groups.toJS().map((g) => {
      let member = null
      switch (g.type) {
        case ANNOUNCEMENT_MEMBER.AFFAIR:
          member = guests.innerAffair.find((a) => a.id === g.resourceId)
          break
        case ANNOUNCEMENT_MEMBER.ALLIANCE:
          member = guests.innerAlliance.find((a) => a.id === g.resourceId)
          break
        case ANNOUNCEMENT_MEMBER.GUEST:
          member = guests.menkor.find((a) => a.id === g.resourceId)
          break
        default:
          break
      }
      return member
    }).filter((a) => a)

    return membersInGroup
  }

  // 讨论组内成员面板
  renderMemberList = (members, visible) => {
    if (!members) {
      return null
    }
    const { isOfficial } = this.props
    return (
      <div
        className={classNames({
          [styles.modalPanel]: true,
          [styles.memberPanel]: true,
          'visible': visible
        })}
      >
        <div className={styles.panelHeader}>
          <div className={styles.title}>角色列表:</div>
          <div className={styles.close} onClick={() => this.setState({ membersVisible: false })}>
            <CloseIcon />
          </div>
        </div>
        <div className={styles.panelContent}>
          <div className={styles.contentWrapper}>
            <ol className={styles.roleList}>
              {members.get('roles').toJS().filter((a) => a).map((role, k) => {
                return (
                  <li className={styles.roleItem} key={k}>
                    <div className={styles.avatar}>
                      <img src={role.avatar} />
                    </div>
                    <div className={styles.userName}>
                      {role.roleTitle + '-' + role.username}
                    </div>
                  </li>
                )
              })}
            </ol>

            <Collapse bordered={false} defaultActiveKey={['0']}>
              {members.get('groups').toJS().map((group, k) => {
                return (
                  <Panel header={`${group.name}（${group.members.length}）`} key={k}>
                    <ol className={styles.groupMemberList}>
                      {group.members.filter((a) => a).map((role, k) => {
                        return (
                          <li className={styles.memberItem} key={k}>
                            <div className={styles.avatar}>
                              <img src={role.avatar} />
                            </div>
                            <div className={styles.userName}>
                              {role.roleTitle + '-' + role.username}
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  </Panel>
                )
              })}
            </Collapse>
          </div>
        </div>
        {isOfficial ?
          <div className={styles.editMembers}>
            <Button type="primary" onClick={() => this.setState({ editMembersModalVisible: true })}>
              编辑讨论组
            </Button>
          </div> : null
        }
      </div>
    )
  }

  renderChatRecordPanel = (group, visible, members) => {
    const { affair } = this.props
    return (
      <ChatRecordPanel
        isGroup
        affair={affair}
        group={group ? group.toJS() : {}}
        visible={visible}
        members={members.toJS()}
        close={() => this.setState({ chatRecordPanelVisible: false })}
      />
    )
  }

  render() {
    const { user, affair, announcementId, scope, guests, isOfficial, chatGroups, groupsMap } = this.props
    const { currentGroup, currentGroupMembers, membersVisible, editMembersModalVisible, chatRecordPanelVisible, settingModalVisible } = this.state

    const selectedGroup = currentGroup ? groupsMap.get(currentGroup.id) : null
    const chatMessages = selectedGroup ? selectedGroup.get('msgList') : List([])
    const members = currentGroupMembers ? currentGroupMembers : null

    const formatMembers = members ? List(members.get('groups').toJS().reduce((prev, next) => prev.concat(next.members), []).concat(members.get('roles').toJS())) : List([])
    return (
      <div className={styles.announcementChat}>
        {/* <div className={styles.chatHeader}>
          开放问题{scope}
        </div> */}
        <div className={styles.chatContent}>
          <div className={styles.chatLeft}>
            <div className={styles.options}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.chatGroupsContainer}>
              <ul className={styles.chatGroups}>
                {chatGroups.map((group, k) => {
                  let unread = groupsMap.get(group.id) ? groupsMap.getIn([group.id, 'unread']) : 0                
                  return (
                    <li
                      key={k}
                      className={classNames({
                        [styles.groupItem]: true,
                        'selected': currentGroup ? (group.id === currentGroup.id) : false,
                      })}
                      onClick={() => this.handleSelectGroup(group)}
                    >
                      <img src={group.avatar || DEFAULT_AVATOR} />
                      {unread > 0 ? <i className="message-red-reminder" /> : null}
                    </li>
                  )
                })}
              </ul>
            </div>
            
            {isOfficial ?
              <div className={styles.createGroup} onClick={() => this.props.createGroup()}>
                <span className="h"/>
                <span className="v"/>
              </div> : null
            }
          </div>
          <div className={styles.chatRight}>
            <ChatWindow
              userId={user.get('id')}
              affair={affair}
              group={currentGroup}
              members={formatMembers}
              onSend={this.handleSendMessage}
              chatMessages={chatMessages ? chatMessages : List([])}
              loadMoreMessage={this.handleLoadMoreMessage}
              initFileMessage={this.initFileMessage}
              isOfficial={isOfficial}
              showMembers={this.handleShowMembers}
              openChatRecordPanel={() => this.setState({ chatRecordPanelVisible: true })}
              openSettingModal={() => this.setState({ settingModalVisible: true })}
              openDisbandModal={(group) => this.showConfirmDisbandGroup(group)}
              enterConference={this.props.enterConference}
            />
          </div>
          {this.renderMemberList(members, membersVisible)}
          {this.renderChatRecordPanel(selectedGroup, chatRecordPanelVisible, formatMembers)}
        </div>

        {editMembersModalVisible ?
          <AnnouncementGroupModal
            onCancel={() => this.setState({ editMembersModalVisible: false })}
            type={GROUP_MODAL_TYPE.EDIT}
            visible={editMembersModalVisible}
            guests={guests}
            roleId={affair.get('roleId')}
            affairId={parseInt(affair.get('id'))}
            scope={parseInt(scope)}
            groupId={currentGroup ? currentGroup.id : 0}
            membersInGroup={this.getMembersInGroup(members)}
            announcementId={announcementId}
            onOk={this.handleEditGroupMembers}
          /> : null}
        {settingModalVisible ?
          <GroupSettingModal
            onCancel={() => this.setState({ settingModalVisible: false })}
            visible={settingModalVisible}
            group={selectedGroup ? selectedGroup.toJS() : null}
            announcementId={announcementId}
            roleId={affair.get('roleId')}
            affairId={parseInt(affair.get('id'))}
            onOk={this.handleEditGroup}
          /> : null}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    groupsMap: state.getIn(['message', 'announcement', 'groupsMap']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    initGroupsMap: bindActionCreators(initGroupsMap, dispatch),
    updateGroupsMap: bindActionCreators(updateGroupsMap, dispatch),
    addAnnouncementMessage: bindActionCreators(addAnnouncementMessage, dispatch),
    updateAnnouncementFileMessage: bindActionCreators(updateAnnouncementFileMessage, dispatch),
    deleteAnnouncementFileMessage: bindActionCreators(deleteAnnouncementFileMessage, dispatch),
    updateAnnouncementGroup: bindActionCreators(updateAnnouncementGroup, dispatch),
    deleteAnnouncementGroup: bindActionCreators(deleteAnnouncementGroup, dispatch),
    enterConference: bindActionCreators(enterConference, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AnnouncementChat)
