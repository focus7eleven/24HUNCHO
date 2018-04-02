import React from 'react'
import styles from './SendAssetModal.scss'
import { Modal, Input, Select, InputNumber, Message } from 'antd'
import { connect } from 'react-redux'
import config from '../../config'
import messageHandler from 'messageHandler'

const Option = Select.Option
const SendAssetModal = React.createClass({
  getInitialState(){
    return {
      amount: 1,
      //快递单号
      express: '',
      remark: '',
      bridgeId: '',
      toRoleId: '',
      price: '',
    }
  },
  getDefaultProps(){
    return {
      visible: true,
      sendingAsset: {},

    }
  },
  handleOk(){
    const { sendingAsset, affair } = this.props
    if (this.state.price == '' || (this.state.toRoleId == '') || (this.state.remark == '')){
      Message.error('信息填写不完整!')
      return
    }
    fetch(config.api.order.send_material(affair.get('roleId')), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-SIMU-AffairId': affair.get('id'),
        'X-SIMU-RoleId': affair.get('roleId')
      },
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      body: JSON.stringify({
        materials: [{ id: sendingAsset.id, amount: this.state.amount, price: this.state.price }],
        toRoleId: this.state.toRoleId,
        remark: this.state.remark,
        bridgeId: this.state.bridgeId,
        express: this.state.express,
        taskId: 0,
        context: '',
        chat: false
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        Message.success('发送成功')
        this.handleCancel()
      } else if (json.code == 20000) {
        this.handleCancel()
      }
    })
  },
  handleCancel(){
    this.setState({
      amount: 1,
      express: '',
      remark: '',
      bridgeId: '',
      toRoleId: '',
      price: '',
    })
    this.props.callback()
  },
  render(){
    const { sendingAsset, rolelist, affair } = this.props
    let sendlist = []
    let bridgelist = []
    if (rolelist){
      const allAffairRoles = rolelist.roles.concat(rolelist.guestRoles).concat(rolelist.allianceRoles)
      sendlist = allAffairRoles.filter((v) => {return v.roleId != affair.get('roleId')})
      bridgelist = allAffairRoles.filter((v) => {return v.belongAffairId != affair.get('id')})
    }
    return (
      <Modal visible={this.props.visible} onOk={this.handleOk} onCancel={this.handleCancel} maskClosable={false} wrapClassName={styles.sendAssetContainer} title="发送物资">
        <div className={styles.assetName}>
          <span className={styles.key}>物资名:</span>
          <span className={styles.value}>{sendingAsset.name}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>数量:</span>
          <InputNumber value={this.state.amount} min={1} max={sendingAsset.quantity - sendingAsset.locked} onChange={(value) => {this.setState({ amount: value })}}/>
          <span className={styles.unit}>库存: {sendingAsset.quantity - sendingAsset.locked}{sendingAsset.unit}</span>
          <span className={styles.require}>*</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key} >价值:</span>
          <Input placeholder={this.state.amount * sendingAsset.price} onChange={(e) => {this.setState({ price: e.target.value })}} value={this.state.price}/>
          <span className={styles.require}>*</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>接收方:</span>
          <Select onChange={(value) => {this.setState({ toRoleId: value })}} value={this.state.toRoleId}>
            {
              sendlist.map((v, k) => {
                return <Option key={k} value={v.roleId.toString()}>{`${v.roleTitle}-${v.username}`}</Option>
              })
            }
          </Select>
          <span className={styles.require}>*</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>备注:</span>
          <Input onChange={(e) => {this.setState({ remark: e.target.value })}} value={this.state.remark} />
          <span className={styles.require}>*</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>过桥方:</span>
          <Select onChange={(value) => {this.setState({ bridgeId: value })}} value={this.state.bridgeId}>
            {
              bridgelist.map((v, k) => {
                return <Option key={k} value={v.roleId.toString()}>{`${v.roleTitle}-${v.username}`}</Option>
              })
            }
          </Select>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>快递单号:</span>
          <Input onChange={(e) => {this.setState({ express: e.target.value })}} value={this.state.express} />
        </div>
      </Modal>
    )
  }
})

function mapStateToProps(state, props){
  return {
    rolelist: state.getIn(['affair', 'affairAttender', 'currentRoles', props.affair.get('id')]),
  }
}
function mapDispatchToProps(){
  return {}
}
export default connect(mapStateToProps, mapDispatchToProps)(SendAssetModal)
