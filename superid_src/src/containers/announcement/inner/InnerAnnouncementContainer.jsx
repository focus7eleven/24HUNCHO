import React from 'react'
import { connect } from 'react-redux'
import { fromJS, List } from 'immutable'
import { bindActionCreators } from 'redux'
import { Switch, Button, Input, Select, DatePicker, Tooltip, Modal } from 'antd'
import { SearchIcon, AxisIcon, TemplateIcon, LoadingIcon } from 'svg'
import styles from './InnerAnnouncementContainer.scss'
import { fetchDraftList, deleteDraft, fetchDraftDetail } from '../../../actions/announcement'
import InnerAnnouncement, { VISION, TEMPLATE, TEMPLATE_ATTRS } from './InnerAnnouncement'
import CreateAnnouncementModal from '../create/CreateAnnouncementModal'
import { RoleSelector } from 'components/role/RoleSelector'
import { ANNOUNCEMENT_TYPE, ANNOUNCEMENT_TYPE_NAME, ANNOUNCEMENT_TYPE_NAME_ALL } from '../AnnouncementFilterModal'
import config from '../../../config'
import messageHandler from 'messageHandler'
import moment from 'moment'
import imageNoRelease from 'images/img_no_release.png'
import PERMISSION from 'utils/permission'

const Option = Select.Option
const RangePicker = DatePicker.RangePicker

const TEMPLATE_ALL = {
  index: -1,
  name: '全部',
}

const InnerAnnouncementContainer = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired,
  },
  getInitialState() {
    return {
      containChild: false,
      draftModalVisible: false,
      vision: VISION.BRIEF,
      showCreateAnnouncementModal: false,
      announcementList: List(),
      hasMore: false,
      isLoading: false,
      filters: {
        keyword: '',
        plateType: `${TEMPLATE_ALL.index}`,
        dateRange: [],
        announcementType: ANNOUNCEMENT_TYPE.PROGRESS,
        roleList: List(),
        selectedRoleList: List(),
      },
      initialDraft: null,
    }
  },
  componentWillMount(){
    this.onSearch()
    this.props.fetchDraftList(this.props.affair)
    this.fetchMainRoles()
  },
  componentWillReceiveProps(nextProps){
    if (nextProps.affair && nextProps.affair.get('id') != this.props.affair.get('id')) {
      this.onSearch(nextProps)
      this.props.fetchDraftList(nextProps.affair)
      this.fetchMainRoles()
      this.setState({ draftModalVisible: false })
    }
  },
  componentWillUpdate(nextProps, nextState) {
    if (this.state.showCreateAnnouncementModal && !nextState.showCreateAnnouncementModal) {
      this.props.fetchDraftList(nextProps.affair)
    }
  },
  fetchMainRoles(){
    const { affair } = this.props
    fetch(config.api.affair.role.affair_roles(), {
      method: 'GET',
      credentials: 'include',
      roleId: affair.get('roleId'),
      affairId: affair.get('id'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          filters: {
            ...this.state.filters,
            roleList: fromJS(json.data || [])
          }
        })
      }
    })
  },
  onSearch(nextProps){
    this.setState({
      isLoading: true,
    })

    const { affair } = nextProps || this.props
    const { filters, vision, containChild } = this.state
    let sDate, eDate
    if (filters.dateRange.length != 0){
      sDate = new Date(filters.dateRange[0].valueOf())
      eDate = new Date(filters.dateRange[1].valueOf())
      sDate.setHours(0)
      sDate.setMinutes(0)
      sDate.setSeconds(0)
      eDate.setHours(23)
      eDate.setMinutes(59)
      eDate.setSeconds(59)
    }
    fetch(config.api.announcement.inner(), {
      method: 'POST',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        containChild: containChild,
        content: (filters.keyword && filters.keyword != '') ? filters.keyword : null,
        isRich: vision === VISION.DEFAULT,
        plateType: filters.plateType,
        startTime: filters.dateRange.length != 0 ? sDate.getTime() : null,
        endTime: filters.dateRange.length != 0 ? eDate.getTime() : null,
        state: filters.announcementType,
        roleIds: filters.selectedRoleList.map((role) => role.get('roleId')).toJS(),
        lastTime: null,
        limit: 10,
      }),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        const announcementList = fromJS(json.data.list)

        this.setState({
          announcementList,
          hasMore: json.data.hasMore,
          isLoading: false,
        })
      }
    })
  },
  handleLoadSearchMore() {
    this.setState({
      isLoading: true,
    })

    const { affair } = this.props
    const { filters, vision, containChild } = this.state
    let sDate, eDate
    if (filters.dateRange.length != 0){
      sDate = new Date(filters.dateRange[0].valueOf())
      eDate = new Date(filters.dateRange[1].valueOf())
      sDate.setHours(0)
      sDate.setMinutes(0)
      sDate.setSeconds(0)
      eDate.setHours(23)
      eDate.setMinutes(59)
      eDate.setSeconds(59)
    }
    fetch(config.api.announcement.inner(), {
      method: 'POST',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        containChild: containChild,
        content: (filters.keyword && filters.keyword != '') ? filters.keyword : null,
        isRich: vision === VISION.DEFAULT,
        plateType: filters.plateType,
        startTime: filters.dateRange.length != 0 ? sDate.getTime() : null,
        endTime: filters.dateRange.length != 0 ? eDate.getTime() : null,
        state: filters.announcementType,
        roleIds: filters.selectedRoleList.map((role) => role.get('roleId')).toJS(),
        lastTime: this.state.announcementList.last().get('modifyTime'),
        limit: 15,
      }),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        const announcementList = fromJS(json.data.list)

        this.setState({
          announcementList: this.state.announcementList.concat(announcementList),
          hasMore: json.data.hasMore,
          isLoading: false,
        })
      }
    })
  },
  onContainChild(val) {
    this.setState({
      containChild: val
    }, this.onSearch)
  },
  /* 选择精简视图或者缩略视图 */
  onVisionChange(vision) {
    this.setState({
      vision
    }, this.onSearch)
  },
  onSearchTextChange(e) {
    this.setState({
      filters: {
        ...this.state.filters,
        keyword: e.target.value,
      }
    }, this.onSearch)
  },
  /*
  * 筛选发布模板类型
  * @param index:String(Number) 发布模板枚举值
  */
  onPlateTypeChange(index) {
    this.setState({
      filters: {
        ...this.state.filters,
        plateType: Number.parseInt(index)
      }
    }, this.onSearch)
  },
  onAnnouncementTypeChange(announcementType) {
    this.setState({
      filters: {
        ...this.state.filters,
        announcementType
      }
    }, this.onSearch)
  },
  /*
  * @param dates:Array<moment>
  */
  onDateRangeChange(dates) {
    this.setState({
      filters: {
        ...this.state.filters,
        dateRange: dates,
      }
    }, this.onSearch)
  },
  onFilterRoleChange(selectedRoleList) {
    this.setState({
      filters: {
        ...this.state.filters,
        selectedRoleList,
      }
    }, this.onSearch)
  },
  handleDraftBox() {
    this.setState({
      draftModalVisible: true
    })
  },
  handleDeleteDraft(e) {
    const draftId = e.currentTarget.getAttribute('data-draftId')
    this.props.deleteDraft(draftId, this.props.affair)
  },
  handleEditDraft(draftId) {
    fetchDraftDetail(draftId, this.props.affair).then((res) => this.setState({
      initialDraft: res.data,
      showCreateAnnouncementModal: true,
      draftModalVisible: false,
    }))
  },
  handleCreateAnnouncement() {
    this.onSearch()
  },
  renderFilterTip(){
    const { announcementType, selectedRoleList } = this.state.filters
    if (announcementType === ANNOUNCEMENT_TYPE.PROGRESS && selectedRoleList.size === 0){
      return
    }

    let advancedFilterList = List()
    if (announcementType === ANNOUNCEMENT_TYPE.ALL) {
      advancedFilterList = advancedFilterList.push(ANNOUNCEMENT_TYPE_NAME_ALL)
    } else if (announcementType === ANNOUNCEMENT_TYPE.INVALID) {
      advancedFilterList = advancedFilterList.push(ANNOUNCEMENT_TYPE_NAME.INVALID)
    }
    if (selectedRoleList.size !== 0) {
      let roleNames = selectedRoleList.map((role) => role.get('roleTitle')).toJS().join('、')
      roleNames = roleNames.length > 20 ? roleNames.slice(0, 18) + '...' : roleNames
      advancedFilterList = advancedFilterList.push(roleNames)
    }
    return (
      <div className={styles.filterTip}>
        根据高级筛选{advancedFilterList.map((str) => `“${str}”`).toJS().join('、')}搜索结果如下：
      </div>
    )
  },
  renderDraftModal() {
    return (
      <Modal ref="modal"
        visible={this.state.draftModalVisible && !!this.props.draft.size}
        title="草稿"
        onCancel={() => {this.setState({ draftModalVisible: false, initialDraft: null })}}
        footer={null}
      >
        <div className={styles.draftBox}>
          {
            (this.props.draft || List()).map((item, k) => {
              return (
                <div className={styles.draftItem} key={k}>
                  <span className={styles.title}>{!item.get('title') ? '无标题' : item.get('title')}</span>
                  <div className={styles.operations}>
                    <span className={styles.time}>{moment(item.get('modifyTime')).format('YYYY-MM-DD HH:mm')}</span>
                    <a data-draftId={item.get('id')} onClick={() => this.handleEditDraft(item.get('id'))}>编辑</a>
                    <a data-draftId={item.get('id')} onClick={this.handleDeleteDraft}>删除</a>
                  </div>
                </div>
              )
            })
          }
        </div>
      </Modal>
    )
  },
  render() {
    const { containChild, vision, announcementList, isLoading } = this.state
    const { affair, draft } = this.props

    return (
      <div className={styles.container}>
        {this.renderDraftModal()}

        <div className={styles.header}>
          <div className={styles.title}>{`${this.props.affair.get('name')}内部发布`}</div>
          <div className={styles.optionGroup}>
            <div className={styles.checkGroup}>
              <div>包含子事务</div>
              <Switch checkedChildren="开" unCheckedChildren="关" value={containChild} onChange={this.onContainChild}/>
            </div>
            {draft && draft.size ? <div style={{ color: '#9b9b9b', fontSize: 14, cursor: 'pointer', marginLeft: 20 }} onClick={this.handleDraftBox}>草稿({draft.size})</div> : null}
            {affair.validatePermissions(PERMISSION.CREATE_PUBLISH) ? (
              <Button style={{ marginLeft: 20 }} type="primary" onClick={() => this.setState({ showCreateAnnouncementModal: true })}>创建发布</Button>
            ) : null}
          </div>
        </div>
        <div className={styles.body}>
          <div className={styles.toolGroup}>
            <div className={styles.filterGroup}>
              <div className={styles.typeField}>
                <div className={styles.label}>类型：</div>
                <Select defaultValue={`${TEMPLATE_ALL.index}`} onChange={this.onPlateTypeChange}>
                  <Option key={TEMPLATE_ALL.index} value={`${TEMPLATE_ALL.index}`}>{TEMPLATE_ALL.name}</Option>
                  {Object.values(TEMPLATE).map((val) => {
                    const text = TEMPLATE_ATTRS[val].typeName || TEMPLATE_ATTRS[val].text
                    return (
                      <Option key={val} value={`${val}`}>{text}</Option>
                    )
                  })}
                </Select>
              </div>
              <div className={styles.divider} />
              <div className={styles.typeField + ' ' + styles.typeFieldWider}>
                <div className={styles.label}>状态：</div>
                <Select defaultValue={`${ANNOUNCEMENT_TYPE.PROGRESS}`} onChange={this.onAnnouncementTypeChange}>
                  <Option key={ANNOUNCEMENT_TYPE.ALL} value={`${ANNOUNCEMENT_TYPE.ALL}`}>{ANNOUNCEMENT_TYPE_NAME.ALL}</Option>
                  <Option key={ANNOUNCEMENT_TYPE.READY} value={`${ANNOUNCEMENT_TYPE.READY}`}>{ANNOUNCEMENT_TYPE_NAME.READY}</Option>
                  <Option key={ANNOUNCEMENT_TYPE.PROGRESS} value={`${ANNOUNCEMENT_TYPE.PROGRESS}`}>{ANNOUNCEMENT_TYPE_NAME.PROGRESS}</Option>
                  <Option key={ANNOUNCEMENT_TYPE.COMPLETE} value={`${ANNOUNCEMENT_TYPE.COMPLETE}`}>{ANNOUNCEMENT_TYPE_NAME.COMPLETE}</Option>
                  <Option key={ANNOUNCEMENT_TYPE.INVALID} value={`${ANNOUNCEMENT_TYPE.INVALID}`}>{ANNOUNCEMENT_TYPE_NAME.INVALID}</Option>
                </Select>
              </div>
              <div className={styles.divider} />
              <div className={styles.typeField}>
                <div className={styles.label}>角色：</div>
                <RoleSelector
                  className={styles.roleSelector}
                  roleList={this.state.filters.roleList}
                  onChange={this.onRoleChange}
                  selectedRoleList={this.state.filters.selectedRoleList}
                  onChange={this.onFilterRoleChange}
                >
                  <div className={styles.selectorText}>
                    {this.state.filters.selectedRoleList.size == 0 ?
                      '全部'
                    : (
                      this.state.filters.selectedRoleList.map((item) => item.get('roleTitle') + '－' + item.get('username')).toJS().join('、')
                    )}
                  </div>
                </RoleSelector>
              </div>
              <div className={styles.divider} />
              <div className={styles.typeField}>
                <div className={styles.label}>起止时间：</div>
                <RangePicker value={this.state.filters.dateRange} onChange={this.onDateRangeChange} />
              </div>
              <div className={styles.divider} />
              <div className={styles.searchField}>
                <SearchIcon />
                <Input placeholder="搜索关键词" value={this.state.filters.keyword} onChange={this.onSearchTextChange} />
              </div>
            </div>
            <div className={styles.viewGroup}>
              <Tooltip placement="top" title="精简显示">
                <div onClick={() => this.onVisionChange(VISION.BRIEF)}>
                  <AxisIcon data-selected={vision == VISION.BRIEF} />
                </div>
              </Tooltip>
              <Tooltip placement="top" title="缩略显示">
                <div onClick={() => this.onVisionChange(VISION.DEFAULT)}>
                  <TemplateIcon data-selected={vision == VISION.DEFAULT} />
                </div>
              </Tooltip>
            </div>
          </div>
          <div className={styles.listContainer}>
            {announcementList.map((announcement, index) => {
              return (
                <InnerAnnouncement
                  key={index}
                  affairId={this.props.affair.get('id')}
                  announcement={announcement}
                  vision={vision}
                  handleEditDraft={this.handleEditDraft}
                />
              )
            }).push(this.state.hasMore ? <div key="loademore" className={styles.loadmore} onClick={this.handleLoadSearchMore}>{this.state.isLoading ? <LoadingIcon /> : null}加载更多</div> : null)}
            {(announcementList.size === 0 && !isLoading) &&
              <div className={styles.noAnnouncement}>
                <img key="img" src={imageNoRelease}/>
                <div key="text">暂无发布</div>
              </div>
            }
          </div>
        </div>
        {this.state.showCreateAnnouncementModal &&
          <CreateAnnouncementModal
            onClose={() => this.setState({ showCreateAnnouncementModal: false, initialDraft: null })}
            onSucceed={this.handleCreateAnnouncement}
            affairId={this.props.affair.get('id')}
            roleId={this.props.affair.get('roleId')}
            allianceId={this.props.affair.get('allianceId')}
            initialDraft={this.state.initialDraft}
          />
        }
      </div>
    )
  },
})

export default connect((state, props) => {
  const draft = state.getIn(['announcement', 'draft', props.params.id]) || List()

  return {
    affair: state.getIn(['affair', 'affairMap', props.params.id]),
    draft,
  }
}, (dispatch) => {
  return {
    fetchDraftList: bindActionCreators(fetchDraftList, dispatch),
    deleteDraft: bindActionCreators(deleteDraft, dispatch),
  }
})(InnerAnnouncementContainer)
