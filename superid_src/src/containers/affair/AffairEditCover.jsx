import React from 'react'
import { Modal, Button, Input, Slider, message, Progress } from 'antd'
import styles from './AffairEditCover.scss'
import AvatarEditor from 'avatar-editor'
import classnames from 'classnames'
import { minuIcon, addIcon } from 'svg'
import { join, last } from 'lodash'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { deleteOrAddCover } from '../../actions/affair'
import MultipartVideoUploadMixin from 'mixins/multipart-video-upload-mixin'
import oss from 'oss'
import config from '../../config'

const MAX_WORD_COUNT = 50

const AffairEditCover = React.createClass({
  _affairMemberId: '',
  _currentCoverType: '', //当前封面类型
  _editingAvatarURL: '', //本地缓存的待编辑的图片
  _newCoverUrl: '', //新封面的地址
  mixins: [MultipartVideoUploadMixin],
  getDefaultProps(){
    return {
      visible: true,
      affair: {},
      cover: {},
      onClose: () => {},
      onModifyCover: () => {}
    }
  },
  getInitialState(){
    return {
      step: 1,
      description: this.props.cover.description, //封面描述
      fileName: this.props.cover.name, //封面名称
      wordCount: this.props.cover.description ? this.props.cover.description.length : 0, //描述的字数

      scale: 1, //图片编辑的比例

      uploadingVideo: false, //是否在上传视频
      uploadApi: config.api.file.token.affairCover()
    }
  },
  componentWillMount(){
    const {
      affair
    } = this.props
    this._affairMemberId = affair.get('affairMemberId')
    this._currentCoverType = this.props.cover.type//当前封面的类型
  },
  handleConfirmEdit(){

    switch (this.state.step) {
      case 1:
        this.handleSubmit()
        break
      case 2:
        //上传图片
        this._currentCoverType ? this.handleEditImageCommit() : this.handleEditVideoCommit()
        break
      case 3:
        this.handleSubmit()
        break
      default:

    }

  },

  handleCancelEdit(){
    switch (this.state.step) {
      case 1:
        this.props.onClose()
        break
      case 2:
        this.setState({
          step: 1
        })
        break
      case 3:
        if (this._currentCoverType === 0) {
          //取消视频上传
          this.handleCancelUpload(this._file)
        }
        this.setState({
          step: 2
        })
        break
      default:

    }
  },
//确认编辑,提交修改
  handleSubmit(){
    // let oldCovers = JSON.parse(affair.get('covers'))
    let newChosenObj = {
      url: this._newCoverUrl || this.props.cover.url,
      name: this.state.fileName,
      description: this.state.description,
      type: this._currentCoverType,
    }
    this.props.onModifyCover(newChosenObj)
    this.props.onClose()
    // let newCovers = oldCovers.map( (cover) => {
        //
    //   if (cover.url == this.props.cover.url){
    //     return newChosenObj ={
    //       url:this._newCoverUrl || this.props.cover.url,
    //       name:this.state.fileName,
    //       description:this.state.description,
    //       type:this._currentCoverType,
    //     }
    //   } else {
    //     return cover
    //   }
    // })
    // this.props.changeAffairCovers({ newAffair:this.props.affair.set('covers', JSON.stringify(newCovers)), affairMemberId:this._affairMemberId }, () => this.props.onModifyCover(newChosenObj))
  },
//选择新的封面
  handleChooseNewCover(evt){
    const that = this
    this._file = evt.target.files[0]//选择要编辑的文件
    this._currentCoverType = this._file.type.split('/')[0] == 'image' ? 1 : 0//修改当前封面的类型
    const fileReader = new FileReader()
    fileReader.onload = (loadEvt) => {
      const base64 = loadEvt.target.result
      this._editingAvatarURL = base64
      that.setState({ step: 2, fileName: this._file.name })
    }
    fileReader.onerror = () => {
      message.error('文件类型错误')
    }
    fileReader.readAsDataURL(this._file)
    evt.target.files[0] = ''
  },
//确认修改图像封面
  handleEditImageCommit(){
    this.refs.editor.getImage().toBlob((blob) => {
      oss.uploadAffairCover(this.props.affair, blob, config.api.file.token.affairCover(), this.state.fileName).then((url) => {
        this._newCoverUrl = url
        this.setState({
          newCoverUrl: url,
          step: 3,
        })
      }).catch(() => {
        return
      })
    })
  },
//确认修改视频封面，上传视频
  handleEditVideoCommit(){
    const file = this._file//正在编辑的视频
    const fileName = this.state.fileName
    this.setState({
      uploadingVideo: true
    })
    if (join(fileName.split('.').slice(0, -1), '.') == ''){
      message.error('文件名不能为空')
    } else {
      this.handleUploadVideo(file, fileName, this.props.user.get('id'), this.handleUploadVideoComplete)
    }
  },
//完成视频上传
  handleUploadVideoComplete(res){
    let videoURL = res.url.split('?')[0]
    this._newCoverUrl = videoURL
    this.setState({
      step: 3,
      uploadingVideo: false,
    })
  },

//重新选择封面，添加描述
  renderReChoosePanel(){
    return (
      <div className={styles.container}>
        <div className={styles.avatar}>
          <div className={styles.wrapper}>
            <div className={styles.avatarMask} onClick={() => {this.refs.fileUpload.click()}}><span>重新上传</span></div>
            {this._currentCoverType ? <img src={this._newCoverUrl ? this._newCoverUrl : this.props.cover.url}/> : <video src={this._newCoverUrl ? this._newCoverUrl : this.props.cover.url}/>}
          </div>
        </div>
        <div className={styles.description}>
          <Input type="textarea" style={{ resize: 'none' }} rows={2} value={this.state.description} onChange={(e) => {(e.target.value.indexOf('\n') > 0 || e.target.value.length > 50) ? null : this.setState({ description: e.target.value, wordCount: e.target.value.length })}}/>
          <div className={styles.wordCount} style={this.state.wordCount >= 50 ? { color: '#f45b6c' } : { color: '#9b9b9b' }}>{this.state.wordCount}/{MAX_WORD_COUNT}</div>
        </div>
      </div>
    )
  },
  //重新上传是图片封面
  renderEditAvatarPanel(){
    const { fileName } = this.state
    return (
      <div className={styles.container}>
        <div className={styles.editBody}>
          <div className={styles.editPicName}>
            <span>图片名称</span>
            <Input
              value={fileName ? join(fileName.split('.').slice(0, -1), '.') : ''}
              onChange={(e) => {
                this.setState({
                  fileName: e.target.value + '.' + last(fileName.split('.'))
                })
              }}
            />
          </div>
          <div className={styles.editAvatar}>
            <AvatarEditor onMouseUp={this.handleCropAvatar} ref="editor" image={this._editingAvatarURL} width={460} height={250} border={[0, 0]} scale={this.state.scale} withMask={false}/>
            <div className={styles.tips}>为了实现最佳效果，推荐上传的图片比例接近16:10</div>
          </div>
          <div className={styles.slider}>
            <div className={styles.iconwrapper}>
              <div className={classnames(styles.icon, styles.front)} onClick={() => {
                this.setState({
                  scale: this.state.scale <= 1 ? 1 : this.state.scale - 0.1
                })
              }}
              >
                {minuIcon({ fill: '#757575' })}
              </div>
              <Slider min={1} max={2.5} step={0.01} value={this.state.scale} onChange={(v) => {
                this.setState({ scale: v })
              }}
              />
              <div className={classnames(styles.icon, styles.backend)} onClick={() => {
                this.setState({
                  scale: this.state.scale >= 2.5 ? 2.5 : this.state.scale + 0.1
                })
              }}
              >
                {addIcon({ fill: '#757575' })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  //上传视频的
  renderVideoEditPanel(){
    return (
      <div className={styles.videoContainer}>
        <div className={styles.nameDiv}>
          <span className={styles.nameSpan}>视频名称:</span>
          <Input
            type="text"
            className={styles.nameInput}
            value={this.state.fileName ? join(this.state.fileName.split('.').slice(0, -1), '.') : ''}
            onChange={(e) => {
              this.setState({
                fileName: e.target.value + '.' + last(this.state.fileName.split('.'))
              })
            }
          }
          />
        </div>
        <div className={classnames(styles.Progress, this.state.isVideoUploadFailure ? styles.failureProgressBar : null)}><Progress percent={parseFloat(this.state.videoProgress.toFixed(1))} strokeWidth={5}/></div>
        {this.state.isVideoUploadFailure ? <div className={styles.uploadVedioFailureTips}>网络错误，<span onClick={this.handleEditVideoCommit}>继续上传</span></div> : null}
      </div>
    )
  },
  renderModalBody(){
    switch (this.state.step) {
      case 1:
        return this.renderReChoosePanel()
      case 2:
        return this._currentCoverType ? this.renderEditAvatarPanel() : this.renderVideoEditPanel()
      case 3:
        return this.renderReChoosePanel()
      default:
        null
    }
  },
  render(){
    return (
      <Modal title={this._currentCoverType ? '编辑封面' : '编辑视频'} visible={this.props.visible} onOK={this.handleConfirmEdit} onCancel={() => {this.props.onClose()}} wrapClassName={styles.editModal}
        maskClosable={false}
        footer={[
          <Button size="large" disabled={this.state.uploadingVideo} onClick={this.handleCancelEdit} type="ghost" key="cancel">{'取消'}</Button>,
          <Button size="large" disabled={this.state.uploadingVideo} onClick={this.handleConfirmEdit} type="primary" key="confirm">{'确定'}</Button>
        ]}
      >
        {this.renderModalBody()}
        <input accept={['video/*', 'video/mp4', 'video/x-m4v', 'image/jpg', 'image/jpeg', 'image/png', 'image/gif']} style={{ display: 'none' }} type="file" ref="fileUpload" onChange={this.handleChooseNewCover} onClick={(e) => e.target.value = null}/>
      </Modal>
    )
  }
})

function mapStateToProps(state){
  return {
    user: state.get('user')
  }
}

function mapDispatchToProps(dispatch){
  return {
    changeAffairCovers: bindActionCreators(deleteOrAddCover, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AffairEditCover)
