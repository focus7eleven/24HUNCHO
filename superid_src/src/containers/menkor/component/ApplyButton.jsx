import React from 'react'
import styles from './Button.scss'
import { AddPersonIcon } from 'svg'

const ApplyButton = React.createClass({
  getDefaultProps(){
    return {
      disabled: false,
      disabledText: '已加入',
    }
  },
  render(){
    const button = this.props.disabled ? (
      <div className={`${styles.operation} ${styles.operationDisabled}`}>
        <div className={styles.name}>{this.props.disabledText}</div>
      </div>
    ) : (
      <div className={styles.operation}>
        <AddPersonIcon className={styles.addPersonIcon}/>
        <div className={styles.name}>加入</div>
      </div>
    )
    return (
      button
    )
  }
})

export default ApplyButton
