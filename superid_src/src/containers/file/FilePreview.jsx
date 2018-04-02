import React from 'react'
import { FILE_TYPE } from 'filetype'
import oss from 'oss'
import styles from './FilePreview.scss'

const FilePreview = React.createClass({

  getInitialState() {
    return {
      content: <div className={styles.prompt}>正在加载</div>
    }
  },

  componentDidMount() {
    const { file } = this.props

    if (file) {
      this.fetchPreview(this.props)
    }
  },

  componentWillReceiveProps(props) {
    if (this.props.file.id != props.file.id || this.props.version != props.version) {
      this.fetchPreview(props)
    }
  },

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
      content: <div className={styles.prompt}>正在加载</div>
    })
    if (!file) {
      return
    }

    switch (file.type) {
      case FILE_TYPE.IMG:
        oss.getPreviewToken(affairId, roleId, file.id, file.fileName, version).then((url) => {
          this.setState({
            content: <img src={url} alt="image"/>
          })
        })
        break
      case FILE_TYPE.WORD:
      case FILE_TYPE.PDF:
      case FILE_TYPE.TEXT:
      case FILE_TYPE.VIDEO:
        oss.getPreviewToken(affairId, roleId, file.id, file.fileName, version).then((url) => {
          this.setState({
            content: <iframe src={url} />
          })
        })
        break
      default:
        break
    }
  },

  render() {
    return (
      <div className={styles.preview}>{this.state.content}</div>
    )
  }
})

export default FilePreview
