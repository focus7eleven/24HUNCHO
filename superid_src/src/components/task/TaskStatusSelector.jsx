import React, { PropTypes } from 'react'
import styles from './TaskStatusSelector.scss'

export const TASK_STATUS = [{
  name: '待开始',
  color: '#ca90e7',
}, {
  name: '进行中',
  color: '#926dea',
}, {
  name: '已完成',
  color: '#55cce9',
}, {
  name: '已取消',
  color: '#cccccc',
}]

const TaskStatusSelector = React.createClass({
  propTypes: {
    status: PropTypes.oneOf(TASK_STATUS).isRequired,
  },

  render() {
    const {
      name,
      color,
    } = this.props.status

    return (
      <div className={styles.container}>
        <div className={styles.dot} style={{ backgroundColor: color }} />
        <div>{name}</div>
      </div>
    )
  }
})

export default TaskStatusSelector
