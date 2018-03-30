import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { Modal, Progress, Switch, Button, message } from 'antd'
import styles from './UploadFilesModal.scss'
import oss, { config } from 'oss'
import { Map } from 'immutable'
import { FILE_TYPE } from 'filetype'
import { addFile } from '../../actions/file'

class UploadFilesModal extends React.Component {
  static propTypes = {
    affairId: PropTypes.string.isRequired,
    folderId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    visible: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    visible: false,
    onClose: () => {},
    onSuccess: () => {},
    affairId: '-1',
    folderId: '-1',
    fileId: null,
  }

  state = {
    filesProgress: Map(),
    filesUploadXHR: Map(),
    files: Map(),
    uploadResult: [],
  }

  componentDidMount() {
    if (this.props.files) {
      this.setState({ uploadResult: [] }, this.uploadFiles(this.props))
    }
  }

  //文件列表改变，说明重新选择了文件，自动开始上传新文件
  componentWillReceiveProps(props) {
    if (this.props.files != props.files) {
      this.setState({
        uploadResult: [],
        filesProgress: Map(),
        files: Map(),
        filesUploadXHR: Map(),
      }, this.uploadFiles(props))
    }
  }

  //取消所有上传
  cancelUpload() {
    //setTimeout保证在窗口关闭前所有上传终止
    setTimeout(this.props.onCancel, 0)

    this.state.filesUploadXHR.forEach((xhr) => {
      xhr && xhr.abort()
    })
  }

  //上传文件
  uploadFiles(props) {
    let len = props.files.length
    const { files, folderId, affairId, roleId, fileId } = props
    const path = props.match.params.path
    for (let i = 0; i < len; i++) {
      //开始上传
      oss.uploadAffairFile(files[i], affairId, roleId, fileId, (percent) => {
        this.setState({
          filesProgress: this.state.filesProgress.set(files[i].fileName || files[i].name, percent)
        })

        if (percent === 100) {
          this.setState({
            filesUploadXHR: this.state.filesUploadXHR.delete(files[i].fileName || files[i].name)
          })
        }
      }, (xhr) => {
        //abort upload
        this.setState({ filesUploadXHR: this.state.filesUploadXHR.set(files[i].fileName || files[i].name, xhr) })
      }).then((result) => {
        let url = result.path
        //url为null代表取消上传或上传失败
        if (!url) {
          this.setState({
            filesProgress: this.state.filesProgress.set(files[i].fileName || files[i].name, null),
            filesUploadXHR: this.state.filesUploadXHR.set(files[i].fileName || files[i].name, null)
          })
          return null
        }
        const newFileJSON = JSON.stringify({
          'address': url,
          'fileName': files[i].fileName || files[i].name,
          'folderId': +folderId,
          'uploader': roleId,
          'size': files[i].size,
          'publicType': 0,
          'fileId': null,
        })
        this.props.addFile(affairId, roleId, newFileJSON, path).then(res => {
          const { uploadResult } = this.state
          uploadResult.push(res)
          this.setState({ uploadResult })
        })
      })
    }
  }

  handleUploadSuccess = () => {
    this.props.onSuccess(this.props.match.params.path, this.state.uploadResult)
  }

  renderPercent(percent, file) {
    const fileName = file.fileName || file.name
    if (percent === null) {
      return <div className="u-text-l-12" style={{ marginLeft: 10 }}>上传失败</div>
    }
    if (percent === undefined) {
      return <div className="u-text-l-12" style={{ marginLeft: 10 }}>排队中</div>
    }
    if (percent < 100) {
      return (
        <div className={styles.percentContainer}>
          <div className={styles.percent}>{percent + '%'}</div>
          <div className="u-link-12" onClick={() => {
            this.state.filesUploadXHR.get(fileName).abort()
            this.setState({
              filesUploadXHR: this.state.filesUploadXHR.delete(fileName)
            })
          }}
          >取消</div>
        </div>
      )
    } else {
      return <div className={styles.complete}>已完成</div>
    }
  }

  render(){
    const { visible, files } = this.props
    const canCloseModal = this.state.filesUploadXHR.every((xhr) => !xhr)
    let fileList = []
    for (let i = 0; files && i < files.length; i++) {
      const percent = this.state.filesProgress.get(files[i].fileName || files[i].name)
      fileList.push(
        <div className={styles.file} key={files[i].fileName || files[i].name}>
          <div className="u-text-14">{files[i].fileName || files[i].name}</div>
          <div className={styles.progress}>
            <Progress percent={percent} format={this.renderPercent} showInfo={false}/>
            {this.renderPercent(percent, files[i])}
          </div>
        </div>
      )
    }

    return (
      <Modal title="文件上传"
        visible={visible || false}
        onCancel={this.cancelUpload}
        width={500}
        wrapClassName={styles.uploadFilesModal}
        footer={<Button type="primary" onClick={this.handleUploadSuccess} style={{ marginBottom: 20 }} disabled={!canCloseModal}>完成</Button>}
        maskClosable={false}
      >
        <div className={styles.fileList}>{fileList}</div>

        <div className="u-text-l-12" style={{ padding: '20px 40px' }}>
          <div>文件上传至系统中超过24小时将无法删除</div>
        </div>
      </Modal>
    )
  }
}

function mapStateToProps(state) {
	return {
    roleId: state.getIn(['user', 'role', 'roleId']),
		// fileMap: state.getIn(['file', 'fileMap']),
	}
}

function mapDispatchToProps(dispatch) {
	return {
		addFile: bindActionCreators(addFile, dispatch),
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(UploadFilesModal))
