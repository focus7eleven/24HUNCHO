import React, { PropTypes } from 'react'
import { Tooltip, Popover } from 'antd'
import { AddIcon } from 'svg'
import styles from './OfficialListComponent.scss'
import config from '../../config'

const OfficialListComponent = React.createClass({
  propTypes: {
    officialList: PropTypes.arrayOf(PropTypes.shape({
      roleTitle: PropTypes.string,
      username: PropTypes.string,
      avatar: PropTypes.string,
    })),
    roleId: PropTypes.number.isRequired,
    affairId: PropTypes.number.isRequired,
    onAddOfficial: PropTypes.func.isRequired,
    onDeleteOfficial: PropTypes.func.isRequired,
    showTitle: PropTypes.bool, // 是否显示角色信息
    usePrimaryRoleFilter: PropTypes.bool,

  },

  getDefaultProps() {
    return {
      showTitle: false,
      usePrimaryRoleFilter: true,
      isColumnOrdered: false, //是否按列排列,false表示按行排列
      canRemoveSelf: false, //如果自己的角色被加入，是否可以取消掉。例如，在发布中不可以，在创建物资仓库时可以
      filterSelf: false,
    }
  },

  getInitialState() {
    return {
      roleList: [],
    }
  },

  componentDidMount() {
    this.fetchRoles()
  },

  fetchRoles() {
    if (this.props.usePrimaryRoleFilter) {
      fetch(config.api.affair.role.main_roles(), {
        method: 'GET',
        credentials: 'include',
        roleId: this.props.roleId,
        affairId: this.props.affairId,
      }).then((res) => res.json()).then((json) => {
        if (json.code === 0) {
          this.setState({
            roleList: json.data,
          })
        }
      })
    } else {
      fetch(config.api.affair.role.current(), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        roleId: this.props.roleId,
        affairId: this.props.affairId,
        body: JSON.stringify({
          active: true,
          inAlliance: true,
        })
      }).then((res) => res.json()).then((json) => {
        if (json.code === 0) {
          const roles = json.data.roles

          this.setState({
            roleList: roles
              .filter((v) => v.userId != 0)
              .map((v) => ({
                roleId: v.roleId,
                roleTitle: v.roleTitle,
                username: v.username,
                avatar: v.avatar,
              }))
          })
        }
      })
    }
  },
  renderMainRolePanel() {
    const { officialList, filterRoles, onAddOfficial } = this.props
    let { roleList } = this.state
    const filterRoleList = filterRoles ? officialList.concat(filterRoles) : officialList
    if (this.props.filterSelf){
      roleList = roleList.filter((v) => {return v.roleId != this.props.roleId})
    }
    return (
      <div className={styles.mainRolePanel}>
        {
         roleList.filter((v) => !filterRoleList.find((w) => w.roleId === v.roleId)).map((v, k) => {
           return (
             <div key={k} className={styles.mainRole} onClick={() => onAddOfficial && onAddOfficial(v)}>
               <div className={styles.mainRoleAvatar}>
                 <img src={v.avatar} />
               </div>
               <div>{`${v.roleTitle} ${v.username}`}</div>
             </div>
           )
         })
        }
      </div>
    )
  },
  renderOfficialList() {
    let officialList = this.props.officialList
    if (this.props.filterSelf)
      officialList = officialList.filter((v) => {return v.roleId != this.props.roleId})
    return officialList.map((official, k) => (
      <Tooltip placement="top" key={k} title={this.props.showTitle ? '' : `${official.roleTitle} ${official.username}`}>
        <div className={styles.officialContainer}>
          <div className={styles.official}>
            {official.avatar ? <img src={official.avatar} /> : null}
            <div className={styles.officialMask} onClick={() => this.props.onDeleteOfficial && this.props.onDeleteOfficial(official)}>
              <AddIcon fill="#fff" />
            </div>
          </div>
          {this.props.showTitle ? <div className={styles.title}>{`${official.roleTitle}－${official.username}`}</div> : null}
        </div>
      </Tooltip>
		))
  },
  render() {
    const candidates = this.state.roleList.filter((v) => !this.props.officialList.find((w) => w.roleId === v.roleId))
    const { isColumnOrdered } = this.props
    const containerStyle = isColumnOrdered ? `${styles.container} ${styles.containerColumn}` : styles.container
    let { roleList } = this.state
    if (this.props.filterSelf){
      roleList = roleList.filter((v) => {return v.roleId != this.props.roleId})
    }
    const context = (roleList.length == 0) ? (<div className={containerStyle}>无可选角色</div>) : (
      <div className={containerStyle}>
        {/* 官方成员头像的列表 */}
        {this.renderOfficialList()}

        {/* 没有其他官方候选人，则隐藏添加按钮 */}
        {
          candidates.length ? (
            <Popover overlayClassName={styles.officialPopover} placement="bottomLeft" content={this.renderMainRolePanel()} trigger="click">
              <div className={styles.addIcon}>
                <AddIcon />
              </div>
            </Popover>
          ) : null
        }
      </div>
    )
    return (
      context
    )
  }
})

export default OfficialListComponent
