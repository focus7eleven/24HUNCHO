import React from 'react'
import styles from './AddCurrencyModal.scss'
import { Modal, Checkbox } from 'antd'
import { ChinaIcon, USAIcon, JapanIcon, EuroIcon, EnglandIcon, HongkongIcon } from 'svg'
import config from '../../config'
import messageHandler from '../../utils/messageHandler'

const CurrencyMap = {
  'CNY': <ChinaIcon />,
  'USD': <USAIcon/>,
  'EUR': <EuroIcon />,
  'JPY': <JapanIcon />,
  'GBP': <EnglandIcon />,
  'HKD': <HongkongIcon />
}

const AddCurrencyModal = React.createClass({

  getInitialState() {
    return {
      currencyTypes: [],
      addList: [],
    }
  },

  componentDidMount() {
    fetch(config.api.fund.currency_types(), {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        const data = json.data
        this.setState({
          currencyTypes: data
        })
      }
    })
  },

  handleOk() {
    const { affair, poolType } = this.props
    const { addList } = this.state
    fetch(config.api.fund.add_currency(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        currencyTypes: addList,
        poolId: poolType
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        this.setState({ addList: [] })
        this.props.callback(addList)
      }
    })
  },

  handleCancel() {
    this.setState({ addList: [] })
    this.props.callback([])
  },

  handleOnchange(code, e) {
    const { addList } = this.state
    let tmp = []
    if (e.target.checked){
      addList.map((v) => {
        tmp.push(v)
      })
      tmp.push(code)
    }
    else {
      addList.map((v) => {
        if (v != code){
          tmp.push(v)
        }
      })
    }
    this.setState({ addList: tmp })
  },

  render() {
    const { currentCurrency } = this.props
    const { currencyTypes } = this.state
    return (<Modal visible onOk={this.handleOk} onCancel={this.handleCancel} maskClosable={false} wrapClassName={styles.addCurrencyModal} title="添加新币种">
      <div className={styles.content}>
        {currencyTypes.map((v, k) => {
          if (currentCurrency.indexOf(v.code) < 0){
            return <Checkbox key={k} onChange={this.handleOnchange.bind(null, v.code)}>{CurrencyMap[v.code]}{v.code + v.name}</Checkbox>
          }
          else {
            return <Checkbox checked key={k} disabled>{CurrencyMap[v.code]}{v.code + v.name}</Checkbox>
          }
        })}
      </div>

    </Modal>)
  }
})

export default AddCurrencyModal
