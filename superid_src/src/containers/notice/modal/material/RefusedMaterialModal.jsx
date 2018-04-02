import React from 'react'
import { fromJS } from 'immutable'
import config from '../../../../config'
import FeedbackModal from '../../../repo/FeedbackModal'

const RefusedMaterialModal = React.createClass({
  getInitialState(){
    return ({
      order: null,
      asset: null,
      fetchDone: false
    })
  },
  componentWillMount(){
    this.fetchOrder()
  },
  fetchOrder(){
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')
    const optional = typeof message.get('optional') == 'string' ?
      JSON.parse(message.get('optional'))
    :
      message.get('optional')

    fetch(config.api.order.material_order_record(optional.materialOrderId, optional.materialOrderRemarkTime), {
      method: 'GET',
      credentials: 'include',
      roleId,
      resourceId
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        const orderId = message.get('resourceId')
        const order = json.data
        const materialId = order.items[0].materialId
        this.setState({
          asset: { orderId: orderId, materialId: materialId, },
          order: order,
          fetchDone: true,
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
    const { order, asset, fetchDone } = this.state
    return fetchDone && (
      <FeedbackModal
        message={message}
        visible
        order={order}
        showAsset={asset}
        callback={() => {this.onHide()}}
        affair={fromJS({ roleId: roleId })}
        fetchOrderDetail={this.fetchOrder}
      />
    )
  }
})

export default RefusedMaterialModal
