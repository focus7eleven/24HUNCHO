import React from 'react'
import styles from './RoleItem.scss'

class RoleItem extends React.Component {

  render() {
    const { role } = this.props;
    return (
      <div className={styles.roleItem} style={this.props.style}>
        {
          role.get('avatar') ?
            <img src={role.get('avatar')} alt="用户头像" />
            :
            <span className={styles.defaultAvatar} />
        }
        <span className={styles.text}>{role.get('title') && role.get('title')+'-'}{role.get('realName')}</span>
      </div>
    )
  }
}

RoleItem.defaultProps = {
  style: {},
  role: {},
}

export default RoleItem
