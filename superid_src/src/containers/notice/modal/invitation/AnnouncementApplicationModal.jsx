import React from 'react'
import { message as Message } from 'antd'
import styles from './AffairApplicationModal.scss'
import AbstractAgreeRefuseModal from '../AbstractAgreeRefuseModal'
import config from '../../../../config'
import messageHandler from 'messageHandler'

const AffairApplicationModal = React.createClass({
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
    fetch(config.api.announcement.applicationInfo(message.get('operationId'), roleId), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'GET',
      credentials: 'include',
      roleId,
      resourceId
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.code == 0) {
          this.setState({ contentData: res.data })
        }
      })
  },
  handleCancel(){
    this.props.onHide()
  },
  handleRefuse(){
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')
    fetch(config.api.announcement.handleAgreeApply(message.get('operationId'), message.get('toAffairId'), roleId, false), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      credentials: 'include',
      roleId,
      resourceId
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code == 0) {
        Message.success('拒绝申请成功', 0.5)
        this.props.onHide()
      }
    })
  },
  handleAgree(){
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')
    fetch(config.api.announcement.handleAgreeApply(message.get('operationId'), message.get('toAffairId'), roleId, true), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      credentials: 'include',
      roleId,
      resourceId
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code == 0) {
        Message.success('同意申请成功', 0.5)
        this.props.onHide()
      }
    })
  },
  render(){
    const { contentData } = this.state
    if (contentData == null) { return null }
    if (contentData != null && contentData.content == '') {
      contentData.content = '消息无内容'
    }
    return (
      <AbstractAgreeRefuseModal
        title="处理申请"
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
})

export default AffairApplicationModal
