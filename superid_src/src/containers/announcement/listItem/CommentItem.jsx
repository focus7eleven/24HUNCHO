import React from 'react'
import emojione from 'emojione'
import moment from 'moment'
import styles from './CommentItem.scss'

import { DeleteIcon } from '../../../public/svg'
import CommentInput from '../../../components/input/CommentInput'


const CommentItem = React.createClass({
  getInitialState(){
    return {
      editMode: false,
    }
  },
  getDefaultProps(){
    return {
      role: null,
      content: '',
      createTime: '',
      toRole: null,
      optRoleId: null,
      canComment: false,
      isOfficial: false, // 操作者是不是官方
    }
  },

  //回复评论，参数value
  handleReply(value, toRoleId, onSucceed){
    const { role } = this.props
    this.props.onReply(value, toRoleId || role.get('roleId'), onSucceed)
    this.setState({
      editMode: false,
    })
  },
  //删除评论
  deleteComment(){
    const { id, onDelete } = this.props
    onDelete(id)
  },

  render(){
    const { editMode } = this.state
    const { role, toRole, content, createTime, permission } = this.props

    return (
      <div className={styles.commentContainer} onMouseOver={this.onMouseOver} onMouseOut={this.onMouseOut}>
        <div className={styles.avatar}>
          <img src={role.get('avatar')}/>
        </div>
        <div className={styles.right}>
          <div className={styles.content}>
            <a href="#">{role.get('roleTitle')}-{role.get('username')}</a>
            {toRole &&
              <span className={styles.replyContent}>
                {' 回复 '}<a href="#">@{toRole.get('roleTitle')}-{toRole.get('username')}</a>
              </span>
            }：
            <span>{emojione.shortnameToUnicode(content)}</span>
            <div className={styles.time}>
              {moment(createTime).format('YYYY年MM月DD日 hh:mm')}
            </div>
            <div className={styles.actionGroup}>
              {permission.some((v) => v == 512) && !editMode &&
                <div className={styles.reply} onClick={() => this.setState({ editMode: true })}>
                  回复
                </div>
              }
              {permission.some((v) => v == 513) && !editMode &&
              <div className={styles.delete} onClick={this.deleteComment}>
                <DeleteIcon/>
              </div>
              }
            </div>
          </div>
          {editMode &&
          <CommentInput onBlur={() => this.setState({ editMode: false })} placeholder={`回复${role.get('roleTitle')}-${role.get('username')}`} btnText="回复" onSubmit={this.handleReply}/>
          }
        </div>
      </div>
    )
  }
})


export default CommentItem
