import React from 'react'
import PropTypes from 'prop-types'
import { fromJS, List } from 'immutable'
import { Select, message, } from 'antd'
import config from 'config'
import urlFormat from 'urlFormat'
import messageHandler from 'messageHandler'
import CommentInput from 'components/input/CommentInput'
import DynamicScrollPane from 'components/scrollpane/DynamicScrollPane'

import { OPT_ROLE } from '../constant/AnnouncementConstants'
import CommentItem from './CommentItem'
import styles from './CommentContainer.scss'


const COMMENT_PERMIT = {
  OPEN: 0,
  HALF: 1,
  CLOSE: 2,
}

const COMMENT_PERMITS = [
  { state: COMMENT_PERMIT.OPEN, text: '开放' },
  { state: COMMENT_PERMIT.HALF, text: '仅官/客方开放' },
  { state: COMMENT_PERMIT.CLOSE, text: '关闭' }
]

const Option = Select.Option
class CommentContainer extends React.Component {
  state = {
    commentList: List(),
    commentPublicType: this.props.commentPublicType,
  }
  componentWillMount() {
    this.fetchCommentList()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.announcement.get('announcementId') != this.props.announcement.get('announcementId')) {
      this.fetchCommentList(nextProps)
    }
  }

  fetchCommentList = (props = this.props) => {
    const { affair, announcement } = props
    fetch(config.api.announcement.detail.comments.get(announcement.get('announcementId')), {
      method: 'GET',
      affairId: affair.get('id'),
      roleId: affair.get('roleId')
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0){
        const value = fromJS(json.data)

        this.setState({
          commentList: value,
        })
        return value
      }
    })
  }

  /*
  * 创建评论
  * @param value:string 评论内容
  * @param toRoleId:string|number|null 如果是回复发布，回复对象的角色id
  * @param onSucceed:function 创建成功的回调函数，需要通知对应组件创建成功
  */
  onCreateComment = (value, toRoleId = null, onSucceed) => {
    const { affair, announcement } = this.props

    fetch(config.api.announcement.detail.comments.post, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcement.get('announcementId'),
      body: JSON.stringify({
        allianceId: affair.get('allianceId'),
        announcementId: announcement.get('announcementId'),
        content: value,
        roleId: affair.get('roleId'),
        toRoleId: toRoleId
      })
    }).then((res) => res.json())
      .then(messageHandler)
      .then((json) => {
        if (json.code === 0){
          this.fetchCommentList()
          onSucceed && onSucceed()
        } else {
          message.error(json.code)
        }
      })
  }

  onDeleteComment = (commentId) => {
    const { affair, announcement } = this.props
    fetch(config.api.announcement.detail.comments.delete(commentId, announcement.get('announcementId')), {
      method: 'POST',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcement.get('announcementId'),
    }).then((res) => res.json())
      .then(messageHandler)
      .then((json) => {
        if (json.code === 0){
        //界面上应该在删除之后重新调用fetch操作获取全部列表
          // const commentList = this.state.commentList.filter((v) => {
          //   return v.get('id') !== commentId
          // })
          // this.setState({
          //   commentList
          // })
          this.fetchCommentList()
        } else {
          message.error(json.data)
        }
      })
  }

  changeCommentPublicType = (value) => {
    const { affair, announcement } = this.props
    const type = value * 1

    fetch(urlFormat(config.api.announcement.detail.comments.modifyPublic, {
      announcementId: announcement.get('announcementId'),
      commentPublicType: type,
    }), {
      method: 'POST',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcement.get('announcementId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          commentPublicType: value + '',
        })
        message.success('修改已保存')
      }
    })
  }

  render() {
    const { commentList } = this.state
    const {
      announcement,
      commentPublicType,
    } = this.props

    // const ifComment = announcement.get('permission').some((v) => v == 512)
    const ifComment = this.state.commentPublicType == 0 || (this.state.commentPublicType == 1 && (announcement.get('memberType') == OPT_ROLE.OFFICIAL || announcement.get('memberType') == OPT_ROLE.GUEST))
    return (
      <div className={styles.container}>
        <div className={styles.cmtTitle}>
          <div style={{ lineHeight: 28 }}>评论列表：</div>
          <div className={styles.cmtPermission}>
            评论功能：
            {announcement.get('memberType') == OPT_ROLE.OFFICIAL ?
              <Select
                className={styles.select}
                dropdownMatchSelectWidth={false}
                onChange={this.changeCommentPublicType}
                value={commentPublicType + ''}
              >
                {COMMENT_PERMITS.map((v, k) => {
                  return <Option value={v.state + ''} key={k}>{v.text}</Option>
                })}
              </Select>
              :
              <span>{COMMENT_PERMITS[commentPublicType].text}</span>
            }
          </div>
        </div>
        {ifComment &&
          <CommentInput placeholder="回复评论" btnText="发表" onSubmit={this.onCreateComment}/>
        }
        <DynamicScrollPane onLoad={() => {}} isLoading={false} hasMore={false} wrapClassName={`${styles.scrollPane} ${styles.commentScrollPane}`}>
          {commentList.map((v, k) => {
            return (
              <CommentItem
                key={k}
                comment={v}
                permission={announcement.get('permission')}
                onReply={this.onCreateComment}
                onDelete={this.onDeleteComment}
              />
            )
          })}
        </DynamicScrollPane>
      </div>
    )
  }
}

CommentContainer.PropTypes = {
  affair: PropTypes.object.isRequired,
  announcement: PropTypes.object.isRequired,
  commentPublicType: PropTypes.number.isRequired,
}

export default CommentContainer
