import React from 'react'
import styles from './MoneyRow.scss'

const MoneyRow = React.createClass({
  render(){
    const { fundInfo } = this.props
    return (
      <div className={styles.row}>
        <div className={styles.left}>
          <img src={fundInfo.avatar} alt="头像"/>
          <div>
            <div className={styles.title}>
              {fundInfo.text}
            </div>
            <div className={styles.subTitle}>
              备注：{fundInfo.remark || '无'}
            </div>
          </div>
        </div>
        <div className={styles.right}>
          {fundInfo.amount}
        </div>
      </div>
    )
  }
})

export default MoneyRow
