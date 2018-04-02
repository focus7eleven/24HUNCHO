import React from 'react'
import styles from './PlanTimeline.scss'
import { List, fromJS } from 'immutable'
import { Icon, Tooltip } from 'antd'
import moment from 'moment'
import classNames from 'classnames'
import { TimelineRoleView, AnnouncementSubIcon } from 'svg'
import config from '../../config'
import { RoleItem } from '../../components/role/RoleSelector'
import { TimelineSend } from 'svg'

const HALF_DAY = 43200000
const DEFAULT_TOTAL_RANGE = List([
  moment(Date.now() - HALF_DAY * 15),
  moment(Date.now() + HALF_DAY * 15),
])

const DAY_TIMELINE = 'DAY_TIMELINE'
const WEEK_TIMELINE = 'WEEK_TIMELINE'
const MONTH_TIMELINE = 'MONTH_TIMELINE'

const DATEFORMAT_MAP = {
  DAY_TIMELINE: 'H:mm',
  WEEK_TIMELINE: 'M.D',
  MONTH_TIMELINE: 'M.D',
}

class DraftItem extends React.Component {
  static propTypes = {
    draft: React.PropTypes.object.isRequired,
    range: React.PropTypes.object.isRequired,
  }

  componentDidMount() {
    if (this._item) {
      const boundingClientRect = this._item.getBoundingClientRect()
      this.props.updateItemPosition(this.props.draft.get('id'), boundingClientRect)
    }
  }

  render() {
    const {
      draft,
      range,
    } = this.props

    const totalRange = range.get(1) - range.get(0)
    const style = {
      marginLeft: ((draft.get('modifyTime') - range.get(0)) / totalRange) * 100 + '%',
      marginRight: ((range.get(1) - draft.get('modifyTime') - 0.2 * totalRange) / totalRange) * 100 + '%',
      minWidth: 5,
    }
    const itemStyle = {
      paddingLeft: 100 * Math.min(1, Math.max(0, (range.get(0) - draft.get('modifyTime')) / (0.2 * totalRange))) + '%',
      paddingRight: 100 * Math.min(1, Math.max(0, (draft.get('modifyTime') + totalRange * 0.2 - range.get(1)) / (totalRange * 0.2))) + '%',
    }

    const draftItem = (
      <div
        className={styles.announcementItemContainer}
        style={style}
        ref={(ref) => {
          if (ref) {
            this._item = ref
          }
        }}
      >
        {/* 发布自身 */}
        <div
          className={styles.draftItem}
          style={itemStyle}
        >
          <p style={{ paddingLeft: 8 }}>
            {draft.get('title')}
          </p>

          <div className={styles.sendIcon} onClick={() => this.props.onSendDraft(draft.get('id'))}>
            <TimelineSend />
          </div>
        </div>
      </div>
    )

    return draftItem
  }
}

class AnnouncementItem extends React.Component {
  static propTypes = {
    announcement: React.PropTypes.object.isRequired,
    range: React.PropTypes.object.isRequired,
    onClick: React.PropTypes.func.isRequired,
  }

  state = {
    openTaskList: false,
  }

  componentDidMount() {
    if (this._item) {
      const boundingClientRect = this._item.getBoundingClientRect()
      this.props.updateItemPosition(this.props.announcement.get('announcementId'), boundingClientRect)
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevProps && (
      prevState.openTaskList !== this.state.openTaskList ||
      prevProps.range !== this.props.range ||
      prevProps.announcement.get('startTime') !== this.props.announcement.get('startTime') ||
      prevProps.announcement.get('endTime') !== this.props.announcement.get('endTime') ||
      prevProps.announcement.get('shipAnnouncementIds') !== this.props.announcement.get('shipAnnouncementIds')
    )) {
      this.props.updateAllItemPosition()
    }
  }

  toggleTaskList = (evt) => {
    evt.stopPropagation()

    this.setState({
      openTaskList: !this.state.openTaskList,
    })
  }

  renderShipAnnouncements() {
    const {
      announcement,
      positionMap,
    } = this.props

    if (announcement.get('shipAnnouncementIds')) {
      return announcement.get('shipAnnouncementIds').map((partner, key) => {
        // 从结束处关联
        if (partner.get('type') === 1) {
          const sp = positionMap[announcement.get('id')]
          const ep = positionMap[partner.get('shipAnnouncementId')]
          if (!sp || !ep) return null

          return (
            <div key={key}>
              <div className={styles.path} style={{ top: 12, right: - 8, width: 12, height: 1 }} />
              <div className={styles.path} style={{ top: sp.y >= ep.y ? -4 : 12, right: -8, width: 1, height: sp.y >= ep.y ? 17 : Math.abs(ep.y - sp.y) / 2 }} />
              <div className={styles.path} style={{ top: sp.y >= ep.y ? -4 : 12 + Math.abs(ep.y - sp.y) / 2, right: -8, width: Math.max(sp.x + sp.width - ep.x + 16, 0), height: 1 }} />
              <div className={styles.path} style={{ top: sp.y >= ep.y ? 12 - Math.abs(sp.y - ep.y) : 12 + Math.abs(ep.y - sp.y) / 2, right: -8 + Math.max(sp.x + sp.width - ep.x + 16, 0), width: 1, height: sp.y >= ep.y ? Math.abs(ep.y - sp.y) - 15 : Math.abs(ep.y - sp.y) / 2 }} />
              <div className={styles.path} style={{ top: sp.y >= ep.y ? 12 - Math.abs(sp.y - ep.y) : 12 + Math.abs(sp.y - ep.y), right: sp.x + sp.width - ep.x, width: 1 + Math.abs(sp.x + sp.width - ep.x + 8 - Math.max(sp.x + sp.width - ep.x + 16, 0)), height: 1 }}>
                <span style={ep.x >= sp.x ? { right: -2, top: -7 } : { left: 2, top: -7 }}>></span>
              </div>
            </div>
          )
        }
        // 从开始处关联
        if (partner.get('type') === 0) {
          const sp = positionMap[announcement.get('id')]
          const ep = positionMap[partner.get('shipAnnouncementId')]
          if (!sp || !ep) return null

          return (
            <div key={key}>
              <div className={styles.path} style={{ top: 12, left: sp.x >= ep.x ? - 8 - (sp.x - ep.x) : -8, width: sp.x > ep.x ? 12 + Math.abs(sp.x - ep.x) : 12, height: 1 }} />
              <div className={styles.path} style={{ top: sp.y >= ep.y ? 12 - Math.abs(sp.y - ep.y) : 12, left: sp.x >= ep.x ? - 8 - (sp.x - ep.x) : -8, width: 1, height: Math.abs(ep.y - sp.y) }} />
              <div className={styles.path} style={{ top: sp.y >= ep.y ? 12 - Math.abs(sp.y - ep.y) : 12 + Math.abs(sp.y - ep.y), left: sp.x >= ep.x ? - 8 - (sp.x - ep.x) : -8, width: ep.x >= sp.x ? 8 + Math.abs(ep.x - sp.x) : 8, height: 1 }}>
                <span style={ep.x >= sp.x ? { right: -2, top: -7 } : { left: 2, top: -7 }}>></span>
              </div>
            </div>
          )
        }

        return null
      }).filter((v) => !!v)
    }

    return null
  }

  renderTaskList() {
    if (!this.state.openTaskList || !this.props.announcement.get('haveKeyWork')) return null

    return (
      <div className={styles.taskList}>
        {
          this.props.announcement.get('keyTasks').map((task) => {
            task = task.set('startTime', task.get('offTime') - 259200000)

            return (
              <TaskItem
                updateAllItemPosition={this.handleUpdateAllItemPosition}
                key={task.get('id')}
                task={task}
                onClick={() => this.props.onClickTask(task)}
                range={fromJS([this.props.announcement.get('startTime'), this.props.announcement.get('endTime')])}
                positionMap={this.props.positionMap}
                ref={(ref) => {
                  if (ref) {
                    this._announcementItemMap = this._announcementItemMap || {}
                    this._announcementItemMap[task.get('id')] = ref
                  }
                }}
                updateItemPosition={(taskId, p) => {
                  this.props.updateItemPosition(taskId, p)
                }}
              />
            )
          })
        }
      </div>
    )
  }

  render() {
    const {
      announcement,
      range,
    } = this.props

    const totalRange = range.get(1) - range.get(0)
    const style = {
      marginLeft: ((announcement.get('startTime') - range.get(0)) / totalRange) * 100 + '%',
      marginRight: ((range.get(1) - announcement.get('endTime')) / totalRange) * 100 + '%',
      minWidth: 5,
    }
    const widthRatio = (announcement.get('endTime') - announcement.get('startTime')) / (range.get(1) - range.get(0))
    const itemStyle = {
      paddingLeft: 100 * Math.min(1, Math.max(0, (range.get(0) - announcement.get('startTime')) / (announcement.get('endTime') - announcement.get('startTime')))) + '%',
      paddingRight: 100 * Math.min(1, Math.max(0, (announcement.get('endTime') - range.get(1)) / (announcement.get('endTime') - announcement.get('startTime')))) + '%',
    }

    const announcementItem = (
      <div
        className={styles.announcementItemContainer}
        style={style}
        ref={(ref) => {
          if (ref) {
            this._item = ref
          }
        }}
      >
        {/* 发布自身 */}
        <div
          className={styles.announcementItem}
          onClick={this.props.onClick}
          style={itemStyle}
        >
          {widthRatio > 0.05 && (
            <p style={{ paddingLeft: 8 }}>
              {announcement.get('title')}
            </p>
          )}
          {this.renderShipAnnouncements()}
          {widthRatio > 0.05 && announcement.get('haveKeyWork') && (
            !this.state.openTaskList ? <Icon type="caret-up" onClick={this.toggleTaskList} /> : <Icon type="caret-down" onClick={this.toggleTaskList} />
          )}
        </div>
        {/* 发布所包含的任务 */}
        {this.renderTaskList()}
      </div>
    )

    if (widthRatio < 0.05) {
      return (
        <Tooltip title={announcement.get('title')}>
          {announcementItem}
        </Tooltip>
      )
    } else {
      return announcementItem
    }
  }
}

class TaskItem extends React.Component {
  static propTypes = {
    task: React.PropTypes.object.isRequired,
    range: React.PropTypes.object.isRequired,
  }

  componentDidMount() {
    if (this._item) {
      const boundingClientRect = this._item.getBoundingClientRect()
      this.props.updateItemPosition(this.props.task.get('id'), boundingClientRect)
    }
  }

  renderShipTasks() {
    const {
      task,
      positionMap,
      announcement,
    } = this.props

    if (task.get('shipAnnouncementIds')) {
      return announcement.get('shipAnnouncementIds').map((partner, key) => {
        // 从结束处关联
        if (partner.get('type') === 1) {
          const sp = positionMap[announcement.get('id')]
          const ep = positionMap[partner.get('shipAnnouncementId')]
          if (!sp || !ep) return null

          return (
            <div key={key}>
              <div className={styles.path} style={{ top: 12, right: - 8, width: 12, height: 1 }} />
              <div className={styles.path} style={{ top: sp.y >= ep.y ? 12 - Math.abs(sp.y - ep.y) : 12, right: -8, width: 1, height: Math.abs(ep.y - sp.y) }} />
              <div className={styles.path} style={{ top: sp.y >= ep.y ? 12 - Math.abs(sp.y - ep.y) : 12 + Math.abs(sp.y - ep.y), right: -ep.x + sp.x + sp.width, width: Math.abs(ep.x - sp.x) - 7 - sp.width, height: 1 }}>
                <span style={ep.x >= sp.x ? { right: -2, top: -7 } : { left: 2, top: -7 }}>></span>
              </div>
            </div>
          )
        }
        // 从开始处关联
        if (partner.get('type') === 0) {
          const sp = positionMap[announcement.get('id')]
          const ep = positionMap[partner.get('shipAnnouncementId')]
          if (!sp || !ep) return null

          return (
            <div key={key}>
              <div className={styles.path} style={{ top: 12, left: sp.x >= ep.x ? - 8 - (sp.x - ep.x) : -8, width: sp.x > ep.x ? 12 + Math.abs(sp.x - ep.x) : 12, height: 1 }} />
              <div className={styles.path} style={{ top: sp.y >= ep.y ? 12 - Math.abs(sp.y - ep.y) : 12, left: sp.x >= ep.x ? - 8 - (sp.x - ep.x) : -8, width: 1, height: Math.abs(ep.y - sp.y) }} />
              <div className={styles.path} style={{ top: sp.y >= ep.y ? 12 - Math.abs(sp.y - ep.y) : 12 + Math.abs(sp.y - ep.y), left: sp.x >= ep.x ? - 8 - (sp.x - ep.x) : -8, width: ep.x >= sp.x ? 8 + Math.abs(ep.x - sp.x) : 8, height: 1 }}>
                <span style={ep.x >= sp.x ? { right: -2, top: -7 } : { left: 2, top: -7 }}>></span>
              </div>
            </div>
          )
        }

        return null
      }).filter((v) => !!v)
    }

    return null
  }

  render() {
    const {
      task,
      range,
    } = this.props

    const totalRange = range.get(1) - range.get(0)
    const style = {
      marginLeft: ((task.get('startTime') - range.get(0)) / totalRange) * 100 + '%',
      marginRight: ((range.get(1) - task.get('offTime')) / totalRange) * 100 + '%',
    }
    const cancelledTask = task.get('state') === 4 || task.get('state') === 0
    const completedTask = task.get('state') === 3

    return (
      <div
        className={styles.announcementItemContainer}
        style={style}
        onClick={this.props.onClick}
        ref={(ref) => {
          if (ref) {
            this._item = ref
          }
        }}
      >
        {/* 发布自身 */}
        <div
          className={classNames(styles.announcementItem, styles.taskItem, cancelledTask && styles.cancelledTask)}
        >
          <p>
            {task.get('title')}
          </p>
          {this.renderShipTasks()}
          {completedTask && <div className={styles.completedTask}><Icon type="check" /></div>}
        </div>
      </div>
    )
  }
}

class PlanTimeline extends React.Component {
  state = {
    range: DEFAULT_TOTAL_RANGE, // 当前显示的时间范围
    roleTypeData: List(),
    draftList: List(),
    positionMap: {},
    viewByRole: true,
  }

  componentWillMount() {
    this.fetchRoleTypeAnnouncement()
    this.fetchDraftList()

    window.addEventListener('mouseup', this.handleMouseUp)
    window.addEventListener('touchend', this.handleMouseUp)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.currentEditAnnouncement !== nextProps.currentEditAnnouncement) {
      this.fetchRoleTypeAnnouncement()
    }
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.handleMouseUp)
    window.removeEventListener('touchend', this.handleMouseUp)
  }

  fetchRoleTypeAnnouncement() {
    fetch(config.api.affair.plan.role_view, {
      method: 'POST',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        viewSelection: 1,
      }),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        const data = json.data

        if (json.code === 0) {
          this.setState({
            roleTypeData: fromJS(data),
          })
        }
      }
    })
  }

  fetchDraftList() {
    fetch(config.api.announcement.draft.list.get(), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => {
      return res.json()
    }).then((json) => {
      if (json.code === 0 ) {
        this.setState({
          draftList: fromJS(json.data),
        })
      }
    })
  }

  // 根据所选的视角类型，判断每个刻度线所表示的时刻。
  getCalibrations() {
    const rangeInMillicond = this.state.range.get(1) - this.state.range.get(0)
    let calibrations = []
    let type

    if (rangeInMillicond <= 2 * HALF_DAY) {
      // 使用日视图
      type = DAY_TIMELINE
      let t = this.state.range.get(0).clone().startOf('hour')
      while (t < this.state.range.get(1)) {
        calibrations.push(t.clone())
        t = t.add(1, 'hours')
      }
    } else if (rangeInMillicond <= HALF_DAY * 2 * 31) {
      // 使用月视图和周视图
      type = rangeInMillicond <= HALF_DAY * 2 * 7 ? WEEK_TIMELINE : MONTH_TIMELINE
      let t = this.state.range.get(0).clone().startOf('day')
      while (t < this.state.range.get(1)) {
        calibrations.push(t.clone())
        t = t.add(1, 'days')
      }
    }

    // Remove overflow head.
    calibrations.shift()

    return {
      type,
      calibrations,
    }
  }

  handleResetRange(newRange) {
    const mid = (this.state.range.get(0) + this.state.range.get(1)) / 2

    this.setState({
      range: this.state.range.set(0, moment(mid - newRange)).set(1, moment(mid + newRange))
    })
  }

  handleWheel = (deltaX) => {
    const {
      range,
    } = this.state

    const offset = (range.get(1) - range.get(0)) * 0.001 * (-deltaX)

    this.setState({
      range: range.update(0, (v) => moment(v + offset)).update(1, (v) => moment(v + offset))
    })
  }

  handleTimelineMouseDown = (evt) => {
    this._timelimeMouseDown = true
    this._lastX = evt.clientX
  }

  handleTimelineMouseMove = (evt) => {
    if (this._timelimeMouseDown) {
      this.handleWheel(evt.clientX - this._lastX)
    }
    this._lastX = evt.clientX
  }

  handleMouseUp = () => {
    this._timelimeMouseDown = false
  }

  handleUpdateAllItemPosition = () => {
    Object.keys(this._announcementItemMap).forEach((key) => {
      this.state.positionMap[key] = this._announcementItemMap[key]._item.getBoundingClientRect()
    })

    this.setState({
      positionMap: this.state.positionMap,
    })
  }

  renderTimelineType(type) {
    return (
      <div className={styles.timelineType}>
        <div onClick={() => this.handleResetRange(HALF_DAY / 2)} className={classNames(styles.grid, type === DAY_TIMELINE ? styles.activeGrid : null)}>日</div>
        <span />
        <div onClick={() => this.handleResetRange(HALF_DAY * 7)} className={classNames(styles.grid, type === WEEK_TIMELINE ? styles.activeGrid : null)}>周</div>
        <span />
        <div onClick={() => this.handleResetRange(HALF_DAY * 15)} className={classNames(styles.grid, type === MONTH_TIMELINE ? styles.activeGrid : null)}>月</div>
      </div>
    )
  }

  renderNormalAnnouncement() {
    return (
      <div className={styles.roleContainer}>
        <div className={styles.roleRow}>
          {
            this.state.roleTypeData.filter((role) => {
              // 根据角色筛选器筛选
              if (!this.props.selectedRoleList || this.props.selectedRoleList.size === 0) return true
              return !!this.props.selectedRoleList.find((v) => v.get('roleId') == role.get('ownerRole').get('roleId'))
            }).reduce((r, v) => r.concat(v.get('roleAnnouncementList')), List()).filter(this.props.announcementFilter).sort((a, b) => a.get('startTime') - b.get('startTime')).map((announcement) => {
              announcement = announcement.set('id', announcement.get('announcementId'))
              return (
                <AnnouncementItem
                  updateAllItemPosition={this.handleUpdateAllItemPosition}
                  onClick={() => this.props.onClickAnnouncement(announcement)}
                  key={announcement.get('announcementId')}
                  onClickTask={this.props.onClickTask}
                  announcement={announcement}
                  range={this.state.range}
                  positionMap={this.state.positionMap}
                  ref={(ref) => {
                    if (ref) {
                      this._announcementItemMap = this._announcementItemMap || {}
                      this._announcementItemMap[announcement.get('announcementId')] = ref
                    }
                  }}
                  updateItemPosition={(announcementId, p) => {
                    this.state.positionMap[announcementId] = p
                    this.setState({
                      positionMap: this.state.positionMap,
                    })
                  }}
                />
              )
            })
          }

          {/* 草稿发布 */}
          {this.renderDraftAnnouncement()}
        </div>
      </div>
    )
  }

  renderRoleAnnouncement() {
    return (
      <div className={styles.roleContainer}>
        {
          this.state.roleTypeData.filter((role) => {
            // 根据角色筛选器筛选
            if (!this.props.selectedRoleList || this.props.selectedRoleList.size === 0) return true
            return !!this.props.selectedRoleList.find((v) => v.get('roleId') == role.get('ownerRole').get('roleId'))
          }).map((role) => {
            return (
              <div className={styles.roleRow} key={role.getIn(['ownerRole', 'roleId'])}>
                <RoleItem role={role.get('ownerRole')} className={styles.role}/>

                {
                  role.get('roleAnnouncementList').filter(this.props.announcementFilter).sort((a, b) => a.get('startTime') - b.get('startTime')).map((announcement) => {
                    announcement = announcement.set('id', announcement.get('announcementId'))

                    return (
                      <AnnouncementItem
                        updateAllItemPosition={this.handleUpdateAllItemPosition}
                        onClick={() => this.props.onClickAnnouncement(announcement)}
                        key={announcement.get('announcementId')}
                        onClickTask={this.props.onClickTask}
                        announcement={announcement}
                        range={this.state.range}
                        positionMap={this.state.positionMap}
                        ref={(ref) => {
                          if (ref) {
                            this._announcementItemMap = this._announcementItemMap || {}
                            this._announcementItemMap[announcement.get('announcementId')] = ref
                          }
                        }}
                        updateItemPosition={(announcementId, p) => {
                          this.state.positionMap[announcementId] = p
                          this.setState({
                            positionMap: this.state.positionMap,
                          })
                        }}
                      />
                    )
                  })
                }

                {/* 草稿发布 */}
                {role.getIn(['ownerRole', 'roleId']) == this.props.affair.get('roleId') ? this.renderDraftAnnouncement() : null}
              </div>
            )
          })
        }
      </div>
    )
  }

  renderTimelineView() {
    return (
      <div className={styles.timelineViewType}>
        <div>查看视图：</div>
        <AnnouncementSubIcon
          style={this.state.viewByRole ? {} : { fill: '#926dea' }}
          onClick={() => this.setState({ viewByRole: false })}
        />
        <TimelineRoleView
          style={!this.state.viewByRole ? {} : { fill: '#926dea' }}
          onClick={() => this.setState({ viewByRole: true })}
        />
      </div>
    )
  }

  renderDraftAnnouncement() {
    return (
      this.state.draftList.sort((a, b) => a.get('modifyTime') - b.get('modifyTime')).map((draft) => {
        return (
          <DraftItem
            updateAllItemPosition={this.handleUpdateAllItemPosition}
            key={draft.get('id')}
            draft={draft}
            range={this.state.range}
            positionMap={this.state.positionMap}
            ref={(ref) => {
              if (ref) {
                this._announcementItemMap = this._announcementItemMap || {}
                this._announcementItemMap[draft.get('id')] = ref
              }
            }}
            updateItemPosition={(draftId, p) => {
              this.state.positionMap[draftId] = p
              this.setState({
                positionMap: this.state.positionMap,
              })
            }}
            onSendDraft={this.props.onSendDraft}
          />
        )
      })
    )
  }

  renderTimeline() {
    // 计算刻度线
    const { type, calibrations } = this.getCalibrations()
    const rangeInMillicond = this.state.range.get(1) - this.state.range.get(0)

    return (
      <div
        className={styles.timeline}
        ref="timeline"
        onMouseDown={this.handleTimelineMouseDown}
        onMouseMove={this.handleTimelineMouseMove}
      >
        {/* 当前时刻的刻度线 */}
        <div className={styles.now} style={{ left: `${(Date.now() - this.state.range.get(0)) * 100 / rangeInMillicond}%` }}>
          <span className={styles.tri} />
        </div>

        {/* 角色视角发布 */}
        {this.state.viewByRole && this.renderRoleAnnouncement()}
        {!this.state.viewByRole && this.renderNormalAnnouncement()}


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
        {/* 当前显示的视图视角 */}
        {this.renderTimelineView()}
      </div>
    )
  }
  render() {
    return (
      <div className={styles.container}>
        {this.renderTimeline()}
      </div>
    )
  }
}

export default PlanTimeline
