import React, { PropTypes } from 'react'
import styles from './Badge.scss'

export const BadgeComponent = React.createClass({
  propTypes: {
    count: PropTypes.number.isRequired,
    maxCount: PropTypes.number.isRequired,
  },

  getDefaultProps(){
    return {
      count: 19,
      maxCount: 99,
    }
  },

  render(){
    const {
      count,
      maxCount,
    } = this.props

    if (!count) {
      return this.props.children
    }

    return (
      <div className={styles.badgeContainer}>
        {this.props.children}
        <span className={styles.badge}>{count > maxCount ? `${maxCount}+` : count}</span>
      </div>
    )
  }
})
