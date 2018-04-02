import React from 'react'
import { Modal, message } from 'antd'
import styles from './AssetImageModal.scss'
import oss from 'oss'
import config from '../../config'

const AssetImageModal = React.createClass({
  getInitialState(){
    return {
      imgURL: '',
      file: null,
    }
  },
  handleOk(){
    oss.uploatMaterialFile(this.props.affair.get('id'), this.props.affair.get('roleId'), this.state.imgFile, this.props.warehouseId).then((res) => {
      fetch(config.api.material.modify(this.props.materialId), {
        method: 'POST',
        credentials: 'include',
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
        resourceId: this.props.materialId,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: `${res.host}/${res.path}`
        })
      }).then((res) => res.json()).then((json) => {
        if (json.code == 0){
          this.setState({
            imgURL: '',
            imgFile: null,
          })
          this.props.callback()
        }
      })
    })
  },
  handleCancel(){
    this.setState({
      imgURL: '',
      imgFile: null,
    })
    this.props.callback()
  },
  handleUpload(e){
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = () => {
      this.setState({
        imgURL: reader.result,
        imgFile: file,
      })
    }
    reader.onerror = () => {
      message.error('图片加载出错')
    }
    if (file){
      reader.readAsDataURL(file)
    }
  },
  render(){
    return (<Modal visible title="编辑图片" width={450} onOk={this.handleOk} onCancel={this.handleCancel} maskCloasable={false} wrapClassName={styles.assetImageModal}>
      <div className={styles.pic}>
        <div className={styles.hover} onClick={() => this.refs.uploader.click()}>
          <span>重新上传</span>
        </div>
        {
          this.state.imgURL || this.props.image
            ?
            this.state.imgURL
              ?
                <img src={this.state.imgURL} className={styles.img}/>
              :
                <img src={this.props.image} className={styles.img}/>
            :
                <div className={styles.img} style={{ backgroundColor: '#e9e9e9' }} />
        }
        <input type="file" onChange={this.handleUpload} className={styles.file} ref="uploader"
          accept={['image/jpg', 'image/jpeg', 'image/png', 'image/gif']} onClick={(e) => {
            e.target.value = null
          }}
        />
      </div>
    </Modal>)
  }
})

export default AssetImageModal
