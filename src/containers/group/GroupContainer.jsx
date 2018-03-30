import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fromJS, List } from 'immutable'
import PropTypes from 'prop-types'
import { Spin, Input, Button, Row, Col, notification } from 'antd'
import imageNoRelease from 'images/img_no_release.png'
import imageNoPermissions from 'images/img_no_permissions.png'
import { USER_ROLE_TYPE } from 'member-role-type'
import styles from './GroupContainer.scss'
import GroupCard from '../../components/card/GroupCard'
import CreateGroupModal from './modal/CreateGroupModal'
import ApplyToJoinModal from '../../components/modal/ApplyToJoinModal'
import { AFFAIR_TYPE } from '../header/HeaderContainer'

import {
  getGroupList,
  createGroup,
  deleteGroup,
  exitGroup,
} from '../../actions/group'
import {
  getMyCourse,
  getAllCourse,
} from '../../actions/course'
import { applyToJoin } from '../../actions/role'

const CONTENT_WIDTH = 945
const CONTENT_COUNT = 2

const Search = Input.Search
class GroupContainer extends React.Component {

  constructor(props) {
    super(props)
  }

  state = {
    allGroupList: List(),
    myGroupList: List(),
    showCreateModal: false,
    showJoinModal: false,
    currentGroup: null,
    isLoading: true,
  }

  componentWillMount() {
    this.fetchGroupList(this.props.courseId, this.props.roleId, true)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.courseId != this.props.courseId || nextProps.roleId != this.props.roleId) {
      this.fetchGroupList(nextProps.courseId, nextProps.roleId, true)
    }
  }

  fetchGroupList = (courseId = this.props.courseId, roleId = this.props.roleId, isFirst=false) => {
    this.setState({ isLoading: true })
    this.props.getGroupList(courseId, roleId).then((json) => {
      if(json.code === 0) {

        const count = CONTENT_COUNT
        const groupList = fromJS(json.data)

        if (isFirst) {

          this.setState({
            myTotalGroups: groupList.first(),
            allTotalGroups: groupList.last(),
            myGroupList: groupList.first(),
            allGroupList: groupList.last(),
            isLoading: false,
          })
        } else {

          this.setState({
            myGroupList: groupList.first(),
            allGroupList: groupList.last(),
            isLoading: false,
          })
        }

      }

    })
  }

  handleToGroup = (groupId) => {
    this.props.history.push(`${this.props.location.pathname}/${groupId}/member`)
  }

  handleJoinGroup = (value) => {
    const { currentGroup } = this.state

    this.props.applyToJoin(currentGroup.get('id'), this.props.roleId, value.reason, currentGroup.get('id'), AFFAIR_TYPE.GROUP).then(json => {
      notification[json.type]({
        message: json.message,
        description: json.description
      })
      if (json.type === 'success') {
        this.setState({
          showJoinModal: false,
          currentGroup: null
        }, this.fetchGroupList)
        this.props.getMyCourse()
      }
    })


  }

  handleDeleteGroup = (groupId) => {
    this.props.deleteGroup(this.props.courseId, this.props.roleId, groupId).then(res => {
      if (res.code === 0) {
        this.fetchGroupList()
        this.props.getMyCourse()
      }
    })
  }

  handleExitGroup = (groupId) => {
    this.props.exitGroup(this.props.courseId, this.props.roleId, groupId).then(res => {
      if (res.code === 0) {
        this.fetchGroupList()
        this.props.getMyCourse()

      }
    })
  }

  handleCreateGroup = (value, callback) => {
    const formData = new FormData()
    formData.append('name', value.name)
    formData.append('description', value.description)
    this.props.createGroup(this.props.courseId, this.props.roleId, formData).then(json => {
      notification[json.type]({
        message: json.message,
        description: json.description
      })
      if (json.type === 'success') {
        callback()
        this.setState({
          showCreateModal: false,
        }, this.fetchGroupList)
        this.props.getMyCourse()

      }
    })


  }

  onSearchGroup = (value) => {
    if (!value.trim()) {
      this.setState({
        myGroupList: this.state.myTotalGroups,
        allGroupList: this.state.allTotalGroups,
      })
    }
    const myGroupList = this.state.myTotalGroups.filter((v) => {
      return v && ~v.get('name').indexOf(value)
    })
    const allGroupList = this.state.allTotalGroups.filter(v => v && ~v.get('name').indexOf(value))
    this.setState({
      myGroupList: myGroupList,
      allGroupList: allGroupList,
    })
  }

  render() {
    const {
      myGroupList,
      allGroupList,
      showCreateModal,
      showJoinModal,
      currentGroup,
      isLoading,
    } = this.state

    const { roleType } = this.props

    if (roleType == USER_ROLE_TYPE.NULL) {
      return (
        <div className={styles.container} >
          <div className={styles.nullPage}>
            <img key="img" src={imageNoPermissions}/>
            <div key="text" >权限不足</div>
          </div>
        </div>
      )
    }

    if (isLoading) {
      return (
        <div className={styles.container} style={{textAlign: 'center', paddingTop: '40px'}}>
          <Spin />
        </div>
      )
    }

    return (
      <div className={styles.container}>
        <div className={styles.titleContainer}>
          <Search placeholder="搜索关键词" style={{ width: 166 }} onSearch={this.onSearchGroup}/>
          {
            roleType == USER_ROLE_TYPE.ASSISTANT ? null :
              <Button type="primary" size="large" onClick={() => this.setState({ showCreateModal: true })}>创建小组</Button>
          }
        </div>
        <div className={styles.groupsContainer}>
          {myGroupList.size !== 0 &&
            <div className={styles.groups}>
              我的小组
              <div className={styles.cardContainer}>
                <div className={styles.line1}>
                  {myGroupList.map((v, k) => {
                    if (k%2 === 1) {
                      return null
                    }
                    return (
                      <GroupCard
                        key={k}
                        wrapClassName={styles.groupCard}
                        group={v}
                        onClick={this.handleToGroup.bind(this, v.get('id'))}
                        onDeleteCallback={this.handleDeleteGroup}
                        onExitCallback={this.handleExitGroup}
                      />
                    )
                  })}
                </div>
                <div className={styles.line2}>
                  {myGroupList.map((v, k) => {
                    if (k%2 === 0) {
                      return null
                    }
                    return (
                      <GroupCard
                        key={k}
                        wrapClassName={styles.groupCard}
                        group={v}
                        onClick={this.handleToGroup.bind(this, v.get('id'))}
                        onDeleteCallback={this.handleDeleteGroup}
                        onExitCallback={this.handleExitGroup}
                      />
                    )
                  })}
                </div>

              </div>
            </div>
          }
          {allGroupList.size !== 0 &&
            <div className={styles.groups}>
              所有小组
              <div className={styles.cardContainer}>
                <div className={styles.line1}>
                  {allGroupList.map((v, k) => {
                    if (k%2 === 1) {
                      return null
                    }
                    return (
                      <GroupCard
                        key={k}
                        wrapClassName={styles.groupCard}
                        group={v}
                        onClick={null}
                        onJoinCallback={() => this.setState({ showJoinModal: true, currentGroup: v })}
                      />
                    )
                  })}
                </div>
                <div className={styles.line2}>
                  {allGroupList.map((v, k) => {
                    if (k%2 === 0) {
                      return null
                    }
                    return (
                      <GroupCard
                        key={k}
                        wrapClassName={styles.groupCard}
                        group={v}
                        onClick={null}
                        onJoinCallback={() => this.setState({ showJoinModal: true, currentGroup: v })}
                      />
                    )
                  })}
                </div>

              </div>
            </div>
          }
          {myGroupList.size === 0 && allGroupList.size === 0 &&
            <div className={styles.nullPage}>
              <img key="img" src={imageNoRelease}/>
              <div key="text">暂无小组</div>
            </div>
          }
        </div>

        {showCreateModal &&
          <CreateGroupModal
            onCancelCallback={() => this.setState({ showCreateModal: false })}
            onSubmitCallback={this.handleCreateGroup}
         />}

         {showJoinModal &&
           <ApplyToJoinModal
             name={currentGroup.get('name')}
             type={AFFAIR_TYPE.GROUP}
             onCancelCallback={() => this.setState({ showJoinModal: false, currentGroup: null })}
             onSubmitCallback={this.handleJoinGroup}
           />}
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  return {
    userId: state.getIn(['user','userId']),
    courseId: props.match.params.id,
    roleId: state.getIn(['user', 'role', 'roleId']),
    roleType: state.getIn(['user', 'role', 'roleType']),
    myGroupList: state.getIn(['group', 'myGroupList']),
    allGroupList: state.getIn(['group', 'allGroupList']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getGroupList: bindActionCreators(getGroupList, dispatch),
    createGroup: bindActionCreators(createGroup, dispatch),
    applyToJoin: bindActionCreators(applyToJoin, dispatch),
    deleteGroup: bindActionCreators(deleteGroup, dispatch),
    exitGroup: bindActionCreators(exitGroup, dispatch),
    getMyCourse: bindActionCreators(getMyCourse, dispatch),
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(GroupContainer)
