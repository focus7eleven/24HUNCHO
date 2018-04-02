import React from 'react'
import { message as Message } from 'antd'
import AbstractAgreeRefuseModal from '../AbstractAgreeRefuseModal'
import styles from './AcquireMaterialModal.scss'
import config from '../../../../config'
import messageHandler from 'messageHandler'
import urlFormat from 'urlFormat'
import currencyFormatter from 'utils/currencyWrap'
import moment from 'moment'
import { HANDLE_STATE } from 'actions/notification'

const AcquireMaterialModal = React.createClass({
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
    fetch(urlFormat(config.api.material.acquireInfo(), {
      operationId: message.get('operationId')
    }), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      roleId: roleId,
      resourceId,
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((res) => {
      if (res.code == 0) {
        this.setState({ contentData: res.data })
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

    fetch(urlFormat(config.api.material.acquire.handle(), {
      messageId: message.get('noticeId'),
      agree: false,
      reason: reason,
    }), {
      roleId: roleId,
      resourceId,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        'bridgeId': 0,
        'context': 'string',
        'express': 'string',
        'materials': (this.state.contentData.applicationMaterials || []).map((material) => ({
          'amount': material.quantity,
          'id': material.materialId,
          'price': material.price
        })),
        'remark': 'string',
        'taskId': 0,
        'toRoleId': message.get('toRoleId')
      })
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

    fetch(urlFormat(config.api.material.acquire.handle(), {
      messageId: message.get('noticeId'),
      agree: true,
      reason: '',
    }), {
      roleId: roleId,
      resourceId,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        'bridgeId': 0,
        'context': 'string',
        'express': 'string',
        'materials': (this.state.contentData.applicationMaterials || []).map((material) => ({
          'amount': material.quantity,
          'id': material.materialId,
          'price': material.price
        })),
        'remark': 'string',
        'taskId': 0,
        'toRoleId': message.get('toRoleId')
      })
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code == 0) {
        Message.success('同意成功', 0.5)
        this.props.onHide()
      }
    })
  },
  render(){
    const { message } = this.props
    const { contentData } = this.state
    if (contentData == null) {
      return null
    }
    const handleState = message.get('state')
    return (
      <AbstractAgreeRefuseModal
        title="处理申请物资"
        visible
        onCancel={() => {this.handleCancel()}}
        onRefuse={(value) => {this.handleRefuse(value)}}
        onAgree={() => {this.handleAgree()}}
        wrapClassName={`${styles.modal} ${handleState != HANDLE_STATE.UNHANDLED && styles.hideFooter}`}
      >
        <div className={styles.labelControl}>
          <div className={styles.label}>申请人：</div>
          <div className={styles.control}>{contentData.applicationName}</div>
        </div>
        <div className={styles.labelControl}>
          <div className={styles.label}>申请时间：</div>
          <div className={styles.control}>{moment(contentData.applicationTime).format('YYYY-MM-DD HH:mm')}</div>
        </div>
        {(handleState == HANDLE_STATE.AGREE || handleState == HANDLE_STATE.REFUSE) &&
          <div className={styles.labelControl}>
            <div className={styles.label}>处理结果：</div>
            <div className={styles.control}>
              {handleState == HANDLE_STATE.AGREE ?
                <span>已同意</span>
              : (
                <span>已拒绝</span>
              )}
            </div>
          </div>
        }
        <div className={styles.listWrapper}>
          {(contentData.applicationMaterials || []).map((material) => {
            return (
              <div key={material.materialId} className={styles.row}>
                <div className={styles.left}>
                  <div className={styles.image}>
                    <img src={material.logoUrl} alt="物资图片"/>
                  </div>
                  <div className={styles.name}>
                    {material.name}
                  </div>
                  <div className={styles.amount}>
                    ×{material.quantity}
                  </div>
                </div>
                <div className={styles.right}>
                  {currencyFormatter.format(material.price, { code: material.currency })}
                </div>
              </div>
            )
          })}
        </div>
      </AbstractAgreeRefuseModal>

    )
  },
})

export default AcquireMaterialModal
