import React from 'react'
import styles from './FileCard.scss'
import { AbortIcon, DownloadIcon } from 'svg'
import { getFileType, getFileTypeIcon } from 'filetype'
import filesize from 'filesize'
import classnames from 'classnames'
import oss from 'oss'

const PropTypes = React.PropTypes

export const FILE_STATE = {
  NOT_UPLOADED: 0,
  UPLOADING: 1,
  UPLOADED: 2
}

export const FILE_CARD_POSITION = {
  LEFT: 'left',
  RIGHT: 'right'
}

const FileCard = React.createClass({
  propTypes: {
    affairId: PropTypes.number.isRequired,
    roleId: PropTypes.number.isRequired,
  },

  getDefaultProps() {
    return {
      position: FILE_CARD_POSITION.LEFT,
      state: FILE_STATE.UPLOADED,
      content: ''
    }
  },

  getInitialState() {
    return {
      progress: 0,
      XHR: null,
      state: this.props.state,
      url: null
    }
  },

  componentDidMount() {
    const { state, position, file, affairId, roleId } = this.props

    if (state === FILE_STATE.NOT_UPLOADED && position === FILE_CARD_POSITION.RIGHT && file && affairId && roleId) {
      //发送文件
      this.setState({
        state: FILE_STATE.UPLOADING
      })

      oss.uploadChatFile(file, affairId, roleId, (progress) => {
        this.setState({ progress })

        if (progress === 100) {
          this.setState({
            state: FILE_STATE.UPLOADED
          })
        }
      }, (xhr) => {
        this.setState({ XHR: xhr })
      }).then((res) => {
        if (res) {
          // 上传成功
          const url = res.host + '/' + res.path
          let fileContent = {
            name: file.name,
            size: file.size,
            url: url,
            ext: file.type
          }
          this.props.updateMessage(JSON.stringify(fileContent))
          this.setState({
            url: url
          })
        } else {
          this.props.cancelMessage()
        }   
      })
    }
  },

  //取消上传
  handleAbortUpload() {
    this.state.XHR && this.state.XHR.abort()
  },

  //下载文件
  handleDownloadFile() {
    const content = this.props.content && JSON.parse(this.props.content)
    const url = this.state.url ? this.state.url : content.url


    let link = document.createElement('a')
    if (typeof link.download === 'string') {
      document.body.appendChild(link) // Firefox requires the link to be in the body
      link.download = content.name
      link.href = url
      link.click()
      document.body.removeChild(link) // remove the link when done
    } else {
      let winTemp = window.open('', getWindowOpenTemp())
      winTemp.location.href = url
    }
  },

  render() {
    const { file, position } = this.props
    const { progress, state } = this.state

    const isLeft = position === FILE_CARD_POSITION.LEFT

    const cardClassName = classnames(styles.fileCard, isLeft ? styles.bulgeLeft : styles.bulgeRight)

    if (file) {
      return (
        <div className={cardClassName}>
          {state === FILE_STATE.UPLOADING ?
            <span className={classnames(styles.opt, 'right')} onClick={this.handleAbortUpload}><AbortIcon/></span> : null
          }
          {state === FILE_STATE.UPLOADED ?
            <span
              className={classnames(styles.opt, isLeft ? 'left' : 'right')}
              onClick={this.handleDownloadFile}
            >
              <DownloadIcon/>
            </span> : null}
          {getFileTypeIcon(getFileType(file.name))}
          <div className={styles.description}>
            <div className="u-text-14" title={file.name}>{file.name}</div>
            {isLeft ? null : <div className="u-text-l-12">{`${filesize(file.size * progress / 100, { round: 1 })}/${filesize(file.size, { round: 1 })}`}</div>}
          </div>
        </div>
      )
    } else {
      const content = JSON.parse(this.props.content)

      return (
        <div className={cardClassName}>
          <span className={classnames(styles.opt, isLeft ? 'left' : 'right')} onClick={this.handleDownloadFile}><DownloadIcon/></span>
          {getFileTypeIcon(getFileType(content.name))}
          <div className={styles.description}>
            <div className="u-text-14" title={content.name}>{content.name}</div>
          </div>
        </div>
      )
    }
  }
})

export default FileCard

const getWindowOpenTemp = () => {
  let Sys = {}
  let ua = navigator.userAgent.toLowerCase()
  let s
  (s = ua.match(/msie ([\d.]+)/)) ? Sys.ie = s[1] :
  (s = ua.match(/firefox\/([\d.]+)/)) ? Sys.firefox = s[1] :
  (s = ua.match(/chrome\/([\d.]+)/)) ? Sys.chrome = s[1] :
  (s = ua.match(/opera.([\d.]+)/)) ? Sys.opera = s[1] :
  (s = ua.match(/version\/([\d.]+).*safari/)) ? Sys.safari = s[1] : 0
  let temp = null
  if (Sys.ie) {//ie浏览器
    temp = 'about:newTab'
  } else {
    temp = '_blank'
  }
  return temp
}
