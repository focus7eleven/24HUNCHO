import React from 'react'
import classNames from 'classnames'
import { DeleteIcon, PersonOutIcon, PersonAddIcon } from 'svg'
import styles from './GroupCard.scss'
import { USER_ROLE_TYPE } from 'member-role-type'

class GroupCard extends React.Component {

  onDeleteGroup = (e) => {
    e.stopPropagation()
    this.props.onDeleteCallback(this.props.group.get('id'))
  }

  onExitGroup = (e) => {
    e.stopPropagation()
    this.props.onExitCallback(this.props.group.get('id'))
  }

  onJoinGroup = (e) => {
    e.stopPropagation()
    this.props.onJoinCallback(this.props.group.get('id'))
  }

  renderOpt = () => {
    const { group } = this.props
    let optText = '加入小组'
    if (group.get('mine')) {
      switch(group.get('roleType')) {
        case USER_ROLE_TYPE.MANAGER:
          optText = '删除小组'
          break
        case USER_ROLE_TYPE.MEMBER:
          optText = '退出小组'
          break
        default:
          optText = ''
      }
    }
    return optText
  }

  handleOpt = (e) => {
    const { group } = this.props
    if (group.get('mine')) {
      switch(group.get('roleType')) {
        case USER_ROLE_TYPE.MANAGER:
          this.onDeleteGroup(e)
          break
        case USER_ROLE_TYPE.MEMBER:
          this.onExitGroup(e)
          break
      }
    } else {
      this.onJoinGroup(e)
    }

  }

  render() {
    const { group, onClick } = this.props
    return (
      <div className={classNames(styles.container, this.props.wrapClassName)} onClick={onClick}>
        <div className={styles.title}>{group.get('name')}</div>
        <div className={styles.optWrapper}>
          { group.get('mine') ?
            (group.get('roleType') === USER_ROLE_TYPE.MANAGER || group.get('roleType') === USER_ROLE_TYPE.TEACHER || group.get('roleType') === USER_ROLE_TYPE.ASSISTANT) ?
              <div className={styles.opt} style={{color: '#f45b6c'}} onClick={this.onDeleteGroup}>
                <DeleteIcon style={{fill: '#f45b6c'}} />
                <span className={styles.text}>删除小组</span>
              </div>
              :
              <div className={styles.opt} style={{color: '#4a90e2'}} onClick={this.onExitGroup}>
                <PersonOutIcon style={{fill: '#4a90e2'}} />
                <span className={styles.text}>退出小组</span>
              </div>
            :
            <div className={styles.opt} style={{color: '#4a90e2'}} onClick={this.onJoinGroup}>
              <PersonAddIcon style={{fill: '#4a90e2'}} />
              <span className={styles.text}>加入小组</span>
            </div>
          }
        </div>
        <div className={styles.memberList}>
          <div className={styles.label}>
            人员：
          </div>
          {group.get('roles') && group.get('roles').map((v, k) => {
            return (
              <div className={styles.avatar} key={k}>
                {v.get('avatar') ?
                  <img src={v.get('avatar')} alt="头像" />
                  :
                  <span className={styles.defaultAvatar} />
                }
              </div>
            )
          })}
        </div>
        <div className={styles.description}>
          {group.get('description')}
        </div>
      </div>
    )
  }
}

GroupCard.defaultProps = {
  wrapClassName: ''
}

export default GroupCard
