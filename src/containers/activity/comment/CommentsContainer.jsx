import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fromJS, List } from 'immutable'
import { notification } from 'antd'
import styles from './CommentsContainer.scss'
import CommentInput from '../../../components/input/CommentInput'
import CommentItem from './CommentItem'
import {
  getComments,
  createComment,
  deleteComment,
} from '../../../actions/activity'

class CommentsContainer extends React.Component {
  state = {
    isLoading: true,
    commentList: List(),
  }

  componentWillMount() {
    this.fetchCommentList()
  }

  fetchCommentList = () => {
    const {
      getComments,
      role,
      affairId,
      activityId,
    } = this.props
    getComments(affairId, role.get('roleId'), activityId).then(res => {
      if (res.code === 0) {
        this.setState({
          commentList: fromJS(res.data),
        })
      }
    })
  }

  onCreate = (value, toRoleId = null, onSucceed) => {
    const {
      createComment,
      role,
      affairId,
      activityId,
    } = this.props
    const formObj = {
      activityId: activityId,
      toRoleId: toRoleId || 0,
      value: value
    }
    const formData = new FormData()
    formData.append('activityId', activityId)
    formData.append('toRoleId', toRoleId || 0)
    formData.append('content', value)
    createComment(affairId, role.get('roleId'), formData).then(res => {
      if (res.code === 0) {
        this.fetchCommentList()
        onSucceed && onSucceed()
      }
    })
  }

  onDelete = (id) => {
    const {
      deleteComment,
      role,
      affairId,
      activityId,
    } = this.props
    deleteComment(affairId, role.get('roleId'), activityId, id).then(res => {
      if (res.code === 0) {
        this.fetchCommentList()
        notification['success']({
          message: '删除成功'
        })
      } else {
        notification['error']({
          message: '删除失败',
          description: res.data,
        })
      }
    })
  }

  toTop = (id) => {
    console.log('to top', id)
  }

  render() {
    const { commentList } = this.state
    return (
      <div className={styles.container}>
        <CommentInput placeholder="请输入评论" btnText="发表" onSubmit={this.onCreate}/>
        <div className={styles.listContainer}>
          {commentList.map((v) => {
            // console.log(v)
            return (
              <CommentItem
                key={v.get('id')}
                comment={v}
                onReply={ this.onCreate }
                onDelete={ this.onDelete}
                toTop = { this.toTop }
              />
            )
          })}
        </div>
      </div>
    )
  }
}

CommentsContainer.defaultProps = {
  commentList: fromJS([
    {
      id: 1001,
      role: {
        avatar: '',
        username: '张文玘',
        roleTitle: '前端开发'
      },
      toRole: {
        avatar: '',
        username: '周颖婷',
        roleTitle: '安卓需求'
      },
      createTime: '2017年12月25日',
      content: '老师的克己复礼口味'
    }
  ])
}

function mapStateToProps(state) {
  return {
    role: state.getIn(['user','role']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getComments: bindActionCreators(getComments, dispatch),
    createComment: bindActionCreators(createComment, dispatch),
    deleteComment: bindActionCreators(deleteComment, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CommentsContainer)
