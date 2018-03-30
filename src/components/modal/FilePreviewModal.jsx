import React from 'react'
import PropTypes from 'prop-types'
import styles from './FilePreviewModal.scss'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import oss from 'oss'
import { Modal, Progress, Switch, Button, message } from 'antd'
import { FILE_TYPE, getFileTypeIcon, getFileType } from 'filetype'

class FilePreviewModal extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    affairId: PropTypes.string.isRequired,
    visible: PropTypes.bool.isRequired,
    file: PropTypes.object.isRequired,
    version: PropTypes.number,
  }

  static defaultProps = {
    affairId: '-1',
    visible: false,
    file: {},
    onClose: () => {},
    version: 1,
  }

  state = {
    content: <div className={styles.prompt}>正在加载...</div>
  }

  componentDidMount() {
    const { file } = this.props
    if (file) {
      this.fetchPreview(this.props)
    }
  }

  componentWillReceiveProps(props) {
    if (this.props.file.id != props.file.id) {
      this.fetchPreview(props)
    }
  }

  fetchPreview(props) {
    const { file, affairId, roleId, version } = props

    if ((Math.round(file.size * 100 / (1024 * 1024)) / 100) > 10) {
      this.setState({
        content: <div className={styles.prompt}>文件过大，暂不支持预览，请下载查看！</div>
      })
      return
    }

    if (file.type === FILE_TYPE.UNKNOWN) {
      this.setState({
        content: <div className={styles.prompt}>文件类型暂不支持预览，请下载查看！</div>
      })
      return
    }

    //正在加载
    this.setState({
      content: <div className={styles.prompt}>正在加载...</div>
    })
    if (!file.id) {
      return
    }

    switch (file.type) {
      case FILE_TYPE.IMG:
        oss.getPreviewToken(affairId, roleId, file.id, file.name, version).then((url) => {
          this.setState({
            content: <img src={url} alt="image"/>
          })
        })
        break
      case FILE_TYPE.WORD:
      case FILE_TYPE.PDF:
      case FILE_TYPE.TEXT:
      case FILE_TYPE.VIDEO:
        oss.getPreviewToken(affairId, roleId, file.id, file.name, version).then((url) => {
          this.setState({
            content: <iframe src={url} />
          })
        })
        break
      default:
        break
    }
  }

  render() {
    const { visible, file, onClose } = this.props
    return (
      <Modal
        title={<div>{getFileTypeIcon(file.type)}<span>{file.name}</span></div>}
        footer=""
        visible={visible}
        onCancel={onClose}
        width={900}
        wrapClassName={styles.previewModal}
      >
        <div className={styles.modalContent}>
          <div className={styles.leftPanel}>
            <div className={styles.preview}>
              {this.state.content}
            </div>
          </div>
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
		// addNewFolder: bindActionCreators(addNewFolder, dispatch),
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(FilePreviewModal))
