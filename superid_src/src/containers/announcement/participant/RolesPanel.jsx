import React from 'react'
import { Tooltip, Popover, message } from 'antd'
import { fromJS } from 'immutable'
import config from '../../../config'
import styles from './RolesPanel.scss'
import { AddCircleIcon, AbortIcon } from '../../../public/svg'
import { OPT_ROLE, PARTICIPANT_TYPE } from '../constant/AnnouncementConstants'
import { SingleRoleSelectPanel } from '../../../components/role/RoleSelector'

const RolesPanel = React.createClass({
  getInitialState(){
    return {
      showOfficialPanel: false,
      officialRoleList: fromJS([]), // 备选官方角色
    }
  },
  getDefaultProps(){
    return {
      rolesList: fromJS([]),
      type: PARTICIPANT_TYPE.OFFICIAL, //
      optRoleType: OPT_ROLE.OFFICIAL, //当前操作者角色类型
    }
  },

  componentDidMount() {
    this.handleFetchOfficialRoleCandidates()
  },

  handleChooseOfficial({ role }){
    this.setState({
      showOfficialPanel: false,
    })
    this.props.addCallback(role)
  },

  renderSelectOfficialPanel(){
    const candidates = this.state.officialRoleList
      .filter((role) => !this.props.rolesList.some((v) => v.get('roleId') == role.get('roleId')))

    return (
      <SingleRoleSelectPanel style={{ position: 'static' }} roleList={candidates} showPanel onChange={this.handleChooseOfficial}/>
    )
  },

  handleFetchOfficialRoleCandidates() {
    fetch(config.api.affair.role.affair_roles(), {
      method: 'GET',
      credentials: 'include',
      roleId: this.props.affair.get('roleId'),
      affairId: this.props.affair.get('id'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          officialRoleList: fromJS(json.data || []),
        })
      }
    })
  },
  handleDeleteRole(role, type) {
    if (this.props.rolesList.size === 1 && type === PARTICIPANT_TYPE.OFFICIAL) {
      message.error('发布中至少需要一个官方')
      return
    }

    this.props.deleteCallback(role.get('roleId'), type)
  },

  render(){
    const { rolesList, type, optRoleType, addCallback, affair } = this.props

    return (
      <div className={styles.partiContainer}>
        {rolesList.map((v, k) => {
          return (
            <div className={styles.roleWrapper} key={k}>
              <span className={styles.avatar}>
                <img src={v.get('avatar')}/>
              </span>
              {/* 事务中有权限的人可以移除官客方，官客房自己可以退出发布，现在先认为事务中有权限的人是 官方 */
                (optRoleType === OPT_ROLE.OFFICIAL || v.get('roleId') === affair.get('roleId')) &&
                <span className={styles.cover} onClick={() => this.handleDeleteRole(v, type)}>
                  <Tooltip title="移除">
                    <span className={styles.delete}><AbortIcon/></span>
                  </Tooltip>
                </span>
              }
              <Popover content={<span>{v.get('roleTitle')}-{v.get('username')}</span>} placement="topLeft">
                <span className={styles.text}>
                  {v.get('roleTitle')}-{v.get('username')}
                </span>
              </Popover>
            </div>
          )
        })}
        {type === PARTICIPANT_TYPE.OFFICIAL && this.props.permission.some((v) => v == 504) ? (
          <div className={styles.add}>
            <Popover
              content={this.renderSelectOfficialPanel()}
              trigger="click"
              overlayClassName={styles.addOfficialPopover}
            >
              <AddCircleIcon/>
              添加官方
            </Popover>
          </div>
        ) : null}
        {type === PARTICIPANT_TYPE.CUSTOMER && this.props.permission.some((v) => v == 505) ? (
          <div className={styles.add} onClick={addCallback}>
            <AddCircleIcon/>
              添加客方
          </div>
        ) : null}
      </div>
    )
  }
})

export default RolesPanel
