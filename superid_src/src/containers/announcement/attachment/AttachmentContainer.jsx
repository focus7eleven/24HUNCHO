import React from 'react'
import PropTypes from 'prop-types'
import { fromJS, List } from 'immutable'
import moment from 'moment'
import config from 'config'
import messageHandler from 'messageHandler'
import oss from 'oss'
import { getFileIcon } from 'file'
import { SprigDownIcon } from 'svg'
import styles from './AttachmentContainer.scss'

class AttachmentContainer extends React.Component {
  state = {
    fileList: List()
  }

  componentWillMount() {
    this.fetchFileList()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isAttachmentTab) {
      this.fetchFileList()
    }
    if (nextProps.announcement.get('announcementId') != this.props.announcement.get('announcementId')) {
      this.fetchFileList(nextProps)
    }
  }

  handleDownloadFile = (url) => {
    oss.downloadFile(url, this.props.affair)
  }

  // handleDeleteFile = (file) => {
  //   const { affair } = this.props
  //
  //   return fetch(config.api.announcement.detail.task.attachment.delete(file.get('id')), {
  //     method: 'POST',
  //     affairId: affair.get('id'),
  //     roleId: affair.get('roleId'),
  //   }).then((res) => res.json()).then((json) => {
  //     if (json.code === 0) {
  //       this.setState({
  //         fileList: this.state.fileList.filter((v) => v.get('id') !== file.get('id')),
  //       })
  //     }
  //   })
  // }

  fetchFileList = (props = this.props) => {
    const { announcement, affair } = props
    fetch(config.api.announcement.detail.file.get(announcement.get('announcementId')), {
      method: 'GET',
      affairId: affair.get('id'),
      roleId: affair.get('roleId')
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0){
        const fileList = fromJS(json.data)

        this.setState({
          fileList,
        })
      }
    })
  }

  render() {
    return (
      <div className={styles.container}>
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
                  <div className={styles.timestamp}>{moment(file.get('createTime')).format('YYYY-MM-DD HH:mm:ss')}</div>
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
  }
}

AttachmentContainer.PropTypes = {
  affair: PropTypes.object.isRequired,
  announcement: PropTypes.object.isRequired,
  isAttachmentTab: PropTypes.bool.isRequired
}

export default AttachmentContainer
