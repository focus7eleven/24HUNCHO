import React from 'react'
import styles from './MaterialRow.scss'

const CURRENCY_TYPE = [
  { name: 'CNY', icon: '¥' },
  { name: 'USD', icon: '$' },
  { name: 'JPY', icon: '￥' },
  { name: 'EUR', icon: '€' },
  { name: 'GBP', icon: '£' },
]

const MaterialRow = React.createClass({
  getDefaultProps(){
    return {
      name: '',
      image: '',
      price: 0,
      amount: 0,
      currency: '',
    }
  },
  getCurrencyIcon(type){
    const currency = CURRENCY_TYPE.find((v) => {
      return v.name == type
    })
    if (currency) {
      return currency.icon
    } else {
      return null
    }

  },
  render(){
    const { name, image, price, amount, currency } = this.props
    return (
      <div className={styles.row}>
        <div className={styles.left}>
          <div className={styles.image}>
            <img src={image} alt="物资图片"/>
          </div>
          <div className={styles.name}>
            {name}
          </div>
          <div className={styles.amount}>
            ×{amount}
          </div>
        </div>
        <div className={styles.right}>
          {this.getCurrencyIcon(currency)}{price}
        </div>
      </div>
    )
  }
})

export default MaterialRow
