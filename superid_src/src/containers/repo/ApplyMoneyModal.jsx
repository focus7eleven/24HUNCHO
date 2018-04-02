import React from 'react'
import styles from './ApplyMoneyModal.scss'
import { Modal, Input, Select, Form, message } from 'antd'
import classNames from 'classnames'

import messageHandler from '../../utils/messageHandler'
import config from '../../config'
import currencyFormatter from '../../utils/currencyWrap'
import { ChinaIcon, JapanIcon, USAIcon, EuroIcon, CashIcon, GongShangIcon, JiaoTongIcon, NongYeIcon, AliPayIcon, WechatIcon, HongkongIcon, EnglandIcon } from 'svg'
import { FLOAT_NUMBER } from 'utils/regex'

const FormItem = Form.Item
const createForm = Form.create
const Option = Select.Option

const IconMap = {
  'CNY': {
    svg: <ChinaIcon/>,
    text: 'CNY人民币账户'
  },
  'USD': {
    svg: <USAIcon/>,
    text: 'USD美元账户'
  },
  'JPY': {
    svg: <JapanIcon/>,
    text: 'JYP日元账户'
  },
  'EUR': {
    svg: <EuroIcon/>,
    text: 'EUR欧元账户'
  },
  'GBP': {
    svg: <EnglandIcon/>,
    text: 'GBP英镑账户'
  },
  'HKD': {
    svg: <HongkongIcon/>,
    text: 'HKD港币账户'
  }
}

const AccountIconMap = {
  0: <CashIcon fill="#ffa64d" height={24} style={{ marginLeft: '-4px', marginRight: '-3px' }}/>,
  10: <GongShangIcon height={16} />,
  11: <JiaoTongIcon height={16} />,
  12: <NongYeIcon height={16} />,
  200: <AliPayIcon height={16} />,
  201: <WechatIcon height={16} />
}

const AccountName = {
  0: '现金',
  10: '中国工商银行',
  11: '中国交通银行',
  12: '中国农业银行',
  200: '支付宝',
  201: '微信钱包',
}


const ApplyMoneyForm = React.createClass({

  getInitialState() {
    const { currencyData } = this.props

    if (currencyData.isModified) {
      return {
        money: currencyData.money,
        toRepo: currencyData.toRepo,
        relatedAccounts: [],
        toAccount: currencyData.toAccount,
        moneyValid: {
          status: '',
          help: ''
        }
      }
    }

    return {
      money: 0,
      toRepo: null,
      relatedAccounts: [],
      toAccount: null,
      moneyValid: {
        status: '',
        help: ''
      }
    }
  },

  componentWillReceiveProps(nextProps) {
    const { currencyData, receivePools } = nextProps

    let toRepo
    let relatedAccounts = []
    if (currencyData.isModified) {
      toRepo = currencyData.toRepo
      relatedAccounts = toRepo.receiveAccountVOs ? toRepo.receiveAccountVOs : []

      this.setState({
        toRepo: currencyData.toRepo,
        relatedAccounts,
        toAccount: currencyData.toAccount
      })
    } else {
      toRepo = receivePools[0]
      relatedAccounts = toRepo.receiveAccountVOs ? toRepo.receiveAccountVOs : []
      const toAccount = (relatedAccounts && relatedAccounts.length > 0) ? relatedAccounts[0] : null
      this.setState({
        toRepo,
        relatedAccounts,
        toAccount
      })
    }
  },

  getMoneyDecorator() {
    const { getFieldDecorator } = this.props.form
    const { currencyData } = this.props

    const moneyProps = getFieldDecorator('single-money', {
      rules: [
				{ required: true, message: '请输入金额' },
        {
          validator: (rule, value, callback) => {
            if (FLOAT_NUMBER.test(value) || value == '') {
              value = parseFloat(value)
              const currency = currencyData
              if (value > currency.total) {
                callback([new Error('超出金额')])
              }
            } else {
              callback([new Error('请输入数字')])
            }
          }
        },
      ]
    })

    return moneyProps
  },

  handleMoneyChange(e) {
    const value = parseFloat(e.target.value)
    const { currencyData } = this.props
    if (!isNaN(value)) {
      if (value > currencyData.total) {
        this.setState({
          moneyValid: {
            status: 'error',
            help: '金额超出'
          }
        })
      } else {
        this.setState({
          money: value,
          moneyValid: {
            status: '',
            help: ''
          }
        })
      }
    } else {
      if (value === '') {
        this.setState({
          money: 0,
          moneyValid: {
            status: 'error',
            help: '请输入数字'
          }
        })
      }
      this.setState({
        money: 0,
        moneyValid: {
          status: 'error',
          help: '请输入数字'
        }
      })
    }
  },



  handleRepoSelect(value) {
    const { receivePools } = this.props
    const toRepo = receivePools.find((p) => p.id === parseFloat(value))
    const relatedAccounts = toRepo.receiveAccountVOs

    this.setState({ toRepo, relatedAccounts, toAccount: relatedAccounts[0] })
  },

  handleAccountSelect(value) {
    const { relatedAccounts } = this.state
    const toAccount = relatedAccounts.find((a) => a.accountId === parseFloat(value))

    this.setState({
      toAccount
    })
  },

  handleClose() {
    this.props.close()
  },

  handleSubmit() {
        //输入检查

    const { currencyData } = this.props

    if (parseFloat(this.state.money) <= 0){
      message.error('请输入正确的金额')
      return
    }
    if (!this.state.toRepo){
      message.error('请选择接收的资金库,如果没有请新建')
      return
    }
    if (!this.state.toAccount){
      message.error('请选择接收的账户,如果没有请新建')
    }
    const res = Object.assign({}, currencyData, {
      isModified: true,
      money: this.state.money,
      toRepo: this.state.toRepo,
      toAccount: this.state.toAccount
    })

    this.props.submit(res)
  },

  render() {
    const { currencyData, receivePools } = this.props
    const { toRepo, toAccount, relatedAccounts, moneyValid } = this.state
    return (
      <div className={styles.applyMoneyForm}>
        <Form layout="horizontal">
          <FormItem
            label="金额"
            labelCol={{ span: 3 }}
            wrapperCol={{ span: 12 }}
            validateStatus={moneyValid.status}
            help={moneyValid.help}
          >
            <Input
              addonBefore={currencyData.currencyType}
              value={this.state.money}
              onChange={this.handleMoneyChange}
            />
          </FormItem>

          {/* 转入库 */}
          <FormItem
            label="转入库"
            labelCol={{ span: 3 }}
            wrapperCol={{ span: 12 }}
          >
            <Select value={toRepo ? toRepo.id + '' : ''} onSelect={this.handleRepoSelect}>
              {receivePools.map((p) => {
                return (
                  <Option value={p.id + ''} key={p.id}>{p.name}</Option>
                )
              })}
            </Select>
          </FormItem>

          {/* 账户 */}
          <FormItem
            label="账户"
            labelCol={{ span: 3 }}
            wrapperCol={{ span: 12 }}
          >
            <Select value={toAccount ? toAccount.accountId + '' : ''} onSelect={this.handleAccountSelect}>
              {relatedAccounts.map((a) => {
                return (
                  <Option value={a.accountId + ''} key={a.accountId}>
                    <div className={styles.accountOption + ' applymoneyform-account-option small-form'}>
                      <span className="account-option-icon">
                        {AccountIconMap[a.subType]}
                      </span>
                      <span className="account-option-subName">
                        {AccountName[a.subType]}
                      </span>
                      <span className="account-option-number">
                        {a.accountNumber}
                      </span>
                    </div>
                  </Option>
                )
              })}
            </Select>
          </FormItem>
        </Form>

        <div className={styles.buttonBar}>
          <span className={styles.confirmBtn} onClick={this.handleSubmit}>确认</span>
          <span className={styles.cancelBtn} onClick={this.handleClose}>取消</span>
        </div>
      </div>
    )
  }
})

const ApplyMoney = createForm()(ApplyMoneyForm)


const ApplyMoneyModalForm = React.createClass({

  getInitialState() {
    const { fund } = this.props

    let list = fund.fundPoolCurrencyItemVOs

    return {
      singleMoney: '',
      currencyList: list, // 币种金额列表
      selectedCurrency: null, // 多币种情况下被选中

      receivePools: [], // 转入库列表
      selectedReceivePool: null, // 被选中的转入库

      receiveAccounts: [], // 转入账户列表
      relatedAccounts: [], // 转入库相关账户列表
      selectedReceiveAccount: null, // 被选中的转入账户
      moneyValid: {
        status: '',
        help: ''
      }
    }
  },

  componentDidMount() {
    const { currencyList } = this.state
    if (currencyList.length > 0 && currencyList.length < 2) {
      this.fetchSingleAccountList(currencyList[0])
    }
  },
  componentWillReceiveProps(){
  },
	// 只有单个币种的情况
  fetchSingleAccountList(currency) {
    const { affair } = this.props

    fetch(config.api.fund.role_account(currency.currencyType), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        const receivePools = json.data

        const selectedReceivePool = receivePools[0]
        const relatedAccounts = selectedReceivePool.receiveAccountVOs
        const selectedReceiveAccount = relatedAccounts && relatedAccounts.length > 0 ? relatedAccounts[0] : null
        this.setState({
          receivePools,
          relatedAccounts,
          selectedReceivePool,
          selectedReceiveAccount,
        })
      }
    })
  },


  handleSelectPool(value) {
    const { receivePools } = this.state
    const selectedReceivePool = receivePools.find((p) => (p.id + '') === value)
    const relatedAccounts = selectedReceivePool.receiveAccountVOs
    const selectedReceiveAccount = relatedAccounts.length > 0 ? relatedAccounts[0] : null
    this.setState({
      relatedAccounts,
      selectedReceivePool: selectedReceivePool,
      selectedReceiveAccount
    })
  },

  handleSelectAccount(value) {
    const { relatedAccounts } = this.state
    const selectedReceiveAccount = relatedAccounts.find((p) => (p.accountId + '') === value)

    this.setState({
      selectedReceiveAccount
    })
  },

  handleMoneyChange(e) {
    const value = e.target.value
    const currency = this.state.currencyList[0]
    const total = currency.total - currency.locked
    if (FLOAT_NUMBER.test(value) || value == '') {
      this.setState({
        singleMoney: total > value ? value : total,
        moneyValid: {
          status: '',
          help: ''
        }
      })
    } else {
      e.preventDefault()
    }
  },


  handleCancel(){
    this.props.onCancel()
  },

  handleSingleOk(){
    const { affair, fund } = this.props
    const { currencyList, selectedReceiveAccount, selectedReceivePool } = this.state

    const single = currencyList[0]


    if (parseFloat(single.money) <= 0){
      message.error('请输入正确的金额')
      return
    }
    if (!selectedReceiveAccount){
      message.error('请选择接收的资金库,如果没有请新建')
      return
    }
    if (!selectedReceivePool){
      message.error('请选择接收的账户,如果没有请新建')
    }

    const currency = {
      amount: this.state.singleMoney,
      currency: single.currencyType,
      poolId: fund.poolId,
      toAccountId: selectedReceiveAccount.accountId
    }
    const applicableFunds = [currency]

    fetch(config.api.fund.obtainment(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify({
        applicableFunds: applicableFunds
      })
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code === 0) {
        const hide = message.success('申请资金成功！')
        this.setState({ singleMoney: '' })
        setTimeout(() => {
          hide()
          this.props.onCancel()
        }, 1000)
      } else {
        message.error('申请失败！')
      }
    })
  },

  handleOk(){
    const { affair, fund } = this.props
    const { currencyList } = this.state

    const applicableFunds = currencyList.filter((c) => c.isModified).map((c) => {
      return {
        amount: c.money + '',
        currency: c.currencyType,
        poolId: fund.poolId,
        toAccountId: c.toAccount.accountId
      }
    })
    if (applicableFunds.length == 0){
      message.error('请填写至少1笔申请信息')
      return
    }
    fetch(config.api.fund.obtainment(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify({
        applicableFunds: applicableFunds
      })
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code === 0) {
        const hide = message.success('申请资金成功！')
        setTimeout(() => {
          hide()
          this.props.onCancel()
        }, 1000)
      } else {
        message.error('申请失败！')
      }
    })
  },

  submitFormData(selectedCurrency) {
    const list = this.state.currencyList.map((item) => {
      if (item.currencyType === selectedCurrency.currencyType) {
        return selectedCurrency
      }
      return item
    })

    this.setState({
      currencyList: list,
      selectedCurrency: null
    })
  },

  closeForm() {
    this.setState({ selectedCurrency: null })
  },

  getMoneyDecorator() {
    const { getFieldDecorator } = this.props.form

    const { currencyList } = this.state
    const decorator = getFieldDecorator('single-money', {
      rules: [
        { required: true, message: '请输入金额' },
        {
          validator: (rule, value, callback) => {

            value = parseFloat(value)
            const currency = currencyList[0]
            if (!isNaN(value)) {
              if (value > currency.total) {
                callback([new Error('超出金额')])
              } else {
                const newCurrency = Object.assign({}, currency, {
                  isModified: true,
                  money: value
                })
                this.setState({
                  currencyList: [newCurrency]
                })
                callback()
              }

            } else {
              callback([new Error('请输入数字')])
            }
          }
        },
      ]
    })

    return decorator
  },

  render(){
    const list = this.state.currencyList

    const { receivePools, relatedAccounts, selectedReceivePool, selectedReceiveAccount, moneyValid } = this.state
    if (list.length === 0) {
      return null
    }

    // 只有单个币种
    if (list.length <= 1) {
      const currency = list[0]
      return (
        <Modal
          title="申请资金"
          visible
          onCancel={this.handleCancel}
          onOk={this.handleSingleOk}
          wrapClassName={styles.applyMoneyModal}
          maskClosable={false}
          okText="发送申请"
        >
          <div className={styles.currencyTitle}>
            {IconMap[currency.currencyType].svg}
            <span className={styles.text}>{IconMap[currency.currencyType].text}</span>
            <span className={styles.money}>{currencyFormatter.format(currency.total - currency.locked, { code: currency.currencyType })}</span>
          </div>

          <Form layout="horizontal">
            <FormItem
              label="金额"
              labelCol={{ span: 5 }}
              wrapperCol={{ span: 15 }}
              validateStatus={moneyValid.status}
              help={moneyValid.help}
            >
              <Input
                addonBefore={currency.currencyType}
                value={this.state.singleMoney}
                onChange={this.handleMoneyChange}
              />
            </FormItem>

            {/* 转入库 */}
            <FormItem
              label="转入库"
              labelCol={{ span: 5 }}
              wrapperCol={{ span: 15 }}
            >
              <Select value={selectedReceivePool && selectedReceivePool.id + ''} onSelect={this.handleSelectPool}>
                {receivePools.map((p) => {
                  return (
                    <Option value={p.id + ''} key={p.id}>{p.name ? p.name : ''}</Option>
                  )
                })}
              </Select>
            </FormItem>

            {/* 账户 */}
            <FormItem
              label="账户"
              labelCol={{ span: 5 }}
              wrapperCol={{ span: 15 }}
            >
              <Select value={selectedReceiveAccount && selectedReceiveAccount.accountId + ''} onSelect={this.handleSelectAccount}>
                {relatedAccounts.map((a) => {
                  return (
                    <Option value={a.accountId + ''} key={a.accountId}>
                      <div className={styles.accountOption + ' applymoneyform-account-option'}>
                        <span className="account-option-icon">
                          {AccountIconMap[a.subType]}
                        </span>
                        <span className="account-option-subName">
                          {AccountName[a.subType]}
                        </span>
                        <span className="account-option-number">
                          {a.accountNumber ? a.accountNumber : '' }
                        </span>
                      </div>
                    </Option>
                  )
                })}
              </Select>
            </FormItem>
          </Form>

        </Modal>
      )
    } else {
      // 多个币种
      const selectedCurrency = this.state.selectedCurrency
      return (
        <Modal
          title="申请资金"
          visible
          onCancel={this.handleCancel}
          onOk={this.handleOk}
          wrapClassName={styles.applyMoneyModal}
          maskClosable={false}
          okText="发送申请"
        >
          <ol className={styles.currencyOlList}>
            {list.map((item, i) => {
              const isSelected = selectedCurrency === item.currencyType ? true : false
              const isModified = item.isModified ? true : false
              // 未申请状态
              return (
                <li className={classNames({
                  [styles.currencyLi]: true,
                  [styles.currencyLiSelected]: isSelected,
                  [styles.currencyLiModified]: isSelected ? false : isModified
                })} key={i}
                >
                  <div className={styles.currencyItem}>
                    {IconMap[item.currencyType].svg}
                    <span className={styles.text}>{IconMap[item.currencyType].text}</span>
                    <span className={styles.money}>{currencyFormatter.format(item.total, { code: item.currencyType })}</span>
                    <span
                      className={styles.applyBtn}
                      onClick={() => {
                        this.fetchSingleAccountList(item)
                        this.setState({ selectedCurrency: item.currencyType })
                      }}
                    >{isModified ? '修改' : '立即申请'}</span>
                  </div>

                  {/* 修改的信息 */}
                  {isModified && !isSelected &&
                    <div className={styles.modifyInfo}>
                      <span className={styles.money}>申请金额：{currencyFormatter.format(item.money, { code: item.currencyType })}</span>
                      <span>转入库：{item.toRepo.name}</span>
                    </div>
                  }

                  {/* 被选中的下拉框 */}
                  {isSelected &&
                    <ApplyMoney
                      currencyData={item}
                      receivePools={this.state.receivePools}
                      submit={this.submitFormData}
                      close={this.closeForm}
                    />
                  }
                </li>
              )
            })}
          </ol>

        </Modal>
      )
    }


  }
})

const ApplyMoneyModal = createForm()(ApplyMoneyModalForm)

export default ApplyMoneyModal
