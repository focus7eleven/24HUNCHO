import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Menu } from 'antd'
import { Map, List } from 'immutable'

import { enterConference } from '../../actions/conference'
import { fetchScopeGroups, fetchGuestGroups, addAnnouncementGroup, clearMessage } from '../../actions/message'

import AnnouncementGroupModal, { GROUP_MODAL_TYPE } from './AnnouncementGroupModal'
import styles from './AnnouncementChatContainer.scss'
import AnnouncementChat from './AnnouncementChat'
import { TOPICTYPE, MEMBERTYPE } from 'chat-contants'


const SCOPE = TOPICTYPE

class AnnouncementChatContainer extends React.Component {

  static defaultProps = {
    scopeGroups: Map({}),
    guestGroups: List([]),

    affair: Map({}), // affair Map 对象
    announcement: Map({}), // announcement Map 对象
    officialList: [], // 官方角色列表
    isOfficial: true, // 是否官方
    guests: {}, // 客方 Map, innerAffair, innerAlliance, innerMenkor
  };

  constructor(props) {
    super(props)
    const { announcement, isOfficial, affair } = props
    this.initScopeGroups(announcement, isOfficial, affair)
  }

  state = {
    scope: SCOPE.ANNOUNCEMENT_IN_AFFAIR, //域，事务内、盟内、盟客

    createGroupModalVisible: false, // 显示创建讨论组 Modal
  }

  componentDidMount() {

  }

  componentWillReceiveProps({ affair, announcement, isOfficial }) {
    if (affair && announcement) {
      if ((announcement.get('announcementId') !== this.props.announcement.get('announcementId')) || (affair.get('roleId') !== this.props.affair.get('roleId')) || (isOfficial !== this.props.isOfficial)) {
        this.initScopeGroups(announcement, isOfficial, affair)
      }
    }
  }

  componentWillUnmount() {
    this.props.clearMessage()
  }

  initScopeGroups = (announcement, isOfficial = true, affair) => {
    let announcementId = announcement.get('announcementId')
    
    if (isOfficial) {
      this.props.fetchScopeGroups(announcementId, affair)
      this.setState({
        scope: SCOPE.ANNOUNCEMENT_IN_AFFAIR
      })
    } else {
      this.props.fetchGuestGroups(announcementId, affair)
      this.setState({
        scope: -1
      })
    }

  }

  handleScopeChange = (e) => {
    this.setState({
      scope: parseInt(e.key)
    })
  }

  handleCreateGroup = (data) => {
    const { scope } = this.state
    this.props.addAnnouncementGroup({ group: data, scope })
  }

  formatGuests = (guests) => {
    // TODO 替换 mock 数据
    const newGuests = {}
    newGuests.innerAffair = guests.innerAffair.map((role) => {
      const newRole = Object.assign({}, role)
      newRole.id = role.roleId
      newRole.firstName = role.roleTitle
      newRole.secondName = role.username
      newRole.memberType = MEMBERTYPE.AFFAIR
      return newRole
    })
    newGuests.innerAlliance = guests.innerAlliance.map((affair) => {
      const item = affair.affair
      const newAffair = Object.assign({}, item)
      newAffair.firstName = item.name
      newAffair.secondName = item.shortName
      newAffair.memberType = MEMBERTYPE.ALLIANCE
      return newAffair
    })
    newGuests.menkor = guests.menkor.map((alliance) => {
      const item = alliance.alliance
      const newAlliance = Object.assign({}, item)
      newAlliance.firstName = item.name
      newAlliance.secondName = item.shortName
      newAlliance.memberType = MEMBERTYPE.GUEST
      return newAlliance
    })

    return newGuests
  }

  render() {
    const { user, affair, announcement, guests, isOfficial, scopeGroups, guestGroups } = this.props
    const { scope, createGroupModalVisible } = this.state
    let selectedGroups = []
    if (isOfficial) {
      selectedGroups = scopeGroups.get(scope) ? scopeGroups.get(scope).toJS() : []
    } else {
      selectedGroups = guestGroups.toJS()
    }
    
    let content = (
      <div className={styles.announcementChatContainer}>
        {isOfficial ? 
          <div className={styles.scopeMenu}>
            <Menu
              className={styles.scopeMenu}
              onClick={this.handleScopeChange}
              selectedKeys={[this.state.scope + '']}
              mode="horizontal"
            >
              <Menu.Item key={SCOPE.ANNOUNCEMENT_IN_AFFAIR}>
                事务内
              </Menu.Item>
              <Menu.Item key={SCOPE.ANNOUNCEMENT_IN_AlLIANCE}>
                盟内
              </Menu.Item>
              <Menu.Item key={SCOPE.ANNOUNCEMENT_IN_GUEST}>
                盟客网
              </Menu.Item>
              <Menu.Item key={SCOPE.ANNOUNCEMENT_IN_FOLLOWER}>
                关注
              </Menu.Item>
            </Menu>
          </div> : null
        }
        
        <div className={styles.chatContainer}>
          <AnnouncementChat
            user={user}
            scope={scope}
            affair={affair}
            isOfficial={isOfficial}
            announcementId={announcement.get('announcementId')}
            chatGroups={selectedGroups}
            guests={this.formatGuests(guests)}
            createGroup={() => this.setState({ createGroupModalVisible: true })}
          />
        </div>
        {createGroupModalVisible && isOfficial ?
          <AnnouncementGroupModal
            onCancel={() => this.setState({ createGroupModalVisible: false })}
            type={GROUP_MODAL_TYPE.CREATE}
            visible={createGroupModalVisible}
            guests={this.formatGuests(guests)}
            roleId={affair.get('roleId')}
            affairId={parseInt(affair.get('id'))}
            scope={parseInt(scope)}
            announcementId={announcement.get('announcementId')}
            onOk={this.handleCreateGroup}
          /> : null}
      </div>
    )


    return (
      content
    )
  }
}

function mapStateToProps(state) {
  const user = state.get('user')
  //当前角色所在的盟id

  return {
    user,
    scopeGroups: state.getIn(['message', 'announcement', 'scopeGroups']),
    guestGroups: state.getIn(['message', 'announcement', 'guestGroups']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchScopeGroups: bindActionCreators(fetchScopeGroups, dispatch),
    fetchGuestGroups: bindActionCreators(fetchGuestGroups, dispatch),
    addAnnouncementGroup: bindActionCreators(addAnnouncementGroup, dispatch),
    clearMessage: bindActionCreators(clearMessage, dispatch),
    enterConference: bindActionCreators(enterConference, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(AnnouncementChatContainer)
