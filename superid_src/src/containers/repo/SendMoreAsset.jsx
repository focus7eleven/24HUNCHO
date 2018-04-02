import React from 'react'
import styles from './SendMoreAsset.scss'
import { Modal, Input, Checkbox, InputNumber, Select, message } from 'antd'
import { SearchIcon, DeleteIcon } from 'svg'
import currencyFormatter from '../../utils/currencyWrap'
import config from '../../config'
import { WAREHOUSE_TYPE } from './WarehouseList'
import { List, Map, fromJS } from 'immutable'
import messageHandler from '../../utils/messageHandler'

const Constants = window.SocketClient.Constants
const Option = Select.Option

export const SEND_ASSET_TYPE = {
  NORMAL: 0,
  CHAT: 1
}

const SendMoreAsset = React.createClass({
  getDefaultProps(){
    return {
      visible: true,
      type: SEND_ASSET_TYPE.NORMAL
    }
  },

  getInitialState(){
    return {
      chosenList: [],
      toRoleId: '',
      bridgeId: '',
      express: '',
      remark: '',
      warehouseList: List(),
      materials: this.props.materials, //供选择的物资列表
      warehouseId: this.props.warehouseId, //选择的仓库id(之前为-1，现在将所点击仓库的id直接传过来了）
    }
  },

  componentWillMount() {
    //聊天窗口发送物资，需要获得所有有权限的仓库
    if (this.props.type === SEND_ASSET_TYPE.CHAT) {
      this.fetchWarehouseList(this.props)
    }
  },

  componentDidUpdate(preProps, preState) {
    //更改仓库，重新获取物资列表
    if (preState.warehouseId != this.state.warehouseId) {
      this.fetchFetchMaterialList()
    }
  },
  componentWillReceiveProps(nextProps){
    this.setState({ materials: nextProps.materials })
  },
  //获取仓库列表
  fetchWarehouseList() {
    const { affair } = this.props

    fetch(config.api.material.warehouse.get(), {
      credentials: 'include',
      method: 'GET',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const { affairWarehouses, childrenAffairWarehouses } = res.data
        const warehouseList = WAREHOUSE_TYPE.SCENES.reduce((reduce, scene) => reduce.concat(affairWarehouses[scene]), List())
        .concat(affairWarehouses[WAREHOUSE_TYPE.PUBLIC])
        .concat(affairWarehouses[WAREHOUSE_TYPE.ROLE])
        .concat(childrenAffairWarehouses).filter((warehouse) => warehouse)

        this.setState({
          warehouseList,
          warehouseId: warehouseList.size ? String(warehouseList.get(0).id) : '-1'
        })
      }
    })
  },

  //根据仓库获取物资列表
  fetchFetchMaterialList() {
    const { affair } = this.props
    const { warehouseId } = this.state

    if (warehouseId === '-1') return

    fetch(config.api.material.warehouse.materialList.get(warehouseId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const data = fromJS(res.data)

        this.setState({
          materials: data.map((v, k) => {
            return Map({
              id: v.get('id'),
              name: v.get('name'),
              picture: v.get('image'),
              price: v.get('price'),
              quantity: v.get('quantity'),
              locked: v.get('locked'),
              typeCode: k,
              amount: 1,
            })
          })
        })
      }
    })
  },

  handleSelectWarehouse(value) {
    this.setState({
      warehouseId: value
    })
  },

  handleOk() {
    let materials = []
    const { context } = this.props
    const { chosenList } = this.state
    let back = false
    chosenList.map((v) => {
      if (!v.get('totalPrice')){
        back = true
      }
      materials.push({
        id: v.get('id'),
        amount: v.get('amount'),
        price: v.get('totalPrice'),
      })
    })
    if (back || this.state.toRoleId == '' || this.state.remark == '') {
      message.error('有必填选项未填')
      return
    }
    fetch(config.api.order.send_material(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      body: JSON.stringify({
        materials: materials,
        toRoleId: this.state.toRoleId,
        bridgeId: this.state.bridgeId,
        remark: this.state.remark,
        express: this.state.express,
        taskId: 0,
        chat: (context === '会话')
      })
    }).then((res) => res.json()).then((res) => {
      if (res.code == 0) {
        if (this.props.onSend) {
          const { rolelist } = this.props
          const des = rolelist.roles.find((v) => v.roleId == this.state.toRoleId)
          res.data.map((body) => {
            this.props.onSend(JSON.stringify({
              orderId: body.orderId,
              name: des.roleTitle + '-' + des.username,
              toUserId: des.userId,
              toRoleId: parseInt(des.roleId ? des.roleId : des.id),
              currencyType: body.currency,
              remark: body.remark,
              amount: body.total,
              state: 0
            }), Constants.CHAT_SUBTYPE.MATERIAL.SEND)
          })
        }
        this.handleCancel()
      }
      else {
        message.error('发送失败')
      }
    })
  },

  handleCancel() {
    this.setState({
      chosenList: [],
      toRoleId: '',
      express: '',
      remark: '',
      bridgeId: '',
    })
    setTimeout(this.props.callback, 0)
  },

  handleChooseAsset(asset, e) {
    let { chosenList } = this.state
    if (e.target.checked){
      chosenList.push(asset.set('totalPrice', asset.get('amount') * asset.get('price'))
      )
    }
    else {
      chosenList = chosenList.filter((v) => {return v.get('id') != asset.get('id')})
    }
    this.setState({
      chosenList
    })
  },

  handleDeleteAsset(asset) {
    this.setState({
      chosenList: this.state.chosenList.filter((v) => {return v.get('id') != asset.get('id')})
    })
  },

  handleChangeAmount(asset, value) {
    let { chosenList } = this.state
    chosenList = chosenList.map((v) => {
      if (v.get('id') == asset.get('id')){
        return v.set('amount', value).set('totalPrice', value * asset.get('price'))
      }
      else {
        return v
      }
    })
    this.setState({
      chosenList
    })
  },

  handleChangeTotal(asset, e) {
    let { chosenList } = this.state
    chosenList = chosenList.map((v) => {
      if (v.get('id') == asset.get('id')){
        return v.set('totalPrice', e.target.value)
      }
      else {
        return v
      }
    })
    this.setState({
      chosenList
    })
  },


  //根据仓库类型获得仓库名称
  renderWarehouseName(warehouse) {
    switch (warehouse.type) {
      case WAREHOUSE_TYPE.PUBLIC:
        return `${warehouse.name}公共仓库`
      case WAREHOUSE_TYPE.ROLE:
        return `${warehouse.name}的仓库`
      default:
        if (WAREHOUSE_TYPE.SCENES.includes(warehouse.type)) {
          return `${warehouse.name}场景仓库`
        } else {
          return '错误类型'
        }
    }
  },

  searchAffairNameList(e) {
    const { affair } = this.props
    const { warehouseId } = this.state
    const value = e.target.value + ''
    fetch(config.api.material.search.get(warehouseId, value), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code === 0) {
        const data = fromJS(res.data[0].materials)

        this.setState({
          materials: data.map((v, k) => {
            return Map({
              id: v.get('id'),
              name: v.get('name'),
              picture: v.get('image'),
              price: v.get('price'),
              quantity: v.get('quantity'),
              locked: v.get('locked'),
              typeCode: k,
              amount: 1,
            })
          })
        })
      }
    })
  },

  render() {
    const { rolelist, affair, type } = this.props
    const { materials, warehouseList, chosenList, warehouseId } = this.state

    let sendlist = []
    let bridgelist = []
    let sum = 0

    if (rolelist) {
      sendlist = rolelist.roles.filter((v) => {return v.roleId != affair.get('roleId')})
      bridgelist = rolelist.roles.filter((v) => {return v.belongAffairId != affair.get('id')})
    }

    chosenList.map((v) => {
      if (v.get('totalPrice')) {
        sum += parseInt(v.get('totalPrice'))
      }
    })

    return (
      <Modal
        visible={this.props.visible}
        maskClosable={false}
        onCancel={this.handleCancel}
        onOk={this.handleOk}
        title="发送物资"
        wrapClassName={styles.sendMoreAssetContainer}
      >
        <div className={styles.left}>
          {type === SEND_ASSET_TYPE.CHAT ?
            <Select dropdownMatchSelectWidth={false} className={styles.warehouseSelect} searchPlaceholder="无可用仓库" value={warehouseId} onChange={this.handleSelectWarehouse}>
              {warehouseList.map((warehouse) => {
                return (
                  <Option value={String(warehouse.id)} key={warehouse.id}>{this.renderWarehouseName(warehouse)}</Option>
                )
              })}
            </Select>
            :
            null
          }

          <div className={styles.search}>
            <Input placeholder="搜索物资" onChange={this.searchAffairNameList}/>
            <span className={styles.svg}><SearchIcon fill="#cccccc" height="16px"/></span>
          </div>
          <div className={styles.content}>
            {materials.map((v, k) => {
              return (
                <div className={styles.row} key={k}>
                  <Checkbox onChange={this.handleChooseAsset.bind(null, v)} checked={chosenList.some((s) => {return s.get('id') == v.get('id')})} />
                  {v.get('picture') ? <img src={v.get('picture')} className={styles.avatar}/> : <div className={styles.avatar} style={{ backgroundColor: '#e9e9e9' }} />}
                  <div className={styles.detail}>
                    <span className={styles.name}>
                      {v.get('name')}
                    </span>
                    <div className={styles.numberAndPrice}>
                      <span className={styles.number}>库存:{v.get('quantity') - v.get('locked')}</span>
                      <span className={styles.price}>{currencyFormatter.format(v.get('price'), { code: 'CNY' })}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.chosen}>
            {this.state.chosenList.map((v, k) => {
              return (
                <div className={styles.row} key={k}>
                  <DeleteIcon onClick={this.handleDeleteAsset.bind(null, v)}/>
                  {
                    v.get('picture') ? <img src={v.get('picture')} className={styles.avatar} /> : <div className={styles.avatar} style={{ backgroundColor: '#e9e9e9' }} />
                  }
                  <div className={styles.detail}>
                    <span className={styles.name}>{v.get('name')}</span>
                    <span className={styles.quantity}>库存:{v.get('quantity') - v.get('locked')}</span>
                  </div>
                  <InputNumber value={v.get('amount')} min={1} max={v.get('quantity') - v.get('locked')} onChange={this.handleChangeAmount.bind(null, v)}/>
                  <span className={styles.unit}>{v.get('unit')}</span>
                  <Input value={v.get('totalPrice')} onChange={this.handleChangeTotal.bind(null, v)}/>
                </div>
              )
            })}
          </div>
          <div className={styles.total}>
            <span className={styles.key}>合计:</span>
            <span className={styles.value}>{currencyFormatter.format(sum, { code: 'CNY' })}</span>
          </div>
          <div className={styles.bottom}>
            <div className={styles.block}>
              <span className={styles.key}>接收方:</span>
              <Select onChange={(value) => {this.setState({ toRoleId: value })}} value={this.state.toRoleId}>
                {sendlist.map((v, k) => {
                  return <Option value={v.roleId.toString()} key={k}>{v.username}-{v.roleTitle}</Option>
                })}
              </Select>
              <span className={styles.require} style={{ left: '12px', top: '1px' }}>*</span>
            </div>
            <div className={styles.block}>
              <span className={styles.key}>备注:</span>
              <Input onChange={(e) => {this.setState({ remark: e.target.value })}} value={this.state.remark}/>
              <span className={styles.require} style={{ left: '24px', top: '1px' }}>*</span>
            </div>
            <div className={styles.block}>
              <span className={styles.key}>过桥方:</span>
              <Select onChange={(value) => {this.setState({ bridgeId: value })}} value={this.state.bridgeId}>
                {bridgelist.map((v, k) => {
                  return <Option value={v.roleId.toString()} key={k}>{v.username}-{v.roleTitle}</Option>
                })}
              </Select>
            </div>
            <div className={styles.block}>
              <span className={styles.key}>快递单号:</span>
              <Input onChange={(e) => {this.setState({ express: e.target.value })}} value={this.state.express}/>
            </div>
          </div>
        </div>
      </Modal>)
  }
})

export default SendMoreAsset
