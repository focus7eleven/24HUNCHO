import React from 'react'
import styles from './GroupModal.scss'
import { Modal, Input, Tooltip, Checkbox, message } from 'antd'
import classNames from 'classnames'
import { SearchIcon } from 'svg'
import { List } from 'immutable'
import _ from 'underscore'
import config from '../../config'

const PropTypes = React.PropTypes

export const GROUP_MODAL_TYPE = {
  CREATE: 0,
  EDIT: 1
}

const GroupModal = React.createClass({
  propTypes: {
    type: PropTypes.number.isRequired, //modal类型，0为创建，1为编辑
    visible: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
    officials: PropTypes.array.isRequired,
    guests: PropTypes.object.isRequired,
    roleId: PropTypes.number.isRequired,
    affairId: PropTypes.number.isRequired,
    announcementId: PropTypes.number.isRequired,
    scope: PropTypes.number.isRequired, //scope，事务内、盟内、盟客
    onOk: PropTypes.func,
    name: PropTypes.string, //编辑讨论组时为原讨论组名称
    rolesInGroup: PropTypes.object,
    groupId: PropTypes.number, //编辑讨论组时为原讨论组id
    allianceId: PropTypes.number
  },

  getDefaultProps() {
    return {
      type: GROUP_MODAL_TYPE.CREATE
    }
  },

  getInitialState() {
    const { type, name } = this.props

    return {
      checkedList: List(),
      groupName: type === GROUP_MODAL_TYPE.CREATE ? '' : name, //讨论组名称
      searchKeyword: '',
      groupNameInvalid: false
    }
  },

  componentDidMount() {
    this.handleTriggerSearchRequest = _.debounce((value) => {
      this.setState({
        searchKeyword: value
      })
    }, 300)
  },

  handleOnOk() {
    const { type, roleId, affairId, onCancel, scope, announcementId, onOk, groupId } = this.props
    const { checkedList, groupName } = this.state

    if (groupName.trim() === '') {
      this.setState({
        groupNameInvalid: true
      })
      return
    }

    if (type === GROUP_MODAL_TYPE.CREATE) {
      //创建讨论组
      fetch(config.api.announcement.chat.createGroup(), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        affairId,
        roleId,
        body: JSON.stringify({
          announcementId: announcementId,
          type: scope,
          name: groupName.trimLeft().trimRight(),
          members: checkedList.map((v) => v.roleId).toJS()
        })
      }).then((res) => res.json()).then((res) => {
        if (res.code === 0) {
          onCancel && onCancel()
          onOk && onOk(res.data)
        } else {
          message.error('创建讨论组失败，请检查信息是否完整！')
        }
      })
    } else {
      //编辑讨论组
      fetch(config.api.announcement.chat.editGroup(), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        affairId,
        roleId,
        body: JSON.stringify({
          groupId: groupId,
          name: groupName.trimLeft().trimRight(),
          adds: checkedList.map((v) => v.roleId).toJS()
        })
      }).then((res) => res.json()).then((res) => {
        if (res.code === 0) {
          onCancel && onCancel()
          onOk && onOk(groupName.trimLeft().trimRight())
        } else {
          message.error('编辑讨论组失败！')
        }
      })
    }
  },

  isChecked(role) {
    return this.state.checkedList.indexOf(role) + 1
  },

  //复选框点击事件
  handleCheckbox(role, event) {
    let {
      checkedList
    } = this.state
    this.setState({
      checkedList: event.target.checked ? checkedList.push(role) : checkedList.splice(checkedList.indexOf(role), 1)
    })
  },

  handleGroupNameChange(e) {
    const value = e.target.value

    this.setState({
      groupNameInvalid: !value.trim(),
      groupName: value
    })
  },

  //过滤角色，使用keyword、当前已有的角色等等
  filterRoles(roles) {
    const { type, rolesInGroup, roleId } = this.props
    const { searchKeyword } = this.state

    const isCreate = type === GROUP_MODAL_TYPE.CREATE
    return (
      isCreate ? (
        searchKeyword ? (
          roles.filter((v) => v.roleId != roleId).filter((v) => (v.roleTitle.indexOf(searchKeyword) + 1) || (v.username.indexOf(searchKeyword) + 1))
        ) : (
          roles.filter((v) => v.roleId != roleId)
        )
      ) : (
      roles.filter((v) => rolesInGroup.every((w) => v.roleId != w.member.roleId))
      )
    )
  },

  renderCheckList(roles) {
    return roles.map((role, index) => {
      return (
        <Checkbox key={index} onChange={(event) => this.handleCheckbox(role, event)} checked={this.isChecked(role)}>
          <div className={styles.role}>
            <img src={role.avatar} alt=""/>
            <Tooltip title={`${role.roleTitle}-${role.username}`} placement="bottomLeft"><span className={styles.name}>{`${role.roleTitle}-${role.username}`}</span></Tooltip>
          </div>
        </Checkbox>
      )
    })
  },

  render() {
    const { type, visible, onCancel, officials, guests, rolesInGroup } = this.props
    const { checkedList, groupName, groupNameInvalid } = this.state
    const isCreate = type === GROUP_MODAL_TYPE.CREATE
    const officialRoles = this.filterRoles(officials)
    const rolesInAffair = this.filterRoles(guests.innerAffair)
    const rolesInAlliance = guests.innerAlliance
    const rolesInMenkor = guests.menkor

    return (
      <Modal title={isCreate ? '创建讨论组' : '编辑讨论组'}
        width={640}
        visible={visible}
        onOk={this.handleOnOk}
        okText={isCreate ? '确认创建' : '确认修改'}
        onCancel={onCancel}
        wrapClassName={styles.groupModal}
      >
        <div className={classNames(styles.row, 'u-text-14')}>
          <span>讨论组名：</span>
          <Input style={{ width: 300 }} value={groupName} placeholder="讨论组名称" onChange={this.handleGroupNameChange}/>
          {groupNameInvalid ? <span className="danger">讨论组名称不能为空！</span> : null}
        </div>
        {isCreate ?
          null
        : (
          <div className={styles.row} style={{ alignItems: 'flex-start' }}>
            <span className="u-text-14">角色列表：</span>
            <div className={styles.roleList}>
              {rolesInGroup.map((role, index) => {
                return (
                  <div className={styles.role} key={index}>
                    <img src={role.member.avatar} alt=""/>
                    <span>{role.member.roleName + '-' + role.member.username}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        <div className={styles.row} style={{ marginTop: 10 }}>
          <div className="u-text-14" style={{ marginBottom: 4 }}>{isCreate ? '请选择发布内角色' : '添加角色'}：</div>
          <div className={styles.roleContainer}>
            <div className={styles.roles}>
              <div className={styles.searchField}>
                <Input placeholder="搜索角色" onChange={(e) => this.handleTriggerSearchRequest(e.target.value)} />
                <span className={styles.searchIcon}><SearchIcon/></span>
              </div>
              <div className="u-text-l-12">官方：</div>
              <div className={styles.checkList}>
                {this.renderCheckList(officialRoles)}
              </div>
              <div className="u-text-l-12">事务内：</div>
              <div className={styles.checkList}>
                {this.renderCheckList(rolesInAffair)}
              </div>
              <div className="u-text-l-12">盟内：</div>
              {rolesInAlliance.map((v, index) => {
                return (
                  <div key={index}>
                    <div className={styles.role} style={{ margin: '10px 0' }}>
                      <img src={v.affair.avatar} alt="事务"/>
                      <span className={styles.name}>{v.affair.name}</span>
                    </div>
                    <div className={styles.checkList}>
                      {this.renderCheckList(v.roleList)}
                    </div>
                  </div>
                )
              })}
              <div className="u-text-l-12">盟客：</div>
              {rolesInMenkor.map((v, index) => {
                return (
                  <div key={index}>
                    <div className={styles.role} style={{ margin: '10px 0' }}>
                      <img src={v.alliance.avatar} alt="事务"/>
                      <span className={styles.name}>{v.alliance.name}</span>
                    </div>
                    <div className={styles.checkList}>
                      {this.renderCheckList(v.roleList)}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className={styles.selectedRoles}>
              <div className="u-text-l-12">已选择：</div>
              <div className={styles.checkList}>
                {this.renderCheckList(checkedList)}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    )
  }
})

export default GroupModal
