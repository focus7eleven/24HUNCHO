import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { PlanTimeline } from 'svg'
import { Button } from 'antd'
import { Map, List, fromJS } from 'immutable'
import { Select } from 'antd'
import AnnouncementDetailModal from './AnnouncementDetailModal'
import styles from './AffairPlanContainer.scss'
import PlanTimelineContainer from './PlanTimeline'
import { getAffairInfo, getAffairRoles } from '../../actions/affair'
import { fetchAffairPermission } from '../../actions/auth'
import { fetchDraftDetail } from '../../actions/announcement'
import { RoleItem, RoleSelector } from '../../components/role/RoleSelector'
import CreateAnnouncementModal from '../announcement/create/CreateAnnouncementModal'
import InnerAnnouncement from '../announcement/inner/InnerAnnouncement'
import config from '../../config'

const Option = Select.Option

class AffairPlanComponent extends React.Component {
  state = {
    announcementType: -1, // 当前展示的发布类型筛选器
    announcementState: -1, // 当前展示的发布状态筛选器

    selectAllRoles: true, // 默认选中所有角色
    selectedRoleList: List(),

    showCreateAnnouncementModal: false, // 创建发布模态框

    announcementList: List(), // 当前事务的发布列表

    showAnnouncementDetail: null, // 当前展示的公告详情

    initialDraft: null, // 编辑准备发布的草稿
  }

  componentWillMount() {
    this.props.getAffairInfo(this.props.params.id, '').then((json) => {
      return json.data
    }).then((data) => {
      this.props.fetchAffairPermission(data.id, data.roleId)
      this.props.getAffairRoles(data.roleId, data.id, true)
      this.fetchAnnouncementList(data.id, data.roleId)
    })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.params.id != this.props.params.id) {
      this.setState({
        selectAllRoles: true,
      })

      this.props.getAffairInfo(nextProps.params.id, '').then((json) => {
        if (json.code === 0) {
          this.props.fetchAffairPermission(json.data.id, json.data.roleId)
          this.props.getAffairRoles(json.data.roleId, json.data.id, true)
        }
      })
    }
  }

  fetchAnnouncementList(affairId, roleId) {
    fetch(config.api.announcement.inner(), {
      method: 'POST',
      affairId,
      roleId,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        state: '1',
        containChild: false,
        isRich: true,
        limit: 100,
      }),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        const data = json.data

        this.setState({
          announcementList: fromJS(data.list)
        })
      }
    })
  }

  handleDeleteDraft = (draft) => {
    const data = new FormData()
    data.append('draftId', draft.id)

    return fetch(config.api.announcement.draft.delete, {
      method: 'POST',
      credentials: 'include',
      body: data,
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json())
  }

  handleChangeSelectedRoleList = (roles) => {
    this.setState({
      selectAllRoles: false || roles.size === 0,
      selectedRoleList: roles,
    })
  }

  handleSendDraft = (draftId) => {
    fetchDraftDetail(draftId, this.props.affair).then((res) => {
      this.setState({
        initialDraft: res.data,
        showCreateAnnouncementModal: true,
      })
    })
  }

  announcementFilter = (announcement) => {
    return (
      (this.state.announcementType === -1 ||
      this.state.announcementType === announcement.get('plateType')) &&
      (this.state.announcementState === -1 ||
      this.state.announcementState === announcement.get('state'))
    )
  }

  renderHeader() {
    const {
      affair,
      currentRole,
    } = this.props

    return (
      <div className={styles.header}>
        <div className={styles.left}>
          <PlanTimeline style={{ marginRight: 10, width: 32, height: 32 }} />
          <div>{`${affair.get('name')}的计划`}</div>
        </div>
        <div className={styles.right}>
          {currentRole ? <RoleItem role={currentRole} /> : null}
          <Button style={{ marginLeft: 20 }} onClick={() => this.props.history.push(`/workspace/affair/${affair.get('id')}`)}>退出</Button>
        </div>
      </div>
    )
  }
  renderAnnouncementTypeSelector() {
    return (
      <Select style={{ marginRight: 10 }} value={this.state.announcementType} onChange={(val) => this.setState({ announcementType: val })}>
        <Option value={-1}><span className={styles.selectTipText}>发布类型：</span>所有发布</Option>
        <Option value={0}><span className={styles.selectTipText}>发布类型：</span>普通发布</Option>
        <Option value={1}><span className={styles.selectTipText}>发布类型：</span>BUG发布</Option>
        <Option value={2}><span className={styles.selectTipText}>发布类型：</span>需求发布</Option>
      </Select>
    )
  }
  renderAnnouncementStateSelector() {
    return (
      <Select style={{ marginRight: 10 }} value={this.state.announcementState} onChange={(val) => this.setState({ announcementState: val })}>
        <Option value={-1}><span className={styles.selectTipText}>发布状态：</span>所有状态</Option>
        <Option value={0}><span className={styles.selectTipText}>发布状态：</span>未开始</Option>
        <Option value={1}><span className={styles.selectTipText}>发布状态：</span>进行中</Option>
        <Option value={2}><span className={styles.selectTipText}>发布状态：</span>已完成</Option>
      </Select>
    )
  }
  renderFistRow() {
    const {
      roleList,
      affair,
    } = this.props
    const {
      selectedRoleList,
      selectAllRoles,
    } = this.state

    return (
      <div className={styles.firstRow}>
        <div>
          {this.renderAnnouncementTypeSelector()}
          {this.renderAnnouncementStateSelector()}
          <RoleSelector
            selectAllRoles={selectAllRoles}
            roleList={roleList}
            selectedRoleList={selectedRoleList}
            className={styles.roleSelector}
            onChange={this.handleChangeSelectedRoleList}
            renderSelectedAsText
          />
        </div>
        <div>
          <Button type="primary" onClick={() => this.setState({ showCreateAnnouncementModal: true })}>创建发布</Button>
          {this.state.showCreateAnnouncementModal && (
            <CreateAnnouncementModal
              onClose={() => {
                if (!this.state.initialDraft) {
                  this._planTimeline.fetchDraftList()
                }

                this.setState({ showCreateAnnouncementModal: false, initialDraft: null })
              }}
              onSucceed={() => {
                this.fetchAnnouncementList(affair.get('id'), affair.get('roleId'))
                this._planTimeline.fetchRoleTypeAnnouncement()

                if (this.state.initialDraft) {
                  this.handleDeleteDraft(this.state.initialDraft).then(() => {
                    this._planTimeline.fetchDraftList()
                  })
                }
              }}
              confirmDraft
              affairId={affair.get('id')}
              roleId={affair.get('roleId')}
              allianceId={affair.get('allianceId')}
              initialDraft={this.state.initialDraft}
            />
          )}
        </div>
      </div>
    )
  }
  renderSecondRow() {
    return (
      <div className={styles.secondRow}>
        <div className={styles.timeline}>
          <PlanTimelineContainer
            affair={this.props.affair}
            onClickAnnouncement={(announcement) => this.setState({ showAnnouncementDetail: announcement })}
            onClickTask={() => {}}
            onSendDraft={this.handleSendDraft}
            currentEditAnnouncement={this.state.showAnnouncementDetail}
            announcementType={this.state.announcementType}
            announcementFilter={this.announcementFilter}
            selectedRoleList={this.state.selectedRoleList}
            ref={(ref) => {
              if (ref) {
                this._planTimeline = ref
              }
            }}
          />
        </div>
        {this.renderAnnouncementList()}
      </div>
    )
  }
  renderAnnouncementList() {
    return (
      <div className={styles.announcementList}>
        <div className={styles.label}>发布列表：</div>

        {
          this.state.announcementList.filter((v) => !v.get('startTime') && !v.get('endTime')).map((announcement) => (
            <InnerAnnouncement
              key={announcement.get('id')}
              className={styles.announcementItem}
              announcement={announcement}
              affairId={this.props.affair.get('id')}
              onClick={() => this.setState({ showAnnouncementDetail: announcement })}
            />
          ))
        }
      </div>
    )
  }
  renderAnnouncementDetail() {
    if (!this.state.showAnnouncementDetail) return null

    const {
      affair,
    } = this.props

    return (
      <AnnouncementDetailModal
        affair={affair}
        announcement={this.state.showAnnouncementDetail}
        announcementList={this.state.announcementList}
        onClose={() => {
          this.fetchAnnouncementList(affair.get('id'), affair.get('roleId'))
          this.setState({ showAnnouncementDetail: null })
        }}
      />
    )
  }
  render() {
    if (!this.props.affair) return null

    return (
      <div className={styles.container}>
        {this.renderHeader()}
        {this.renderFistRow()}
        {this.renderSecondRow()}
        {this.renderAnnouncementDetail()}
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  const affair = state.getIn(['affair', 'affairMap', props.params.id])

  if (!affair) {
    return {
      currentRole: null, // 当前角色视角。
      affair: null,
      roleList: List(), // 当前事务内的角色列表。
    }
  } else {
    const role = state.getIn(['user', 'roles']).find((v) => v.get('roleId') === affair.get('roleId'))
    const user = state.get('user')
    const rolesMap = state.getIn(['affair', 'affairAttender', 'currentRoles', affair.get('id')])

    return {
      currentRole: affair && role ? new Map({
        roleId: role.get('roleId'),
        roleTitle: role.get('roleName'),
        username: user.get('username'),
        avatar: user.get('avatar'),
      }) : null,
      affair,
      roleList: rolesMap ? fromJS(rolesMap.roles) : List()
    }
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getAffairInfo: bindActionCreators(getAffairInfo, dispatch),
    getAffairRoles: bindActionCreators(getAffairRoles, dispatch),
    fetchAffairPermission: bindActionCreators(fetchAffairPermission, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AffairPlanComponent)
