import React, { PropTypes } from 'react'
import styles from './RoleItem.scss'

const RoleItem = React.createClass({
  propTypes: {
    role: PropTypes.shape({
      roleTitle: PropTypes.string.isRequired,
      roleName: PropTypes.string.isRequired,
      avatar: PropTypes.string,
    }).isRequired,
    onClick: PropTypes.func,
  },
  defaultProps: {
    onClick: () => {},
  },
  render() {
    return (
      <div className={styles.container} onClick={this.props.onClick}>
        <div className={styles.avatar}>
          {this.props.role.avatar ? <img src={this.props.role.avatar} /> : null}
        </div>
        <p>{`${this.props.role.roleTitle || this.props.role.title} ${this.props.role.roleName}`}</p>
      </div>
    )
  }
})

export default RoleItem
