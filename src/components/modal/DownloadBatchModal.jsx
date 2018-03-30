import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Modal, Button, Input } from 'antd'
import styles from './DownloadBatchModal.scss'
import oss from 'oss'

class DownloadBatchModal extends React.Component {
  state={
    loading: false,
  }

  handleOk = () => {
    const { affairId, roleId, files } = this.props
    const fileName = this.nameInput.refs.input.value
    let paths = ''
    let routes = ''
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const path = file.address ? file.address : file.attachmentUrl
      if (i == 0) {
        paths += path
        if (file.route) {
          routes += file.route
        }
      } else {
        paths += ',' + path
        if (file.route) {
          routes += ',' + file.route
        }
      }

    }
    routes = routes ? routes : null
    oss.getBatchDownloadToken(affairId, roleId, paths, fileName, routes).then(url => {
      // 下载文件
      let link = document.createElement('a')
      if (typeof link.download === 'string') {
        document.body.appendChild(link)
        link.download = fileName
        link.href = url
        link.click()
        document.body.removeChild(link)
      } else {
        location.replace(url)
      }
    })
    this.props.onClose()
  }

  handleCancel = () => {
    this.props.onClose()
  }

  render() {
    const { loading } = this.state
    const { visible } = this.props
    return (
      <Modal
        title="批量下载"
        wrapClassName={styles.simpleModal}
        visible={visible}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
        footer={[
          <Button key="back" size="large" onClick={this.handleCancel}>取消</Button>,
          <Button key="submit" type="primary" size="large" loading={loading} onClick={this.handleOk}>完成</Button>,
        ]}
        >
          <div className={styles.line}>
            <span>下载为：</span>
            <Input
              className={styles.input}
              ref={(el) => this.nameInput=el}
              onPressEnter={this.handleOk}
            />
          </div>

      </Modal>
    )
  }
}

function mapStateToProps(state) {
  return {
    roleId: state.getIn(['user', 'role', 'roleId'])
  }
}

export default connect(mapStateToProps)(DownloadBatchModal)
