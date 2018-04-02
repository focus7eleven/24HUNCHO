import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styles from './EditLogoModal.scss'
import { Modal, Slider, Button, message } from 'antd'
import { List, fromJS } from 'immutable'
import AvatarEditor from 'avatar-editor'
import { addIcon, minuIcon } from '../../public/svg'
import classNames from 'classnames'
import AffairAvatar from '../../components/avatar/AffairAvatar'
import { modifyAffairInfo, fetchAffairList } from '../../actions/affair'
import oss from 'oss'

let previewImgList = List()
const EditLogoModal = React.createClass({
  propTypes: {
    children: PropTypes.object.isRequired,
    affair: PropTypes.object.isRequired,
  },
  getInitialState(){
    return {
      scale: 1,
      editImg: '', //待编辑的图片
      editPanel: false, //显示编辑面板
      isUploading: false, //上传按钮状态
    }
  },
  handleSelectedFile(e){
    let file = e.target.files[0]
    let fileReader = new FileReader()
    let that = this
    fileReader.onload = function (evt){
      previewImgList = fromJS([evt.target.result])
      that.setState({
        editImg: evt.target.result,
        editPanel: true,
      })
    }
    fileReader.readAsDataURL(file)
  },
  handleMoveImg(){
    let convas = this.refs.editor.getImage()
    previewImgList = previewImgList.push(convas.toDataURL())
    this.setState({ })
  },
  handleUploadFile(){
    this.refs.editor.getImage().toBlob((blob) => {
      this.setState({ isUploading: true })
      const { affair } = this.props

      oss.uploadAffairAvatar(blob, affair).then((res) => {
        if (res) {
          this.props.modifyAffairInfo(affair, affair.get('affairMemberId'), affair.set('avatar', res), true)
          this.props.fetchAffairList()
        }

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
    const currentImg = previewImgList.last()
    return (
      <div>
        <div onClick={() => {this.refs.fileUploader.click()}}>
          {this.props.children}
        </div>
        <Modal title="上传LOGO" visible={this.state.editPanel} wrapClassName={styles.wrapperClass} width={610}
          maskClosable={false}
          onCancel={() => this.setState({ editPanel: false })}
          footer={[
            <div key="foot">
              <Button type="ghost" key="cancel" onClick={() => this.setState({ editPanel: false })}>取消</Button>
              <Button type="primary" key="ok" onClick={this.handleUploadFile}
                loading={this.state.isUploading}
              >确定</Button>
            </div>]}
        >
          <div className={styles.content}>
            <div className={styles.mainPanel}>
              <AvatarEditor
                ref="editor"
                image={this.state.editImg}
                width={400}
                height={250}
                border={[25, 100]}
                scale={this.state.scale}
                widthMask
                onMouseMove={this.handleMoveImg}
                onImageReady={this.handleMoveImg}
              />
              <div className={styles.sliderContainer}>
                <div className={classNames(styles.icon, styles.front)} onClick={() => {
                  this.setState({
                    scale: this.state.scale <= 1 ? 1 : this.state.scale - 0.1
                  }, () => {
                    this.handleMoveImg()
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
                    this.setState({ scale: v }, () => {
                      this.handleMoveImg()
                    })
                  }}
                />
                <div className={classNames(styles.icon, styles.backend)} onClick={() => {
                  this.setState({
                    scale: this.state.scale >= 2.5 ? 2.5 : this.state.scale + 0.1
                  }, () => {
                    this.handleMoveImg()
                  })
                }}
                >
                  {addIcon({ fill: '#757575' })}
                </div>
              </div>
            </div>
            <div className={styles.rightPanel}>
              <span className={styles.logoTag}>LOGO预览:</span>
              <div className={styles.logoPreview}>
                <AffairAvatar affair={this.props.affair} previewURL={currentImg} className={styles.logoWithoutSlogn} sideLength={56} withSlogan={false}/>
              </div>
              <div className={styles.logoPreview}>
                <AffairAvatar affair={this.props.affair.set('shortName', '子事务简称').set('level', 2)} previewURL={currentImg} sideLength={56}/>
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
    modifyAffairInfo: bindActionCreators(modifyAffairInfo, dispatch),
    fetchAffairList: bindActionCreators(fetchAffairList, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditLogoModal)
