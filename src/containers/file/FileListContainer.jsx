import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { Popconfirm, Input, Button, Table, Dropdown, Menu, Icon, Modal, Switch, message } from 'antd'
import { SearchIcon, SprigDownIcon, DeleteIcon } from 'svg'
import { Map, Set, List, fromJS } from 'immutable'
import { FILE_TYPE, getFileTypeIcon, getFileType } from 'filetype'
import oss from 'oss'
import filesize from 'filesize'
import imageNoFile from 'images/img_no_file.png'
import imageNoPermission from 'images/img_no_permissions.png'
import _ from 'underscore'
import moment from 'moment'
import { USER_ROLE_TYPE } from 'member-role-type'
import styles from './FileListContainer.scss'
import { addNewFolder, getFileList, getAllChildrenList, searchFile, deleteFolder, deleteFile, getNavigationInfo } from '../../actions/file'
import { deleteAttachmentByPath } from '../../actions/activity'
import NewFolderModal from '../../components/modal/NewFolderModal'
import UploadFilesModal from '../../components/modal/UploadFilesModal'
import FilePreviewModal from '../../components/modal/FilePreviewModal'

const Search = Input.Search;

const NEW_FOLDER_MODAL = 'NEW_FOLDER_MODAL'
const UPLOAD_FILE_MODAL = 'UPLOAD_FILE_MODAL'
const FILE_PREVIEW_MODAL = 'FILE_PREVIEW_MODAL'
const DOWNLOAD_BATCH_MODAL = 'DOWNLOAD_BATCH_MODAL'

const MAX_FILE_COUNT = 300

class FileListContainer extends React.Component {
  state = {
    isLoading: true,
    // modal state
    NEW_FOLDER_MODAL_STATE: false,
    UPLOAD_FILE_MODAL_STATE: false,
    FILE_PREVIEW_MODAL_STATE: false,
    DOWNLOAD_BATCH_MODAL_STATE: false,
    fileList: [],
    readyToUploadFiles: [],
    readyToPreviewFile: {},
    readyToDownloadFiles: [],
    // target folder to upload files into
    targetFolderId: '-1',
    fileMap: Map(),
    isUploadFolder: false,

  }

  componentWillMount() {
    const { affairId, folderId, path, roleId } = this.props
    if (roleId !== -2) {
      this.props.getNavigationInfo(folderId, affairId, roleId)
      // console.log(this.props);
      // this.props.getFileList(folderId, path, id, roleId).then(res => {
        // this.handleFormatTableData(this.props.fileMap, path)
      // })
    }
  }

  componentWillReceiveProps(nextProps) {
    const { affairId, folderId, path, roleId } = nextProps
    if (this.props.folderId !== folderId || this.props.roleId !== roleId) {
      this.props.getNavigationInfo(folderId, affairId, roleId)
    }

    // if (fileMap.has(path) && affairId === this.props.affairId) {
    //   this.handleFormatTableData(fileMap, path)
    //   return
    // }

    if (roleId !== -2) {
    // if (roleId !== -2 && !fileMap.get(path) ) {
      this.setState({ isLoading: true })
      this.props.getFileList(folderId, path, affairId, roleId).then(res => {
        const folders = res.folders || []
        const files = res.files || []
        folders.sort((a, b) => b.modifyTime > a.modifyTime)
        files.sort((a, b) => b.modifyTime > a.modifyTime)
        let fileMap = Map()
        fileMap = fileMap.set(path, fromJS({folderId, folders, files}))
        this.handleFormatTableData(fileMap, path)
      })
    }
  }

  componentDidMount() {
    // init directory uploader
    let input = this.refs.directoryUploader
    input.setAttribute('directory', 'true')
    input.setAttribute('webkitdirectory', 'true')
    input.setAttribute('mozdirectory', 'true')
    input.setAttribute('msdirectory', 'true')
    input.setAttribute('odirectory', 'true')

    this.handleSearchFileDebounce = _.debounce((keyword) => {
      const { path, folderId, affairId, roleId } = this.props
      this.setState({ isLoading: true })
      if (keyword) {
        // keyword, path, folderId, affairId, roleId
        this.props.searchFile(keyword, path, folderId, affairId, roleId).then(res => {
          this.setState({ isLoading: false })
          const folders = res.folders || []
          const files = res.files || []
          folders.sort((a, b) => b.modifyTime > a.modifyTime)
          files.sort((a, b) => b.modifyTime > a.modifyTime)
          const fileMap = Map().set(path, fromJS({ folderId, folders, files}))
          this.handleFormatTableData(fileMap, path)
        })
      } else {
        this.props.getFileList(folderId, path, affairId, roleId).then(res => {
          const folders = res.folders || []
          const files = res.files || []
          folders.sort((a, b) => b.modifyTime > a.modifyTime)
          files.sort((a, b) => b.modifyTime > a.modifyTime)
          const fileMap = Map().set(path, fromJS({ folderId, folders, files}))
          this.handleFormatTableData(fileMap, path)
        })
      }
    }, 200)
  }

  handleFormatTableData = (fileMap, path) => {
    const folders = fileMap.getIn([path, 'folders'])
    const files = fileMap.getIn([path, 'files'])
    const fileList = folders.map(f => f.set('type', FILE_TYPE.FOLDER).set('id', f.get('folderId')))
                    .concat(files.map(f => f.set('type', getFileType(f.get('name'))))).toJS()
    this.setState({ fileList, fileMap, isLoading: false })
  }

  handleSearchFile = (e) => {
    const keyword = e.target.value
    this.handleSearchFileDebounce(keyword)
  }

  handleUploadBtnClick = (e) => {
    switch (e.key) {
      case 'folder':
        this.refs.directoryUploader.click()
        break;
      case 'file':
        this.refs.fileUploader.click()
        break;
      default:
        // this.handleModalControl(true, NEW_FOLDER_MODAL)
    }
  }

  handleUploadFiles = (rawFiles) => {
    if (rawFiles.length > MAX_FILE_COUNT) {
      message.error(`上传文件个数超过${MAX_FILE_COUNT}个，请分开上传！`)
      return
    }

    const { affairId, folderId, path, roleId } = this.props
    const { fileMap } = this.state

    const inputFiles = []
    for (let i = 0; i < rawFiles.length; i++) {
      inputFiles.push(rawFiles[i])
    }

    // 判断是否是文件夹上传
    if (inputFiles[0].webkitRelativePath) {
      // 新建文件夹，新建完成后拿到新的 folderId ，将文件夹内的文件上传到该 folderId 下。
      let newFolderName = inputFiles[0].webkitRelativePath.split('/')[0]
      // 判断文件夹重名
      let nth = 0
      const regex = new RegExp('\^' + newFolderName + '\\(?([0-9]*)\\)?\$')
      fileMap.getIn([path, 'folders']).forEach(v => {
        const regexRes = regex.exec(v.get('name'))
        if (regexRes && +regexRes[1] >= nth) {
          nth = (+regexRes[1]) + 1
        }
      })
      if (nth) {
        newFolderName = newFolderName + "(" + nth + ")"
      }
      this.props.addNewFolder(affairId, roleId, folderId, newFolderName, path).then(res => {
        let newFolder = _.extend({}, res)
        newFolder['folderId'] = newFolder.id
        delete newFolder['id']
        const newFileMap = this.state.fileMap.updateIn([path, 'folders'], v => v.insert(0, fromJS(newFolder)))
        this.handleFormatTableData(newFileMap, path)
        // this.setState({ isUploadFolder: true })
        this.handleReadyToUploadFiles(inputFiles, '' + res.id, true)
      })
    } else {
      // this.setState({ isUploadFolder: false })
      this.handleReadyToUploadFiles(inputFiles, folderId, false)
    }
  }

  handleReadyToUploadFiles = (inputFiles, targetFolderId, isUploadFolder) => {
    const { path } = this.props
    // 检查重名
    inputFiles.forEach(f => {
      let nth = 0
      let newFile = f.name.split('.')
      // 文件名中含有多个 . 的情况
      if (newFile.length > 2) {
        newFile[0] = newFile.slice(0, -1).join('.')
        newFile[1] = newFile[newFile.length - 1]
      }
      this.state.fileMap.getIn([path, 'files']).forEach(v => {
        const existFile = v.get('name').split('.')
        let existFileName = escape(existFile[0])
        if (existFile.length > 2) {
          existFileName = existFile.slice(0, -1).join('.')
        }
        const regex = new RegExp('\^' + escape(newFile[0]) + '(%28)?([0-9]*)(%29)?\$')
        const regexRes = regex.exec(existFileName)
        if (regexRes && +regexRes[2] >= nth) {
          nth = (+regexRes[2]) + 1
        }
      })
      if (nth) {
        f.fileName = newFile[0] + "(" + nth + ")." + newFile[1]
      }
    })
    this.setState({
      readyToUploadFiles: inputFiles,
      targetFolderId,
      UPLOAD_FILE_MODAL_STATE: true,
      isUploadFolder,
    })
  }

  handleModalControl = (state, modalName) => {
    let modalState = {}
    modalState[modalName + '_STATE']= state
    this.setState(modalState)
  }

  handleNewFolderSuccess = (path, newFolder) => {
    const newFileMap = this.state.fileMap.updateIn([path, 'folders'], v => v.insert(0, fromJS(newFolder)))
    this.handleFormatTableData(newFileMap, path)
    this.handleModalControl(false, NEW_FOLDER_MODAL)
  }

  handleNewFileSuccess = (path, newFile) => {
    if (!this.state.isUploadFolder) {
      const newFileList = fromJS(newFile)
      const newFileMap = this.state.fileMap.updateIn([path, 'files'], v => newFileList.concat(v))
      this.handleFormatTableData(newFileMap, path)
    }
    this.handleModalControl(false, UPLOAD_FILE_MODAL)
  }


  handleDownloadFile = (file) => {
    if (file.folderId) {
      // 下载文件夹
      this.props.getAllChildrenList(this.props.affairId, this.props.roleId, file.folderId).then(res => {
        if (res) {
          this.setState({
            readyToDownloadFiles: res
          })
          const files = res
          let paths = []
          let routes = []
          for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const path = file.address ? file.address : file.attachmentUrl
            paths.push(path)
            if (file.route) {
              routes.push(file.route)
            }

          }
          const formData = new FormData()
          formData.append('paths', paths)
          formData.append('routes', routes)
          oss.getBatchDownloadToken(this.props.affairId, this.props.roleId, formData).then(url => {
            // 下载文件夹
            let link = document.createElement('a')
            if (typeof link.download === 'string') {
              document.body.appendChild(link)
              link.download = ''
              link.href = url
              link.click()
              document.body.removeChild(link)
            } else {
              location.replace(url)
            }
          })
        }
      })

    } else {
      // 下载文件
      oss.getFileToken(this.props.affairId, this.props.roleId, file.id, file.name).then((url) => {
        let link = document.createElement('a')
        if (typeof link.download === 'string') {
          document.body.appendChild(link) // Firefox requires the link to be in the body
          link.download = file.name
          link.href = url
          console.log(url);
          link.click()
          document.body.removeChild(link) // remove the link when done
        } else {
          location.replace(url)
        }
      })
    }

  }


  handleDeleteFile = ([file]) => {
    const { affairId, path, roleId } = this.props

    if (file.type === FILE_TYPE.FOLDER) {
      this.props.deleteFolder(affairId, roleId, path, file.folderId).then(res => {
        if (res) {
          const newFileMap = this.state.fileMap.updateIn([path, 'folders'], v => v.filter(w => w.get('folderId') !== file.folderId))
          this.handleFormatTableData(newFileMap, path)
        }
      })
    } else {
      this.props.deleteFile(affairId, roleId, path, file.id).then(res => {
        if (res) {
          const newFileMap = this.state.fileMap.updateIn([path, 'files'], v=> v.filter(w => w.get('id') !== file.id))
          this.handleFormatTableData(newFileMap, path)
          this.props.deleteActivityFile(affairId, roleId, file.address)
        }
      })
    }
  }

  handleClickFileName = (record) => {
    const { affairId, path, roleId } = this.props
    if (!record.folderId) {
      this.setState({ readyToPreviewFile: record, FILE_PREVIEW_MODAL_STATE: true })
    } else {
      const newPath = (path === '%2F' ? path : path + '%2F') + record.name
      // this.props.getFileList(record.folderId, newPath, id, roleId)
      this.props.history.push(`/index/course/${affairId}/file/${record.folderId}/path=${newPath}`)
    }
  }

  handleNavigate = (folderId) => {
    const { affairId, path } = this.props
    let newPath = '%2F'
    if (folderId !== 0) {
      const idx = this.props.navigationInfo.findIndex(n => n.get('id') === folderId)
      newPath = this.props.navigationInfo.slice(0, idx + 1).map(n => n.get('name')).join('%2F')
    }
    if (newPath !== path) {
      this.props.history.push(`/index/course/${affairId}/file/${folderId}/path=${newPath}`)
    }
  }

  renderHeader() {
    const menu = (
      <Menu onClick={this.handleUploadBtnClick}>
        <Menu.Item key="file">上传文件</Menu.Item>
        <Menu.Item key="folder">上传文件夹</Menu.Item>
      </Menu>
    )

    return (
      <div className={styles.header}>
        <Search
          style={{ width: 166, height: 28}}
          placeholder="请输入关键字"
          // onSearch={this.handleSearchFile}
          onChange={this.handleSearchFile}
        />
        <div>
          <Button size="large" onClick={this.handleModalControl.bind(this, true, NEW_FOLDER_MODAL)} type="ghost" >新建文件夹</Button>
          <Dropdown overlay={menu}>
            <Button size="large" type="primary" style={{ marginLeft: 10 }}>
              上传 <Icon type="down" />
            </Button>
          </Dropdown>
        </div>
        <input
          style={{display: 'none'}}
          title="点击选择文件"
          multiple
          accept="*/*"
          type="file"
          name="html5uploader"
          ref="fileUploader"
          onChange={() => this.handleUploadFiles(this.refs.fileUploader.files)}
          onClick={(e) => e.target.value = null}
        />
        <input
          style={{ display: 'none' }}
          title="点击选择文件夹"
          multiple
          accept="*/*"
          type="file"
          name="html5uploader"
          ref="directoryUploader"
          onChange={() => this.handleUploadFiles(this.refs.directoryUploader.files)}
          onClick={(e) => e.target.value = null}
        />
      </div>
    )
  }

  renderNavigation() {
    return (
      <div className={styles.navigtion}>
        {
          this.props.navigationInfo.map((n, index) => [
            <span key={n.get('id')} onClick={this.handleNavigate.bind(this, n.get('id'))}>{n.get('name') || '全部文件'}</span>,
            index === this.props.navigationInfo.size - 1 ? null: <span key={n.get('id') + 'slash'} style={{color: 'black'}}>/</span>
          ])
        }
      </div>
    )
  }

  renderContent() {
    const { isLoading, fileList } = this.state
    const { roleType } = this.props
    const columns = [{
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      className: styles.fileName,
      render: (text, record) => {
        return (
          <div>
            <span>{getFileTypeIcon(record.type)}</span>
            <span className="name" onClick={this.handleClickFileName.bind(this, record)}>{text}</span>
          </div>
        )
      },
      sorter: (a, b) => Math.min(a.type, 1) === Math.min(b.type, 1) ? a.name.localeCompare(b.name) : a.type - b.type
    }, {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (text, record) => record.folderId ? '-' : filesize(text, { round: 1 }),
      sorter: (a, b) => Math.min(a.type, 1) === Math.min(b.type, 1) ? (a.type === FILE_TYPE.FOLDER ? b.modifyTime - a.modifyTime : a.size - b.size) : a.type - b.type
    }, {
      title: '作者',
      dataIndex: 'userId',
      key: 'userId',
      render: (text, record) => {
        return `${record.roleTitle}-${record.username}`
      }
    }, {
      title: '上传时间',
      dataIndex: 'modifyTime',
      key: 'modifyTime',
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => Math.min(a.type, 1) === Math.min(b.type, 1) ? (a.modifyTime - b.modifyTime) : a.type - b.type
    }, {
      title: '操作',
      dataIndex: 'operation',
      className: styles.operations,
      render: (text, record) => {
        return roleType == USER_ROLE_TYPE.STUDENT ?
          <span key="download" onClick={this.handleDownloadFile.bind(this, record)}><SprigDownIcon /></span>
          :
          [
            <span key="download" onClick={this.handleDownloadFile.bind(this, record)}><SprigDownIcon /></span>,
            <Popconfirm key="delete" title="确认删除？" onConfirm={this.handleDeleteFile.bind(this, [record])} okText="确认" cancelText="取消">
              <span ><DeleteIcon /></span>
            </Popconfirm>
          ]
      }
    }]

    return (
      <div className={styles.content}>
        <Table loading={isLoading} rowKey={record => record.id} columns={columns} dataSource={fileList} />
      </div>
    )
  }

  render() {
    const { fileMap, NEW_FOLDER_MODAL_STATE, UPLOAD_FILE_MODAL_STATE, FILE_PREVIEW_MODAL_STATE, DOWNLOAD_BATCH_MODAL_STATE, readyToPreviewFile, readyToUploadFiles, readyToDownloadFiles, targetFolderId } = this.state
    const { affairId, folderId, path } = this.props

    return (
      <div className={styles.container}>
        { this.renderHeader() }
        { this.renderNavigation() }
        { this.renderContent() }
        <NewFolderModal
          visible={NEW_FOLDER_MODAL_STATE}
          affairId={affairId}
          onSuccess={this.handleNewFolderSuccess}
          onClose={this.handleModalControl.bind(this, false, NEW_FOLDER_MODAL)}
        />
        <UploadFilesModal
          visible={UPLOAD_FILE_MODAL_STATE}
          files={readyToUploadFiles}
          affairId={affairId}
          folderId={targetFolderId}
          onSuccess={this.handleNewFileSuccess}
          onClose={this.handleModalControl.bind(this, false, UPLOAD_FILE_MODAL)}
        />
        <FilePreviewModal
          visible={FILE_PREVIEW_MODAL_STATE}
          file={readyToPreviewFile}
          affairId={affairId}
          onClose={this.handleModalControl.bind(this, false, FILE_PREVIEW_MODAL)}
        />


      </div>
    )
  }
}

function mapStateToProps(state, props) {
	return {
    roleType: state.getIn(['user', 'role', 'roleType']),
		roleId: state.getIn(['user', 'role', 'roleId']),
		// fileMap: state.getIn(['file', 'fileMap']),
		navigationInfo: state.getIn(['file', 'navigationInfo']),
    affairId: props.match.params.groupId || props.match.params.id,
    groupId: props.match.params.groupId,
    folderId: props.match.params.folderId,
    path: props.match.params.path,
	}
}

function mapDispatchToProps(dispatch) {
	return {
		getFileList: bindActionCreators(getFileList, dispatch),
    getAllChildrenList: bindActionCreators(getAllChildrenList, dispatch),
		searchFile: bindActionCreators(searchFile, dispatch),
		addNewFolder: bindActionCreators(addNewFolder, dispatch),
		deleteFolder: bindActionCreators(deleteFolder, dispatch),
		deleteFile: bindActionCreators(deleteFile, dispatch),
    deleteActivityFile: bindActionCreators(deleteAttachmentByPath, dispatch),
		getNavigationInfo: bindActionCreators(getNavigationInfo, dispatch),
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(FileListContainer))
