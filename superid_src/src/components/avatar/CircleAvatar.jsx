import React, { PropTypes } from 'react'
import styles from './CircleAvatar.scss'

const CircleAvatar = React.createClass({
  propTypes: {
    src: PropTypes.string,
    radius: PropTypes.number.isRequired,
  },

  render() {
    const {
      src,
      radius,
    } = this.props

    return (
      <div className={styles.container} style={{ width: radius, height: radius }}>
        {this.props.src ? <img src={src} /> : null}
      </div>
    )
  }
})

export default CircleAvatar
