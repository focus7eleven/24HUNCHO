import React from 'react'
import PropTypes from 'prop-types'
import createClass from 'create-react-class'
import styles from './ImageCard.scss'
import { Spin, Modal } from 'antd'
import { AbortIcon, DownloadIcon } from 'svg'
import classnames from 'classnames'
import oss from 'oss'

export const IMAGE_STATE = {
  NOT_UPLOADED: 0,
  UPLOADING: 1,
  UPLOADED: 2
}

export const IMAGE_CARD_POSITION = {
  LEFT: 'left',
  RIGHT: 'right'
}

const ImageCard = createClass({
  // propTypes: {
  //   affairId: PropTypes.string.isRequired,
  //   roleId: PropTypes.string.isRequired,
  // },

  getDefaultProps() {
    return {
      position: IMAGE_STATE.LEFT,
      state: IMAGE_CARD_POSITION.UPLOADED,
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

    if (state === IMAGE_STATE.NOT_UPLOADED && position === IMAGE_CARD_POSITION.RIGHT && file && affairId && roleId) {
      //发送文件
      this.setState({
        state: IMAGE_STATE.UPLOADING
      })

      oss.uploadChatFile(file, affairId, roleId, (progress) => {
        this.setState({ progress })

        if (progress === 100) {
          this.setState({
            state: IMAGE_STATE.UPLOADED
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
      link.download = true
      link.href = url
      link.target = '_blank'
      document.body.appendChild(link) // Firefox requires the link to be in the body
      link.click()
      document.body.removeChild(link) // remove the link when done
    } else {
      location.replace(url)
    }
  },

  // 图片存在加载时间，需要在图片加载完成之后滚动到最底部
  handleOnLoad() {
    const height = this._image.clientHeight + 24
    this.props.updateMessageHeight(height)
    // this.props.scrollToBottom()
  },

  // 预览图片
  handlePreviewImage() {
    const content = this.props.content && JSON.parse(this.props.content)
    const url = this.state.url ? this.state.url : content.url
    Modal.info({
      className: styles.imageModal,
      maskClosable: true,
      content: (
        <div>
          <img className={styles.imagePreviewer} src={url} title={content.name}/>
        </div>
      ),
    })
  },

  render() {
    const { file, position } = this.props
    const { state } = this.state

    const isLeft = position === IMAGE_CARD_POSITION.LEFT

    const cardClassName = classnames(styles.imageCard, isLeft ? styles.bulgeLeft : styles.bulgeRight)

    if (file) {
      return (
        <div className={cardClassName}>
          {
            state === IMAGE_STATE.UPLOADING ?
              <span className={classnames(styles.opt, 'right')} onClick={this.handleAbortUpload}><AbortIcon/></span> : null
          }
          {
            state === IMAGE_STATE.UPLOADED ?
              <span
                className={classnames(styles.opt, isLeft ? 'left' : 'right')}
                onClick={this.handleDownloadFile}
              >
                <DownloadIcon/>
              </span>
              :
              null
          }
          <div className={styles.loadingImage}>
            <Spin size="large" />
          </div>
        </div>
      )
    } else {

      const content = JSON.parse(this.props.content)
      const url = 'https://mkpub.menkor.com/affair/469013/chat/400769/uh9mdIJih/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A72017-12-19%E4%B8%8B%E5%8D%883.55.57.png'

      return (
        <div className={cardClassName} ref={i => this._image = i}>
          <span className={classnames(styles.opt, isLeft ? 'left' : 'right')} onClick={this.handleDownloadFile}><DownloadIcon/></span>
          <img className={styles.imageViewer} onLoad={this.handleOnLoad} src={content.url} title={content.name} onClick={this.handlePreviewImage}/>
          {/* <a ref={a => this._downloadLink = a} href={url} download target="_blank">wwwwww</a> */}
        </div>
      )
    }
  }
})

export default ImageCard
