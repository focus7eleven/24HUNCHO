import React from 'react'
import { fromJS, List } from 'immutable'
import { Card, Form, Radio, Input, Button } from 'antd'
import AffairAvatar from '../../components/avatar/AffairAvatar'
import styles from './FundPoolCard.scss'

import { CashIcon, AliPayIcon, WechatIcon, NongYeIcon, GongShangIcon, JiaoTongIcon, TransferIcon } from '../../public/svg'

const FormItem = Form.Item
const RadioGroup = Radio.Group
const numPatterns = /^[0-9]*\.?[0-9]+$/

//账户类型
const ACCOUNTTYPE = {
  CASH: 0,
  ICBC: 10, //中国工商银行
  BOCOM: 11, //中国工商银行
  ABC: 12, //中国农业银行
  ALIPAY: 200, // 支付宝
  WECHAT: 201, // 微信钱包
}

//资金库类型
const POOLTYPE = {
  ROLE: 1,
  AFFAIR: 0,
  AFFAIR_1: 2,
}


function getPoolType(type) {
  switch (type) {
    case POOLTYPE.ROLE:
      return '角色库'
    case POOLTYPE.AFFAIR_1:
    case POOLTYPE.AFFAIR:
      return '公共库'
  }
}

const getAccountIcon = function (code) {
  switch (code) {
    case ACCOUNTTYPE.CASH:
      return <CashIcon style={{ width: 16, height: 16, fill: '#ffa64d' }}/>
    case ACCOUNTTYPE.ICBC:
      return <GongShangIcon style={{ width: 16, height: 16 }}/>
    case ACCOUNTTYPE.BOCOM:
      return <JiaoTongIcon style={{ width: 16, height: 16 }}/>
    case ACCOUNTTYPE.ABC:
      return <NongYeIcon style={{ width: 16, height: 16 }}/>
    case ACCOUNTTYPE.ALIPAY:
      return <AliPayIcon style={{ width: 16, height: 16 }}/>
    case ACCOUNTTYPE.WECHAT:
      return <WechatIcon style={{ width: 16, height: 16 }}/>
  }
}

function getCurrencySymbol(currency) {
  switch (currency) {
    case 'CNY':
      return '¥'
    case 'USD':
      return '$'
    case 'EUR':
      return '€'
    case 'GBP':
      return '£'
    case 'JPY':
      return '¥'
  }
}

function formatValue(value) {
  value = value.toFixed(2)
  value += ''
  let list = value.split('.')
  const prefix = list[0].charAt(0) === '-' ? '-' : ''
  let num = prefix ? list[0].slice(1) : list[0]
  let result = ''
  while (num.length > 3) {
    result = `,${num.slice(-3)}${result}`
    num = num.slice(0, num.length - 3)
  }
  if (num) {
    result = num + result
  }
  return `${prefix}${result}${list[1] ? `.${list[1]}` : ''}`
}

//账户号码处理
function showAccountNum(code, num) {
  let result
  //只处理了支付宝
  if (code == ACCOUNTTYPE.ALIPAY) {
    const at = num.indexOf('@')
    if (at >= 0) {
      //邮箱格式
      const prefix = num.substr(0, at - 2)
      const after = num.substr(at)
      result = prefix + '***' + after
    } else {
      //手机格式
      const prefix = num.substr(0, 3)
      const after = num.substr(num.length - 2)
      result = prefix
      let i = 2
      if (i >= num.length - 2){
        result = num
      } else {
        while (i < num.length - 2) {
          result += '*'
          i++
        }
        result += after
      }

    }
  } else if (code == ACCOUNTTYPE.CASH){
    result = num
  } else {
    result = num.substr(num.length - 4)
  }
  return result
}


const FundPoolCardComponent = React.createClass({
  PropTypes: {
    fundName: React.PropTypes.string.isRequired,
    fundAvatar: React.PropTypes.string.isRequired,
    fundType: React.PropTypes.number.isRequired,
    fundId: React.PropTypes.number.isRequired,
    affairId: React.PropTypes.number.isRequired,
    cardType: React.PropTypes.number.isRequired,
    amount: React.PropTypes.number.isRequired,
    submitCallback: React.PropTypes.func.isRequired,
    inList: React.PropTypes.array.isRequired,

  },
  getInitialState() {
    return {
      isUpdate: false,
      addAmount: 0,
      outList: List(),
    }
  },
  getDefaultProps() {
    return {
      outList: List(),
    }
  },

  componentWillMount() {
    this.setState({
      outList: this.props.outList,
      showTransferPane: this.props.showTransferPane,
    })
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.showTransferPane != nextProps.showTransferPane) {
      this.setState({
        showTransferPane: nextProps.showTransferPane,
      })
    }
    if (this.props.outList == null && nextProps.outList != null) {
      this.setState({
        outList: nextProps.outList
      })
    }
  },

  handleAddMoney() {
    const { getOutCallback, affairId, moneyType, fundId, outList } = this.props

    if (outList == null) {
      getOutCallback(affairId, fundId, moneyType)
    } else {
      this.setState({
        showTransferPane: true,
      })
    }

    this.transferPane.style.maxHeight = '1000px'
    this.transferPane.style.borderTop = '4px solid #fafafa'
    // this.transferPane.style.display=display?'block':'none';
  },

  handleSubmit(result) {
    const { cardType, affairId, submitCallback, fundId, moneyType } = this.props

    if (cardType == 0) {
      result = result.set('amount', this.state.addAmount)
    }

    submitCallback(affairId, moneyType, fundId, this.state.isUpdate, result)
    this.setState({
      showTransferPane: false,
      isUpdate: true,
    })

    this.handleCancel()
  },

  handleCancel() {
    this.transferPane.style.maxHeight = '0px'
    this.transferPane.style.borderTop = '1px solid #fafafa'
    this.setState({
      showTransferPane: false,
    })
  },

  onChange(id, value) {
    const { outList } = this.state

    const idx = outList.findIndex((ele) => {
      return ele.get('id') == id
    })
    // console.log(value);

    const account = outList.get(idx)
    const newOutList = outList.set(idx, account.set('transferAmount', value * 1))


    let addAmount = 0
    newOutList.forEach((ele) => {

      addAmount = addAmount * 1 + ele.get('transferAmount') * 1
    })

    this.setState({
      addAmount: addAmount,
      outList: newOutList,
    })
  },

  renderBtn() {

    const { isRecord } = this.props
    if (this.state.showTransferPane) {
      return null
    } else {
      if (isRecord) {
        return (
          <span className={styles.added}>已添加</span>
        )
      } else {
        return (
          <Button className={styles.addBtn} onClick={this.handleAddMoney}>添加</Button>
        )
      }
    }
  },

  render() {
    const { cardType, isRecord, fundName, fundAvatar, fundType, amount, transferAmount, inList, inAccount, inFundName, moneyType } = this.props

    // console.log('---------------inAccount is '+inAccount);
    // console.log('this.state.showTransferPane is '+this.state.showTransferPane + ',this.props.showTransferPane is '+this.props.showTransferPane);
    let inAccountName = ''
    let inAccountNum = ''
    if (inAccount) {
      inAccountName = inAccount.get('subTypeName')
      inAccountNum = showAccountNum(inAccount.get('subType'), inAccount.get('accountNumber'))
    }
    return (
      <div className={styles.cardContainer} ref={(el) => {
        this.cardContainer = el
      }}
      >
        <Card className={styles.fundLibraryCard}>
          <div className={styles.fundInfo}>
            <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
              {fundType == POOLTYPE.ROLE ?
                fundAvatar.get('avatar') ? <img src={fundAvatar.get('avatar')} alt="头像" className={styles.cAvatar}/> : <span className={styles.cAvatar} />
                :
                <div className={styles.fundAvatarWrapper}>
                  <AffairAvatar affair={fundAvatar} sideLength={30} previewURL={fundAvatar.get('avatar')} />
                </div>

              }
            </div>

            <div style={{ position: 'relative', display: 'inline-block', verticalAlign: 'middle' }}>
              <div className={styles.name}>{fundName}</div>
              <div className={styles.type}>{getPoolType(fundType)}</div>
            </div>
          </div>
          <span className={styles.fundMoney}>{getCurrencySymbol(moneyType)}<span>{formatValue(amount)}</span></span>
          {this.renderBtn()}
          <div className={styles.transferPane} ref={(el) => this.transferPane = el}>
            {this.state.showTransferPane ?
              <TransferPane
                onChange={this.onChange}
                moneyType={moneyType}
                outList={this.state.outList}
                inList={inList}
                inAccount={inAccount}
                inFundName={inFundName}
                cardType={cardType}
                totalAmount={amount}
                addAmount={this.state.addAmount}
                submitCallback={this.handleSubmit}
                cancelCallback={this.handleCancel}
              /> : null}
          </div>
          {isRecord &&
            (<div className={styles.fundFooter}>
              <div className={styles.amountContainer}>
                已添加:{getCurrencySymbol(moneyType)}
                <span className={styles.amount}>{transferAmount}</span>
              </div>
              <div className={styles.transferLog}>
                <span className={styles.transferIcon}><TransferIcon/></span>
                <span>{inAccountName}（{inAccountNum}）</span>
              </div>
            </div>)
          }

        </Card>

      </div>
    )
  }
})

const FundPoolCard = Form.create()(FundPoolCardComponent)

const TransferPaneComponent = React.createClass({

  handleSubmit() {
    const { getFieldsValue, validateFieldsAndScroll } = this.props.form
    const { cardType } = this.props

    const res = fromJS(getFieldsValue())
    let validateList = []
    let i = 0
    if (cardType == 0) {
      res.map((ele, key) => {
        if (key != 'amount') {
          validateList[i] = key
          i++
        }
      })
    } else {
      validateList = ['amount', 'inAccount']
    }

    validateFieldsAndScroll(validateList, (err) => {
      if (err) {
        return
      } else {
        const result = fromJS(getFieldsValue())
        this.props.submitCallback(result)
      }
    })

  },

  handleCancel() {
    this.props.cancelCallback()
  },

  render() {
    const { getFieldDecorator, validateFields } = this.props.form
    const { cardType, outList, inList, inAccount, onChange, addAmount, totalAmount, inFundName, moneyType } = this.props


    const inAccountRules = getFieldDecorator('inAccount', {
      initialValue: inAccount ? inAccount.get('id') + ',' + inAccount.get('subTypeName') : null,
    })

    const filterInList = inList.filter((ele) => {
      return ele.get('currency') == moneyType
    })

    const amountRules = getFieldDecorator('amount', {

      rules: [{
        required: true,
        message: '请输入转账金额！'
      }, {
        pattern: numPatterns,
        message: '请输入有效数字！'
      }, {
        validator: (rule, value, callback) => {
          if (value && value > totalAmount) {
            callback('转入金额不能超出该资金库最大金额！')
          } else {
            callback()
          }
        }
      }]

    })

    return (
      <Form>
        {cardType == 0 ? (
          <div>
            <div className={styles.outAccountList}>
              <p>选择账户</p>
              <div className={styles.accountTypes}>
                {outList.map((ele) => {
                  const id = ele.get('id')
                  const name = ele.get('subTypeName')
                  const amount = ele.get('amount')
                  const code = ele.get('subType')
                  const num = showAccountNum(code, ele.get('accountNumber'))

                  const accountRule = getFieldDecorator(`out:${id},${name}`, {

                    onChange: (e) => {
                      validateFields([`out:${id},${name}`], (err) => {
                        if (err) {
                          return
                        } else {
                          const result = e.target.getAttribute('id').split(':')[1].split(',')
                          if (e.target.value == '') {
                            onChange(result[0], e.target.value)
                          }
                          if (!numPatterns.test(e.target.value)) {
                            return
                          } else {
                            onChange(result[0], e.target.value)
                          }
                        }
                      })

                    },

                    rules: [{
                      pattern: numPatterns,
                      message: '请输入有效数字！'
                    }, {
                      validator: (rule, value, callback) => {
                        if (value && value > amount) {
                          callback('转出金额不能超过' + amount + '!')
                        } else {
                          callback()
                        }
                      }
                    }],

                  })
                  return (
                    <div className={styles.outAccount} key={id}>
                      <div className={styles.accountInfo}>{getAccountIcon(code)} {name}
                        {code !== ACCOUNTTYPE.CASH ? num : null}
                      </div>
                      <div className={styles.accountAmount}> 剩余{getCurrencySymbol(moneyType)}{amount} </div>
                      <FormItem className={styles.inputAmount}>
                        {accountRule(<Input addonBefore={moneyType} autoComplete="off"/>)}
                      </FormItem>
                    </div>
                  )
                })}
              </div>
              <div className={styles.totalAmount}>
                  已添加资金：<span
                    ref={(el) => this.totalAmount = el}
                        >{formatValue(addAmount * 1)}</span>
              </div>
            </div>
            <FormItem/>
          </div>) :
          (
            <FormItem className={styles.fund}>
              <p>资金数额</p>
              {amountRules(<Input addonBefore={moneyType} autoComplete="off"/>)}
            </FormItem>
          )}

        <FormItem className={styles.account}>
          <p>转入账户</p>
          <div className={styles.accountTypes}>
            {inAccountRules(<RadioGroup>
              {filterInList.size !== 0 ?
                filterInList.map((ele) => {
                  const id = ele.get('id')
                  const name = ele.get('subTypeName')
                  const code = ele.get('subType')
                  const no = showAccountNum(code, ele.get('accountNumber'))
                  // console.log('idx is '+idx+',id is '+id+', name is '+name+',currency is '+ele.get('currency'))
                  if (code == ACCOUNTTYPE.CASH) {
                    return (
                      <Radio className={styles.accountRadioStyle} value={id + ',' + name} key={id}>
                        <span className={styles.accountName}>{getAccountIcon(code)} 现金 </span>
                        <span className={styles.accountAmount}>
                          {inFundName}的现金账户
                        </span>
                      </Radio>)
                  } else if (code == ACCOUNTTYPE.ALIPAY || code == ACCOUNTTYPE.WECHAT) {
                    return (
                      <Radio className={styles.accountRadioStyle} value={id + ',' + name} key={id}>
                        <span className={styles.accountName}>{getAccountIcon(code)} {name} </span>
                        <span className={styles.accountAmount}>
                      账号：
                          <span className={styles.num}>{no}</span>
                        </span>
                      </Radio>)
                  } else {
                    return (
                      <Radio className={styles.accountRadioStyle} value={id + ',' + name} key={id}>
                        <span className={styles.accountName}>{getAccountIcon(code)} {name} </span>
                        <span className={styles.accountAmount}>
                        卡号：
                          <span className={styles.num}>{no}</span>
                        </span>
                      </Radio>)
                  }
                }) :
                <p className={styles.errorAccount}>
                  您还没有对应币种的现实账户，请先初始化！
                </p>
              }

            </RadioGroup>)}
          </div>
        </FormItem>
        <FormItem className={styles.btnPanel}>
          {filterInList.size === 0 ?
            <Button className={styles.okBtn} onClick={this.handleSubmit} disabled>确定</Button> :
            <Button className={styles.okBtn} onClick={this.handleSubmit}>确定</Button>}

          <Button className={styles.cancelBtn} onClick={this.handleCancel}>取消</Button>
        </FormItem>
      </Form>
    )
  },
})

const TransferPane = Form.create()(TransferPaneComponent)

export default FundPoolCard
