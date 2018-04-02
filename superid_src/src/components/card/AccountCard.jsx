import React from 'react'
import styles from './AccountCard.scss'
import { Input, Modal, Form, notification } from 'antd'
import currencyFormatter from '../../utils/currencyWrap'
import { GongShangIcon, JiaoTongIcon, NongYeIcon, AliPayIcon, WechatIcon, CashIcon } from 'svg'
import config from '../../config'


const accountType = ['现金', '银行卡', '第三方', '对公账户']
const AccountIconMap = { 0: <CashIcon fill="#ffa64d" height={49} style={{ marginLeft: '15px', marginRight: '8px' }}/>, 10: <GongShangIcon height={37} />, 11: <JiaoTongIcon height={37} />, 12: <NongYeIcon height={37} />, 200: <AliPayIcon height={37} />, 201: <WechatIcon height={37} /> }
const FormItem = Form.Item

const AccountCard = React.createClass({
  getDefaultProps(){
    return {
    }
  },
  getInitialState(){
    return {
      showInitialModal: false,
      isMouseIn: false,
    }
  },
  handleOk(){
    const { affair, account } = this.props
    this.props.form.validateFields((errors, values) => {
      if (errors) {
        return
      }
      fetch(config.api.fund.init_cash_account(account.id, values.amount), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        method: 'POST',
        credentials: 'include',
      }).then((res) => res.json()).then((json) => {
        if (json.code == 0) {
          this.props.fresh(account.currency, this.props.poolType)
          notification.success({
            message: '初始化成功'
          })
          this.setState({
            showInitialModal: false,
          })
        }
        else {
          notification.error({
            message: '初始化失败'
          })
          this.setState({
            showInitialModal: false,
          })
        }
      })
    })

  },
  handleCancel(){
    this.setState({
      showInitialModal: false,
    })
  },
  handleInvalid(){
    const { affair } = this.props
    fetch(config.api.fund.invalid(this.props.account.id), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.props.fresh(this.props.account.currency, this.props.poolType)
        notification.success({
          message: '该账户已失效'
        })
      }
    })
  },
  handleString(str){
    let length = str.length
    return str.substring(length - 4, length)
  },
  renderCash(){
    const { getFieldDecorator } = this.props.form
    const amountDecorator = getFieldDecorator('amount', {
      validate: [{
        rules: [{
          pattern: /^(\d+(\.\d+)?)$/,
          message: '请输入数字'
        }, {
          required: true,
          message: '请输入初始化金额',
        }],
        trigger: 'onBlur',
      }]
    })
    const { account } = this.props
    return (
      <div className={styles.accountCardContainer}>
        <div className={styles.top}>
          <div className={styles.left}>现金</div>
          <div className={styles.right}>
            {
                account.state == 0
                  ?
                    <span className={styles.count}>{currencyFormatter.format(account.amount, { code: account.currency })}</span>
                  :
                  account.state == 2
                    ?
                      <span className={styles.initial} onClick={() => {
                        this.setState({ showInitialModal: true })
                      }}
                      >初始化现金</span>
                    : null
              }
          </div>
        </div>
        <div className={styles.content}>
          {AccountIconMap[account.subType]}
          <div className={styles.info}>
            <span className={styles.owner}>{this.props.ownerName}的现金</span>
          </div>
        </div>

        <Modal visible={this.state.showInitialModal} title="初始化现金" onOk={this.handleOk} onCancel={this.handleCancel} wrapClassName={styles.initialModal} maskClosable={false}>
          <div className={styles.row}>
            <span className={styles.count}>金额:</span>
            <Form>
              <FormItem>
                {amountDecorator(<Input addonBefore={account.currency} />)}
              </FormItem>
            </Form>
          </div>
        </Modal>

        <Modal visible={this.state.showInitialModal} title="初始化现金" onOk={this.handleOk} onCancel={this.handleCancel} wrapClassName={styles.initialModal} maskClosable={false}>
          <div className={styles.row}>
            <span className={styles.count}>金额:</span>
            <Form>
              <FormItem>
                <Input addonBefore={account.currency} />
              </FormItem>
            </Form>
          </div>
        </Modal>
      </div>
    )
  },
  renderOther(){
    const { account } = this.props
    return (<div className={styles.accountCardContainer} onMouseEnter={() => {this.setState({ isMouseIn: true })}} onMouseLeave={() => {this.setState({ isMouseIn: false })}} style={{ border: account.state == 1 ? '1.5px dashed #ebebeb' : '' }}>
      <div className={styles.top} style={{ borderBottom: account.state == 1 ? '1px dashed #ebebeb' : '' }}>
        <div className={styles.left} style={{ color: account.state == 1 ? '#9b9b9b' : '' }}>
          {accountType[account.type]}
          {
            (account.amount == 0 && this.state.isMouseIn && account.state != 1)
              ?
                <span className={styles.abadon} onClick={this.handleInvalid}>失效</span>
              :
              account.state == 1
                ?
                  <span className={styles.invalid}>(已失效)</span>
                :
                null
          }
        </div>
        {
          account.state == 1
            ?
            null
            :
            <div className={styles.right}>
              <span className={styles.count}>{currencyFormatter.format(account.amount, { code: account.currency })}</span>
            </div>
        }
      </div>
      <div className={styles.content}>
        {AccountIconMap[account.subType]}
        <div className={styles.info}>
          <span className={styles.owner} style={{ color: account.state == 1 ? '#9b9b9b' : '' }}>{account.subTypeName}</span>
          {
            account.subType == 200
              ?
                <span className={styles.detail} style={{ color: account.state == 1 ? '#9b9b9b' : '' }}>支付宝:&nbsp;{account.accountNumber}</span>
              :
              account.subType == 201
                ?
                  <span className={styles.detail} style={{ color: account.state == 1 ? '#9b9b9b' : '' }}>微信号:&nbsp;{account.accountNumber}</span>
                :
                  <span className={styles.detail} style={{ color: account.state == 1 ? '#9b9b9b' : '' }}>尾号{this.handleString(account.accountNumber)}|{account.accountOwner}</span>
          }
        </div>
      </div>
    </div>)
  },
  render(){
    const { account } = this.props
    return account.type == 0 ? this.renderCash() : this.renderOther()
  },
})

export default Form.create()(AccountCard)
