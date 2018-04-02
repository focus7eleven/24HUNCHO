import React from 'react'
import { Modal, Progress, Switch, Button, message } from 'antd'
import styles from './UploadFilesModal.scss'
import config from '../../config'
import oss from 'oss'
import { Map } from 'immutable'
import { FILE_TYPE } from 'filetype'
import { PUBLIC_TYPE } from './FileListContainer'

const PropTypes = React.PropTypes
const UploadFilesModal = React.createClass({
  propTypes: {
    addFile: PropTypes.func.isRequired,
    uploaderId: PropTypes.number.isRequired,
    affairMemberId: PropTypes.number.isRequired,
    affairId: PropTypes.number.isRequired,
    roleId: PropTypes.number.isRequired,
    folderId: PropTypes.string.isRequired,
    fileId: PropTypes.number, // 新上传一个文件或为某个文件上传新的版本
    handleChangeFilesPublicType: PropTypes.func, //更改文件的保密性
    hasSecretPermission: PropTypes.bool.isRequired
  },

  getInitialState() {
    return {
      filesProgress: Map(),
      filesUploadXHR: Map(),
      files: Map()
    }
  },

  getDefaultProps() {
    return {
      fileId: null,
    }
  },

  //取消所有上传
  cancelUpload() {
    //setTimeout保证在窗口关闭前所有上传终止
    setTimeout(this.props.onCancel, 0)

    this.state.filesUploadXHR.forEach((xhr) => {
      xhr && xhr.abort()
    })
  },

  componentDidMount() {
    if (this.props.files) {
      this.uploadFiles(this.props)
    }
  },

  //文件列表改变，说明重新选择了文件，自动开始上传新文件
  componentWillReceiveProps(props) {
    if (this.props.files != props.files) {
      this.uploadFiles(props)
    }
  },

  //上传文件
  uploadFiles(props) {
    let len = props.files.length
    const { files, folderId, uploaderId, fileId, newFolderId, newFolderName, publicType, affairId, roleId } = props
    for (let i = 0; i < len; i++) {
      //开始上传
      oss.uploadAffairFile(files[i], affairId, roleId, fileId, (percent) => {
        this.setState({
          filesProgress: this.state.filesProgress.set(files[i].fileName || files[i].name, percent)
        })

        if (percent === 100) {
          this.setState({
            filesUploadXHR: this.state.filesUploadXHR.delete(files[i].fileName || files[i].name)
          })
        }
      }, (xhr) => {
        //abort upload
        this.setState({ filesUploadXHR: this.state.filesUploadXHR.set(files[i].fileName || files[i].name, xhr) })
      }).then((result) => {
        let url = result.path
        //url为null代表取消上传或上传失败
        if (!url) {
          this.setState({
            filesProgress: this.state.filesProgress.set(files[i].fileName || files[i].name, null),
            filesUploadXHR: this.state.filesUploadXHR.set(files[i].fileName || files[i].name, null)
          })
          return null
        }

        fetch(config.api.file.add(), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          affairId: this.props.affairId,
          roleId: this.props.roleId,
          body: JSON.stringify({
            'address': url,
            'fileName': files[i].fileName || files[i].name,
            'folderId': newFolderId || parseInt(folderId),
            'uploader': uploaderId,
            'size': files[i].size,
            'publicType': 0,
            'fileId': fileId,
          })
        }).then((res) => res.json()).then((res) => {
          if (res.code === 0) {
            //todo fetch response info
            const data = res.data
            if (fileId) {
              //历史版本
              this.props.onAddNewVersion && this.props.onAddNewVersion(data)
            } else {
              //上传文件或文件夹
              if (newFolderId) {
                //上传文件夹
                this.props.addFile(files[i], data, newFolderId, newFolderName)
              } else {
                this.props.addFile(files[i], data)
              }
            }

            this.setState({
              files: this.state.files.set(files[i].fileName || files[i].name, { type: newFolderId ? FILE_TYPE.FOLDER : FILE_TYPE.UNKNOWN, id: fileId || data.id, publicType: publicType })
            })
          } else {
            message.error('添加文件失败！')
          }
        })
      })
    }
  },

  renderPercent(percent, file) {
    const fileName = file.fileName || file.name
    if (percent === null) {
      return <div className="u-text-l-12" style={{ marginLeft: 10 }}>上传失败</div>
    }
    if (percent === undefined) {
      return <div className="u-text-l-12" style={{ marginLeft: 10 }}>排队中</div>
    }
    if (percent < 100) {
      return (
        <div className={styles.percentContainer}>
          <div className={styles.percent}>{percent + '%'}</div>
          <div className="u-link-12" onClick={() => {
            this.state.filesUploadXHR.get(fileName).abort()
            this.setState({
              filesUploadXHR: this.state.filesUploadXHR.delete(fileName)
            })
          }}
          >取消</div>
        </div>
      )
    } else {
      return this.props.hasSecretPermission ?
        <div className={styles.secretOption}>
          <span className="u-text-14">保密</span>
          <Switch checkedChildren="开"
            unCheckedChildren="关"
            defaultChecked={this.state.files.get(fileName, {}).publicType === PUBLIC_TYPE.SECRET ? true : false}
            onChange={(checked) => {this.props.handleChangeFilesPublicType([this.state.files.get(fileName)], checked ? PUBLIC_TYPE.SECRET : PUBLIC_TYPE.OPEN)}}
          />
        </div>
        :
        <div className={styles.complete}>已完成</div>
    }
  },

  render(){
    const { visible, files, onComplete } = this.props
    const canCloseModal = this.state.filesUploadXHR.every((xhr) => !xhr)
    let fileList = []
    for (let i = 0; files && i < files.length; i++) {
      const percent = this.state.filesProgress.get(files[i].fileName || files[i].name)
      fileList.push(
        <div className={styles.file} key={files[i].fileName || files[i].name}>
          <div className="u-text-14">{files[i].fileName || files[i].name}</div>
          <div className={styles.progress}>
            <Progress percent={percent} format={this.renderPercent} showInfo={false}/>
            {this.renderPercent(percent, files[i])}
          </div>
        </div>
      )
    }

    return (
      <Modal title="文件上传"
        visible={visible || false}
        onCancel={this.cancelUpload}
        width={500}
        wrapClassName={styles.uploadFilesModal}
        footer={<Button type="primary" onClick={onComplete} style={{ marginBottom: 20 }} disabled={!canCloseModal}>完成</Button>}
        maskClosable={false}
      >
        <div className={styles.fileList}>{fileList}</div>

        <div className="u-text-l-12" style={{ padding: '20px 40px' }}>
          <div>1.保密文件只对拥有“查看保密文件”权限的角色可见</div>
          <div>2.文件上传至系统中超过24小时将无法删除</div>
        </div>
      </Modal>
    )
  }
})

export default UploadFilesModal
