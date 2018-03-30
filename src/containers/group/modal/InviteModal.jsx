import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fromJS, List } from 'immutable'
import { Spin, Modal, Button, Input, Checkbox, Select } from 'antd'
import { CloseIcon } from 'svg'
import styles from './groupModal.scss'
import {
  getCourseRole,
  getTeachersOfDept,
  getStudentsOfDeptWithGrade,
} from '../../../actions/role'
import { USER_ROLE_TYPE } from 'member-role-type'
import { INVITE_TYPE, INVITE_TYPES } from '../../member/MemberContainer'

const GRADE_LIST = ['大一', '大二', '大三', '大四', '研一', '研二', '研三']
const Search = Input.Search
const Option = Select.Option

class RoleItem extends React.Component {
  onChange = (e) => {
    this.props.checkCallback(this.props.role.get('id'), e.target.checked)
  }
  render() {
    const {
      role,
      disabled
    } = this.props
    return (
      <Checkbox
        onChange={this.onChange}
        className={styles.roleItemContainer}
        style={{ marginLeft: 0}}
        checked={disabled ? true : role.get('isChecked')}
        disabled={disabled}
      >
        <div className={styles.roleContainer}>
          <div className={styles.avatar}>
            {role.get('avatar') ?
              <img src={role.get('avatar')} alt="用户头像" />
              :
              <div className={styles.defaultAvatar} />
            }
          </div>
          <div className={styles.infoContainer}>
            <div className={styles.realName}>{role.get('realName')}</div>
            <div className={styles.id}>ID:{role.get('number')}</div>
          </div>
        </div>
      </Checkbox>
    )
  }
}

class InviteModal extends React.Component {
  state = {
    roles: List(),
    totalRoles: List(),
    checkedRoles: List(),
    isLoading: true,
    grade: GRADE_LIST[0],
  }
  componentWillMount() {
    const {
      type,
    } = this.props
    switch (type) {
    case INVITE_TYPE.GROUP:
    //备选为本课程下的学生和助教
      this.fetchStudentsOfCourse()
      break
    case INVITE_TYPE.TEACHER:
    // 备选为该学院所有的老师
      this.fetchTeachersOfDept()
      break
    case INVITE_TYPE.ASSISTANT:
    // 备选为该学院特定年级的学生
      this.fetchStudentsOfDeptWithGrade()
      break
    default:

    }

  }

  getRoles = (roleList)  => {
    return roleList.reduce((list, roles) => {
      const roleType = roles.get('roleType')
      if (roleType == USER_ROLE_TYPE.STUDENT || roleType == USER_ROLE_TYPE.ASSISTANT) {
        return list.concat(roles.get('roleList'))
      } else {
        return list
      }
    }, List())
  }

  fetchStudentsOfCourse = () => {
    const { courseRole, courseId, optRoleId } = this.props
    this.setState({
      isLoading: true,
    })
    if (courseRole.size === 0) {
      this.props.getCourseRole(courseId, optRoleId).then(() => {
        const rolesList = this.getRoles(courseRole)
        this.setState({
          roles: rolesList,
          totalRoles: rolesList,
          isLoading: false,
        })
      })
    } else {
      const rolesList = this.getRoles(courseRole)
      this.setState({
        roles: rolesList,
        totalRoles: rolesList,
        isLoading: false,
      })
    }
  }

  fetchTeachersOfDept = () => {
    this.setState({
      isLoading: true,
    })
    this.props.getTeachersOfDept().then(res => {
      if (res.code === 0) {
        const rolesList = fromJS(res.data)
        this.setState({
          roles: rolesList,
          totalRoles: rolesList,
          isLoading: false,
        })
      } else {
        notification['error']({
          message: '获取本学院老师失败',
          description: json.data,
        })
      }
    })
  }

  fetchStudentsOfDeptWithGrade = () => {

    this.props.getStudentsOfDeptWithGrade(this.state.grade).then(res => {
      if (res.code === 0) {
        const rolesList = fromJS(res.data)
        this.setState({
          roles: rolesList,
          totalRoles: rolesList,
          isLoading: false,
        })
      } else {
        notification['error']({
          message: `获取本学院${grade}学生列表失败`,
          description: res.data,
        })
      }
    })
  }

  onChangeGrade = (value) => {
    this.setState({
      grade: value,
      isLoading: true,
    }, this.fetchStudentsOfDeptWithGrade)
  }

  handleCheckRole = (id, checked) => {
    const { checkedRoles, roles } = this.state
    const role = roles.find((v) => {
      return v.get('id') == id
    })

    const newRoles = roles.map((v) => {
      if (v.get('id') == id) {
        return v.set('isChecked', checked)
      } else {
        return v
      }
    })
    if (role) {
      if (checked) {
        this.setState({
          checkedRoles: checkedRoles.push(role),
          roles: newRoles,
        })
      } else {
        this.setState({
          checkedRoles: checkedRoles.filter((v) => {
            return v.get('id') != id
          }),
          roles: newRoles,
        })
      }

    }
  }

  handleCancel = () => {
    this.props.cancelCallback()
  }

  handleInvite = () => {
    const { checkedRoles } = this.state
    const { type } = this.props
    this.props.submitCallback(type, checkedRoles)
  }

  handleSearchMember = (text) => {
    const { totalRoles } = this.state
    const rolesList = totalRoles.filter(v => {
      return v.get('realName').indexOf(text) >= 0 || v.get('number').indexOf(text) >= 0
    })
    this.setState({
      roles: rolesList
    })
  }

  isInGroup = (role) => {
    const { currentRoles } = this.props
    const findRole = currentRoles.findIndex((v) => {
      return v.get('userId') == role.get('userId')
    })
    return findRole >= 0
  }

  render() {
    const {
      roles,
      isLoading,
      checkedRoles,
      grade,
    } = this.state

    const { type, isInviting } = this.props

    // if (isLoading) {
    //   return null
    // }
    const gradeSelector = (
      <Select defaultValue={grade} style={{ width: 65 }} onChange={this.onChangeGrade}>
        {GRADE_LIST.map((v, k) => {
          return (
            <Option value={v} key={k+""}>{v}</Option>
          )
        })}
      </Select>
    )
    return (
      <Modal
        wrapClassName={styles.modalWrapper}
        visible
        title={`邀请${INVITE_TYPES[type]}`}
        // okText="发送邀请"
        confirmLoading={isInviting}
        // onOk={this.handleInvite}
        onCancel={this.handleCancel}
        footer={[
          <Button type="default" onClick={this.handleCancel}>取消</Button>,
          <Button type="primary" onClick={this.handleInvite} loading={isInviting} disabled={checkedRoles.size===0}>发送邀请</Button>
        ]}
      >
        <Search
          placeholder={type == INVITE_TYPE.TEACHER ? "搜索老师" : "搜索学号，真实姓名"}
          style={{ width: '100%' }}
          onSearch={this.handleSearchMember}
          addonBefore={type == INVITE_TYPE.ASSISTANT ? gradeSelector : null}
        />
        <div className={styles.rolesContainer}>
          {isLoading ?
            <div className={styles.loadingContainer}>
              <Spin />
            </div>
            :
            roles.size === 0 ?
            <div className={styles.nullPage}>
              <div key="text">暂无人员</div>
            </div>
            :
            roles.map((v, k) => {
              return (
                <RoleItem
                  key={k}
                  role={v}
                  disabled={this.isInGroup(v)}
                  checkCallback={this.handleCheckRole}
                />
              )
            })
          }
        </div>
        { checkedRoles.size !== 0 &&
          <div className={styles.chosenContainer}>
            已添加：
            <div className={styles.chosenRoles}>
              { checkedRoles.map((v, k) => {
                return (
                  <div className={styles.chosenRole} key={k}>
                    {v.get('avatar') ?
                      <img src={v.get('avatar')} alt="用户头像" className={styles.defaultAvatar} />
                      :
                      <span className={styles.defaultAvatar} />
                    }
                    <span className={styles.realName}>{v.get('realName')}</span>
                    <CloseIcon onClick={this.handleCheckRole.bind(this, v.get('id'), false)}/>
                  </div>
                )
              })}
            </div>
          </div>
        }

      </Modal>
    )

  }
}

function mapStateToProps(state) {
  return {
    courseRole: state.getIn(['role', 'courseRole']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getCourseRole: bindActionCreators(getCourseRole, dispatch),
    getTeachersOfDept: bindActionCreators(getTeachersOfDept, dispatch),
    getStudentsOfDeptWithGrade: bindActionCreators(getStudentsOfDeptWithGrade, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(InviteModal)
