import React from 'react'
import styles from './Button.scss'
import { StarIcon } from 'svg'

const StarButton = React.createClass({
  getDefaultProps(){
    return {
      disabled: false,
    }
  },
  onClick(){
    this.props.onClick && this.props.onClick()
  },
  render(){
    const button = this.props.disabled ? (
      <div className={`${styles.operation} ${styles.operationDisabled}`}>
        <div className={styles.name}>已关注</div>
      </div>
    ) : (
      <div className={styles.operation} onClick={this.onClick}>
        <StarIcon className={styles.starIcon}/>
        <div className={styles.name}>关注</div>
      </div>
    )
    return (
      button
    )
  }
})

export default StarButton
