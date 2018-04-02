import React, { PropTypes } from 'react'
import { Input, Button, message } from 'antd'
import { fromJS, Map } from 'immutable'
import moment from 'moment'
import styles from './AnnouncementComments.scss'
import config from '../../config'

const AnnouncementComments = React.createClass({
  propTypes: {
    affair: PropTypes.object.isRequired,
    announcementId: PropTypes.number.isRequired,
  },
  getInitialState() {
    return {
      affairComment: '', // 当前用户对发布输入的评论。
      currentEditingComment: Map(), // 用户正在对这条评论进行回复。
      comments: fromJS([]),
    }
  },
  componentDidMount() {
    const {
      affair,
      announcementId,
    } = this.props

    // 获取评论列表
    fetch(config.api.announcement.comments.get(announcementId), {
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.setState({
          comments: fromJS(res.data),
        })
      }
    })
  },

  handleResponseToAnnouncement() {
    const {
      affair,
      announcementId,
    } = this.props
    if (this.state.affairComment == ''){
      message.warning('回复内容不能为空')
      return
    }
    // 新增评论
    fetch(config.api.announcement.comments.post, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcementId,
      body: JSON.stringify({
        allianceId: affair.get('allianceId'),
        announcementId: announcementId,
        content: this.state.affairComment,
        roleId: affair.get('roleId'),
      }),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        res.data.toRole = null
        this.setState({
          affairComment: '',
          comments: this.state.comments.unshift(fromJS(res.data)),
        })
      }
      else {
        message.error('链接错误')
      }
    })
  },
  // 打开与关闭对某个评论的评论操作界面。
  handleToggleCommentPanel(commentId) {
    if (this.state.currentEditingComment.has(commentId)) {
      this.setState({
        currentEditingComment: this.state.currentEditingComment.delete(commentId),
      })
    } else {
      this.setState({
        currentEditingComment: this.state.currentEditingComment.set(commentId, Map({
          content: '',
        })),
      })
    }
  },

  handleResponseToRole(commentId) {
    // 在公告中回复某个人
    const {
      affair,
      announcementId,
    } = this.props
    const comment = this.state.comments.find((comment) => comment.get('id') === commentId)
    if (comment == ''){
      message.warning('回复内容不能为空')
      return
    }

    // 新增评论
    fetch(config.api.announcement.comments.post, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcementId,
      body: JSON.stringify({
        allianceId: affair.get('allianceId'),
        announcementId: announcementId,
        content: this.state.currentEditingComment.getIn([commentId, 'content'], ''),
        roleId: affair.get('roleId'),
        toRoleId: comment.getIn(['role', 'roleId']),
      }),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.setState({
          affairComment: '',
          comments: this.state.comments.unshift(fromJS(res.data)),
          currentEditingComment: this.state.currentEditingComment.delete(commentId),
        })
      }
      else {
        message.error('链接错误')
      }
    })
  },

  renderCommentInput() {
    return (
      <div className={styles.commentInput}>
        <Input value={this.state.affairComment} onChange={(evt) => this.setState({ affairComment: evt.target.value })} placeholder="回复发布" />
        <Button type="primary" onClick={this.handleResponseToAnnouncement}>回复</Button>
      </div>
    )
  },
  renderReCommentInput(comment) {
    const commentId = comment.get('id')

    return (
      <div className={styles.commentInput}>
        <Input
          value={this.state.currentEditingComment.getIn([commentId, 'content'])}
          onChange={(evt) =>
            this.setState({
              currentEditingComment: this.state.currentEditingComment
                .setIn([commentId, 'content'], evt.target.value)
            })
          }
          placeholder={`回复：${comment.getIn(['role', 'roleTitle'])}－${comment.getIn(['role', 'username'])}`}
        />
        <Button type="primary" onClick={() => this.handleResponseToRole(commentId)}>回复</Button>
      </div>
    )
  },
  renderCommentList() {
    return (
      <div className={styles.commentList}>
        {
          this.state.comments.map((comment, key) => (
            <div className={styles.comment} key={key}>
              {/* 评论人头像 */}
              <img src={comment.getIn(['role', 'avatar'])} />

              <div className={styles.commentMain}>
                {/* 评论的内容 */}
                <div>
                  <span className={styles.link}>
                    {
                      `${comment.getIn(['role', 'roleTitle'])}－${comment.getIn(['role', 'username'])}：`
                    }
                  </span>
                  {comment.get('toRole') ? <span>回复<span className={styles.link}>{`${comment.getIn(['toRole', 'roleTitle'])}－${comment.getIn(['toRole', 'username'])} `}</span></span> : ''}
                  {`${comment.get('content')}`}
                </div>

                {/* 时间信息 */}
                <div className={styles.commentTimestamp}>
                  <div>{moment(comment.get('createTime')).format('YYYY年MM月DD日 HH:mm')}</div>
                  <div style={{ cursor: 'pointer' }} onClick={this.handleToggleCommentPanel.bind(this, comment.get('id'))}>
                    { this.state.currentEditingComment.has(comment.get('id')) ? '收起' : '回复' }
                  </div>
                </div>
                { this.state.currentEditingComment.has(comment.get('id')) ? this.renderReCommentInput(comment) : null}
              </div>
            </div>
          ))
        }
      </div>
    )
  },
  render() {
    return (
      <div className={styles.container}>
        {this.renderCommentInput()}
        {this.renderCommentList()}
      </div>
    )
  }
})

export default AnnouncementComments
