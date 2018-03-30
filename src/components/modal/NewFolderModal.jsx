import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { Modal, Button, Input, Icon } from 'antd'
import styles from './NewFolderModal.scss'
import { addNewFolder } from '../../actions/file'

class NewFolderModal extends React.Component {
  static propTypes = {
    affairId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    visible: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    affairId: '-1',
    visible: false,
    onClose: () => {},
    onSuccess: () => {}
  }

  state = {
    loading: false,
    folderName: '',
    isExisted: false,
  }

  handleCancel = () => {
    // this.setState({ folderName: '' })
    this.props.onClose()
  }

  handleNameCheck = (e) => {
    const name = e.target.value
    const { folderId, path } = this.props.match.params
    const foldersInCurrentDirectory = this.props.fileMap.getIn([path, 'folders'])
    const isExisted = foldersInCurrentDirectory && foldersInCurrentDirectory.findKey((v, k) => v.get('name') === name)
    this.setState({ folderName: name })
    if (isExisted >=0 ) {
      this.setState({ isExisted: true })
    } else {
      this.setState({ isExisted: false })
    }
  }

  handleCreateFolder = () => {
    const { isExisted, folderName } = this.state
    if (isExisted) {
      return
    } else {
      this.setState({ isLoading: true })
      const { id, folderId, path } = this.props.match.params
      const { roleId } = this.props
      this.props.addNewFolder(id, roleId, folderId, folderName, path).then(res => {
        this.setState({ isLoading: false })
        let newFolder = _.extend({}, res)
        newFolder['folderId'] = newFolder.id
        delete newFolder['id']
        if (res) {
          this.props.onSuccess(path, newFolder)
          this.setState({
            loading: false,
            folderName: '',
            isExisted: false,
          })
        }
      })
    }

  }

  render() {
    const { visible } = this.props
    const { loading, folderName, isExisted } = this.state
    return (
      <Modal
        visible={visible}
        title="新建文件夹"
        onOk={this.handleCreateFolder}
        onCancel={this.handleCancel}
        footer={[
          <Button key="back" size="large" onClick={this.handleCancel}>取消</Button>,
          <Button key="submit" type="primary" size="large" loading={loading} onClick={this.handleCreateFolder} disabled={isExisted}>完成</Button>,
        ]}
      >
        <div className={styles.line}>
          <span>文件夹名称：</span>
          <Input
            className={styles.input}
            value={folderName}
            onChange={this.handleNameCheck}
            onPressEnter={this.handleCreateFolder}
          />
          {
            isExisted &&
            <div className={styles.error}>
              <Icon type="info-circle" />
              <span className={styles.isExisted}>文件名已存在</span>
            </div>
          }
        </div>
      </Modal>
    )
  }
}

function mapStateToProps(state) {
	return {
    roleId: state.getIn(['user', 'role', 'roleId']),
		fileMap: state.getIn(['file', 'fileMap']),
	}
}

function mapDispatchToProps(dispatch) {
	return {
		addNewFolder: bindActionCreators(addNewFolder, dispatch),
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NewFolderModal))
