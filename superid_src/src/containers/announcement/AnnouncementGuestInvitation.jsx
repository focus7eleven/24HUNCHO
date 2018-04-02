import React, { PropTypes } from 'react'
import { Modal, TreeSelect, message } from 'antd'
import OfficialListComponent from './OfficialListComponent'
import styles from './AnnouncementGuestInvitation.scss'
import config from '../../config'

const AnnouncementGuestInvitation = React.createClass({
  propTypes: {
    agree: PropTypes.bool, // 已同意邀请
    roleId: PropTypes.number.isRequired,
    affairId: PropTypes.number.isRequired,
    fromAffairId: PropTypes.number.isRequired,
    announcementId: PropTypes.number.isRequired,
    onClose: PropTypes.func,
    noticeId: PropTypes.number,
    token: PropTypes.string,

  },

  getDefaultProps() {
    return {
      agree: false,
      visible: false,
      onClose: () => {},
    }
  },

  getInitialState() {
    return {
      agree: this.props.agree,
      mainRoleList: [],
      selectedMainRoleList: [],
      treeData: [],
      selectedAffairId: null,
    }
  },

  componentDidMount() {
    fetch(config.api.alliance.simpleTree(this.props.affair.get('allianceId')), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((data) => data.json()).then((data) => {
      if (data.code === 0) {
        data = data.data

        this.setState({
          treeData: this.getTreeData([data])
        })
      }
    })
  },

  getOfficialList() {
    const officialList = this.state.selectedMainRoleList.map((role) => ({
      roleTitle: role.roleTitle,
      username: role.username,
      roleId: role.roleId,
      avatar: role.avatar,
    }))

    return officialList
  },

  getTreeData(data) {
    data.forEach((v) => {
      v.value = v.id
      v.label = v.name

      if (v.children.length !== 0) {
        v.children = this.getTreeData(v.children)
      }
    })

    return data
  },

  handleAddOfficial(v) {
    this.state.selectedMainRoleList.push(v)
    this.setState({
      selectedMainRoleList: this.state.selectedMainRoleList,
    })
  },

  handleDeleteOfficial(v) {
    this.setState({
      selectedMainRoleList: this.state.selectedMainRoleList.filter((w) => w.roleId !== v.roleId)
    })
  },

  handleTreeValueChange(value) {
    this.setState({
      selectedAffairId: value,
    })
  },

  handleSendInvitation() {
    const body = {
      affairId: this.props.fromAffairId,
      roleIds: this.state.selectedMainRoleList.map((role) => role.roleId),
      announcementId: this.props.announcementId,
      token: this.props.token,
      noticeId: this.props.noticeId,
      toAffairIds: this.state.selectedAffairId ? [this.state.selectedAffairId] : [],
    }

    const requestList = []

    requestList.push(fetch((config.api.announcement.guest.invitation.post()), {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      affairId: this.props.fromAffairId,
      roleId: this.props.roleId,
      resourceId: this.props.announcementId,
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(body)
    }).then((res) => {
      return res.json()
    }).then((json) => {
      if (json.code === -1) {
        message.warning('角色已存在于发布客方中')
      }
    }))

    if (this.state.selectedAffairId) {
      requestList.push(fetch(config.api.announcement.guest.affairInvitation.post(), {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        affairId: this.props.fromAffairId,
        roleId: this.props.roleId,
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(body)
      }).then((res) => {
        return res.json()
      }).then(() => {
        return
      }))
    }

    Promise.all(requestList).then(() => this.props.onClose())
  },

  handleAgreeInvitation() {
    const body = {
      affairId: this.props.fromAffairId,
      announcementId: this.props.announcementId,
      token: this.props.token,
      noticeId: this.props.noticeId,
    }

    fetch(config.api.announcement.guest.agree.post(), {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      affairId: this.props.fromAffairId,
      roleId: this.props.roleId,
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(body)
    }).then((res) => {
      return res.json()
    }).then((json) => {
      if (json.code === 0) {
        this.setState({
          agree: true,
        })
        this.props.onClose()
      } else {
        message.warning(`code ${json.code}`)
      }
    })
  },
  // ant模态框的设计应该将关闭按钮和取消按钮同等对待，这里的使用不符合规范，需要判断一下是否需要关闭
  handleRejectInvitaion(e) {
    if (e.target.className.indexOf('ant-modal-close-x') != -1) {
      this.props.onClose()
      return
    }
    const body = {
      affairId: this.props.fromAffairId,
      announcementId: this.props.announcementId,
      token: this.props.token,
      noticeId: this.props.noticeId,
    }
    fetch(config.api.announcement.guest.agree.delete(), {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      affairId: this.props.fromAffairId,
      roleId: this.props.roleId,
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(body)
    }).then((res) => {
      return res.json()
    }).then((json) => {
      if (json.code === 0) {
        this.props.onClose()
      } else if (json.code === -1) {
        message.warning('角色已存在于发布客方中')
      } else {
        message.warning(`code ${json.code}`)
      }
    })
  },

  render() {
    const {
      roleId,
      affairId,
    } = this.props


    if (!this.state.agree) {
      return (
        <Modal
          title="处理邀请"
          wrapClassName={styles.container}
          visible
          onCancel={this.handleRejectInvitaion}
          maskClosable={false}
          onOk={this.handleAgreeInvitation}
          okText="同意"
          cancelText="拒绝"
        >
          {this.props.noticeItem()}
        </Modal>
      )
    } else {
      return (
        <Modal
          title="处理邀请"
          wrapClassName={styles.container}
          visible
          onCancel={this.props.onClose}
          maskClosable={false}
          onOk={this.handleSendInvitation}
          okText="发送"
          cancelText="跳过"
        >
          {/* 邀请本事务内的角色 */}
          <div className={styles.innerAffair}>
            <span className={styles.label}>邀请其他角色加入：</span>
            <OfficialListComponent
              officialList={this.getOfficialList()}
              roleId={roleId}
              affairId={affairId}
              onAddOfficial={this.handleAddOfficial}
              onDeleteOfficial={this.handleDeleteOfficial}
              showTitle
              usePrimaryRoleFilter={false}
              filterSelf
            />
          </div>

          {/* 将邀请转发给其他事务 */}
          {
            <div className={styles.redirect}>
              <span className={styles.label}>转发给其他事务： </span>
              <TreeSelect
                style={{ width: 250 }}
                treeData={this.state.treeData}
                treeDefaultExpandAll
                onChange={this.handleTreeValueChange}
              />
            </div>
          }
        </Modal>
      )
    }
  }
})

export default AnnouncementGuestInvitation
