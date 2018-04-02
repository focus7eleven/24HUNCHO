import React from 'react'
import { connect } from 'react-redux'
import { DatePicker } from 'antd'
import { TaskPeople, TaskMaterial, TaskMoney, TaskFile } from 'svg'
import { fromJS } from 'immutable'
import config from '../../config'
import Timeline from './Timeline'
import styles from './TaskDetailContainer.scss'
import RoleItem from '../../components/role/RoleItem'
import TaskStatusSelector, { TASK_STATUS } from '../../components/task/TaskStatusSelector'
import OfficialListComponent from '../announcement/OfficialListComponent'

const RangePicker = DatePicker.RangePicker
const REQUIREMENT_TAB = 'REQUIREMENT_TAB'
const TIME_LINE_TAB = 'TIME_LINE_TAB'

const TaskDetail = React.createClass({
  getInitialState() {
    return {
      currentTab: TIME_LINE_TAB,
      creator: null,
      members: [],
    }
  },

  componentDidMount() {
    this.fetchTaskDetailInformation()
  },

  fetchTaskDetailInformation() {
    fetch(config.api.task.get(this.props.params.taskId), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      json: true,
    }).then((res) => res.json()).then((res) => {
      if (res.code == 0) {
        const data = res.data

        this.setState({
          creator: fromJS(data.creator),
          members: data.members,
        })
      }
    })
  },

  renderTaskHeader() {
    const affair = this.props.affair
    if (!affair) return null

    const {
      creator,
      members,
    } = this.state

    return (
      <div className={styles.header}>
        <div className={styles.headerRow}>
          {/* 负责人 */}
          <div className={styles.headerLabel}>负责人：</div>
          {creator ? <RoleItem role={{ roleTitle: creator.get('roleTitle'), roleName: creator.get('username'), avatar: creator.get('avatar') }} /> : null}

          {/* 参与者 */}
          <div className={styles.headerLabel} style={{ marginLeft: 30 }}>参与者：</div>
          <OfficialListComponent officialList={members} roleId={affair.get('roleId')} affairId={parseInt(affair.get('id'))} onAddOfficial={() => {}} onDeleteOfficial={() => {}}/>

          {/* 状态 */}
          <div className={styles.headerLabel} style={{ marginLeft: 'auto' }}>状态：</div>
          <TaskStatusSelector status={TASK_STATUS[0]} />
        </div>

        <div className={styles.headerRow}>
          {/* 起止时间 */}
          <div className={styles.headerLabel}>起止时间：</div>
          <RangePicker showTime format="yy/MM/dd HH:mm" />

          {/* 星级 */}
          <div className={styles.headerLabel} style={{ marginLeft: 20 }}>星级：</div>
          <div className={styles.level}>
            <span>&#9733;</span>
            <span>&#9733;</span>
            <span>&#9733;</span>
          </div>

          {/* 创建信息 */}
          <div className={styles.headerLabel} style={{ marginLeft: 'auto' }}>视觉设计师 陈沉 创建于2017年3月31日</div>
        </div>
      </div>
    )
  },
  renderTabs() {
    return (
      <div className={styles.tabs}>
        <div className={this.state.currentTab === REQUIREMENT_TAB ? styles.activeTab : null}>需求与匹配</div>
        <div className={this.state.currentTab === TIME_LINE_TAB ? styles.activeTab : null}>时间轴</div>
      </div>
    )
  },
  renderBottomPanel() {
    return (
      <div className={styles.bottomPanel}>
        {/* 人力 */}
        <div className={styles.bottomPanelRow}>
          <div className={styles.icon}>
            <TaskPeople />
          </div>
          人力
        </div>

        {/* 物力 */}
        <div className={styles.bottomPanelRow}>
          <div className={styles.icon}>
            <TaskMaterial />
          </div>
          物力
        </div>

        {/* 财力 */}
        <div className={styles.bottomPanelRow}>
          <div className={styles.icon}>
            <TaskMoney />
          </div>
          财力
        </div>

        {/* 文件 */}
        <div className={styles.bottomPanelRow}>
          <div className={styles.icon}>
            <TaskFile />
          </div>
          文件
        </div>
      </div>
    )
  },
  render() {
    const affair = this.props.affair
    if (!affair) return null

    return (
      <div className={styles.container}>
        {this.renderTaskHeader()}
        {this.renderTabs()}
        {this.state.currentTab === TIME_LINE_TAB ? <Timeline affair={affair} taskId={this.props.params.taskId} /> : null}
        {this.renderBottomPanel()}
      </div>
    )
  }
})

function mapStateToProps(state, props) {
  return {
    affair: state.getIn(['affair', 'affairMap', props.params.id]),
  }
}

function mapDispatchToProps() {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(TaskDetail)
