import React from 'react'
import styles from './SendMoreMoney.scss'
import { Modal, Input, Checkbox, Select, Message } from 'antd'
import { GongShangIcon, JiaoTongIcon, NongYeIcon, AliPayIcon, WechatIcon, SearchIcon, DeleteIcon, CashIcon } from 'svg'
import currencyFormatter from '../../utils/currencyWrap'
import config from '../../config'
import messageHandler from 'messageHandler'


const Option = Select.Option
const AccountIconMap = {
  0: <CashIcon fill="#ffa64d" height={24} style={{ position: 'relative', left: '-4px', marginRight: '-1px' }}/>,
  10: <GongShangIcon height={16} />,
  11: <JiaoTongIcon height={16} />,
  12: <NongYeIcon height={16} />,
  200: <AliPayIcon height={16} />,
  201: <WechatIcon height={16} />
}

const SendMoreMoney = React.createClass({

  handleCancel() {
    this.props.callback()
  },

  handleOk() {
    const { chosenList } = this.state
    let amountFlag = true
    let fundOrders = []
    //是否选择接受账户
    if (this.state.accountId == 0){
      Message.error('未选择发送账户')
      return
    }
    chosenList.map((v) => {
      if (!v.amount){
        amountFlag = false
      }
    })
    if (amountFlag == false){
      Message.error('发送金额未填写完整')
      return
    }
    if (chosenList.length == 0){
      Message.error('未选择接受人')
      return
    }
    let accountNumber, sendNumber = 0
    this.props.accountList.map((v) => {
      if (v.id == this.state.accountId){
        accountNumber = parseInt(v.amount - v.locked)
      }
    })
    chosenList.map((v) => {
      sendNumber += parseInt(v.amount)
    })
    if (sendNumber > accountNumber){
      Message.error('发送金额不能超出账户余额')
      return
    }
    chosenList.map((v) => {
      fundOrders.push({
        toRoleId: v.roleId,
        amount: v.amount,
        remark: v.remark ? v.remark : '',
      })
    })
    fetch(config.api.order.pay_fund(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({
        accountId: this.state.accountId,
        context: '',
        chat: false,
        taskId: 0,
        fundOrders: fundOrders,
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        Message.success('发送成功')
      }
      if (json.code == 0 || json.code == 20000) {
        this.props.callback()
      }
    })
  },

  getInitialState() {
    return {
      chosenList: [],
      roleList: [],
      accountId: 0,
      searchKeyword: '',
    }
  },

  componentWillMount() {
    fetch(config.api.affair.role.all(), {
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      credentials: 'include',
      method: 'GET',
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.setState({ roleList: json.data })
      }
    })
  },

  handleChooseRole(role, e) {
    let { chosenList } = this.state
    if (e.target.checked == true){
      chosenList.push(role)
    }
    else if (e.target.checked == false){
      chosenList = chosenList.filter((v) => {return v.roleId != role.roleId})
    }
    this.setState({
      chosenList,
    })
  },

  handleSelectAll(e) {
    let result = []
    if (e.target.checked == true) {
      this.state.roleList.filter((v) => `${v.roleTitle}-${v.username}`.includes(this.state.searchKeyword)).map((v) => {
        result.push(v)
      })
    }
    else {
      result = []
    }
    this.setState({
      chosenList: result,
    })
  },

  handleDeleteRole(role) {
    let { chosenList } = this.state
    chosenList = chosenList.filter((v) => {return v.roleId != role.roleId})
    this.setState({
      chosenList: chosenList,
    })
  },

  handleChangeAmount(role, e) {
    role.amount = e.target.value
    this.setState({
      chosenList: this.state.chosenList,
    })
  },

  handleChangeRemark(role, e) {
    role.remark = e.target.value
    this.setState({
      chosenList: this.state.chosenList,
    })
  },

  handleChangeAccount(value) {
    this.setState({
      accountId: parseInt(value),
    })
  },

  render() {
    const { roleList, chosenList } = this.state
    let selectAll = roleList.filter((v) => `${v.roleTitle}-${v.username}`.includes(this.state.searchKeyword)).length != 0 ? true : false
    roleList.filter((v) => `${v.roleTitle}-${v.username}`.includes(this.state.searchKeyword)).map((v) => {
      if (!chosenList.some((c) => {return c.roleId == v.roleId})){
        selectAll = false
      }
    })
    return (
      <Modal
        title="发送资金"
        wrapClassName={styles.moreMoneyContainer}
        maskClosable={false}
        onCancel={this.handleCancel}
        onOk={this.handleOk}
        visible
      >
        <div className={styles.left}>
          <div className={styles.search}>
            <Input placeholder="搜索接收方" onChange={(e) => this.setState({ searchKeyword: e.target.value })}/>
            <SearchIcon height="16px" fill="#cccccc"/>
          </div>
          <div className={styles.result}>
            <div className={styles.row}>
              <Checkbox onChange={this.handleSelectAll} checked={selectAll}><span style={{ marginLeft: '4px' }} >全选</span></Checkbox>
            </div>
            {roleList.filter((v) => `${v.roleTitle}-${v.username}`.includes(this.state.searchKeyword)).map((v) => {
              const str = `${v.roleTitle}-${v.username}`

              /* 将关键字分隔的字符串数组中间再插入原来的关键字 */
              let splitStrs = str.split(this.state.searchKeyword)
              splitStrs.unshift([])
              const strList = splitStrs.reduce((a, b) => {
                if (a.length > 0) {
                  a.push(this.state.searchKeyword)
                }
                a.push(b)
                return a
              }) || []

              return (
                <div className={styles.row} key={v.roleId}>
                  <Checkbox onChange={this.handleChooseRole.bind(null, v)} checked={chosenList.some((w) => {return v.roleId == w.roleId})}>
                    {v.avatar ?
                      <img src={v.avatar} className={styles.avatar}/>
                    : (
                      <div className={styles.avatar} style={{ backgroundColor: '#d8d8d8' }} />
                    )}
                    {this.state.searchKeyword == '' ?
                      str
                    : (
                      strList.map((str, index) =>
                        str == this.state.searchKeyword ?
                          <span key={index} style={{ color: '#926dea' }}>{this.state.searchKeyword}</span>
                        :
                        str
                      )
                    )}
                  </Checkbox>
                </div>
              )
            })}
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.chosenList}>
            {chosenList.map((v, k) => {
              return (
                <div className={styles.row} key={k}>
                  <DeleteIcon fill="#cccccc" height="16px" onClick={this.handleDeleteRole.bind(null, v)}/>
                  <div className={styles.detail}>
                    {v.avatar ? <img src={v.avatar} className={styles.avatar}/> : <div className={styles.avatar} style={{ backgroundColor: '#d8d8d8' }} />}
                    <span className={styles.name}>{v.roleTitle}-{v.username}</span>
                  </div>
                  <Input addonBefore={this.props.currency} placeholder="输入金额" className={styles.numberInput} onChange={this.handleChangeAmount.bind(null, v)}/>
                  <Input placeholder="输入备注" className={styles.remarkInput} onChange={this.handleChangeRemark.bind(null, v)}/>
                </div>
              )
            })}
          </div>
          <div className={styles.target}>
            <span className={styles.text}>发送账户:</span>
            <div className={styles.btn}>
              <Input placeholder={`${this.props.accountName}的资金库(${this.props.poolType == 0 ? '公共库' : '角色库'})`} className={styles.roleInput} disabled/>
              <Select className={styles.selectInput} onChange={this.handleChangeAccount}>
                {this.props.accountList.map((v, k) => {
                  return (
                    <Option key={k} value={v.id.toString()} disabled={(v.amount - v.locked) == 0 ? true : false}>
                      <div className={styles.subRow}>
                        {AccountIconMap[v.subType]}
                        <span className={styles.subTypeName}>{v.subTypeName}</span>
                        <span className={styles.leftNumber}>剩余{currencyFormatter.format((v.amount - v.locked), { code: this.props.currency })}</span>
                      </div>
                    </Option>
                  )
                })}
              </Select>
            </div>
          </div>
        </div>
      </Modal>
    )
  }
})

export default SendMoreMoney
