import React, { PropTypes } from 'react'
import { fromJS, List } from 'immutable'
import { Dehaze, TaskAnnouncement } from 'svg'
import { Tooltip } from 'antd'
import classNames from 'classnames'
import moment from 'moment'
import styles from './Timeline.scss'
import config from '../../config'
import PublishTaskModal from './PublishTaskModal'

const DATEFORMAT_MAP = {
  DAY_TIMELINE: 'H:mm',
  MONTH_TIMELINE: 'M.D',
  WEEK_TIMELINE: 'M.D',
  QUATER_TIMELINE: 'M.D',
  YEAR_TIMELINE: 'M月',
}
const DAY_TIMELINE = 'DAY_TIMELINE'
const WEEK_TIMELINE = 'WEEK_TIMELINE'
const MONTH_TIMELINE = 'MONTH_TIMELINE'
const QUATER_TIMELINE = 'QUATER_TIMELINE'
const YEAR_TIMELINE = 'YEAR_TIMELINE'
const MIN_RANGE_RADIO = 0.05

const DEFAULT_TOTAL_RANGE = List([
  moment(Date.now() - 43200000),
  moment(Date.now() + 43200000),
])

const TimeLine = React.createClass({
  propTypes: {
    affair: PropTypes.object.isRequired,
    taskId: PropTypes.string.isRequired,
  },

  componentDidMount() {
    window.addEventListener('mousedown', this.handleMouseDown)
    window.addEventListener('mousemove', this.handleMouseMove)
    window.addEventListener('mouseup', this.handleMouseUp)

    this.fetchPublishes()
  },
  componentWillUnmount() {
    window.removeEventListener('mousedown', this.handleMouseDown)
    window.removeEventListener('mousemove', this.handleMouseMove)
    window.removeEventListener('mouseup', this.handleMouseUp)
  },

  fetchPublishes() {
    fetch(config.api.task.publishes.get(this.props.taskId), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const tasks = fromJS(res.data.map((v) => ({
          id: v.id,
          startTime: v.effectiveTime,
          endTime: v.failureTime || v.effectiveTime,
          name: v.title,
          hasEndTime: !!v.failureTime,
        })))

        // 初始设置显示范围为任务跨度范围的一半
        // const startTask = tasks.max((a, b) => b.get('startTime') - a.get('startTime'))
        // const endTask = tasks.max((a, b) => a.get('endTime') - b.get('endTime'))

        this.setState({
          tasks,
        }, () => {
          const totalRange = this.getTotalRange()
          const delta = totalRange.get(1) - totalRange.get(0)

          this.setState({
            range: List([
              moment(Math.max(totalRange.get(0), Date.now() - delta * 0.1)),
              moment(Math.min(totalRange.get(1), Date.now() + delta * 0.1)),
            ]),
          })
        })
      }
    })
  },
  getInitialState() {
    return {
      tasks: List(),
      range: DEFAULT_TOTAL_RANGE,
      showPublishModal: false,
      selectedPublish: null,
    }
  },
  getTotalRange() {
    const startTask = this.state.tasks.max((a, b) => b.get('startTime') - a.get('startTime'))
    const endTask = this.state.tasks.max((a, b) => a.get('endTime') - b.get('endTime'))

    if (startTask && endTask) {
      const startTime = Math.min(Date.now(), startTask.get('startTime'))
      const endTime = Math.max(endTask.get('endTime'), Date.now())
      const duration = endTime - startTime

      // 最小的显示范围为24小时
      if (duration > 86400000) {
        return List([
          moment(startTime - 0.1 * duration),
          moment(endTime + 0.1 * duration),
        ])
      } else {
        return DEFAULT_TOTAL_RANGE
      }
    } else {
      // 空任务列表
      return DEFAULT_TOTAL_RANGE
    }
  },
  // 根据所选的视角类型，判断每个刻度线所表示的时刻。
  getCalibrations() {
    const rangeInMillicond = this.state.range.get(1) - this.state.range.get(0)
    let calibrations = []
    let type

    if (rangeInMillicond < 86400000) {
      // 使用日视图
      type = DAY_TIMELINE
      let t = this.state.range.get(0).clone().startOf('hour')
      while (t < this.state.range.get(1)) {
        calibrations.push(t.clone())
        t = t.add(1, 'hours')
      }
    } else if (rangeInMillicond < 2678400000) {
      // 使用月视图
      type = rangeInMillicond < 604800000 ? WEEK_TIMELINE : MONTH_TIMELINE
      let t = this.state.range.get(0).clone().startOf('day')
      while (t < this.state.range.get(1)) {
        calibrations.push(t.clone())
        t = t.add(1, 'days')
      }
    } else if (rangeInMillicond < 7776000000) {
      // 使用季视图
      type = QUATER_TIMELINE
      let t = this.state.range.get(0).clone().startOf('day')
      while (t < this.state.range.get(1)) {
        calibrations.push(t.clone())
        t = t.add(1, 'days')
      }
      calibrations = calibrations.filter((v) => !(v.days() % 7))
    } else {
      // 使用年视图
      type = YEAR_TIMELINE
      let t = this.state.range.get(0).clone().startOf('month')
      while (t < this.state.range.get(1)) {
        calibrations.push(t.clone())
        t = t.add(1, 'months')
      }
    }

    return {
      type,
      calibrations,
    }
  },

  handleMouseDown(evt) {
    if (evt.target === this.refs.handleLeft) {
      this._draggingLeftHandle = true
    }
    if (evt.target === this.refs.handleRight) {
      this._draggingRightHandle = true
    }
    if (evt.target === this.refs.handle || evt.target.tagName === 'svg') {
      this._draggingHandle = true
    }

    if (evt.target === this.refs.changeStartTime) {
      this._changingStartTime = true
    }

    if (evt.target === this.refs.changeEndTime) {
      this._changingEndTime = true
    }

    this._lastX = evt.clientX
  },
  handleMouseMove(evt) {
    if (this._draggingLeftHandle) {
      const totalRange = this.getTotalRange()
      const deltaX = evt.clientX - this._lastX
      this._lastX = evt.clientX

      this.setState({
        range: this.state.range.update(0, (v) => {
          let newStart = v + (totalRange.get(1) - totalRange.get(0)) * deltaX / this.refs.groove.getBoundingClientRect().width
          newStart = Math.min(Math.max(newStart, totalRange.get(0)), this.state.range.get(1) - MIN_RANGE_RADIO * (totalRange.get(1) - totalRange.get(0)))
          return moment(newStart)
        })
      })
    }

    if (this._draggingRightHandle) {
      const totalRange = this.getTotalRange()
      const deltaX = evt.clientX - this._lastX
      this._lastX = evt.clientX

      this.setState({
        range: this.state.range.update(1, (v) => {
          let newEnd = v + (totalRange.get(1) - totalRange.get(0)) * deltaX / this.refs.groove.getBoundingClientRect().width
          newEnd = Math.max(Math.min(newEnd, totalRange.get(1)), this.state.range.get(0) + MIN_RANGE_RADIO * (totalRange.get(1) - totalRange.get(0)))
          return moment(newEnd)
        })
      })
    }

    if (this._draggingHandle) {
      const totalRange = this.getTotalRange()
      const deltaX = evt.clientX - this._lastX
      this._lastX = evt.clientX

      this.setState({
        range: this.state.range.update(0, (v) => {
          let newStart = v + (totalRange.get(1) - totalRange.get(0)) * deltaX / this.refs.groove.getBoundingClientRect().width
          newStart = Math.min(Math.max(newStart, totalRange.get(0)), this.state.range.get(1) - MIN_RANGE_RADIO * (totalRange.get(1) - totalRange.get(0)))
          return moment(newStart)
        }).update(1, (v) => {
          let newEnd = v + (totalRange.get(1) - totalRange.get(0)) * deltaX / this.refs.groove.getBoundingClientRect().width
          newEnd = Math.max(Math.min(newEnd, totalRange.get(1)), this.state.range.get(0) + MIN_RANGE_RADIO * (totalRange.get(1) - totalRange.get(0)))
          return moment(newEnd)
        }),
      })
    }

    if (this._changingStartTime) {
      const totalRange = this.getTotalRange()
      const deltaX = evt.clientX - this._lastX
      this._lastX = evt.clientX

      this.setState({
        tasks: this.state.tasks.map((v) => v.get('id') == this.state.selectedPublish ? v.update('startTime', (startTime) => {
          let newStart = startTime + (this.state.range.get(1) - this.state.range.get(0)) * deltaX / this.refs.timeline.getBoundingClientRect().width
          newStart = Math.max(Math.min(newStart, v.get('endTime')), totalRange.get(0))
          return newStart
        })
          .update((v) => v.get('hasEndTime') ? v : v.set('endTime', v.get('startTime') + (this.state.range.get(1) - this.state.range.get(0)) * 0.3))
          .set('hasEndTime', true)
        : v)
      })
    }

    if (this._changingEndTime) {
      const totalRange = this.getTotalRange()
      const deltaX = evt.clientX - this._lastX
      this._lastX = evt.clientX

      this.setState({
        tasks: this.state.tasks.map((v) => v.get('id') == this.state.selectedPublish ? v
          .update((v) => v.get('hasEndTime') ? v : v.set('endTime', v.get('startTime') + (this.state.range.get(1) - this.state.range.get(0)) * 0.3))
          .set('hasEndTime', true)
          .update('endTime', (endTime) => {
            let newEnd = endTime + (this.state.range.get(1) - this.state.range.get(0)) * deltaX / this.refs.timeline.getBoundingClientRect().width
            newEnd = Math.min(Math.max(newEnd, v.get('startTime')), totalRange.get(1))
            return newEnd
          })
        : v)
      })
    }
  },
  handleMouseUp() {
    if (this._changingStartTime || this._changingEndTime) {
      this.handleUpdatePublishTime(this.state.selectedPublish)
    }

    this._draggingLeftHandle = false
    this._draggingRightHandle = false
    this._draggingHandle = false
    this._changingStartTime = false
    this._changingEndTime = false
  },
  handleCloseCreatePublish() {
    this.fetchPublishes()
    this.setState({
      showPublishModal: false,
    })
  },
  handleUpdatePublishTime(publishId) {
    const affair = this.props.affair
    const publish = this.state.tasks.find((v) => v.get('id') === publishId)

    if (publish) {
      const body = {
        failureTime: Math.floor(publish.get('endTime')),
        allianceId: affair.get('allianceId'),
        announcementId: publishId,
      }
      fetch(config.api.announcement.detail.duration.update(affair.get('affairMemberId')), {
        method: 'POST',
        credentials: 'include',
        json: true,
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        resourceId: publishId,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
      })
    }
  },

  renderTasks() {
    let tasks = fromJS(this.state.tasks.toJS())
    tasks = tasks.sort((a, b) => a.get('startTime') - b.get('startTime'))

    // 为了使任务在时间轴中不重叠，将他们分为多行
    let taskRows = List()
    let timeLimit = 0
    const seen = []
    while (true) { // eslint-disable-line
      let taskRow = List()

      tasks.forEach((task, key) => {
        if (task.get('startTime') > timeLimit && !~seen.indexOf(key)) {
          taskRow = taskRow.push(task)
          seen.push(key)
          timeLimit = task.get('endTime')

          if (!task.get('hasEndTime')) {
            return false
          }
        }
      })

      timeLimit = 0
      taskRows = taskRows.push(taskRow)

      if (seen.length === tasks.size) {
        break
      }
    }

    // 在时间轴视图上绘制各个任务
    const rangeInMillicond = this.state.range.get(1) - this.state.range.get(0)
    return taskRows.reduce((reduction, taskRow, k) => {
      taskRow.forEach((task) => {
        const left = (task.get('startTime') - this.state.range.get(0)) * 100 / rangeInMillicond
        const right = task.get('hasEndTime') ? (this.state.range.get(1) - task.get('endTime')) * 100 / rangeInMillicond : Math.max(100 - left - 30, 5)

        reduction.push(
          <div key={task.get('id')}>
            {
              this.state.selectedPublish === task.get('id') ? (
                <span
                  ref="changeStartTime"
                  className={styles.changeStartTime}
                  style={{
                    top: 30 + 25 * k,
                    left: `${left}%`,
                  }}
                />
              ) : null
            }
            <Tooltip placement="top" title={task.get('name')}>
              <div
                className={classNames(styles.task, !task.get('hasEndTime') ? styles.endlessTask : null)}
                onClick={() => this.setState({ selectedPublish: task.get('id') })}
                style={{
                  top: 30 + 25 * k,
                  left: `${left}%`,
                  right: `${right}%`,
                }}
              >
                {task.get('name')}
              </div>
            </Tooltip>
            {
              this.state.selectedPublish === task.get('id') ? (
                <span
                  ref="changeEndTime"
                  className={styles.changeEndTime}
                  style={{
                    top: 30 + 25 * k,
                    right: `${right}%`,
                  }}
                />
              ) : null
            }
          </div>
        )
      })

      return reduction
    }, [])
  },

  renderTimelineType(type) {
    return (
      <div className={styles.timelineType}>
        <div className={classNames(styles.grid, type === DAY_TIMELINE ? styles.activeGrid : null)}>日</div>
        <span />
        <div className={classNames(styles.grid, type === WEEK_TIMELINE ? styles.activeGrid : null)}>周</div>
        <span />
        <div className={classNames(styles.grid, type === MONTH_TIMELINE ? styles.activeGrid : null)}>月</div>
        <span />
        <div className={classNames(styles.grid, type === QUATER_TIMELINE ? styles.activeGrid : null)}>季</div>
        <span />
        <div className={classNames(styles.grid, type === YEAR_TIMELINE ? styles.activeGrid : null)}>年</div>
      </div>
    )
  },

  renderTimeline() {
    // 计算刻度线
    const { type, calibrations } = this.getCalibrations()
    const rangeInMillicond = this.state.range.get(1) - this.state.range.get(0)

    return (
      <div className={styles.timeline} ref="timeline">
        <div className={styles.tasksContainer}>
          {this.renderTasks()}
        </div>

        {/* 发布按钮 */}
        <div className={styles.publish} onClick={() => this.setState({ showPublishModal: true })}>
          <div>
            <TaskAnnouncement />
          </div>
          发布
        </div>

        {/* 当前时刻的刻度线 */}
        <div className={styles.now} style={{ left: `${(Date.now() - this.state.range.get(0)) * 100 / rangeInMillicond}%` }}>
          <span className={styles.tri} />
        </div>

        {/* 刻度线 */}
        {
          calibrations.map((date, key) => {
            return (
              <div key={key} className={styles.calibration} style={{ left: `${(date - this.state.range.get(0)) * 100 / rangeInMillicond}%` }}>
                { type === DAY_TIMELINE && date.hours() === 0 ? <div className={styles.dateLabel}>{date.format('M.D')}</div> : null}
                <span className={styles.footer} />
                <span className={styles.label}>{date.format(DATEFORMAT_MAP[type])}</span>
              </div>
            )
          })
        }

        {/* 当前显示的视图种类 */}
        {this.renderTimelineType(type)}
      </div>
    )
  },
  renderSlider() {
    const totalRange = this.getTotalRange()

    const handleLeft = (this.state.range.get(0) - totalRange.get(0)) / (totalRange.get(1) - totalRange.get(0))
    const handleRight = ( -this.state.range.get(1) + totalRange.get(1)) / (totalRange.get(1) - totalRange.get(0))

    return (
      <div className={styles.slider}>
        <div className={styles.groove} ref="groove">
          <div ref="handle" className={styles.handle} onDragOver={this.handleDragHandle} style={{ left: `${handleLeft * 100}%`, right: `${handleRight * 100}%` }}>
            <span ref="handleLeft" className={styles.handleLeft} />
            <Dehaze />
            <span ref="handleRight" className={styles.handleRight} />
          </div>
        </div>
      </div>
    )
  },
  renderPublishModal() {
    if (this.state.showPublishModal) {
      return <PublishTaskModal onClose={() => this.setState({ showPublishModal: false })} taskId={this.props.taskId} affair={this.props.affair} onClose={this.handleCloseCreatePublish}/>
    } else {
      return null
    }
  },
  render() {
    return (
      <div className={styles.container}>
        {this.renderTimeline()}
        {this.renderSlider()}
        {this.renderPublishModal()}
      </div>
    )
  }
})

export default TimeLine
