
import React, { PropTypes } from 'react'
import { List, Map, fromJS } from 'immutable'
import config from '../../config'
import { TaskAround, DropDownIcon } from 'svg'
import { notificationTime } from 'time'
import styles from './NoticeItem.scss'

import NoticeModal from './NoticeModal'

import { enterConference } from '../../actions/conference'
import { pushPermittedURL } from 'actions/route'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { READ_STATE, MSG_TYPE, MESSAGE_MODES, MESSAGE_MODE } from '../../actions/notification'

const NoticeItem = React.createClass({
  propTypes: {
    item: PropTypes.object.isRequired,
    hasIcon: PropTypes.bool,
  },
  contextTypes: {
    router: React.PropTypes.object,
  },
  getDefaultProps() {
    return {
      hasIcon: false,
    }
  },
  getInitialState() {
    return {
      showChildren: false,
    }
  },
  handleShowChildren(){
    const notice = this.props.item
    const { showChildren } = this.state
    this.handleReadOne()
    // 如果是可以展开的消息则展开或收缩，并尝试标记为已读
    if (notice.get('details') != null) {
      this.setState({ showChildren: !showChildren })
    }
  },
  handleReadOne(){
    const roleId = this.props.roleId
    const mode = this.props.mode
    let item = this.props.item
    // 如果消息被点击过，则不再调用标记为已读的接口
    if (item.get('readFlush') || item.get('readState') == READ_STATE.READ) {
      return
    }
    const messageId = item.get('noticeId')
    const senderRoleId = item.get('senderRoleId')

    //根据发送方或者接收方，构造对应的url和header
    const callMessageServer = mode == MESSAGE_MODES[MESSAGE_MODE.SEND]
    let url = callMessageServer ? config.api.message.sender.readOne(messageId) : config.api.message.receiverReadOne(messageId, senderRoleId)
    const method = callMessageServer ? 'PUT' : 'POST'
    let header = {
      method: method,
      json: true,
    }
    if (!callMessageServer) {
      header['credentials'] = 'include'
    }
    if (mode == MESSAGE_MODES[MESSAGE_MODE.RECEIVE] && item.get('msgType') == MSG_TYPE.AUDIT) {
      url = config.api.message.readOne(messageId)
    }
    fetch(url, header)
      .then((res) => (res.json()))
      .then((json) => {
        if (json.code == 0) {
          item = item
          .set('readFlush', true)
          .update('details', (details) => (details ? details.map((detail) => (detail.set('readFlush', true))) : null ))
          this.props.updateNotificationList(roleId, mode, [item])
        }
      })
  },
  renderMessageText(notice) {

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
              <a
                key={k}
                onClick={() => {
                  this.props.pushPermittedURL(v.get('id'), 0, `/workspace/affair/${v.get('id')}`)
                  this.props.handleContainerClose()
                }}
              >
                {content.slice(v.get('begin'), v.get('end'))}
              </a>
            )
          case 8:
          // 发布
            return (
              <a
                key={k}
                onClick={() => {
                  this.props.pushPermittedURL(notice.get('fromAffairId'), 0, `/workspace/affair/${notice.get('fromAffairId')}/announcement/inner/detail/${notice.get('resourceId')}`)
                  this.props.handleContainerClose()
                }}
              >
                {content.slice(v.get('begin'), v.get('end'))}
              </a>
            )
          case 900:
            // 视频会议
            return (
              <a
                key={k}
                onClick={(e) => {
                  this.props.pushPermittedURL(`/workspace/affair/${notice.get('fromAffairId')}`)
                  this.props.enterConference(v.get('id'), this.props.roleId)
                  this.handleReadOne()
                  e.stopPropagation()
                }}
              >
                {content.slice(v.get('begin'), v.get('end'))}
              </a>
            )
          /* 接下来全是立即处理-模态框套路 */
          default:
            return (
              <a
                key={k}
                onClick={(e) => {
                  this.setState({ handleMessage: notice })
                  this.handleReadOne()
                  e.stopPropagation()
                }}
              >
                {content.slice(v.get('begin'), v.get('end'))}
              </a>
            )
        }
      })
  },
  render() {
    const { showChildren } = this.state
    const notice = this.props.item
    // 如果是已读则变灰，如果是缓冲已读则需要判断是否是通知，通知的缓冲已读不变灰
    const noticeDisabled = notice.get('readState') == READ_STATE.READ || (notice.get('readFlush') == true && notice.get('msgType') != MSG_TYPE.NOTICE)
    const time = notice.get('sendTime') == null ? notice.get('createTime') : notice.get('sendTime')
    return (
      <div className={styles.noticeItem}>
        <div className={noticeDisabled ? `${styles.mainItem} disabled` : styles.mainItem} onClick={this.handleShowChildren}>
          {this.props.hasIcon ? <TaskAround className={styles.taskIcon} /> : null}
          <div className={styles.noticeText}>
            {
              this.renderMessageText(notice)
            }
            {(notice.get('details') != null && notice.get('details', List()).size != 0) && (
              showChildren ? (
                <DropDownIcon className={styles.dropDownIcon} style={{ transform: 'rotate(-180deg)' }} />
              ) : (
                <DropDownIcon className={styles.dropDownIcon} style={{ transform: 'rotate(0deg)' }} />
              ))}
          </div>
          <div className={styles.time}>{notificationTime(time)}</div>
        </div>
        {(notice.get('details') != null && showChildren) &&
          notice.get('details').map((detail) => {
            const subItemDisabled = detail.get('readState') != READ_STATE.UNREAD || detail.get('readFlush', false)
            return (
              <div className={subItemDisabled ? `${styles.subItem} disabled` : styles.subItem} key={detail.get('noticeId')}>
                <NoticeItem
                  key={detail.get('noticeId')}
                  item={notice.merge(detail).set('details', List())}
                  roleId={this.props.roleId}
                  mode={this.props.mode}
                  handleContainerClose={() => {this.handleContainerClose()}}
                  updateNotificationList={(roleId, mode, data) => {this.props.updateNotificationList(roleId, mode, data)}}
                />
              </div>
            )
          })
        }
        {this.state.handleMessage &&
          <NoticeModal
            message={notice}
            onHide={() => this.setState({ handleMessage: false })}
          />
        }
      </div>
    )
  },
})

export default connect(null, (dispatch) => {
  return {
    enterConference: bindActionCreators(enterConference, dispatch),
    pushPermittedURL: bindActionCreators(pushPermittedURL, dispatch)
  }
})(NoticeItem)
