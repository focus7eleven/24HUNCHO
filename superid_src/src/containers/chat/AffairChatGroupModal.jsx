import React from 'react'
import styles from './AffairChatGroupModal.scss'
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

const AffairChatGroupModal = React.createClass({

  propTypes: {
    type: PropTypes.number.isRequired, //modal类型，0为创建，1为编辑
    visible: PropTypes.bool.isRequired,
    affairId: PropTypes.number.isRequired,
    roleId: PropTypes.number.isRequired,
    affairRoles: PropTypes.object.isRequired, // 创建时可选的事务内角色
    onCancel: PropTypes.func.isRequired,
    onOk: PropTypes.func,
    name: PropTypes.string, //编辑讨论组时为原讨论组名称
    groupId: PropTypes.number, //编辑讨论组时为原讨论组id
    membersInGroup: PropTypes.array, // 编辑讨论组时已选角色
  },

  getDefaultProps() {
    return {
      type: GROUP_MODAL_TYPE.CREATE
    }
  },

  getInitialState() {
    return {
      checkedList: List(),
      groupName: '', //讨论组名称
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
    let membersInGroup = this.props.membersInGroup
    if (membersInGroup && membersInGroup.length > 0) {
      const { roles, allianceRoles, guestRoles } = this.props.affairRoles
      const allRoles = roles.concat(allianceRoles, guestRoles)
      membersInGroup = membersInGroup.map((r) => allRoles.find((t) => t.roleId === r.roleId))
      this.setState({
        checkedList: List(membersInGroup)
      })
    }
  },

  componentWillReceiveProps(nextProps) {
    let membersInGroup = nextProps.membersInGroup
    if (membersInGroup && membersInGroup.length > 0) {
      const { roles, allianceRoles, guestRoles } = nextProps.affairRoles
      const allRoles = roles.concat(allianceRoles, guestRoles)
      membersInGroup = membersInGroup.map((r) => allRoles.find((t) => t.roleId === r.roleId))       
      this.setState({
        checkedList: List(membersInGroup)
      })
    }
  },

  handleOnOk() {
    const { type, roleId, affairId, onCancel, onOk, groupId } = this.props
    const { checkedList, groupName } = this.state

    if (type === GROUP_MODAL_TYPE.CREATE) {

      // 创建讨论组
      if (groupName.trim() === '') {
        this.setState({
          groupNameInvalid: true
        })
        return
      }

      fetch(config.api.affair.chat.create(), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        affairId,
        roleId,
        body: JSON.stringify({
          containAffairRoles: false,
          containAllianceRoles: false,
          containGuestRoles: false,
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
      fetch(config.api.affair.chat.updateMembers(), {
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
          containAffairRoles: false,
          containAllianceRoles: false,
          containGuestRoles: false,
          members: checkedList.map((v) => v.roleId).toJS()
        })
      }).then((res) => res.json()).then((res) => {        
        if (res.code === 0) {
          onCancel && onCancel()
          onOk && onOk(res.data)
        } else {
          message.error('编辑讨论组失败！')
        }
      })
    }
  },

  isChecked(role) {
    return this.state.checkedList.findIndex((r) => r.roleId === role.roleId) > -1
  },

  isAllChecked(roles) {
    if (!roles || roles.length === 0) {
      return false
    } else {
      const { checkedList } = this.state
      if (roles.some((role) => !checkedList.includes(role))) {
        return false
      } else {
        return true
      }
    }

  },

  //复选框点击事件
  handleCheckbox(role, event) {
    let { checkedList } = this.state
    this.setState({
      checkedList: event.target.checked ? checkedList.push(role) : checkedList.splice(checkedList.indexOf(role), 1)
    })
  },

  handleCheckAll(roles, event) {
    let { checkedList } = this.state
    this.setState({
      checkedList: event.target.checked ? checkedList.concat(roles.filter((role) => !checkedList.includes(role))) : checkedList.filter((role) => !roles.includes(role))
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
    const { type, roleId } = this.props
    const { searchKeyword } = this.state

    

    const isCreate = type === GROUP_MODAL_TYPE.CREATE
    return (
      isCreate ? (
        searchKeyword ? (
          roles.filter((v) => v.state === 0).filter((v) => v.roleId != roleId).filter((v) => (v.roleTitle.indexOf(searchKeyword) + 1) || (v.username.indexOf(searchKeyword) + 1))
        ) : (
          roles.filter((v) => v.state === 0).filter((v) => v.roleId != roleId)
        )
      ) : (
        roles
      )
    )
  },

  renderCheckList(items) {
    const { roleId } = this.props

    return items.map((item, index) => {
      let checkBox = null
      if (roleId === item.roleId) {
        checkBox = (
          <Checkbox key={index} checked disabled>
            <div className={styles.role}>
              <img src={item.avatar} alt=""/>
              <Tooltip title={`${item.roleTitle}-${item.username}`} placement="bottomLeft"><span className={styles.name}>{`${item.roleTitle}-${item.username}`}</span></Tooltip>
            </div>
          </Checkbox>
        )
      } else {
        checkBox = (
          <Checkbox key={index} onChange={(event) => this.handleCheckbox(item, event)} checked={this.isChecked(item)}>
            <div className={styles.role}>
              <img src={item.avatar} alt=""/>
              <Tooltip title={`${item.roleTitle}-${item.username}`} placement="bottomLeft"><span className={styles.name}>{`${item.roleTitle}-${item.username}`}</span></Tooltip>
            </div>
          </Checkbox>
        )
      }
      return checkBox
    })
  },

  render() {
    const { type, visible, onCancel, affairRoles } = this.props
    const { checkedList, groupName, groupNameInvalid } = this.state
    const isCreate = type === GROUP_MODAL_TYPE.CREATE
    const rolesInAffair = this.filterRoles(affairRoles.roles).filter((r) => r.userId !== 0)
    const rolesInAlliance = this.filterRoles(affairRoles.allianceRoles)
    const rolesInGuests = this.filterRoles(affairRoles.guestRoles)
    
    return (
      <Modal title={isCreate ? '创建讨论组' : '编辑角色'}
        width={640}
        visible={visible}
        onOk={this.handleOnOk}
        okText={isCreate ? '确认创建' : '确认修改'}
        onCancel={onCancel}
        wrapClassName={styles.groupModal}
      >
        {isCreate ?
          <div className={classNames(styles.row, 'u-text-14')}>
            <span>讨论组名：</span>
            <Input style={{ width: 300 }} value={groupName} placeholder="讨论组名称" onChange={this.handleGroupNameChange}/>
            {groupNameInvalid ? <span className="danger">讨论组名称不能为空！</span> : null}
          </div> : null
        }
        <div className={styles.row} style={{ marginTop: 10 }}>
          {isCreate ? <div className="u-text-14" style={{ marginBottom: 4 }}>选择角色：</div> : null}
          <div className={styles.roleContainer}>
            <div className={styles.roles}>
              <div className={styles.searchField}>
                <Input placeholder="搜索角色" onChange={(e) => this.handleTriggerSearchRequest(e.target.value)} />
                <span className={styles.searchIcon}><SearchIcon/></span>
              </div>

              <div className={styles.allCheckbox}>
                <Checkbox onChange={(event) => this.handleCheckAll(rolesInAffair, event)} checked={this.isAllChecked(rolesInAffair)}/>
                <div className="u-text-l-12">本事务角色：</div>
              </div>
              <div className={styles.checkList}>
                {this.renderCheckList(rolesInAffair)}
              </div>

              <div className={styles.allCheckbox}>
                <Checkbox onChange={(event) => this.handleCheckAll(rolesInAlliance, event)} checked={this.isAllChecked(rolesInAlliance)}/>
                <div className="u-text-l-12">盟内角色：</div>
              </div>
              <div className={styles.checkList}>
                {this.renderCheckList(rolesInAlliance)}
              </div>

              <div className={styles.allCheckbox}>
                <Checkbox onChange={(event) => this.handleCheckAll(rolesInGuests, event)} checked={this.isAllChecked(rolesInGuests)}/>
                <div className="u-text-l-12">盟外角色</div>
              </div>
              <div className={styles.checkList}>
                {this.renderCheckList(rolesInGuests)}
              </div>

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

export default AffairChatGroupModal
