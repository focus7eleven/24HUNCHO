import React from 'react'
import styles from './MoneyRepoContainer.scss'
import { Button, Popover, notification, message, Icon, Select, Tooltip, Popconfirm } from 'antd'
import { List } from 'immutable'
import GetMoneyModal from './GetMoneyModal'
import { ChinaIcon, JapanIcon, USAIcon, EuroIcon, AddIcon, EnglandIcon, GongShangIcon, JiaoTongIcon, NongYeIcon, AliPayIcon, WechatIcon, CashIcon, NumericalIcon, HongkongIcon } from 'svg'
import AddAccountModal from './AddAccountModal'
import MoneyRepoManagement, { CURRENCY_TYPE } from './MoneyRepoManagement'
import FundOwnerListPopup from './FundOwnerListPopup'
import SendMoreMoney from '../../components/modal/SendMoreMoney'
import config from '../../config'
import { pushURL } from 'actions/route'
import messageHandler from '../../utils/messageHandler'
import currencyFormatter from '../../utils/currencyWrap'
import AddCurrencyModal from './AddCurrencyModal'
import AddLockedModal from './AddLockedModal'
import AddMoneyRepoModal from './AddMoneyRepoModal'
import ApplyMoneyModal from './ApplyMoneyModal'
import InitAccountModal from './InitAccountModal'
import MoneyRepoCard from './MoneyRepoCard'
import _ from 'underscore'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getAffairRoles } from '../../actions/affair'
import imageNoPermission from 'images/img_no_permissions.png'
import classNames from 'classnames'
import PERMISSION from 'utils/permission'
import { MenkorIcon } from 'svg'

const Option = Select.Option

const CRUMB = {
  REPO: 'repo', // 只显示当前事务资金库名称
  MONEY: 'money',
  ACCOUNT: 'account'
}

const IconMap = {
  'CNY': <ChinaIcon/>,
  'USD': <USAIcon/>,
  'JPY': <JapanIcon/>,
  'EUR': <EuroIcon/>,
  'GBP': <EnglandIcon/>,
  'HKD': <HongkongIcon/>
}

const VisibleTypeMap = {
  0: '所有人可见',
  1: '盟内可见',
  2: '事务内可见',
  3: '本事务可见',
  4: '私密'
}

const FundTypeMap = {
  0: '公共事务库',
  1: '角色库',
  2: '公共库'
}

const CHANGE_TYPE = {
  0: '添加',
  1: '删除',
  2: '修改',
  3: '恢复',
  4: '接收',
  5: '发出',
  6: '记录',
}

const AccountIconMap = {
  // 0: <CashIcon fill="#ffa64d" height={36} style={{ marginLeft: '10px', marginRight: '7px' }}/>,
  0: <CashIcon fill="#ffa64d" height={36} style={{ marginLeft: '-5px', marginRight: '9px' }}/>,
  10: <GongShangIcon height={24} />,
  11: <JiaoTongIcon height={24} />,
  12: <NongYeIcon height={24} />,
  200: <AliPayIcon height={24} />,
  201: <WechatIcon height={24} />
}

const AccountIconXMap = {
  0: <CashIcon fill="#ffa64d" height={36} style={{ marginLeft: '4px', marginRight: '2px' }}/>,
  10: <GongShangIcon height={24} style={{ marginLeft: '10px', marginRight: '7px' }}/>,
  11: <JiaoTongIcon height={24} style={{ marginLeft: '10px', marginRight: '7px' }} />,
  12: <NongYeIcon height={24} style={{ marginLeft: '10px', marginRight: '7px' }} />,
  200: <AliPayIcon height={24} style={{ marginLeft: '10px', marginRight: '7px' }} />,
  201: <WechatIcon height={24} style={{ marginLeft: '10px', marginRight: '7px' }} />
}

const AccountTypeMap = {
  0: '现金',
  1: '银行卡',
  2: '第三方',
  3: '对公账户'
}

const MoneyRepoContainer = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired,
  },
  getInitialState(){
    return {
      hasPermission: false,
      isLoaded: false,
      showMoneyModal: false, // 直接发送资金的 Modal
      showAddMoneyRepoModal: false, // 添加资金库的 Modal
      showApplyMoneyModal: false, // 申请资金的 Modal
      showInitAccountModal: false, // 初始化账户的 Modal
      crumb: CRUMB.REPO,
      showAddAccountModal: false,
      showSendMoreMoney: false,
      showPopover: false,
      showAddCurrency: false,
      showAddLocked: false, //锁定金额的Modal
      showGetMoney: false,
      currentCurrency: [],
      list: [],
      sendingCurrency: 0,
      sendingName: '',
      sendingAccountList: [],
      showAccountList: [],
      currentCurrencyType: '',
      sendingPoolType: -1,
      accountCardOwnerName: '',
      accountCurrency: '',
      moneyChangeList: [],

      canUseFunds: List(), // 角色资金库
      publicFunds: [], // 公共资金库
      selectedApplyFund: null, // 选中的申请资金库
      selectedFund: null, // 选中的详细资金库
      initAccount: null, // 选中的初始化账户
      addMoneyRepoAuthorities: List(), // 选中资金库的负责人列表
      getMoneyCurrency: '', // 获取资金的当前币种
      getMoneyAccountList: [], // 获取资金的当前账户列表
      roleLists: [],

    }
  },

  componentDidMount(){
    const { affair } = this.props
    this.fetchPoolList(affair)
    this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true)
  },

  componentWillReceiveProps(nextProps){
    if ((nextProps.affair.get('id') != this.props.affair.get('id')) || (nextProps.affair.get('roleId') != this.props.affair.get('roleId'))){
      const { affair } = nextProps
      this.fetchPoolList(affair)
      this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true).then(() => {
        this.setState({
          crumb: CRUMB.REPO,
        })
      })
    }
  },

  getTime(str){
    let date = new Date(str)
    let Y = date.getFullYear() + '.'
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '.'
    let D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' '
    let H = date.getHours() + ':'
    let Min = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ' '
    return Y + M + D + H + Min
  },

  fetchAccountList(currencyTypes, fund){
    const { affair } = this.props
    const data = {
      poolId: fund.poolId,
      currencyTypes: currencyTypes,
      onlyValid: false
    }
    fetch(config.api.fund.usable_account_list(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify(data)
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      const originList = json.data

      this.setState({
        selectedFund: fund,
        showAccountList: originList,
        crumb: CRUMB.ACCOUNT,
        currentCurrency: currencyTypes,
        currentPoolType: fund.poolId,
      })
    })
  },

  handleSendMoney(name, currency, poolId){
    if (!this.props.currentRoles) {
      message.error('没有操作权限')
      return
    }
    const { affair } = this.props
    fetch(config.api.fund.list(currency, poolId, true), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.setState({
          sendingName: name,
          sendingCurrency: currency,
          sendingAccountList: json.data,
          showMoneyModal: true,
          showPopover: '',
        })
      }
    })
    this.setState({
      sendingName: name,
      sendingCurrency: currency,
      showMoneyModal: true,
      showPopover: ''
    })
  },

  handleSendMoreMoney(name, currency, poolType){
    if (!this.props.currentRoles){
      message.error('没有操作权限')
      return
    }
    const { showAccountList } = this.state

    const sendingAccountList = showAccountList.find((a) => a.currency === currency).fundRealAccountVOs

    this.setState({
      showSendMoreMoney: true,
      showPopover: '',
      sendingCurrency: currency,
      sendingName: name,
      sendingPoolType: poolType,
      sendingAccountList
    })

  },

  handleShowMoneyChange(currencyType, ownerName, poolId){
    const { affair } = this.props
    let ownerId = affair.get('roleId')
    fetch(config.api.fund.transfer(currencyType, ownerId, poolId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.setState({
          moneyChangeList: json.data,
          crumb: CRUMB.MONEY,
          accountCardOwnerName: ownerName,
          accountCurrency: currencyType
        })
      }
      else {
        notification.error({
          message: '网络错误'
        })
      }
    })

  },

  handleFundNameChange(fund, name) {

    const { affair } = this.props
    const { canUseFunds } = this.state

    fetch(config.api.fund.modify_name(fund.poolId, affair.get('roleId'), name), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        message.success('修改名称成功')
        const index = canUseFunds.findIndex((f) => f.poolId === fund.poolId)
        const newFund = Object.assign({}, fund)
        newFund.name = name
        this.setState({
          canUseFunds: canUseFunds.set(index, newFund)
        })
      }
    })
  },

  handleShowAccount(currencyType, poolType, ownerName){
    this.fetchAccountList(currencyType, poolType)
    this.setState({ accountCardOwnerName: ownerName, accountCurrency: currencyType, accountPoolType: poolType })
  },
  handlePopoverVisibleChange(poolId, currency, visible){
    if (visible){
      this.setState({ showPopover: `${poolId}${currency}` })
    }
    else {
      this.setState({ showPopover: '' })
    }
  },

  // trigger 添加币种 Modal
  handleAddCurrency() {

    const { selectedFund } = this.state
    // let currentCurrency = []
    // selectedFund.currencyList.map((v) => {
    //   currentCurrency.push(v.currencyType)
    // })

    this.setState({
      // currentCurrency,
      showAddCurrency: true,
      currencyPoolType: selectedFund.poolId
    })
  },

  // trigger 查看锁定金额 Modal
  handleCurrencyLocked(currency) {


    this.setState({
      showAddLocked: true,
      showLockedCurrency: currency,
    })



  },

  // trigger 获取资金Modal
  handleGetMoney(currencyType, poolId, poolName, accounts){
    this.setState({
      showGetMoney: true,
      getMoneyCurrency: currencyType,
      getMoneyAccountList: accounts,
      currentPoolType: poolId,
      currentPoolName: poolName,
    })
  },

  // 修改资金库可见性
  handleFundVisibleSelect(value) {
    const { affair } = this.props
    const { selectedFund, canUseFunds } = this.state

    selectedFund.publicType = value
    fetch(config.api.fund.public_type(selectedFund.poolId, value), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        message.success('修改资金库可见性成功！')
        const index = canUseFunds.findIndex((f) => f.poolId === selectedFund.poolId)
        const newFund = Object.assign({}, selectedFund)
        newFund.publicType = value
        this.setState({
          selectedFund: newFund,
          canUseFunds: canUseFunds.set(index, newFund)
        })
      }
    })
  },

  // 删除资金库
  handleDeleteFund(fund) {
    const { affair } = this.props
    const { canUseFunds } = this.state

    fetch(config.api.fund.remove_pool(fund.poolId), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        message.success('删除资金库成功！')
        const newFunds = canUseFunds.filter((f) => f.poolId !== fund.poolId)
        this.setState({
          canUseFunds: newFunds
        })
      } else {
        message.success('删除资金库失败！')
      }
    })
  },

  // 初始化账户
  handleInitAccount(money) {
    const { affair } = this.props
    const { initAccount, currentCurrency, selectedFund } = this.state

    fetch(config.api.fund.init_cash_account(initAccount.id, money), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {

        message.success('初始化成功')

        this.fetchAccountList(currentCurrency, selectedFund)
        this.setState({
          showInitAccountModal: false,
          initAccount: null
        })
      }
      else {
        message.error('初始化失败')
        this.setState({
          showInitAccountModal: false,
          initAccount: null
        })
      }
    })
  },

  // 失效账户
  handleInvalidAccount(account) {
    const { affair } = this.props
    const { currentCurrency, selectedFund } = this.state

    fetch(config.api.fund.invalid(account.id), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        message.success('该账户已失效')
        this.fetchAccountList(currentCurrency, selectedFund)
      }
    })
  },

  getPhrase(currency){
    return `${currency}${CURRENCY_TYPE[currency]}`
  },

  // 获取首页资金库数据并渲染
  fetchPoolList(affair){
    fetch(config.api.fund.homepage(), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        const { usableFundPools, fundsPublicVOs } = json.data

        this.setState({
          publicFunds: fundsPublicVOs,
          canUseFunds: List(usableFundPools),
          hasPermission: true,
          isLoaded: true,
        })
      }
      else {
        this.setState({
          hasPermission: false,
        })
      }
    })
  },

  //渲染资金库首页
  renderMoneyRepo() {

    const { canUseFunds, publicFunds } = this.state

    const enable = false
    return (
      <div>
        <div className={styles.canUseRepo}>
          <div className={styles.title}>我能使用的:</div>
          <div className={styles.repoList}>
            {canUseFunds.map((fund) => {
              return (
                <MoneyRepoCard key={fund.poolId} fund={fund} affair={this.props.affair} onClick={(fund) => {this.handleRepoBoxClick(fund)}} onModifyName={this.handleFundNameChange} onDelete={this.handleDeleteFund}/>
              )
            })}
            {/* 添加资金库按钮 */}
            {this.renderAddMoneyRepo()}
          </div>
        </div>
        {enable &&
          <div className={styles.publicMoneyRepo}>
            <div className={styles.title}>公开的:</div>
            <div className={styles.table}>
              <div className={styles.tableTh}>
                <span className={styles.name}>资金库名称</span>
                <span className={styles.type}>类型</span>
                <span className={styles.money}>资金</span>
              </div>
              {publicFunds.map((fund) => {
                return (
                  <div className={styles.listItem} key={fund.poolId}>

                    <span className={styles.itemName}>
                      {fund.logo ?
                        <img className={styles.logo} src={fund.logo} />
                      : (
                        <div className={styles.defaultLogo}><MenkorIcon /></div>
                      )}

                      <span>{fund.name}</span>
                    </span>
                    <span className={styles.itemType}>{FundTypeMap[fund.type]}</span>
                    <div className={styles.itemMoney}>
                      {this.renderMoneyList(fund.fundPoolCurrencyItemVOs)}
                      <div className={styles.buttonWrapper}>
                        <Button type="ghost" onClick={() => {
                          this.setState({
                            selectedApplyFund: fund,
                            showApplyMoneyModal: true
                          })
                        }}
                        >申请资金</Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        }
      </div>
    )
  },

    //渲染资金库各币种金额
  renderMoneyList(list) {

    if (list && list.length > 0) {
      let len = 0, index = 0

      list.every((item, i) => {
        len = len + 8 + item.total.toString().length
        if (len >= 40) {
          index = i
          return false
        }
        return true
      })

      let content = null
      if (index > 0) {
        content = (
          list.slice(index).map((item, i) => {
            const para = { code: item.currencyType }
            return (
              <div className={styles.currencyItem} key={i}>
                {IconMap[item.currencyType]}
                <span>{currencyFormatter.format(item.total, para)}</span>
              </div>
            )
          })
        )
      }
      return (
        <div className={styles.moneyList}>

          {index > 0 ?
            list.slice(0, index).map((item, i) => {
              const para = { code: item.currencyType }
              return (
                <div className={styles.currencyItem} key={i}>
                  {IconMap[item.currencyType]}
                  <span>{currencyFormatter.format(item.total, para)}</span>
                </div>
              )
            }) :
            list.map((item, i) => {
              const para = { code: item.currencyType }
              return (
                <div className={styles.currencyItem} key={i}>
                  {IconMap[item.currencyType]}
                  <span>{currencyFormatter.format(item.total, para)}</span>
                </div>
              )
            })
          }

          {/* 超出币种 hover 弹出框 */}
          {index > 0 ?
            <Popover content={content} trigger="hover" overlayClassName={styles.moneyPopover} placement="bottom">
              <span className={styles.hoverPop}>...</span>
            </Popover>
            : null
          }
        </div>
      )
    }

    return ( <div className={styles.moneyList} /> )

  },

    //添加资金库按钮
  renderAddMoneyRepo() {
    return (
      <div className={styles.addMoneyRepo}
        onClick={() => {this.setState({ showAddMoneyRepoModal: true })}}
      >
        <AddIcon />
        <div>添加资金库</div>
      </div>
    )
  },

  handleRepoBoxClick(fund) {
    const currencyType = fund.currencyList.map((c) => c.currencyType)
    this.fetchAccountList(currencyType, fund)
  },

  renderMoneyChange(){
    return this.state.moneyChangeList.length != 0 ? (
      <div className={styles.moneyChangeContainer}>
        {
          this.state.moneyChangeList.map((v, k) => {
            return (
              <div className={styles.row} key={k}>
                <div className={styles.detail}>
                  <div className={styles.title}>交易-{CHANGE_TYPE[v.type]}&nbsp;{v.toRole}</div>
                  <div className={styles.time}>发起时间:&nbsp;{this.getTime(v.createTime)}</div>
                  <div className={styles.place}>发起位置:&nbsp;{v.context}</div>
                </div>
                <div className={styles.count}>
                  {AccountIconMap[v.accountType] }
                  <div className={styles.type}>{v.realAccountName}</div>
                  {/*v.type中4是接收；5是发送；6是记录 */}
                  <div className={styles.number} style={{ color: (v.type == 4 || v.type == 6) ? '#48a421' : '#f55b6c' }}>{(v.type == 4 || v.type == 6) ? '+' : '-'}{currencyFormatter.format(v.money, { code: v.currency })}</div>
                </div>
                <div className={styles.leftCount}>
                  <span className={styles.text}>余额:</span>
                  <span className={styles.number}>{currencyFormatter.format(v.remain, { code: v.currency })}</span>
                </div>
              </div>
            )
          })
        }
      </div>
    ) : (
      <div>没有记录</div>
    )
  },

  renderAccount(){

    const { selectedFund, showAccountList } = this.state

    return (
      <div className={styles.accountContainer}>
        {showAccountList.map((item, i) => {
          if (item) {
            return (
              <div className={styles.accountItem} key={i}>
                <div className={styles.accountItemHeader}>
                  <span className={styles.title}>{this.getPhrase(item.currency)}</span>
                  <span className={styles.amount}>{currencyFormatter.format(item.total, { code: item.currency })}</span>
                  {
                    item.locked == 0 ? null
                    :
                    <span className={styles.locked} onClick={() => this.handleCurrencyLocked(item.currency)}>
                      {`(锁定金额:${currencyFormatter.format(item.locked, { code: item.currency })})`}
                    </span>
                  }
                  <span className={styles.change}>
                    <Tooltip
                      placement="top"
                      trigger="hover"
                      title="查看资金变化"
                      overlayClassName={styles.moneyChangeTooltip}
                    >
                      <NumericalIcon
                        onClick={this.handleShowMoneyChange.bind(null, item.currency, `${selectedFund.name}`, selectedFund.poolId)}
                      />
                    </Tooltip>
                  </span>
                </div>
                <ol className={styles.accountOl}>
                  {item.fundRealAccountVOs.map((account, j) => {
                    const state = account.state
                    const cx = classNames({
                      [styles.accountLi]: true,
                      [styles.accountLiInvalid]: (state === 1)
                    })

                    return (
                      <li key={j} className={cx}>
                        <span className={styles.icon}>{AccountIconXMap[account.subType]}</span>
                        <span className={styles.accountName}>{account.subTypeName}</span>
                        <span className={classNames({ [styles.typeName]: true, [styles.typeNameGrow]: (state === 1) || (state === 0 ) })}>{AccountTypeMap[account.type] + (parseInt(account.subType) == 0 ? '' : ' | ') + account.accountNumber}</span>
                        {/* 显示初始化按钮 */}
                        {(state === 2) ?
                          <span
                            className={styles.initBtn}
                            onClick={() => {
                              this.setState({
                                showInitAccountModal: true,
                                initAccount: account
                              })
                            }}
                          >初始化</span> : null
                        }
                        {/* 显示失效按钮 */}
                        {(state === 0 && account.amount === 0 && account.subType != 0) ?
                          <Popconfirm placement="topLeft" title="账户失效后讲无法操作该账户，是否继续？" onConfirm={() => this.handleInvalidAccount(account)}>
                            <span className={styles.invalidBtn}>失效</span>
                          </Popconfirm> : null
                        }
                        {
                          state == 2 ? null :
                          <span className={styles.money}>{(state === 1) ? '已失效' : currencyFormatter.format(account.amount, { code: account.currency })}</span>
                        }
                      </li>
                    )
                  })}
                </ol>

                <div className={styles.buttonBar}>
                  <div className={styles.addAccountBtn} onClick={() => {
                    this.setState({
                      showAddAccountModal: true,
                      currentCurrencyType: item.currency,
                      currentPoolType: selectedFund.poolId
                    })
                  }}
                  ><Icon type="plus" />添加账户</div>
                  <Button
                    className={styles.getBtn}
                    type="ghost"
                    size="large"
                    onClick={() => this.handleGetMoney(item.currency, selectedFund.poolId, selectedFund.name, item.fundRealAccountVOs)}
                  >获取资金</Button>
                  <Button
                    type="ghost"
                    size="large"
                    onClick={() => this.handleSendMoreMoney(selectedFund.name, item.currency, selectedFund.poolId)}
                  >发送资金</Button>
                </div>
              </div>
            )
          }

          return null
        })}
      </div>
    )
  },

    // 资金库的汇总显示
  renderManagerView() {
    return <MoneyRepoManagement isContainChildren={this.state.isContainChildren} affair={this.props.affair} />
  },

  renderNotManagerView() {
    const { crumb } = this.state
    return (
      <div className={styles.notManager}>
        { crumb == CRUMB.REPO ? this.renderMoneyRepo() : crumb == CRUMB.MONEY ? this.renderMoneyChange() : this.renderAccount() }
      </div>
    )
  },

  render() {
    const {
      hasPermission,
      isLoaded,
      showAddAccountModal,
      showSendMoreMoney,
      currentCurrency,
      currentPoolName,
      currentPoolType,
      currentCurrencyType,
      crumb,
      sendingCurrency,
      sendingName,
      sendingAccountList,
      sendingPoolType,
      selectedFund,
      initAccount,
      getMoneyCurrency,
      getMoneyAccountList,
      showLockedCurrency,
    } = this.state

    if (!isLoaded) {
      return (<div />)
    }

    if (isLoaded && !hasPermission) {
      return (
        <div className={styles.noPermission}>
          <img src={imageNoPermission}/>
          <span>您无权限查看该页面</span>
        </div>
      )
    }

    const { affair, currentRoles } = this.props
    return (isLoaded && hasPermission) && (
      <div className={styles.moneyRepoContainer}>
        {/* 导航部分 */}

        <div className={styles.top}>
          <div className={styles.left}>
            {crumb == CRUMB.REPO ? (
              <span>{`${affair.get('name')}的资金库`}</span>
            ) : (
              <div className={styles.accountTop}>
                <span className={styles.affairName}
                  style={{ color: '#4a90e2', cursor: 'pointer' }}
                  onClick={() => {
                    this.fetchPoolList(this.props.affair)
                    this.setState({
                      crumb: CRUMB.REPO,
                      currentCurrencyType: '',
                      showAccountList: [],
                    })
                  }}
                >{`${affair.get('name')}的资金库`}</span>
                {crumb == CRUMB.ACCOUNT ? (
                  <span className={styles.accountName}>
                    {' > ' + `${selectedFund.name}`}
                  </span>
                ) : (
                  <div className={styles.changeTitle}>
                    <span className={styles.accountName}>
                      <span>{' > '}</span>
                      <span style={{ color: '#4a90e2', cursor: 'pointer' }} onClick={() => {
                        this.setState({
                          crumb: CRUMB.ACCOUNT,
                        })
                      }}
                      >{`${this.state.accountCardOwnerName}`}</span>
                    </span>
                    <span className={styles.currencyName}>
                      <span>{' > '}</span>
                      <span>{`${CURRENCY_TYPE[this.state.accountCurrency]}账户资金变化`}</span>
                    </span>
                  </div>
                )}



                <div className={styles.accountOwnerList}>
                  <span>管理者：</span>
                  <FundOwnerListPopup affair={affair} fund={selectedFund}/>
                </div>

                <div className={styles.accountVisiblity}>
                  <Select value={(selectedFund && selectedFund.publicType) ? (selectedFund.publicType + '') : ('0')} onSelect={this.handleFundVisibleSelect}>
                    <Option value={0 + ''}>{VisibleTypeMap[0]}</Option>
                    <Option value={1 + ''}>{VisibleTypeMap[1]}</Option>
                    <Option value={2 + ''}>{VisibleTypeMap[2]}</Option>
                    <Option value={3 + ''}>{VisibleTypeMap[3]}</Option>
                    <Option value={4 + ''}>{VisibleTypeMap[4]}</Option>
                  </Select>
                </div>

                <div className={styles.addCurrency}>
                  <Button
                    type="primary"
                    size="large"
                    className={styles.btn}
                    onClick={this.handleAddCurrency}
                  >添加币种</Button>
                </div>
              </div>

            )}
          </div>
          {crumb == CRUMB.REPO && affair.validatePermissions(PERMISSION.ENTER_FUND_MANAGER_VIEW) &&
            <span
              className={styles.right}
              onClick={() => { this.props.pushURL(`/workspace/affair/${this.props.affair.get('id')}/repo/funds/managerView`) }}
            >进入管理员视角></span>
          }
        </div>

        {/* 资金库中的主要内容 */}
        <div className={styles.content}>
          { this.renderNotManagerView() }
        </div>

        {/* 发送资金弹出框 */}

        {showSendMoreMoney &&
          <SendMoreMoney
            callback={() => {
              this.setState({
                showSendMoreMoney: false,
                sendingName: '',
                sendingCurrency: 0,
                sendingAccountList: [],
                sendingPoolType: -1,
              })
              _.debounce(this.fetchAccountList(currentCurrency, selectedFund), 500)
            }}
            rolelist={currentRoles.roles.concat(currentRoles.guestRoles).concat(currentRoles.allianceRoles)}
            accountName={sendingName}
            currency={sendingCurrency}
            accountList={sendingAccountList}
            poolType={sendingPoolType}
            affair={affair}
          />
        }

        <AddAccountModal
          visible={showAddAccountModal}
          callback={() => {
            this.setState({ showAddAccountModal: false })
            this.fetchAccountList(currentCurrency, selectedFund)
          }}
          affair={this.props.affair}
          currencyType={currentCurrencyType}
          poolType={currentPoolType}
        />

        {this.state.showGetMoney &&
          <GetMoneyModal
            callback={() => {
              this.setState({ showGetMoney: false })
              this.forceUpdate()
              this.fetchAccountList(currentCurrency, selectedFund)
            }}
            affair={this.props.affair}
            poolId={currentPoolType}
            poolName={currentPoolName}
            currencyType={getMoneyCurrency}
            accountList={getMoneyAccountList}
          />
        }

        {/* 添加币种弹出框 */}
        {this.state.showAddCurrency &&
          <AddCurrencyModal
            callback={(currencyList) => {
              this.setState({ showAddCurrency: false })
              _.debounce(this.fetchAccountList(currentCurrency.concat(currencyList), selectedFund), 500)
            }}
            currentCurrency={currentCurrency}
            affair={this.props.affair}
            poolType={currentPoolType}
          />
        }

        {/* 添加锁定金额弹出框 */}
        {this.state.showAddLocked &&
          <AddLockedModal
            affair={affair}
            poolId={currentPoolType}
            fresh={() => {this.fetchPoolList(affair)}}
            onCancel={() => this.setState({ showAddLocked: false })}
            currencyType={showLockedCurrency}
          />
        }

        {/* 添加资金库弹出框 */}
        {this.state.showAddMoneyRepoModal &&
          <AddMoneyRepoModal affair={affair} fresh={() => this.fetchPoolList(affair)} onCancel={() => this.setState({ showAddMoneyRepoModal: false })}/>
        }

        {/* 申请资金弹出框 */}
        {this.state.showApplyMoneyModal &&
          <ApplyMoneyModal
            affair={affair}
            fund={this.state.selectedApplyFund}
            fresh={() => this.fetchPoolList(affair)}
            onCancel={() => this.setState({ showApplyMoneyModal: false })}
          />
        }

        {/* 初始化账户弹出框 */}
        {this.state.showInitAccountModal &&
          <InitAccountModal account={initAccount} initAccount={this.handleInitAccount} onCancel={() => this.setState({ showInitAccountModal: false })}/>
        }
      </div>
    )
  }
})

function mapStateToProps(state, props){
  return {
    currentRoles: state.getIn(['affair', 'affairAttender', 'currentRoles', props.affair.get('id')]),
  }
}
function mapDispatchToProps(dispatch){
  return {
    getAffairRoles: bindActionCreators(getAffairRoles, dispatch),
    pushURL: bindActionCreators(pushURL, dispatch)
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(MoneyRepoContainer)
