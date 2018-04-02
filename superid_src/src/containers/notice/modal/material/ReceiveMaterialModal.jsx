import React from 'react'
import config from '../../../../config'
import ReceiveAssetModal from '../../../repo/ReceiveAssetModal'

const ReceiveMaterialModal = React.createClass({
  getInitialState(){
    return ({
      fetchDone: false,
    })
  },
  componentWillMount(){
    this.fetchOrder()
  },
  getOrderId(){
    const { message } = this.props
    return (message.get('urls').last() || Map()).get('id')
  },
  fetchOrder(){
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')
    const orderId = this.getOrderId()
    fetch(config.api.order.material_order(orderId), {
      method: 'GET',
      credentials: 'include',
      roleId,
      resourceId
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        fetch(config.api.material.warehouse.role_warehouse(), {
          method: 'GET',
          credentials: 'include',
          roleId,
          resourceId,
        })
          .then((res) => res.json())
          .then((res) => {
            if (res.code == 0){
              this.setState({
                fetchDone: true,
                showAssetOrder: json.data,
                toAssetRoleId: roleId,
                warehouseList: res.data,
                showAssetOrderId: orderId,
              })
            }
          })
      }
    })
  },
  onHide(){
    this.props.onHide()
  },
  render(){
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const orderId = this.getOrderId()
    const { fetchDone } = this.state
    return fetchDone && (
      <ReceiveAssetModal
        visible
        message={message}
        order={this.state.showAssetOrder}
        toRoleId={roleId}
        warehouseList={this.state.warehouseList}
        orderId={orderId}
        fetchOrder={this.fetchOrder}
        onCancel={this.onHide}
        callback={this.onHide}
      />
    )
  },
})

export default ReceiveMaterialModal
