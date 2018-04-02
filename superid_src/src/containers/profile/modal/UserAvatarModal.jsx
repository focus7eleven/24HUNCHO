import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styles from './UserAvatarModal.scss'
import { Modal, Slider, Button, message } from 'antd'
import AvatarEditor from 'avatar-editor'
import { addIcon, minuIcon } from 'svg'
import oss from 'oss'
import classNames from 'classnames'
import { updateUserAvatar } from '../../../actions/user'

const UserAvatarModal = React.createClass({
  getInitialState(){
    return {
      scale: 1,
      editImg: '', //待编辑的图片
      editPanel: false, //显示编辑面板
      isUploading: false, //上传按钮状态
      contentType: '',
    }
  },
  handleSelectedFile(e){
    let file = e.target.files[0]
    let fileReader = new FileReader()
    let that = this

    fileReader.onload = function (evt){
      that.setState({
        editImg: evt.target.result,
        editPanel: true,
        contentType: file.type,
      })
    }
    fileReader.readAsDataURL(file)
  },
  handleUploadFile(){
    this.refs.editor.getImage().toBlob((blob) => {
      this.setState({ isUploading: true })
      oss.uploadUserAvatar(blob).then((res) => {
        this.props.updateUserAvatar(`${res.host}/${res.path}`)

        this.setState({
          editPanel: false,
          isUploading: false
        })
      }).catch((err) => {
				//失败后取消上传状态
        this.setState({
          isUploading: false
        })
        message.error('上传失败！')

        throw err
      })
    })
  },
  render(){
    return (
      <div style={{ display: 'inline-block' }}>
        <div onClick={() => {this.refs.fileUploader.click()}}>
          {this.props.children}
        </div>
        <Modal title="上传头像" visible={this.state.editPanel} wrapClassName={styles.wrapperClass} width={500}
          maskClosable={false}
          onCancel={() => this.setState({ editPanel: false })}
          footer={[
            <div key="foot">
              <Button type="ghost" size="large" key="cancel" onClick={() => this.setState({ editPanel: false })}>取消</Button>
              <Button type="primary" size="large" key="ok" onClick={this.handleUploadFile}
                loading={this.state.isUploading}
              >确定</Button>
            </div>]}
        >
          <div className={styles.content}>
            <div className={styles.mainPanel}>
              <AvatarEditor
                ref="editor"
                image={this.state.editImg}
                width={440}
                height={300}
                border={[25, 95]}
                borderRadius={125}
                scale={this.state.scale}
                widthMask
                onMouseMove={this.handleMoveImg}
                onImageReady={this.handleMoveImg}
              />
              <div className={styles.sliderContainer}>
                <div className={classNames(styles.icon, styles.front)} onClick={() => {
                  this.setState({
                    scale: this.state.scale <= 1 ? 1 : this.state.scale - 0.1
                  })
                }}
                >
                  {minuIcon({ fill: '#757575' })}
                </div>
                <Slider
                  tipFormatter={null}
                  min={1}
                  max={2.5}
                  step={0.01}
                  value={this.state.scale} onChange={(v) => {
                    this.setState({ scale: v })
                  }}
                />
                <div className={classNames(styles.icon, styles.backend)} onClick={() => {
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
        </Modal>

        <input type="file" ref="fileUploader" style={{ display: 'none' }} accept="image/gif, image/jpg, image/jpeg, image/png" onChange={this.handleSelectedFile} onClick={(e) => e.target.value = null}/>
      </div>
    )
  }
})

function mapStateToProps() {
  return {}
}

function mapDispatchToProps(dispatch) {
  return {
    updateUserAvatar: bindActionCreators(updateUserAvatar, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserAvatarModal)
