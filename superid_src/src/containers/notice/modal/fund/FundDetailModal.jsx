import React from 'react'
import { Modal } from 'antd'
import { StateFinishIcon, StateRevokeIcon, StateWaitIcon } from 'svg'
import styles from './FundDetailModal.scss'
import currencyFormatter from 'utils/currencyWrap'
import config from 'config'
import urlFormat from 'utils/urlFormat'
import messageHandler from 'utils/urlFormat'


const FUND_CARD_STATE = {
  UNCONFIRMED: 0,
  COMPLETED: 1,
  REJECTED: 2,
  REVOKED: 3
}

class FundDetailModal extends React.Component {

  static FUND_CARD_STATE = FUND_CARD_STATE

  state = {
    order: null,
    name: '您'
  }

  componentWillMount() {
    const { message } = this.props
    const affairId = message.get('toAffairId')
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')
    fetch(urlFormat(config.api.order.handleFundInfo(), {
      orderId: message.get('resourceId')
    }), {
      method: 'POST',
      credentials: 'include',
      affairId: affairId,
      roleId: roleId,
      resourceId,
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.setState({
          order: json.data
        })
      }
    })
  }


  renderContent() {
    const { order, name } = this.state
    switch (order.state) {
      case FUND_CARD_STATE.UNCONFIRMED:
        return (
          <div className={styles.content}>
            <div className={styles.money}>
              <span><StateWaitIcon/></span>
              <span>{currencyFormatter.format(order.amount, { code: order.currency })}</span>
            </div>
            <div>待确认收款</div>
          </div>
        )
      case FUND_CARD_STATE.COMPLETED:
        return (
          <div className={styles.content}>
            <div className={styles.money}>
              <span><StateFinishIcon/></span>
              <span>{currencyFormatter.format(order.amount, { code: order.currency })}</span>
            </div>
            <div>{name}已收款</div>
          </div>
        )
      case FUND_CARD_STATE.REJECTED:
        return (
          <div className={styles.content}>
            <div className={styles.money}>
              <span><StateRevokeIcon/></span>
              <span>{currencyFormatter.format(order.amount, { code: order.currency })}</span>
            </div>
            <div>{name}已拒绝资金</div>
            <div>拒收理由：<span className={styles.reason}>{order.reason}</span></div>
          </div>
        )
      default:
        return 'error'
    }
  }

  render() {
    const { onHide } = this.props

    if (!this.state.order) {
      return null
    }

    return (
      <Modal
        visible
        onCancel={onHide}
        wrapClassName={styles.fundModal}
        footer=""
        width={500}
      >
        {this.renderContent()}
      </Modal>
    )
  }
}

export default FundDetailModal
