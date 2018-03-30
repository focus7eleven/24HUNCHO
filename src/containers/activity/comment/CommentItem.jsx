import React from 'react'
import ReactDom from 'react-dom'
import moment from 'moment'
import { Tooltip } from 'antd'
import emojione from 'emojione'
import { DeleteIcon, UploadIcon } from 'svg'
import styles from './CommentItem.scss'
import CommentInput from '../../../components/input/CommentInput'

class CommentItem extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      editMode: false,
      hover: false,
    }
    this.onMouseOver = this.onMouseOver.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
  }

  componentDidMount() {
    document.addEventListener('click', this.onClick, false)
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onClick, false)
  }

  // 问题：不知道为什么把监听加到document上的时候，子元素的stopPropagation函数不起作用
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


  onMouseOver = (e) => {
    this.setState({
      hover: true,
    })
  }

  onMouseLeave = (e) => {
    this.setState({
      hover: false,
    })
  }

  handleReply = (value) => {

    this.props.onReply(value, this.props.comment.get('role').get('id'), () => {
      this.setState({
        editMode: false
      })
    })

  }

  deleteComment = (e) => {
    e.stopPropagation()
    this.props.onDelete(this.props.comment.get('id'))
  }

  toTop = (e) => {
    e.stopPropagation()
    this.props.toTop(this.props.comment.get('id'))
  }

  render() {
    const { editMode, hover } = this.state
    const {
      comment,
    } = this.props

    const id = comment.get('id')
    const role = comment.get('role')
    const toRole = comment.get('toRole')
    const createTime = comment.get('time')
    const content = comment.get('content')

    return (
      <div className={styles.commentContainer} onMouseLeave={this.onMouseLeave} onMouseOver={this.onMouseOver}>
        <div className={styles.avatar}>
          {
            role.get('avatar') ?
            <img src={role.get('avatar')} />
            :
            <span className={styles.defaultAvatar} />
          }
        </div>
        <div className={styles.right}>
          <div className={styles.content}>
            <a href="#">{role.get('title')}-{role.get('realName')}</a>
            {toRole &&
              <span className={styles.replyContent}>
                {' 回复 '}<a href="#">@{toRole.get('title')}-{toRole.get('realName')}</a>
              </span>
            }：
            <span>{emojione.shortnameToUnicode(content)}</span>
            <div className={styles.time}>
              {moment(createTime).format('YYYY年MM月DD日 hh:mm')}
              {/* {createTime} */}
            </div>
            <div className={styles.actionGroup}>
              {!editMode &&
              <div className={hover ? styles.showDelete : styles.delete} onClick={this.deleteComment}>
                <DeleteIcon />
              </div>
              }
              {!editMode &&
                <Tooltip title="置顶">
                  <div className={ hover ? styles.showToTop : styles.toTop } onClick={this.toTop}>
                    <UploadIcon />
                  </div>
                </Tooltip>
              }
              {!editMode &&
                <div className={styles.reply} ref={ el => this.replyBtn=el }>
                  回复
                </div>
              }
            </div>
          </div>
          {editMode &&
            <div className={styles.replyContainer} ref={ el => this.replyContainer=el } onClick={this.onClickReply}>
              <CommentInput placeholder={`回复${role.get('title')}-${role.get('realName')}`} btnText="回复" onSubmit={this.handleReply} />
            </div>
          }
        </div>
      </div>
    )
  }
}

export default CommentItem
