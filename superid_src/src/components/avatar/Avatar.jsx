import React, { PropTypes } from 'react'
import classNames from 'classnames'
import styles from './Avatar.scss'

const TYPE = {
  shadow: styles.shadowContainer,
  light: styles.ligthContainer,
  none: styles.noneContainer,
}

const Avatar = React.createClass({
  propTypes: {
    type: PropTypes.string,
    src: PropTypes.string.isRequired,
    className: PropTypes.string,
  },
  getDefaultProps() {
    return {
      type: 'shadow',
      className: '',
      src: '',
    }
  },

  render() {
    const {
      className,
      src,
      type,
    } = this.props

    return (
      <div className={classNames(TYPE[type] || TYPE['shadow'], className)}>
        <img src={src}/>
      </div>
    )
  },
})

export default Avatar
