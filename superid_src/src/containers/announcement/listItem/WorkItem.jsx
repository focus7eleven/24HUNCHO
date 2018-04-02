import React from 'react'
import { fromJS, List, Map } from 'immutable'
import { Popover, Menu, Select, Dropdown, Modal, Icon, Upload, Button, Input, Checkbox, message } from 'antd'
import oss from 'oss'
import moment from 'moment'
import classNames from 'classnames'
import styles from './WorkItem.scss'
import { WORK_STATE, workStateList } from '../constant/AnnouncementConstants'
import { MoreIcon, FOLDERIcon, SprigDownIcon, TrashIcon } from '../../../public/svg'
import { getFileIcon } from 'file'
import config from '../../../config'
import _ from 'underscore'
import { OPT_ROLE } from '../constant/AnnouncementConstants'
import AvatarList from '../../../components/avatar/AvatarList'
import EditTaskModal from '../modal/EditTaskModal'
import EditMemorandumModal from '../modal/EditMemorandumModal'

//操作类型
const OPT_TYPE = {
  EDIT: 0,
  DELETE: 1,
  ADD_ATTACHMENT: 2,
}

const Item = Menu.Item
const Option = Select.Option
const WorkItem = React.createClass({
  getInitialState(){
    return {
      showEditWorkModal: false,
      showWorkInfoModal: false,
      showAddAttachmentModal: false,

      uploadAttachmentFrom: 'local',
      localFiles: List(),
      repoFiles: List(),
      files: Map(),
      navigateHistory: List([0]),
      currentFolderId: 0,
    }
  },
  getDefaultProps(){
    return {
      title: '',
      responsor: null,
      cooperationRoles: fromJS([]),
      endTime: '',
      state: WORK_STATE.WAIT_BEGIN, //工作状态
      remark: '', //备注

      optRoleType: OPT_ROLE.OFFICIAL, //当前操作者的角色，需要根据角色判断用户权限，详见jira
      isResponsor: false, //当前操作者是否为负责人
    }
  },

  componentDidMount(){
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
          showEditWorkModal: true,
        })
      }
    }, false)

    this.handleSearchFile = _.debounce((text) => {
      if (text) {
        fetch(config.api.file.search(text), {
          affairId: this.props.affairId,
          roleId: this.props.optRoleId,
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

  requestUploadAttachment({
    file,
    onSuccess,
    onProgress,
  }) {
    oss.uploadAnnouncementAttachment(file, fromJS({ id: this.props.affairId, roleId: this.props.roleId }), (progress) => {
      onProgress({ percent: progress })
    }).then((res) => {
      this.setState({
        localFiles: this.state.localFiles.push(res)
      })
      onSuccess(res)
    })
  },

  fetchFileList(folderId = 0) {
    const {
      affairId,
      optRoleId,
    } = this.props

    fetch(config.api.file.fileList.get(folderId), {
      method: 'GET',
      credentials: 'include',
      affairId: affairId,
      roleId: optRoleId,
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

  //handlers
  handleAddAttachment() {
    const {
      affairId,
      optRoleId,
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
      affairId: affairId,
      roleId: optRoleId,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        announcementTaskId: this.props.id,
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
  handleOptWork({ key }){
    if (key == OPT_TYPE.EDIT){
      //编辑工作
      this.setState({
        showWorkInfoModal: true,
      })
    } else if (key == OPT_TYPE.DELETE) {
      //删除工作
      const id = this.props.id
      this.props.deleteCallback(id)
    } else if (key == OPT_TYPE.ADD_ATTACHMENT) {
      this.setState({
        showAddAttachmentModal: true,
      })
    }
  },

  //value 为null则为更新工作状态
  handleUpdateWork(result) {
    this.setState({
      showEditWorkModal: false,
    })
    this.props.updateCallback(result)
  },

  handleDeleteFile(file) {
    return fetch(config.api.announcement.detail.task.attachment.delete(file.get('fileId')), {
      method: 'POST',
      affairId: this.props.affairId,
      roleId: this.props.optRoleId,
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.props.onDeleteAttachment && this.props.onDeleteAttachment(file)
      }
    })
  },

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

  handleChangeState(key){
    const {
      id,
      optRoleId,
      affairId,
      updateCallback,
      announcementId,
    } = this.props

    fetch(config.api.announcement.detail.task.modify(id), {
      method: 'POST',
      affairId: affairId,
      roleId: optRoleId,
      resourceId: announcementId,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        announcementId,
        state: key,
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0){
        updateCallback(json)
      }
    })
  },

  renderSelectFromRepo() {
    const fileMap = this.state.searchedFiles || this.state.files

    return (
      <div className={styles.selectFromRepo} style={{ display: this.state.uploadAttachmentFrom !== 'repo' ? 'none' : null }}>
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
              <div className={styles.uploadLocalFile} style={{ display: this.state.uploadAttachmentFrom !== 'local' ? 'none' : null }}>
                <Upload
                  name="appendix"
                  customRequest={this.requestUploadAttachment}
                >
                  <Button className={styles.uploadButton}>
                    <Icon type="upload" /> 点击此处上传附件
                  </Button>
                </Upload>
              </div>
            }

            {/* 文件库选择 */}
            {this.renderSelectFromRepo()}

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

  /*
  工作状态只有工作负责人才可以修改，对工作的编辑和删除，详见confluence 发布与工作
   */
  render(){
    const { showEditWorkModal, showWorkInfoModal } = this.state
    const { announcementId, permission, affairId, attachments, title, responsor, cooperationRoles, endTime, state, remark, optRoleId, overdue } = this.props
    const optMenu = (
      <Menu mode="vertical" onClick={this.handleOptWork}>
        {permission.some((v) => v == 508) && <Item key={OPT_TYPE.EDIT}>编辑工作</Item>}
        {permission.some((v) => v == 508) && <Item key={OPT_TYPE.ADD_ATTACHMENT}>上传附件</Item>}
        {permission.some((v) => v == 509) && <Item key={OPT_TYPE.DELETE}>删除工作</Item>}
      </Menu>
    )

    const responsorEle = (
      <span className={styles.respPop}>
        {responsor ?
          <img src={responsor.get('avatar')}/>
        : (
          <span className={styles.defaultAvatar}/>
        )}
        {responsor &&
          <span>{responsor.get('roleTitle')} {responsor.get('username')}</span>
        }
      </span>
    )

    const currentState = workStateList.find((v) => {
      return v.get('state') == state
    })

    return (
      <div
        className={styles.cardContainer}
        ref={(el) => {
          if (el) this.card = el
        }}
      >
        <div className={styles.titleContainer}>
          <span className={styles.options}>
            <Dropdown overlay={optMenu}>
              <MoreIcon id="more"/>
            </Dropdown>
          </span>

          <span className={styles.title}> {title}</span>
        </div>
        <div className={styles.info}>
          {responsor !== null &&
            <span className={styles.item}>
              <span className={styles.label} style={{ marginRight: 10 }}>负责人:</span>
              <Popover content={responsorEle}>
                <span className={styles.content}>
                  {responsor.get('avatar') ? (
                    <img src={responsor.get('avatar')}/>
                  ) : (
                    <span className={styles.defaultAvatar}/>
                  )}
                  <span className={styles.respName}>{responsor.get('roleTitle')} {responsor.get('username')}</span>
                </span>
              </Popover>
            </span>
          }
          {cooperationRoles.size !== 0 &&
            <span className={styles.item}>
              <span className={styles.label}>协作者:</span>
              <AvatarList roleList={cooperationRoles}/>
            </span>
          }
          <span className={styles.item}>
            <span className={styles.label}>截止时间：</span>
            <span className={styles.content} style={{ color: overdue ? 'red' : '#4a4a4a' }}>
              {moment(endTime).format('YY/MM/DD hh:mm')}
              {/*{endTime}*/}
            </span>
          </span>

          <span className={styles.item} id="workState">
            <span className={styles.label}>状态：</span>
            {this.props.permission.some((v) => v == 508) ? (
              <Select className={styles.stateSelector} value={state} onChange={this.handleChangeState}>
                {workStateList.map((v, k) => {
                  return (
                    <Option value={v.get('state')} key={k + ''}><span className={styles.icon} style={{ background: v.get('icon') }}/>{v.get('text')}</Option>
                  )
                })}
              </Select>
            ) : (
              <span><span className={styles.icon} style={{ backgroundColor: currentState.get('icon') }}/>{currentState.get('text')}</span>
            )}

          </span>
        </div>

        <div className={styles.remark}>
          备注：{remark}
        </div>

        <div className={styles.attachment}>
          <div>附件：</div>
          <div className={styles.attachmentList}>
            {
              attachments.map((file) => (
                <div className={styles.attachmentItem} key={file.get('fileId')}>
                  {getFileIcon(file.get('url'))}
                  <div style={{ marginLeft: 5, marginRight: 5 }}>{file.get('url').split('/').pop()}</div>
                  <SprigDownIcon style={{ marginLeft: 10, marginRight: 10, fill: '#ccc' }} onClick={() => oss.downloadFile(file.get('url'), new Map({ id: affairId, roleId: optRoleId }))} />
                  <TrashIcon style={{ fill: '#ccc' }} onClick={() => this.handleDeleteFile(file)} />
                </div>
              ))
            }
          </div>
        </div>

        {showWorkInfoModal &&
          <EditMemorandumModal
            announcementId={announcementId}
            id={this.props.id}
            affairId={affairId}
            roleId={optRoleId}
            attachments={attachments}
            onDeleteAttachment={this.props.onDeleteAttachment}
            onAddAttachement={this.props.onAddAttachement}
            permission={this.props.permission}
            work={this.props}
            isEdit
            onCancelCallback={() => this.setState({ showWorkInfoModal: false })}
            submitCallback={this.handleUpdateWork}
          />
        }
        {showEditWorkModal &&
          <EditTaskModal
            announcementId={announcementId}
            id={this.props.id}
            affairId={affairId}
            roleId={optRoleId}
            attachments={attachments}
            onDeleteAttachment={this.props.onDeleteAttachment}
            onAddAttachement={this.props.onAddAttachement}
            permission={this.props.permission}
            announcementType={this.props.announcementType}
            announcementNumber={this.props.announcementNumber}
            announcementTitle={this.props.announcementTitle}
            work={this.props}
            isEdit
            onCancelCallback={() => this.setState({ showEditWorkModal: false })}
            submitCallback={this.handleUpdateWork}
            // deleteCallback={this.props.deleteCallback(this.props.id)}
          />
        }
        {this.renderAddAttachmentModal()}
      </div>
    )
  }
})

export default WorkItem
