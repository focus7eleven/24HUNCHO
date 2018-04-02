import React from 'react'
import styles from './ReceiveAssetModal.scss'
import { Modal, Button, Popover, InputNumber, Input, Select, Checkbox, Message } from 'antd'
import currencyFormatter from '../../utils/currencyWrap'
import urlFormat from 'urlFormat'
import config from '../../config'

export const RECEIVE_ASSET_TYPE = {
  NORMAL: 0,
  THIRD: 1
}

const Option = Select.Option
const ReceiveAssetModal = React.createClass({
  getDefaultProps(){
    return {
      visible: true,
      fetchOrder: () => {},
      type: RECEIVE_ASSET_TYPE.NORMAL
    }
  },
  getInitialState(){
    return {
      signingAll: false,
      warehouseId: '',
      chosenList: [],
      showPopover: -1,
      receiveOne: {},
      singleAmount: 1,
      singleWarehouseId: '',
      refusePopover: -1,
      refuseAmount: 1,
      refuseRemark: '',
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
    this.setState({
      signingAll: false,
      warehouseId: '',
      chosenList: [],
      showPopover: false,
    })
    this.props.callback()
  },
  handleChooseAsset(asset, e){
    let { chosenList } = this.state
    if (e.target.checked){
      chosenList.push(asset)
    }
    else {
      chosenList = chosenList.filter((v) => {return v.materialId != asset.materialId})
    }
    this.setState({
      chosenList,
    })
  },
  handleReceiveMany(){
    let materialIds = []
    this.state.chosenList.map((v) => {
      materialIds.push(v.materialId)
    })
    if (this.state.warehouseId == '' || materialIds.length == 0){
      Message.error('有必填信息未填!')
      return
    }
    let chatMsgId = null
    const { chatMsg } = this.props
    if (chatMsg) {
      chatMsgId = chatMsg._id
    }
    fetch(config.api.material.warehouse.batch_receive_material(chatMsgId), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      roleId: this.props.toRoleId,
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        orderId: this.props.orderId,
        warehouseId: this.state.warehouseId,
        materialIds: materialIds,
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.props.fetchOrder(this.props.toRoleId, this.props.orderId)
        this.setState({
          signingAll: false,
          chosenList: [],
        })
      }
    })
  },
  handleReceiveOne(asset){
    if (this.state.singleWarehouseId == ''){
      Message.error('有必填信息未填!')
      return
    }
    let params = {}
    params.orderId = this.props.orderId
    params.materialId = asset.materialId
    params.quantity = this.state.singleAmount
    if (this.props.message) {
      params.noticeId = this.props.message.get('noticeId')
    }
    let chatMsgId = null
    const { chatMsg } = this.props
    if (chatMsg) {
      chatMsgId = chatMsg._id
    }
    fetch(urlFormat(config.api.material.warehouse.receive_material(this.state.singleWarehouseId, chatMsgId), params), {
      method: 'POST',
      credentials: 'include',
      roleId: this.props.toRoleId,
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.setState({
          singleAmount: 1,
          singleWarehouseId: '',
          showPopover: -1,
        })
        this.props.fetchOrder(this.props.toRoleId, this.props.orderId)
      }
    })
  },
  handleCancelPopover(){
    this.setState({
      singleAmount: 1,
      singleWarehouseId: '',
      showPopover: -1,
    })
  },
  handleCancelRefuse(){
    this.setState({
      refuseRemark: '',
      refuseAmount: 1,
      refusePopover: -1,
    })
  },
  handleOkRefuse(asset){
    const remark = this.state.refuseRemark
    const form = new FormData()
    form.append('orderId', this.props.orderId)
    form.append('materialId', asset.materialId)
    form.append('quantity', this.state.refuseAmount)
    if (this.props.message) {
      form.append('noticeId', this.props.message.get('noticeId'))
    }

    const params = {
      orderId: this.props.orderId,
      materialId: asset.materialId,
      quantity: this.state.refuseAmount,
      remark: remark
    }

    if (this.props.message) {
      params.noticeId = this.props.message.get('noticeId')
    }
    let chatMsgId = null
    const { chatMsg } = this.props
    if (chatMsg) {
      chatMsgId = chatMsg._id
    }
    fetch(urlFormat(config.api.material.warehouse.send_back_material(chatMsgId), params), {
      method: 'POST',
      credentials: 'include',
      roleId: this.props.toRoleId,
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.setState({
          refuseRemark: '',
          refuseAmount: 1,
          refusePopover: -1,
        })
        this.props.fetchOrder(this.props.toRoleId, this.props.orderId)
      }
    })
  },
  render(){
    const { order, type } = this.props
    //是否已经全部处理完
    let showSignAll = false
    if (order.items){
      order.items.map((asset) => {
        let already = 0
        if (asset.states){
          asset.states.map((v) => {
            if (v.state == 0 || v.state == 1 || v.state == 2){
              already += v.quantity
            }
          })
        }
        if (already != asset.quantity){
          showSignAll = true
        }
      })
    }

    return (<Modal visible={this.props.visible} maskClosable={false} title="接收物资" wrapClassName={styles.receiveAssetContainer} footer={[]} onCancel={this.handleCancel}>
      <div className={styles.info}>
        <div className={styles.row}>
          <span className={styles.key}>发送方:</span>
          <span className={styles.value}>{order.fromRoleName}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.key}>备注:</span>
          <span className={styles.value}>{order.remark}</span>
        </div>
        {
         order.bridgeName
             ?
               <div className={styles.row}>
                 <span className={styles.key}>过桥方:</span>
                 <span className={styles.value}>{order.bridgeName}</span>
               </div>
             :
             null
       }
        {
         order.express
             ?
               <div className={styles.row}>
                 <span className={styles.key}>快递单号:</span>
                 <span className={styles.value}>{order.express}</span>
               </div>
             :
             null
       }
      </div>
      <div className={styles.apply}>
        {/*每一行物资申请*/}
        {
         order.items
             ?
             order.items.map((asset, k) => {
               let already = 0
               if (asset.states){
                 asset.states.map((v) => {
                   if (v.state == 0 || v.state == 1 || v.state == 2){
                     already += v.quantity
                   }
                 })
               }
               return (<div className={styles.row} key={k}>
                 {
                   this.state.signingAll
                       ?
                       asset.quantity != already
                           ?
                             <Checkbox onChange={this.handleChooseAsset.bind(null, asset)} />
                           : null
                       :
                       null
                 }
                 {
                   asset.avatar
                       ?
                         <img src={asset.avatar} className={styles.avatar}/>
                       :
                         <div className={styles.avatar} style={{ backgroundColor: '#e9e9e9' }} />
                 }

                 <div className={styles.right}>
                   <div className={styles.basic}>
                     <div className={styles.detail}>
                       <span className={styles.name}>{asset.name}</span>
                       <span className={styles.number}>x{asset.quantity}</span>
                     </div>
                     <span className={styles.price}>{currencyFormatter.format(asset.price, { code: 'CNY' })}</span>
                     {
                       this.state.signingAll
                           ?
                           null
                           :
                         (asset.quantity == already || type === RECEIVE_ASSET_TYPE.THIRD)
                               ?
                               null
                               :
                               <div className={styles.btn}>
                                 <Popover trigger="click" placement="bottomRight" visible={this.state.showPopover == asset.materialId} content={
                                   <div className={styles.signContainer}>
                                     <div className={styles.row}>
                                       <span className={styles.key}>签收数量:</span>
                                       <InputNumber min={1} max={asset.quantity - already} value={this.state.singleAmount} onChange={(value) => {
                                         this.setState({ singleAmount: value })
                                       }}
                                       />
                                       <span className={styles.unit}>个</span>
                                     </div>
                                     {/*<div className={styles.row}>*/}
                                     {/*<span className={styles.key}>签收价值:</span>*/}
                                     {/*<Input value={this.state.singlePrice} onChange={(e)=>{this.setState({singlePrice:e.target.value})}} />*/}
                                     {/*</div>*/}
                                     <div className={styles.row}>
                                       <span className={styles.key}>签收价值:</span>
                                       <span className={styles.key}>{currencyFormatter.format(this.state.singleAmount * asset.price / asset.quantity, { code: asset.currency })}</span>
                                     </div>
                                     <div className={styles.row}>
                                       <span className={styles.key}>接收仓库:</span>
                                       <Select onChange={(value) => {
                                         this.setState({ singleWarehouseId: value })
                                       }} value={this.state.singleWarehouseId}
                                       >
                                         {
                                           this.props.warehouseList.map((v, k) => {
                                             return <Option key={k} value={v.id.toString()}>{v.name}{v.type == 10 ? '的仓库' : v.type == 0 ? '的公共仓库' : '场景仓库'}</Option>
                                           })
                                         }
                                       </Select>
                                     </div>
                                     <div className={styles.footer}>
                                       <span className={styles.cancel} onClick={this.handleCancelPopover}>取消</span>
                                       <span className={styles.ok} onClick={this.handleReceiveOne.bind(null, asset)}>确定</span>
                                     </div>
                                   </div>
                                 }
                                 >
                                   <Button onClick={() => {
                                     this.setState({ showPopover: asset.materialId })
                                   }}
                                   >签收</Button>
                                 </Popover>
                                 <Popover trigger="click" placement="bottomRight" visible={this.state.refusePopover == asset.materialId} content={
                                   <div className={styles.signContainer}>
                                     <div className={styles.row}>
                                       <span className={styles.key}>退回数量:</span>
                                       <InputNumber min={1} max={asset.quantity - already} value={this.state.refuseAmount} onChange={(value) => {
                                         this.setState({ refuseAmount: value })
                                       }}
                                       />
                                       <span className={styles.unit}>个</span>
                                     </div>
                                     <div className={styles.row}>
                                       <span className={styles.key}>备注:</span>
                                       <Input value={this.state.refuseRemark} onChange={(e) => {
                                         this.setState({ refuseRemark: e.target.value })
                                       }}
                                       />
                                     </div>
                                     <div className={styles.footer}>
                                       <span className={styles.cancel} onClick={this.handleCancelRefuse}>取消</span>
                                       <span className={styles.ok} onClick={this.handleOkRefuse.bind(null, asset)}>确定</span>
                                     </div>
                                   </div>
                                 }
                                 >
                                   <Button type="ghost" onClick={() => {
                                     this.setState({ refusePopover: asset.materialId })
                                   }}
                                   >退回</Button>
                                 </Popover>
                               </div>
                     }
                   </div>
                   {
                     asset.states
                         ?
                         asset.states.map((log, k) => {
                           return (<div className={styles.log} key={k}>
                             {
                               log.state == 0
                                   ?
                                     <span className={styles.accept}>{this.getTime(log.time)}&nbsp;签收{log.quantity}{asset.unit},&nbsp;价值{currencyFormatter.format(log.cost, { code: asset.currency })},签收完成</span>
                                   :
                                   log.state == 1
                                       ?
                                         <span className={styles.refuse}>{this.getTime(log.time)}&nbsp;退回{log.quantity}{asset.unit},&nbsp;价值{currencyFormatter.format(log.cost, { code: asset.currency })},待发送方确认</span>
                                       :
                                       log.state == 2
                                           ?
                                             <span className={styles.refuse}>{this.getTime(log.time)}&nbsp;退回{log.quantity}{asset.unit},&nbsp;价值{currencyFormatter.format(log.cost, { code: asset.currency })},已确认</span>
                                           :
                                           log.state == 3
                                               ?
                                                 <span className={styles.refuse}>{this.getTime(log.time)}&nbsp;退回{log.quantity}{asset.unit},&nbsp;价值{currencyFormatter.format(log.cost, { code: asset.currency })},已拒绝</span>
                                               : log.state == 4
                                               ?
                                                 <span>{this.getTime(log.time)}&nbsp;接受退回{log.quantity}{asset.unit}</span>
                                               :
                                               log.state == 5
                                                   ?
                                                     <span>{this.getTime(log.time)}&nbsp;拒绝退回{log.quantity}{asset.unit}</span>
                                                   :
                                                   null
                             }
                           </div>)
                         })
                         :
                         null
                   }
                 </div>

               </div>)
             })
             : null
       }


        {
         this.state.signingAll
             ?
               <div className={styles.isSigningAll}>
                 <span className={styles.key}>接收仓库:</span>
                 <Select onChange={(value) => {
                   this.setState({ warehouseId: value })
                 }} value={this.state.warehouseId}
                 >
                   {
                   this.props.warehouseList.map((v, k) => {
                     return <Option key={k} value={v.id.toString()}>{v.name}{v.type == 10 ? '的仓库' : v.type == 0 ? '的公共仓库' : '场景仓库'}</Option>
                   })
                 }
                 </Select>
                 <div className={styles.btn}>
                   <span className={styles.cancel} onClick={() => {
                     this.setState({ signingAll: false })
                   }}
                   >取消</span>
                   <span className={styles.ok} onClick={this.handleReceiveMany}>确认</span>
                 </div>
               </div>
             :
           (showSignAll && type !== RECEIVE_ASSET_TYPE.THIRD)
             ?
               <div className={styles.signAll}>
                 <span onClick={() => {
                   this.setState({ signingAll: true })
                 }}
                 >批量签收</span>
               </div>
             : null
       }
      </div>
    </Modal>)
  }
})

export default ReceiveAssetModal
