import React from 'react'
import { Modal, Button, Icon, Input, message } from 'antd'
import styles from './RenameModal.scss'
import filesize from 'filesize'
import { FILE_TYPE } from 'filetype'
import _ from 'underscore'
import { DUP_CODE } from './FileListContainer'

const PropTypes = React.PropTypes

//用于移动或上传时有同名情况处理
const getTypeTitle = (type) => {
  switch (type) {
    case 'upload' :
      return '上传'
    case 'move' :
      return '移动'
    case 'restore' :
      return '还原'
    default:
      return '类型错误'
  }
}

const RenameModal = React.createClass({
  propTypes: {
    type: PropTypes.string,
    file: PropTypes.object,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
    affairMemberId: PropTypes.number,
  },

  getDefaultProps() {
    return {
      type: 'upload',
      file: {},
      onOk: () => {},
      onCancel: () => {}
    }
  },

  getInitialState() {
    const { file } = this.props

    return {
      loading: false,
      newName: file ? file.name : '',
      nameValid: true
    }
  },

  onOk() {
    const { newName } = this.state
    let { file, type, onOk } = this.props

    if (newName === file.name) {
      this.setState({
        nameValid: false
      })
      return
    }

    this.setState({
      loading: true
    })

    let newFile = _.extend({}, file)
    newFile.name = newName
    if (type === 'move' || type === 'restore' || type === 'upload') {
      onOk(newFile).then((code) => {
        if (code == DUP_CODE) {
          message.error(`该名称与已有${file.type === FILE_TYPE.FOLDER ? '文件夹' : '文件'}名冲突，请重新修改！`)
        }

        if (code !== 0) {
          this.setState({
            loading: false
          })
        }
      })
    }
  },

  onCancel() {
    this.props.onCancel(this.props.file)
  },

  handleNameChange(e) {
    const name = e.target.value

    this.setState({
      newName: name
    })

    if (name === this.props.file.name) {
      this.setState({
        nameValid: false
      })
    } else {
      this.setState({
        nameValid: true
      })
    }
  },

  render() {
    const { type, file } = this.props
    const { loading, newName, nameValid } = this.state
    const typeTitle = getTypeTitle(type)
    const fileName = file ? file.name : ''
    const fileSize = file ? file.size : 0
    const dupSize = file ? file.dupSize : 0

    return (
      <Modal title={`重命名${typeTitle}`}
        visible={!!file}
        onCancel={this.onCancel}
        width={500}
        wrapClassName={styles.renameModal}
        footer={[
          <div key="move-foot" >
            <Button type="ghost" key="cancel" onClick={this.onCancel}>{`取消${typeTitle}`}</Button>
            <Button type = "primary" key="ok" onClick={this.onOk} loading={loading} disabled={!nameValid}>{`确定${typeTitle}`}</Button>
          </div>]}
      >
        {file.type === FILE_TYPE.FOLDER ?
          <div>
            <Icon type="info-circle"/>
            检测到正在{typeTitle}的文件夹 <span className={styles.bold}>“{fileName}”</span> 与原文件夹 <span className={styles.bold}>“{fileName}”</span> 命名相同无法继续{typeTitle}，是否重命名{typeTitle}？
          </div>
            :
          <div>
            <Icon type="info-circle"/>
            检测到正在{typeTitle}的文件 <span className={styles.bold}>“{fileName}”</span>（{filesize(fileSize, { round: 1 })}）与原文件 <span className={styles.bold}>“{fileName}”</span>（{filesize(dupSize, { round: 1 })}）命名相同无法继续{typeTitle}，是否重命名{typeTitle}？
          </div>
        }
        <div className={styles.inputContainer}>
          <div>{file.type === FILE_TYPE.FOLDER ? '文件夹' : '文件'}名称：</div>
          <Input style={{ width: file.type === FILE_TYPE.FOLDER ? 280 : 300, fontSize: 14 }} value={newName} onChange={this.handleNameChange}/>
        </div>
        {nameValid ? null : <div className={styles.error}>请重命名后再{typeTitle}！</div>}
      </Modal>
    )
  }
})

export default RenameModal
