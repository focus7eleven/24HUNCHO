import React from 'react'
import styles from './GetMoneyModal.scss'
import {
  ChinaCircleIcon,
  USACircleIcon,
  EuroCircleIcon,
  JapanCircleIcon,
  EnglandCircleIcon,
  HongkongIcon,
} from '../../public/svg'
import {
  Modal,
  Button,
  Tabs,
  Input,
  Form,
  message,
} from 'antd'
import { fromJS, List } from 'immutable'
import config from '../../config'
import messageHandler from '../../utils/messageHandler'
import AffairTreeSelect from '../../components/select/AffairTreeSelect'
import FundPoolCard from './FundPoolCard'
import FundRecordCard from './FundRecordCard'

const TabPane = Tabs.TabPane
const FormItem = Form.Item
const numPatterns = /^[0-9]*\.?[0-9]+$/

const CurrencyList = [
  { name: 'CNY人民币', code: 'CNY', icon: <ChinaCircleIcon/> },
  { name: 'USD美元', code: 'USD', icon: <USACircleIcon/> },
  { name: 'EUR欧元', code: 'EUR', icon: <EuroCircleIcon/> },
  { name: 'JPY日元', code: 'JPY', icon: <JapanCircleIcon/> },
  { name: 'GBP英镑', code: 'GBP', icon: <EnglandCircleIcon/> },
  { name: 'HKD港币', code: 'HKD', icon: <HongkongIcon/> }]
const AFFAIR_TYPE = {
  REACHABLE: 0,
  APPLIABLE: 1,
}
const ACCOUNT_STATE = {
  NORMAL: 0,
  NOT_INIT: 2,
}

const GetMoneyModal = Form.create()(React.createClass({
  getInitialState() {
    return {
      visible: true,
      minAmount: null,
      maxAmount: null,
      currencyType: this.props.currencyType,
      selectedAffairList: [],
			// currentTab: 0, // 0代表可调用tab页，1代表可申请tab页

      searchAffairList: List(),
      affairList: List(),
      callList: List(),
      applyList: List(),
      inList: fromJS(this.props.accountList.filter((v) => {
        return v.state != ACCOUNT_STATE.NOT_INIT
      })),
    }
  },
  //获取inList以及当前可调用和可申请的列表（不获取每个资金库的outAccountList）
  fetchFundList() {
    const { affair, poolId } = this.props
    const { selectedAffairList, currencyType, inList, minAmount, maxAmount } = this.state

    //获取可申请列表
    const fetchApplyList = fetch(config.api.fund.usable_funds(poolId), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify({
        affairIds: selectedAffairList,
        currency: currencyType, //货币类型
        usable: false, // false代表查询可申请列表
        minimum: minAmount,
        maximum: maxAmount
      })
    }).then((res) => res.json()).then(messageHandler)

		//获取可调用列表
    const fetchReachableList = fetch(config.api.fund.usable_funds(poolId), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        affairIds: selectedAffairList,
        currency: currencyType, //货币类型
        usable: true, // true代表查询可调用列表
        minimum: minAmount,
        maximum: maxAmount
      })
    }).then((res) => res.json()).then(messageHandler)

    Promise.all([fetchReachableList, fetchApplyList]).then((res) => {
      if (res.every((json) => json.code == 0)) {

          //过滤可申请列表
        const appliableList = res[1].data.map((ele) => {
          ele.type = AFFAIR_TYPE.APPLIABLE

          const fundPools = ele.fundPools.map((pool) => {
            pool.createTime = 0
            pool.inAccount = inList && inList.size > 0 ? inList.get(0) : null
            pool.transferAmount = 0
            pool.cardType = AFFAIR_TYPE.APPLIABLE
            pool.currency = currencyType
            pool.showTransferPane = false
            pool.isRecord = false
            return pool
          })
          ele.fundPools = fundPools
          return ele
        })


        let reachableList = []
        if (res[0].data.length !== 0) {
            //过滤可调用列表并获取个fundpolls的outList

          reachableList = res[0].data
          reachableList.forEach((ele) => {
            ele.type = AFFAIR_TYPE.REACHABLE
            ele.fundPools.forEach((pool) => {
              pool.createTime = 0
              pool.transferAmount = 0
              pool.inAccount = inList && inList.size > 0 ? inList.get(0) : null
              pool.cardType = AFFAIR_TYPE.REACHABLE
              pool.outList = null
              pool.showTransferPane = false
              pool.currency = currencyType
              pool.isRecord = false
            })


          })
        }

        let newAffairList = fromJS(reachableList).concat(fromJS(appliableList))
        let affairList = this.state.affairList
          //newAffairList为本次搜索结果，对本次搜索结果中的每个元素进行遍历，查看之前是否查询过这个元素
        newAffairList.forEach((searchAffair, searchAffairIndex) => {
          const index = affairList.findIndex((affair) => {
            return affair.get('affairId') == searchAffair.get('affairId')
          })

          if (index >= 0) {

            const curAffair = affairList.get(index)
            let fundPools = curAffair.get('fundPools')
            let searchPoolList = searchAffair.get('fundPools')
            searchPoolList.forEach((searchPool, idx) => {
                //如果affairList中包含当前搜索结果 资金库,不需要更新总的affairList，但是要对本次搜索结果中的该资金库进行同步
              const fundIdx = fundPools.findIndex((ele) => {
                return ele.get('poolId') == searchPool.get('poolId') && ele.get('currency') == searchPool.get('currency')
              })
              if (fundIdx >= 0) {
								//找到了当前资金库，且两个币种相同
								// 资金库区别： id+currency
                newAffairList = newAffairList.setIn([searchAffairIndex, 'fundPools', idx, 'transferAmount'], fundPools.getIn([fundIdx, 'transferAmount']))
                newAffairList = newAffairList.setIn([searchAffairIndex, 'fundPools', idx, 'inAccount'], fundPools.getIn([fundIdx, 'inAccount']))

                const outList = fundPools.getIn([fundIdx, 'outList'])
                let newOutList = outList
                let isChanged = false
                if (outList != null) {
                  fetch(config.api.fund.list(currencyType, searchPool.get('poolId'), true), {
                    method: 'GET',
                    credentials: 'include',
                    affairId: affair.get('id'),
                    roleId: affair.get('roleId'),
                  }).then((res) => res.json()).then(messageHandler).then((res) => {

                    if (res.code == 0) {
                      const list = fromJS(res.data)
                      list.forEach((ele) => {
                        const oldOutIdx = outList.findIndex((account) => {
                          return account.get('id') == ele.get('id')
                        })
                        if (oldOutIdx >= 0) {
													//当前资金库的转出资金库中包含转出列表中的账户
                          isChanged = true
                          const outAccount = outList.get(oldOutIdx).set('amount', ele.get('amount')).set('locked', ele.get('locked'))
                          newOutList = newOutList.set(oldOutIdx, outAccount)
                        }
                      })
                    }
                  })
                }

                newAffairList = newAffairList.setIn([searchAffairIndex, 'fundPools', idx, 'outList'], newOutList)
                if (isChanged)
                  affairList = affairList.setIn([index, 'fundPools', outList], newOutList)
              } else {
                  //如果fundPools中不包含当前资金库，则直接将该资金库放到affairList中
                fundPools = fundPools.push(searchPool)
                affairList = affairList.setIn([index, 'fundPools'], fundPools)
              }
            })

          } else {
              //不包含本事务，将事务直接set加进去
            affairList = affairList.push(searchAffair)
          }
        })

        this.setState({
          searchAffairList: newAffairList,
          affairList: affairList,
        })

      }
    })


  },

  //点击modal的取消按钮
  handleCancel() {
    this.props.callback()
  },

  //点击modal的提交按钮，提交操作结果
  handleSubmit() {
    const { affair, callback } = this.props
    const { affairList } = this.state

    let usableList = []
    let appliableList = []
    affairList.forEach((affair) => {
      const fundPools = affair.get('fundPools')
      fundPools.forEach((pool) => {
        if (pool.get('transferAmount') != 0) {
          const cardType = pool.get('cardType')
          if (cardType === AFFAIR_TYPE.REACHABLE) {
            //可调用
            const toAccountId = pool.getIn(['inAccount', 'id']) * 1
            pool.get('outList').forEach((account) => {
              if (account.get('transferAmount') != 0) {
                const fromAccountId = account.get('id') * 1
                const amount = account.get('transferAmount') + ''
                usableList.push({
                  amount: amount + '',
                  fromAccountId: fromAccountId,
                  toAccountId: toAccountId,
                })
              }
            })
          } else {
            const poolId = pool.get('poolId') * 1
            const currency = pool.get('currency')
            const amount = pool.get('transferAmount') + ''
            const toAccountId = pool.getIn(['inAccount', 'id']) * 1
            appliableList.push({
              amount: amount,
              currency: currency,
              poolId: poolId,
              toAccountId: toAccountId,
            })
          }
        }
      })
    })
    if (usableList.length === 0 && appliableList.length === 0) {
      message.error('请添加资金项后再提交！', 0.5)
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
        usableFunds: usableList,
        applicableFunds: appliableList,
      })
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code == 0) {
        callback()
        message.success('提交成功！')
      } else if (res.code == -1) {
        this.fetchFundList()
      }

    })

  },

  //货币类型改变响应
  handleMoneyTypeChange(value) {
    this.setState({
      currencyType: value,
    }, this.fetchFundList)
  },

  //事务筛选变化
  handleAffairSelectorChange(value) {
    this.setState({
      selectedAffairList: value,
    }, this.fetchFundList)
  },

  handleChangePane() {
    let value = this.state.currentTab == 0 ? 1 : 0
    this.setState({
      currentTab: value,
    })
  },

  //添加资金转出，将操作结果添加到右侧 已添加资金中，或已添加资金中的卡片 点击更多账户进行修改后的结果回调
  handleListUpdate(list, moneyType, affairId, fundId, isUpdate, result) {

    const { inList } = this.state
    let inAccount = result.get('inAccount').split(',')
    //更新list
    let newFundList = null //如果当前的list中没有找到对应affairId和fundId的资金库，那么直接返回null
    // let outAmount = 0

    for (let i = 0; i < list.size; i++) {
      //获取事务id
      const ele = list.get(i)
      if (ele.get('affairId') == affairId) {
        //找到对应事务
        const fundPools = ele.get('fundPools')
        //获取对应资金库列表
        const fundIdx = fundPools.findIndex((fund) => {
          return fund.get('poolId') == fundId && fund.get('currency') == moneyType
        })
        if (fundIdx == -1) {
          continue
        }

        newFundList = list
        let newFundPools = fundPools
        let newEle = ele

        //找到对应资金库
        const fund = fundPools.get(fundIdx)
        const cardType = fund.get('cardType')
        //获取旧的转入账户id与旧的转入金额

        //更新transferamount数值
        let newFund = fund.set('transferAmount', result.get('amount') * 1)

        //当前为调用类型的card
        if (cardType == AFFAIR_TYPE.REACHABLE) {
          //更新转出账户的列表
          const outList = fund.get('outList')
          let newOutList = outList

          //从result中获取有输入值的input，放到res中，再进行下面的处理
          const res = result.filter((ele, key) => {
            return key.indexOf('out') >= 0
          })

          const it = res.entries()
          let entry
          //对res中的值进行处理，对应到每个outAccount中，并更新总金额
          while (typeof((entry = it.next())['value']) != 'undefined') {

            entry = entry['value']
            // if (typeof(entry) == 'undefined') {
            //   break
            // }
            const idx = outList.findIndex((ele) => {
              return entry[0].indexOf(ele.get('id')) >= 0
            })

            let account
            if (entry[1]) {
              // outAmount += entry[1] * 1
              account = outList.get(idx).set('transferAmount', entry[1]).set('isChosen', true).set('isRecord', true)
            } else {
              account = outList.get(idx).set('transferAmount', 0).set('isChosen', false).set('isRecord', false)
            }

            newOutList = newOutList.set(idx, account)
          }
          newFund = newFund.set('outList', newOutList)

        }
        //更新转入的账户信息
        const newInAccount = inList.find((ele) => {
          return ele.get('id') == inAccount[0]
        })
        newFund = newFund.set('inAccount', newInAccount)

        if (!isUpdate) {
          //如果为第一次修改，要设置时间戳，用于在右边的记录中进行排序
          newFund = newFund.set('createTime', new Date().getTime())
        }

        newFund = newFund.set('showTransferPane', false).set('isRecord', true)

        newFundPools = newFundPools.set(fundIdx, newFund)
        newEle = newEle.set('fundPools', newFundPools)

        newFundList = newFundList.set(i, newEle)
        break
      }

    }
    return fromJS({
      fundList: newFundList,
    })

  },

  handleCardSubmit(affairId, moneyType, fundId, isUpdate, result) {

    const { searchAffairList, affairList } = this.state

    const res = this.handleListUpdate(searchAffairList, moneyType, affairId, fundId, isUpdate, result)
    if (res.get('fundList') != null) {
      this.setState({
        searchAffairList: res.get('fundList'),
        // inList: newInList,
      })
    }
    //如果没有searchAffairList中没有找到对应的资金库，说明当前卡片提交时左侧面板中没有当前资金库，不更新左侧面板
    const res1 = this.handleListUpdate(affairList, moneyType, affairId, fundId, isUpdate, result)
    this.setState({
      affairList: res1.get('fundList'),
    })


  },

  onMoneyChangeList(searchAffairList, affairId, moneyType, poolId, inId, outId, value, isDelete) {
    const { inList } = this.state
    let pool, poolIdx, affairIdx, cAffair, fundPoolList
    searchAffairList.forEach((affair, idx) => {

      if (affair.get('affairId') == affairId) {
        poolIdx = affair.get('fundPools').findIndex((ele) => {
          const a = (ele.get('poolId') == poolId)
          const b = (ele.get('currency') == moneyType)

          return (a && b)
        })
        if (poolIdx >= 0) {
          affairIdx = idx
          cAffair = affair
          return false
        }

      }
    })


    if (poolIdx < 0 || typeof(poolIdx) == 'undefined') { //没有找到对应的资金库或没有找到对应事物，返回null
      return null
    }

    fundPoolList = cAffair.get('fundPools')
    pool = fundPoolList.get(poolIdx)
    const cardType = pool.get('cardType')

    let newsearchAffairList
    if (!inId) {
      //响应修改转出账户金额变动的事件

      if (cardType == AFFAIR_TYPE.REACHABLE) {
        //在可调用的card中直接修改某个转出账户的资金
        const outList = pool.get('outList')
        //找到outAccount
        const outIdx = outList.findIndex((ele) => {
          return ele.get('id') == outId
        })
        const out = outList.get(outIdx)
        let newOutList = outList
        if (value == '' && isDelete) {
          newOutList = outList.set(outIdx, out.set('transferAmount', value * 1).set('isRecord', false))
        } else if (value == '' && !isDelete){
          newOutList = outList.set(outIdx, out.set('transferAmount', value * 1).set('isRecord', true))
        } else {
          newOutList = outList.set(outIdx, out.set('transferAmount', value * 1).set('isRecord', true))
        }

        let addAmount = 0
        newOutList.forEach((ele) => {
          addAmount = addAmount * 1 + ele.get('transferAmount') * 1
        })

        newsearchAffairList = searchAffairList.setIn([affairIdx, 'fundPools', poolIdx, 'outList'], newOutList).setIn([affairIdx, 'fundPools', poolIdx, 'transferAmount'], addAmount)

      } else {
        //申请使用的时候修改amount
        newsearchAffairList = searchAffairList.set(affairIdx, cAffair
          .set('fundPools', fundPoolList
            .set(poolIdx, pool
              .set('transferAmount', value * 1))))
      }
    } else {
      const newInId = inList.findIndex((ele) => {
        return ele.get('id') == inId
      })
      const newInAccount = inList.get(newInId)
      newsearchAffairList = searchAffairList.set(affairIdx, cAffair
        .set('fundPools', fundPoolList
          .set(poolIdx, pool
            .set('inAccount', newInAccount))))

    }

    return newsearchAffairList
  },

  //资金库id，转入账户id，outAccount ID以及修改后的转出金额，是否删除该转出项
  onMoneyChange(affairId, moneyType, poolId, inId, outId, value, ifDelete) {
    const { searchAffairList, affairList } = this.state
    //处理 recordPanel 中各账户输入转账金额时的onchange相应事件

    const newSearchList = this.onMoneyChangeList(searchAffairList, affairId, moneyType, poolId, inId, outId, value, ifDelete)
    if (newSearchList != null) {
      this.setState({
        searchAffairList: newSearchList,
        affairList: this.onMoneyChangeList(affairList, affairId, moneyType, poolId, inId, outId, value, ifDelete)
      })
    } else {
      //如果searchList操作结果为null，说明当前左侧面板中不包含该资金库，不更新search列表
      this.setState({
        affairList: this.onMoneyChangeList(affairList, affairId, moneyType, poolId, inId, outId, value, ifDelete)
      })
    }

  },

  handleRecordDeleteList(searchAffairList, moneyType, affairId, fundId) {
    const { inList } = this.state

    let newFundList = null  //如果没有在列表中找到对应资金库，则返回null
    for (let i = 0; i < searchAffairList.size; i++) {
      const ele = searchAffairList.get(i)
      let newEle = ele
      //searchAffairList
      if (ele.get('affairId') == affairId) {
        //fundPools
        let fundPools = ele.get('fundPools')
        const fundIdx = fundPools.findIndex((fund) => {
          return fund.get('poolId') == fundId && fund.get('currency') == moneyType
        })
        if (fundIdx == -1) {
          continue
        }
        const fund = fundPools.get(fundIdx) //目标fundpool
        const cardType = fund.get('cardType')

        let newFund = fund.set('transferAmount', 0)
          .set('inAccount', inList.get(0))
          .set('createTime', 0)
        if (cardType === AFFAIR_TYPE.REACHABLE) {
          let outList = fund.get('outList')
          for (let j = 0; j < outList.size; j++) {
            let account = outList.get(j)
            if (j == 0) {
              account = account.set('isChosen', true)
                .set('transferAmount', 0)
            } else {
              account = account.set('isChosen', false)
                .set('transferAmount', 0)
            }
            outList = outList.set(j, account)
          }
          newFund = newFund.set('outList', outList)
        }
        newFund = newFund.set('isRecord', false)
        fundPools = fundPools.set(fundIdx, newFund)
        newEle = newEle.set('fundPools', fundPools)
        newFundList = searchAffairList.set(i, newEle)
        break
      }
    }

    return newFundList

  },

  handleRecordDelete(moneyType, affairId, fundId) {
    const { searchAffairList, affairList } = this.state
    const newSearchList = this.handleRecordDeleteList(searchAffairList, moneyType, affairId, fundId)
    if (newSearchList != null) {
      this.setState({
        searchAffairList: newSearchList,
        affairList: this.handleRecordDeleteList(affairList, moneyType, affairId, fundId),
      })
    } else {
      //在search列表中没有找到对应资金库，说明左侧面板中没有该资金库，不更新searchList
      this.setState({
        affairList: this.handleRecordDeleteList(affairList, moneyType, affairId, fundId),
      })
    }

  },

  getOutAccounts(affairId, poolId, moneyType) {
    const { affair } = this.props
    const { affairList, searchAffairList } = this.state
    fetch(config.api.fund.list(moneyType, poolId, true), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code == 0) {
        const outList = fromJS(res.data).map((ele) => {
          return ele.set('transferAmount', 0).set('isRecord', false)
        })
        const newAffairList = this.getOutAccountList(affairList, affairId, poolId, moneyType, outList)
        const newSearchAffairList = this.getOutAccountList(searchAffairList, affairId, poolId, moneyType, outList)

        this.setState({
          affairList: newAffairList,
          searchAffairList: newSearchAffairList,
        })
      }
    })
  },

  getOutAccountList(list, affairId, poolId, moneyType, outList) {
    const affairIdx = list.findIndex((affair) => affair.get('affairId') == affairId)
    const affair = list.get(affairIdx)
    const fundPools = affair.get('fundPools')
    const poolIdx = fundPools.findIndex((pool) => pool.get('poolId') == poolId && pool.get('currency') == moneyType)

    let result = list.setIn([affairIdx, 'fundPools', poolIdx, 'outList'], outList)
    result = result.setIn([affairIdx, 'fundPools', poolIdx, 'showTransferPane'], true)
    return result
  },

  //render
  renderContent() {
    return (
      <div className={styles.content}>
        {this.renderRight()}
        {this.renderLeft()}

      </div>
    )
  },

  renderLeft() {
    const { inList, searchAffairList, currencyType } = this.state
    const { poolName } = this.props
    const { getFieldDecorator, getFieldValue } = this.props.form

    //获取类型为可调用的事务[资金库s]列表
    let reachableSize = 0
    const fundReachableList = searchAffairList.filter((ele) => {
      let fundPools = ele.get('fundPools')
      fundPools = fundPools.filter((pool) => {
        return pool.get('cardType') == AFFAIR_TYPE.REACHABLE
      })
      reachableSize += fundPools.size
      return fundPools.size !== 0

    })
    //获取类型为可申请的事务[资金库s]列表
    let appliableSize = 0
    const fundAppliableList = searchAffairList.filter((ele) => {
      let fundPools = ele.get('fundPools')
      fundPools = fundPools.filter((pool) => {
        return pool.get('cardType') == AFFAIR_TYPE.APPLIABLE
      })
      appliableSize += fundPools.size
      return fundPools.size !== 0
    })


    const minAmountRules = getFieldDecorator('minAmount', {
      rules: [{
        pattern: numPatterns,
        message: '请输入有效数字！'
      }],
      onChange: (e) => {
        let value
        if (e.target.value == '') {
          value = null
        } else {
          value = e.target.value * 1
        }
        this.setState({
          minAmount: value
        }, this.fetchFundList)
      },
      validator: function (rules, value, callback) {
        const maxAmount = getFieldValue('maxAmount')
        if (value && value < 0) {
          callback('请输入正数！')
        } else if (value && maxAmount != null && value > maxAmount) {
          callback('最小金额不得超过最大金额')
        } else {
          callback()
        }
      }
    })

    const maxAmountRules = getFieldDecorator('maxAmount', {
      rules: [{
        pattern: numPatterns,
        message: '请输入有效数字！'
      }],
      onChange: (e) => {
        let value
        if (e.target.value == '') {
          value = null
        } else {
          value = e.target.value * 1
        }
        this.setState({
          maxAmount: value
        }, this.fetchFundList)
      },
      validator: function (rules, value, callback) {
        const minAmount = getFieldValue('minAmount')
        if (value && value < 0) {
          callback('请输入正数！')
        } else if (value && minAmount != null && value > minAmount) {
          callback('最大金额不得超过最小金额')
        } else {
          callback()
        }
      }
    })


    return (
      <div className={styles.leftContainer}>
        <Form className={styles.search} inline>
          <FormItem className={styles.moneyType}>
            {CurrencyList.map((ele, index) => {
              if (ele.code === currencyType){
                return (
                  <span className={styles.moneyItem} key={index}>
                    {ele.icon}
                    <span className={styles.moneyName}>{ele.name}</span>
                  </span>
                )
              } else {
                return null
              }
            })}
          </FormItem>
          <AffairTreeSelect affair={this.props.affair} onChange={this.handleAffairSelectorChange}/>
          <span className={styles.moneyRange}>
            <span style={{ marginRight: '5px' }}>金额范围</span>
            <FormItem>
              {minAmountRules(<Input placeholder="输入金额" />)}
            </FormItem>
            <span style={{ marginLeft: '8px', marginRight: '8px' }}>--</span>
            <FormItem>
              {maxAmountRules(<Input placeholder="输入金额" />)}
            </FormItem>
          </span>
        </Form>
        <div className={styles.tabPaneContainer}>
          <Tabs defaultActiveKey="1" onChange={() => this.handleChangePane()} size="small">
            <TabPane className={styles.tabPane} tab={<span>可调用（{reachableSize}）</span>} key="1">
              {fundReachableList.map((ele, index) => {
                const name = ele.get('affairName')
                const fundPools = ele.get('fundPools')

                return (
                  <div className={styles.affair} key={index}>
                    {name}
                    {fundPools.map((fund) => {
                      const fundAvatar = fromJS({
                        avatar: fund.get('logo'),
                        shortName: fund.get('shortName'),
                        level: fund.get('level'),
                      })
                      return (
                        <FundPoolCard
                          key={fund.get('poolId')}
                          affairId={ele.get('affairId')}
                          fundId={fund.get('poolId')}
                          fundName={fund.get('fundPoolName')}
                          isRecord={fund.get('isRecord')}
                          inFundName={poolName}
                          fundAvatar={fundAvatar}
                          fundType={fund.get('type')}
                          amount={fund.get('amount') - fund.get('transferAmount')}
                          transferAmount={fund.get('transferAmount')}
                          moneyType={currencyType}
                          submitCallback={this.handleCardSubmit}
                          onChangeCallback={this.onMoneyChange}
                          getOutCallback={this.getOutAccounts}
                          cardType={0}
                          showTransferPane={fund.get('showTransferPane')}
                          outList={fund.get('outList')}
                          inList={inList}
                          inAccount={fund.get('inAccount')}
                        />
                      )
                    })}
                  </div>
                )

              })}
            </TabPane>
            <TabPane className={styles.tabPane} tab={<span>可申请（{appliableSize}）</span>} key="2">
              {
                fundAppliableList.map((ele, index) => {
                  const name = ele.get('affairName')
                  const fundPools = ele.get('fundPools')


                  return (
                    <div className={styles.affair} key={index}>
                      {name}
                      {fundPools.map((fund) => {
                        const fundAvatar = fromJS({
                          avatar: fund.get('logo'),
                          shortName: fund.get('shortName'),
                          level: fund.get('level'),
                        })

                        return (
                          <FundPoolCard key={fund.get('poolId')} affairId={ele.get('affairId')} inFundName={poolName}
                            fundId={fund.get('poolId')}
                            isRecord={fund.get('isRecord')}
                            fundName={fund.get('fundPoolName')}
                            fundAvatar={fundAvatar} fundType={fund.get('type')}
                            amount={fund.get('amount') - fund.get('transferAmount')}
                            transferAmount={fund.get('transferAmount')}
                            moneyType={currencyType} submitCallback={this.handleCardSubmit}
                            onChangeCallback={this.onMoneyChange} getOutCallback={this.getOutAccounts}
                            cardType={1} showTransferPane={fund.get('showTransferPane')}
                            inList={inList} inAccount={fund.get('inAccount')}
                          />
                        )
                      })}

                    </div>
                  )
                })
              }
            </TabPane>
          </Tabs>
        </div>


      </div>
    )
  },


  renderRight() {
    const { affairList, inList } = this.state
    const { poolName } = this.props

    const fundCallList = affairList.filter((ele) => {
      let fundPools = ele.get('fundPools')
      fundPools = fundPools.filter((pool) => {
        return pool.get('cardType') == AFFAIR_TYPE.REACHABLE
      })
      return fundPools.size !== 0
    })


    const fundApplyList = affairList.filter((ele) => {
      let fundPools = ele.get('fundPools')
      fundPools = fundPools.filter((pool) => {
        return pool.get('cardType') == AFFAIR_TYPE.APPLIABLE
      })
      return fundPools.size !== 0
    })


    //将affair中的资金库拿出来，放到callRecordList中（在右侧列表中只要遍历callRecordList即可）
    let callRecordList = List()
    fundCallList.forEach((ele) => {
      let fundPools = ele.get('fundPools').filter((fund) => {
        return fund.get('isRecord') && fund.get('cardType') == AFFAIR_TYPE.REACHABLE
      }).sort((x, y) => {
        if (x.get('createTime') < y.get('createTime')) {
          return -1
        } else if (x.get('createTime') > y.get('createTime')) {
          return 1
        } else {
          return 0
        }
      })
      fundPools = fundPools.map((pool) => {
        return pool.set('affairId', ele.get('affairId'))
      })
      callRecordList = callRecordList.concat(fundPools)
    })

    let applyRecordList = List()
    fundApplyList.forEach((ele) => {
      let fundPools = ele.get('fundPools').filter((fund) => {
        return fund.get('isRecord') && fund.get('cardType') == AFFAIR_TYPE.APPLIABLE
      }).sort((x, y) => {
        if (x.get('createTime') < y.get('createTime')) {
          return -1
        } else if (x.get('createTime') > y.get('createTime')) {
          return 1
        } else {
          return 0
        }
      })
      fundPools = fundPools.map((pool) => {
        return pool.set('affairId', ele.get('affairId'))
      })
      applyRecordList = applyRecordList.concat(fundPools)
    })


    return (
      <div className={styles.rightContainer}>
        <p>已添加资金</p>
        {callRecordList.size == 0 ?
          null :
          <div className={styles.recordPanel} ref={(el) => this.callPane = el}>

            <p>直接调用（{callRecordList.size}）：</p>
            {callRecordList.map((ele, index) => {
              return (
                <FundRecordCard
                  key={index}
                  affairId={ele.get('affairId')}
                  fundId={ele.get('poolId')}
                  cardType={0}
                  originAmount={ele.get('amount')}
                  amount={ele.get('transferAmount')}
                  outLibName={ele.get('fundPoolName')}
                  inLibName={poolName}
                  outList={ele.get('outList')}
                  inList={inList}
                  currencyType={ele.get('currency')}
                  inAccount={ele.get('inAccount')}
                  submitCallback={this.handleCardSubmit}
                  deleteCallback={this.handleRecordDelete}
                  onChangeCallback={this.onMoneyChange}
                />
              )
            })}

          </div>
        }

        {applyRecordList.size == 0 ?
          null :
          <div className={styles.recordPanel} ref={(el) => this.applyPane = el}>
            <p>申请使用（{applyRecordList.size}）：</p>
            {applyRecordList.map((ele, index) => {
              return (
                <FundRecordCard
                  key={index}
                  affairId={ele.get('affairId')}
                  fundId={ele.get('poolId')}
                  cardType={1}
                  originAmount={ele.get('amount')}
                  amount={ele.get('transferAmount')}
                  outLibName={ele.get('fundPoolName')}
                  inLibName={poolName}
                  inList={inList}
                  currencyType={ele.get('currency')}
                  inAccount={ele.get('inAccount')}
                  submitCallback={this.handleCardSubmit}
                  deleteCallback={this.handleRecordDelete}
                  onChangeCallback={this.onMoneyChange}
                />

              )
            })}

          </div>
        }

      </div>
    )
  },

  render() {
    return (
      <Modal
        title="获取资金"
        onCancel={this.handleCancel}
        okText="提交"
        cancelText="取消"
        wrapClassName={styles.container}
        visible
        footer={[
          // <Button type="ghost" onClick={() => this.handleCancel()} size="large" key="0">取消</Button>,
          <Button type="primary" onClick={() => this.handleSubmit()} size="large" key="1">提交</Button>
        ]}
      >
        {this.renderContent()}
      </Modal>)
  }
}))

export default GetMoneyModal
