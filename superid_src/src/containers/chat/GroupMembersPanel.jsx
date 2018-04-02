import React from 'react'
import { Button, Collapse } from 'antd'

import { CloseIcon } from 'svg'
import styles from './GroupMembersPanel.scss'
import AffairChatGroupModal, { GROUP_MODAL_TYPE } from './AffairChatGroupModal'

const Panel = Collapse.Panel

export default class GroupMembersPanel extends React.Component {

  static defaultProps = {
    members: {}, // 组内成员
    affair: {},
    affairRoles: {}
  }

  constructor(props) {
    super(props)
  }

  state = {
    editGroupModalVisible: false
  }

  getMembersInGroup = (members) => {
    let membersInGroup = []
    if (members && members.roles) {
      membersInGroup = members.roles.filter((r) => r.userId !== 0).concat(...members.groups.map((g) => g.members))
      membersInGroup = membersInGroup.map((role) => {
        role.roleId = role.id
        return role
      })
    }
    return membersInGroup
  }

  render() {
    const { affair, affairRoles, members, group } = this.props
    const { editGroupModalVisible } = this.state

    if (!members) {
      return null
    }

    const { roles, groups } = members
    const filterRoles = roles ? roles.filter((r) => r.userId !== 0) : []
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
              {filterRoles && filterRoles.map((role, k) => {
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
            </Collapse>
          </div>
        </div>
        <div className={styles.editMembers}>
          <Button type="primary" onClick={() => this.setState({ editGroupModalVisible: true })}>
            编辑讨论组
          </Button>
        </div>

        {editGroupModalVisible ?
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
        }
  
      </div>
    )
  }
}