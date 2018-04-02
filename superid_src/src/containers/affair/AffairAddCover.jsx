import React from 'react'
import styles from './AffairSettingCover.scss'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { join, last } from 'lodash'
import { Button, Modal, Slider, Input, Progress, message } from 'antd'
import AvatarEditor from 'avatar-editor'
import MultipartVideoUploadMixin from 'mixins/multipart-video-upload-mixin'
import classNames from 'classnames'
import {
  addIcon,
  minuIcon,
  VerifyUploadIcon,
} from '../../public/svg'
import { deleteOrAddCover } from '../../actions/affair'
import oss from 'oss'
import config from '../../config'

const IMAGE_TYPE = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif']

const AffairAddCover = React.createClass({
  propTypes: {
    className: React.PropTypes.string,
    style: React.PropTypes.object,
    affair: React.PropTypes.object.isRequired,
  },
  mixins: [MultipartVideoUploadMixin],

  getInitialState() {
    return {
      fileName: '',
      editingAvatarURL: '',
      showEditAvatarModal: false,
      scale: 1,
      showEditVideoModal: false,
      editingVideo: null,
      editingVideoName: '',
      isUploading: false,
      uploadApi: config.api.file.token.affairCover()
    }
  },
  componentDidUpdate(prevProps, prevState) {
    if (prevState.editingVideo !== this.state.editingVideo && this.state.editingVideo) {
      // 自动上传头像
      this.handleUploadVideoFile()
    }
  },

  // Handler
  handleUploadVideoFile() {
    const file = this.state.editingVideo
    const fileName = this.state.editingVideoName

    if (join(fileName.split('.').slice(0, -1), '.') == '') {
      message.error('文件名不能为空')
    } else {
      this.handleUploadVideo(file, fileName, this.props.user.get('id'), (res) => {
        this._res = res
        this.setState({
          uploadId: null
        })
      })
    }
  },
  handleUploadCover(evt) {
    const file = evt.target.files[0]

    // 上传图片
    if (~IMAGE_TYPE.indexOf(file.type)) {
      this.setState({
        fileName: file.name,
      })

      const fileReader = new FileReader()
      fileReader.onload = (loadEvt) => {
        const base64 = loadEvt.target.result

        this.setState({
          editingAvatarURL: base64,
          showEditAvatarModal: true
        })
      }
      fileReader.onerror = () => {
        message.error('图片加载出错')
      }
      fileReader.readAsDataURL(file)
    } else if (file.type.startsWith('video')){
      if ((Math.round(file.size * 100 / (1024 * 1024)) / 100) > 500) {
        message.error('文件过大')
        return
      } else {
        this.setState({
          showEditVideoModal: true,
          editingVideo: file,
          editingVideoName: file.name
        })
      }
    } else {
      message.error('请确认上传文件的格式')
    }

    evt.target.value = null
  },
  handlePicEditCancel() {
    this.setState({
      editingAvatarURL: '',
      showEditAvatarModal: false
    })
  },
  handlePicEditCommit() {
    if (join(this.state.fileName.split('.').slice(0, -1), '.') == '') {
      message.error('文件名不能为空')
    } else {
      this.setState({ isUploading: true })

      this.refs.editor.getImage().toBlob((blob) => {
        oss.uploadAffairCover(this.props.affair, blob, config.api.file.token.affairCover(), this.state.fileName).then((url) => {
          this.setState({
            showEditAvatarModal: false,
            isUploading: false,
          })
          this.props.callback({ url: url, name: this.state.fileName, type: 1 })
           //修改prop中的素材列表
      //     this.props.deleteOrAddCover({
      //       newAffair: this.props.affair.update('covers', (covers) => {
      //         covers = covers || '[]'
      //         covers = JSON.parse(covers)
      //         covers.push({
      //           url: url,
      //           name: this.state.fileName,
      //           type: 1
      //         })
      //         return JSON.stringify(covers)
      //       }),
      //       affairMemberId: this.props.affair.get('affairMemberId'),
      //     })
        }).catch(() => {
          this.setState({
            isUploading: false
          })
        })
      })
    }
  },
  handleEditVideoCommit() {
    const fileName = this.state.editingVideoName

    if (join(fileName.split('.').slice(0, -1), '.') == '') {
      message.error('文件名不能为空')
    } else {
      this.handleUploadVideoComplete(this._res)
    }
  },
  handleUploadVideoComplete(res) {
    let videoURL = res.url.split('?')[0]
    this.props.callback({ url: videoURL, name: this.state.editingVideoName, type: 0 })
    //修改prop中的素材列表
    // this.props.deleteOrAddCover({
    //   newAffair: this.props.affair.update('covers', (covers) => {
    //     covers = covers || '[]'
    //     covers = JSON.parse(covers)
    //     covers.push({
    //       url: videoURL,
    //       name: this.state.editingVideoName,
    //       type: 0
    //     })
    //     return JSON.stringify(covers)
    //   }),
    //   affairMemberId: this.props.affair.get('affairMemberId'),
    // })

    this.setState({
      showEditVideoModal: false,
    })
  },
  handleEditVideoCancel() {
    this.setState({
      showEditVideoModal: false,
      editingVideo: null,
      editingVideoName: '',
      videoProgress: 0,
    })
    this.handleCancelUpload(this.state.editingVideo)
  },

  // Render
  render() {
    return (
      <div
        className={this.props.className}
        style={this.props.style}
        onClick={() => this.refs.uploader.click()}
      >
        <VerifyUploadIcon height="24px"/>
        <div>图片&视频</div>
        <input
          type="file"
          ref="uploader"
          style={{
            display: 'none'
          }}
          accept={['video/*', 'video/mp4', 'video/x-m4v', ...IMAGE_TYPE]}
          onChange={this.handleUploadCover}
          onClick={(e) => e.target.value = null}
        />

        {this.renderEditPictureModal()}
        {this.renderEditVideoModal()}
      </div>
    )
  },
  renderEditPictureModal() {
    const { fileName } = this.state
    return (
      <Modal
        title="裁剪图片"
        visible={this.state.showEditAvatarModal}
        onCancel={this.handlePicEditCancel}
        onOK={this.handlePicEditCommit}
        wrapClassName={styles.picModalWrap}
        maskClosable={false}
        footer={[
          <div key = "foot">
            <Button type="ghost" key="cancel" onClick={this.handlePicEditCancel}>取消</Button>
            <Button type = "primary" key = "ok" onClick={this.handlePicEditCommit} loading={this.state.isUploading}>下一步</Button>
          </div>]}
      >
        <div className={styles.editBody}>
          <div className={styles.editPicName}>
            <span>图片名称</span>
            <Input value={fileName
            ? join(fileName.split('.').slice(0, -1), '.')
            : ''}
              onChange={(e) => {
                this.setState({
                  fileName: e.target.value + '.' + last(fileName.split('.'))
                })
              }}
            />
          </div>

          <div className={styles.editAvatar}>
            <AvatarEditor ref="editor" image={this.state.editingAvatarURL} width={400} height={250} border={[0, 0]} scale={this.state.scale} withMask={false}/>
            <div className={styles.tips}>为了实现最佳效果，推荐上传的图片比例接近16:10</div>
          </div>

          <div className={styles.slider}>
            <div className={styles.iconwrapper}>
              <div className={classNames(styles.icon, styles.front)} onClick={() => {
                this.setState({
                  scale: this.state.scale <= 1 ? 1 : this.state.scale - 0.1
                })
              }}
              >{minuIcon}</div>
              <Slider min={0.5} max={2.5} step={0.01} tipFormatter={null} value={this.state.scale} onChange={(v) => {
                this.setState({ scale: v })
              }}
              />
              <div className={classNames(styles.icon, styles.backend)} onClick={() => {
                this.setState({
                  scale: this.state.scale >= 2.5 ? 2.5 : this.state.scale + 0.1
                })
              }}
              >{addIcon}</div>
            </div>
          </div>
        </div>
      </Modal>
    )
  },
  renderEditVideoModal() {
    return (
      <Modal maskClosable={false} title="视频上传" visible={this.state.showEditVideoModal} onCancel={this.handleEditVideoCancel} wrapClassName={styles.videoModalWrap}
        footer={[
          <div style = {{ textAlign: 'left' }} key="video-foot" >
            <Button className={styles.cancelBtn} type="ghost" key="video-cancel" onClick={this.handleEditVideoCancel}>
              <span>取消</span>
            </Button>
            <Button className = {styles.okBtn} type = "primary" key = "video-ok" onClick = {this.handleEditVideoCommit} disabled={!!this.state.uploadId}>
              <span>下一步</span>
            </Button>
          </div>]}
      >
        <div>
          <div className={styles.nameDiv}>
            <span className={styles.nameSpan}>视频名称:</span>
            <Input
              type="text"
              className={styles.nameInput}
              value={this.state.editingVideoName ? join(this.state.editingVideoName.split('.').slice(0, -1), '.') : ''}
              onChange={(e) => {
                this.setState({
                  editingVideoName: e.target.value + '.' + last(this.state.editingVideoName.split('.'))
                })
              }
            }
            />
          </div>

          <div className={classNames(styles.Progress, this.state.isVideoUploadFailure ? styles.failureProgressBar : null)}><Progress percent={parseFloat(this.state.videoProgress.toFixed(1))} strokeWidth={5}/></div>

          {this.state.isVideoUploadFailure ? <div className={styles.uploadVedioFailureTips}>网络错误，<span onClick={this.handleUploadVideoFile}>继续上传</span></div> : null}
        </div>
      </Modal>
    )
  },
})

function mapStateToProps(state) {
  return {
    user: state.get('user'),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    deleteOrAddCover: bindActionCreators(deleteOrAddCover, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AffairAddCover)
