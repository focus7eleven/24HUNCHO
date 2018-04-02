import React from 'react'
import { connect } from 'react-redux'
import { message as Message, Modal, Icon } from 'antd'
import OfficialListComponent from '../../../announcement/OfficialListComponent'
import AffairTreeSelect from '../../../../components/select/AffairTreeSelect'
import AbstractAgreeRefuseModal from '../AbstractAgreeRefuseModal'
import { fromJS } from 'immutable'
import styles from './AnnouncementInvitationModal.scss'
import config from '../../../../config'
import messageHandler from 'messageHandler'

const PROCESS = {
  DEFAULT: 0,
  DISTRIBUTE: 1,
}

const AnnouncementInvitationModal = React.createClass({
  getDefaultProps(){
    return {
      message: null,
      onHide: null,
    }
  },
  getInitialState(){
    return {
      contentData: null,
      process: PROCESS.DEFAULT,
      mainRoleList: [],
      selectedMainRoleList: [],
      selectedAffairList: [],
    }
  },
  componentWillMount(){
    this.fetchContent()
  },
  fetchContent(){
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')
    const operationId = this.props.message.get('operationId')
    fetch(config.api.announcement.inviteContent(operationId, roleId), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.message.get('fromAffairId'),
      roleId: roleId,
      resourceId
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          contentData: json.data,
        })
      }
    })
  },
  handleCancel(){
    this.props.onHide()
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
  onChangeSelectAffairs(affairList) {
    this.setState({ selectedAffairList: affairList })
  },
  handleRefuse(reason){
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')
    fetch(config.api.announcement.guest.agree.delete(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      credentials: 'include',
      affairId: message.get('toAffairId'),
      roleId: roleId,
      resourceId,
      body: JSON.stringify({
        affairId: message.get('toAffairId'),
        fromAffairId: message.get('fromAffairId'),
        announcementId: message.get('resourceId'),
        token: '',
        noticeId: message.get('noticeId'),
        reason: reason,
        roleId: roleId,
      }),
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code == 0) {
        Message.success('拒绝邀请成功', 0.5)
        this.props.onHide()
      }
    })
  },
  handleAgree(){
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')

    fetch(config.api.announcement.guest.agree.post(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      credentials: 'include',
      affairId: message.get('toAffairId'),
      roleId: roleId,
      resourceId,
      body: JSON.stringify({
        affairId: message.get('toAffairId'),
        fromAffairId: message.get('fromAffairId'),
        announcementId: message.get('resourceId'),
        token: '',
        noticeId: message.get('noticeId'),
        roleId: roleId,
      }),
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code == 0) {
        Message.success('同意邀请成功')
        this.setState({
          process: PROCESS.DISTRIBUTE,
        })
      }
    })
  },
  handleSendInvitation() {
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')
    const body = {
      affairId: message.get('fromAffairId'),
      toRoleIds: this.state.selectedMainRoleList.map((role) => role.roleId),
      announcementId: message.get('resourceId'),
      token: '',
      operationId: message.get('operationId'),
      toAffairIds: this.state.selectedAffairList,
      roleId: roleId,
    }

    fetch(config.api.announcement.guest.affairInvitation.post(), {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      affairId: message.get('toAffairId'),
      roleId: roleId,
      resourceId,
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(body)
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        Message.success('发送成功', 0.5)
        this.props.onHide()
      }
    })
  },
  renderDefaultModal(){
    const { contentData } = this.state
    if (contentData == null) { return null }
    if (contentData != null && contentData.content == '') {
      contentData.content = '消息无内容'
    }
    return (
      <AbstractAgreeRefuseModal
        visible
        onCancel={() => {this.handleCancel()}}
        onRefuse={(value) => {this.handleRefuse(value)}}
        onAgree={() => {this.handleAgree()}}
      >
        {contentData &&
          <div>
            <div className={styles.main}>{contentData}</div>
          </div>
        }
      </AbstractAgreeRefuseModal>
    )
  },
  renderDistributeModal(){
    const { roleId } = this.props
    const affairId = this.props.message.get('toAffairId')
    const allianceId = this.props.affairList.find((affair) => affair.get('affairId') == affairId).get('allianceId')
    return (
      <Modal
        title="处理邀请"
        wrapClassName={styles.container}
        visible
        onCancel={this.props.onHide}
        maskClosable={false}
        onOk={this.handleSendInvitation}
        okText="发送"
        cancelText="跳过"
      >
        <div	className={styles.info}>
          <Icon type="check-circle" />
          <span>您已成功加入到发布中！ </span>
        </div>
        {/* 邀请本事务内的角色 */}
        <div className={styles.innerAffair}>
          <span className={styles.label}>邀请其他角色加入：</span>
          <OfficialListComponent
            officialList={this.state.selectedMainRoleList.map((role) => ({
              roleTitle: role.roleTitle,
              username: role.username,
              roleId: role.roleId,
              avatar: role.avatar,
            }))}

            roleId={roleId}
            affairId={affairId}
            onAddOfficial={this.handleAddOfficial}
            onDeleteOfficial={this.handleDeleteOfficial}
            showTitle
            isColumnOrdered
            usePrimaryRoleFilter={false}
            filterSelf
          />
        </div>

        {/* 将邀请转发给其他事务 */}
        {
          <div className={styles.redirect}>
            <span className={styles.label}>转发给其他事务： </span>
            <AffairTreeSelect
              affair={fromJS({
                id: affairId,
                allianceId: allianceId,
              })}
              onChange={this.onChangeSelectAffairs}
              defaultSelectAll={false}
              filterSelf
            />
          </div>
        }
      </Modal>
    )
  },
  render(){
    const { process } = this.state
    const modal = (process == PROCESS.DEFAULT) ? this.renderDefaultModal() : this.renderDistributeModal()
    return (
      modal
    )
  },
})
function mapStateToProps(state) {
  return {
    roleList: state.getIn(['user', 'roles']),
    affairList: state.getIn(['affair', 'affairList']),
  }
}
export default connect(mapStateToProps)(AnnouncementInvitationModal)
