import React from 'react'
import { Button } from 'antd'
import { fromJS } from 'immutable'
import styles from './TaskDetailHeader.scss'
import config from '../../config'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { pushURL } from 'actions/route'

const TaskDetailHeader = React.createClass({
  componentDidMount() {
    this.fetchTaskDetailInformation(this.props)
  },
  componentWillReceiveProps(nextProps) {
    if (!this.props.affair && nextProps.affair) {
      this.fetchTaskDetailInformation(nextProps)
    }
  },
  getInitialState() {
    return {
      task: null,
    }
  },

  fetchTaskDetailInformation(props) {
    if (!props.affair) return null

    fetch(config.api.task.get(props.params.taskId), {
      method: 'GET',
      credentials: 'include',
      json: true,
      affairId: props.affair.get('id'),
      roleId: props.affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code == 0) {
        const data = res.data

        this.setState({
          task: fromJS(data),
        })
      }
    })
  },

  render() {
    const {
      affair,
    } = this.props
    const {
      task,
    } = this.state

    if (!affair || !task) return null

    return (
      <div className={styles.container}>
        {/*左侧导航*/}
        <div>
          <span className={styles.link} onClick={() => this.props.pushURL(`/workspace/affair/${affair.get('id')}`)}>{affair.get('name')}</span>
          <span className={styles.connector}> > </span>
          <span className={styles.link} onClick={() => this.props.pushURL(`/workspace/affair/${affair.get('id')}/task`)}>任务</span>
          <span className={styles.connector}> > </span>
          <span>{task.get('name')}</span>
        </div>

        {/*右侧功能性按钮*/}
        <div className={styles.buttonGroup}>
          <Button type="ghost">发布</Button>
          <Button type="ghost">角色/成员</Button>
          <Button type="ghost">库</Button>
          <Button type="ghost">会话</Button>
          <Button type="ghost">文件</Button>
        </div>
      </div>
    )
  }
})

export default connect(null, (dispatch) => ({ pushURL: bindActionCreators(pushURL, dispatch) }))(TaskDetailHeader)
