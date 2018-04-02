import React from 'react'
import PropTypes from 'prop-types'
import { Modal, message, Upload, Checkbox, Button, Icon, Input } from 'antd'
import { fromJS, List } from 'immutable'
import classNames from 'classnames'
import oss from 'oss'
import config from 'config'
import { FOLDERIcon } from 'svg'
import { getFileIcon } from 'file'
import _ from 'lodash'

import styles from './AddAttachmentModal.scss'

class AddAttachmentModal extends React.Component {
  state = {
    uploadAttachmentFrom: 'local',
    files: List(),
    localFiles: List(),
    repoFiles: List(),
    searchedFiles: List(),
    navigateHistory: List([0]),
    currentFolderId: 0,
    // syncFileRepo:
  }

  initialState = this.state

  handleSearchFile = _.debounce((text) => {
    if (text) {
      fetch(config.api.file.search(text), {
        affairId: this.props.affairId,
        roleId: this.props.roleId,
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

  fetchFileList = (folderId = 0) => {
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

  }

  handleBackNavigateHistory = () => {
    const {
      navigateHistory,
      currentFolderId,
    } = this.state
    const indexOfCurrent = navigateHistory.findIndex((v) => v === currentFolderId)

    if (indexOfCurrent > 0) {
      this.setState({
        currentFolderId: navigateHistory.get(indexOfCurrent - 1),
      })
    }

    this.fetchFileList(navigateHistory.get(indexOfCurrent - 1))
  }

  handleForwardNavigateHistory() {
    const {
      navigateHistory,
      currentFolderId,
    } = this.state
    const indexOfCurrent = navigateHistory.findIndex((v) => v === currentFolderId)

    if (indexOfCurrent < navigateHistory.size - 1) {
      this.setState({
        currentFolderId: navigateHistory.get(indexOfCurrent + 1),
      })
    }

    this.fetchFileList(navigateHistory.get(indexOfCurrent + 1))
  }

  handleAddAttachment = () => {
    const {
      syncFileRepo,
      localFiles,
      repoFiles,
    } = this.state
    const {
      affair,
      taskId,
    } = this.props
    const urlList = syncFileRepo ? (
      localFiles.map((v) => ({
        url: v.path,
        name: v.file.name,
        size: v.file.size,
      }))
    ) : (
      localFiles.map((v) => ({
        url: v.path,
      }))
    )

    const storeUrlList = repoFiles.map((v) => ({
      url: v.get('address'),
    })).toJS()

    fetch(config.api.announcement.detail.task.attachment.post(), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        announcementTaskId: taskId,
        urlList,
        storeUrlList,
        choose: this.state.syncFileRepo ? 1 : 0,
      }),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.props.onSuccess()


      }
    })

  }

  requestUploadAttachment = ({
    file,
    onSuccess,
    onProgress,
  }) => {
    oss.uploadAnnouncementAttachment(file, fromJS({ id: this.props.affair.get('id'), roleId: this.props.affair.get('roleId') }), (progress) => {
      onProgress({ percent: progress })
    }).then((res) => {
      this.setState({
        localFiles: this.state.localFiles.push(res)
      })
      onSuccess(res)
    })
  }

  renderSelectFromRepo() {
    const {
      searchedFiles,
      uploadAttachmentFrom,
      files,
    } = this.state

    const fileMap = searchedFiles || files

    return (
      <div className={styles.selectFromRepo} style={{ display: uploadAttachmentFrom !== 'repo' ? 'none' : null }}>
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
  }

  render() {
    const {
      visible,
      onCancel,
    } = this.props
    const {
      uploadAttachmentFrom
    } = this.state
    return (
      <Modal
        visible={visible}
        title="添加附件"
        footer={null}
        width={500}
        wrapClassName={styles.addAttachmentModal}
        onCancel={() => onCancel()}
      >
        <div className={styles.addAttachmentModalContent}>
          <div className={styles.attachmentSourceTab}>
            <div
              onClick={() => this.setState({ uploadAttachmentFrom: 'local' })}
              className={classNames(styles.sourceItem, uploadAttachmentFrom === 'local' ? styles.activeSourceItem : null)}
            >
              本地上传
            </div>
            <div
              onClick={() => {
                this.fetchFileList()
                this.setState({ uploadAttachmentFrom: 'repo' })
              }}
              className={classNames(styles.sourceItem, uploadAttachmentFrom === 'repo' ? styles.activeSourceItem : null)}
            >
              文件库选取
            </div>
          </div>

          <div className={styles.uploadArea}>
            {/* 本地上传附件 */}
            {
              <div className={styles.uploadLocalFile} style={{ display: uploadAttachmentFrom !== 'local' ? 'none' : null }}>
                <Upload
                  name="appendix"
                  customRequest={this.requestUploadAttachment}
                  // fileList={this.state.localFiles}
                  // defaultFileList={this.state.localFiles}
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
              <Button style={{ marginLeft: 'auto', marginRight: 10 }} onClick={() => onCancel()}>取消</Button>
              <Button type="primary" onClick={this.handleAddAttachment}>确定</Button>
            </div>
          </div>
        </div>
      </Modal>
    )
  }
}

AddAttachmentModal.PropTypes = {
  visible: PropTypes.bool.isRequired,
  affair: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
}

export default AddAttachmentModal
