import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import emojione from 'emojione'
import { DeleteIcon } from 'svg'
import CommentInput from 'components/input/CommentInput'
import styles from './CommentItem.scss'

class CommentItem extends React.Component {
  state = {
    editMode: false,
  }

  componentDidMount() {
    document.addEventListener('click', this.onClick, false)
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onClick, false)
  }

  onClick = (e) => {
    // 如果点击的是replyBtn，或 处于回复状态且点击的对象data-index属性为emoji（当前设置为表情panel） 则显示回复的输入框
    if ((this.replyBtn && this.replyBtn.contains(e.target)) || (e.target.getAttribute('data-index') == 'emoji' && this.replyContainer)){
      this.setState({
        editMode: true
      })
    } else if (this.replyContainer && !this.replyContainer.contains(e.target)) {
      // 如果此时回复的输入框存在，且点击的是回复输入框之外的区域，则取消回复
      this.setState({
        editMode: false,
      })
    }
  }

  handleReply = (value, toRoleId, onSucceed) => {
    const { comment } = this.props
    const role = comment.get('role')

    this.props.onReply(value, toRoleId || role.get('roleId'), onSucceed)
    this.setState({
      editMode: false,
    })
  }

  deleteComment(){
    this.props.onDelete(this.props.comment.get('id'))
  }


  render() {
    const { editMode } = this.state
    const { comment, permission } = this.props

    const role = comment.get('role')
    const toRole = comment.get('toRole')
    const createTime = comment.get('createTime')
    const content = comment.get('content')

    return (
      <div className={styles.commentContainer}>
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
                <div className={styles.reply}  ref={ el => this.replyBtn=el }>
                  回复
                </div>
              }
              {permission.some((v) => v == 513) && !editMode &&
              <div className={styles.delete} onClick={() => this.deleteComment()}>
                <DeleteIcon/>
              </div>
              }
            </div>
          </div>
          {editMode &&
            <div className={styles.replyContainer} ref={ el => this.replyContainer = el} >
              <CommentInput placeholder={`回复${role.get('roleTitle')}-${role.get('username')}`} btnText="回复" onSubmit={this.handleReply}/>
            </div>
          }
        </div>
      </div>
    )
  }
}

CommentItem.PropTypes = {
  comment: PropTypes.object.isRequired,
  permission: PropTypes.object.isRequired,
  onReply: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}

export default CommentItem
