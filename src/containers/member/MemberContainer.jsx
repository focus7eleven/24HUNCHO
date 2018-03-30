import React from 'react'
import styles from './MemberContainer.scss'
import { Spin, Select, Input, Button, notification } from 'antd'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { fromJS, List } from 'immutable'
import imgNoPermissions from 'images/img_no_permissions.png'
import MemberCard from '../../components/card/MemberCard'
import InviteModal from '../group/modal/InviteModal'
import { USER_ROLE_TYPE, USER_ROLE_TYPES } from 'member-role-type'
import { AFFAIR_TYPE } from '../header/HeaderContainer'
import {
  getCourseRole,
  getRoles,
  deleteRole,
  inviteTeachers,
  inviteTutors,
} from '../../actions/role'
import { inviteMembers } from '../../actions/group'

const Search = Input.Search;
const Option = Select.Option;

export const INVITE_TYPE = {
  GROUP: 0,
  TEACHER: 1,
  ASSISTANT: 2,
  NONE: -1,
}
export const INVITE_TYPES = ['成员', '老师', '助教']

class MemberContainer extends React.Component {
  state = {
    roles: [],
    isGroup: false,
    currentType: '',
    currentKeyword: '',
    showInviteModal: INVITE_TYPE.NONE,
    isLoading: true,
    isInviting: false,
  }

  componentDidMount() {
    if (this.props.roleId !== -2) {
      this.fetchRoles(this.props.courseId, this.props.groupId)
    } else {
      let isGroup = false
      if (this.props.groupId) {
        isGroup = true
      }
      this.setState({
        isLoading: false,
        isGroup: isGroup
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    const courseId = this.props.courseId
    const groupId = this.props.groupId
    const thisRoleId = this.props.roleId

    const nextCourseId = nextProps.courseId
    const nextGroupId = nextProps.groupId
    const nextRole = nextProps.role
    const nextRoleId = nextProps.roleId

    if (nextGroupId) {
      if ((nextRoleId !== -2 && thisRoleId === -2) || (!groupId || groupId != nextGroupId)) {
        this.fetchRoles(nextCourseId, nextGroupId, nextRole)
      }
    } else {
      if ((nextRoleId !== -2 && thisRoleId === -2) || courseId != nextCourseId) {
        this.fetchRoles(nextCourseId, null, nextRole)
      }
    }
  }

  fetchRoles = (courseId, groupId, nextRole = null) => {
    const role = nextRole ? nextRole : this.props.role

    this.setState({ isLoading: true })
    if (groupId) {
      // 小组成员
      this.props.getGroupRole(groupId, role.get('roleId')).then(res => {
        this.setState({
          roles: this.props.groupRole,
          isGroup: true,
          isLoading: false,
        })
      })
      // 如果此时courseId有变动，要重新fetch courserole
      this.props.getCourseRole(courseId, role.get('roleId'))

    } else {
      // 课程成员
      this.props.getCourseRole(courseId, role.get('roleId')).then(res => {
        this.setState({
          roles: this.props.courseRole,
          isGroup: false,
          isLoading: false,
        })
      })
    }

  }

  handleTypeChange = e => {
    let roles = this.state.isGroup ? this.props.groupRole : this.props.courseRole
    const { currentKeyword } = this.state
    if (e && currentKeyword) {
      roles = roles.filter(group => group.get('roleType') == e)
        .map(group => fromJS({
          roleType: group.get('roleType'),
          roleList: group.get('roleList').filter(role => (~role.get('realName').indexOf(currentKeyword) || ~role.get('number').indexOf(currentKeyword)))
        }))
    } else if (e) {
      roles = roles.filter(group => group.get('roleType') == e)
    }
    this.setState({ roles, currentType: e })
  }

  handleSearchMember = e => {
    let roles = this.state.isGroup ? this.props.groupRole : this.props.courseRole
    const { currentType } = this.state
    if (e && currentType) {
      roles = roles.filter(group => group.get('roleType') == currentType)
        .map(group => fromJS({
          roleType: group.get('roleType'),
          roleList: group.get('roleList').filter(role => (~role.get('realName').indexOf(e) || ~role.get('number').indexOf(e)))
        }))
    } else if (e) {
      roles = roles.map(group => fromJS({
        roleType: group.get('roleType'),
        roleList: group.get('roleList').filter(role => (~role.get('realName').indexOf(e) || ~role.get('number').indexOf(e)))
      }))
    } else if (currentType) {
      roles = roles.filter(group => group.get('roleType') == currentType)
    }
    this.setState({ roles })
  }

  handleInvite = (type, checkedRoles) => {
    const {
      inviteMembers,
      inviteTeachers,
      inviteTutors,
      role,
      courseRole,
      courseId,
      groupId
    } = this.props

    this.setState({
      isInviting: true,
    })
    const roleIds = checkedRoles.map((v) => {
      return v.get('id')
    })
    let invite = null
    switch(type) {
    case INVITE_TYPE.GROUP:
      // 小组邀请成员
      invite = inviteMembers(groupId, role.get('roleId'), roleIds.toJS())
      break
    case INVITE_TYPE.TEACHER:
    // 邀请老师
      invite = inviteTeachers(courseId, role.get('roleId'), roleIds.toJS())
      break
    case INVITE_TYPE.ASSISTANT:
    // 邀请助教
      invite = inviteTutors(courseId, role.get('roleId'), roleIds.toJS())
      break
    default:

    }
    invite && invite.then(res => {
      if (res.code === 0) {
        notification['success']({
          message: '邀请成功'
        })
        // 返回的数据为一个列表，表示每个发过去的roleId是否被成功邀请
        const result = fromJS(res.data)
        result.forEach((v) => {
          // 未被成功邀请的role，提示用户
          if (v.get('code') == 6002) {
            let r = checkedRoles.find((value) => {
              return value.get('id') === v.get('key')
            })
            if (r) {
              notification['warning']({
                message: `${USER_ROLE_TYPES[r.get('roleType')]} ${r.get('realName')} ${r.get('number')}`,
                description: v.get('errorMsg')
              })
            }

          }
        })
        this.fetchRoles(courseId, groupId)
        this.setState({
          showInviteModal: INVITE_TYPE.NONE,
          isInviting: false,
        })
      } else {
        notification['error']({
          message: '邀请失败',
          description: res.data
        })
        this.setState({
          isInviting: false,
        })
      }
    })

  }

  handleRemoveMember = (deleteRoleId) => {
    const {
      courseId,
      groupId,
      role,
    } = this.props
    const { isGroup } = this.state
    const affairId = groupId ? groupId : courseId
    this.props.deleteRole(affairId, role.get('roleId'), deleteRoleId, isGroup ? AFFAIR_TYPE.GROUP : AFFAIR_TYPE.COURSE).then(res => {
      notification[res.type]({
        message: res.message,
        description: res.description
      })
      if (res.type === 'success') {
        this.fetchRoles(courseId, groupId)
      }
    })
  }

  render() {
    const { roles, showInviteModal, isGroup, isLoading, isInviting } = this.state
    const { role, groupId, courseId } = this.props
    const roleType = role.get('roleType')

    const roleTypes = isGroup ? this.props.groupRole : this.props.courseRole

    if (isLoading) {
      return (
        <div className={styles.container}>
          <Spin />
        </div>
      )
    }

    if (isGroup && roleType == USER_ROLE_TYPE.NULL) {
      return (
        <div className={styles.container}>
          <div className={styles.nullPage}>
            <img key="img" src={imgNoPermissions} />
            <div key="text">权限不足</div>
          </div>
        </div>

      )
    }

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Select defaultValue="" style={{ width: 85 }} onChange={this.handleTypeChange}>
            <Option value="">所有角色</Option>
            {
              roleTypes.map((group, index) => (
                <Option key={index} value={'' + group.get('roleType')}>{ USER_ROLE_TYPES[group.get('roleType')] }</Option>
              ))
            }
          </Select>
          <Search
            placeholder="请输入关键字"
            className={styles.search}
            onSearch={this.handleSearchMember}
            onChange={(e) => this.handleSearchMember(e.target.value)}
          />
          {groupId ? (roleType === USER_ROLE_TYPE.TEACHER || roleType === USER_ROLE_TYPE.ASSISTANT || roleType === USER_ROLE_TYPE.MANAGER) &&
            <div className={styles.btnGroup}>
              <Button type="primary" size="large" className={styles.inviteBtn} onClick={() => this.setState({ showInviteModal: INVITE_TYPE.GROUP })}>邀请组员</Button>
            </div>
            :
            (roleType === USER_ROLE_TYPE.TEACHER) &&
            <div className={styles.btnGroup}>
              <Button type="ghost" size="large" className={styles.inviteBtn} onClick={() => this.setState({ showInviteModal: INVITE_TYPE.TEACHER})}>邀请老师</Button>
              <Button type="ghost" size="large" className={styles.inviteBtn} onClick={() => this.setState({ showInviteModal: INVITE_TYPE.ASSISTANT})}>邀请助教</Button>
            </div>
          }
        </div>
        <div className={styles.member}>
          {
            roles.map((group, index) => (
              [
                <div key={index + 'type'} className={styles.label}>{ USER_ROLE_TYPES[group.get('roleType')] }：（{ group.get('roleList').size }）</div>,
                <div key={index} className={styles.cards}>
                  {
                    group.get('roleList').map((m, index) => (
                      <MemberCard
                        key={index + 'card'}
                        member={m}
                        optRole={role}
                        onRemoveCallback={this.handleRemoveMember}
                      />
                    ))
                  }
                </div>
              ]
            ))
          }
        </div>
        { showInviteModal !== INVITE_TYPE.NONE &&
          <InviteModal
            courseId={this.props.match.params.id}
            optRoleId={role.get('roleId')}
            currentRoles={
              roles.reduce((list, group) => {
                return list.concat(group.get('roleList'))
              }, List())
            }
            type={showInviteModal}
            isInviting={isInviting}
            cancelCallback={() => this.setState({ showInviteModal: INVITE_TYPE.NONE })}
            submitCallback={this.handleInvite}
          />
        }
      </div>
    )
  }
}

function mapStateToProps(state, props) {
	return {
		courseRole: state.getIn(['role', 'courseRole']),
    groupRole: state.getIn(['role', 'groupRole']),
    role: state.getIn(['user', 'role']),
    roleId: state.getIn(['user', 'role', 'roleId']),
    courseId: props.match.params.id,
    groupId: props.match.params.groupId,
	}
}

function mapDispatchToProps(dispatch) {
	return {
		getCourseRole: bindActionCreators(getCourseRole, dispatch),
    getGroupRole: bindActionCreators(getRoles, dispatch),
    inviteMembers: bindActionCreators(inviteMembers, dispatch),
    inviteTeachers: bindActionCreators(inviteTeachers, dispatch),
    inviteTutors: bindActionCreators(inviteTutors, dispatch),
    deleteRole: bindActionCreators(deleteRole, dispatch),
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MemberContainer))
