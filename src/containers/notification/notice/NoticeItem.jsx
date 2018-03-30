/* eslint-disable indent,object-curly-spacing */
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { bindActionCreators } from 'redux'
import { List, Map, fromJS } from 'immutable'
import { Button, Popover, notification } from 'antd'
import { TaskAround, DropDownIcon } from 'svg'
import { notificationTime } from 'time'
import styles from './NoticeItem.scss'

import ApplyRefuseModal from './modal/ApplyRefuseModal'

import {
  readOne,
  flushNotificationList,
  READ_STATE,
  MSG_TYPE,
  RESOURCE_TYPE,
} from '../../../actions/notification'
import  {
  inviteStudents,
  rejectStudent,
} from '../../../actions/role'
import {
  inviteMembers
} from '../../../actions/group'
import { AFFAIR_TYPE } from '../../header/HeaderContainer'

class NoticeItem extends React.Component{

  state = {
    courseId: null,
    groupId: null,
    affairType: AFFAIR_TYPE.COURSE,
    showRefuseModal: false,
    isAgreeing: false,
  }

  componentWillMount(){
    const role = this.props.role
    let courseId = null
    let groupId = null
    let affairType = role.get('mold')
    if (affairType == AFFAIR_TYPE.GROUP) {
      courseId = role.get('parentId')
      groupId = role.get('affairId')
    } else if (affairType == AFFAIR_TYPE.COURSE) {
      courseId = role.get('affairId')
    } else {
      // department 学院

    }
    this.setState({
      courseId: courseId,
      groupId: groupId,
      affairType,
    })
  }
  handleReadOne = () => {
    const roleId = this.props.role.get('roleId')
    let item = this.props.item
    // 如果消息被点击过，则不再调用标记为已读的接口
    if (item.get('readState') == READ_STATE.READ) {
      return
    }
    const messageId = item.get('noticeId')
    const senderRoleId = item.get('senderRoleId')

    //根据发送方或者接收方，构造对应的url和header
    // const callMessageServer = mode == MESSAGE_MODES[MESSAGE_MODE.SEND]
    this.props.readOne(messageId, senderRoleId).then((json) => {
      if (json.code == 0) {
        item = item.set('readFlush', true)
        this.props.updateNotificationList(roleId, [item])
      }
    })
  }

  handleAgreeApply = () => {
    const { affairType, courseId, groupId } = this.state
    const { role, item } = this.props
    this.setState({ isAgreeing: true,})
    const affairId = affairType == AFFAIR_TYPE.GROUP ? groupId : courseId
    const roleId = role.get('roleId')
    const roleIds = [item.get('senderRoleId')]
    let promise = null
    if (affairType == AFFAIR_TYPE.GROUP) {
      promise = this.props.inviteMembers(affairId, roleId, roleIds)
    } else if (affairType == AFFAIR_TYPE.COURSE) {
      promise = this.props.inviteStudents(affairId, roleId, roleIds)
    }

    promise.then(res => {
      if (res.code === 0) {
        const data = fromJS(res.data)
        let isSuccess = true
        data.forEach((v) => {
          if (v.get('code') !== 0) {
            notification['error']({
              message: v.get('errMsg')
            })
            isSuccess = false
          }
        })
        if (isSuccess) {
          notification['success']({
            message: '操作成功'
          })
          this.handleReadOne()
          this.handleReload()
        }
        this.setState({
          isAgreeing: false,
        })
      }
    })

  }

  handleReload = () => {
    this.props.handleReload()
  }

  handleRefuseApply = (value) => {
    const { affairType, courseId, groupId } = this.state
    const { role, item } = this.props
    const affairId = affairType === AFFAIR_TYPE.GROUP ? groupId : courseId
    const optRoleId = role.get('roleId')
    const roleId = item.get('senderRoleId')
    this.props.rejectStudent(affairId, optRoleId, roleId, value, affairType).then(res => {
      if (res.code === 0) {
        notification['success']({
          message: '已拒绝',
        })
        this.setState({
          showRefuseModal: false,
        })
        this.handleReadOne()
        this.handleReload()
      } else {
        notification['error']({
          message: '拒绝失败',
          description: res.data
        })
      }

    })
  }
  renderMessageText = (notice) => {
    const {
      courseId,
      groupId,
      affairType,
      showRefuseModal,
    } = this.state

    const urls = notice.get('urls').size == 0 ? fromJS([{
      begin: notice.get('content').length,
      end: notice.get('content').length,
      type: 0,
    }]) : notice.get('urls')


    return urls
      .reduce((reduction, v, k) => {
        const lastCursorPosition = reduction.get(reduction.size - 1) ? reduction.getIn([reduction.size - 1, 'end']) : 0
        if (v.get('begin') !== lastCursorPosition) {
          reduction = reduction.push(Map({
            begin: lastCursorPosition,
            end: v.get('begin'),
            type: 0,
          }))
        }

        reduction = reduction.push(v)

        if (k === notice.get('urls').size - 1 && v.get('end') !== notice.get('content').size) {
          reduction = reduction.push(Map({
            begin: v.get('end'),
            end: notice.get('content').size,
            type: 0,
          }))
        }
        return reduction
      }, List()).map((v, k) => {
        const content = notice.get('content')
        const affairId = notice.get('fromAffairId')
        const resourceType = notice.get('resourceType')
        switch (v.get('type')) {
        case 0:
          // 普通文字
          return <span key={k}>{content.slice(v.get('begin'), v.get('end'))}</span>
        case 1:
          // 用户
          return <a key={k}>{content.slice(v.get('begin'), v.get('end'))}</a>
        case 3:
          // 盟
          return <a key={k}>{content.slice(v.get('begin'), v.get('end'))}</a>
        case 4:
          // 事务
          return (
            <Link
              key={k}
              to={
                affairType == AFFAIR_TYPE.GROUP ?
                `/index/course/${courseId}/group/${groupId}/member`
                :
                affairType == AFFAIR_TYPE.COURSE ?
                `/index/course/${courseId}/info`
                :
                `/index/course/${v.get('id')}/info`
              }
              onClick={(e) => {
                e.stopPropagation()
                this.handleReadOne()
                this.props.handleContainerClose()
              }}
            >
              {content.slice(v.get('begin'), v.get('end'))}
            </Link>
          )
        case 8:
          // 发布
          return (
            <Link
              key={k}
              to={
                affairType == AFFAIR_TYPE.GROUP ?
                `/index/course/${courseId}/group/${groupId}/activity/${v.get('id')}`
                :
                `/index/course/${courseId}/activity/${v.get('id')}`
              }
              onClick={(e)=>{
                e.stopPropagation()
                this.handleReadOne()
                this.props.handleContainerClose()
              }}
            >
              {content.slice(v.get('begin'), v.get('end'))}
            </Link>
          )

        case 101:
          // tss 申请加入课程 立即处理
          return (
            <div
              key={k}
              className={styles.btnPanel}
            >
              <Button size="small" type="ghost" onClick={() => this.setState({ showRefuseModal: true })}>拒绝</Button>
              <Button size="small" type="primary" className={styles.agreeBtn} onClick={() => this.handleAgreeApply()} loading={this.state.isAgreeing}>同意</Button>
              { showRefuseModal &&
                <ApplyRefuseModal
                  cancelCallback={()=>this.setState({ showRefuseModal: false })}
                  submitCallback={this.handleRefuseApply}
                />
              }
            </div>
          )
        case 102:
          // tss 小组
          return (
            <div
              key={k}
              className={styles.btnPanel}
            >
              <Button size="small" type="ghost" onClick={() => this.setState({ showRefuseModal: true })}>拒绝</Button>
              <Button size="small" type="primary" className={styles.agreeBtn} onClick={() => this.handleAgreeApply()} loading={this.state.isAgreeing}>同意</Button>
              { showRefuseModal &&
                <ApplyRefuseModal
                  cancelCallback={()=>this.setState({ showRefuseModal: false })}
                  submitCallback={this.handleRefuseApply}
                />
              }
            </div>
          )

        default:
            return <span key={k}>{content.slice(v.get('begin'), v.get('end'))}</span>

        }
      })
  }
  render() {
    const notice = this.props.item
    // 如果是已读则变灰，如果是缓冲已读则需要判断是否是通知，通知的缓冲已读不变灰
    // const noticeDisabled = notice.get('readState') == READ_STATE.READ || (notice.get('readFlush') == true && notice.get('msgType') != MSG_TYPE.NOTICE)
    const noticeDisabled = notice.get('readState') == READ_STATE.READ || (notice.get('readState') == READ_STATE.UNREAD && notice.get('readFlush'))
    const time = notice.get('sendTime') == null ? notice.get('createTime') : notice.get('sendTime')

    return (
      <div className={styles.noticeItem}>
        <div className={noticeDisabled ? `${styles.mainItem} disabled` : styles.mainItem} >
          {this.props.hasIcon ? <TaskAround className={styles.taskIcon} /> : null}
          <div className={styles.noticeText}>
            {
              this.renderMessageText(notice)
            }

          </div>
          <div className={styles.time}>{notificationTime(time)}</div>
        </div>

      </div>
    )
  }
}

NoticeItem.propTypes = {
  item: PropTypes.object.isRequired,
  hasIcon: PropTypes.bool,
}

NoticeItem.defaultProps = {
  hasIcon: false,
}

NoticeItem.contextTyps = {
  router: PropTypes.object,
}

function mapStateToProps(state) {
  return {
    optRole: state.getIn(['user', 'role']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    readOne: bindActionCreators(readOne, dispatch),
    inviteStudents: bindActionCreators(inviteStudents, dispatch),
    rejectStudent: bindActionCreators(rejectStudent, dispatch),
    inviteMembers: bindActionCreators(inviteMembers, dispatch),
    flushNotificationList: bindActionCreators(flushNotificationList, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NoticeItem)
