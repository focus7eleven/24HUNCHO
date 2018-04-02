import React from 'react'
import { message as Message } from 'antd'
import AbstractAgreeRefuseModal from '../AbstractAgreeRefuseModal'
import AuditContent from './AuditContent'
import config from '../../../../config'
import messageHandler from 'messageHandler'
import { AUDIT_MAP } from '../../auditUtil'
import styles from './AuditModal.scss'

const AUDIT_RESULT = {
  AGREE: 0,
  REFUSE: 1,
}
const AuditModal = React.createClass({
  getDefaultProps(){
    return {
      message: null,
      onHide: null,

    }
  },
  getInitialState(){
    return {
      contentData: null,
      auditType: -1,
      title: '',
    }
  },
  componentWillMount(){
    this.fetchContent()
  },
  fetchContent(){
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')
    this.setState({ isLoading: true })
    fetch(config.api.audit.content(message.get('resourceId'), message.get('operationId')), {
      method: 'GET',
      roleId,
      resourceId
    }).then((res) => res.json()).then((res) => {
      if (res.code == 0) {
        this.setState({
          contentData: res.data,
          auditType: res.data.type,
          title: res.data.formName,
          isLoading: false
        })
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
    fetch(config.api.audit.handle, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      roleId,
      resourceId,
      body: JSON.stringify({
        'roleId': roleId,
        'auditId': message.get('resourceId'),
        'personalAuditId': message.get('operationId'),
        'auditResult': AUDIT_RESULT.REFUSE,
        'reason': reason,
      }),
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code == 0) {
        Message.success('拒绝成功', 0.5)
        this.props.onHide()
      }
    })
  },
  handleAgree(){
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')

    fetch(config.api.audit.handle, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      roleId,
      resourceId,
      body: JSON.stringify({
        'roleId': roleId,
        'auditId': message.get('resourceId'),
        'personalAuditId': message.get('operationId'),
        'auditResult': AUDIT_RESULT.AGREE,
      }),
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code == 0) {
        Message.success('同意成功', 0.5)
        this.props.onHide()
      }
    })
  },
  render(){
    const { contentData, auditType, title, isLoading } = this.state
    if (isLoading) {
      return null
    }
    if (contentData != null && contentData.content == '') {
      contentData.content = '消息无内容'
    }

    return (
      <AbstractAgreeRefuseModal
        title={title}
        visible
        onCancel={() => {this.handleCancel()}}
        onRefuse={(value) => {this.handleRefuse(value)}}
        onAgree={() => {this.handleAgree()}}
        width={500}
        wrapClassName={`${styles.auditModal} ${auditType == AUDIT_MAP.CREATE_ANNOUNCEMENT && styles.announcementModal}`}
      >
        {contentData &&
          <AuditContent content={contentData} auditType={auditType} />
        }
      </AbstractAgreeRefuseModal>
    )
  },
})

export default AuditModal
