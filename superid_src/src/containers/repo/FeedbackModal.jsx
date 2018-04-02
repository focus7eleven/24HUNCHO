import React from 'react'
import { Modal, Button, Message } from 'antd'
import styles from './FeedbackModal.scss'
import currencyFormatter from '../../utils/currencyWrap'
import config from '../../config'
import urlFormat from 'urlFormat'

export const FEEDBACK_TYPE = {
  NORMAL: 0,
  CHAT: 1
}

const FeedbackModal = React.createClass({
  getDefaultProps(){
    return {
      visible: true,
      showAsset: {},
      showOrder: {},
      callback: () => {},
      type: FEEDBACK_TYPE.NORMAL,
      message: null,
    }
  },
  getTime(str){
    let date = new Date(str)
    let Y = date.getFullYear() + '年'
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '月'
    let D = date.getDate() + '日 '
    let H = date.getHours() + ':'
    let Min = date.getMinutes() < 10 ? '0' + (date.getMinutes()) : date.getMinutes()
    return Y + M + D + H + Min
  },
  handleCancel(){
    this.props.callback()
  },
  handleBackMaterial(agree, state, materialId){
    // message 是消息中心的消息，如果是从消息中心使用的该组件，则需要传入messageId
    const { type, affair, showAsset, orderId, fetchOrderDetail, message } = this.props
    const isNormal = type === FEEDBACK_TYPE.NORMAL

    let params = {}
    params.roleId = affair.get('roleId')
    params.time = state.time
    params.orderId = isNormal ? showAsset.orderId : orderId
    params.materialId = materialId
    params.agree = agree
    if (message != null) {
      params.msgId = message.get('noticeId')
    }
    let chatMsgId = null
    const { chatMsg } = this.props
    if (chatMsg) {
      chatMsgId = chatMsg._id
    }
    fetch(urlFormat(config.api.order.handle_back_material(chatMsgId), params), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        isNormal ? fetchOrderDetail(showAsset) : fetchOrderDetail(affair.get('roleId'), orderId)
      }
      else {
        Message.error('请求失败')
      }
    })
  },
  render(){
    const { type, order, showAsset, visible } = this.props
    let assetList = []

    if (type === FEEDBACK_TYPE.NORMAL) {
      if (order.items) {
        order.items.map((v) => {
          if (v.materialId == showAsset.materialId) {
            assetList.push(v)
          }
        })
      }
    } else {
      assetList = order.items
    }


    return (
      <Modal maskClosable={false} visible={visible} wrapClassName={styles.feedbackContainer} title="物资接收反馈" footer={[]} onCancel={this.handleCancel}>
        <div className={styles.top}>
          <div className={styles.row}>
            <span className={styles.key}>接收方:</span>
            <span className={styles.value}>{order.toRoleName}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.key}>备注:</span>
            <span className={styles.value}>{order.remark}</span>
          </div>
          {order.bridgeName ? (
            <div className={styles.row}>
              <span className={styles.key}>过桥方:</span>
              <span className={styles.value}>{order.bridgeName}</span>
            </div>
          ) : null
          }

          <div className={styles.row}>
            <span className={styles.key}>快递单号:</span>
            <span className={styles.value}>{order.express}</span>
          </div>
        </div>
        <div className={styles.bottom}>

          {assetList.map((asset, index) => {
            return (
              <div className={styles.assetItem} key={index}>
                {asset.avatar ?
                  <img src={asset.avatar} className={styles.avatar}/>
                :
                  <div className={styles.avatar} style={{ backgroundColor: '#e9e9e9' }} />
                }
                <div className={styles.detail}>
                  <div className={styles.info}>
                    <div>
                      <span className={styles.name}>{asset.name ? asset.name : null}</span>
                      <span className={styles.quantity}>x{asset.quantity ? asset.quantity : null}</span>
                    </div>
                    <span className={styles.price}>{currencyFormatter.format(asset.price, { code: 'CNY' })}</span>
                  </div>
                  {asset.states ?
                    asset.states.map((v, k) => {
                      return (
                        <div className={styles.log} key={k}>
                          {v.state == 0 ?
                            <span className={styles.accept}>{this.getTime(v.time)}&nbsp;签收{v.quantity}{asset.unit},&nbsp;价值{currencyFormatter.format(v.cost, { code: asset.currency })}</span>
                          :
                          v.state == 1 ?
                            <div className={styles.operate}>
                              <span className={styles.refuse}>{this.getTime(v.time)}&nbsp;退回{v.quantity}{asset.unit},&nbsp;价值{currencyFormatter.format(v.cost, { code: asset.currency })},&nbsp;备注:{v.remark}</span>
                              <Button type="ghost" onClick={this.handleBackMaterial.bind(null, true, v, asset.materialId)}>同意</Button>
                              <Button type="ghost" onClick={this.handleBackMaterial.bind(null, false, v, asset.materialId)}>拒绝</Button>
                            </div>
                          :
                          v.state == 2 ?
                            <div className={styles.operate}>
                              <span className={styles.refuse}>{this.getTime(v.time)}&nbsp;退回{v.quantity}{asset.unit}价值{currencyFormatter.format(v.cost, { code: asset.currency })},&nbsp;备注:{v.remark},已同意</span>
                            </div>
                          :
                          v.state == 3 ?
                            <div className={styles.operate}>
                              <span className={styles.refuse}>{this.getTime(v.time)}&nbsp;退回{v.quantity}{asset.unit}价值{currencyFormatter.format(v.cost, { code: asset.currency })},&nbsp;备注:{v.remark},已拒绝</span>
                            </div>
                          :
                          v.state == 4 ?
                            <span>{this.getTime(v.time)}&nbsp;接受退回{v.quantity}{asset.unit}</span>
                          :
                          v.state == 5 ?
                            <span>{this.getTime(v.time)}&nbsp;拒绝退回{v.quantity}{asset.unit}</span>
                          : null
                          }
                        </div>
                      )
                    })
                  : null
                  }
                  <div className={styles.log} />
                </div>
              </div>
            )
          })}
        </div>
      </Modal>
    )
  }
})

export default FeedbackModal
