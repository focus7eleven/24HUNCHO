import React from 'react'
import { Modal, Input, Select, Radio, Button, Popover, Message } from 'antd'
import styles from './MoneyModal.scss'
import { GongShangIcon, JiaoTongIcon, NongYeIcon, AliPayIcon, WechatIcon, CashIcon } from 'svg'
import config from '../../config'
import currencyFormatter from '../../utils/currencyWrap'
import { CURRENCY_TYPE, POOL_TYPE } from '../../containers/repo/MoneyRepoManagement'
import messageHandler from 'messageHandler'

const Constants = window.SocketClient.Constants
export const MONEY_MODAL_TYPE = {
  CHAT: 'chat',
  RECEIVE: 'receive'
}

const AccountIconMap = {
  0: <CashIcon fill="#ffa64d" height={36} style={{ marginLeft: '10px', marginRight: '7px' }}/>,
  10: <GongShangIcon height={24} />,
  11: <JiaoTongIcon height={24} />,
  12: <NongYeIcon height={24} />,
  200: <AliPayIcon height={24} />,
  201: <WechatIcon height={24} />
}

const Option = Select.Option

const MoneyModal = React.createClass({
  getDefaultProps() {
    return {
      type: MONEY_MODAL_TYPE.SEND,
      title: '发送资金',
      context: '会话',
      message: null,
    }
  },

  getInitialState() {
    return {
      chosenPool: 'role',
      chosenAccount: -1,
      rejectReason: '',
      currentCurrencyType: 'CNY',
      currentPoolType: POOL_TYPE.ROLE,
      accountList: [],
      accountAmount: -1,
      amount: '',
      toRoleId: '',
      remark: '',
      accountId: '',

      chosenReceivePool: 0,
    }
  },

  componentWillMount() {
    if (this.props.type === MONEY_MODAL_TYPE.CHAT) {
      this.fetchAccountList()
    }
  },

  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
  },

  //获取账户列表，根据个人或公共账户以及币种类型获取
  fetchAccountList(currencyType = 'CNY') {
    const { affair } = this.props

    fetch(config.api.fund.accept_account(currencyType), {
      method: 'GET',
      credentials: 'include',
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      this.setState({
        accountList: json.data,
        currentCurrencyType: currencyType,
      })
    })
  },

  handleSendOk() {
    const { affair, onSend, context, rolelist } = this.props
    const { accountId, toRoleId, remark, amount, currentCurrencyType } = this.state
    if (accountId == '' || amount == '' || remark == '' || toRoleId == '') {
      Message.error('信息填写不完整!')
      return
    }
    if (!(/^\d*(\.?\d+)$/.test(amount))) {
      Message.error('资金金额输入不合法！')
      return
    }
    if (amount > this.state.accountAmount){
      Message.error('发送资金超出账户余额!')
      return
    }
    if (accountId && toRoleId && amount) {
      let body = {
        accountId: accountId,
        fundOrders: [
          {
            toRoleId: toRoleId,
            amount: parseFloat(amount),
            remark: remark,
          }
        ],
        context: context,
        chat: (context === '会话'),
        taskId: 0,
      }

      fetch(config.api.order.pay_fund(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(body)
      }).then((res) => res.json()).then(messageHandler).then((res) => {
        if (res.code === 0) {
          const role = rolelist.find((r) => r.id === parseInt(toRoleId))
          onSend && onSend(JSON.stringify({
            orderId: res.data[0],
            remark: remark,
            amount: parseFloat(amount),
            name: role.roleName + '-' + role.userName,
            currency: currentCurrencyType,
            toUserId: role.userId,
            toRoleId: parseInt(toRoleId),
            state: 0
          }), Constants.CHAT_SUBTYPE.FUND.SEND)
          Message.success('发送成功!等待对方接收。')
          this.handleCancel()
        }
      })
    } else {
      Message.error('信息填写错误请重新填写')
    }

  },

  handleReceiveOk() {
    // 如果是消息中心，需要传入msgId
    const { message, chatMsg } = this.props
    let body = {
      roleId: this.props.toRoleId,
      orderId: this.props.orderId,
      accountId: this.state.chosenAccount
    }
    let msgId = 0
    let chatMsgId = ''
    if (message != null) {
      msgId = message.get('noticeId')
    }
    if (chatMsg != null) {
      chatMsgId = chatMsg._id
    }
    const { chosenAccount } = this.state
    if (chosenAccount !== -1) {
      fetch(config.api.order.accept_funder(this.props.toRoleId, this.props.orderId, this.state.chosenAccount, msgId, chatMsgId), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        affairId: 0,
        roleId: this.props.toRoleId,
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code == 0){
          Message.success('接收资金成功', 0.5)
          setTimeout(() => {
            this.handleCancel()
          }, 500)
        } else {
          Message.error('接收资金失败！')
        }
      })
    } else {
      Message.error('请选择账户', 1.5)
    }
  },

  handleRejectOk() {
    // 如果是消息中心，需要传入msgId

    const { message, chatMsg } = this.props
    let body = {
      roleId: this.props.toRoleId,
      orderId: this.props.orderId,
      reason: this.state.rejectReason
    }
    let msgId = 0
    if (message != null) {
      msgId = message.get('noticeId')
    }
    let chatMsgId = ''
    if (chatMsg != null) {
      chatMsgId = chatMsg._id
    }
    body.msgId = msgId
    fetch(config.api.order.reject_funder(this.props.toRoleId, this.props.orderId, this.state.rejectReason, msgId, chatMsgId), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      affairId: 0,
      roleId: this.props.toRoleId,
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        Message.success('拒绝资金成功！', 1)
        setTimeout(() => {
          this.handleCancel()
        }, 1000)
      } else {
        Message.error('拒绝资金失败！')
      }
    })
  },

  handleCancel() {
    this.setState({
      chosenPool: 'role',
      chosenAccount: -1,
      rejectReason: '',
      currentCurrencyType: 'CNY',
      currentPoolType: POOL_TYPE.ROLE,
      accountList: [],
      accountAmount: -1,
      amount: '',
      toRoleId: '',
      remark: '',
      accountId: '',
    })
    this.props.callback()
  },

  handleString(str) {
    if (str == null) {
      return ''
    }
    let length = str.length
    return str.substring(length - 4, length)
  },

  handleAccountOnchange(value) {
    // const rolePools = this.props.accountList
    // const selectedPool = rolePools.find((p) => (p.id + '') === value)

    this.setState({
      // selectedPool,
      chosenReceivePool: value,
      chosenPool: value,
      chosenAccount: -1,
    })
  },

  //输入资金，判断是否合法
  handleAmountChange(e) {
    let value = e.target.value
    
    if (value == '') {
      this.setState({ amount: value })
    }
    
    if (/^\d+(\.?\d*)$/.test(value)) {
      this.setState({ amount: value })
    }
  },

  //货币类型变化
  handleCurrencyTypeChange(currency) {
    this.fetchAccountList(currency)
  },

  //账户类型变化
  handlePoolTypeChange(type) {
    this.setState({
      currentPoolType: type
    })
  },

  renderSendMoneyModal() {
    const { type, rolelist } = this.props
    const { chosenReceivePool } = this.state

    const accountList = this.state.accountList

    let fundPools = accountList.poolAccounts
    let selectedPool = null
    if (fundPools && fundPools.length > 0) {
      selectedPool = fundPools[chosenReceivePool]
    }

    const selectBefore = (
      <Select notFoundContent="无法找到" defaultValue={'CNY'} style={{ width: 60 }} onChange={this.handleCurrencyTypeChange}>
        {Object.keys(CURRENCY_TYPE).map((type, k) => {
          return <Option value={type} key={k}>{type}</Option>
        })}
      </Select>
    )
    return (
      <Modal
        title={this.props.title}
        visible={this.props.visible}
        onOk={this.handleSendOk}
        onCancel={this.handleCancel}
        wrapClassName={styles.sendMoneyContainer} maskClosable={false}
      >
        <div className={styles.content}>
          <div className={styles.row}>
            <span>接收方:</span>
            <Select notFoundContent="无法找到" onChange={(value) => {this.setState({ toRoleId: value })}} value={this.state.toRoleId}>
              {
                rolelist.map((v, k) => {
                  return <Option value={`${v.id}`} key={k}>{v.roleTitle}-{v.username}</Option>
                })
              }
            </Select>
          </div>

          <div className={styles.row}>
            <span>资金:</span>
            <Input onChange={this.handleAmountChange} value={this.state.amount} addonBefore={type === MONEY_MODAL_TYPE.CHAT ? selectBefore : null} style={{ width: 370 }}/>
          </div>

          <div className={styles.row}>
            <span>备注:</span>
            <Input onChange={(e) => {this.setState({ remark: e.target.value })}} value={this.state.remark}/>
          </div>

          <div className={styles.row}>
            <span>发送账户:</span>
            {(fundPools && fundPools.length > 0) ?
              <Select notFoundContent="无法找到" onChange={this.handleAccountOnchange} value={this.state.chosenReceivePool + ''} >
                {fundPools.map((pool, k) => {
                  return (
                    <Option value={`${k}`} key={k}>{pool.poolName}</Option>
                  )
                })}
              </Select> : <div className={styles.none}>暂时没有账户可发送</div>
            }
          </div>

          {(selectedPool && selectedPool.accounts.length > 0) ?
            <div>
              <div className={styles.pay}>
                {selectedPool.accounts.map((v, k) => {
                  return (
                    <div className={styles.account} key={k}>
                      {AccountIconMap[v.subType]}
                      <span className={styles.name}>{v.subTypeName}&nbsp;&nbsp;{v.subType === 0 ? null : this.handleString(v.accountNumber)}</span>
                      <span className={styles.number}>剩余{currencyFormatter.format(v.amount, { code: v.currency })}</span>
                      <Radio className={styles.radio} onChange={() => {
                        this.setState({
                          accountId: v.id,
                          accountAmount: v.amount
                        })
                      }} checked={this.state.accountId === v.id}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          : ((fundPools && fundPools.length > 0) ? <div className={styles.none}>暂时没有账户可发送</div> : null)

          }
        </div>
      </Modal>
    )
  },

  renderRefuseContent() {
    return (
      <div className={styles.refuseContainer}>
        <div className={styles.title}>拒绝理由：</div>
        <div className={styles.content}>
          <Input type="textarea" rows={4} placeholder="无" onChange={(e) => {this.setState({ rejectReason: e.target.value })}}/>
        </div>
        <div className={styles.buttonGroup}>
          <div className={styles.secondary} onClick={() => {this.setState({ popoverVisible: false })}}>取消</div>
          <div className={styles.primary} onClick={() => {this.handleRejectOk()}}>确定</div>
        </div>
      </div>
    )
  },

  renderReceiveMoneyModal(){
    const { order, accountList } = this.props
    const { popoverVisible, chosenReceivePool } = this.state

    let fundPools = accountList.poolAccounts
    let selectedPool = null
    if (fundPools && fundPools.length > 0) {
      selectedPool = fundPools[chosenReceivePool]
    }

    return (
      <Modal
        title={'接收资金'}
        visible={this.props.visible} onOk={this.handleReceiveOk}
        onCancel={this.handleCancel}
        wrapClassName={styles.sendMoneyContainer}
        cancelText="拒绝"
        maskClosable={false}
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
            <Button type="ghost">
              拒绝
            </Button>
          </Popover>,
          <Button key="submit" type="primary" onClick={() => this.handleReceiveOk()}>
            同意
          </Button>,
        ]}
      >
        <div className={styles.content}>
          <div className={styles.receiveRow}>
            <span>资金:</span>
            <span>{currencyFormatter.format(order.total, { code: order.currency })}</span>
          </div>
          <div className={styles.receiveRow}>
            <span>备注:</span>
            <span>{order.remark}</span>
          </div>
          <div className={styles.receiveRow}>
            <span>接收账户:</span>
            {(fundPools && fundPools.length > 0) ?
              <Select notFoundContent="无法找到" onChange={this.handleAccountOnchange} value={this.state.chosenReceivePool + ''} >
                {fundPools.map((pool, k) => {
                  return (
                    <Option value={`${k}`} key={k}>{pool.poolName}</Option>
                  )
                })}
              </Select> : null
            }
            {!selectedPool &&
              <div className={styles.none} style={{ marginLeft: 0 }}>暂时没有账户可接收</div>
            }
          </div>
          {selectedPool &&
            <div>
              <div className={styles.pay}>
                {selectedPool.accounts.map((v, k) => {
                  return (
                    <div className={styles.account} key={k}>
                      {AccountIconMap[v.subType]}
                      <span className={styles.name}>{v.subTypeName}&nbsp;&nbsp;{v.subType === 0 ? null : this.handleString(v.accountNumber)}</span>
                      <span className={styles.number}>剩余{currencyFormatter.format(v.amount, { code: v.currency })}</span>
                      <Radio className={styles.radio} onChange={() => {
                        this.setState({ chosenAccount: v.id })
                      }} checked={this.state.chosenAccount === v.id}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          }

        </div>

      </Modal>
    )
  },
  render(){
    switch (this.props.type){
      case MONEY_MODAL_TYPE.SEND:
      case MONEY_MODAL_TYPE.CHAT:
        return this.renderSendMoneyModal()
      case MONEY_MODAL_TYPE.RECEIVE:
        return this.renderReceiveMoneyModal()
    }

    return this.props.type == 'send' ? this.renderSendMoneyModal() : this.renderReceiveMoneyModal()
  }
})

export default MoneyModal
