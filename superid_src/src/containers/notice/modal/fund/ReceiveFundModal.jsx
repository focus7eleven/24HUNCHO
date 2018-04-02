import React from 'react'
import { message } from 'antd'
import config from '../../../../config'
import MoneyModal, { MONEY_MODAL_TYPE } from '../../../../components/modal/MoneyModal'

const ReceiveFundModal = React.createClass({

  getDefaultProps(){
    return ({
      message: null,
      onHide: null,
    })
  },
  getInitialState(){
    return ({
      fetchDone: false,
      order: null,
      orderId: null,
      toRoleId: null,
      accountList: null,
    })
  },
  componentWillMount(){
    this.fetchOrder()
  },
  fetchOrder(){
    const fundMessage = this.props.message
    const orderId = fundMessage.get('resourceId')
    const toRoleId = fundMessage.get('receiverRoleId')
    fetch(config.api.order.fund_order(orderId, toRoleId), {
      method: 'GET',
      credentials: 'include',
      roleId: toRoleId
    }).then((res) => res.json()).then((json) => {
      let order = json.data
      if (json.code === 0){
        if (json.data.state == 0){
          this.setState({
            order: order,
            orderId: orderId,
            toRoleId: toRoleId,
          })
        }
        else {
          message.error('交易已完成')
        }

        fetch(config.api.fund.accept_account(order.currency), {
          method: 'GET',
          credentials: 'include',
          roleId: toRoleId,
        }).then((res) => res.json()).then((json) => {
          if (json.code === 0) {
            this.setState({
              accountList: json.data,
              fetchDone: true,
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
    const fundMessage = this.props.message
    const { fetchDone } = this.state
    return fetchDone && (
      <MoneyModal
        visible
        message={fundMessage}
        type={MONEY_MODAL_TYPE.RECEIVE}
        order={this.state.order}
        orderId={this.state.orderId}
        toRoleId={this.state.toRoleId}
        onCancel={this.onHide}
        callback={this.onHide}
        accountList={this.state.accountList}
      />
    )
  },
})

export default ReceiveFundModal
