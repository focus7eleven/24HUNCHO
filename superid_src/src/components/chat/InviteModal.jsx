import React from 'react'
import { Modal, message } from 'antd'
import OfficialListComponent from '../../containers/announcement/OfficialListComponent'
import config from '../../config'

const PropTypes = React.PropTypes

const InviteModal = React.createClass({
  propTypes: {
    visible: PropTypes.bool.isRequired,
    affairId: PropTypes.number.isRequired,
    announcementId: PropTypes.number.isRequired,
    operatorAffairId: PropTypes.number.isRequired,
    operatorRoleId: PropTypes.number.isRequired,
    onCancel: PropTypes.func.isRequired,
    filterRoles: PropTypes.array.isRequired
  },

  getDefaultProps() {
    return {
      visible: false
    }
  },

  getInitialState() {
    return {
      selectedRoles: []
    }
  },

  handleAddRole(role) {
    let selectedRoles = this.state.selectedRoles
    selectedRoles.push(role)
    this.setState({
      selectedRoles: selectedRoles
    })
  },

  handleInviteRole() {
    const { announcementId, affairId, operatorRoleId, operatorAffairId } = this.props
    const { selectedRoles } = this.state

    fetch((config.api.announcement.chat.invite), {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      affairId: operatorAffairId,
      roleId: operatorRoleId,
      resourceId: announcementId,
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        announcementId: announcementId,
        affairId: affairId,
        roleIds: selectedRoles.map((v) => v.roleId),
        operatorId: operatorRoleId,
        operatorAffairId: operatorAffairId
      })
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.handleCancel()
      } else {
        message.error('邀请角色失败，有角色已经在讨论组中！')
      }
    })
  },

  handleCancel() {
    this.props.onCancel()
  },

  render() {
    const { visible, operatorAffairId, operatorRoleId, onCancel, filterRoles } = this.props
    const { selectedRoles } = this.state

    return (
      <Modal title="邀请角色"
        visible={visible}
        onOk={this.handleInviteRole}
        onCancel={onCancel}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 50px' }}>
          <span>邀请其他角色加入：</span>
          <OfficialListComponent
            affairId={operatorAffairId}
            onAddOfficial={this.handleAddRole}
            onDeleteOfficial={() => {
            }}
            roleId={operatorRoleId}
            officialList={selectedRoles}
            showTitle
            usePrimaryRoleFilter
            filterSelf
            filterRoles={filterRoles}
          />
        </div>
      </Modal>
    )
  }
})

export default InviteModal
