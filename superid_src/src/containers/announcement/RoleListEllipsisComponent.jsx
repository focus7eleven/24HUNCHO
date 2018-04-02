import React, { PropTypes } from 'react'
import { Tooltip, Modal } from 'antd'
import { AddIcon, ElipsisIcon } from 'svg'
import styles from './RoleListEllipsisComponent.scss'
import { List } from 'immutable'
import AffairAvatar from '../../components/avatar/AffairAvatar'

const MAX_COUNT = 6

const RoleListEllipsis = React.createClass({
  propTypes: {
    roleList: PropTypes.arrayOf(PropTypes.shape({
      roleTitle: PropTypes.string,
      userName: PropTypes.string,
      avatar: PropTypes.string,
    })),
    guests: PropTypes.object, // 参与者的角色组成
    onRemoveGuest: PropTypes.func,
  },

  getInitialState() {
    return {
      showMoreRoles: false,
      guests: null,
    }
  },

  renderRoleList() {
    return this.props.roleList.slice(0, MAX_COUNT).map((role, k) => (
      <Tooltip placement="top" key={k} title={`${role.roleTitle} ${role.username}`}>
        <div className={styles.roleContainer}>
          <div className={styles.role}>
            {role.avatar ? <img src={role.avatar} /> : null}
          </div>

          {this.props.showTitle ? <div className={styles.title}>{`${role.roleTitle}－${role.username}`}</div> : null}
        </div>
      </Tooltip>
    ))
  },
  renderElipsisIcon() {
    return (
      <span style={{ width: 23, height: 23 }} onClick={() => this.setState({ showMoreRoles: true })}>
        <ElipsisIcon style={{ width: 23, height: 23, fill: '#bdbdbd' }}/>
      </span>
    )
  },
  renderOfficialTable() {
    let officialList = this.props.roleList

    return (
      <div className={styles.officialTable}>
        {
          officialList.map((official, k) => (
            <div key={k} className={styles.officialTableItem}>
              <div className={styles.avatar}>
                <img src={official.avatar} />
              </div>
              <div>
                {`${official.roleTitle}－${official.username}`}
              </div>
            </div>
          ))
        }
      </div>
    )
  },
  renderRole(role) {
    return (
      <div className={styles.roleItem} key={role.get('roleId')} onClick={() => this.props.onRemoveGuest && this.props.onRemoveGuest(role)}>
        <div className={styles.avatar}>
          {role.get('avatar') ? <img src={role.get('avatar')} /> : null}
          <div className={styles.mask}>
            <AddIcon fill="#fff" />
          </div>
        </div>
        <div>
          {`${role.get('roleTitle')}－${role.get('username')}`}
        </div>
      </div>
    )
  },
  renderGuestsTable() {
    let guests = this.props.guests

    return (
      <div className={styles.guestTable}>
        {/* 事务内参与者 */}
        <div className={styles.classifier}>事务内：</div>
        <div className={styles.guestList}>
          {guests.get('innerAffair').map((role) => this.renderRole(role))}
        </div>

        {/* 盟内参与者 */}
        {guests.get('innerAlliance').size ? <div className={styles.classifier}>盟内：</div> : null}
        {
          guests.get('innerAlliance').reduce((r, v) => {
            const affair = v.get('affair')
            const affairItem = (
              <div className={styles.affairItem} key={r.size}>
                <AffairAvatar affair={affair} sideLength={21} />
                <p>{`${affair.get('name')}`}</p>
              </div>
            )
            r = r.push(affairItem)

            const roleList = (
              <div className={styles.guestList} key={r.size}>
                {v.get('roleList').map((role) => this.renderRole(role))}
              </div>
            )
            r = r.push(roleList)

            return r
          }, List())
        }

        {/* 盟客网参与者 */}
        {guests.get('menkor').size ? <div className={styles.classifier}>盟客网：</div> : null}
        {
          guests.get('menkor').reduce((r, v) => {
            const alliance = v.get('alliance')
            const allianceItem = (
              <div className={styles.allianceItem} key={r.size}>
                {
                  <div className={styles.avatar}>
                    {alliance.get('logoUrl') ? <img src={alliance.get('logoUrl')} /> : null}
                  </div>
                }
                <p>{`${alliance.get('name')}`}</p>
              </div>
            )
            r = r.push(allianceItem)

            const roleList = (
              <div className={styles.guestList} key={r.size}>
                {v.get('roleList').map((role) => this.renderRole(role))}
              </div>
            )
            r = r.push(roleList)

            return r
          }, List())
        }
      </div>
    )
  },
  render() {
    return (
      <div className={styles.container}>
        {/* 公告官方的列表 */}
        {this.renderRoleList()}

        {/* 当数量过多时展开全部列表 */}
        {this.props.roleList.length > MAX_COUNT || this.props.guests ? this.renderElipsisIcon() : null}

        {/* 所有公告官方 */}
        <Modal
          title={this.props.guests ? '参与者' : '发布官方'}
          visible={this.state.showMoreRoles}
          onCancel={() => this.setState({ showMoreRoles: false })}
          width={600}
          footer={null}
        >
          {this.props.guests ? this.renderGuestsTable() : this.renderOfficialTable() }
        </Modal>
      </div>
    )
  }
})

export default RoleListEllipsis
