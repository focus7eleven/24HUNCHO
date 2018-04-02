import React from 'react'
import { Popover, Input } from 'antd'
import { fromJS } from 'immutable'
import styles from './SingleRolePopover.scss'

class SingleRolePopover extends React.Component {
  state = {
    searchText: '',
  }

  renderRolePanel = () => {
    const { roleList, onValueChange } = this.props
    const { searchText } = this.state
    return (
      <div className={styles.container}>
        <Input.Search
          size="small"
          placeholder="搜索成员、角色"
          value={searchText}
          onChange={(e) => this.setState({ searchText: e.target.value })}
        />
        <div className={styles.roleList}>
          {fromJS(roleList).filter((role) => `${role.get('roleTitle')}-${role.get('username')}`.includes(searchText))
            .map((role, key) => {
              return (
                <div className={styles.role} onClick={() => onValueChange(role)} key={key}>
                  <div className={styles.avatarWrapper}>
                    <img src={role.get('avatar')} />
                  </div>
                  <div className={styles.name}>{role.get('roleTitle')} {role.get('username')}</div>
                </div>
              )
            })}
        </div>
      </div>
    )
  }

  render() {
    const {
      placement,
      visible,
      onVisibleChange,
      overlayClassName,
      trigger,
    } = this.props
    return (
      <Popover
        content={this.renderRolePanel()}
        placement={placement}
        trigger={trigger}
        visible={visible}
        onVisibleChange={onVisibleChange}
        overlayClassName={overlayClassName}
      >
        {this.props.children}
      </Popover>
    )
  }
}

SingleRolePopover.defaultProps = {
  placement: 'bottom',
  overlayClassName: 'rolePop',
  visible: true,
  onVisibleChange: () => {},
  trigger: 'click',
  onValueChange: () => {},
  roleList: fromJS([
    {
      roleTitle: 'bababab',
      roleId: 1139414,
      username: 'zhangrui',
      userId: 160004,
      gender: 0,
      mold: 0,
      allianceId: 13704,
      allocateRoleId: 0,
      avatar: 'https://mkpub.oss-cn-hangzhou.aliyuncs.com/user/160004/small_ikQvkjh.png',
      belongAffairId: 115504,
      state: 0,
      type: 2,

    },
    {
      roleTitle: 'bababab',
      roleId: 1139414,
      username: 'zhangrui',
      userId: 160004,
      gender: 0,
      mold: 0,
      allianceId: 13704,
      allocateRoleId: 0,
      avatar: 'https://mkpub.oss-cn-hangzhou.aliyuncs.com/user/160004/small_ikQvkjh.png',
      belongAffairId: 115504,
      state: 0,
      type: 2,

    },
    {
      roleTitle: 'bababab',
      roleId: 1139414,
      username: 'zhangrui',
      userId: 160004,
      gender: 0,
      mold: 0,
      allianceId: 13704,
      allocateRoleId: 0,
      avatar: 'https://mkpub.oss-cn-hangzhou.aliyuncs.com/user/160004/small_ikQvkjh.png',
      belongAffairId: 115504,
      state: 0,
      type: 2,

    },
    {
      roleTitle: 'bababab',
      roleId: 1139414,
      username: 'zhangrui',
      userId: 160004,
      gender: 0,
      mold: 0,
      allianceId: 13704,
      allocateRoleId: 0,
      avatar: 'https://mkpub.oss-cn-hangzhou.aliyuncs.com/user/160004/small_ikQvkjh.png',
      belongAffairId: 115504,
      state: 0,
      type: 2,

    },
  ])
}

export default SingleRolePopover
