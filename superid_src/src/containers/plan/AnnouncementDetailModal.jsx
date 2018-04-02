import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { pushURL } from 'actions/route'
import { Modal, Icon, DatePicker, Dropdown, Menu } from 'antd'
import { fromJS, List } from 'immutable'
import { Editor, convertFromRaw, EditorState } from 'draft-js'
import EditableTagGroup from '../../components/tag/EditableTagGroup'
import styles from './AnnouncementDetailModal.scss'
import AddAnnouncementRelationModal from './AddAnnouncementRelationModal'
import WorkDetailModal from './WorkDetailModal'
import { inlineStyleMap, getBlockStyle, getBlockRender } from '../announcement/EditorControl'
import EditorDecorator from '../announcement/EditorDecorator'
import { OfficialRoleSelector } from '../../components/role/RoleSelector'
import InnerAnnouncement, { TEMPLATE_ATTRS } from '../announcement/inner/InnerAnnouncement'
import moment from 'moment'
import messageHandler from 'messageHandler'
import CreateWorkModal, { WorkTypeIcon } from '../announcement/modal/CreateWorkModal'
import { workStateList } from '../announcement/constant/AnnouncementConstants'
import { TrashIcon } from 'svg'
import config from '../../config'

const noop = () => {}
const RangePicker = DatePicker.RangePicker

class AnnouncementDetailModal extends React.Component {

  state = {
    announcement: null, // 公告详情
    showAddAnnouncementRelationModal: false, // 添加关联公告弹框
    showCreateKeyWorkModal: false, // 创建关键工作的弹窗
    workList: List(),
    showWorkInfo: null, // 展示工作详情
    selectedOfficialRoleList: List(), // 官方列表
    officialRoleList: List(), // 官方候选人
  }

  componentWillMount() {
    this.fetchDetail(this.props.affair, this.props.announcement)
    this.fetchWorks()
    this.fetchOfficials(this.props)
    this.handleFetchOfficialRoleCandidates(this.props)
  }

  handleFetchOfficialRoleCandidates(props) {
    fetch(config.api.affair.role.affair_roles(true), {
      method: 'GET',
      credentials: 'include',
      roleId: props.affair.get('roleId'),
      affairId: props.affair.get('id'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          officialRoleList: fromJS(json.data || []),
        })
      }
    })
  }

  fetchOfficials(props){
    const { affair, announcement } = props

    return fetch(config.api.announcement.detail.officials.get(announcement.get('id')), {
      method: 'GET',
      affairId: affair.get('id'),
      roleId: affair.get('roleId')
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.setState({
          selectedOfficialRoleList: fromJS(json.data)
        })
      }
    })
  }

  fetchDetail(affair, announcement) {
    fetch(config.api.announcement.detail.get(announcement.get('id')), {
      method: 'GET',
      affairId: affair.get('id'),
      roleId: affair.get('roleId')
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0){
        const announcement = fromJS(json.data)

        this.setState({
          announcement,
        })
      }
    })
  }

  fetchWorks(workList = List(), limit = 30){
    const { affair, announcement } = this.props

    return fetch(config.api.announcement.detail.task.getList(announcement.get('id')), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify({
        lastTime: workList.size !== 0 ? workList.get(workList.size - 1).get('createTime') : null,
        limit: limit,
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0){
        const data = json.data

        this.setState({
          workList: fromJS(data.taskVOList),
        })
      }
    })
  }

  handleExportAnnouncement = () => {
    const { affair, announcement } = this.props
    this.props.pushURL(`/workspace/affair/${affair.get('id')}/announcement/detail/${announcement.get('id')}`)
  }

  handleRemoveAnnouncementRelationship(targetAnnouncement) {
    fetch(config.api.announcement.remove_relation(this.props.announcement.get('id'), targetAnnouncement.get('announcementId')), {
      method: 'POST',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          announcement: this.state.announcement.update('shipAnnouncements', (shipAnnouncements) => shipAnnouncements.filter((v) => v.get('announcementId') !== targetAnnouncement.get('announcementId'))),
        })
      }
    })
  }

  handleDateRangeChange = ([startMoment, endMoment]) => {
    const announcement = this.state.announcement

    fetch(config.api.announcement.detail.duration.update(announcement.get('announcementId')), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      resourceId: announcement.get('announcementId'),
      body: JSON.stringify({
        startTime: startMoment ? startMoment + 0 : null,
        endTime: endMoment ? endMoment + 0 : null,
      }),
    })
  }

  handleChangeWorkState = (workId, state) => {
    const announcement = this.state.announcement

    fetch(config.api.announcement.detail.task.modify(workId), {
      method: 'POST',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      resourceId: announcement.get('announcementId'),
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        announcementId: announcement.get('announcementId'),
        state,
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          workList: this.state.workList.map((v) => v.get('announcementTaskId') == workId ? v.set('state', state) : v)
        })
      }
    })
  }

  handleSelectOfficialChange = (selectedRoleList) => {
    if (!selectedRoleList || selectedRoleList.size < 1) return

    const { affair, announcement } = this.props

    fetch(config.api.announcement.update(announcement.get('id')), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      roleId: affair.get('roleId'),
      affairId: affair.get('id'),
      resourceId: announcement.get('id'),
      body: JSON.stringify({
        authority: selectedRoleList.map((v) => v.get('roleId')).toJS(),
      })
    }).then((res) => res.json()).then(messageHandler)

    this.setState({
      selectedOfficialRoleList: selectedRoleList,
    })
  }

  renderHeader() {
    return (
      <div
        className={styles.header}
      >
        <InnerAnnouncement
          className={styles.announcementItem}
          announcement={this.props.announcement}
          affairId={this.props.affair.get('id')}
          onClick={noop}
        />

        <div className={styles.right}>
          <Icon type="export" onClick={this.handleExportAnnouncement}/>
          <Icon type="close" onClick={() => this.props.onClose()}/>
        </div>
      </div>
    )
  }

  renderAnnouncemenetContent() {
    let contentState = convertFromRaw(JSON.parse(this.state.announcement.get('content')))
    const editorState = EditorState.createWithContent(contentState, EditorDecorator)

    return (
      <Editor
        className={styles.draftEditor}
        blockRendererFn={getBlockRender.bind(this)}
        blockStyleFn={getBlockStyle}
        editorState={editorState}
        customStyleMap={inlineStyleMap}
        readOnly
      />
    )
  }

  renderTabgs() {
    let tags = null
    try {
      tags = JSON.parse(this.state.announcement.get('tags'))
    } catch (err) {
      tags = []
    }

    return (
      <EditableTagGroup immutable tags={tags} style={{ marginTop: 5 }} />
    )
  }

  renderOfficialField() {
    return (
      <div className={styles.officials}>
        <div className={styles.label}>官方：</div>
        <OfficialRoleSelector
          onChange={this.handleSelectOfficialChange}
          roleList={this.state.officialRoleList}
          selectedRoleList={this.state.selectedOfficialRoleList}
          style={{ minHeight: 28 }}
        />
      </div>
    )
  }

  renderDurationField() {
    let defaultDateRange = null
    if (this.state.announcement.get('startTime') && this.state.announcement.get('endTime')) {
      defaultDateRange = [moment(this.state.announcement.get('startTime')), moment(this.state.announcement.get('endTime'))]
    }

    return (
      <div className={styles.duration}>
        <div className={styles.label}>开始时间－截止时间：</div>
        <RangePicker
          style={{ height: 32 }}
          showTime
          defaultValue={defaultDateRange}
          format="YYYY/MM/DD HH:mm"
          onChange={this.handleDateRangeChange}
        />
      </div>
    )
  }

  renderRelatedAnnouncementField() {
    const shipAnnouncements = this.state.announcement.get('shipAnnouncements', List())

    return (
      <div className={styles.relatedAnnouncement}>
        <div className={styles.label}>
          <div>关联发布：</div>
          <div className={styles.button} onClick={() => this.setState({ showAddAnnouncementRelationModal: true })}>添加关联发布</div>
        </div>

        {
          shipAnnouncements.size ? (
            <div className={styles.relatedItemPanel}>
              {
                shipAnnouncements.map((v) => {
                  const templateStyle = TEMPLATE_ATTRS[v.get('plateType')]

                  return (
                    <div key={v.get('announcementId')} className={styles.shipItem}>
                      <div style={{ padding: '0 4px', borderStyle: 'solid', borderRadius: 4, marginRight: 8, borderWidth: 1, borderColor: templateStyle.color, color: templateStyle.color }}>{templateStyle.text}</div>
                      <div style={{ marginRight: 'auto' }}>{`${v.get('number')}－${v.get('title')}`}</div>
                      <TrashIcon onClick={() => this.handleRemoveAnnouncementRelationship(v)}/>
                    </div>
                  )
                })
              }
            </div>
          ) : null
        }
      </div>
    )
  }

  renderRelatedWorkField() {
    return (
      <div className={styles.relatedWork}>
        <div className={styles.label}>
          <div>关键工作：</div>
          <div className={styles.button} onClick={() => this.setState({ showCreateKeyWorkModal: true })}>创建关键工作</div>
        </div>

        <div className={styles.workList}>
          {
            this.state.workList.map((v, k) => {
              const menu = (
                <Menu onClick={({ key }) => this.handleChangeWorkState(v.get('announcementTaskId'), key)}>
                  {workStateList.map((v) => (
                    <Menu.Item key={v.get('state')}>
                      {v.get('text')}
                    </Menu.Item>
                  ))}
                </Menu>
              )

              return (
                <div className={styles.workItem} key={k}>
                  <WorkTypeIcon type={v.get('type')} />
                  <div
                    style={{ marginRight: 'auto', cursor: 'pointer' }}
                    onClick={() => this.setState({ showWorkInfo: v })}
                  >
                    {v.get('name')}
                  </div>
                  <Dropdown trigger={['click']} overlay={menu}>
                    <div>
                      {workStateList.find((w) => v.get('state') == w.get('state')).get('text')} <Icon type="down" style={{ display: 'inline-block', marginLeft: 1, marginRight: 5 }}/>
                    </div>
                  </Dropdown>
                </div>
              )
            })
          }
        </div>
      </div>
    )
  }

  render() {
    if (!this.state.announcement) return null

    return (
      <Modal
        visible
        closable={false}
        title={this.renderHeader()}
        footer={null}
      >
        {this.state.showAddAnnouncementRelationModal ? (
          <AddAnnouncementRelationModal
            onCancel={() => {
              this.fetchDetail(this.props.affair, this.props.announcement)
              this.setState({ showAddAnnouncementRelationModal: false })
            }}
            affair={this.props.affair}
            announcementList={this.props.announcementList}
            announcement={this.state.announcement}
          />
        ) : null}

        {this.state.showWorkInfo ? (
          <WorkDetailModal
            affair={this.props.affair}
            announcement={this.props.announcement}
            initialWork={this.state.showWorkInfo}
            workList={this.state.workList}
            onClose={() => this.setState({ showWorkInfo: null })}
          />
        ) : null}

        {this.state.showCreateKeyWorkModal ? (
          <CreateWorkModal
            announcementId={this.state.announcement.get('announcementId')}
            affairId={this.props.affair.get('id')}
            roleId={this.props.affair.get('roleId')}
            onCancelCallback={() => this.setState({ showCreateKeyWorkModal: false })}
            submitCallback={() => {
              this.setState({
                showCreateKeyWorkModal: false,
              })
              this.fetchWorks()
            }}
          />
        ) : null}

        <div className={styles.content}>
          {this.renderAnnouncemenetContent()}
          {this.renderTabgs()}
          <div className={styles.splitLine} />
          {this.renderOfficialField()}
          {this.renderDurationField()}
          {this.renderRelatedAnnouncementField()}
          {this.renderRelatedWorkField()}
        </div>
      </Modal>
    )
  }
}

export default connect(null, (dispatch) => ({ pushURL: bindActionCreators(pushURL, dispatch) }))(AnnouncementDetailModal)
