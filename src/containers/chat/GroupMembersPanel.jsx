import React from 'react'
import { Button, Collapse } from 'antd'
import { CloseIcon } from 'svg'
import styles from './GroupMembersPanel.scss'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { getGroupMember } from '../../actions/chat'
import CreateGroupChatModal from './CreateGroupChatModal'
// import AffairChatGroupModal, { GROUP_MODAL_TYPE } from './AffairChatGroupModal'
// const Panel = Collapse.Panel

class GroupMembersPanel extends React.Component {
  // static defaultProps = {
  //   members: {}, // 组内成员
  //   affair: {},
  //   affairRoles: {}
  // }

  // constructor(props) {
  //   super(props)
  // }

  state = {
    editGroupModalVisible: false
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectedChat.get('_key') !== this.props.selectedChat.get('_key')) {
      this.props.close()
    }
  }

  getMembersInGroup = (members) => {
    let membersInGroup = []
    if (members && members.roles) {
      membersInGroup = members.roles.concat(...members.groups.map((g) => g.members))
      membersInGroup = membersInGroup.map((role) => {
        role.roleId = role.id
        return role
      })
    }
    return membersInGroup
  }

  handleModalControl = (state) => {
    this.setState({ editGroupModalVisible: state })
  }

  render() {
    const { editGroupModalVisible } = this.state
    const { currentGroupMember } = this.props

    const roles = currentGroupMember.getIn(['groups', 0, 'members']) || currentGroupMember.getIn(['roles'])

    return (
      <div className={styles.GroupMembersPanel}>
        <div className={styles.panelHeader}>
          <div className={styles.title}>角色列表:</div>
          <div className={styles.close} onClick={this.props.close}>
            <CloseIcon />
          </div>
        </div>
        <div className={styles.panelContent}>
          <div className={styles.contentWrapper}>
            <ol className={styles.roleList}>
              {
                roles ? roles.map((role, k) => (
                  <li className={styles.roleItem} key={k}>
                    <div className={styles.avatar}>
                      <img src={role.get('avatar')} />
                    </div>
                    <div className={styles.userName}>
                      {role.get('roleTitle') + '-' + role.get('username')}
                    </div>
                  </li>
                )) : null
              }
            </ol>

            {/* <Collapse bordered={false} defaultActiveKey={['0']}>
              {groups && groups.map((group, k) => {
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
            </Collapse> */}
          </div>
        </div>
        <div className={styles.editMembers}>
          <Button type="primary" onClick={this.handleModalControl.bind(this, true)}>
            管理讨论组成员
          </Button>
        </div>
        {
          editGroupModalVisible ?
          <CreateGroupChatModal
            visible={editGroupModalVisible}
            onCancel={this.handleModalControl.bind(this, false)}
            isCreate={false}
          /> : null
        }

        {/* {editGroupModalVisible ?
          <AffairChatGroupModal
            type={GROUP_MODAL_TYPE.EDIT}
            visible={editGroupModalVisible}
            affairId={parseInt(affair.get('id'))}
            roleId={affair.get('roleId')}
            affairRoles={affairRoles}
            groupId={group.groupId}
            membersInGroup={this.getMembersInGroup(members)}
            onOk={(members) => this.props.updateMembers(members)}
            onCancel={() => this.setState({ editGroupModalVisible: false })}
          /> : null
        } */}

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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(GroupMembersPanel))
