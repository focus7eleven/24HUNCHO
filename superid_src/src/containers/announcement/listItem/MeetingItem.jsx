import React from 'react'
import { fromJS, List, Map } from 'immutable'
import { Dropdown, Input, Modal, Menu, Popover, Message, Button, Upload, Icon, Checkbox, message } from 'antd'
import { TrashIcon, ReleaseMeetingIcon, MoreIcon, FOLDERIcon, SprigDownIcon, PDFIcon, PPTIcon, EXCELIcon, TEXTIcon, WORDIcon, VIDEOIcon, UNKNOWNIcon } from '../../../public/svg'
import EditMeetingModal from '../modal/EditMeetingModal'
import classNames from 'classnames'
import moment from 'moment'
import urlFormat from 'urlFormat'
import _ from 'underscore'
import oss from 'oss'
import messageHandler from 'messageHandler'
import config from '../../../config'
import styles from './MeetingItem.scss'
import { OPT_ROLE } from '../constant/AnnouncementConstants'

const OPT_TYPE = {
  EDIT: 0,
  UPLOAD_FILE: 1,
  CANCEL: 2,
  DELETE: 3,
}
const STATE_TYPE = {
  NORMAL: 0, //正常状态
  CANCELED: 1, //取消状态
  DELETED: 2, //删除状态
}

export function getFileIcon(filename){
  const fileType = filename.split('.')[1]
  switch (fileType){
    case 'pdf':
      return <PDFIcon/>
    case 'ppt':
      return <PPTIcon/>
    case 'xls':
    case 'xlsx':
      return <EXCELIcon/>
    case 'txt':
      return <TEXTIcon/>
    case 'word':
      return <WORDIcon/>
    case 'avi':
    case 'mp4':
    case 'wmv':
    case 'mkv':
    case 'mpg':
    case 'rmvb':
    case 'rm':
    case 'asf':
    case 'mpeg':
      return <VIDEOIcon/>
    default:
      return <UNKNOWNIcon/>
  }
}

const MeetingIcon = () => {
  return <span className={styles.typeIcon} style={{ backgroundColor: '#66b966' }}><ReleaseMeetingIcon /></span>
}

const Item = Menu.Item
const MeetingItem = React.createClass({
  getDefaultProps(){
    return {
      title: '',
      startTime: null,
      last: '',
      place: '',
      participants: fromJS([]),
      remark: '',
      affixture: fromJS([]),

      optRole: OPT_ROLE.COOPERATOR, //会议参与者
      state: STATE_TYPE.NORMAL, //是否已取消
      roleList: List(),
    }
  },
  getInitialState(){
    return {
      showEditMeetingModal: false,
      uploadAttachmentFrom: 'local',
      localFiles: List(),
      repoFiles: List(),
      files: Map(),
      navigateHistory: List([0]),
      currentFolderId: 0,
    }
  },
  componentDidMount() {
    const { isLoading } = this.state
    if (isLoading){
      return
    }
    const that = this
    this.card.addEventListener('click', function(e){
      if (e.target.getAttribute('class').indexOf('ant-select') >= 0 || e.target.getAttribute('class').indexOf('icon') >= 0){
        return
      } else if (e.target.getAttribute('id') === 'more'){
        return
      } else {
        that.setState({
          showEditMeetingModal: true,
        })
      }
    }, false)
    this.handleSearchFile = _.debounce((text) => {
      if (text) {
        fetch(config.api.file.search(text), {
          affairId: this.props.affair.get('id'),
          roleId: this.props.affair.get('roleId'),
          method: 'GET',
          credentials: 'include',
        }).then((res) => res.json()).then((res) => {
          if (res.code === 0) {
            const data = res.data
            data.files = data.files || []
            data.folders = data.folders || []

            this.setState({
              searchedFiles: fromJS(data)
            })
          }
        })
      } else {
        this.setState({
          searchedFiles: null,
        })
      }
    }, 200)
  },
  getCardStyles(){
    const { state } = this.props
    switch (state){
      case STATE_TYPE.NORMAL:
        return {
          color: '#666666',
          backgroundColor: '#ffffff'
        }
      case STATE_TYPE.CANCELED:
        return {
          color: '#9b9b9b',
          backgroundColor: '#fafafa'
        }
    }
  },

  //handlers
  handleBackNavigateHistory() {
    const indexOfCurrent = this.state.navigateHistory.findIndex((v) => v === this.state.currentFolderId)

    if (indexOfCurrent > 0) {
      this.setState({
        currentFolderId: this.state.navigateHistory.get(indexOfCurrent - 1),
      })
    }

    this.fetchFileList(this.state.navigateHistory.get(indexOfCurrent - 1))
  },
  handleForwardNavigateHistory() {
    const indexOfCurrent = this.state.navigateHistory.findIndex((v) => v === this.state.currentFolderId)

    if (indexOfCurrent < this.state.navigateHistory.size - 1) {
      this.setState({
        currentFolderId: this.state.navigateHistory.get(indexOfCurrent + 1),
      })
    }

    this.fetchFileList(this.state.navigateHistory.get(indexOfCurrent + 1))
  },
  handleMeetingOptions({ key }){
    switch (Number.parseInt(key)) {
      case OPT_TYPE.EDIT:
        this.setState({ showEditMeetingModal: true })
        break
      case OPT_TYPE.UPLOAD_FILE:
        this.setState({
          showAddAttachmentModal: true,
        })
        break
      case OPT_TYPE.CANCEL:
        this.onCancelMeeting()
        break
      case OPT_TYPE.DELETE:
        this.onDeleteMeeting()
        break
      default:
        //do nothing.
    }
  },
  handleAddAttachment() {
    const {
      affair,
      meeting,
    } = this.props

    const urlList = this.state.syncFileRepo ? (
      this.state.localFiles.map((v) => ({
        url: v.path,
        name: v.file.name,
        size: v.file.size,
      }))
    ) : (
      this.state.localFiles.map((v) => ({
        url: v.path,
      }))
    )

    fetch(config.api.announcement.detail.task.attachment.post(), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        announcementMeetingId: meeting.get('meetingId'),
        urlList,
        storeUrlList: this.state.repoFiles.map((v) => ({
          url: v.get('address'),
        })).toJS(),
        choose: this.state.syncFileRepo ? 1 : 0,
      }),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.props.onAddAttachement && this.props.onAddAttachement()

        this.setState({
          urlList: List(),
          storeUrlList: List(),
          showAddAttachmentModal: false,
        })
      }
    })
  },
  requestUploadAttachment({
    file,
    onSuccess,
    onProgress,
  }) {
    oss.uploadAnnouncementAttachment(file, fromJS({ id: this.props.affair.get('id'), roleId: this.props.affair.get('roleId') }), (progress) => {
      onProgress({ percent: progress })
    }).then((res) => {
      this.setState({
        localFiles: this.state.localFiles.push(res)
      })
      onSuccess(res)
    })
  },
  onCancelMeeting(){
    const { affair, meeting, announcement } = this.props
    fetch(urlFormat(config.api.announcement.detail.meeting.cancel(), { meetingId: meeting.get('meetingId') }), {
      method: 'POST',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcement.get('announcementId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        Message.success('取消成功')
        this.props.onUpdateMeetingList()
      }
    })
  },
  onDeleteMeeting(){
    const { affair, meeting, announcement } = this.props
    fetch(urlFormat(config.api.announcement.detail.meeting.delete(), { meetingId: meeting.get('meetingId') }), {
      method: 'POST',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcement.get('announcementId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        Message.success('删除成功')
        this.props.onUpdateMeetingList()
      }
    })
  },
  handleDeleteFile(file) {
    return fetch(config.api.announcement.detail.task.attachment.delete(file.get('fileId')), {
      method: 'POST',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.props.onDeleteAttachment && this.props.onDeleteAttachment(file)
      }
    })
  },
  fetchFileList(folderId = 0) {
    const {
      affair,
    } = this.props

    fetch(config.api.file.fileList.get(folderId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const data = res.data

        this.setState({
          files: fromJS(data),
        })
      } else {
        message.error('获取文件列表失败！')
      }
    })
  },
  renderAddAttachmentModal() {
    if (!this.state.showAddAttachmentModal) return null

    return (
      <Modal
        visible={this.state.showAddAttachmentModal}
        title="添加附件"
        footer={null}
        width={500}
        wrapClassName={styles.addAttachmentModal}
        onCancel={() => {this.setState({ showAddAttachmentModal: false })}}
      >
        <div className={styles.addAttachmentModalContent}>
          <div className={styles.attachmentSourceTab}>
            <div
              onClick={() => this.setState({ uploadAttachmentFrom: 'local' })}
              className={classNames(styles.sourceItem, this.state.uploadAttachmentFrom === 'local' ? styles.activeSourceItem : null)}
            >
              本地上传
            </div>
            <div
              onClick={() => {
                this.fetchFileList()
                this.setState({ uploadAttachmentFrom: 'repo' })
              }}
              className={classNames(styles.sourceItem, this.state.uploadAttachmentFrom === 'repo' ? styles.activeSourceItem : null)}
            >
              文件库选取
            </div>
          </div>

          <div className={styles.uploadArea}>
            {/* 本地上传附件 */}
            {
              this.state.uploadAttachmentFrom === 'local' ? (
                <div className={styles.uploadLocalFile}>
                  <Upload
                    name="appendix"
                    customRequest={this.requestUploadAttachment}
                  >
                    <Button className={styles.uploadButton}>
                      <Icon type="upload" /> 点击此处上传附件
                    </Button>
                  </Upload>
                </div>
              ) : null
            }

            {/* 文件库选择 */}
            {this.state.uploadAttachmentFrom === 'repo' && this.renderSelectFromRepo()}

            <div className={styles.uploadButtonGroup}>
              {this.state.uploadAttachmentFrom === 'local' && (
                <div className={styles.syncFile}>
                  <Checkbox
                    checked={this.state.syncFileRepo}
                    style={{ marginRight: 8 }}
                    onChange={(e) => {
                      this.setState({
                        syncFileRepo: e.target.checked,
                      })
                    }}
                  />
                  <div>同步至事务文件库</div>
                </div>
              )}
              <Button style={{ marginLeft: 'auto', marginRight: 10 }} onClick={() => this.setState({ showAddAttachmentModal: false })}>取消</Button>
              <Button type="primary" onClick={this.handleAddAttachment}>确定</Button>
            </div>
          </div>
        </div>
      </Modal>
    )
  },
  renderSelectFromRepo() {
    const fileMap = this.state.searchedFiles || this.state.files

    return (
      <div className={styles.selectFromRepo}>
        <div className={styles.uploadFromRepoHeader}>
          <Input.Search
            className={styles.searchInput}
            placeholder="搜索文件"
            onChange={(evt) => this.handleSearchFile(evt.target.value)}
            style={{ width: 200, marginRight: 'auto' }}
          />

          <div className={styles.navigateBack} onClick={this.handleBackNavigateHistory}><Icon type="left" /></div>
          <div className={styles.navigateForward} onClick={this.handleForwardNavigateHistory}><Icon type="right" /></div>
        </div>

        {/* 文件夹列表 */}
        {
          fileMap.get('folders', List()).map((file) => {
            const {
              navigateHistory,
              currentFolderId,
            } = this.state

            return (
              <div
                key={file.get('folderId')}
                style={{ cursor: 'pointer' }}
                className={styles.file}
                onClick={() => {
                  this.setState({
                    searchedFiles: null,
                    currentFolderId: file.get('folderId'),
                    navigateHistory: navigateHistory.size === 0 || navigateHistory.last() === currentFolderId ? (
                      navigateHistory.push(file.get('folderId'))
                    ) : (
                      navigateHistory.takeUntil((v) => v == currentFolderId).push(currentFolderId).push(file.get('folderId'))
                    )
                  })

                  this.fetchFileList(file.get('folderId'))
                }}
              >
                <FOLDERIcon />
                <p style={{ marginLeft: 10 }}>{file.get('name')}</p>
              </div>
            )
          })
        }

        {/* 文件列表 */}
        {
          fileMap.get('files', List()).map((file) => {
            return (
              <div className={styles.file} key={file.get('id')}>
                <Checkbox
                  style={{ marginRight: 12 }}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      this.setState({
                        repoFiles: this.state.repoFiles.filter((v) => v.get('id') != file.get('id'))
                      })
                    } else {
                      this.setState({
                        repoFiles: this.state.repoFiles.push(file)
                      })
                    }
                  }}
                />
                {getFileIcon(file.get('name'))}
                <p style={{ marginLeft: 10 }}>{file.get('name')}</p>
              </div>
            )
          })
        }
      </div>
    )
  },
  render(){
    const { affair, announcement, meeting, attachments } = this.props

    const optMenu = (
      <Menu onClick={this.handleMeetingOptions}>
        <Item key={OPT_TYPE.EDIT}>编辑会议</Item>
        <Item key={OPT_TYPE.UPLOAD_FILE}>上传附件</Item>
        <Item key={OPT_TYPE.CANCEL}>取消会议</Item>
        <Item key={OPT_TYPE.DELETE}>删除会议</Item>
      </Menu>
    )

    return (
      <div className={styles.cardContainer}
        ref={(el) => {
          if (el) this.card = el
        }}
      >
        <div className={styles.title}><MeetingIcon />{meeting.get('name')}{meeting.get('state') == STATE_TYPE.CANCELED ? '(已取消)' : null}</div>
        <div className={styles.titleContainer}>
          <span className={styles.titleRight}>
            <span className={styles.item}>
              <span className={styles.label}>开始时间：</span>
              <span className={styles.content}>{moment(Number.parseInt(meeting.get('beginTime'))).format('Y/M/D HH:mm')}</span>
            </span>
            {meeting.get('lastTime') !== null &&
              <span className={styles.item}>
                <span className={styles.label}>预计时长：</span>
                <span className={styles.content}>{meeting.get('lastTime') / 3600}小时</span>
              </span>
            }
            <span className={styles.item}>
              <span className={styles.label}>地点：</span>
              <span className={styles.content}>{meeting.get('address')}</span>
            </span>
          </span>
        </div>
        <div className={styles.participants}>
          <span className={styles.label}>参与者：</span>
          <span className={styles.avatarList}>
            {(meeting.get('joinRoles') || List()).map((v, k) => {
              return (
                <span className={styles.avatarWrapper} key={k}>
                  <Popover content={<span>{v.get('roleTitle')} {v.get('username')}</span>}>
                    <img src={v.get('avatar')}/>
                  </Popover>
                </span>
              )
            })}
          </span>
        </div>
        <div className={styles.remark}>
          备注：{meeting.get('note')}
        </div>
        {(attachments || List()).size != 0 &&
          <div className={styles.attachment}>
            <div>附件：</div>
            <div className={styles.attachmentList}>
              {
                attachments.map((file) => (
                  <div className={styles.attachmentItem} key={file.get('fileId')}>
                    {getFileIcon(file.get('url'))}
                    <div style={{ marginLeft: 5, marginRight: 5 }}>{file.get('url').split('/').pop()}</div>
                    <SprigDownIcon style={{ marginLeft: 10, marginRight: 10, fill: '#ccc' }} onClick={() => oss.downloadFile(file.get('url'), new Map({ id: this.props.affair.get('id'), roleId: this.props.affair.get('roleId') }))} />
                    <TrashIcon style={{ fill: '#ccc' }} onClick={() => this.handleDeleteFile(file)} />
                  </div>
                ))
              }
            </div>
          </div>
        }
        {/* {this.state.showEditMeetingModal &&
        <AnnouncementMeetingModal
          title="编辑会议"
          affair={affair}
          announcement={announcement}
          meeting={meeting}
          onCancel={() => this.setState({ showEditMeetingModal: false })}
          onUpdateMeetingList={this.props.onUpdateMeetingList}
          roleList={this.props.roleList}
        />
        } */}
        {this.state.showEditMeetingModal &&
        <EditMeetingModal
          affairId={affair.get('id')}
          roleId={affair.get('roleId')}
          attachments={attachments}
          onDeleteAttachment={this.props.onDeleteAttachment}
          onAddAttachement={this.props.onAddAttachement}
          announcementId={announcement.get('announcementId')}
          meeting={meeting}
          onCancel={() => this.setState({ showEditMeetingModal: false })}
          onUpdateMeetingList={this.props.onUpdateMeetingList}
          roleList={this.props.roleList}
        />
        }
        {meeting.get('state') == STATE_TYPE.CANCELED &&
          <div className={styles.cover}/>
        }
        {this.renderAddAttachmentModal()}
        <div className={styles.more}>
          <Dropdown overlay={optMenu} placement="bottomCenter" trigger={['click']}>
            <MoreIcon/>
          </Dropdown>
        </div>
      </div>
    )
  },
})

export default MeetingItem
