import React from 'react'
import { fromJS, List } from 'immutable'
import { Tooltip, Form, Input, Select, Button, Card, Popconfirm } from 'antd'
import { DeleteIcon, CashIcon, GongShangIcon, JiaoTongIcon, NongYeIcon, AliPayIcon, WechatIcon } from '../../public/svg'
import styles from './FundRecordCard.scss'

const FormItem = Form.Item
const SelectOpt = Select.Option
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

const getAccountIcon = function (code) {
  switch (code) {
    case ACCOUNTTYPE.CASH:
      return <CashIcon style={{ width: 16, height: 16, fill: '#ffa64d', verticalAlign: 'middle' }}/>
    case ACCOUNTTYPE.ICBC:
      return <GongShangIcon style={{ width: 16, height: 16, verticalAlign: 'middle' }}/>
    case ACCOUNTTYPE.BOCOM:
      return <JiaoTongIcon style={{ width: 16, height: 16, verticalAlign: 'middle' }}/>
    case ACCOUNTTYPE.ABC:
      return <NongYeIcon style={{ width: 16, height: 16, verticalAlign: 'middle' }}/>
    case ACCOUNTTYPE.ALIPAY:
      return <AliPayIcon style={{ width: 16, height: 16, verticalAlign: 'middle' }}/>
    case ACCOUNTTYPE.WECHAT:
      return <WechatIcon style={{ width: 16, height: 16, verticalAlign: 'middle' }}/>
  }
}




const FundRecordCard = Form.create()(React.createClass({

  getInitialState() {
    return {
      showMore: false,
      askToDeleteList: List(), // 跟outList的account对应
    }
  },

  PropTypes: {
    amount: React.PropTypes.number.isRequired,
    outLibName: React.PropTypes.string.isRequired,
    inLibName: React.PropTypes.string.isRequired,
    fundId: React.PropTypes.string.isRequired,
    cardType: React.PropTypes.number.isRequired,
    inAccount: React.PropTypes.any.isRequired,
    submitCallback: React.PropTypes.func.isRequired,
    deleteCallback: React.PropTypes.func.isRequired,
    onChangeCallback: React.PropTypes.func.isRequired,
  },

  getDefaultProps() {
    return {
      outList: List(),
      inList: List(),
    }
  },

  componentWillMount() {
    let askToDeleteList = this.state.askToDeleteList
    if (this.props.cardType == 0) {
      this.props.outList.forEach(() => {
        askToDeleteList = askToDeleteList.push(false)
      })
    } else {
      askToDeleteList = askToDeleteList.push(false)
    }

    this.setState({
      askToDeleteList,
    })
  },

  handleDelete() {
    const { deleteCallback, currencyType, fundId, affairId } = this.props
    deleteCallback(currencyType, affairId, fundId)
  },

  handleCancel() {
    this.setState({
      showMore: false,
    })

    this.props.form.resetFields()
    // this.accountForm.style.maxHeight = 1000
  },

  handleSubmit() {
    const { affairId, fundId, submitCallback, currencyType } = this.props


    this.props.form.validateFieldsAndScroll((err, values) => {
      if (err) {
        return
      } else {

        values = fromJS(values)
        //
        let addAmount = 0
        values.map((ele, key) => {
          if (key != 'inAccount' && key != 'amount') {
            if (ele) {
              addAmount += ele * 1
            } else {
              values = values.set(key, 0)
            }
          }
        })
        values = values.set('amount', addAmount)

        submitCallback(affairId, currencyType, fundId, true, values)//cardType, fundId, isUpdate, result(amount,inAccount,{out:xxx...})

        this.setState({
          showMore: false,
        })
        // this.accountForm.style.maxHeight = 1000
      }
    })
  },

  handleShowMore() {

    this.setState({
      showMore: !this.state.showMore,
    })

    // this.accountForm.style.maxHeight = this.state.showMore ? 2000 : 1000
  },
  // 确认删除转出金额为0的转出账户
  handleConfirmDelete(id, idx, isDelete) {
    const {
      affairId,
      currencyType,
      fundId,
      onChangeCallback,
      deleteCallback,
      cardType,
    } = this.props
    const { askToDeleteList } = this.state
    if (cardType == 0) {
      // 可调用card，修改转出账户的余额即可
      onChangeCallback(affairId, currencyType, fundId, null, id, 0, isDelete)
      if (isDelete) {
        this.setState({
          askToDeleteList: askToDeleteList.delete(idx)
        })
      } else {
        this.setState({
          askToDeleteList: this.state.askToDeleteList.set(idx, false)
        })
      }

    } else {
      // 可申请card，确认删除直接删除整条记录
      if (isDelete) {
        deleteCallback(currencyType, affairId, fundId)
      }
    }

  },

  renderOutAccount(list, type) {
    const { getFieldDecorator, validateFields } = this.props.form
    const { fundId, onChangeCallback, affairId, currencyType } = this.props
    const { askToDeleteList } = this.state

    return list.map((ele, idx) => {
      const name = ele.get('subTypeName')
      const id = ele.get('id')
      const code = ele.get('subType')
      let num = showAccountNum(ele.get('subType'), ele.get('accountNumber'))
      const askToDelete = askToDeleteList.get(idx)
      const accountRules = getFieldDecorator(`out:${id},${name}`, {
        initialValue: ele.get('isRecord') ? ele.get('transferAmount') : null,
        onChange: (e) => {
          if (!this.state.showMore) {
            const outId = id
            const value = e.target.value

            validateFields([`out:${id},${name}`], (err) => {
              if (err) {
                return
              } else {
                if (type == 0 && value == '') {
                  if (!askToDelete) {
                    onChangeCallback(affairId, currencyType, fundId, null, outId, value, false)
                    // 当前state为未询问，设置并询问
                    this.setState({
                      askToDeleteList: askToDeleteList.set(idx, true)
                    })
                  }
                } else {
                  this.setState({
                    askToDeleteList: askToDeleteList.set(idx, false)
                  })
                  if (!numPatterns.test(value) || value > ele.get('amount')) {
                    return
                  } else {
                    onChangeCallback(affairId, currencyType, fundId, null, outId, value, false) //affair,fundid, inid, outid, value 表示只更新该转出账户，转入账户未更新
                  }
                }
              }
            })

          }
        },
        rules: [
          { pattern: numPatterns, message: '请输入正确有效的数字' },
          {
            validator: (rules, value, callback) => {
              if (value && value > ele.get('amount')) {
                callback('输入金额不能超过' + ele.get('amount') + '!')
              } else {
                callback()
              }
            }
          }
        ]
      })


      return (
        <FormItem key={id}>
          <div className={styles.accountInfo}>{name}
            {code == ACCOUNTTYPE.CASH ? null : '（' + num + '）'}
          </div>
          {
            <Popconfirm
              title="现金额数值为零，是否删除该转出账户记录"
              placement="bottomRight"
              visible={askToDelete}
              okText="是"
              cancelText="否"
              onConfirm={this.handleConfirmDelete.bind(null, id, idx, true)}
              onCancel={this.handleConfirmDelete.bind(null, id, idx, false)}
            >
              {accountRules(<Input addonBefore={currencyType} />)}
            </Popconfirm>
          }

        </FormItem>
      )
    })

  },

  renderOutAccountList() {
    const { outList } = this.props

    let actOutList = List() //存放有实际转出金额的账户
    let noOutList = List() //存放转出金额为0的账户

    outList.map((ele) => {
      if (ele.get('isRecord')) {
        actOutList = actOutList.push(ele)
      } else {
        noOutList = noOutList.push(ele)
      }
    })

    return (
      <div className={styles.outAccountList}>
        {this.renderOutAccount(actOutList, 0)}
        {this.state.showMore ?
          this.renderOutAccount(noOutList, 1) : null}
      </div>)
  },


  render() {
    const {
      affairId,
      fundId,
      amount,
      originAmount,
      outLibName,
      inLibName,
      inList,
      inAccount,
      onChangeCallback,
      cardType,
      currencyType,
    } = this.props
    const { getFieldDecorator, validateFields } = this.props.form
    const { askToDeleteList } = this.state

    const inAccountRules = getFieldDecorator('inAccount', {
      initialValue: inAccount.get('id') + ',' + inAccount.get('subTypeName'),
      onChange: (value) => {
        if (!this.state.showMore) {
          onChangeCallback(affairId, currencyType, fundId, value.split(',')[0], null, null, false)//表示只更新转入账户，转出不更新
        }
      }
    })
    const amountRules = getFieldDecorator('amount', {
      initialValue: amount,
      onChange: (e) => {
        validateFields(['amount'], (err) => {
          if (err) {
            return
          } else {
            if (e.target.value == '') {
              this.setState({
                askToDeleteList: askToDeleteList.set(0, true)
              })
              onChangeCallback(affairId, currencyType, fundId, null, null, e.target.value, false) // 表示只更新申请类型的amount，不更新转入账户

              return
            } else {
              if (!numPatterns.test(e.target.value) || e.target.value > originAmount) {
                return
              }
              this.setState({
                askToDeleteList: askToDeleteList.set(0, false)
              })
              onChangeCallback(affairId, currencyType, fundId, null, null, e.target.value, false) // 表示只更新申请类型的amount，不更新转入账户
            }

          }
        })

      },
      rules: [
        {
          pattern: numPatterns,
          trigger: ['onInput', 'onFocus'],
          validateTrigger: ['onInput', 'onFocus'],
          message: '请输入正确有效的数字'
        },
        {
          validator: (rule, value, callback) => {
            if (value && value > originAmount) {
              callback('超出最大金额！')
            } else {
              callback()
            }
          }
        }
      ]
    })

    const filterInList = inList.filter((ele) => {
      return ele.get('currency') == currencyType
    })
    // console.log('filterInList is '+filterInList);
    const inLib = inLibName + '的资金库'
    const outLib = outLibName + '的资金库'

    return (
      <Card className={styles.cardContainer} ref={(el) => {
        this.accountForm = el
      }}
      >
        <Form className={styles.outAccountsForm}>
          <div className={styles.accountContainer}>
            <FormItem>
              <div className={styles.nameContainer}>
                转入：
                <Tooltip title={inLib}>
                  <span className={styles.name}> {inLib} </span>
                </Tooltip>
              </div>
              {inAccountRules(<Select>
                {filterInList.map((ele, idx) => {
                  const id = ele.get('id')
                  const name = ele.get('subTypeName')
                  const code = ele.get('subType')
                  const num = showAccountNum(code, ele.get('accountNumber'))
                  if (code == ACCOUNTTYPE.CASH){
                    return (
                      <SelectOpt className={styles.selectItem} value={id + ',' + name} key={idx}>
                        {getAccountIcon(code)} {name}
                      </SelectOpt>
                    )
                  } else {
                    return (
                      <SelectOpt className={styles.selectItem} value={id + ',' + name} key={idx}>
                        {getAccountIcon(code)} {name}（{num}）
                      </SelectOpt>
                    )
                  }

                })
                }
              </Select>)}
            </FormItem>
          </div>
          <div className={styles.accountContainer}>
            <div className={styles.nameContainer}>
              来自：<Tooltip title={outLib}>
                <span className={styles.name}> {outLib} </span>
              </Tooltip>
            </div>
            {cardType == 0 ?
              <div className={styles.listContainer}>
                {this.props.outList.some((v) => {return !v.get('isRecord')}) ? this.state.showMore ?
                  null :
                  <a className={styles.showMore} onClick={this.handleShowMore}>
                    更多账户
                  </a>
                  : null
                }
                {this.renderOutAccountList()}
              </div> :
              <div className={styles.listContainer}>
                <FormItem>
                  {
                    <Popconfirm
                      title="现金额数值为零，是否删除该转出账户记录"
                      placement="bottomRight"
                      visible={askToDeleteList.get(0)}
                      okText="是"
                      cancelText="否"
                      onConfirm={this.handleConfirmDelete.bind(null, null, 0, true)}
                      onCancel={this.handleConfirmDelete.bind(null, null, 0, false)}
                    >
                      {amountRules(<Input addonBefore={currencyType} />)}
                    </Popconfirm>

                  }
                </FormItem>
              </div>

            }


          </div>


          <div className={styles.totalAmount}>
            <span className={styles.amountNum}>{getCurrencySymbol(currencyType)}
              <span style={{ fontSize: 16, color: '#30304d' }}> {formatValue(amount)}</span></span>
            {this.state.showMore ?
              (<FormItem className={styles.btnPanel}>
                <Button className={styles.okBtn} onClick={this.handleSubmit}>确定</Button>
                <Button className={styles.cancelBtn} onClick={this.handleCancel}>取消</Button>
              </FormItem>) :
              (<span className={styles.delete}>
                <DeleteIcon onClick={this.handleDelete}/>
              </span>)
            }

          </div>
        </Form>


      </Card>
    )
  }
}))

export default FundRecordCard
