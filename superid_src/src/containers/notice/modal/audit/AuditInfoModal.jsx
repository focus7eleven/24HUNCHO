import React from 'react'
import { Modal } from 'antd'
import moment from 'moment'
import styles from './AuditInfoModal.scss'
import config from '../../../../config'
import { AUDIT_RESULT, getAuditMap } from '../../auditUtil'

import AuditContent from './AuditContent'


const AUDIT_MAP = getAuditMap()
const AuditInfoModal = React.createClass({
  getDefaultProps(){
    return {
      message: null,
      onHide: null,
      title: '',
    }
  },
  getInitialState(){
    return {
      isLoading: true,
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
    const url = message.get('mode') == 'send' ?
      config.api.audit.contentSender(resourceId)
    :
      config.api.audit.content(resourceId, message.get('operationId'))
    fetch(url, {
      method: 'GET',
      roleId,
      resourceId
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.code == 0) {
          this.setState({
            contentData: res.data,
            isLoading: false,
            auditType: res.data.type,
            title: res.data.formName,
          })
        }
      })
  },
  handleCancel(){
    this.props.onHide()
  },
  /* 获取格式化时间 */
  getFormatTime(time){
    return moment(time).format('YYYY-MM-DD HH:mm')
  },
  renderFooter(info){
    const auditInfo = info[0]
    const value = auditInfo.value
    return (
      <div className={styles.row}>
        <div className={styles.label}>{auditInfo.key}</div>
        <div className={styles.value}>
          <div className={styles.time}>{this.getFormatTime(value.time)}</div>
          <div className={styles.role}>{value.roleInfo}</div>
          {value.result == AUDIT_RESULT.AGREE ?
            <div className={styles.resultAgree}>已同意</div>
          : (
            <div className={styles.resultRefuse}>已拒绝</div>
          )}
          {value.result == AUDIT_RESULT.REFUSE &&
            <div className={styles.reasonWrapper}>
              <span>拒绝理由:</span>
              <span className={styles.reason}>{value.reason == null ? '无' : value.reason}</span>
            </div>
          }
        </div>
      </div>
    )
  },
  render(){
    const { contentData, isLoading, auditType, title } = this.state
    if (isLoading){
      return null
    }
    const footer = auditType == AUDIT_MAP.CREATE_ANNOUNCEMENT ?
      this.renderFooter(contentData.form.filter((v) => {return v.componentType === 6})) : <div/>
    return (
      <Modal
        title={title}
        visible
        onCancel={() => {this.handleCancel()}}
        footer={footer}
        wrapClassName={`${styles.container} ${auditType == AUDIT_MAP.CREATE_ANNOUNCEMENT && styles.announcementModal}`}
        width={500}
      >
        {contentData &&
          <AuditContent content={contentData} auditType={auditType} />
        }
      </Modal>
    )
  },
})

export default AuditInfoModal
