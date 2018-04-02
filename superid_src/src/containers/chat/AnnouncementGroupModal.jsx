import React from 'react'
import styles from './AnnouncementGroupModal.scss'
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

const AnnouncementGroupModal = React.createClass({
  propTypes: {
    type: PropTypes.number.isRequired, //modal类型，0为创建，1为编辑
    visible: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
    guests: PropTypes.object.isRequired,
    roleId: PropTypes.number.isRequired,
    affairId: PropTypes.number.isRequired,
    announcementId: PropTypes.number.isRequired,
    scope: PropTypes.number.isRequired, //scope，事务内、盟内、盟客
    onOk: PropTypes.func,
    name: PropTypes.string, //编辑讨论组时为原讨论组名称
    groupId: PropTypes.number, //编辑讨论组时为原讨论组id
    allianceId: PropTypes.number,
    membersInGroup: PropTypes.array,
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
    const membersInGroup = this.props.membersInGroup
    if (membersInGroup && membersInGroup.length > 0) {
      this.setState({
        checkedList: List(membersInGroup)
      })
    }
  },

  componentWillReceiveProps(nextProps) {
    const membersInGroup = nextProps.membersInGroup
    if (membersInGroup && membersInGroup.length > 0) {
      this.setState({
        checkedList: List(membersInGroup)
      })
    }
  },

  handleOnOk() {
    const { type, roleId, affairId, onCancel, scope, announcementId, onOk, groupId } = this.props
    const { checkedList, groupName } = this.state

    if (type === GROUP_MODAL_TYPE.CREATE) {

      // 创建讨论组
      if (groupName.trim() === '') {
        this.setState({
          groupNameInvalid: true
        })
        return
      }

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
          topicType: scope,
          name: groupName.trimLeft().trimRight(),
          members: checkedList.map((v) => {
            return {
              left: v.memberType,
              right: v.id
            }
          }).toJS()
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
      fetch(config.api.announcement.chat.updateMembers(), {
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
          announcementId: announcementId,
          members: checkedList.map((v) => {
            return {
              left: v.memberType,
              right: v.id
            }
          }).toJS()
        })
      }).then((res) => res.json()).then((res) => {
        if (res.code === 0) {
          onCancel && onCancel()
          onOk && onOk(res)
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
    let { checkedList } = this.state
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
    const { type, roleId } = this.props
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
      roles
      )
    )
  },

  renderCheckList(items) {
    return items.map((item, index) => {
      return (
        <Checkbox key={index} onChange={(event) => this.handleCheckbox(item, event)} checked={this.isChecked(item)}>
          <div className={styles.role}>
            <img src={item.avatar} alt=""/>
            <Tooltip title={`${item.firstName}-${item.secondName}`} placement="bottomLeft"><span className={styles.name}>{`${item.firstName}-${item.secondName}`}</span></Tooltip>
          </div>
        </Checkbox>
      )
    })
  },

  render() {
    const { type, visible, onCancel, guests } = this.props
    const { checkedList, groupName, groupNameInvalid } = this.state
    const isCreate = type === GROUP_MODAL_TYPE.CREATE
    const rolesInAffair = this.filterRoles(guests.innerAffair)
    return (
      <Modal title={isCreate ? '创建讨论组' : '编辑角色'}
        width={640}
        visible={visible}
        onOk={this.handleOnOk}
        okText={isCreate ? '确认创建' : '确认修改'}
        onCancel={onCancel}
        wrapClassName={isCreate ? styles.groupCreateModal : styles.groupEditModal}
      >
        {isCreate ?
          <div className={classNames(styles.row, 'u-text-14')}>
            <span>讨论组名：</span>
            <Input style={{ width: 300 }} value={groupName} placeholder="讨论组名称" onChange={this.handleGroupNameChange}/>
            {groupNameInvalid ? <span className="danger">讨论组名称不能为空！</span> : null}
          </div> : null
        }
        <div className={styles.row}>
          {isCreate ? <div className="u-text-14" style={{ marginBottom: 4 }}>请选择发布内角色</div> : null}
          <div className={styles.roleContainer}>
            <div className={styles.roles}>
              <div className={styles.searchField}>
                <Input placeholder="搜索角色" onChange={(e) => this.handleTriggerSearchRequest(e.target.value)} />
                <span className={styles.searchIcon}><SearchIcon/></span>
              </div>
              <div className="u-text-l-12">事务内：</div>
              <div className={styles.checkList}>
                { this.renderCheckList(rolesInAffair) }
              </div>
              <div className="u-text-l-12">盟内事务：</div>
              <div className={styles.checkList}>
                { this.renderCheckList(guests.innerAlliance) }
              </div>
              <div className="u-text-l-12">盟客网各盟：</div>
              <div className={styles.checkList}>
                { this.renderCheckList(guests.menkor) }
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

export default AnnouncementGroupModal
