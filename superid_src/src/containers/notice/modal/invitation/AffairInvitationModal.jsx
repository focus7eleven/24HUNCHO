import React from 'react'
import { message as Message } from 'antd'
import AbstractAgreeRefuseModal from '../AbstractAgreeRefuseModal'
import styles from './AffairInvitationModal.scss'
import config from '../../../../config'
import messageHandler from 'messageHandler'

const AffairInvitationModal = React.createClass({
  getDefaultProps(){
    return {
      message: null,
      onHide: null,
    }
  },
  getInitialState(){
    return {
      contentData: null,
    }
  },
  componentWillMount(){
    this.fetchContent()
  },
  fetchContent(){
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')
    fetch(config.api.personnel.inviteContent(roleId, resourceId), {
      method: 'GET',
      credentials: 'include',
      affairId: message.get('fromAffairId'),
      roleId,
      resourceId,
    }).then((res) => res.json()).then((res) => {
      if (res.code == 0) {
        this.setState({ contentData: res.data.showContent })
      }
    })
  },
  handleCancel(){
    this.props.onHide()
  },
  handleRefuse(reason){
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')
    fetch(config.api.notice.rejectAffairInvitation(message.get('noticeId'), reason), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      roleId,
      resourceId,
      method: 'POST',
      credentials: 'include',
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
    fetch(config.api.notice.agreeAffairInvitation(message.get('noticeId')), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      roleId,
      resourceId,
      method: 'POST',
      credentials: 'include',
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code == 0) {
        Message.success('同意邀请成功', 0.5)
        this.props.onHide()
      }
    })
  },
  render(){
    const { contentData } = this.state
    if (contentData == null) { return null }
    if (contentData.content == '') {
      contentData.content = '消息无内容'
    }
    if (contentData.permission == '') {
      contentData.permission = '无'
    }
    if (contentData.remark == '') {
      contentData.remark = '无'
    }
    return (
      <AbstractAgreeRefuseModal
        visible
        onCancel={this.handleCancel}
        onRefuse={(value) => this.handleRefuse(value)}
        onAgree={this.handleAgree}
      >
        {contentData &&
          <div>
            <div className={styles.main}>{contentData.content}</div>
            <div className={styles.addition}>
              <div className={styles.title}>要求公开的信息：</div>
              <div className={styles.content}>{contentData.permission}</div>
              <div className={styles.title}>备注：</div>
              <div className={styles.content}>{contentData.remark}</div>
            </div>
          </div>
        }
      </AbstractAgreeRefuseModal>
    )
  },
})

export default AffairInvitationModal
