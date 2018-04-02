import React from 'react'
import styles from './AbstractInvitationModal.scss'
import { Modal, Button, Popover, Input } from 'antd'

const AbstractInvitationModal = React.createClass({
  getDefaultProps(){
    return {
      visible: false,
      onCancel: null,
      onRefuse: null,
      onAgree: null,
      title: '处理邀请',
    }
  },
  getInitialState(){
    return {
      popoverVisible: false,
      reason: null,
    }
  },
  handleCancel(){
    this.props.onCancel()
  },
  handleRefuse(){
    const { reason } = this.state
    this.props.onRefuse(reason)
  },
  handleAgree(){
    this.props.onAgree()
  },
  renderRefuseContent(){
    return (
      <div className={styles.refuseContainer}>
        <div className={styles.title}>拒绝理由：</div>
        <div className={styles.content}>
          <Input type="textarea" rows={4} placeholder="无" onChange={(e) => {this.setState({ reason: e.target.value })}}/>
        </div>
        <div className={styles.buttonGroup}>
          <div className={styles.secondary} onClick={() => {this.setState({ popoverVisible: false })}}>取消</div>
          <div className={styles.primary} onClick={() => {this.handleRefuse()}}>确定</div>
        </div>
      </div>
    )
  },
  render(){
    const { popoverVisible } = this.state
    return (
      <Modal ref="modal"
        visible={this.props.visible}
        title={this.props.title} onOk={this.handleOk} onCancel={() => this.handleCancel()}
        maskClosable={false}
        wrapClassName={styles.container}
        footer={[
          <Popover
            visible={popoverVisible}
            onVisibleChange={(visible) => {this.setState({ popoverVisible: visible })}}
            placement="bottomRight"
            key="refuse"
            overlayClassName={styles.popover}
            content={this.renderRefuseContent()}
            trigger="click"
          >
            <Button type="ghost" size="large">
              拒绝
            </Button>
          </Popover>,
          <Button key="submit" type="primary" size="large" onClick={() => this.handleAgree()}>
            同意
          </Button>,
        ]}
      >
        {this.props.children}
      </Modal>
    )
  },
})

export default AbstractInvitationModal
