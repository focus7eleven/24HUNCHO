import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fetchDraftList, deleteDraft, toggleContainerChildrenAnnouncements } from '../../actions/announcement'
import styles from './AnnouncementListContainer.scss'
import { Modal, DatePicker, Switch, Button, Input, Select, Alert, Popover } from 'antd'
import { SearchIcon } from 'svg'
import { List } from 'immutable'
import AnnouncementList from './AnnouncementList'
import moment from 'moment'
import { PERMISSION_MAP } from 'permission'
import PublishTaskModal from '../task/PublishTaskModal'
import NormalPublishModal from './NormalPublishModal'
import { Motion, spring } from 'react-motion'
import { pushURL } from 'actions/route'

const RangePicker = DatePicker.RangePicker
const Option = Select.Option
const SORT_TYPE_TIME = 'time'


const AnnouncementListComponent = React.createClass({
  contextTypes: {
    affair: React.PropTypes.object,
  },
  getInitialState() {
    return {
      draftModalVisible: false,
      sortType: SORT_TYPE_TIME,
      isDraftAlertShow: false,
      beginTime: null,
      endTime: null,
      showPublishType: false,
      showPublishModal: false,
      showNormalPublish: false,
      queryString: '',
      currentTab: 0, //0代表所有全部发布，1代表历史发布
    }
  },
  componentDidMount() {
    // 获取草稿列表。
    if (this.props.memberId) {
      this.props.fetchDraftList(this.props.affair)
    }
  },
  componentWillUpdate(nextProps) {
    // 获取草稿列表。
    if (!this.props.memberId && nextProps.memberId) {
      this.props.fetchDraftList(nextProps.affair)
    }

    if (this.props.draft.size !== nextProps.draft.size) {
      this.setState({
        isDraftAlertShow: !!nextProps.draft.size,
      })
    }
  },

  // Handler
  handleChildrenSwitch() {
    this.props.toggleContainerChildrenAnnouncements()
  },
  handleDateChange(date, dateString) {
    if ((new Date(dateString[0]).getTime()) !== (new Date(dateString[0]).getTime())){
      this.setState({
        beginTime: null,
        endTime: null
      })
    }
    else {
      let beginTime = new Date(dateString[0])
      let endTime = new Date(dateString[1])
      beginTime.setHours(0, 0, 0)
      endTime.setHours(23, 59, 59)
      this.setState({
        beginTime: beginTime.getTime(),
        endTime: endTime.getTime()
      })
    }
  },
  handleChangeSortType(value){
    this.setState({
      sortType: value
    })
  },
  handleDraftBox() {
    this.setState({
      draftModalVisible: true
    })
  },
  handlePublishEntrance() {
    this.props.pushURL(`/workspace/affair/${this.props.params.id}/announcement/publish`)
  },
  handleContinueEditDraft() {
    this.props.pushURL(`/workspace/affair/${this.props.params.id}/announcement/draft/${this.props.draft.sort((v) => v.get('modifyTime')).last().get('id')}`)
  },
  handleEditDraft(e) {
    const draftId = e.currentTarget.getAttribute('data-draftId')
    this.props.pushURL(`/workspace/affair/${this.props.params.id}/announcement/draft/${draftId}`)
  },
  handleDeleteDraft(e) {
    const draftId = e.currentTarget.getAttribute('data-draftId')
    this.props.deleteDraft(draftId, this.props.memberId, this.props.affair)
  },

  handlePopoverVisibleChange(visible){
    this.setState({
      showPublishType: visible,
    })
  },
  renderSortTypeMenu(){
    return (
      <Select value={this.state.sortType} onChange={this.handleChangeSortType} size="large" dropdownMatchSelectWidth={false} className={styles.select}>
        <Option value="affair">事务排序</Option>
        <Option value="time">时间排序</Option>
      </Select>
    )
  },

  //Renders

  renderPublishModal(){
    if (this.state.showPublishModal){
      return <PublishTaskModal affair={this.props.affair} taskId={'0'} onClose={() => {this.setState({ showPublishModal: false });this.refs.AnnouncementList.getWrappedInstance().fetchAnnouncementList(this.props.affair, this.props.isContainChildren)}}/>
    }
    else {
      return null
    }
  },
  renderNormalPublish(){
    if (this.state.showNormalPublish){
      return <NormalPublishModal affair={this.props.affair} onClose={() => {this.setState({ showNormalPublish: false });this.refs.AnnouncementList.getWrappedInstance().fetchAnnouncementList(this.props.affair, this.props.isContainChildren)}}/>
    }
    else {
      return null
    }
  },
  renderHeader() {
    let isSearching = this.state.queryString == '' && this.state.beginTime == null && this.state.endTime == null
    const { draft, affair } = this.props

    const publishType = (
      <div className={styles.content}>
        <div className={styles.row} onClick={() => {this.setState({ showNormalPublish: true, showPublishType: false, })}}>普通发布</div>
        <div className={styles.row} onClick={() => {this.setState({ showPublishModal: true, showPublishType: false })}}>富文本发布</div>
      </div>
    )

    return (<div className={styles.header}>
      <div>
        {/* 搜索发布 */}
        <div className={styles.searchField}>
          <Input placeholder={'请输入关键词'} value={this.state.queryString} onChange={(e) => {this.setState({ queryString: e.target.value })}} />
          <span className={styles.searchIcon}><SearchIcon/></span>
        </div>

        <RangePicker style={{ width: 200, marginLeft: 10 }} onChange={this.handleDateChange} />
        <div style={{ color: '#4a4a4a', marginLeft: 13 }}>包含子事务</div>
        <Switch style={{ marginLeft: 10 }} checked={this.props.isContainChildren} checkedChildren="开" unCheckedChildren="关" onChange={this.handleChildrenSwitch}/>
        {isSearching && this.props.isContainChildren ? this.renderSortTypeMenu() : null}
      </div>

      <div>
        {draft && draft.size ? <div style={{ color: '#9b9b9b', marginRight: 20, cursor: 'pointer' }} onClick={this.handleDraftBox}>草稿({draft.size})</div> : null}
        {
          affair.hasPermission(PERMISSION_MAP.PUBLISH_ANNOUNCEMENT) ? (
            <Popover placement="bottom" content={publishType} trigger="click" visible={this.state.showPublishType} onVisibleChange={this.handlePopoverVisibleChange} overlayClassName={styles.publishTypeContainer}>
              <Button type="primary" size="large" className={styles.publishBtn}>创建发布</Button>
            </Popover>
          ) : null
        }
      </div>
    </div>)
  },

  render: function() {
    let isSearching = !(this.state.queryString == '' && this.state.beginTime == null && this.state.endTime == null)
    const affair = this.props.affair
    if (!affair) return null

    const {
      sortType,
      endTime,
      beginTime,
      queryString,
      isDraftAlertShow,
      currentTab,
    } = this.state
    const draftAlertMessage = <span>您有未发布的发布，继续编辑？<span style={{ color: '#4a90e2', cursor: 'pointer' }} onClick={this.handleContinueEditDraft}>进入编辑</span></span>

    return (
      <div className={styles.container}>
        <div className={styles.left}>
          <div className={currentTab == 0 ? styles.chosenType : styles.otherType} onClick={() => {this.setState({ currentTab: 0, sortType: SORT_TYPE_TIME, beginTime: null, endTime: null, queryString: '' })}}>
            全部发布
          </div>
          <div className={currentTab == 1 ? styles.chosenType : styles.otherType} onClick={() => {this.setState({ currentTab: 1, sortType: SORT_TYPE_TIME, beginTime: null, endTime: null, queryString: '' })}}>
            历史发布
          </div>
          <Motion style={{ top: spring(10 + currentTab * 37) }}>
            {
              (style) => <div className={styles.rightLine} style={{ top: `${style.top}px` }} />
            }
          </Motion>
        </div>
        <div className={styles.right}>
          {this.renderHeader()}

          {/* 发布列表 */}
          <AnnouncementList affair={affair} isContainChildren={this.props.isContainChildren} sortType={sortType} beginTime={beginTime} endTime={endTime} queryString={queryString} ref="AnnouncementList" isSearching={isSearching} state={this.state.currentTab}/>
          {/*affair && affair.hasPermission(PERMISSION_MAP.PUBLISH_ANNOUNCEMENT) ? <AnnouncementList affair={affair} isContainChildren={isContainChildren} sortType={sortType} beginTime={beginTime} endTime={endTime} queryString={queryString} ref="AnnouncementList" /> : null */}
          {/*affair && !affair.hasPermission(PERMISSION_MAP.PUBLISH_ANNOUNCEMENT) ? <div className={styles.noPermission}><img src={imageNoPermission} /><div>您无权限查看该页面</div></div> : null */}

          {/* 未完成草稿提示 */}
          {isDraftAlertShow ?
            <Alert
              closable
              showIcon
              message={draftAlertMessage}
              type="warning"
              onClose={() => this.setState({ isDraftAlertShow: false })}
            />
          : null
          }
        </div>


        <Modal ref="modal"
          visible={this.state.draftModalVisible}
          title="草稿" onCancel={() => this.setState({ draftModalVisible: false })}
          footer={null}
        >
          <div className={styles.draftBox}>
            {
							(this.props.draft || List()).map((item, k) => {
  return (<div className={styles.draftItem} key={k}>
    <span className={styles.title}>{!item.get('title') ? '无标题' : item.get('title')}</span>
    <div className={styles.operations}>
      <span className={styles.time}>{moment(item.get('modifyTime')).format('YYYY-MM-DD HH:mm')}</span>
      <a data-draftId={item.get('id')} onClick={this.handleEditDraft}>编辑</a>
      <a data-draftId={item.get('id')} onClick={this.handleDeleteDraft}>删除</a>
    </div>
  </div>)
})
						}
          </div>
        </Modal>
        {this.renderPublishModal()}
        {this.renderNormalPublish()}
      </div>
    )
  },
})

function mapStateToProps(state, props) {
  const affair = state.getIn(['affair', 'affairMap', props.params.id])
  const memberId = affair.get('affairMemberId')
  const draft = state.getIn(['announcement', 'draft', affair.get('affairMemberId')]) || List()
  const isContainChildren = state.getIn(['announcement', 'isContainChildren'])
  return {
    affair,
    memberId,
    draft,
    isContainChildren,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchDraftList: bindActionCreators(fetchDraftList, dispatch),
    deleteDraft: bindActionCreators(deleteDraft, dispatch),
    toggleContainerChildrenAnnouncements: bindActionCreators(toggleContainerChildrenAnnouncements, dispatch),
    pushURL: bindActionCreators(pushURL, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AnnouncementListComponent)
