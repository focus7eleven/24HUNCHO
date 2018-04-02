import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styles from './AffairHomepageContainer.scss'
import { Tag, Form, Tooltip, Modal, Switch, Button, message, Input, notification } from 'antd'
import { FILE_TYPE, getFileTypeIcon, getFileType } from 'filetype'
import AffairAvatar from '../../components/avatar/AffairAvatar'
import { PlanTimeline, AddPersonIcon, StarIcon, SprigDownIcon, RMBIcon, DollarIcon, VideoPlay, LogoIcon, BoardIcon, ImgEditIcon, DeleteIcon, EditIcon } from 'svg'
// import { Motion, spring } from 'react-motion'
import CreateAffair from './CreateAffair'
import { deleteOrAddCover, modifyAffairInfo, fetchAffairChildren, updateAffairTags, changeAffairDescription, changeAffairTag } from '../../actions/affair'
// import AffairMemberCard from '../../components/card/AffairMemberCard'
import AffairEditCover from './AffairEditCover'
import AffairAddCover from './AffairAddCover'
import { Affair } from '../../models/Affair'
// import classnames from 'classnames'
import { PERMISSION_MAP } from 'permission'
import config from '../../config'
// import { homeAnnouncementTime } from 'time'
import { Map, List } from 'immutable'
import FilePreview from '../file/FilePreview'
import moment from 'moment'
import oss from 'oss'
import currencyFormatter from '../../utils/currencyWrap'
import { getAffairInfo, fetchFollowedAffairList } from '../../actions/affair'
import { pushURL, pushPermittedURL } from 'actions/route'
import ApplyAttendAffairModal from '../../components/modal/ApplyAttendAffairModal'
import _ from 'underscore'
import messageHandler from 'messageHandler'
import PERMISSION from 'utils/permission'
import imageNoPermission from 'images/img_no_permissions.png'
// const Item = Form.Item
// const Option=Select.Option
// const DESCRIPTION_MAX_LENGTH = 300
const OFFICIAL = 'OFFICIAL'
const GUEST = 'GUEST'

export const PUBLIC_TYPE = {
  OPEN: 0,
  SECRET: 3
}
const FundMap = {
  CNY: <RMBIcon/>,
  JPY: <RMBIcon/>,
  USD: <DollarIcon/>,
  GBP: <DollarIcon/>,
  EUR: <DollarIcon/>,
}
const FundName = {
  CNY: '人民币',
  EUR: '欧元',
  USD: '美元',
  JPY: '日元',
  GBP: '英镑',
}
const HISTORY = 'history', RECORD = 'record'

const HomepageComponent = React.createClass({
  PropTypes: {
    affair: PropTypes.object.isRequired,
  },

  getInitialState() {
    const covers = JSON.parse(this.props.affair.get('covers'))
    const description = this.props.affair.get('description')

    return {
      topAnnouncementList: null, //置顶发布
      newAnnouncementList: null, //最新发布
      taskInfo: null, //任务列表
      isTop: false, //是否查看置顶发布
      publicRoles: [], //公开角色
      publicFunds: [], //公开资金
      publicMaterial: [], //公开物资
      publicAnnouncement: [], //公开公告
      publicFile: Map(), //公开文件
      currentFilePath: '/', //当前文件目录
      fileLoadDone: false, //文件是传输完
      previewFile: null, //预览的文件
      previewModalShow: false, //预览文件modal
      versions: [], // 预览文件的历史版本
      currentPreviewVersion: 1,
      logs: [],
      previewTab: HISTORY, //预览右侧菜单，默认为历史版本
      chosenCover: covers.length == 0 ? null : covers[0],
      showApplyModal: false,
      showCoverEditModal: false,
      addingCover: null,
      isModifyingDescription: false,
      description: description,
      guestTab: 0,
      isAddingTag: false,
      tags: this.props.affair.getTags(),
      addingTag: '',
      isBtnClicked: false,
      childList: this.props.affair.get('children'),
      affairToAdd: null,
    }
  },
  componentWillMount() {
    this.fetchPublicRoles(this.props)
    // this.refresh(this.props)
    // this.fetchMemberInformation(this.props.affair)
    // this.props.fetchAffairChildren(this.props.affair.get('id'), this.props.affair.get('roleId'))
  },
  componentWillReceiveProps(nextProps){
    if (nextProps.affair.get('id') != this.props.affair.get('id')) {
      // this.fetchMemberInformation(nextProps.affair)
      // this.props.fetchAffairChildren(nextProps.affair.get('id'), nextProps.affair.get('roleId'))
      this.setState(this.getInitialState())
      this.fetchPublicRoles(nextProps)
      // this.refresh(nextProps)
    }
    const covers = JSON.parse(nextProps.affair.get('covers'))
    this.setState({
      chosenCover: covers.length == 0 ? {} : covers[0],
      description: nextProps.affair.get('description'),
      tags: nextProps.affair.getTags(),
      childList: nextProps.affair.get('children'),
    })
  },
  refresh(nextProps){
    const { affair } = nextProps
    const covers = JSON.parse(affair.get('covers'))
    this.setState({ chosenCover: covers.length == 0 ? {} : covers[0], })

    // const resourcePublic = affair.get('resourcePublic') || Map()
    // const resourcePublicList = ['role', 'fund', 'material', 'announcement', 'file']
    // this.setState({
    //   guestTab: resourcePublic
    //     .filter((v) => v == true)
    //     .map((v, k) => resourcePublicList.indexOf(k))
    //     .toList()
    //     .sort((a, b) => a - b)
    //     .get(0)
    // })
    // this.fetchTaskList(nextProps)
    // this.fetchTopAnnouncement(nextProps)
    // this.fetchNewAnnouncement(nextProps)
    this.fetchPublicRoles(nextProps)
    this.fetchPublicFunds(nextProps)
    this.fetchPublicMaterial(nextProps)
    this.fetchPublicAnnouncement(nextProps)
    this.fetchPublicFile(nextProps, 0, '/')
    this.props.fetchAffairChildren(nextProps.affair.get('id'), nextProps.affair.get('roleId'))
    // this.fetchChildAffair(nextProps)
  },
  componentDidUpdate() {
    // if (preProps.params.id != this.props.params.id) {
    //   // 切换事务,重置state
    //   this.setState(this.getInitialState())
    //   this.fetchMemberInformation(this.props.affair)
    // } else if (!preProps.affair.get('covers') && this.props.affair.get('covers')) {
    //   const covers = JSON.parse(this.props.affair.get('covers'))
    //   //获得事务详细信息更新了封面,从无到有
    //   this.setState({
    //     chosenObj: covers[0]
    //   })
    // } else if (preProps.affair.get('covers') && this.props.affair.get('covers')) {
    //   const pre = JSON.parse(preProps.affair.get('covers'))
    //   const current = JSON.parse(this.props.affair.get('covers'))
    //   if (pre.length === current.length - 1) {
    //     // 新增封面时打开编辑Modal
    //     this.setState({
    //       chosenObj: current[current.length - 1],
    //       showCoverEditModal: true,
    //     })
    //   }
    // }
    //
    if (this.state.isAddingTag) {
      this.refs.tagInput.refs.input.focus()
    }
  },
  // fetchMemberInformation(affair) {
  //   const data = {
  //     key: '',
  //     page: 1,
  //     count: 100,
  //     sortColumn: 'name',
  //     isReverseSort: false,
  //     includeSubAffair: false,
  //     needTotal: true,
  //   }
  //
  //   fetch(config.api.affair.member.current(affair.get('id'), affair.get('roleId')), {
  //     headers: {
  //       'Accept': 'application/json',
  //       'Content-Type': 'application/json'
  //     },
  //     method: 'POST',
  //     credentials: 'include',
  //     body: JSON.stringify(data),
  //   }).then((res) => {
  //     return res.json()
  //   }).then((json) => {
  //     if (json.code==0) {
  //       this.setState({
  //         memberlist: json.data.list,
  //       })
  //     }
  //   })
  //
  //   fetch(config.api.affair.member.director(affair.get('id')), {
  //     method: 'GET',
  //     credentials: 'include',
  //   }).then((res) => res.json()).then((json) => {
  //     this.setState({
  //       director: json.data
  //     })
  //   })
  // },

//   handleDeleteCover() {
    // const {
    //   affair,
    // } = this.props
    // let affairMemberId = affair.get('affairMemberId')
    // let oldCovers = JSON.parse(this.props.affair.get('covers'))
    // let newChosenIndex = 0
    // let newCovers = oldCovers.filter((cover, index) => {
    //   if (cover.url == this.state.chosenObj.url && cover.name == this.state.chosenObj.name) {
    //     newChosenIndex = Math.max(index - 1, 0)
    //     return false
    //   } else {
    //     return true
    //   }
    // })

    // this.props.deleteOrAddCover({
    //   newAffair: this.props.affair.set('covers', JSON.stringify(newCovers)),
    //   affairMemberId: affairMemberId
    // },
    //   () => {
    //     this.setState({
    //       chosenObj: newCovers[newChosenIndex] || {}
    //     })
    //   })
//   },
//
//   /**
//    * 点击添加描述或编辑按钮
//    */
//   handleEditDescription(){
//     this.setState({
//       isDescriptionChanging: true,
//       description: this.props.affair.get('description')
//     })
//   },
//
//   /**
//    * 取消更改事务描述
//    */
//   handleDescriptionCancel() {
//     this.setState({
//       isDescriptionChanging: false
//     })
//   },
//
//   /**
//    * 保存事务描述
//    */
//   handleDescriptionSave() {
//     let { affair, modifyAffairInfo } = this.props
//     modifyAffairInfo(affair, affair.get('affairMemberId'), {
//       description: this.state.description,
//     }).then(() => {
//       this.setState({
//         isDescriptionChanging: false
//       })
//     })
//   },
//
//   //添加标签
//   handleTaginputChange(e){
//     this.setState({
//       tag:e.target.value,
//     })
//   },
//
//
//   handleTaginputBlur(){
//     let disappear=_.debounce(() => {
//       if (this.state.isBtnClicked){
//         this.setState({
//           isBtnClicked:false,
//         })
//         return
//       }
//       else {
//         this.setState({
//           isAddingTag:false,
//         })
//       }
//     }, 200)
//     disappear()
//   },
//
//   handleAddTag(){
//     let tags = this.props.affair.getTags()
//     this.setState({
//       isBtnClicked:true,
//     })
//     if (this.state.tag.length < 2) {
//       notification.error({
//         message:'标签长度应为2-12个字符'
//       })
//       return
//     }
//     if (tags.length >= 8) {
//       notification.error({
//         message:'至多添加8个标签'
//       })
//       return
//     }
//     if (tags.some((v) => v==this.state.tag)){
//       notification.error({
//         message:'标签不能重复'
//       })
//       return
//     }
//     tags.push(this.state.tag)
//     fetch(config.api.affair.tag.update(this.props.affair.get('affairMemberId'), JSON.stringify(tags)), {
//       method: 'POST',
//       credentials: 'include',
//     }).then((res) => res.json()).then((json) => {
//       if (json.code==0){
//         this.setState({
//           tag: '',
//           isBtnClicked: false,
//           isAddingTag: false,
//         })
//         this.props.updateAffairTags(this.props.affair.get('id'), JSON.stringify(tags))
//       }
//       else {
//         notification.error({
//           message:'添加标签失败'
//         })
//       }
//     })
//   },
//
//   //删除标签
//   handleRemoveTag(index) {
//     let newTags = this.props.affair.getTags()
//     newTags.splice(index, 1)
//
//     fetch(config.api.affair.tag.update(this.props.affair.get('affairMemberId'), JSON.stringify(newTags)), {
//       method: 'POST',
//       credentials: 'include',
//     }).then((res) => res.json()).then(() => {
//       this.props.updateAffairTags(this.props.affair.get('id'), JSON.stringify(newTags))
//     })
//   },
//
//   /**
//    * 更改事务描述,限制最多输入300字
//    * @param e
//    */
//   handleDescriptionInput(e) {
//     let descriptionNew = e.target.value
//     this.setState({
//       description: descriptionNew.length > DESCRIPTION_MAX_LENGTH ? descriptionNew.substring(0, DESCRIPTION_MAX_LENGTH): descriptionNew
//     })
//     let textarea = this.refs.descriptionInput.refs.input
//     textarea.scrollTop = textarea.scrollHeight
//   },
//
//   // 点击子事务头像，展示相应子事务的信息。
//   handleClickChildAffair(affairId) {
//     if (this.props.affair.hasPermission(PERMISSION_MAP.CHECK_SUB_AFFAIR)){
//       this.props.pushURL(`/workspace/affair/${affairId}`)
//     }
//     else {
//       message.error('您没有权限查看子事务')
//     }
//   },
//
//   renderBasicinfo(){
//     const { affair, form } = this.props
//     const { getFieldProps, getFieldError } = form
//     const o =this
//     const xstep = 108
//     const covers = JSON.parse(affair.get('covers') || '[]')
//     const tags = affair.getTags()
//     const play = function() {
//       let video = document.getElementById('videoplayer')
//       if (video.paused) {
//         video.play()
//         document.getElementById('videoplay').style.display = 'none'
//       } else {
//         document.getElementById('videoplay').style.display = 'block'
//         video.pause()
//       }
//     }
//     const moveRight=() => {
//       if (covers.length > 3 && Math.abs(this.state.slidex.x)!=(covers.length-3)*xstep){
//         this.setState({
//           slidex:{
//             x:this.state.slidex.x-xstep
//           }
//         })
//       }
//     }
//     const moveLeft=() => {
//       if (this.state.slidex.x!=0){
//         this.setState({
//           slidex:{
//             x:this.state.slidex.x+xstep
//           }
//         })
//       }
//     }
//     const applyJoin = () => {
//       this.setState({
//         showApplyModal: true,
//       })
//     }
//
//     const handleCancel=() => {
//       this.setState({
//         showApplyModal:false,
//         reasonWordNum:0,
//       })
//       this.props.form.resetFields()
//     }
//     const handleCommit=() => {
//       this.props.form.validateFields((errors) => {
//         if (errors){
//           return
//         } else {
//           const role = this.props.user.get('roles').find((v) => v.get('roleId') == form.getFieldValue('role'))
//           const affair = this.props.affair
//           fetch(config.api.affair.join.apply(affair.get('id'), role.get('roleId'), form.getFieldValue('reason')), {
//             method:'POST',
//             credentials:'include',
//           }).then((res) => {
//             return res.json()
//           }).then((json) => {
//             if (json.code == 0 || json.code == 103) {
//               this.setState({ showApplyModal:false, reasonWordNum: 0 })
//               form.resetFields()
//               message.info('已发送加入事务申请给事务管理员，请耐心等待')
//             }
//           })
//         }
//       })
//     }
//
//     const countWord=(e) => {
//       this.setState({ reasonWordNum: e.target.value.length })
//     }
//
//     const renderModal=() => {
//       return (
//         <Modal
//           maskClosable={false}
//           wrapClassName={styles.applyModal}
//           title="申请加入事务"
//           visible={this.state.showApplyModal}
//           onCancel={handleCancel}
//           width={500}
//           footer={[
//             <div key="applyfoot">
//               <Button type="ghost" size="large" key="applycancel" onClick={handleCancel}>取消</Button>
//               <Button type="primary" size="large" key="applysure" onClick={handleCommit}>确定</Button>
//             </div>]}
//         >
//           <Form layout="horizontal">
//             <Item style={{ height:'32px', overflow:'visible' }}>
//               <label className={styles.roleLabel}>选择角色:</label>
//               <Select className={styles.role} {...getFieldProps('role', {
//                 rules:[
//                   {
//                     required:true,
//                     message:'请选择加入角色'
//                   }
//                 ]
//               })} placeholder="请选择角色" dropdownClassName={styles.roleDropdown}
//               >
//                 {
//                   this.props.user.get('roles').map((value, key) => {
//                     return (<Option value={value.get('roleId').toString()} key={key.toString()}>
//                       <div><span className={styles.roleText}>{value.get('roleName')}</span><span className={styles.allianceText}>{value.get('allianceName')}</span></div>
//                     </Option>)
//                   })
//                 }
//               </Select>
//             </Item>
//             <Item help={getFieldError('reason')} style={{ marginTop: '30px', height: '175px' }}>
//               <label className={styles.reasonLabel}>申请理由:</label>
//               <Input type="textarea" className={styles.reason} {...getFieldProps('reason', {
//                 initialValue: '', rules: [
//                   {
//                     max: 300,
//                     message: '申请理由小于300个字符',
//                   },
//                   {
//                     required:true,
//                     message:'请填写申请理由'
//                   }
//
//                 ], onChange: countWord
//               })} autosize={{ minRows: 4, maxRows: 4 }}
//               />
//               <span className={styles.span}>{`${this.state.reasonWordNum}/300`}</span>
//             </Item>
//           </Form>
//         </Modal>)
//     }
//
//     return (<div className={styles.baseInfo}>
//       {this.state.showApplyModal ? renderModal() : null}
//       <div className={styles.leftPanel}>
//         {
//           covers.length == 0 ?
//             <div className={styles.objNullShow}>
//               <LogoIcon width="170"/>
//             </div>
//               :
//             <div className={styles.objShow}>
//               <div className={styles.coverContainer}>
//                 <div className={styles.imgMask} onClick={this.state.chosenObj.type ?null : play}>
//                   <div className={styles.functionIcon} onClick={(e) => e.stopPropagation()}>
//                     <Tooltip title="编辑" arrowPointAtCenter>
//                       <ImgEditIcon onClick={() => {this.setState({ showCoverEditModal:true })}}
//                         className={styles.imgOpt}
//                       />
//                     </Tooltip>
//                     <Tooltip title="删除" arrowPointAtCenter>
//                       <DeleteIcon onClick={this.handleDeleteCover} className={styles.imgOpt}/>
//                     </Tooltip>
//                   </div>
//                 </div>
//                 {this.state.chosenObj.type ?
//                   <img className={styles.img} src={this.state.chosenObj.url}/>
//                       :
//                   <div className={styles.videoDiv}>
//                     <div style={{ zIndex:5 }} onClick={() => {play()}}><VideoPlay width={60} height={60}/></div>
//                     <video className={styles.videoPic} id="videoplayer" src={this.state.chosenObj.url} />
//                   </div>
//                   }
//                 {
//                     this.state.chosenObj.description ? <div className={styles.description}>
//                       {this.state.chosenObj.description}
//                     </div> : null
//                   }
//               </div>
//             </div>
//         }
//
//         <div className={styles.carouselDiv}>
//           <span onClick={moveLeft} className={styles.leftIcon}><NextIcon height="23" fill={this.state.slidex.x==0?'#ccc':'#9b9b9b'}/></span>
//           <Motion style={{ x:spring(this.state.slidex.x) }}>
//             {({ x }) =>
//               (<div className={styles.slidecontainer}>
//                 {covers.map(function(self, index){
//                   return self.type?
//                     <img key={'img_'+index} className={classnames(styles.item, o.state.chosenObj.url==self.url? 'active':'')} src={self.url} onClick={() => {o.setState({ chosenObj:self })}} style={{ transform:`translate3d(${x}px,0,0)` }} />:
//                     <div key={'video_'+index} className={classnames(styles.item, o.state.chosenObj.url==self.url? 'active':'')}
//                       onClick={() => {o.setState({ chosenObj:self })}} style={{ transform:`translate3d(${x}px,0,0)` }}
//                     ><video src={self.url} className={styles.videoPic} /></div>
//                 })}
//
//                 {affair.hasPermission(PERMISSION_MAP.EDIT_AFFAIR_INFO)?<AffairAddCover className={styles.add} style={{ transform:`translate3d(${x}px,0,0)` }} affair={this.props.affair} />:null}
//               </div>)
//             }
//           </Motion>
//           <span onClick={moveRight} className={styles.rightIcon}><NextIcon height="23" fill={(covers.length <= 3 || Math.abs(this.state.slidex.x)==(covers.length-3)*xstep)?'#ccc':'#9b9b9b'}/></span>
//         </div>
//         {this.state.showCoverEditModal ?
//           <AffairEditCover visible={this.state.showCoverEditModal} cover={this.state.chosenObj}
//             affair={this.props.affair}
//             onClose={() => {this.setState({ showCoverEditModal:false })}}
//             onModifyCover={(newChosenObj) => this.setState({ chosenObj: newChosenObj })}
//           /> : null}
//       </div>
//
//       <div className={styles.rightPanel}>
//         <div className={styles.affairIntro}>
//           {this.state.isDescriptionChanging ?
//             <div>
//               <Input type="textarea" value={this.state.description} onChange={this.handleDescriptionInput} ref="descriptionInput"/>
//               <div className={styles.textareaFooter}>
//                 <div
//                   className={classnames('u-text-l-12', this.state.description.length==DESCRIPTION_MAX_LENGTH ? styles.overFlow:'')}
//                   style={{ lineHeight: '1.8' }}
//                 >{this.state.description.length}/{DESCRIPTION_MAX_LENGTH}</div>
//                 <div className={styles.textareaOps}>
//                   <span onClick={this.handleDescriptionCancel}>取消</span>
//                   <span onClick={this.handleDescriptionSave}>保存</span>
//                 </div>
//               </div>
//             </div>
//               :
//               affair.get('description') ?
//                 <div className={styles.text}>
//                   <span style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{affair.get('description')}</span>
//                   {affair.hasPermission(PERMISSION_MAP.EDIT_AFFAIR_INFO) ?
//                     <EditIcon onClick={this.handleEditDescription} />
//                         :
//                         null
//                     }
//                 </div>
//                   :
//                 <div className={styles.textNull}>
//                   <span>暂无事务描述</span>
//                   {affair.hasPermission(PERMISSION_MAP.EDIT_AFFAIR_INFO)?
//                     <div className={styles.link} onClick={this.handleEditDescription}>添加描述</div>
//                         :
//                         null
//                     }
//                 </div>
//           }
//
//           {!affair.get('affairMemberId') ? (
//             <div className={styles.btnContainer}>
//               <Button className={styles.btn} type="primary" onClick={applyJoin}>加入此事务</Button>
//             </div>
//           ) : (
//             <div className={styles.inContainer}>
//               <span className={styles.label}><Icon type="check-circle-o"/>&nbsp;已加入此事务</span>
//               {
//                 affair.get('ownerRoleId')==affair.get('roleId')
//                   ?
//                   null
//                   :
//                   <Button className={styles.quitBtn}>退出此事务</Button>
//               }
//               <div className={styles.clear} />
//             </div>
//           )}
//         </div>
//
//         <div className={styles.labelDiv}>
//           <div className={styles.label}>这里是事务成员为事务添加的标签:</div>
//           <div className={styles.labelList}>
//             <div className={styles.showTag}>
//               {tags.map((self, index) => {
//                 return (
//                   <div className={styles.tagContainer} key={'tag_'+index}>
//                     {affair.hasPermission(PERMISSION_MAP.MODIFY_AFFAIR) ? <div className={styles.removeTagMask} onClick={this.handleRemoveTag.bind(this, index)}>移除</div> : null}
//                     <Tag>
//                       {self}
//                     </Tag>
//                   </div>
//                 )
//               })}
//             </div>
//             {
//               affair.hasPermission(PERMISSION_MAP.MODIFY_AFFAIR)?this.state.isAddingTag?
//                 <div className={styles.addtagContainer} onClick={(e) => {e.stopPropagation()}}>
//                   <Input maxLength="12" className={styles.tagInput} placeholder="标签内容" onChange={this.handleTaginputChange} onBlur={this.handleTaginputBlur} onPressEnter={this.handleAddTag} ref="tagInput"/>
//                   <i onClick={this.handleAddTag}>+</i>
//                 </div>
//                   :
//                 <Button type="dashed" className={styles.btn} onClick={() => {this.setState({ isAddingTag:true })}}>+</Button>
//                 :null
//             }
//           </div>
//         </div>
//       </div>
//     </div>)
//   },
//
//   renderChildrenAffair(){
//     {/*第8层不允许有子事务,不显示子事务模块*/}
//     const { affair }=this.props
//     return affair.get('level').size > 7 ?
//       null
//       :
//       <div className={styles.childAffair}>
//   <div className={styles.title}>子事务</div>
//   <div className={styles.childrenList}>
//     {
//             affair.get('children').map((node) => {
//   node = node.merge({
//     level: affair.get('level') + 1,
//     allianceId: affair.get('allianceId'),
//     avatar:affair.get('avatar'),
//   })
//
//   return (
//     <div className={styles.children} key={node.get('id')}>
//       <div>
//         <AffairAvatar className={styles.childrenAvatar} affair={new Affair(node)} sideLength={56} onClick={this.handleClickChildAffair.bind(this, node.get('id'))} />
//       </div>
//       <span>{node.get('name')}</span>
//     </div>
//   )
// })
//           }
//     {
//             this.props.affair.hasPermission(PERMISSION_MAP.CREATE_AFFAIR)
//               ?
//   <div className={styles.children}>
//     <div>
//       <div className={styles.createAffair} onClick={() => this.setState({ newAffairModal: true })}>+</div>
//     </div>
//     <span style={{ color:'#d9d9d9' }}>创建事务</span>
//   </div>
//               :
//               null
//           }
//
//   </div>
//       </div>
//   },
//   renderMoney(){
//     const o = this
//     const boxHeight=58
//
//     const money = _.range(8)
//     money.map(function(self, index) {
//       money[index] = {
//         id: index,
//         type: '人民币',
//         number: 1000000000 + index,
//       }
//     })
//     let moneyTrans=(str) => {
//       if (str.indexOf(',')>0){
//         return
//       }
//       let newStr=''
//       let count=0
//       if (str.indexOf('.')==-1){
//         for (let i=str.length-1;i>=0;i--){
//           if (count % 3 == 0 && count != 0){
//             newStr = str.charAt(i) + ',' + newStr
//           } else {
//             newStr = str.charAt(i) + newStr
//           }
//           count++
//         }
//         return newStr + '.00' //自动补小数点后两位
//       }
//       else
//       {
//         for (let i = str.indexOf('.')-1;i>=0;i--){
//           if (count % 3 == 0 && count != 0){
//             newStr = str.charAt(i) + ',' + newStr
//           } else {
//             newStr = str.charAt(i) + newStr //逐个字符相接起来
//           }
//           count++
//         }
//         return newStr + (str + '00').substr((str + '00').indexOf('.'), 3)
//       }
//     }
//
//     money.map(function(self){
//       self.number=moneyTrans(self.number.toString())
//     })
//
//     const moveDown=() => {
//       if (this.state.slidey.last==money.length){
//         return
//       }
//       else {
//         if (this.state.slidey.last==(money.length-2)){
//           this.setState({
//             slidey:{
//               y:this.state.slidey.y-boxHeight,
//               last:this.state.slidey.last+1,
//               down:'hidden',
//             }
//           })
//         }
//         else {
//           this.setState({
//             slidey:{
//               y:this.state.slidey.y-boxHeight,
//               last:this.state.slidey.last+1,
//             }
//           })
//         }
//
//       }
//     }
//     const moveUp=() => {
//       if (this.state.slidey.y==0){
//         return
//       }
//       else {
//         if (this.state.slidey.last==3){
//           this.setState({
//             slidey:{
//               y:this.state.slidey.y+boxHeight,
//               last:this.state.slidey.last-1,
//               up:'hidden',
//             }
//           })
//         }
//         else {
//           this.setState({
//             slidey:{
//               y:this.state.slidey.y+boxHeight,
//               last:this.state.slidey.last-1,
//             }
//           })
//         }
//       }
//     }
//
//     return (<div className={styles.money}>
//       <div className={styles.header}>
//         <span>思目基金</span>
//       </div>
//       <div className={styles.content}>
//         <span onClick={moveUp} className={styles.upIcon} style={{ visibility:this.state.slidey.up }}><NextIcon height="17" fill="#9b9b9b" /></span>
//         <Motion style={{ y:spring(this.state.slidey.y) }}>
//           {({ y }) =>
//             (<div className={styles.boxContainer}>
//               {money.map(function(self, index){
//                 return (<div key={'moneybox_'+index} className={styles.box} style={{ transform:`translate3d(0,${y}px,0)` }}>
//                   <div className={styles.icon}><DollarIcon fill="#9b9b9b"/></div>
//                   <div className={styles.msg} style={index==o.state.slidey.last?{ borderBottom:'none' }:{}}>
//                     <span className={styles.moneyType}>{self.type}</span>
//                     <span className={styles.balabala}>总额:&nbsp;<span className={styles.moneyNumber}>{self.number}</span>&nbsp;元</span>
//                   </div>
//                 </div>)
//               })}
//             </div>)
//             }
//         </Motion>
//         <span onClick={moveDown} className={styles.downIcon} style={{ visibility:this.state.slidey.down }}><NextIcon height="17" fill="#9b9b9b" /></span>
//       </div>
//     </div>)
//   },
//
//   renderAsset(){
//     const { assetList } = this.state
//
//     return (<div className={styles.asset}>
//       <div className={styles.assetTitle}>
//         <span>在售商品</span>
//         <span>更多<NextIcon height="10" fill="#4990E2"/></span>
//       </div>
//       <div className={styles.assetList}>
//         {
//           assetList.map((asset, index) => {
//             return (
//               <div className={styles.assetInfo} key={index}>
//                 <div className={styles.image}>{asset.image}</div>
//                 <div className={styles.name}>{asset.name}</div>
//                 <div className={styles.sales}>
//                   <span>¥{asset.price}</span>
//                   <span>{'已售：'+asset.saled+'件'}</span>
//                 </div>
//               </div>
//             )
//           })
//         }
//       </div>
//     </div>)
//   },
//
//   renderMembers(){
//     const { memberlist }=this.state
//     return <div className={styles.members}>
//       <div className={styles.title}>事务成员</div>
//       <div className={styles.memeberList}>
//         <div className={styles.groupWrapper}>
//           <div className={styles.managerGroup}>
//             <AffairMemberCard className={styles.memberCard} member={this.state.director} key="director" />
//           </div>
//         </div>
//         <div className={styles.groupWrapper}>
//           <div className={styles.userGroup}>
//             {
//               memberlist.map((member, k) => {
//   if (this.state.director && member.userId!=this.state.director.userId){
//     return <AffairMemberCard className={styles.memberCard} member={member} key={k} />
//   }
// })
//             }
//           </div>
//         </div>
//       </div>
//     </div>
//   },

  //暂时保留旧版首页
  // render() {
  //   const affair = this.props.affair
  //   const { newAffairModal,} = this.state
  //
  //   return (
  //     <div className={styles.container}>
  //       {this.renderBasicinfo()}
  //    {this.renderChildrenAffair()}
  //
  //
  //       <div className={styles.moneyAndAsset}>{this.renderMoney()}{this.renderAsset()}</div>
  //    {this.renderMembers()}
  //       <CreateAffair parentAffair={affair} visible={newAffairModal} onCloseModal={() => this.setState({ newAffairModal: false })}/>
  //     </div>
  //   )
  // }
  getViewType() {
    const { affair } = this.props

    if (affair && !!affair.get('affairMemberId')) {
      return OFFICIAL
    } else {
      return GUEST
    }
  },
  fetchTaskList(props){
    const { affair } = props
    fetch(config.api.task.overview(), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.setState({
          taskInfo: json.data,
        })
      }
    })
  },
  fetchTopAnnouncement(props){
    const { affair } = props
    fetch(config.api.task.announcement.top(true), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.setState({
          topAnnouncementList: json.data || [],
        })
      }
    })
  },
  fetchNewAnnouncement(props){
    const { affair } = props
    fetch(config.api.task.announcement.top(false), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.setState({
          newAnnouncementList: json.data || [],
        })
      }
    })
  },
  fetchPublicRoles(props){
    const { affair } = props

    fetch(config.api.affair.role.public(), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.setState({
          publicRoles: json.data || [],
        })
      }
    })
  },
  fetchPublicFunds(props){
    const { affair } = props
    fetch(config.api.fund.public(), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.setState({
          publicFunds: json.data ? json.data : [],
        })
      }
    })
  },
  fetchPublicMaterial(props){
    const { affair } = props

    fetch(config.api.material.public(), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.setState({
          publicMaterial: json.data || [],
        })
      }
    })
  },
  fetchPublicAnnouncement(props){
    const { affair } = props
    fetch(config.api.announcement.overview(), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isContainerChildren: false,
        limit: 0,
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.setState({
          publicAnnouncement: json.data.list,
        })
      }
    })
  },
  fetchPublicFile(props, folderId, path){
    const { affair } = props
    this.setState({
      fileLoadDone: false,
    })
    fetch(config.api.file.fileList.get(folderId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        const data = json.data
        let files = data.folders.map((folder) => {
          folder.type = FILE_TYPE.FOLDER
          folder.fileName = folder.name
          folder.id = folder.folderId
          return folder
        }).concat(data.files.map((file) => {
          file.type = getFileType(file.name)
          file.fileName = file.name
          return file
        }))
        this.setState({
          publicFile: this.state.publicFile.set(path, Map({
            folderId: parseInt(folderId),
            publicType: data.publicType,
            files: List(files),
          })),
          fileLoadDone: true,
        })
      }
      else {
        message.error('获取文件列表失败！')
      }
      this.setState({ loading: false })
    })
  },
  fetchLogs(file) {
    fetch(config.api.file.logs.get(file.id), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.setState({
          logs: res.data,
        })
      }
    })
  },
  // fetchChildAffair(props){
  //   fetch(config.api.affair.children.get(), {
  //     method: 'GET',
  //     credentials: 'include',
  //     affairId: props.affair.get('id'),
  //     roleId: props.affair.get('roleId'),
  //   }).then((res) => res.json()).then((json) => {
  //     if (json.code == 0){
  //       this.setState({
  //         childList: json.data
  //       })
  //     }
  //   })
  // },
  handleSwitchFilePreviewTab(tab) {
    this.setState({ previewTab: tab })

    if (tab === RECORD) {
      //重新获取文件记录
      this.fetchLogs(this.state.previewFile)
    }
  },
  //预览文件
  handlePreview(e, file, fileVersion = null){
    e.stopPropagation()
    // 获取文件的所有历史版本列表
    fetch(config.api.file.versions.get(file.id), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      this.setState({
        previewFile: file,
        previewModalShow: true,
        currentPreviewVersion: fileVersion || file.version,
        versions: res.data || [],
      })
    })

    if (file.publicType === PUBLIC_TYPE.SECRET) {
      this.fetchLogs(file)
    }
  },
  //进入文件夹
  handleEnterFolder(e, path, folderId){
    e.stopPropagation()
    this.fetchPublicFile(this.props, folderId, path)
    this.setState({
      currentFilePath: path,
    })
  },
  //返回上一级
  handleBackFolder(){
    let old = this.state.currentFilePath
    let arr = old.split('/')
    old = arr.slice(0, arr.length - 1).join('/')
    old = old == '' ? ('/' + old) : old
    this.setState({
      currentFilePath: old,
    })
  },
  handleStarAffair(star){
    fetch(config.api.affair.star(this.props.affair.get('id'), star), {
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        const msg = star ? '关注成功' : '取消关注成功'
        message.success(msg, 0.5)
        this.props.getAffairInfo(this.props.affair.get('id'), this.props.affair.get('roleId'))
        this.props.fetchFollowedAffairList()
      }
    })
  },
  handleChangeFilesPublicType(changeFiles, publicType) {
    let files = [], folders = []
    changeFiles.forEach((file) => file.type === FILE_TYPE.FOLDER ? folders.push(file) : files.push(file))

    const path = this.state.currentFilePath

    let fileMap = this.state.publicFile

    fetch(config.api.file.publicType.edit(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      body: JSON.stringify({
        publicType: publicType,
        fileIds: files.map((v) => v.id),
        folderIds: folders.map((v) => v.id)
      })
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        files.concat(folders).forEach((file) => {
          fileMap = fileMap.updateIn([path, 'files'], (fileList) => {
            return fileList.update(fileList.findIndex((v) => v.id === file.id), (v) => {
              v.publicType = publicType
              v.modifyTime = moment().format('YYYY-MM-DD HH:mm:ss')
              return v
            })
          })
        })
        this.setState({
          fileMap
        })
      } else {
        message.error('修改文件保密性失败！')
      }
    })
  },
  handleCancelApply() {
    fetch(config.api.affair.join.cancel_apply(this.props.affair.get('id')), {
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.props.getAffairInfo(this.props.affair.get('id'), this.props.affair.get('roleId'))
      }
    })
  },
  downloadFiles(files, version = null) {
    const { affair } = this.props

    files.map((file) => {
      oss.getFileToken(config.api.file.token.download(), affair.get('id'), affair.get('roleId'), file.id, file.fileName, version || file.version).then((url) => {
        let link = document.createElement('a')
        if (typeof link.download === 'string') {
          document.body.appendChild(link) // Firefox requires the link to be in the body
          link.download = file.fileName
          link.href = url
          link.click()
          document.body.removeChild(link) // remove the link when done
        } else {
          location.replace(url)
        }
      })
    })
  },
  handleDeleteCover(){
    const {
      affair,
    } = this.props
    let affairMemberId = affair.get('affairMemberId')
    let oldCovers = JSON.parse(this.props.affair.get('covers'))
    let newCovers = oldCovers.filter((cover) => {
      if (cover.url == this.state.chosenCover.url && cover.name == this.state.chosenCover.name) {
        return false
      } else {
        return true
      }
    })
    this.props.deleteOrAddCover({
      newAffair: this.props.affair.set('covers', JSON.stringify(newCovers)),
      affairMemberId: affairMemberId
    }, () => {message.success('删除成功')})
  },
  handleChangeDescription(){
    this.props.changeAffairDescription(this.props.affair.set('description', this.state.description), (res) => {
      if (res.code == 0){
        message.success('修改成功')
        this.setState({
          isModifyingDescription: false,
        })
      }
    })
  },
  handleAddTag(){
    let tags = this.props.affair.getTags()
    this.setState({
      isBtnClicked: true,
    })
    if (this.state.addingTag.length < 2 || this.state.addingTag.length > 12) {
      notification.error({
        message: '标签长度应为2-12个字符'
      })
      return
    }
    if (tags.length >= 8) {
      notification.error({
        message: '至多添加8个标签'
      })
      return
    }
    if (tags.some((v) => v == this.state.addingTag)){
      notification.error({
        message: '标签不能重复'
      })
      return
    }
    tags.push(this.state.addingTag)
    this.props.changeAffairTag(this.props.affair.set('tags', tags), (res) => {
      if (res.code == 0){
        message.success('添加成功')
        this.setState({
          addingTag: '',
          isAddingTag: false,
          isBtnClicked: false,
        })
      }
      else {
        notification.error({
          message: '添加标签失败'
        })
      }
    })
  },
  handleTaginputBlur(){
    let disappear = _.debounce(() => {
      if (this.state.isBtnClicked){
        this.setState({
          isBtnClicked: false,
        })
        return
      }
      else {
        this.setState({
          isAddingTag: false,
        })
      }
    }, 200)
    disappear()
  },
  handleRemoveTag(index) {
    let newTags = this.props.affair.getTags()
    newTags.splice(index, 1)

    this.props.changeAffairTag(this.props.affair.set('tags', newTags), (res) => {
      if (res.code == 0){
        message.success('删除成功')
      }
      else {
        notification.error({
          message: '删除失败'
        })
      }
    })
  },
  handleClickChildAffair(affairId) {
    this.props.pushPermittedURL(affairId, 0, `/workspace/affair/${affairId}`)
  },
  renderPreviewModal() {
    const { previewFile, previewModalShow, previewTab, currentPreviewVersion, logs } = this.state

    if (!previewFile) return

    return (
      <Modal title={<div>{getFileTypeIcon(previewFile.type)}<span>{previewFile.fileName}</span></div>}
        footer=""
        visible={previewModalShow}
        onCancel={() => this.setState({ previewModalShow: false, previewFile: null, versions: [], logs: [] })}
        width={900}
        wrapClassName={styles.previewModal}
        maskClosable={false}
      >
        <div className={styles.modalContent}>
          <div className={styles.leftPanel}>
            <FilePreview file={previewFile} affairId={this.props.affair.get('id')} roleId={this.props.affair.get('roleId')} version={currentPreviewVersion}/>
          </div>
          <div className={styles.rightPanel}>
            <div>
              {previewFile.publicType == PUBLIC_TYPE.SECRET ?
                <div className={styles.tab}>
                  <div className={previewTab === HISTORY ? styles.highlight : null} onClick={() => this.handleSwitchFilePreviewTab(HISTORY)}>历史版本</div>
                  <div className={previewTab === RECORD ? styles.highlight : null} onClick={() => this.handleSwitchFilePreviewTab(RECORD)}>文件记录</div>
                </div>
              :
                <div style={{ marginBottom: 10 }}>
                历史版本：
                </div>
              }

              {previewTab === HISTORY ?
                <div className={styles.history}>
                  {
                    this.state.versions.map((version) => (
                      <div key={version.version} onClick={(e) => this.handlePreview(e, previewFile, version.version)}>
                        <div className={styles.fileHeader}>
                          <div>
                            <span className={styles.badge}>{`V${version.version}`}</span>
                            <span className={styles.fileName} title={version.name}>{version.name}</span>
                          </div>
                          <div className={styles.operation}>
                            <span onClick={(e) => {
                              e.stopPropagation()
                              this.downloadFiles([previewFile], version.version)
                            }}
                            ><SprigDownIcon/></span>
                          </div>
                        </div>
                        <div className={styles.description}>{`${version.roleTitle}上传于${moment(version.createTime).format('YYYY-MM-DD HH:mm:ss')}`}</div>
                      </div>
                    ))
                  }
                </div>
              :
                <div className={styles.record}>
                  {
                  logs.map((log, index) => {
                    return (
                      <div key={index}>
                        <div>{`${log.roleTitle} ${log.operation} `}“<span>V{log.fileVersion}</span> {log.name}”</div>
                        <div>{moment(log.time).format('YYYY-MM-DD HH:mm:ss')}</div>
                      </div>
                    )
                  })
                }
                </div>
              }
            </div>

            <div>
              {this.props.affair.hasPermission(PERMISSION_MAP.FILE) ?
                <div className={styles.secretFooter}>
                  <div style={{ display: 'flex' }}>
                    <span className="u-text-14">保密</span>
                    <Switch checkedChildren="开" unCheckedChildren="关" checked={previewFile.publicType === PUBLIC_TYPE.SECRET} onChange={(val) => {val = !val;this.handleChangeFilesPublicType([previewFile], val ? PUBLIC_TYPE.OPEN : PUBLIC_TYPE.SECRET);previewFile.publicType = val ? PUBLIC_TYPE.OPEN : PUBLIC_TYPE.SECRET;this.setState({ previewFile, })}}/>
                  </div>
                  <div className="u-text-l-12">保密文件只对拥有“查看保密文件”权限的角色可见</div>
                </div>
                    :
                      null
                    }

              <div className={styles.uploadNewBtn}>
                <Button type="primary" size="large" onClick={() => this.refs.fileUploader.click()}>上传新版本</Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    )
  },
  renderGuestTab(){
    switch (this.state.guestTab) {
      case 0:
        return <div className={styles.roleContainer}>
          {
            this.state.publicRoles.map((v, k) => {
              return <div className={styles.roleBlock} key={k}>
                {
                  v.avatar
                    ?
                      <img src={v.avatar} className={styles.avatar}/>
                    :
                      <div className={styles.avatar}/>
                }
                <span className={styles.roleTitle}>{v.roleTitle}&nbsp;&nbsp;{v.username}</span>
                <div style={{ clear: 'both' }}/>
              </div>
            })
          }
          <div style={{ clear: 'both' }}/>
        </div>
      case 1:
        return <div className={styles.fundContainer}>
          {
            this.state.publicFunds.map((v, k) => {
              return <div className={styles.fundBlock} key={k}>
                <div className={styles.left}>
                  {
                    FundMap[v.currencyType]
                  }
                </div>
                <div className={styles.right}>
                  <div className={styles.type}>{FundName[v.currencyType]}</div>
                  <div className={styles.number}>
                    <span>总额:</span>
                    <div className={styles.color}>{currencyFormatter.format(v.total - v.locked, { code: v.currencyType })}</div>
                    <span>元</span>
                  </div>
                </div>
              </div>
            })
          }
          <div style={{ clear: 'both' }}/>
        </div>
      case 2:
        return <div className={styles.materialContainer}>
          {
            this.state.publicMaterial.map((v, k) => {
              return <div className={styles.materialBlock} key={k}>
                {
                  v.image != ''
                    ?
                      <img src={v.image} className={styles.img}/>
                    :
                      <div className={styles.img} style={{ backgroundColor: '#e9e9e9' }}/>
                }
                <div className={styles.mask}>{v.name}</div>
              </div>
            })
          }
          <div style={{ clear: 'both' }}/>
        </div>
      case 3:
        return <div className={styles.announcementContainer}>
          {
            this.state.publicAnnouncement.map((v, k) => {
              // const thumbContent = v.type == 0 ? (v.thumbContent || '') : (JSON.parse(v.thumbContent).blocks[0].text || '')
              const thumbContent = (v.thumbContent || '')
              return <div className={styles.announcementBlock} key={k}>
                <div className={styles.flag} />
                <div className={styles.title}>
                  <span onClick={() => {
                    this.props.pushURL(`/workspace/affair/${v.affairId}/announcement/inner/detail/${v.id}`)
                  }}
                  >{v.title}</span>
                </div>
                <div className={styles.content}>
                  {thumbContent}
                </div>
              </div>
            })
          }
        </div>
      case 4:
        return this.state.fileLoadDone ? <div className={styles.fileContainer}>
          {
            this.state.currentFilePath != '/'
              ?
                <div className={styles.fileBlock} onClick={this.handleBackFolder}>
                  <span className={styles.icon}>{getFileTypeIcon(0)}</span>
                  <span className={styles.name}>..</span>
                </div>
              :
              null
          }
          {
            this.state.publicFile.get(this.state.currentFilePath).get('files').map((v, k) => {
              return <div key={k} className={styles.fileBlock} onClick={v.type === FILE_TYPE.FOLDER ? (e) => this.handleEnterFolder(e, (this.state.currentFilePath === '/' ? this.state.currentFilePath : this.state.currentFilePath + '/') + v.fileName, v.id) : (e) => this.handlePreview(e, v)}>
                <span className={styles.icon}>{getFileTypeIcon(v.type)}</span>
                <span className={styles.name}>{v.name}</span>
                {v.publicType != PUBLIC_TYPE.OPEN ? <div className={styles.secret}>保密</div> : null}
                <div style={{ clear: 'both' }}/>
              </div>
            })
          }
          <div style={{ clear: 'both' }}/>
          {this.renderPreviewModal()}
        </div>
          : null
    }
  },
  renderLeft(){
    const { affair } = this.props
    const { tags } = this.state

    const play = function () {
      let video = document.getElementById('videoplayer')
      if (video.paused) {
        video.play()
        document.getElementById('videoplay').style.display = 'none'
      } else {
        document.getElementById('videoplay').style.display = 'block'
        video.pause()
      }
    }
    const covers = JSON.parse(affair.get('covers')) || []
    let { chosenCover } = this.state

    return <div className={styles.guestPanel}>
      <div className={styles.cover}>
        <div className={styles.pictures}>
          <div className={styles.left}>
            {covers.length == 0 ?
              <div className={styles.objNullShow}>
                <LogoIcon width="170"/>
              </div>
            : (
              <div className={styles.objShow}>
                <div className={styles.coverContainer}>
                  {
                    this.getViewType() == OFFICIAL ?
                      <div className={styles.imgMask} onClick={chosenCover.type ? null : play}>
                        <div className={styles.functionIcon} onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="编辑" arrowPointAtCenter>
                            <ImgEditIcon onClick={() => {
                              {this.setState({ showCoverEditModal: true })}
                            }}
                              className={styles.imgOpt}
                            />
                          </Tooltip>
                          <Tooltip title="删除" arrowPointAtCenter>
                            <DeleteIcon onClick={this.handleDeleteCover} className={styles.imgOpt}/>
                          </Tooltip>
                        </div>
                        <div className={styles.detail}>
                          <div style={{ color: '#cccccc' }}>{chosenCover.description}</div>
                        </div>
                      </div>
                    : null
                  }

                  {chosenCover.type ?
                    <img className={styles.img} src={chosenCover.url}/>
                  : (
                    <div className={styles.videoDiv} onClick={() => {
                      play()
                    }}
                    >
                      <div style={{ zIndex: 5 }}><VideoPlay width={60} height={60}/></div>
                      <video preload="metadata" className={styles.videoPic} id="videoplayer" src={chosenCover.url}/>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
          <div className={styles.right}>
            {covers.map((self, index) => {
              return self.type ?
                <img key={'img_' + index} className={styles.block} src={self.url} onClick={() => {
                  this.setState({ chosenCover: self })
                }} style={chosenCover.url == self.url ? { border: '1px solid $primary-color', boxShadow: '0 0 0 2px rgba(179, 120, 220, 0.5)' } : {}}
                /> :
                <div key={'video_' + index} className={styles.block}
                  onClick={() => {
                    this.setState({ chosenCover: self })
                  }} style={chosenCover.url == self.url ? { border: '1px solid $primary-color', boxShadow: '0 0 0 2px rgba(179, 120, 220, 0.5)' } : {}}
                >
                  <video preload="metadata" src={self.url} className={styles.videoPic}/>
                </div>
            })}
            {affair.validatePermissions(PERMISSION.SET_AFFAIR_HOME) &&
              <AffairAddCover
                className={styles.add}
                affair={this.props.affair}
                callback={(addCover) => {
                  this.setState({
                    addingCover: addCover,
                    showCoverEditModal: true,
                  })
                }}
              />
            }
            {this.state.showCoverEditModal &&
              <AffairEditCover visible={this.state.showCoverEditModal} cover={this.state.addingCover ? this.state.addingCover : this.state.chosenCover}
                affair={this.props.affair}
                onClose={() => {
                  this.setState({ showCoverEditModal: false, addingCover: null, })
                }}
                onModifyCover={(newCover) => {
                    //添加封面
                  if (this.state.addingCover){
                    covers.push(newCover)
                    this.props.deleteOrAddCover({
                      newAffair: this.props.affair.set('covers', JSON.stringify(covers)),
                      affairMemberId: this.props.affair.get('affairMemberId')
                    }, () => {message.success('添加成功')})
                  }
                    //编辑封面
                  else {
                    let newcovers = covers.map((v) => {
                      if (v.name == this.state.chosenCover.name && v.url == this.state.chosenCover.url){
                        v = newCover
                      }
                      return v
                    })
                    this.props.deleteOrAddCover({
                      newAffair: this.props.affair.set('covers', JSON.stringify(newcovers)),
                      affairMemberId: this.props.affair.get('affairMemberId')
                    }, () => {message.success('修改成功')})
                  }

                }}
              />
            }
          </div>
          <div style={{ clear: 'both' }}/>
        </div>
        {this.state.isModifyingDescription ? (
          <div className={styles.descriptionInput}>
            <Input type="textarea" style={{ resize: 'none' }} className={styles.descriptionInput} value={this.state.description} onChange={(e) => {
              if (e.target.value.length > 300){
                message.error('描述不能超过300个字符')
                return
              }
              this.setState({ description: e.target.value })}}
            />
            <div className={styles.bottom}>
              <span>{this.state.description.length}/300</span>
              <div className={styles.funcBtn}>
                <span className={styles.cancel} onClick={() => {this.setState({ isModifyingDescription: false })}}>取消</span>
                <span className={styles.ok} onClick={this.handleChangeDescription}>保存</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.description}>
            {affair.get('description') == '' ? '暂时没有事务描述' : affair.get('description')}
            {affair.validatePermissions(PERMISSION.SET_AFFAIR_HOME) &&
              <EditIcon onClick={() => {this.setState({ isModifyingDescription: true })}}/>
            }
          </div>
        )}
        <div className={styles.tags}>
          {tags.map((v, k) => {
            return <div className={styles.tagContainer} key={k}>
              {this.getViewType() == OFFICIAL ? <div className={styles.removeTagMask} onClick={this.handleRemoveTag.bind(this, k)}>移除</div> : null}
              <Tag>{v}</Tag>
            </div>
          })}
          {affair.validatePermissions(PERMISSION.SET_AFFAIR_HOME) && (
            this.state.isAddingTag ?
              <div className={styles.addtagContainer} onClick={(e) => {e.stopPropagation()}}>
                <Input maxLength="12" className={styles.tagInput} placeholder="标签内容" onChange={(e) => {this.setState({ addingTag: e.target.value })}} onBlur={this.handleTaginputBlur} onPressEnter={this.handleAddTag} ref="tagInput"/>
                <i onClick={this.handleAddTag}>+</i>
              </div>
            :
              <Tooltip title="添加标签" placement="top">
                <div className={styles.addTag} onClick={() => {this.setState({ isAddingTag: true })}}>+</div>
              </Tooltip>
          )}
        </div>
      </div>
      <div className={styles.others}>
        <div className={styles.tab}>
          <div className={styles.block} onClick={() => {
            this.setState({ guestTab: 0 })
            this.fetchPublicRoles(this.props)
          }} style={{ color: this.state.guestTab == 0 ? '#926dea' : '#9b9b9b' }}
          >公开角色
          </div>
          <div className={styles.block} onClick={() => {
            this.setState({ guestTab: 1 })
            this.fetchPublicFunds(this.props)
          }} style={{ color: this.state.guestTab == 1 ? '#926dea' : '#9b9b9b' }}
          >公开资金
          </div>
          <div className={styles.block} onClick={() => {
            this.setState({ guestTab: 2 })
            this.fetchPublicMaterial(this.props)
          }} style={{ color: this.state.guestTab == 2 ? '#926dea' : '#9b9b9b' }}
          >公开物资
          </div>
          <div className={styles.block} onClick={() => {
            this.setState({ guestTab: 3 })
            this.fetchPublicAnnouncement(this.props)
          }} style={{ color: this.state.guestTab == 3 ? '#926dea' : '#9b9b9b' }}
          >公开发布
          </div>
          <div className={styles.block} onClick={() => {
            this.setState({ guestTab: 4 })
            this.fetchPublicFile(this.props, 0, '/')
          }} style={{ color: this.state.guestTab == 4 ? '#926dea' : '#9b9b9b' }}
          >公开文件
          </div>
          <div style={{ clear: 'both' }}/>
        </div>
        <div className={styles.guestTabContainer}>
          {
                this.renderGuestTab()
              }
        </div>
      </div>

    </div>
  },
  renderRight(){
    // const { affair }=this.props
    let followed = (this.props.followedList || List()).map((v) => {
      return v.get('affairId').toString()
    })

    return <div className={styles.rightPanel}>
      <div className={styles.operation}>
        {this.getViewType() != OFFICIAL && !this.props.affair.get('applying') && (
          followed.includes(this.props.affair.get('id')) ?
            <div className={styles.follow} onClick={() => this.handleStarAffair(false)}><StarIcon fill="#fcbd39" height="16px"/>已关注</div>
          : (
            <div className={styles.follow} onClick={() => this.handleStarAffair(true)}><StarIcon fill="#fcbd39" height="16px"/>关注</div>
          )
        )}

        {this.getViewType() != OFFICIAL && this.props.affair.get('applying') && (
          <div className={styles.applyingState}>
            <AddPersonIcon fill="#6ca2f3" height="16px"/>
            <div style={{ marginRight: 'auto' }}>申请加入中…</div>

            <div className={styles.cancelApplying} onClick={this.handleCancelApply}>取消申请</div>
          </div>
        )}

        {this.getViewType() == OFFICIAL ?
          <div className={styles.join}><AddPersonIcon fill="#6ca2f3" height="16px"/>已加入</div>
        : (
          !this.props.affair.get('applying') ? (
            <ApplyAttendAffairModal
              affair={this.props.affair}
              onSubmitSucceed={() => {
                this.props.getAffairInfo(this.props.affair.get('id'), this.props.affair.get('roleId'))
              }}
            >
              <div className={styles.join} style={{ cursor: 'pointer' }}><AddPersonIcon fill="#6ca2f3" height="16px"/>加入</div>
            </ApplyAttendAffairModal>
          ) : null
        )}
      </div>
      {/*<div className={styles.publish}>*/}
      {/*<div className={styles.top}>*/}
      {/*/!**/}
      {/*<div className={styles.block} onClick={() => {*/}
      {/*this.setState({ isTop: true })*/}
      {/*}} style={{ color: this.state.isTop == true ? '#926dea' : '' }}*/}
      {/*>置顶发布*/}
      {/*</div>*/}
      {/**!/*/}
      {/*<div className={styles.block} onClick={() => {*/}
      {/*this.setState({ isTop: false })*/}
      {/*}} style={{ color: this.state.isTop == false ? '#926dea' : '' }}*/}
      {/*>最新发布*/}
      {/*</div>*/}
      {/*<div style={{ clear: 'both' }}/>*/}
      {/*</div>*/}
      {/*<div className={styles.content}>*/}
      {/*{*/}
      {/*this.state.isTop*/}
      {/*?*/}
      {/*this.state.topAnnouncementList*/}
      {/*?*/}
      {/*this.state.topAnnouncementList.map((v, k) => {*/}
      {/*return <div className={styles.row} key={k}>*/}
      {/*<div className={styles.text}>{v.title}</div>*/}
      {/*<div className={styles.time}>{homeAnnouncementTime(v.time)}</div>*/}
      {/*<div style={{ clear: 'both' }}/>*/}
      {/*</div>*/}
      {/*})*/}
      {/*: null*/}
      {/*:*/}
      {/*this.state.newAnnouncementList*/}
      {/*?*/}
      {/*this.state.newAnnouncementList.map((v, k) => {*/}
      {/*return <div className={styles.row} key={k}>*/}
      {/*<div className={styles.text}>{v.title}</div>*/}
      {/*<div className={styles.time}>{homeAnnouncementTime(v.createTime)}</div>*/}
      {/*<div style={{ clear: 'both' }}/>*/}
      {/*</div>*/}
      {/*})*/}
      {/*: null*/}
      {/*}*/}
      {/*</div>*/}
      {/*<div className={styles.bottom} onClick={() => {*/}
      {/*this.props.pushURL(`/workspace/affair/${this.props.affair.get('id')}/announcement`)*/}
      {/*}}*/}
      {/*>*/}
      {/*查看更多*/}
      {/*<ArrowRight height="12px" fill="#cccccc"/></div>*/}
      {/*</div>*/}
      {this.getViewType() != GUEST && (
        <div className={styles.otherTools}>
          <div className={styles.title}>其他工具</div>
          <div className={styles.affairTool} onClick={() => {this.props.pushURL(`/workspace/board/${this.props.params.id}`)}}>
            <BoardIcon style={{ marginRight: 10 }}/>
            <div className={styles.affairToolRight}>
              <div>看板</div>
              <p>此处可为看板的简单介绍</p>
            </div>
          </div>
          <div className={styles.affairTool} onClick={() => this.props.pushURL(`/workspace/plan/${this.props.affair.get('id')}`)}>
            <PlanTimeline style={{ marginRight: 10 }}/>
            <div className={styles.affairToolRight}>
              <div>计划时间轴</div>
              <p>通过时间轴组织项目中的计划</p>
            </div>
          </div>
        </div>
      )}

      <div className={styles.childAffair}>
        <div className={styles.title}>子事务</div>
        <div className={styles.content}>
          {
            this.state.childList.map((v, k) => {
              return <div className={styles.avatarContainer} key={k}>
                <AffairAvatar className={styles.childrenAvatar} affair={new Affair(v)} sideLength={56} onClick={this.handleClickChildAffair.bind(this, v.get('id'))} />
                <div className={styles.name}>{v.get('name')}</div>
              </div>
            })
          }
        </div>
        {
          this.props.affair.validatePermissions(PERMISSION.CREATE_AFFAIR) ?
            <div className={styles.addAffair} onClick={() => {this.setState({ affairToAdd: this.props.affair })}}>
              +&nbsp;创建子事务
            </div>
            : null
        }
        {
          this.state.affairToAdd ? (
            <CreateAffair
              parentAffair={this.state.affairToAdd}
              visible={!!this.state.affairToAdd}
              onCloseModal={() => {this.setState({ affairToAdd: null })}}
            />
          ) : (
            null
          )
        }
      </div>
    </div>

  },
  render(){

    return this.props.affair.get('permitted') ? (
      <div className={styles.homepageContainer}>
        {this.renderLeft()}
        {this.renderRight()}
      </div>
    ) : (
      <div className={styles.noPermission}>
        <img src={imageNoPermission}/>
        <span>您无权限查看该页面</span>
      </div>
    )
  },
})


function mapStateToProps(state, props) {
  return {
    user: state.get('user'),
    affair: state.getIn(['affair', 'affairMap', props.params.id]),
    followedList: state.getIn(['affair', 'followedAffairList']),
    affairList: state.getIn(['affair', 'affairList'])
  }
}

function mapDispatchToProps(dispatch) {
  return {
    updateAffairTags: bindActionCreators(updateAffairTags, dispatch),
    deleteOrAddCover: bindActionCreators(deleteOrAddCover, dispatch),
    modifyAffairInfo: bindActionCreators(modifyAffairInfo, dispatch),
    fetchAffairChildren: bindActionCreators(fetchAffairChildren, dispatch),
    getAffairInfo: bindActionCreators(getAffairInfo, dispatch),
    fetchFollowedAffairList: bindActionCreators(fetchFollowedAffairList, dispatch),
    changeAffairDescription: bindActionCreators(changeAffairDescription, dispatch),
    changeAffairTag: bindActionCreators(changeAffairTag, dispatch),
    pushPermittedURL: bindActionCreators(pushPermittedURL, dispatch),
    pushURL: bindActionCreators(pushURL, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(HomepageComponent))
