import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { pushURL } from 'actions/route'
import { Modal, Icon, Select, DatePicker, Tooltip, Input } from 'antd'
import { fromJS, List } from 'immutable'
import moment from 'moment'
import messageHandler from 'messageHandler'
import styles from './WorkDetailModal.scss'
import { WorkTypeIcon } from '../announcement/modal/CreateWorkModal'
import { workStateList } from '../announcement/constant/AnnouncementConstants'
import AddWorkRelationModal from './AddWorkRelationModal'
import { SingleRoleSelector } from '../../components/role/RoleSelector'
import { fetchAnnouncementGuest } from '../../actions/announcement'
import config from '../../config'

const Option = Select.Option
const RangePicker = DatePicker.RangePicker

class WorkDetailModal extends React.Component {
  static propTypes = {
    initialWork: React.PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)

    this.state = {
      work: props.initialWork,
      officialsList: fromJS([]),
      guestsList: fromJS([]),
      relatedWork: fromJS([]),
    }
  }

  componentDidMount() {
    this.fetchWorkRelations()
  }

  fetchOfficials() {
    const { announcement, affair } = this.props

    return fetch(config.api.announcement.detail.officials.get(announcement.get('id')), {
      method: 'GET',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.setState({
          officialsList: fromJS(json.data)
        })
      }
    })
  }

  fetchGuestsList() {
    const { announcement, affair } = this.props

    fetchAnnouncementGuest(announcement.get('id'), affair.get('id'), affair.get('roleId')).then((guestMap) => {
      let guestsList = List()
      guestsList = guestsList
        .concat(guestMap.get('innerAffair'))
        .concat(guestMap.get('innerAlliance').map((v) => v.get('roleList')).reduce((r, v) => r.concat(v), List()))
        .concat(guestMap.get('menkor').map((v) => v.get('roleList')).reduce((r, v) => r.concat(v), List()))
      guestsList = guestsList.map((v) => v.get('roleId')).toSet().toList().map((v) => guestsList.find((w) => w.get('roleId') === v))

      this.setState({
        guestsList,
      })
    })
  }

  getResponsorCandidates() {
    return this.state.officialsList.concat(this.state.guestsList)
  }

  handleExportAnnouncement = () => {
    const { affair, announcement } = this.props
    this.props.pushURL(`/workspace/affair/${affair.get('id')}/announcement/detail/${announcement.get('id')}`)
  }

  fetchWorkRelations() {
    fetch(config.api.announcement.detail.task.getRelations(this.state.work.get('announcementTaskId')), {
      method: 'GET',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          relatedWork: fromJS(json.data),
        })
      }
    })
  }

  handleChangeState = (value) => {
    const {
      affair,
      announcement,
    } = this.props
    const work = this.state.work

    fetch(config.api.announcement.detail.task.modify(work.get('announcementTaskId')), {
      method: 'POST',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        announcementId: announcement.get('announcementId'),
        state: value,
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0){
        this.setState({
          work: this.state.work.set('state', value)
        })
      }
    })
  }

  handleDateRangeChange = ([startMoment, endMoment]) => {
    const {
      affair,
      announcement,
    } = this.props
    const work = this.state.work

    fetch(config.api.announcement.detail.task.modify(work.get('announcementTaskId')), {
      method: 'POST',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        announcementId: announcement.get('announcementId'),
        beginTime: startMoment ? startMoment + 0 : null,
        offTime: endMoment ? endMoment + 0 : null,
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0){
        this.setState({
          work: this.state.work.set('beginTime', startMoment + 0).set('endTime', endMoment + 0)
        })
      }
    })
  }

  handleChangeRespRole = () => {

  }

  renderHeader() {
    return (
      <div
        className={styles.header}
      >
        <div className={styles.workHeader}>
          <WorkTypeIcon type={this.state.work.get('type')} />
          <p>{this.state.work.get('name')}</p>
        </div>

        <div className={styles.right}>
          <Icon type="close" onClick={() => this.props.onClose()}/>
          <Icon type="export" onClick={this.handleExportAnnouncement}/>
        </div>
      </div>
    )
  }

  renderWorkStateField() {
    return (
      <div className={styles.workState}>
        <div className={styles.label}>工作状态：</div>
        <Select
          style={{ width: 175 }}
          value={this.state.work.get('state')}
          onChange={this.handleChangeState}
        >
          {
            workStateList.map((state) => {
              return (
                <Option value={state.get('state')} key={state.get('state')}>
                  <span className={styles.dot} style={{ backgroundColor: state.get('icon') }} />
                  {state.get('text')}
                </Option>
              )
            })
          }
        </Select>
      </div>
    )
  }
  renderDurationField() {
    let defaultDateRange = null
    const work = this.state.work
    if (work.get('beginTime') && work.get('offTime')) {
      defaultDateRange = [moment(work.get('beginTime')), moment(work.get('offTime'))]
    }

    return (
      <div>
        <div className={styles.label}>开始时间－截止时间：</div>
        <RangePicker
          showTime
          defaultValue={defaultDateRange}
          format="YYYY/MM/DD HH:mm"
          onChange={this.handleDateRangeChange}
        />
      </div>
    )
  }
  renderOwnerRole() {
    const ownerRole = this.state.work.get('ownerRole')

    return (
      <div style={{ marginBottom: 20 }}>
        <div className={styles.label}>负责人：</div>

        <SingleRoleSelector
          placeholder="请选择负责人"
          selectedRole={ownerRole}
          onChange={this.handleChangeRespRole}
          className={styles.roleSelector}
          roleList={this.getResponsorCandidates()}
        />
      </div>
    )
  }
  renderCooperators() {
    const joinRoles = this.state.work.get('joinRoles')
    if (!joinRoles.size) return null

    return (
      <div style={{ marginBottom: 20 }}>
        <div className={styles.label}>协作者：</div>

        <div className={styles.avatarList}>
          {
            joinRoles.map((role) => {
              return (
                <Tooltip title={`${role.get('roleTitle')}－${role.get('username')}`} key={role.get('roleId')}>
                  <div className={styles.avatarItem}>
                    {role.get('avatar') && <img src={role.get('avatar')} />}
                  </div>
                </Tooltip>
              )
            })
          }
        </div>
      </div>
    )
  }
  renderRelatedWorkField() {
    return (
      <div className={styles.relatedWork}>
        <div className={styles.label}>
          <div>关联工作：</div>
          <div className={styles.button} onClick={() => this.setState({ showAddWorkRelationModal: true })}>添加关联工作</div>
        </div>

        {
          this.state.relatedWork.map((work, key) => {
            return (
              <div className={styles.relatedWorkItem} key={key}>
                <WorkTypeIcon type={work.get('type')} />
                <div>{work.get('title')}</div>
              </div>
            )
          })
        }
      </div>
    )
  }
  renderRemarkField() {
    return (
      <div className={styles.relatedWork} style={{ marginBottom: 20 }}>
        <div className={styles.label}>备注：</div>
        <Input.TextArea style={{ background: 'white', color: '#666' }} rows={4} value={this.state.work.get('note')} />
      </div>
    )
  }
  render() {
    return (
      <Modal
        visible
        closable={false}
        title={this.renderHeader()}
        footer={null}
      >
        {this.state.showAddWorkRelationModal ? (
          <AddWorkRelationModal
            onCancel={() => {
              // this.fetchDetail(this.props.affair, this.props.announcement)
              this.setState({ showAddWorkRelationModal: false })
            }}
            workList={this.props.workList}
            work={this.state.work}
            affair={this.props.affair}
          />
        ) : null}

        <div className={styles.content}>
          {this.renderWorkStateField()}
          {this.renderOwnerRole()}
          {this.renderCooperators()}
          {this.renderDurationField()}
          {this.renderRelatedWorkField()}
          {this.renderRemarkField()}
        </div>
      </Modal>
    )
  }
}

export default connect(null, (dispatch) => ({ pushURL: bindActionCreators(pushURL, dispatch) }))(WorkDetailModal)
