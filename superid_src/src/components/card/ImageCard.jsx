import React from 'react'
import styles from './ImageCard.scss'
import { Spin, Modal } from 'antd'
import { AbortIcon, DownloadIcon } from 'svg'
import classnames from 'classnames'
import oss from 'oss'

const PropTypes = React.PropTypes

export const IMAGE_STATE = {
  NOT_UPLOADED: 0,
  UPLOADING: 1,
  UPLOADED: 2
}

export const IMAGE_CARD_POSITION = {
  LEFT: 'left',
  RIGHT: 'right'
}

const ImageCard = React.createClass({
  propTypes: {
    affairId: PropTypes.number.isRequired,
    roleId: PropTypes.number.isRequired,
  },

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
          //读取图片数据
          var reader = new FileReader()
          reader.onload = (e) => {
            var data = e.target.result
            //加载图片获取图片真实宽度和高度
            var image = new Image()
            image.onload = () => {
              var width = image.width
              var height = image.height
              fileContent.width = width
              fileContent.height = height
              
              this.props.updateMessage(JSON.stringify(fileContent))
              this.setState({
                url: url
              })
            }
            image.src = data
          }
          reader.readAsDataURL(file)
          
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
          {state === IMAGE_STATE.UPLOADING ?
            <span className={classnames(styles.opt, 'right')} onClick={this.handleAbortUpload}><AbortIcon/></span> : null
          }
          {state === IMAGE_STATE.UPLOADED ?
            <span
              className={classnames(styles.opt, isLeft ? 'left' : 'right')}
              onClick={this.handleDownloadFile}
            >
              <DownloadIcon/>
            </span> : null}
          <div className={styles.loadingImage}>
            <Spin size="large" />
          </div>
        </div>
      )
    } else {
      
      const content = JSON.parse(this.props.content)

      return (
        <div className={cardClassName}>
          <span className={classnames(styles.opt, isLeft ? 'left' : 'right')} onClick={this.handleDownloadFile}><DownloadIcon/></span>
          <img className={styles.imageViewer} src={content.url} title={content.name} onClick={this.handlePreviewImage}/> 

        </div>
      )
    }
  }
})

export default ImageCard

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
