import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { Button, Modal, Input, Tooltip, Checkbox, message } from 'antd'
import classNames from 'classnames'
import { SearchIcon } from 'svg'
import { List } from 'immutable'
import _ from 'lodash'
import styles from './CreateGroupChatModal.scss'
import { createGroupChat, updateGroupMember } from '../../actions/chat'

const ERROR = [
  '',
  '讨论组名称不能为空',
  '讨论组名称不能超过15个字符',
]

class CreateGroupChatModal extends React.Component {
  static propTypes = {
    isCreate: PropTypes.bool.isRequired
  }

  state = {
    keyword: '',
    groupName: '',
    groupNameInvalid: 0,
    checkedList: List(),
    loading: false,
    teachers: List(),
    students: List(),
    assistants: List(),
    managers: List(),
    members: List(),
  }

  componentWillMount() {
    if (!this.props.isCreate) {
      let checkedList = this.props.currentGroupMember.getIn(['groups', 0, 'members']) || this.props.currentGroupMember.getIn(['roles'])
      checkedList = checkedList.map(r => r.set('realName', r.get('username')))
      this.setState({ checkedList })
    }
  }

  // componentWillReceiveProps(nextProps) {
  //   this.setState({
  //     teachers: nextProps.filter(v = v.get())
  //   })
  // }

  handleOk = () => {
    const { checkedList, groupName, groupNameInvalid } = this.state
    const { affairId, roleId, isCreate, selectedChat } = this.props

    if (isCreate) {
      if (groupName.trim() === '') {
        this.setState({ groupNameInvalid: 1})
        return
      }

      if (groupNameInvalid) {
        return
      }

      const groupChat = JSON.stringify({
        containAffairRoles: false,
        containAllianceRoles: false,
        containGuestRoles: false,
        name: groupName.trimLeft().trimRight(),
        members: checkedList.map((v) => v.get('id')).toJS()
      })

      this.setState({ loading: true })
      this.props.createGroupChat(groupChat, affairId, roleId).then(res => {
        this.setState({ loading: false })
        if (res) {
          this.props.onCancel()
        }
      })
    } else {
      const member = JSON.stringify({
        containAffairRoles: false,
        containAllianceRoles: false,
        containGuestRoles: false,
        members: checkedList.map((v) => v.get('id')).toJS(),
        groupId: selectedChat.getIn(['groupInfo', 'groupId'])
      })
      this.setState({ loading: true })
      this.props.updateGroupMember(member, affairId, roleId).then(res => {
        this.setState({ loading: false })
        if (res) {
          this.props.onCancel()
        }
      })
    }

  }

  handleGroupNameChange = (e) => {
    const value = e.target.value
    let groupNameInvalid = 0
    if (!value.trim()) {
      groupNameInvalid = 1
    } else if (value.trim().length > 15) {
      groupNameInvalid = 2
    }

    this.setState({
      groupNameInvalid,
      groupName: value
    })
  }

  handleCheckbox(role, event) {
    const { checkedList } = this.state
    const targetIndex = checkedList.findIndex(v => v.get('id') === role.get('id'))
    this.setState({
      checkedList: event.target.checked ? checkedList.push(role) : checkedList.splice(targetIndex, 1)
    })
  }

  handleCheckAll(roles, event) {
    const { checkedList } = this.state
    roles = roles.filter(v => v.get('id') !== this.props.roleId)
    this.setState({
      checkedList: event.target.checked ? checkedList.concat(roles.filter(r => !~checkedList.findIndex(v => v.get('id') === r.get('id')))) : checkedList.filter(r => !~roles.findIndex(v => v.get('id') === r.get('id')))
    })
  }

  isChecked(role) {
    return ~this.state.checkedList.findIndex(r => r.get('id') === role.get('id'))
  }

  isAllChecked(roles) {
    if (!roles || roles.length === 0) {
      return false
    } else {
      const { checkedList } = this.state
      // if (roles.some((role) => !checkedList.includes(role))) {
      if (roles.filter(v => v.get('id') !== this.props.roleId).some(role => !~checkedList.findIndex(v => v.get('id') === role.get('id')))) {
        return false
      } else {
        return true
      }
    }
  }

  debounceSetKeyword = _.debounce(keyword => this.setState({ keyword }), 300)

  handleTriggerSearchRequest = (e) => {
    this.debounceSetKeyword(e.target.value.trim())
  }

  renderCheckList(items, filter = true) {
    const { roleId } = this.props
    const { keyword } = this.state
    return items.map((item, index) => {
      return roleId === item.get('id') || (!~item.get('realName').indexOf(keyword) && filter) ? null : (
        <Checkbox key={item.get('id')} onChange={this.handleCheckbox.bind(this, item)} checked={this.isChecked(item)}>
          <div className={styles.role}>
            <img src={item.get('avatar')} alt=""/>
            <Tooltip title={item.get('realName') || item.get('username')} placement="bottomLeft"><span className={styles.name}>{item.get('realName')}</span></Tooltip>
          </div>
        </Checkbox>
      )
    })
  }

  render() {
    const { visible, isCreate, onCancel, teachers, assistants, students, managers, members } = this.props
    const { loading, groupName, groupNameInvalid, checkedList } = this.state

    const renderRole = (list, label) => list.size ? (
      [
        <div className={styles.allCheckbox} key={label}>
          <Checkbox onChange={this.handleCheckAll.bind(this, list)} checked={this.isAllChecked(list)}/>
          <div className="u-text-l-12">{label}：</div>
        </div>,
        <div className={styles.checkList} key={label + 'list'}>
          {this.renderCheckList(list)}
        </div>
      ]
    ) : null

    return (
      <Modal title={isCreate ? '创建讨论组' : '编辑讨论组'}
        width={920}
        visible={visible}
        onOk={this.handleOk}
        // okText={isCreate ? '确认创建' : '确认修改'}
        onCancel={onCancel}
        wrapClassName={styles.groupModal}
        footer={[
          <Button key="cancel" size="large" onClick={onCancel}>取消</Button>,
          <Button key="submit" type="primary" size="large" loading={loading} onClick={this.handleOk}>确认</Button>,
        ]}
      >

        <div className={styles.row} style={{ marginTop: 10 }}>
          {isCreate ?
            <div className={styles.newGroupName}>
              <span>讨论组名：</span>
              <Input style={{ width: 220 }} value={groupName} placeholder="讨论组名称" onChange={this.handleGroupNameChange}/>
              {groupNameInvalid ? <span className="danger">{ERROR[groupNameInvalid]}</span> : null}
            </div> : null
          }
          {/* {isCreate ? <div className="u-text-14" style={{ marginBottom: 4 }}>选择角色：</div> : null} */}
          <div className={styles.roleContainer}>
            <div className={styles.roles}>
              <div className={styles.searchField}>
                <Input placeholder="搜索角色" onChange={this.handleTriggerSearchRequest} />
                <span className={styles.searchIcon}><SearchIcon/></span>
              </div>
              {
                this.props.match.params.groupId ?
                [
                  renderRole(managers, '组长'),
                  renderRole(members, '组员'),
                  renderRole(assistants, '助教'),
                ]
                :
                [
                  renderRole(teachers, '教师'),
                  renderRole(assistants, '助教'),
                  renderRole(students, '学生'),
                ]
              }
            </div>
            <div className={styles.selectedRoles}>
              <div className="u-text-l-12">已选择：</div>
              <div className={styles.checkList}>
                {this.renderCheckList(checkedList, false)}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    )

  }

}

function mapStateToProps(state, props) {
	return {
		roleId: state.getIn(['user', 'role', 'roleId']),
    affairId: props.match.params.groupId || props.match.params.id,
    selectedChat: state.getIn(['chat', 'selectedChat']),
    // 角色
		courseRole: state.getIn(['role', 'courseRole']),
		teachers: state.getIn(['role', 'teachers']),
		students: state.getIn(['role', 'students']),
		assistants: state.getIn(['role', 'assistants']),
		managers: state.getIn(['role', 'managers']),
		members: state.getIn(['role', 'members']),
    groupRole: state.getIn(['role', 'groupRole']),
    currentGroupMember: state.getIn(['chat', 'currentGroupMember']),
	}
}

function mapDispatchToProps(dispatch) {
	return {
    createGroupChat: bindActionCreators(createGroupChat, dispatch),
    updateGroupMember: bindActionCreators(updateGroupMember, dispatch),
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(CreateGroupChatModal))
