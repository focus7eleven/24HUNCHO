import React from 'react'
import { List } from 'immutable'
import styles from './ListWrapper.scss'
import MaterialRow from './MaterialRow'
import MoneyRow from './MoneyRow'

const LIST_TYPE = {
  MONEY: 0, //发送资金审批列表
  MATERIAL: 1, //发送物资审批列表
}

class ListWrapper extends React.Component {

  static TYPE = {
    FUND: 0,
    MATERIAL: 1,
  }

  static defaultProps = {
    type: ListWrapper.TYPE.MATERIAL,
    list: List(),
  }

  render(){
    const { type, list } = this.props
    let valueComponent = null
    valueComponent = type === LIST_TYPE.MATERIAL ?
      list.map((v, k) => {
        return <MaterialRow key={k} name={v.name} amount={v.amount} price={v.price} image={v.image} currency={v.currency}/>
      })
      :
      list.map((v, k) => {
        return <MoneyRow key={k} fundInfo={v}/>
      })
    return (
      <div className={styles.listWrapper}>
        {valueComponent}
      </div>
    )
  }

}

export default ListWrapper
