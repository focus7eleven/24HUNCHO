import React from 'react'
import styles from './FundCard.scss'
import { RMBIcon, StateFinishIcon, StateRevokeIcon, StateWaitIcon } from 'svg'
import { Modal } from 'antd'
import classnames from 'classnames'
import currencyFormatter from '../../utils/currencyWrap'
import MoneyModal, { MONEY_MODAL_TYPE } from '../modal/MoneyModal'
import config from '../../config'

const PropTypes = React.PropTypes

export const FUND_CARD_POSITION = {
  LEFT: 'left',
  RIGHT: 'right'
}

export const FUND_CARD_STATE = {
  UNCONFIRMED: 0,
  COMPLETED: 1,
  REJECTED: 2,
  REVOKED: 3
}

let FUND_CARD_STATE_CONTENT = []
FUND_CARD_STATE_CONTENT[FUND_CARD_STATE.UNCONFIRMED] = '未确认'
FUND_CARD_STATE_CONTENT[FUND_CARD_STATE.COMPLETED] = '已完成'
FUND_CARD_STATE_CONTENT[FUND_CARD_STATE.REVOKED] = '已撤回'
FUND_CARD_STATE_CONTENT[FUND_CARD_STATE.REJECTED] = '已拒绝'

const FundModal = React.createClass({
  propTypes: {
    visible: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
    order: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired
  },

  renderContent() {
    const { order, name } = this.props

    switch (order.state) {
      case FUND_CARD_STATE.UNCONFIRMED:
        return (
          <div className={styles.content}>
            <div className={styles.money}>
              <span><StateWaitIcon/></span>
              <span>{currencyFormatter.format(order.total, { code: order.currency })}</span>
            </div>
            <div>待确认收款</div>
          </div>
        )
      case FUND_CARD_STATE.COMPLETED:
        return (
          <div className={styles.content}>
            <div className={styles.money}>
              <span><StateFinishIcon/></span>
              <span>{currencyFormatter.format(order.total, { code: order.currency })}</span>
            </div>
            <div>{name} 已收款</div>
          </div>
        )
      case FUND_CARD_STATE.REJECTED:
        return (
          <div className={styles.content}>
            <div className={styles.money}>
              <span><StateRevokeIcon/></span>
              <span>{currencyFormatter.format(order.total, { code: order.currency })}</span>
            </div>
            <div>{name} 已拒绝资金</div>
            <div>拒收理由：<span className={styles.reason}>{order.reason}</span></div>
          </div>
        )
      default:
        return 'error'
    }
  },

  render() {
    const { visible, onCancel } = this.props

    return (
      <Modal visible={visible}
        onCancel={onCancel}
        wrapClassName={styles.fundModal}
        footer=""
        width={500}
      >
        {this.renderContent()}
      </Modal>
    )
  }
})

const FundCard = React.createClass({
  propTypes: {
    message: PropTypes.object.isRequired,
    roleId: PropTypes.number.isRequired,
    affairId: PropTypes.number.isRequired,
    position: PropTypes.string.isRequired,
  },

  getDefaultProps() {
    return {
      position: FUND_CARD_POSITION.LEFT,
      state: FUND_CARD_STATE.UNCONFIRMED,
    }
  },

  getInitialState(){
    return {
      moneyModalVisible: false,
      fundModalVisible: false,
      order: null,
      accountList: null
    }
  },

  //打开资金详情
  handleOpenFund() {
    const content = JSON.parse(this.props.message.content)
    const { roleId, affairId } = this.props
    fetch(config.api.order.fund_order(content.orderId), {
      method: 'GET',
      credentials: 'include',
      roleId,
      affairId,
    }).then((res) => res.json()).then((res) => {
      const order = res.data
      if (order && this.cardRef) {
        order.currency = content.currency
        order.total = content.amount
        if (order.state === FUND_CARD_STATE.COMPLETED) {
          //已接收
          this.setState({
            order,
            fundModalVisible: true,
          })
        } else if (order.state === FUND_CARD_STATE.UNCONFIRMED && order.toRoleId === roleId) {
          //接收方，且资金未接收
          fetch(config.api.fund.accept_account(order.currency), {
            method: 'GET',
            credentials: 'include',
            roleId: order.toRoleId,
          }).then((res) => res.json()).then((res) => {
            this.setState({
              order,
              moneyModalVisible: true,
              accountList: res.data
            })
          })
        } else {
          this.setState({
            order,
            fundModalVisible: true,
          })
        }
      }
    })
  },

  // 接收资金，创建消息
  handleFundMessage() {
    // const { onSend, message } = this.props
    // const subType = (status === 0) ? Constants.CHAT_SUBTYPE.FUND.ACCEPT : Constants.CHAT_SUBTYPE.FUND.REJECT
    // onSend && onSend(message.content, subType)
    
  },

  getOrderStatus(state) {
    switch (state) {
      case FUND_CARD_STATE.UNCONFIRMED:
        return 'unconfirmed'
      case FUND_CARD_STATE.COMPLETED:
        return 'received'
      case FUND_CARD_STATE.REJECTED:
        return 'rejected'
      default:
        return 'error'
    }
  },

  render() {
    const { position, message, toRole } = this.props
    const { fundModalVisible, moneyModalVisible, order, accountList } = this.state
    const content = JSON.parse(message.content)
    const cardClassName = classnames(
      styles.fundCard,
      position === FUND_CARD_POSITION.LEFT ? styles.bulgeLeft : styles.bulgeRight,
      order ? this.getOrderStatus(order.state) : ''
    )

    const roleName = toRole ? toRole.roleTitle + '-' + toRole.username : ''
    
    return (
      <div className={cardClassName} onClick={this.handleOpenFund} ref={(card) => this.cardRef = card}>
        <div className={styles.description}>
          <div style={{ margin: '10px' }}><RMBIcon width={30} height={30} fill={'#ffffff'}/></div>
          <div>
            <div className={styles.remark} title={content.remark}>{content.remark}</div>
            <div className={styles.number}>{currencyFormatter.format(content.amount, { code: content.currency })}</div>
          </div>
        </div>
        <div className={styles.footer}>
          <div className={styles.state}>
            <img src={toRole ? toRole.avatar : ''} alt=""/>
            <span className={styles.roleName} title={roleName}>{roleName}</span>
          </div>
        </div>
        {fundModalVisible ?
          <FundModal visible={fundModalVisible}
            onCancel={() => this.setState({ fundModalVisible: false })}
            name={roleName}
            order={order}
          /> : null
        }
        {moneyModalVisible ?
          <MoneyModal
            type={MONEY_MODAL_TYPE.RECEIVE}
            visible={moneyModalVisible}
            chatMsg={message}
            callback={() => this.setState({ moneyModalVisible: false })}
            accountList={accountList}
            order={order}
            orderId={content.orderId}
            toRoleId={order.toRoleId}
            context="会话"
          /> : null
        }
      </div>
    )
  }
})

export default FundCard
