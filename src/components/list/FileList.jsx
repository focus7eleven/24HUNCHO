import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import { Table, Button } from 'antd'
import { getFileTypeIcon, getFileType } from 'filetype'
import { FileDownloadIcon, DeleteIcon } from 'svg'
import styles from './FileList.scss'


export const ACTIVITY_FILE_TYPE = {
  HOMEWORK: 0, // 作业
  ATTACHMENT: 1, // 附件
}

const ACTIVITY_FILE_TYPES = ['作业', '文件']

class FileList extends React.Component {
  handleDownload = (file) => {
    this.props.downloadCallback(file)
  }
  handleSelectedFiles = () => {
    this.props.uploadCallback(this.fileUploader.files)
  }

  handleDelete = (file) => {
    this.props.deleteCallback(file)
  }

  handleDownloadBatch = () => {
    this.props.downloadBatchCallback()
  }

  render() {
    const { fileList, type, multiple, canUpload, canDownloadBatch, deadline, isLoading } = this.props
    const columns = [{
      dataIndex: 'fileName',
      key: 'fileName',
      width: '50%',
      render: (text, record) => {
        if (deadline) {
          const isDelayed = moment(record.submitTime).valueOf() - moment(deadline).valueOf() > 0
          return (
            <span className={styles.titleContainer}>
              {getFileTypeIcon(getFileType(text))}
              <span className={styles.title}>{text}</span>
              {isDelayed && <span className={styles.message}>迟交</span>}
            </span>
          )
        } else {
          return <span className={styles.titleContainer}>
            {getFileTypeIcon(getFileType(text))}
            <span className={styles.title}>{text}</span>
          </span>
        }

      }
    }, {
      dataIndex: 'userName',
      key: 'userName',
      width: '15%'
    }, {
      dataIndex: 'submitTime',
      key: 'submitTime',
      width: '25%',
      render: (text) => (
        <span>{moment(text).format('YYYY/MM/DD kk:mm')}</span>
      )
    }, {
      dataIndex: 'action',
      key: 'action',
      width: '10%',
      render: (text, record) => {
        // 活动中的附件类型课程中只有老师和助教可以上传，也只有老师和助教可以删除，小组中不是教务园就行
        return (
          <span className={styles.optWrapper}>
            <FileDownloadIcon style={{ fill: '#cccccc', width:16 }} onClick={this.handleDownload.bind(this, record)}/>
            {type == ACTIVITY_FILE_TYPE.ATTACHMENT && canUpload &&
              <DeleteIcon style={{ fill: '#cccccc', width: 16 }} onClick={this.handleDelete.bind(this,record)} />
            }
          </span>

        )

      }
    }]

    return (
      <div className={styles.container}>
        <div className={styles.titleContainer}>
          {ACTIVITY_FILE_TYPES[type]}列表：
          {canUpload &&
            <Button type="primary" size="small" style={{ borderColor: '#90b5df', backgroundColor: '#90b5df' }} onClick={(e) => {e.preventDefault(); this.fileUploader.click()}}>上传{ACTIVITY_FILE_TYPES[type]}</Button>
          }
          {canDownloadBatch && fileList.size > 0 &&
            <Button type="primary" size="small" style={{ borderColor: '#90b5df', backgroundColor: '#90b5df' }} onClick={this.handleDownloadBatch}>批量下载</Button>
          }
          <input ref={(el) => this.fileUploader = el} type="file" multiple={multiple} style={{ display: 'none' }} onChange={this.handleSelectedFiles}/>
        </div>
        <div className={styles.listContainer}>
          <Table showHeader={false} loading={isLoading} pagination={false} columns={columns} dataSource={fileList.toJSON()} />
        </div>
      </div>
    )
  }
}

FileList.propTypes = {
  fileList: PropTypes.object.isRequired,
  type: PropTypes.number,
  downloadCallback: PropTypes.func.isRequired,
  uploadCallback: PropTypes.func.isRequired,
  canUpload: PropTypes.bool.isRequired,
  canDownloadBatch: PropTypes.bool.isRequired,
  downloadBatchCallback: PropTypes.func,
  multiple: PropTypes.bool,
  deadline: PropTypes.number,
}

FileList.defaultProps = {
  type: ACTIVITY_FILE_TYPE.ATTACHMENT,
  canUpload: false,
  canDownloadBatch: false,
  multiple: false,
  deadline: null,
}

export default FileList
