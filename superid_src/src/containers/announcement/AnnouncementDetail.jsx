import React, { PropTypes } from 'react'
import { DropDownIcon, EditIcon, AddIcon } from 'svg'
import styles from './AnnouncementDetail.scss'
import AnnouncementEditor from './AnnouncementEditor'
import OfficialListComponent from './OfficialListComponent'
import AnnouncementComments from './AnnouncementComments'
import grayImage from 'images/gray.png'
import { Button, Popover, Modal, Switch, Checkbox, Tooltip, Icon, message } from 'antd'
import { connect } from 'react-redux'
import config from '../../config'
import { List, Map, fromJS } from 'immutable'
import { PERMISSION_MAP } from 'permission'
import {
    updateAffairAnnouncement,
    updateAnnouncementPublictype,
    updateAnnouncementIsTop,
    updateAffairAnnouncementIndex
} from '../../actions/affair'
import { pushURL } from 'actions/route'
import { inlineStyleMap, getBlockStyle, getBlockRender } from './EditorControl'
import { Editor, EditorState, convertFromRaw, convertToRaw } from 'draft-js'
import EditorDecorator from './EditorDecorator'
import { bindActionCreators } from 'redux'
import ChoosePublishTarget from '../task/ChoosePublishTarget'
import moment from 'moment'
import 'draft-js/dist/Draft.css'
import differenceHighlighter from './differenceHighlighter'
import CommunicationContainer from './communication/CommunicationContainer.jsx'
import AnnouncementChat from './AnnouncementChat'
import AffairAvatar from '../../components/avatar/AffairAvatar'
import ModifyPublishModal from './ModifyPublishModal'

import messageHandler from 'messageHandler'

export const ANNOUNCEMENT_SCOPE = {
  AFFAIR: 0,
  ALLIANCE: 1,
  GUEST: 2,
  COMMENTS: 3,
}

export const ANNOUNCEMENT_SCOPE_STRING = {
  0: 'AFFAIR',
  1: 'ALLIANCE',
  2: 'GUEST',
  3: 'COMMENTS',
}

const OFFICIAL = 'official'
const GUEST = 'guest'
const OTHER = 'other'
const MAX_COUNT = 6

const AnnounceDetail = React.createClass({
  propTypes: {
    affair: PropTypes.object.isRequired,
  },
  getInitialState() {
    return {
      announcement: Map(),
      chosenId: -1,
      slideTop: -50,
      canScroll: 'auto',
      isEditMode: false, // 是否在变更发布
      version: [],
      officials: [], // 发布的官方
      guests: fromJS({
        innerAffair: [],
        innerAlliance: [],
        menkor: [],
      }),
      showDifference: false,
      prevAnnouncementId: null,
      afterAnnouncementId: null,
      confirmModalVisibility: false,
      editGuestVisibility: false,
      scope: ANNOUNCEMENT_SCOPE.AFFAIR, //问题和聊天视角
      hasEditedTitle: false, // 判断在点击变更发布之后，是否编辑过title，用于判定是否需要弹出confirm modal
      hasEditedContent: false, // 判断在点击变更发布之后，是否编辑过content，用于判定是否需要弹出confirm modal
      loadingMessages: false, //判断是否需要获取发布聊天信息(表示是否正在查询)
      showAddOfficialModal: false, // 是否显示添加官方的 Modal
      showAddGuestModal: false,
      questionOpen: false, //是否展开问题列表
      showOfficialList: false, //查看更多官方成员
      showGuestList: false, //查看更多客方成员
      showChangeRecord: false, //查看变更记录
      readyToAddOfficial: List(), // 将要被添加的官方列表
      readyToDeleteOfficial: List(), // 将要被删除的官方列表
      editingOffical: false,
      followList: [], //关注者列表
    }
  },

  componentWillMount() {
    const affair = this.props.affair
    const announcementId = this.props.params.announcementid

    this.getAnnouncementDetail(announcementId, affair)
    this.fetchOfficials(announcementId, affair.get('allianceId'))
    this.fetchGuests(announcementId, affair.get('allianceId'))
    this.fetchFollowers(this.props)
  },
  componentWillReceiveProps(nextProps) {
    let announcementId = nextProps.params.announcementid
    const affair = nextProps.affair
    // this.getAnnouncementContext(announcementId, affair)

    if (nextProps.params.announcementid != this.props.params.announcementid) {
      this.getAnnouncementDetail(announcementId, affair)
    }

    //切换角色需要重置state
    if (affair.get('roleId') !== this.props.affair.get('roleId')) {
      this.setState(this.getInitialState())
      this.getAnnouncementDetail(announcementId, affair)
      this.fetchOfficials(announcementId, affair.get('allianceId'))
      this.fetchGuests(announcementId, affair.get('allianceId'))
    }
    this.fetchFollowers(nextProps)
  },
  fetchFollowers(props){
    const { affair } = props
    const announcementId = this.props.params.announcementid
    fetch(config.api.announcement.followers(announcementId, affair.get('allianceId')), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.setState({
          followList: json.data,
        })
      }
    })
  },
  getAnnouncementDetail(announcementId, affair) {
    // offsetHead: 追溯新版本, 0||null代表不追溯
    // offsetTail: 追溯旧版本, 0||null代表不追溯
    // version: 要取的version, 0||null代表最新的version
    fetch(config.api.announcement.detail.get(announcementId, affair.get('roleId'), affair.get('id'), 0, 0, 0), {
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
        announcement: Map(ann)
      })
    })
    this.handleGetAllVersion(announcementId, affair)
  },
  fetchOfficials(announcementId, allianceId) {
    fetch(config.api.announcement.detail.officials.get(announcementId, allianceId), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const memberList = res.data
        this.setState({
          officials: memberList,
        })
      }
    })
  },
  fetchGuests(announcementId, allianceId) {
    // 事务内角色作为客方
    const innerAffiarReq = fetch(config.api.announcement.detail.guests.innerAffair.get(announcementId, allianceId), {
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json())
    // 盟内以事务作为分类的客方
    const innerAllianceReq = fetch(config.api.announcement.detail.guests.innerAlliance.get(announcementId, allianceId), {
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json())
    // 盟客网以盟作为分类的客方
    const menkorReq = fetch(config.api.announcement.detail.guests.menkor.get(announcementId, allianceId), {
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json())

    Promise.all([innerAffiarReq, innerAllianceReq, menkorReq]).then((res) => {
      this.setState({
        guests: this.state.guests
          .update('innerAffair', (innerAffair) => res[0].code === 0 ? fromJS(res[0].data) : innerAffair)
          .update('innerAlliance', (innerAlliance) => res[0].code === 0 ? fromJS(res[1].data) : innerAlliance)
          .update('menkor', (menkor) => res[0].code === 0 ? fromJS(res[2].data) : menkor),
      })
    })
  },
  fresh(){
    const { affair } = this.props
    this.fetchOfficials(this.state.announcement.get('announcementId'), affair.get('allianceId'))
    this.fetchGuests(this.state.announcement.get('announcementId'), affair.get('allianceId'))
  },
  handleRemoveOfficial(role){
    const { affair } = this.props
    fetch(config.api.announcement.detail.officials.delete(this.state.announcement.get('announcementId'), role.roleId, affair.get('roleId'), affair.get('allianceId'), role.type), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: this.state.announcement.get('announcementId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.fresh()
      }
    })
  },
  handleRemoveGuests(role){
    const { affair } = this.props
    fetch(config.api.announcement.detail.officials.delete(this.state.announcement.get('announcementId'), role.get('roleId'), affair.get('roleId'), affair.get('allianceId'), role.get('type')), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: this.state.announcement.get('announcementId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.fresh()
      }
    })
  },
  handleShowDifferrence() {
    const announcementId = this.props.params.announcementid
    const affair = this.props.affair

    if (!this.state.showDifference) {
      fetch(config.api.announcement.detail.get(announcementId, affair.get('roleId'), affair.get('id'), 1, 0, this.state.announcement.get('version') - 1), {
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
          announcement: Map(ann),
          showDifference: true,
        })
      })
    } else {
      this.getAnnouncementDetail(announcementId, affair)
      this.setState({
        showDifference: false,
      })
    }

  },
  getAnnouncementContext(announcementId, affair) {
    // 获取上一条与下一条发布的基本信息
    const announcementList = affair.get('announcement').entrySeq().sort((a, b) => {
      return a[1].get('modifyTime') - b[1].get('modifyTime')
    })
    const currentIndex = announcementList.findIndex((v) => v[0] == announcementId)
    const prevId = currentIndex - 1 < 0 ? null : announcementList.get(currentIndex - 1)[0]
    const afterId = currentIndex + 1 >= announcementList.size ? null : announcementList.get(currentIndex + 1)[0]
    this.setState({
      prevAnnouncementId: prevId,
      afterAnnouncementId: afterId,
    })
    const readyToFetchDetail = List([prevId, afterId]).filter((id) => id && !affair.getIn(['announcement', id, 'title']))
    fetch(config.api.announcement.info.get(readyToFetchDetail.join(','), affair.get('allianceId')), {
      method: 'get',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(() => {
      return
      // this.props.updateAffairAnnouncement(res.data)
    })
  },

  handleGetAllVersion(announcementId, affair) {
    fetch(config.api.announcement.version.get(announcementId), {
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

  handleGetCurrentVersion(evt) {
    // TODO: fetch version from cache first
    const version = evt.currentTarget.getAttribute('data-version')
    const affairId = this.props.params.id
    const announcementId = this.props.params.announcementid
    const affair = this.props.affair

    // offsetHead: 追溯新版本,0||null代表不追溯
    // offsetTail: 追溯旧版本,0||null代表不追溯
    // version: 要取的version,0||null代表最新的version
    fetch(config.api.announcement.detail.get(
      announcementId,
      affair.get('roleId'),
      affair.get('id'),
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
        announcement: Map(json.data)
      })
    })
  },

  handleEditAnnouncement() {
    this.setState({
      isEditMode: true,
      hasEditedTitle: false,
      hasEditedContent: false,
    })
  },

  handleEditAnnouncementSuccess(){
    this.getAnnouncementDetail(this.props.params.announcementid, this.props.affair)
    this.setState({
      confirmModalVisibility: false,
      isEditMode: false,
    })
  },

  handleBackdoor() {
    this.handleGetAllVersion(this.props.params.announcementid, this.props.affair)
    this.setState({
      confirmModalVisibility: false,
      isEditMode: false,
    })
  },

  handlePublicTypeChange(value) {
    const newPublicType = value ? 0 : 3
    const announcementId = this.props.params.announcementid
    this.props.updateAnnouncementPublictype(announcementId, newPublicType, this.props.affair)
    this.setState({
      announcement: this.state.announcement.set('publicType', newPublicType)
    })
  },

  handleTopChange(e) {
    const newTop = e.target.checked
    const affairId = this.props.params.id
    const announcementId = this.props.params.announcementid
    this.props.updateAnnouncementIsTop(announcementId, newTop ? 1 : 0, this.props.affair.get('affairMemberId'), affairId)
    this.setState({
      announcement: this.state.announcement.set('isTop', newTop)
    })
  },


  handleNavgateToAnnouncement(id) {
    this.props.pushURL(`/workspace/affair/${this.props.params.id}/announcement/detail/${id}`)
  },

  handleHasEdited(value, type){
    type === 'title' ? this.setState({ hasEditedTitle: value }) : this.setState({ hasEditedContent: value })
  },

  handleBackToDetail() {
    this.setState({ confirmModalVisibility: true })
  },

  handleCloseConfirmModal(){
    this.setState({ confirmModalVisibility: false })
  },

  handleAddOfficial(official) {
    official.type = 3
    this.state.officials.push(official)

    this.setState({
      readyToAddOfficial: this.state.readyToDeleteOfficial.find((v) => v.roleId === official.roleId) ? this.state.readyToAddOfficial : this.state.readyToAddOfficial.push(official),
      readyToDeleteOfficial: this.state.readyToDeleteOfficial.filter((v) => v.roleId !== official.roleId),
      officials: this.state.officials,
    })
  },

  handleDeleteOfficial(official) {
    this.setState({
      readyToDeleteOfficial: this.state.readyToAddOfficial.find((v) => v.roleId === official.roleId) ? this.state.readyToDeleteOfficial : this.state.readyToDeleteOfficial.push(official),
      readyToAddOfficial: this.state.readyToAddOfficial.filter((v) => v.roleId !== official.roleId),
      officials: this.state.officials.filter((v) => v.roleId !== official.roleId),
    })
  },

  handleCancelEditOfficials() {
    let officials = this.state.officials
    this.state.readyToAddOfficial.forEach((v) => officials = officials.filter((w) => w.roleId === v.roleId))
    this.state.readyToDeleteOfficial.forEach((v) => officials.push(v))

    this.setState({
      showAddOfficialModal: false,
      readyToAddOfficial: List(),
      readyToDeleteOfficial: List(),
      officials: officials,
    })
  },

  handleSubmitEditOfficials() {
    const requests = []
    const affair = this.props.affair
    const announcementId = this.state.announcement.get('announcementId')

    this.state.readyToAddOfficial.forEach((official) => {
      const body = {
        announcementId,
        roleIds: [official.roleId],
        operatorId: affair.get('roleId'),
        allianceId: affair.get('allianceId'),
        affairId: parseInt(affair.get('id')),
      }

      requests.push(
        fetch(config.api.announcement.detail.officials.post(announcementId, official.roleId, affair.get('roleId'), affair.get('allianceId')), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          affairId: affair.get('id'),
          roleId: affair.get('roleId'),
          resourceId: announcementId,
          body: JSON.stringify(body),
        }).then((res) => res.json())
      )
    })

    this.state.readyToDeleteOfficial.forEach((official) => {
      requests.push(
        fetch(config.api.announcement.detail.officials.delete(announcementId, official.roleId, affair.get('roleId'), affair.get('allianceId'), this.state.announcement.get('type')), {
          method: 'POST',
          credentials: 'include',
          affairId: this.props.affair.get('id'),
          roleId: this.props.affair.get('roleId'),
          resourceId: this.state.announcement.get('announcementId'),
        }).then((res) => res.json())
      )
    })

    this.setState({
      editingOffical: true,
    })

    Promise.all(requests).then(() => {
      this.setState({
        editingOffical: false,
        showAddOfficialModal: false,
      })
    })
  },

  handleEditGuest() {
    const chosenMap = this._choosePublishTarget.getChosenList()
    const affair = this.props.affair
    const announcementId = this.state.announcement.get('announcementId')
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
      editGuestVisibility: false,
    })
    Promise.all([innerAffairReq, innerAllianceReq, menkorReq]).then(() => {
      this.fresh()
      this.refs.announcementChat.getWrappedInstance().fetchSessionList()
    })
  },


  handleRemoveGuest(role) {
    const announcementId = this.state.announcement.get('announcementId')
    const affair = this.props.affair

    fetch(config.api.announcement.detail.guests.delete(announcementId, role.get('roleId'), affair.get('roleId'), affair.get('allianceId'), role.get('type')), {
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      method: 'POST',
      credentials: 'include',
      resourceId: announcementId,
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.setState({
          guests: this.state.guests
            .update('innerAffair', (innerAffair) => innerAffair.filter((v) => v.get('roleId') != role.get('roleId')))
            .update('innerAlliance', (innerAlliance) => innerAlliance.map((v) => v.update('roleList', (roleList) => roleList.filter((w) => w.get('roleId') != role.get('roleId')))))
            .update('menkor', (menkor) => menkor.map((v) => v.update('roleList', (roleList) => roleList.filter((w) => w.get('roleId') != role.get('roleId')))))
        })
      }
    })
  },

  //更改视角
  handleChangeScope(scope) {
    this.setState({
      scope: scope
    })
  },
  handleStar(star = true){
    const { announcement } = this.state
    const { affair } = this.props
    fetch(config.api.announcement.follow(announcement.get('announcementId'), affair.get('roleId'), affair.get('allianceId'), star), {
      method: 'POST',
      credentials: 'include',
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        const msg = star ? '关注成功' : '取消关注成功'
        message.success(msg, 0.5)
        this.fetchFollowers(this.props)
      }
    })
  },
  handleApply(){
    const { affair } = this.props
    const { announcement } = this.state
    fetch(config.api.announcement.apply(announcement.get('announcementId'), affair.get('roleId'), affair.get('allianceId'), ''), {
      method: 'POST',
      credentials: 'include',
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        message.success('成功发出申请')
      }
    })
  },
  handleInvalidPublish(){
    const { affair } = this.props
    const { announcement } = this.state
    fetch(config.api.announcement.invalid(affair.get('roleId'), affair.get('id'), announcement.get('announcementId')), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcement.get('announcementId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        message.success('该发布已失效，请在历史发布中查看')
        const announcementId = this.props.params.announcementid
        this.getAnnouncementDetail(announcementId, affair)
      }
      else {
        message.error('网络错误')
      }

    })
  },
  handleRecover(){
    const { affair } = this.props
    const { announcement } = this.state
    fetch(config.api.announcement.recover(affair.get('roleId'), affair.get('id'), announcement.get('announcementId')), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcement.get('announcementId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        message.success('该发布已恢复，请在全部发布中查看')
        const announcementId = this.props.params.announcementid
        this.getAnnouncementDetail(announcementId, affair)
      }
      else {
        message.error('网络错误')
      }
    })
  },
  getView(){

  },
  /* render */

  renderConfirmModal(){
    const { confirmModalVisibility } = this.state
    return (
      <Modal wrapClassName={styles.confirmModal}
        title=" "
        visible={confirmModalVisibility}
        onOK={this.handleBackdoor}
        onCancel={this.handleCloseConfirmModal}
        maskClosable={false}
        footer={[
          <div key={0}>
            <Button onClick={this.handleCloseConfirmModal} type="ghost" key={1}>取消</Button>
            <Button type="primary" key={2} onClick={this.handleBackdoor}>确定</Button>
          </div>
        ]}
      >
        <span>即将离开编辑区域，是否放弃更改并返回？</span>
      </Modal>
    )
  },

  // 渲染变更发布区域
  renderEditArea(){
    return (
      <div className={styles.left} style={{ padding: 0 }}>
        <div className={styles.editorContainer}>
          <AnnouncementEditor announcementToEdit={this.state.announcement.toJS()} affairMemberId={this.props.affair.get('affairMemberId')} onPublishSuccess={this.handleEditAnnouncementSuccess} onEdited={this.handleHasEdited} affair={this.props.affair} />
        </div>
      </div>
    )
  },

  // 渲染发布详情部分
  renderDetail(){
    const { announcement, version, officials, guests } = this.state
    const { affair } = this.props
		// let tags = JSON.parse(announcement.get('tags'))
		// tags= Array.isArray(tags) ? tags : []
		//判断是官方视角还是客方视角还是游客视角

    let guestList = List()
    guestList = guestList
			.concat(guests.get('innerAffair'))
			.concat(guests.get('innerAlliance').map((v) => v.get('roleList')).reduce((r, v) => r.concat(v), List()))
			.concat(guests.get('menkor').map((v) => v.get('roleList')).reduce((r, v) => r.concat(v), List()))
    guestList = guestList.map((v) => v.get('roleId')).toSet().toList().map((v) => guestList.find((w) => w.get('roleId') === v))

    let view
    if (officials.some((v) => {return v.roleId == this.props.affair.get('roleId')})){
      view = OFFICIAL
    } else if (guestList.some((v) => v.get('roleId') == this.props.affair.get('roleId'))){
      view = GUEST
    } else {
      view = OTHER
    }

    let contentState = announcement.get('content') ? convertFromRaw(JSON.parse(announcement.get('content'))) : convertFromRaw(convertToRaw(EditorState.createEmpty(EditorDecorator).getCurrentContent()))
    contentState = differenceHighlighter(contentState, announcement.get('historys'))
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

    return (
      <div className={styles.left}>
        {/* 发布内容展示 */}
        <div className={styles.detailDiv}>
          <div className={styles.header}>
            <div>{announcement.get('title')}</div>
            {view == OFFICIAL ?
              <div className={styles.public}>
                <div>公开：</div>
                <Switch checkedChildren="开" unCheckedChildren="关"
                  checked={announcement.get('publicType') === 3 ? false : true}
                  onChange={this.handlePublicTypeChange}
                />
              </div>
						:
              <div className={styles.operate}>
                {this.state.followList.some((v) => (v.roleId == this.props.affair.get('roleId'))) ?
                  <span className={styles.starred} onClick={() => this.handleStar(false)}>已关注<Icon type="star"/></span>
								:
                  <span className={styles.star} onClick={this.handleStar}>关注<Icon type="star"/></span>
								}
                {view == GUEST ?
                  <Button type="ghost" >退出发布</Button>
								:
                  <Button type="primary" onClick={this.handleApply}>加入发布</Button>
								}
              </div>
						}
          </div>
          <div className={styles.announcer}>
            <img className={styles.avatar} src={announcement.get('avatar') || grayImage}/>
            <span className={styles.name}>{`${announcement.get('roleName')}－${announcement.get('username')}`}</span>
            <span className={styles.time}>
              {moment(announcement.get('version') === 1 ?
								announcement.get('createTime')
							:
								announcement.get('modifyTime')).format(`${announcement.get('version') === 1 ? '创建' : '修改'}于YYYY年MM月DD日 HH:mm`)
							}
            </span>
            <Popover
              visible={this.state.showChangeRecord}
              onVisibleChange={(visible) => {this.setState({ showChangeRecord: visible })}}
              placement="bottom"
              trigger="click"
              content={
                <div className={styles.changeRecordContainer}>
                  <div className={styles.header} style={{ paddingLeft: 3 }}>
                    <Checkbox/>
                    <span style={{ lineHeight: '14px' }}>显示差异</span>
                  </div>
                  <div className={styles.content}>
                    {version.map((v, k) => {
                      return (<div className={styles.box} key={k}>
                        <Tooltip placement="left" title={v.username + '－' + v.roleName}><img className={styles.avatar} src={v.avatar || grayImage} /></Tooltip>
                        <span data-version={v.version} onClick={this.handleGetCurrentVersion} className={announcement.get('version') === v.version ? styles.selectedRecord : styles.changeRecord}>{moment(v.createTime).format('YYYY年MM月DD日修改')}</span>
                      </div>)
                    })}
                  </div>
                </div>
							}
            >
              <Button type="ghost" className={styles.recordBtn}>变更记录<DropDownIcon height="16px" width="12px" fill="#cccccc"/></Button>
            </Popover>
          </div>
          <div className={styles.body} ref="announcementBody">
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
        </div>

        {/* 标签栏 */}
        <div className={styles.tagDiv}>
          <div className={styles.tags} />
          {affair.hasPermission(PERMISSION_MAP.EDIT_ANNOUNCEMENT) &&
          <div className={styles.changeBtn} onClick={this.handleEditAnnouncement}>
            <EditIcon height="13" fill="#4a90e2"/>
            <span>变更发布</span>
          </div>
					}
        </div>
        {/* 成员*/}
        {this.renderMember()}
        {/* 评论 */}
        {this.state.announcement.get('publicType') == 0 &&
        <div>
          <AnnouncementComments affair={this.props.affair} announcementId={announcement.get('announcementId')}/>
        </div>
				}
        {/*{this.renderChangeRecord()}*/}
        {
					this.state.announcement.get('state') == 0 ?
  <div className={styles.disable} onClick={this.handleInvalidPublish}>
    <Button type="ghost" size="large">失效发布</Button>
  </div>
						:
  <div className={styles.recover} onClick={this.handleRecover}>
    <Button type="primary" size="large">恢复失效发布</Button>
  </div>
				}
      </div>
    )
  },
  renderAddOfficialModal() {
    const affair = this.props.affair

    return (
      <Modal
        width={500}
        title="添加官方"
        visible
        onOk={this.handleSubmitEditOfficials}
        onCancel={this.handleCancelEditOfficials}
        maskClosable={false}
        confirmLoading={this.state.editingOffical}
      >
        <div className={styles.addOfficialModal}>
          <div style={{ paddingTop: 2 }}>选择官方角色：</div>
          <OfficialListComponent
            showTitle
            officialList={this.state.officials}
            roleId={affair.get('roleId')}
            affairId={parseInt(affair.get('id'))}
            onAddOfficial={this.handleAddOfficial}
            onDeleteOfficial={this.handleDeleteOfficial}
          />
        </div>
      </Modal>
    )
  },


  // 编辑客方成员。
  renderEditGuestModal() {
    const { editGuestVisibility } = this.state
    const affair = this.props.affair

    return editGuestVisibility && (
    <Modal wrapClassName={styles.editGuestModal}
      width={900}
      title="编辑发布对象"
      visible
      onOk={() => {}}
      onCancel={() => this.setState({ editGuestVisibility: false })}
      maskClosable={false}
      footer={[
        <div key={0}>
          <Button onClick={() => this.setState({ editGuestVisibility: false })} type="ghost">取消</Button>
          <Button type="primary" onClick={this.handleEditGuest}>确定</Button>
        </div>
      ]}
    >
      <ChoosePublishTarget ref={(ref) => this._choosePublishTarget = ref} allianceId={affair.get('allianceId')} roleId={affair.get('roleId')} affairId={parseInt(affair.get('id'))} affair={this.props.affair}/>
    </Modal>
    )
  },


  //显示官方和客方成员
  renderMember(){
    const { officials, guests } = this.state
    let guestList = List()
    guestList = guestList
      .concat(guests.get('innerAffair'))
      .concat(guests.get('innerAlliance').map((v) => v.get('roleList')).reduce((r, v) => r.concat(v), List()))
      .concat(guests.get('menkor').map((v) => v.get('roleList')).reduce((r, v) => r.concat(v), List()))
    guestList = guestList.map((v) => v.get('roleId')).toSet().toList().map((v) => guestList.find((w) => w.get('roleId') === v))

    let view
    if (officials.some((v) => {return v.roleId == this.props.affair.get('roleId')})){
      view = OFFICIAL
    } else if (guestList.some((v) => {v.get('roleId') == this.props.affair.get('roleId')})){
      view = GUEST
    } else {
      view = OTHER
    }

    return (
      <div className={styles.memberContainer}>
        <div className={styles.block} style={{ borderRight: '1px solid #e9e9e9' }}>
          <div className={styles.show}>
            <span className={styles.text}>官方:</span>
            {officials.length > MAX_COUNT ?
              <div className={styles.list}>
                {officials.map((role, k) => {
                  if (k <= MAX_COUNT - 1) {
                    return (
                      <Tooltip placement="top" key={k} title={`${role.roleTitle} ${role.username}`}>
                        {(view != OFFICIAL || officials.length == 1) ? (
                          role.avatar ?
                            <img src={role.avatar} className={styles.avatar}/>
                          :
                            <div className={styles.avatar} style={{ backgroundColor: '#d8d8d8' }}/>
                        ) : (
                          <div className={styles.avatarContainer}>
                            <div className={styles.mask} onClick={this.handleRemoveOfficial.bind(null, role)}><AddIcon fill="#fff"/></div>
                            {role.avatar ?
                              <img src={role.avatar} className={styles.avatar}/>
                              :
                              <div className={styles.avatar} style={{ backgroundColor: '#d8d8d8' }}/>
                              }
                          </div>
                        )}
                      </Tooltip>
                    )
                  }
                })}
                <div className={styles.leftNumber} onClick={() => {this.setState({ showOfficialList: true })}}>{officials.length - MAX_COUNT}</div>
              </div>
            :
              <div className={styles.list}>
                {officials.map((role, k) => {
                  return (
                    <Tooltip placement="top" key={k} title={`${role.roleTitle} ${role.username}`}>
                      {(view != OFFICIAL || officials.length == 1) ? (
                        role.avatar ?
                          <img src={role.avatar} className={styles.avatar}/>
                        :
                          <div className={styles.avatar} style={{ backgroundColor: '#d8d8d8' }}/>
                      ) : (
                        <div className={styles.avatarContainer}>
                          <div className={styles.mask} onClick={this.handleRemoveOfficial.bind(null, role)}><AddIcon fill="#fff"/></div>
                          {role.avatar ? <img src={role.avatar} className={styles.avatar}/> : <div className={styles.avatar} style={{ backgroundColor: '#d8d8d8' }}/>}
                        </div>
                      )}
                    </Tooltip>
                  )
                })}
              </div>
            }
          </div>
          <span className={styles.addIcon} onClick={() => this.setState({ showAddOfficialModal: true })}>
            <AddIcon />
          </span>
        </div>
        <div className={styles.block}>
          <div className={styles.show}>
            <span className={styles.text}>客方:</span>
            {guestList.size > MAX_COUNT ?
              <div className={styles.list}>
                {guestList.map((role, k) => {
                  if (k <= MAX_COUNT - 1) {
                    return (
                      <Tooltip placement="top" key={k} title={`${role.get('roleTitle')} ${role.get('username')}`}>
                        {view != OFFICIAL ? (
                          role.get('avatar') ?
                            <img src={role.get('avatar')} className={styles.avatar}/>
                          :
                            <div className={styles.avatar} style={{ backgroundColor: '#d8d8d8' }}/>
                        ) : (
                          <div className={styles.avatarContainer}>
                            <div className={styles.mask} onClick={this.handleRemoveGuests.bind(null, role)}><AddIcon fill="#fff"/></div>
                            {role.get('avatar') ?
                              <img src={role.get('avatar')} className={styles.avatar}/>
                            :
                              <div className={styles.avatar} style={{ backgroundColor: '#d8d8d8' }}/>
                            }
                          </div>
                        )}
                      </Tooltip>
                    )
                  }
                })}
                <div className={styles.leftNumber} onClick={() => {this.setState({ showGuestList: true })}}>{guestList.size - MAX_COUNT}</div>
              </div>
            :
              <div className={styles.list}>
                {
                  guestList.map((role, k) => {
                    return (
                      <Tooltip placement="top" key={k} title={`${role.get('roleTitle')} ${role.get('username')}`}>
                        {view != OFFICIAL ? (
                          role.get('avatar') ?
                            <img src={role.get('avatar')} className={styles.avatar}/>
                            :
                            <div className={styles.avatar} style={{ backgroundColor: '#d8d8d8' }}/>
                        ) : (
                          <div className={styles.avatarContainer}>
                            <div className={styles.mask} onClick={this.handleRemoveGuests.bind(null, role)}><AddIcon fill="#fff"/></div>
                            {role.get('avatar') ?
                              <img src={role.get('avatar')} className={styles.avatar}/>
                              :
                              <div className={styles.avatar} style={{ backgroundColor: '#d8d8d8' }}/>
                            }
                          </div>
                      )}
                      </Tooltip>
                    )
                  })
                }
              </div>
            }
          </div>
          <span className={styles.addIcon} onClick={() => this.setState({ editGuestVisibility: true })}>
            <AddIcon />
          </span>
        </div>
        {this.state.showAddOfficialModal ? this.renderAddOfficialModal() : null}

        {/*查看官方所有成员modal*/}
        <Modal wrapClassName={styles.officialListModal}
          width={500}
          maskClosable={false}
          onCancel={() => {this.setState({ showOfficialList: false })}}
          visible={this.state.showOfficialList}
          footer={[]}
          title="添加官方"
        >
          <div className={styles.content}>
            {
              officials.map((role, k) => {
                return (
                  <div key={k} className={styles.item}>
                    {role.avatar ?
                      <img src={role.avatar} className={styles.avatar}/>
                    :
                      <div className={styles.avatar} style={{ backgroundColor: '#d8d8d8' }} />
                    }
                    <span className={styles.info}>{role.roleTitle}-{role.username}</span>
                  </div>
                )
              })
            }
          </div>
        </Modal>
        {/*查看客方所有成员modal*/}
        <Modal wrapClassName={styles.guestListModal}
          width={600}
          maskClosable={false}
          onCancel={() => {this.setState({ showGuestList: false })}}
          visible={this.state.showGuestList}
          footer={[]}
          title="参与者"
        >
          <div className={styles.content}>
            <div className={styles.inAffair}>
              <span className={styles.title}>事务内:</span>
              <div className={styles.show}>
                {
                  guests.get('innerAffair').map((role, k) => {
                    return (
                      <div className={styles.item} key={k}>
                        {role.get('avatar') ?
                          <img src={role.get('avatar')} className={styles.avatar}/>
                        :
                          <div className={styles.avatar} style={{ backgroundColor: '#d8d8d8' }} />
                        }
                        <span>{role.get('roleTitle')}-{role.get('username')}</span>
                      </div>
                    )
                  })
                }
              </div>
            </div>
            <div className={styles.inAlliance}>
              <span className={styles.title}>盟内:</span>
              {
                guests.get('innerAlliance').map((v, k) => {
                  return (
                    <div className={styles.show} key={k}>
                      <div className={styles.affairInfo}>
                        {/*{ v.get('affair').get('avatar') ? <AffairAvatar affair={v.get('affair')} sideLength={21}/> : <div className={styles.noAvatar} style={{backgroundColor:'#d8d8d8'}}></div> }*/}
                        <AffairAvatar affair={v.get('affair')} sideLength={21} />
                        <span className={styles.text}>-{v.get('affair').get('name')}</span>
                      </div>
                      <div className={styles.memberList}>
                        {
                          v.get('roleList').map((role, key) => {
                            return (
                              <div className={styles.item} key={key}>
                                {role.get('avatar') ?
                                  <img src={role.get('avatar')} className={styles.avatar}/>
                                :
                                  <div className={styles.avatar} style={{ backgroundColor: '#d8d8d8' }} />
                                }
                                <span>{role.get('roleTitle')}{v.get('affair').get('allianceName')}-{role.get('username')}</span>
                              </div>
                            )
                          })
                        }
                      </div>
                    </div>
                  )
                })
              }
            </div>
            <div className={styles.inAlliance}>
              <span className={styles.title}>盟客网:</span>
              {
                guests.get('menkor').map((v, k) => {
                  return (
                    <div className={styles.show} key={k}>
                      <div className={styles.affairInfo}>
                        {v.get('alliance').get('logoUrl') ?
                          <img src={v.get('alliance').get('logoUrl')} className={styles.noAvatar}/>
                        :
                          <div className={styles.noAvatar} style={{ backgroundColor: '#d8d8d8' }} />
                        }
                        <span className={styles.text}>{v.get('alliance').get('name')}</span>
                      </div>
                      <div className={styles.memberList}>
                        {
                          v.get('roleList').map((role, key) => {
                            return (
                              <div className={styles.item} key={key}>
                                {role.get('avatar') ?
                                  <img src={role.get('avatar')} className={styles.avatar}/>
                                :
                                  <div className={styles.avatar} style={{ backgroundColor: '#d8d8d8' }} />
                                }
                                <span>{role.get('roleTitle')}-{role.get('username')}</span>
                              </div>
                            )
                          })
                        }
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </div>
        </Modal>
      </div>
    )
  },
  renderChangeRecord(){
    const { version, announcement } = this.state
    return (
      <div className={styles.record}>
        <span className={styles.title}>发布变更记录</span>
        <div className={styles.subcontent}>
          {version.map((v, k) => {
            return (
              <div className={styles.subBox} key={k}>
                <Tooltip placement="left" title={v.username + '－' + v.roleName}><img className={styles.avatar} src={v.avatar || grayImage} /></Tooltip>
                <span
                  data-version={v.version}
                  onClick={this.handleGetCurrentVersion}
                  className={announcement.get('version') === v.version ? styles.selectedRecord : styles.changeRecord}
                >
                  {moment(v.createTime).format('YYYY年MM月DD日修改')}
                </span>
              </div>
            )
          })}
        </div>
        <div className={styles.subfooter}>
          <span className={styles.text}>显示与上版本差异</span>
          <Switch checkedChildren="开" unCheckedChildren="关" checked={this.state.showDifference} onChange={this.handleShowDifferrence}/>
        </div>
      </div>
    )
  },
  render(){
    const {
      announcement,
      isEditMode,
      scope,
      hasEditedTitle,
      hasEditedContent,
      questionOpen,
      officials,
      guests
    } = this.state
    if (!announcement.get('announcementId')) return null

    const { affair } = this.props
    const isOfficial = !!officials.find((v) => v.roleId === affair.roleId)

    return (
      <div className={styles.detailContainer}>
        {isEditMode ? (
          <div className={styles.backTitle} onClick={(hasEditedTitle || hasEditedContent) ? this.handleBackToDetail : this.handleBackdoor}>
            <span className={styles.backIcon}><DropDownIcon height="20" fill="#9b9b9b"/></span>
            <span>返回发布详情</span>
          </div>
        ) : (
          <div className={styles.backTitle} onClick={() => this.props.pushURL(`/workspace/affair/${this.props.params.id}/announcement`)}>
            <span className={styles.backIcon}><DropDownIcon height="20" fill="#9b9b9b"/></span>
            <span>返回发布列表</span>
          </div>
        )}

        <div className={styles.content}>
          {this.renderDetail()}
          {isEditMode &&
          <ModifyPublishModal
            announcement={announcement}
            callback={() => {
              this.setState({ isEditMode: false })
              this.getAnnouncementDetail(this.state.announcement.get('announcementId'), this.props.affair)
            }}
            affair={this.props.affair}
          />
          }
          <div className={styles.right}>
            {isOfficial &&
            <div className={styles.tabPanel}>
              <div
                className={scope === ANNOUNCEMENT_SCOPE.AFFAIR ? 'activeTab' : ''}
                onClick={() => this.handleChangeScope(ANNOUNCEMENT_SCOPE.AFFAIR)}
              >
                  事务内
              </div>
              <div
                className={scope === ANNOUNCEMENT_SCOPE.ALLIANCE ? 'activeTab' : ''}
                onClick={() => this.handleChangeScope(ANNOUNCEMENT_SCOPE.ALLIANCE)}
              >
                  盟内
              </div>
              <div
                className={scope === ANNOUNCEMENT_SCOPE.GUEST ? 'activeTab' : ''}
                onClick={() => this.handleChangeScope(ANNOUNCEMENT_SCOPE.GUEST)}
              >
                  盟客网
              </div>
            </div>
            }
            <CommunicationContainer
              affair={this.props.affair}
              announcementId={announcement.get('announcementId')}
              scope={scope}
              open={questionOpen}
              handleExpandQuestions={() => this.setState({ questionOpen: !questionOpen })}
            />
            <AnnouncementChat
              ref="announcementChat"
              affair={affair}
              scope={scope}
              isOfficial={isOfficial}
              announcementId={announcement.get('announcementId')}
              guests={guests.toJS()}
              officials={officials}
              style={questionOpen ? { bottom: -30, position: 'absolute', height: 0, flex: '0 1 auto' } : { display: 'flex', height: 'auto' }}
            />
          </div>
        </div>

        {this.renderConfirmModal()}
        {this.renderEditGuestModal()}
      </div>
    )
  }
})

function mapStateToProps(state, props) {
  const affair = state.getIn(['affair', 'affairMap', props.params.id])
  const user = state.get('user')
  const allianceList = state.getIn(['alliance', 'myAllianceList'])
  return {
    affair,
    user,
    allianceList,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    updateAffairAnnouncement: bindActionCreators(updateAffairAnnouncement, dispatch),
    updateAnnouncementPublictype: bindActionCreators(updateAnnouncementPublictype, dispatch),
    updateAnnouncementIsTop: bindActionCreators(updateAnnouncementIsTop, dispatch),
    updateAffairAnnouncementIndex: bindActionCreators(updateAffairAnnouncementIndex, dispatch),
    pushURL: bindActionCreators(pushURL, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AnnounceDetail)
