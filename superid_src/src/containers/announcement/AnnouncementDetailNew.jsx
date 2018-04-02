import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fromJS, List } from 'immutable'
import { getFileIcon } from 'file'
import { Dropdown, DatePicker, Menu, Tabs, Popover, Checkbox, Message, Icon, Tooltip } from 'antd'
import config from '../../config'
import { MoreIcon, ChangeLogs } from '../../public/svg'
import styles from './AnnouncementDetailNew.scss'
import { OPT_ROLE, PARTICIPANT_TYPE, PUBLIC_TYPE, PublicTypeList } from './constant/AnnouncementConstants'
import moment from 'moment'
import oss from 'oss'
import { pushURL } from 'actions/route'

import differenceHighlighter from './differenceHighlighter'
import { Editor, EditorState, convertFromRaw, convertToRaw } from 'draft-js'
import { inlineStyleMap, getBlockStyle, getBlockRender } from './EditorControl'
import EditorDecorator from './EditorDecorator'
import grayImage from 'images/gray.png'

import { fetchAnnouncementGuest } from '../../actions/announcement'
import { fetchScopeGroups, fetchGuestGroups } from '../../actions/message'


// import FileListContainer from '../file/FileListContainer'
import { TEMPLATE_ATTRS } from './inner/InnerAnnouncement'
import RolesPanel from './participant/RolesPanel'

import AnnouncementMoveModal from './detail/AnnouncementMoveModal'
import CreateAnnouncementModal from './create/CreateAnnouncementModal'
import messageHandler from '../../utils/messageHandler'
import AddGuestModal from './modal/AddGuestModal'
import EditableTagGroup from '../../components/tag/EditableTagGroup'

import AnnouncementChatContainer from '../chat/AnnouncementChatContainer'

import TaskContainer from './task/TaskContainer'
import CommentContainer from './comment/CommentContainer'
import NewsContainer from './news/NewsContainer'
import AttachmentContainer from './attachment/AttachmentContainer'
import SubContainer from './subAnnouncement/SubContainer'

const TabPane = Tabs.TabPane
const TAB_TYPE = {
  COMMENT: '0',
  NEWS: '1',
  WORK: '2',
  FILE: '3',
  SUB_ANNOUNCEMENT: '4',
  PARTICIPANTS: '5',
}

const COMMENT_PERMIT = {
  OPEN: 0,
  HALF: 1,
  CLOSE: 2,
}

const COMMENT_PERMITS = [
  { state: COMMENT_PERMIT.OPEN, text: '开放' },
  { state: COMMENT_PERMIT.HALF, text: '仅官/客方开放' },
  { state: COMMENT_PERMIT.CLOSE, text: '关闭' }
]

const VISION = {
  BRIEF: 0,
  DEFAULT: 1,
}
const AnnouncementDetail = React.createClass({
  childContextTypes: {
    immutableEditor: React.PropTypes.bool,
  },
  getChildContext() {
    return {
      immutableEditor: true,
    }
  },
  getInitialState(){
    return {
      publicType: PUBLIC_TYPE.AFFAIR,
      showAddGuestModal: false,
      publicTypePopoverVisible: false,
      toolDropdown: false,
      showChangeRecord: false, //查看变更记录
      showDifference: false, //显示差异
      // optRoleType: OPT_ROLE.OFFICIAL,
      isLoading: true,
      activeKey: TAB_TYPE.COMMENT,

      announcement: null,

      showAnnouncementMoveModal: false,

      //参与者相关
      guests: fromJS({
        innerAffair: [],
        innerAlliance: [],
        menkor: [],
      }),
      officialList: List(),
      guestList: List(),

      // 正在编辑的公告
      editAnouncement: null,

      // 公告的不同版本
      version: [],

      isEditMode: false,
    }
  },
  //handler
  componentDidMount(){
    const { affair, detailId } = this.props

    this.fetchDetail(affair, detailId)
  },

  componentWillUnmount() {
    this.contentWrapper && this.contentWrapper.removeEventListener('scroll', this.handleScroll)
  },

  componentWillReceiveProps(nextProps){
    if (nextProps.detailId != 0 && nextProps.detailId != this.props.detailId) {
      this.fetchDetail(nextProps.affair, nextProps.detailId)
    }

    if (nextProps.detailId && this.props.affair.get('roleId') !== nextProps.affair.get('roleId')) {
      this.fetchDetail(nextProps.affair, nextProps.detailId)
    }
  },

  fetchDetail(affair, detailId) {
    fetch(config.api.announcement.detail.get(detailId), {
      method: 'GET',
      affairId: affair.get('id'),
      roleId: affair.get('roleId')
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0){
        json.data.permission = []
        const announcement = fromJS(json.data)

        this.setState({
          announcement,
          currentAnnouncement: announcement,
          isLoading: false,
        }, () => {
          this.fetchPermission(affair, detailId)
          this.fetchLists()
        })
      }
    })

    this.handleGetAllVersion(affair, detailId)
  },

  fetchPermission(affair, detailId) {
    fetch(config.api.permission.resourcePermission.get, {
      method: 'POST',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resourceId: detailId,
        roleId: affair.get('roleId'),
        affairId: affair.get('id'),
        resourceType: 'ANNOUNCEMENT',
      }),
    }).then((res) => res.json()).then((json) => {
      if (json && json.operationIdList) {
        this.setState({
          announcement: this.state.announcement.set('permission', fromJS(json.operationIdList))
        })
      }
    })
  },

  fetchLists() {
    /*获取客方列表*/
    this.fetchGuests()
    /*获取官方列表*/
    this.fetchOfficials()
  },

  fetchGuests() {
    const { detailId, affair } = this.props

    fetchAnnouncementGuest(detailId, affair.get('id'), affair.get('roleId')).then((guests) => {
      let guestList = List()
      guestList = guestList
        .concat(guests.get('innerAffair'))
        .concat(guests.get('innerAlliance').map((v) => v.get('roleList')).reduce((r, v) => r.concat(v), List()))
        .concat(guests.get('menkor').map((v) => v.get('roleList')).reduce((r, v) => r.concat(v), List()))
      guestList = guestList.map((v) => v.get('roleId')).toSet().toList().map((v) => guestList.find((w) => w.get('roleId') === v))
      this.setState({
        guestList: guestList,
      })
    })
  },

  fetchOfficials(){
    const { affair, detailId } = this.props

    return fetch(config.api.announcement.detail.officials.get(detailId), {
      method: 'GET',
      affairId: affair.get('id'),
      roleId: affair.get('roleId')
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.setState({
          officialList: fromJS(json.data)
        })
      }
    })
  },

  freshParticipants(){
    this.fetchGuests()
    this.fetchOfficials()
  },
  handleScroll() {
    if (this.state.showChangeRecord) {
      this.setState({
        showChangeRecord: false,
      })
    }
  },


  handleChangeTabs(key){

    this.setState({
      activeKey: key,
    })
  },
  getGuestList() {
    const {
      guests,
    } = this.state

    let guestList = List()
    guestList = guestList
      .concat(guests.get('innerAffair'))
      .concat(guests.get('innerAlliance').map((v) => v.get('roleList')).reduce((r, v) => r.concat(v), List()))
      .concat(guests.get('menkor').map((v) => v.get('roleList')).reduce((r, v) => r.concat(v), List()))
    guestList = guestList.map((v) => v.get('roleId')).toSet().toList().map((v) => guestList.find((w) => w.get('roleId') === v))

    return guestList
  },


  //添加官方
  handleAddOfficial(role){
    const { affair, detailId } = this.props

    fetch(config.api.announcement.detail.officials.post(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      roleId: affair.get('roleId'),
      affairId: affair.get('id'),
      resourceId: detailId,
      body: JSON.stringify({
        affairId: parseInt(affair.get('id')),
        operatorId: affair.get('roleId'),
        allianceId: affair.get('allianceId'),
        announcementId: parseInt(detailId),
        roleIds: [role.get('roleId')]
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0){
        this.freshParticipants()
      }
    })
  },

  //添加客方
  handleAddGuest(chosenMap){
    const affair = this.props.affair
    const announcement = this.state.announcement
    const announcementId = announcement.get('announcementId')
    // {innerAffair: [4091, 3820], innerAlliance: [8359, 8360, 8587], outerAlliance: [8279, 8457]}

    // 新增事务内客方
    let innerAffairReq = fetch(config.api.announcement.detail.guests.role.post, {
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      resourceId: announcementId,
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        announcementId: announcementId,
        roleIds: chosenMap.innerAffair,
        operatorId: affair.get('roleId'),
        allianceId: affair.get('allianceId'),
        affairId: parseInt(affair.get('id')),
      }),
    }).then((res) => res.json())

    // 新增盟内事务客方
    let innerAllianceReq = fetch(config.api.announcement.detail.guests.affair.post, {
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      resourceId: announcementId,
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        announcementId: announcementId,
        toAffairIds: chosenMap.innerAlliance,
        operatorId: affair.get('roleId'),
        allianceId: affair.get('allianceId'),
        affairId: parseInt(affair.get('id')),
        type: 1,
      }),
    }).then((res) => res.json())

    // 新增盟客网事务客方
    let menkorReq = fetch(config.api.announcement.detail.guests.affair.post, {
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      resourceId: announcementId,
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        announcementId: announcementId,
        toAffairIds: chosenMap.outerAlliance,
        operatorId: affair.get('roleId'),
        allianceId: affair.get('allianceId'),
        affairId: parseInt(affair.get('id')),
        type: 2,
      }),
    }).then((res) => res.json()).then(() => {

    })



    this.setState({
      showAddGuestModal: false,
    })
    Promise.all([innerAffairReq, innerAllianceReq, menkorReq]).then(() => {
      this.freshParticipants()

      // 更新发布内讨论组列表
      const isOfficial = announcement.get('memberType') == OPT_ROLE.OFFICIAL
      if (isOfficial) {
        this.props.fetchScopeGroups(announcementId, affair)
      } else {
        this.props.fetchGuestGroups(announcementId, affair)
      }
    })
  },

  //移除官方/客方，移除的角色id和移除的角色类型
  handlePartiDelete(roleId, removeType){
    const { announcement } = this.state
    const { affair, detailId } = this.props

    fetch(config.api.announcement.detail.removeMember(detailId, roleId, announcement.get('memberType')), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: detailId,
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0){
        if (removeType === PARTICIPANT_TYPE.CUSTOMER){
          this.fetchGuests()
        } else if (removeType === PARTICIPANT_TYPE.OFFICIAL) {
          this.fetchOfficials()
        }
      }
    })
  },

  //查看上一版本
  handleGetCurrentVersion(evt) {
    // TODO: fetch version from cache first
    const version = evt.currentTarget.getAttribute('data-version')
    const affairId = this.props.params.id
    const announcementId = this.props.params.announcementid
    const affair = this.props.affair

    // offsetHead: 追溯新版本,0||null代表不追溯
    // offsetTail: 追溯旧版本,0||null代表不追溯
    // version: 要取的 version,0||null代表最新的version
    fetch(config.api.announcement.detail.get(
      announcementId,
      this.state.showDifference && version != 1 ? 1 : 0,
      0,
      this.state.showDifference && version != 1 ? version - 1 : version
    ), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => {
      return res.json()
    }).then((json) => {

      let ann = json.data

      ann['affairId'] = Number.parseInt(affairId)

      this.setState({
        announcement: fromJS(json.data).set('permission', this.state.announcement.get('permission'))
      })
    })
  },

  //显示差异
  handleShowDifferrence() {
    const announcementId = this.props.params.announcementid
    const affair = this.props.affair

    if (!this.state.showDifference) {
      fetch(config.api.announcement.detail.get(announcementId, 1, 0, this.state.announcement.get('version') - 1), {
        method: 'GET',
        credentials: 'include',
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
      }).then((res) => {
        return res.json()
      }).then((json) => {
        let ann = json.data
        ann['affairId'] = Number.parseInt(affair.get('id'))
        this.setState({
          announcement: fromJS(ann).set('permission', this.state.announcement.get('permission')),
          showDifference: true,
        })
      })
    } else {
      this.fetchDetail(affair, announcementId)
      this.setState({
        showDifference: false,
      })
    }
  },

  // 修改公开性
  handleChangePublicType(value) {
    const {
      affair,
    } = this.props

    fetch(config.api.announcement.publicType.update(this.state.announcement.get('announcementId'), value), {
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: this.state.announcement.get('announcementId'),
      method: 'POST',
      credentials: 'include',
    }).then((res) => {
      return res.json()
    }).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.setState({
          announcement: this.state.announcement.set('publicType', value)
        })
        return
      }
    })
  },

  // 失效公告
  handleInvalidPublish() {
    const { affair } = this.props
    const { announcement } = this.state
    fetch(config.api.announcement.invalid(announcement.get('announcementId')), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcement.get('announcementId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        Message.success('发布已失效')
        this.props.pushURL(`/workspace/affair/${this.props.params.id}/announcement`)
      } else {
        Message.error('网络错误')
      }
    })
  },
  handleRecoverPublish() {
    const { affair } = this.props
    const { announcement } = this.state
    fetch(config.api.announcement.recover(announcement.get('announcementId'), false), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcement.get('announcementId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        Message.success('发布已恢复')
        this.fetchDetail(affair, announcement.get('announcementId'))
      } else {
        Message.error('网络错误')
      }
    })
  },

  handleChangeTags(tags) {
    const { affair } = this.props

    fetch(config.api.announcement.tag.update(this.state.announcement.get('announcementId'), JSON.stringify(tags)), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: this.state.announcement.get('announcementId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      return json
    })
  },

  handleGetAllVersion(affair, detailId) {
    fetch(config.api.announcement.version.get(detailId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => {
      return res.json()
    }).then((json) => {
      this.setState({
        version: json.data
      })
    })
  },
  onClickAnnouncementLink(announcement){
    this.props.pushURL(`/workspace/affair/${this.props.params.id}/announcement/detail/${announcement.get('id') || announcement.get('announcementId')}`)
  },

  handleDateRangeChange([startMoment, endMoment]) {
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
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.setState({
          announcement: this.state.announcement
            .set('startTime', startMoment + 0)
            .set('endTime', endMoment + 0)
        })
      }
    })
  },

  renderPublicTypeSelector() {
    return (
      <Menu
        className={styles.publicTypeContainer}
      >
        {PublicTypeList.map((v, k) => {
          return (
            <Menu.Item key={k} className={styles.publicTypePopItem}>
              <div
                className={styles.publicItem}
                onClick={(evt) => {
                  evt.preventDefault()
                  evt.stopPropagation()
                  this.handleChangePublicType(v.get('type'))
                  this.setState({
                    publicTypePopoverVisible: false,
                  })
                }}
              >
                <div>{v.get('name')}</div>
                {this.state.announcement.get('publicType') == v.get('type') && <Icon type="check" /> }
              </div>
            </Menu.Item>
          )
        })}
      </Menu>
    )
  },

  renderAnnouncementMore(){
    return (
      <Menu
        className={styles.popContainer}
        onClick={({ key }) => {
          key == 0 && this.setState({ editAnouncement: this.state.currentAnnouncement })
          key == 1 && this.setState({ showAnnouncementMoveModal: true })
          key == 2 && this.handleInvalidPublish()
          key == 3 && this.handleRecoverPublish()
          this.setState({
            toolDropdown: false,
          })
        }}
      >
        {this.state.announcement.get('permission').some((v) => v == 503) ? (
          <Menu.Item key={0} className={styles.popItem}>编辑发布</Menu.Item>
        ) : null}
        {this.state.announcement.get('permission').some((v) => v == 516) ? (
          <Menu.Item key={1} className={styles.popItem}>移动发布</Menu.Item>
        ) : null}
        {
          this.state.announcement.get('state') != 3 ? (
            this.state.announcement.get('permission').some((v) => v == 506) && <Menu.Item key={2} className={styles.popItem}>失效发布</Menu.Item>
          ) : (
            this.state.announcement.get('permission').some((v) => v == 510) && <Menu.Item key={3} className={styles.popItem}>恢复发布</Menu.Item>
          )
        }
        {this.state.announcement.get('permission').some((v) => v == 503) ? (
          <Menu.Item key={4} className={styles.popItem}>
            <Popover visible={this.state.publicTypePopoverVisible} onVisibleChange={(v) => this.setState({ publicTypePopoverVisible: v })} placement="right" content={this.renderPublicTypeSelector()} trigger="hover" overlayClassName={styles.publicTypePopover}>
              <div>
                修改可见性
                <Icon type="right" style={{ marginLeft: 15, color: '#9b9b9b', fontSize: 10 }}/>
              </div>
            </Popover>
          </Menu.Item>
        ) : null}
      </Menu>
    )
  },

  //以下为各种item的渲染方法，
  //当前为假数据，大部分数据在item中default定义，具体组件的参数可见具体参数的defaultProps

  //评论tab
  renderComment(){
    const { commentList, announcement } = this.state
    const { affair } = this.props

    const ifComment = this.state.commentPublicType == 0 || (this.state.commentPublicType == 1 && (announcement.get('memberType') == OPT_ROLE.OFFICIAL || announcement.get('memberType') == OPT_ROLE.GUEST))
    return (
      <div className={styles.comment}>
        <div className={styles.cmtTitle}>
          <div style={{ lineHeight: 28 }}>评论列表：</div>
          <div className={styles.cmtPermission}>
            评论功能：
            {announcement.get('memberType') == OPT_ROLE.OFFICIAL ?
              <Select
                className={styles.select}
                dropdownMatchSelectWidth={false}
                onChange={this.changeCommentPublicType}
                value={this.state.commentPublicType + ''}
              >
                <Option value={COMMENT_PERMIT.OPEN + ''}>开放</Option>
                <Option value={COMMENT_PERMIT.HALF + ''}>官/客方开放</Option>
                <Option value={COMMENT_PERMIT.CLOSE + ''}>关闭</Option>
              </Select>
              :
              <span>{COMMENT_PERMITS[this.state.commentPublicType].text}</span>
            }
          </div>
        </div>
        {ifComment &&
          <CommentInput placeholder="回复评论" btnText="发表" onSubmit={this.onCreateComment}/>
        }
        <DynamicScrollPane onLoad={() => {}} isLoading={false} hasMore={false} wrapClassName={`${styles.scrollPane} ${styles.commentScrollPane}`}>
          {commentList.map((v) => {
            return (
              <CommentItem
                id={v.get('id')}
                key={v.get('id')}
                role={v.get('role')}
                toRole={v.get('toRole')}
                createTime={v.get('createTime')}
                content={v.get('content')}
                canComment={ifComment}
                optRoleId={affair ? affair.get('roleId') : 2000}
                isOfficial={announcement.get('memberType') == OPT_ROLE.OFFICIAL}
                permission={announcement.get('permission')}
                onReply={this.onCreateComment}
                onDelete={this.onDeleteComment}
              />
            )
          })}
        </DynamicScrollPane>
      </div>
    )
  },

  //动态tab
  renderNews(){
    const { newsList, isLoading, hasMoreNews } = this.state
    return (
      <DynamicScrollPane onLoad={this.loadMoreNews} isLoading={isLoading} hasMore={hasMoreNews} wrapClassName={styles.scrollPane}>
        {newsList.sort((a, b) => b.get('modifyTime') - a.get('modifyTime')).map((v, k) => {
          return (
            <NewsItem
              key={k}
              type={v.get('type')}
              affair={this.props.affair}
              announcementId={v.get('announcementId')}
              log={v.get('operationDescription')}
              title={v.get('title')}
              roleId={v.get('roleId')}
              avatar={v.get('avatar')}
              roleTitle={v.get('roleName')}
              username={v.get('username')}
              time={v.get('modifyTime')}
              params={JSON.parse(v.get('operationDescription'))}
              news={v}
            />
          )
        })}
      </DynamicScrollPane>
    )
  },

  //工作tab
  renderWork(){
    const { workList, isLoading, hasMoreWork, announcement } = this.state
    const { affair } = this.props
    const announcementType = TEMPLATE_ATTRS[announcement.get('plateType')]
    const optRoleId = affair.get('roleId')
    return (
      <div className={styles.work}>
        <div className={styles.tabTitle}>
          工作列表
          {announcement.get('permission').some((v) => v == 507) ? <SecondaryButton type="primary" className={styles.createBtn} size="small" onClick={this.onCreateWork}>新建工作</SecondaryButton> : null}
        </div>
        <DynamicScrollPane onLoad={this.loadMoreWorks} isLoading={isLoading} hasMore={hasMoreWork} wrapClassName={styles.scrollPane}>
          {workList.map((v, k) => {
            let isResponsor = false
            const resp = v.get('ownerRole')

            if (resp && resp.get('roleId') === optRoleId){
              isResponsor = true
            }
            const attachments = v.getIn(['fileVO', 'urls'], List()).map((w, k) => fromJS({
              url: w,
              fileId: v.getIn(['fileVO', 'fileIds', k], List()),
            }))

            const onDeleteAttachment = (file) => {
              this.setState({
                workList: this.state.workList.updateIn([k, 'fileVO'], (fileVO) => {
                  const ret = fileVO.update('fileIds', (fileIds) => fileIds.filter((v) => v !== file.get('fileId')))
                    .update('urls', (urls) => urls.filter((v, k) => fileVO.getIn(['fileIds', k]) !== file.get('fileId')))
                  return ret
                })
              })
            }

            return (
              <WorkItem
                key={k}
                id={v.get('announcementTaskId')}
                attachments={attachments}
                onDeleteAttachment={onDeleteAttachment}
                onAddAttachement={() => this.fetchWorks()}
                title={v.get('name')}
                announcementType={announcementType}
                announcementNumber={announcement.get('number')}
                announcementTitle={announcement.get('title')}
                responsor={v.get('ownerRole')}
                permission={announcement.get('permission')}
                cooperationRoles={v.get('joinRoles')}
                beginTime={v.get('beginTime')}
                endTime={v.get('offTime')}
                remark={v.get('note')}
                state={v.get('state')}
                overdue={v.get('overdue')}
                optRoleType={announcement.get('memberType')}
                announcementId={announcement.get('announcementId')}
                optRoleId={affair.get('roleId')}
                affairId={affair.get('id')}
                isResponsor={isResponsor}
                guestList={this.state.guestList}
                officialList={this.state.officialList}
                updateCallback={this.handleUpdateWork}
                deleteCallback={this.handleDeleteWork}
              />
            )
          })}
        </DynamicScrollPane>
      </div>
    )
  },

  //会议tab
  renderMeeting(){
    const { affair } = this.props
    const { announcement } = this.state
    return (
      <div className={styles.meeting}>
        <div className={styles.tabTitle}>
          会议列表：
          <SecondaryButton type="primary" className={styles.createBtn} size="small" onClick={this.onCreateMeeting}>新建会议</SecondaryButton>
        </div>
        <DynamicScrollPane onLoad={this.onFetchMeetingList} isLoading={false} hasMore={false} wrapClassName={styles.scrollPane}>
          {this.state.meetingList.map((meeting, k) => {
            const attachments = meeting.getIn(['meetingFiles', 'urls'], List()).map((w, k) => fromJS({
              url: w,
              fileId: meeting.getIn(['meetingFiles', 'fileIds', k], List()),
            }))

            const onDeleteAttachment = (file) => {
              this.setState({
                meetingList: this.state.meetingList.updateIn([k, 'meetingFiles'], (fileVO) => {
                  const ret = fileVO.update('fileIds', (fileIds) => fileIds.filter((v) => v !== file.get('fileId')))
                    .update('urls', (urls) => urls.filter((v, k) => fileVO.getIn(['fileIds', k]) !== file.get('fileId')))
                  return ret
                })
              })
            }

            return (
              <MeetingItem
                key={meeting.get('meetingId')}
                affair={affair}
                announcement={announcement}
                onDeleteAttachment={onDeleteAttachment}
                onAddAttachement={() => this.onFetchMeetingList()}
                attachments={attachments}
                meeting={meeting}
                onUpdateMeetingList={this.onFetchMeetingList}
                roleList={this.state.officialList.concat(this.state.guestList)}
              />
            )
          })}
        </DynamicScrollPane>
      </div>
    )
  },

  //文件tab,先写界面，优先级low
  renderFile(){
    return (
      <div className={styles.file}>
        <div className={styles.tabTitle}>
          文件列表：
        </div>
        <div className={styles.fileList}>
          {
            this.state.fileList.sort((a, b) => b.get('createTime') - a.get('createTime')).map((file, key) => {
              return (
                <div className={styles.fileItem} key={key}>
                  {getFileIcon(file.get('url'))}
                  <div className={styles.filename}>{file.get('url').split('/').pop()}</div>
                  <div className={styles.creator}>{`${file.get('roleName')} ${file.get('username')}`}</div>
                  <div className={styles.timestamp}>{moment(file.get('createTime')).format('YYYY-MM-DD hh:mm:ss')}</div>
                  <div className={styles.buttonGroup}>
                    <SprigDownIcon onClick={() => this.handleDownloadFile(file.get('url'))} />
                    {/* <TrashIcon className={styles.trashIcon} onClick={() => this.handleDeleteFile(file)} /> */}
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>
    )
  },

  //子发布tab, 先不写发布列表，可以直接服用总的发布列表
  renderSubAnnouncement(){
    return (
      <div className={styles.subAnnouncement}>
        <div className={styles.tabTitle}>
          子发布列表：
          {this.state.announcement.get('permission').some((v) => v == 507) && <SecondaryButton type="primary" className={styles.createBtn} size="small" onClick={this.onCreateAnnouncement}>新建子发布</SecondaryButton>}
        </div>
        <DynamicScrollPane onLoad={this.fetchSubAnnouncementList} isLoading={false} hasMore={false} wrapClassName={styles.scrollPane + ' ' + styles.subAffairScrollPane}>
          {this.state.subAnnouncementList.map((announcement) => {
            return (
              <AnnouncementItem
                key={announcement.get('announcementId')}
                affairId={this.props.affair.get('id')}
                announcement={announcement}
                vision={VISION.BRIEF}
                wrapClassName={styles.item}
              />
            )
          })}
        </DynamicScrollPane>
      </div>
    )
  },

  //参与者tab
  renderParticipant(){
    const { officialList, announcement, guestList } = this.state

    // const guestList = this.getGuestList()

    return (
      <div className={styles.participant}>
        发布官方:
        <RolesPanel
          permission={announcement.get('permission')}
          affair={this.props.affair}
          type={PARTICIPANT_TYPE.OFFICIAL}
          rolesList={officialList}
          optRoleType={announcement.get('memberType')}
          deleteCallback={this.handlePartiDelete}
          addCallback={this.handleAddOfficial}
        />
        发布客方：
        <RolesPanel
          permission={announcement.get('permission')}
          affair={this.props.affair}
          type={PARTICIPANT_TYPE.CUSTOMER}
          rolesList={guestList}
          optRoleType={announcement.get('memberType')}
          deleteCallback={this.handlePartiDelete}
          addCallback={() => {this.setState({ showAddGuestModal: true })}}
        />
      </div>
    )
  },
  renderAttachments(announcement) {
    let attachments = null
    try {
      attachments = JSON.parse(announcement.get('attachmentUrl'))
    } catch (err) {
      attachments = []
    }

    if (!attachments.length) return null

    return (
      <div className={styles.attachmentsContainer}>
        <label>附件</label>
        <div className={styles.attachmentsList}>
          {
            attachments.map((attachment, key) => {
              return (
                <div key={key} className={styles.attachment}>
                  {getFileIcon(attachment)}
                  <p>{attachment.split('/').pop()}</p>
                  <Icon type="download" onClick={() => oss.downloadFile(attachment, this.props.affair)} />
                </div>
              )
            })
          }
        </div>
      </div>
    )
  },
  renderPlanDuration(announcement) {
    return (
      <Tooltip title="点击修改计划时间">
        <DatePicker.RangePicker
          allowClear={false}
          className={styles.planTimeDuration}
          format={'YYYY/MM/DD HH:mm'}
          value={[
            announcement.get('startTime') ? moment(announcement.get('startTime')) : null,
            announcement.get('endTime') ? moment(announcement.get('endTime')) : null,
          ]}
          onChange={this.handleDateRangeChange}
        />
      </Tooltip>
    )
  },

  //先实现所有的界面，之后再进行权限等的判断处理
  render(){
    const {
      announcement,
      isLoading,
      activeKey,
      officialList,
      showAnnouncementMoveModal,
      showAddGuestModal,
      editAnouncement,
      version,
      guestList
    } = this.state
    const {
      affair,
    } = this.props

    // const guestList = this.getGuestList()

    if (isLoading){
      return null
    }

    const announcementType = TEMPLATE_ATTRS[announcement.get('plateType')]

    let tags = null
    try {
      tags = JSON.parse(announcement.get('tags'))
    } catch (err) {
      tags = []
    }

    //发布正文
    let contentState = announcement.get('content') ? convertFromRaw(JSON.parse(announcement.get('content'))) : convertFromRaw(convertToRaw(EditorState.createEmpty(EditorDecorator).getCurrentContent()))
    contentState = differenceHighlighter(contentState, announcement.get('historys').toJS())
    const editorState = EditorState.createWithContent(contentState, EditorDecorator)
    const content = JSON.parse(announcement.get('content'))
    let imgList = []

    if (announcement.get('type') == 1){
      let entityMap = content.entityMap

      for (let v in entityMap) {
        if (entityMap[v].data){
          imgList.push(<img src={entityMap[v].data.src} key={v}/>)
        }
      }
    }

    const isOfficial = this.state.officialList.toJS().find((o) => o.roleId === affair.get('roleId')) ? true : false

    return (
      <div className={styles.detailContainer}>
        <div className={styles.right}>
          {/*<AnnouncementChat/>*/}
          <AnnouncementChatContainer
            isOfficial={isOfficial}
            affair={affair}
            announcement={announcement}
            officialList={this.state.officialList.toJS()}
            guests={this.state.guests.toJS()}
          />
        </div>
        <div className={styles.left}>
          <div className={styles.title}>
            <div
              className={styles.back}
              onClick={() =>
                this.props.pushURL(
                  `/workspace/affair/${this.props.affair.get('id')}/announcement/${location.pathname.indexOf('inner') >= 0 ? 'inner' : 'interact'}`
                )
              }
            >
              <Icon type="left" />
              返回发布列表
            </div>

            <div className={styles.optContainer}>
              {/* 历史记录 */}
              <Popover
                visible={this.state.showChangeRecord}
                onVisibleChange={(visible) => {this.setState({ showChangeRecord: visible })}}
                placement="bottom"
                trigger="click"
                content={
                  <div className={styles.changeRecordContainer}>
                    <div className={styles.header} style={{ paddingLeft: 3, marginTop: 8 }}>
                      <Checkbox checked={this.state.showDifference} onChange={this.handleShowDifferrence}/>
                      <span style={{ lineHeight: '14px' }}>显示差异</span>
                    </div>
                    <div className={styles.versionContent}>
                      {version.map((v, k) => {
                        return (
                          <div data-version={v.version} className={styles.box} key={k} onClick={this.handleGetCurrentVersion}>
                            <Tooltip placement="left" title={v.username + '－' + v.roleName}><img className={styles.avatar} src={v.avatar || grayImage} /></Tooltip>
                            <span className={announcement.get('version') === v.version ? styles.selectedRecord : styles.changeRecord}>{moment(v.createTime).format('YYYY年MM月DD日修改')}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                }
              >
                <div className={styles.changeLogs}>
                  <ChangeLogs />
                </div>
              </Popover>
              <div className={styles.more}>
                <Dropdown visible={this.state.toolDropdown || this.state.publicTypePopoverVisible} onVisibleChange={(visible) => this.setState({ toolDropdown: visible })} placement="bottomRight" overlay={this.renderAnnouncementMore()} trigger={['click']}>
                  <MoreIcon fill="#9b9b9b" style={{ width: 20, height: 20 }}/>
                </Dropdown>
              </div>
            </div>
          </div>

          <div
            className={styles.contentWrapper}
            ref={(el) => {
              if (el) {
                this.contentWrapper = el
                this.contentWrapper.addEventListener('scroll', this.handleScroll)
              }
            }}
          >
            <div className={styles.content} ref={(el) => this.content = el}>
              <div className={styles.headerContainer}>
                <div className={styles.announcementHeader}>
                  <span className={styles.announcementType} style={{ borderColor: announcementType.color, color: announcementType.color }}>
                    {announcementType.text}
                  </span>
                  <span style={{ 'verticalAlign': 'middle' }}>{`${announcement.get('number')} - ${announcement.get('title')}`}</span>
                </div>
                <div className={styles.announcer}>
                  <span className={styles.creator}>
                    <img className={styles.avatar} src={announcement.get('creatorAvatar') || grayImage}/>
                    <span className={styles.name}>{`${announcement.get('creatorRoleName')}－${announcement.get('creatorUsername')}`}</span>
                  </span>

                  {
                    <div className={styles.duration}>
                      <div>计划时间：</div>
                      {this.renderPlanDuration(announcement)}
                    </div>
                  }
                </div>
                {announcement.get('parentAnnouncement') != null &&
                  <div className={styles.parentAnnouncement}>
                    <div className={styles.label}>父发布：</div>
                    <a className={styles.control} onClick={() => this.onClickAnnouncementLink(announcement.get('parentAnnouncement'))}>
                      {`${announcement.getIn(['parentAnnouncement', 'number'])} - ${announcement.getIn(['parentAnnouncement', 'title'])}`}
                    </a>
                  </div>
                }
              </div>

              <div className={styles.announcementBody}>
                <Editor
                  className={styles.draftEditor}
                  blockRendererFn={getBlockRender.bind(this)}
                  blockStyleFn={getBlockStyle}
                  editorState={editorState}
                  customStyleMap={inlineStyleMap}
                  readOnly
                />
                {announcement.get('type') == 1 &&
                  <div className={styles.imgList}>
                    {imgList}
                  </div>
                }
              </div>

              {this.renderAttachments(announcement)}
              <EditableTagGroup tags={tags} onTagsChange={this.handleChangeTags} style={{ marginTop: 20 }} />
            </div>

            <div className={styles.opt}>
              <Tabs activeKey={activeKey} onChange={this.handleChangeTabs} size="small">
                <TabPane className={styles.tabContent} tab="评论" key={TAB_TYPE.COMMENT}>
                  <div className={styles.tabTitle}>
                    <CommentContainer
                      affair={affair}
                      announcement={announcement}
                      commentPublicType={announcement.get('commentPublicType')}
                    />
                  </div>
                </TabPane>
                <TabPane className={styles.tabContent} tab="动态" key={TAB_TYPE.NEWS}>
                  <div className={styles.tabTitle}>
                    <NewsContainer
                      affair={affair}
                      announcement={announcement}
                      isNewsTab={activeKey == TAB_TYPE.NEWS}
                    />
                  </div>

                </TabPane>
                <TabPane className={styles.tabContent} tab="工作" key={TAB_TYPE.WORK}>
                  <div className={styles.tabTitle}>
                    <TaskContainer
                      announcement={announcement}
                      affair={affair}
                      officialList={officialList}
                      guestList={guestList}
                    />
                  </div>

                </TabPane>
                <TabPane className={styles.tabContentntent} tab="附件汇总" key={TAB_TYPE.FILE}>
                  <div className={styles.tabTitle} >
                    <AttachmentContainer
                      announcement={announcement}
                      affair={affair}
                      isAttachmentTab={activeKey == TAB_TYPE.FILE}
                    />
                  </div>
                  {/* {this.renderFile()} */}
                </TabPane>
                <TabPane className={styles.tabContent} tab="子发布" key={TAB_TYPE.SUB_ANNOUNCEMENT}>
                  <div className={styles.tabTitle}>
                    <SubContainer
                      affair={affair}
                      announcement={announcement}
                    />
                  </div>

                </TabPane>
                <TabPane className={styles.tabContent} tab="参与者" key={TAB_TYPE.PARTICIPANTS}>
                  {this.renderParticipant()}
                </TabPane>
              </Tabs>
            </div>
          </div>
        </div>


        {showAnnouncementMoveModal &&
          <AnnouncementMoveModal
            affair={affair}
            announcement={announcement}
            onCancel={() => {
              const { affair, detailId } = this.props
              this.fetchDetail(affair, detailId)
              this.setState({ showAnnouncementMoveModal: false })
            }}
          />
        }

        {showAddGuestModal &&
          <AddGuestModal
            affair={affair}
            cancelCallback={() => this.setState({ showAddGuestModal: false })}
            submitCallback={this.handleAddGuest}
            alreadyGuestList={this.state.officialList.concat(guestList)}
          />
        }

        {/* 编辑发布 */}
        {(editAnouncement) &&
          <CreateAnnouncementModal
            onClose={() => {
              this.setState({ editAnouncement: null })
            }}
            onSucceed={() => {
              const { affair, detailId } = this.props

              this.fetchDetail(affair, detailId)
              this.setState({
                editAnouncement: null,
              })
            }}
            affairId={this.props.affair.get('id')}
            roleId={this.props.affair.get('roleId')}
            allianceId={this.props.affair.get('allianceId')}
            editAnouncement={editAnouncement}
          />
        }
      </div>
    )
  }
})

function mapStateToProps(state, props){
  return {
    affair: state.getIn(['affair', 'affairMap', props.params.id]),
    detailId: props.params.announcementid ? props.params.announcementid : 0,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchScopeGroups: bindActionCreators(fetchScopeGroups, dispatch),
    fetchGuestGroups: bindActionCreators(fetchGuestGroups, dispatch),
    pushURL: bindActionCreators(pushURL, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AnnouncementDetail)
