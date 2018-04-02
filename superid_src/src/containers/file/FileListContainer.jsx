import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Input, Button, Table, Dropdown, Menu, Modal, Switch, message } from 'antd'
import { SearchIcon, SprigDownIcon, MoreIcon, ArrowDropDown } from 'svg'
import { Map, Set, List } from 'immutable'
import _ from 'underscore'
import moment from 'moment'
import filesize from 'filesize'
import { FILE_TYPE, getFileTypeIcon, getFileType } from 'filetype'
import config from '../../config'
import styles from './FileListContainer.scss'
import FilePreview from './FilePreview'
import MoveFileModal from './FoldersModal'
import UploadFilesModal from './UploadFilesModal'
import RenameModal from './RenameModal'
import oss from 'oss'
import imageNoFile from 'images/img_no_file.png'
import imageNoPermission from 'images/img_no_permissions.png'
import PERMISSION from 'utils/permission'

import { pushURL } from 'actions/route'

const MenuItem = Menu.Item

const HISTORY = 'history', RECORD = 'record'
export const DUP_CODE = 4002
export const FOLDER_NOT_EXIST_CODE = 4000
export const PUBLIC_TYPE = {
  OPEN: 0,
  SECRET: 3
}
const ROOT_FOLDER = 0
const MAX_FILE_COUNT = 300

const DirectoryInput = React.createClass({
  componentDidMount() {
    let input = this.refs.directoryUploader
    input.setAttribute('directory', 'true')
    input.setAttribute('webkitdirectory', 'true')
    input.setAttribute('mozdirectory', 'true')
    input.setAttribute('msdirectory', 'true')
    input.setAttribute('odirectory', 'true')
  },

  handleClick() {
    this.refs.directoryUploader.click()
  },

  render() {
    return (
      <input title="点击选择文件夹" multiple accept="*/*" type="file" name="html5uploader" ref="directoryUploader" style={{ display: 'none' }} onChange={() => this.props.handleUploadFiles(this.refs.directoryUploader.files)}
        onClick={(e) => e.target.value = null}
      />
    )
  }
})

export const buildFileCheckObject = (file) => {
  let checkObject = {}

  if (file.id) {
    checkObject.id = file.id
  }
  checkObject.size = file.size
  checkObject.name = file.fileName || file.name
  checkObject.type = file.type

  return checkObject
}

const FileListContainer = React.createClass({

  getInitialState() {
    return {
      fileMap: Map(),
      navigationInfo: List(),
      loading: false, // 目录内容是否正在加载
      selectedItems: Set(), // 被选中的文件
      dataSourceSorter: this.getDataSourceSorter({ columnKey: 'modifyTime', order: 'descend' }), // 表格数据排序
      previewFile: null, //预览的文件
      versions: [], // 预览文件的历史版本
      logs: [],
      previewModalShow: false, //预览文件modal
      previewTab: HISTORY, //预览右侧菜单，默认为历史版本
      currentPreviewVersion: 1,
      createFolderModalShow: false, //新建文件夹modal
      folderName: '', //创建的文件夹名称
      folderPublicType: PUBLIC_TYPE.OPEN, //创建的文件夹可见性，默认为公开,
      folderModalLoading: false, //创建文件夹按钮加载
      folderNameInvalid: false, //创建文件夹的合法性（目前检测是否是同名文件夹）
      moveFiles: [], //需要移动的文件列表
      newFolderId: null, //上传文件夹时的文件夹id
      newFolderName: null, //上传文件夹时的文件夹名称
      searchResult: null, // 搜索返回的文件列表
      moveFileModalShow: false, //移动文件modal
      renameFile: null, //需要重命名的文件
      renameType: null, //重命名文件后需要操作的类型（上传、移动、还原）,
      renameOk: null, //重命名文件后的确定操作,
      renameCancel: null, //重命名文件时取消操作,
    }
  },

  componentDidMount() {
    const { routeParams, affair } = this.props
    this.fetchFileList(routeParams.folderId, routeParams.path)
    this.fetchNavigationInfo(affair.get('id'), affair.get('roleId'), routeParams.folderId)

    this.handlePhraseChange = _.debounce((text) => {
      if (text) {
        fetch(config.api.file.search(text), {
          affairId: affair.get('id'),
          roleId: affair.get('roleId'),
          method: 'GET',
          credentials: 'include',
        }).then((res) => res.json()).then((res) => {
          if (res.code === 0) {
            const data = res.data
            const files = (data.files || []).map((file) => {
              file.type = getFileType(file.name)
              file.fileName = file.name
              return file
            }).concat((data.folders || []).map((folder) => {
              folder.type = FILE_TYPE.FOLDER
              folder.fileName = folder.name
              folder.id = folder.folderId
              return folder
            }))

            this.setState({
              searchResult: List(files),
            })
          }
        })
      } else {
        this.setState({
          searchResult: null,
        })
      }
    }, 200)
  },

  //更换事务时重置state并且重新获得文件列表, 而只更换路径时重置selectedItems
  componentDidUpdate(preProps) {
    if (this.props.affair.get('id') != preProps.affair.get('id')) {
      this.setState(this.getInitialState())
      setTimeout(() => {
        this.fetchFileList(this.props.routeParams.folderId, this.props.routeParams.path)
        this.fetchNavigationInfo(this.props.affair.get('id'), this.props.affair.get('roleId'), this.props.routeParams.folderId)
      }, 0)
      return
    }

    if (this.props.routeParams.path != preProps.routeParams.path) {
      this.setState({
        selectedItems: Set(),
      })
      this.fetchFileList(this.props.routeParams.folderId, this.props.routeParams.path)
      this.fetchNavigationInfo(this.props.affair.get('id'), this.props.affair.get('roleId'), this.props.routeParams.folderId)
    }
  },

  getDataSourceSorter(sorter = { columnKey: 'modifyTime', order: 'descend' }) {
    switch (sorter.columnKey) {
      case 'fileName':
        return (a, b) => Math.min(a.type, 1) === Math.min(b.type, 1) ? (sorter.order === 'ascend' ? a.fileName.localeCompare(b.fileName) : b.fileName.localeCompare(a.fileName)) : a.type - b.type
      case 'size':
        //文件夹在前，如果同是文件夹按时间排序，如果同是其他类型则按大小排序
        return (a, b) => Math.min(a.type, 1) === Math.min(b.type, 1) ?
          (sorter.order === 'ascend' ? (a.type === FILE_TYPE.FOLDER ? b.modifyTime - a.modifyTime : a.size - b.size) : (a.type === FILE_TYPE.FOLDER ? b.modifyTime - a.modifyTime : b.size - a.size))
          :
          a.type - b.type
      case 'roleTitle':
        return (a, b) => Math.max(a.type, 1) === Math.max(b.type, 1) ? (sorter.order === 'ascend' ? a.roleTitle.localeCompare(b.roleTitle) : b.roleTitle.localeCompare(a.roleTitle)) : a.type - b.type
      case 'modifyTime':
        return (a, b) => Math.min(a.type, 1) === Math.min(b.type, 1) ? (sorter.order === 'descend' ? b.modifyTime - a.modifyTime : a.modifyTime - b.modifyTime) : a.type - b.type
      default:
        //默认按时间顺序排列（倒序），文件夹排在前
        return (a, b) => Math.min(a.type, 1) === Math.min(b.type, 1) ? (b.modifyTime - a.modifyTime) : a.type - b.type
    }
  },

  //获取文件夹内文件列表（包括子文件夹）
  fetchFileList(folderId, path) {
    const { affair } = this.props

    this.setState({ loading: true })

    fetch(config.api.file.fileList.get(folderId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const data = res.data
        let files = data.files.map((file) => {
          file.type = getFileType(file.name)
          file.fileName = file.name
          return file
        }).concat(data.folders.map((folder) => {
          folder.type = FILE_TYPE.FOLDER
          folder.fileName = folder.name
          folder.id = folder.folderId
          return folder
        }))
        this.setState({
          fileMap: this.state.fileMap.set(path, Map({
            folderId: parseInt(folderId),
            publicType: data.publicType,
            files: List(files).sort(this.getDataSourceSorter()),
          }))
        })
      }
      else {
        message.error('获取文件列表失败！')
      }
      this.setState({ loading: false })
    })

  },

  //获取面包屑导航信息
  fetchNavigationInfo(affairId, roleId, folderId) {
    fetch(config.api.file.navigationInfo(folderId), {
      method: 'GET',
      credentials: 'include',
      affairId,
      roleId,
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        if (!res.data) {
          //为根目录
          return
        } else {
          const data = res.data//array
          const paths = this.props.routeParams.path.split('/')
          for (let i = 1; i < paths.length; i++) {
            if (paths[i] != (data[i - 1].name || null) || (paths.length != data.length + 1)) {
              //地址有错！
              this.navigate('/', ROOT_FOLDER)
              return
            }
          }
          this.setState({
            navigationInfo: List(data)
          })
        }
      }
    })
  },

  // 取该文件的所有历史版本列表
  fetchLogs(file) {
    fetch(config.api.file.logs.get(file.id), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.setState({
          logs: res.data,
        })
      }
    })
  },

  // Handlers
  toggleSelectTableItem(record) {
    const {
      selectedItems
    } = this.state

    // Toggle select table items
    this.setState({
      selectedItems: !selectedItems.find((v) => v.id == record.id) ? selectedItems.add(record) : selectedItems.filter((v) => v.id != record.id)
    })
  },

  //导航文件夹
  navigate(path, folderId = null) {
    const { params } = this.props
    this.props.pushURL(`/workspace/affair/${params.id}/file/${folderId === null ? params.folderId : folderId}/path=` + encodeURIComponent(path))
  },

  //检查重名
  handleCheckName(folderId, files) {
    //判断是否重名
    return fetch(config.api.file.checkName, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      body: JSON.stringify({
        folderId: folderId,
        files: files.map((file) => buildFileCheckObject(file))
      })
    }).then((res) => res.json()).then((res) => {
      if (res.data.files.some((file) => !!file.dup)) {
        return {
          code: DUP_CODE,
          needRenameFiles: res.data.files.filter((file) => !!file.dup)
        }
      } else {
        return {
          code: 0,
          needRenameFiles: []
        }
      }
    })
  },

  //上传一个文件夹
  handleUploadNewFolder(files, folderName) {
    this.handleCreateFolder(folderName, PUBLIC_TYPE.OPEN).then((folderId) => {
      if (folderId) {
        this.setState({
          uploadFilesModalShow: true,
          uploadFiles: files,
          newFolderId: folderId,
          newFolderName: folderName,
          renameFile: null
        })
      }
    })
  },

  //选择文件或文件夹
  handleUploadFiles(inputFiles) {
    if (inputFiles.length > MAX_FILE_COUNT) {
      message.error(`上传文件个数超过${MAX_FILE_COUNT}个，请分开上传！`)
      return
    }

    let files = []
    for (let i = 0; i < inputFiles.length; i++) {
      files.push(inputFiles[i])
    }

    const folderId = this.props.routeParams.folderId

    if (files[0].webkitRelativePath) {
      // 上传文件夹(可能包含子文件夹)
      // todo directory upload
      const directoryName = files[0].webkitRelativePath.split('/')[0]

      // 判断是否重名
      this.handleCheckName(this.props.routeParams.folderId, [{
        name: directoryName,
        type: FILE_TYPE.FOLDER,
        size: 0
      }]).then((res) => {
        if (res.code === 0) {
          //无重复
          this.handleUploadNewFolder(files, directoryName)
        } else if (res.code === DUP_CODE) {
            //文件夹名重复
          this.setState({
            renameType: 'upload',
            renameFile: {
              name: directoryName,
              type: FILE_TYPE.FOLDER
            },
            renameOk: (file) => {
              return this.handleCheckName(folderId, [file]).then((res) => {
                if (res.code === 0) {
                  this.handleUploadNewFolder(files, file.name)
                }
                return res.code
              })
            },
            renameCancel: () => {
              this.setState({
                renameFile: null
              })
            }
          })
        } else {
          message.error('网络错误')
        }
      })
    } else {
      //上传文件
      //检查重名情况
      let needCheckFiles = []
      const { previewFile } = this.state
      for (let i = 0; i < files.length; i++) {
        if (previewFile) {
          //上传新版本，检查重名不包含本身
          needCheckFiles.push({
            name: files[i].name,
            type: FILE_TYPE.UNKNOWN,
            size: files[i].size,
            id: previewFile.id
          })
        } else {
          //上传新文件
          needCheckFiles.push({
            name: files[i].name,
            type: FILE_TYPE.UNKNOWN,
            size: files[i].size,
          })
        }
      }
      this.handleCheckName(folderId, needCheckFiles).then((res) => {
        let needRenameFiles = res.needRenameFiles

        //处理重名文件
        const dealRename = (dealFiles) => {
          if (dealFiles.length === 0) {
            //所有重命名完成
            files.length && this.setState({
              uploadFilesModalShow: true,
              uploadFiles: files
            })
          } else {
            const deleteFile = (file, opt, index) => {
              //删除已经处理完的文件,opt代表成功与失败
              needRenameFiles.shift()
              setTimeout(() => dealRename(needRenameFiles), 500)

              if (opt) {
                files[index].fileName = file.name
              } else {
                files.splice(index, 1)
              }
            }

            const renameFileIndex = files.findIndex((v) => v.name == dealFiles[0].name)//重命名的文件在原有文件列表中的位置

            this.setState({
              renameFile: dealFiles[0],
              renameType: 'upload',
              renameOk: (file) => {
                return this.handleCheckName(folderId, [file]).then((res) => {
                  if (res.code === 0) {
                    deleteFile(file, true, renameFileIndex)
                    setTimeout(() => this.setState({
                      renameFile: null
                    }), 500)
                  }

                  return res.code
                })
              },
              renameCancel: (file) => {
                deleteFile(file, false, renameFileIndex)
                this.setState({
                  renameFile: null
                })
              }
            })
          }
        }

        dealRename(needRenameFiles)
      })
    }
  },

  //进入文件夹
  handleExpandFolder(e, path, folderId) {
    e.stopPropagation()

    this.fetchFileList(folderId, path, true)
    this.navigate(path, folderId)
  },

  //预览文件
  handlePreview(e, file, fileVersion = null) {
    e.stopPropagation()

    // 取该文件的所有历史版本列表
    fetch(config.api.file.versions.get(file.id), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      this.setState({
        previewFile: file,
        previewModalShow: true,
        currentPreviewVersion: fileVersion || file.version,
        versions: res.data || [],
      })
    })

    if (file.publicType === PUBLIC_TYPE.SECRET) {
      this.fetchLogs(file)
    }
  },

  //修改新建文件夹名，检测是否重名
  handleChangeFolderName(e) {
    const folderName = e.target.value
    this.setState({ folderName })

    //判断文件夹是否合法（是否重名）
    if (this.state.fileMap.getIn([this.props.routeParams.path, 'files'], []).some((file) => file.type === FILE_TYPE.FOLDER && file.fileName === folderName)) {
      this.setState({
        folderNameInvalid: true
      })
    } else if (this.state.folderNameInvalid) {
      this.setState({
        folderNameInvalid: false
      })
    }
  },

  //创建文件夹，成功后清除folder state
  handleCreateFolder(folderName, folderPublicType) {
    const { routeParams, affair } = this.props

    this.setState({
      folderModalLoading: true
    })

    return fetch(config.api.file.folder.add(routeParams.folderId, folderName, folderPublicType), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const data = res.data
        const folderRecord = {
          fileName: folderName,
          type: FILE_TYPE.FOLDER,
          id: data.id,
          uploader: data.roleId,
          roleTitle: data.roleTitle,
          modifyTime: data.modifyTime,
          userId: data.userId,
          userName: data.userName,
          publicType: folderPublicType
        }
        this.setState({
          fileMap: this.state.fileMap.updateIn([routeParams.path, 'files'], (v) => v.push(folderRecord)).sort(this.getDataSourceSorter()),
          folderPublicType: folderPublicType,
          folderName: '',
          createFolderModalShow: false,
          folderModalLoading: false
        })
        return data.id
      }
      else {
        message.error('添加文件夹失败！')
        return false
      }
    })
  },

  //上传成功后在文件列表中添加该文件
  handleAddFile(file, resData, folderId = null, folderName = null) {
    let path = this.props.routeParams.path

    let fileRecord = {
      fileName: resData.name,
      id: resData.id,
      type: getFileType(resData.name),
      size: file.size,
      uploader: resData.roleId,
      roleTitle: resData.roleTitle,
      modifyTime: resData.modifyTime,
      userId: resData.userId,
      userName: resData.userName,
      version: resData.version,
      publicType: PUBLIC_TYPE.OPEN
    }

    let isDup = false
    let fileMap = this.state.fileMap
    if (folderId !== null && folderName !== null) {
      //上传文件夹时的添加文件，path多加上/folderName
      path += `/${folderName};`
      fileMap = fileMap.set(path, Map({ folderId: folderId, files: List() }))
    }
    this.setState({
      fileMap: fileMap.updateIn([path, 'files'], (v) => {
        v = v.map((w) => {
          if (w.fileName === fileRecord.fileName) {
            isDup = true
            return fileRecord
          } else {
            return w
          }
        })

        if (!isDup) {
          v = v.unshift(fileRecord)
        }

        return v
      })
    })
  },

  //批量更改文件公开性（保密与非保密）
  handleChangeFilesPublicType(changeFiles, publicType) {
    let files = [], folders = []
    changeFiles.forEach((file) => file.type === FILE_TYPE.FOLDER ? folders.push(file) : files.push(file))

    const path = this.props.routeParams.path

    let fileMap = this.state.fileMap

    fetch(config.api.file.publicType.edit(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      body: JSON.stringify({
        publicType: publicType,
        fileIds: files.map((v) => v.id),
        folderIds: folders.map((v) => v.id)
      })
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        files.concat(folders).forEach((file) => {
          fileMap = fileMap.updateIn([path, 'files'], (fileList) => {
            return fileList.update(fileList.findIndex((v) => v.id === file.id), (v) => {
              v.publicType = publicType
              v.modifyTime = moment().format('YYYY-MM-DD HH:mm:ss')
              return v
            })
          })
        })
        this.setState({
          fileMap
        })
      } else {
        message.error('修改文件保密性失败！')
      }
    })
  },

  handleShowMoveFileModal(file = null) {
    if (file) {
      this.setState({ moveFiles: [file], moveFileModalShow: true })
    } else {
      this.setState({ moveFiles: this.state.selectedItems.toArray(), moveFileModalShow: true })
    }
  },

  handleSwitchFilePreviewTab(tab) {
    this.setState({ previewTab: tab })

    if (tab === RECORD) {
      //重新获取文件记录
      this.fetchLogs(this.state.previewFile)
    }
  },

  handleAddNewVersion(newVersion) {
    const newVersions = [...this.state.versions]
    const path = this.props.routeParams.path
    newVersions.unshift({
      roleId: newVersion.roleId,
      roleTitle: newVersion.roleTitle,
      id: newVersion.id,
      createTime: newVersion.modifyTime,
      version: newVersion.version,
      name: newVersion.name,
    })
    this.setState({
      versions: newVersions,
      fileMap: this.state.fileMap.updateIn([path, 'files'], (files) => {
        let findEntry = files.findEntry((file) => file.id === newVersion.id)
        findEntry[1].fileName = newVersion.name
        findEntry[1].modifyTime = newVersion.modifyTime
        findEntry[1].version = newVersion.version
        findEntry[1].roleId = newVersion.roleId
        findEntry[1].roleTitle = newVersion.roleTitle
        return files.set(findEntry[0], findEntry[1])
      })
    })
  },

  //具体移动文件的函数
  moveFunc(files, desFolderId) {
    const { affair, routeParams } = this.props

    return fetch(config.api.file.move(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify({
        files: files,
        desFolderId: desFolderId
      })
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        //移动到除父文件夹外的位置
        this.fetchFileList(routeParams.folderId, routeParams.path)
      } else if (res.code === -1) {
        //移动失败
        message.error('移动文件失败，目标文件夹为自身或者它的子文件夹！')
      } else if (res.code != DUP_CODE) {
        message.error('移动异常，请刷新重试！')
      }

      return res
    })
  },

  //移动文件
  handleMoveFiles(desFolderId) {
    let { moveFiles } = this.state

    return new Promise((resolve) => {
      this.moveFunc(moveFiles.map((file) => buildFileCheckObject(file)), desFolderId).then((res) => {
        if (res.code === DUP_CODE) {
          //有需要重命名的文件或文件夹，递归处理
          let needRenameFiles = res.data.files
          const dealRename = (files) => {
            if (files.length === 0) {
              //所有重命名已完成
              setTimeout(() => this.setState({
                moveFiles: [],
                moveFileModalShow: false
              }), 500)

              resolve()
            } else {
              const deleteFile = (file) => {
                //删除已经处理完的文件
                needRenameFiles = needRenameFiles.filter((needRenameFile) => needRenameFile.id != file.id)
                setTimeout(() => dealRename(needRenameFiles), 500)
              }

              this.setState({
                renameFile: files[0],
                renameType: 'move',
                renameOk: (file) => {
                  return this.moveFunc([file], desFolderId).then((res) => {
                    if (res.code === 0) {
                      deleteFile(file)
                      this.setState({
                        renameFile: null
                      })
                    }
                    return res.code
                  })
                },
                renameCancel: (file) => {
                  deleteFile(file)
                  this.setState({
                    renameFile: null
                  })
                },
                renameDesFolderId: desFolderId
              })
            }
          }

          dealRename(needRenameFiles)
        } else {
          resolve()
          setTimeout(() => this.setState({
            moveFiles: [],
            moveFileModalShow: false
          }), 100)
        }
      })
    })
  },

  handleDeleteFile(file) {
    const path = this.props.routeParams.path

    if (file.type === FILE_TYPE.FOLDER) {
      // 删除文件夹
      fetch(config.api.file.deleteFolder(file.id), {
        method: 'POST',
        credentials: 'include',
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
        resourceId: file.id,
      }).then((res) => res.json()).then((res) => {
        if (res.code === 0) {
          // 从文件列表中删除文件夹
          this.setState({
            fileMap: this.state.fileMap.updateIn([path, 'files'], (v) => {
              return v.filter((w) => w.id != file.id)
            }).sort(this.getDataSourceSorter())
          })
        } else if (res.code === 4000) {
          message.error('该文件不存在')
        } else if (res.code === 4001) {
          message.error('请先删除文件夹内的文件')
        }
      })
    } else {
      // 删除普通的文件
      fetch(config.api.file.delete(file.id), {
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
        resourceId: file.id,
        method: 'POST',
        credentials: 'include',
      }).then((res) => res.json()).then((res) => {
        if (res.data === true) {
          // 从文件列表中删除文件
          this.setState({
            fileMap: this.state.fileMap.updateIn([path, 'files'], (v) => {
              return v.filter((w) => w.id != file.id)
            })
          })
        } else if (res.data === false){
          message.error('不能删除24小时前修改的文件')
        }
      })
    }
  },

  downloadFiles(files, version = null) {
    const { affair } = this.props

    files.map((file) => {
      oss.getFileToken(config.api.file.token.download(), affair.get('id'), affair.get('roleId'), file.id, file.fileName, version || file.version).then((url) => {
        let link = document.createElement('a')
        if (typeof link.download === 'string') {
          document.body.appendChild(link) // Firefox requires the link to be in the body
          link.download = file.fileName
          link.href = url
          link.click()
          document.body.removeChild(link) // remove the link when done
        } else {
          location.replace(url)
        }
      })
    })
  },

  // Render
  renderHeader() {
    const { selectedItems } = this.state
    const { affair } = this.props
    const canOperate = selectedItems.size > 0
    let canSetSecret = false, canSetPublic = false

    if (canOperate) {
      selectedItems.map((row) => {
        if (!canSetPublic && row.publicType != PUBLIC_TYPE.OPEN) {
          canSetPublic = true
        }
        if (!canSetSecret && row.publicType == PUBLIC_TYPE.OPEN) {
          canSetSecret = true
        }
      })
    }

    const menu = (
      <Menu>
        <MenuItem key="file"><div onClick={() => this.refs.fileUploader.click()}>上传文件</div></MenuItem>
        <MenuItem key="folder"><div onClick={() => this.refs.directoryUploader.handleClick()}>上传文件夹</div></MenuItem>
      </Menu>
    )


    return (<div className={styles.header}>
      <div className={styles.searchField}>
        <Input placeholder={'输入文件名／角色'} onChange={(evt) => this.handlePhraseChange(evt.target.value)} />
        <span className={styles.searchIcon}><SearchIcon/></span>
      </div>

      <div style={{ display: 'flex' }}>
        {canOperate ?
          <div>
            <Button type="ghost" size="large" style={{ marginRight: 10 }} onClick={() => this.downloadFiles(selectedItems)}>下载</Button>
            <Button type="ghost" size="large" style={{ marginRight: 10 }} onClick={() => this.handleShowMoveFileModal()}>移动</Button>

            {affair.validatePermissions(PERMISSION.MANAGE_FILE) ?
              <Button.Group style={{ marginRight: 10 }}>
                <Button type="ghost" size="large" style={{ paddingRight: 15 }} disabled={canSetSecret ? false : true} onClick={() => this.handleChangeFilesPublicType(this.state.selectedItems, 3)}>设为保密</Button>
                <Button type="ghost" size="large" style={{ paddingLeft: 15 }} disabled={canSetPublic ? false : true} onClick={() => this.handleChangeFilesPublicType(this.state.selectedItems, 0)}>取消保密</Button>
              </Button.Group>
            :
              null
            }
          </div>
        :
          null
        }

        {affair.validatePermissions(PERMISSION.UPLOAD_FILE) && [
          <Button key="folderBtn" type="ghost" size="large" style={{ marginRight: 10 }} onClick={() => {this.setState({ createFolderModalShow: true })}}>新建文件夹</Button>,
          <Dropdown key="fileBtn" overlay={menu} overlayClassName={styles.uploadDropdown}>
            <Button type="primary" size="large" className={styles.uploadBtn}>上传<ArrowDropDown/></Button>
          </Dropdown>,
          <input key="input" title="点击选择文件" multiple accept="*/*" type="file" name="html5uploader" ref="fileUploader" style={{ display: 'none' }} onChange={() => this.handleUploadFiles(this.refs.fileUploader.files)} onClick={(e) => e.target.value = null} />,
          <DirectoryInput key="filesInput" handleUploadFiles={this.handleUploadFiles} ref="directoryUploader"/>,
        ]}

      </div>
    </div>)
  },

  renderPreviewModal() {
    const { previewFile, previewModalShow, previewTab, currentPreviewVersion, logs } = this.state
    const { affair } = this.props
    if (!previewFile) return

    return (
      <Modal title={<div>{getFileTypeIcon(previewFile.type)}<span>{previewFile.fileName}</span></div>}
        footer=""
        visible={previewModalShow}
        onCancel={() => this.setState({ previewModalShow: false, previewFile: null, versions: [], logs: [] })}
        width={900}
        wrapClassName={styles.previewModal}
        maskClosable={false}
      >
        <div className={styles.modalContent}>
          <div className={styles.leftPanel}>
            <FilePreview file={previewFile} affairId={this.props.affair.get('id')} roleId={this.props.affair.get('roleId')} version={currentPreviewVersion}/>
          </div>
          <div className={styles.rightPanel}>
            <div>
              {previewFile.publicType == PUBLIC_TYPE.SECRET ?
                <div className={styles.tab}>
                  <div className={previewTab === HISTORY ? styles.highlight : null} onClick={() => this.handleSwitchFilePreviewTab(HISTORY)}>历史版本</div>
                  <div className={previewTab === RECORD ? styles.highlight : null} onClick={() => this.handleSwitchFilePreviewTab(RECORD)}>文件记录</div>
                </div>
              :
                <div style={{ marginBottom: 10 }}>
                历史版本：
                </div>
              }

              {previewTab === HISTORY ?
                <div className={styles.history}>
                  {
                    this.state.versions.map((version) => (
                      <div key={version.version} onClick={(e) => this.handlePreview(e, previewFile, version.version)}>
                        <div className={styles.fileHeader}>
                          <div>
                            <span className={styles.badge}>{`V${version.version}`}</span>
                            <span className={styles.fileName} title={version.name}>{version.name}</span>
                          </div>
                          <div className={styles.operation}>
                            <span onClick={(e) => {e.stopPropagation();this.downloadFiles([previewFile], version.version)}}><SprigDownIcon/></span>
                          </div>
                        </div>
                        <div className={styles.description}>{`${version.roleTitle}上传于${moment(version.createTime).format('YYYY-MM-DD HH:mm:ss')}`}</div>
                      </div>
                    ))
                  }
                </div>
              :
                <div className={styles.record}>
                  {
                  logs.map((log, index) => {
                    return (
                      <div key={index}>
                        <div>{`${log.roleTitle} ${log.operation} `}“<span>V{log.fileVersion}</span> {log.name}”</div>
                        <div>{moment(log.time).format('YYYY-MM-DD HH:mm:ss')}</div>
                      </div>
                    )
                  })
                }
                </div>
              }
            </div>

            <div>
              {affair.validatePermissions(PERMISSION.MANAGE_FILE) ?
                <div className={styles.secretFooter}>
                  <div style={{ display: 'flex' }}>
                    <span className="u-text-14">保密</span>
                    <Switch
                      checkedChildren="开"
                      unCheckedChildren="关"
                      checked={previewFile.publicType === PUBLIC_TYPE.SECRET}
                      onChange={(val) => {
                        val = !val
                        this.handleChangeFilesPublicType([previewFile], val ? PUBLIC_TYPE.OPEN : PUBLIC_TYPE.SECRET)
                        previewFile.publicType = val ? PUBLIC_TYPE.OPEN : PUBLIC_TYPE.SECRET
                        this.setState({
                          previewFile,
                        })
                      }}
                    />
                  </div>
                  <div className="u-text-l-12">保密文件只对拥有“查看保密文件”权限的角色可见</div>
                </div>
                :
                null
              }

              <div className={styles.uploadNewBtn}>
                <Button type="primary" size="large" onClick={() => this.refs.fileUploader.click()}>上传新版本</Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    )
  },

  renderCreateFolderModal() {
    const { createFolderModalShow, folderName, folderNameInvalid, folderPublicType } = this.state
    const { affair } = this.props
    if (!createFolderModalShow) return null

    return (
      <Modal title="新建文件夹"
        visible
        onCancel={() => this.setState({ createFolderModalShow: false })}
        width={500}
        wrapClassName={styles.createFolderModal}
        footer={[
          <Button type="ghost" size="large" key="cancel"
            onClick={() => this.setState({ createFolderModalShow: false })}
          >取消</Button>,
          <Button type="primary" size="large" key="ok"
            onClick={() => this.handleCreateFolder(folderName, folderPublicType)}
            disabled={folderNameInvalid}
          >完成</Button>
        ]}
      >
        <div className={styles.modalItem}>
          <div>文件夹名称：</div>
          <Input
            ref={(input) => {
              input && setTimeout(() => input.refs.input.focus(), 500)
            }}
            style={{ width: 220 }}
            value={folderName}
            onChange={this.handleChangeFolderName}
            onPressEnter={() => {
              !folderNameInvalid && this.handleCreateFolder(folderName, folderPublicType)
            }}
          />
          <div className={styles.folderError} style={{ display: folderNameInvalid ? 'block' : 'none' }}>该文件夹已存在！</div>
        </div>
        {affair.validatePermissions(PERMISSION.MANAGE_FILE) ?
          <div className={styles.modalItem}>
            <div>可见性：</div>
            <div style={{ width: 220 }}>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <span className="u-text-14">保密：</span>
                <Switch checkedChildren="开" unCheckedChildren="关"
                  onChange={(checked) => {
                    this.setState({ folderPublicType: checked ? PUBLIC_TYPE.SECRET : PUBLIC_TYPE.OPEN })
                  }}
                />
              </div>
              <div className="u-text-l-12">保密文件只对拥有“查看保密文件”权限的角色可见</div>
            </div>
          </div>
          :
          null
        }
      </Modal>
    )
  },

  getTableRowClassName(record) {
    const { selectedItems } = this.state
    if (selectedItems.find((v) => v.id == record.id)) {
      return styles.highlightRow
    } else {
      return ''
    }
  },

  //目录导航
  renderPathNav() {
    const path = this.props.routeParams.path
    const paths = path === '/' ? [''] : path.split('/')
    const pathsInfo = this.state.navigationInfo
    let subNav = null, navigatePath = ''

    if (!pathsInfo.size) return (
      <div className={styles.pathNav}>
        <span>全部文件</span>
      </div>
    )

    let nav = paths.reduce((acc, value, index) => {
      if (value === '') {
        subNav = <span onClick={() => this.navigate('/', ROOT_FOLDER)} key={index}>全部文件</span>
      } else {
        navigatePath += '/' + value;
        ((path, folderId) => {
          acc.push(<span className={styles.navSeparator} key={'separator' + index}>/</span>)
          subNav = <span onClick={index === paths.length ? null : () => this.navigate(path, folderId)} key={index}>{value}</span>
        })(navigatePath, pathsInfo.get(index - 1, {}).id)
      }
      acc.push(subNav)
      return acc
    }, [])

    return (
      <div className={styles.pathNav}>
        {nav}
      </div>
    )
  },

  render() {
    const { affair, routeParams } = this.props
    if (!affair.validatePermissions(PERMISSION.ENTER_FILE_STORE)) {
      return (
        <div className={styles.noFile}>
          <img src={imageNoPermission} />
          <div>您无权限查看该页面</div>
        </div>
      )
    }

    const { loading, selectedItems, fileMap, moveFileModalShow, uploadFiles, uploadFilesModalShow, previewFile, newFolderId, newFolderName, renameFile, renameType, renameOk, renameCancel } = this.state
    const path = routeParams.path
    const dataSource = this.state.searchResult === null
      ? List(fileMap.getIn([path, 'files'], [])).sort(this.state.dataSourceSorter).toJS()
      : this.state.searchResult.sort(this.state.dataSourceSorter).toJS()

    const rowSelection = {
      selectedRowKeys: selectedItems.toArray().map((v) => dataSource.findIndex((w) => w.id == v.id)),
      onChange: (keys, items) => this.setState({ selectedItems: Set(items) }),
    }
    const columns = [{
      title: '文件名',
      key: 'fileName',
      dataIndex: 'fileName',
      sorter: true,
      width: 250,
      className: styles.fileName,
      render: (text, record) => {
        return (
          <div>
            <span>{getFileTypeIcon(record.type)}</span>
            <span className="name" onClick={record.type === FILE_TYPE.FOLDER ? (e) => this.handleExpandFolder(e, (path === '/' ? path : path + '/') + record.fileName, record.id) : (e) => this.handlePreview(e, record)}>{text}</span>
            {record.publicType != PUBLIC_TYPE.OPEN ? <div className={styles.secret}>保密</div> : null}
          </div>
        )
      }
    }, {
      title: '大小',
      key: 'size',
      dataIndex: 'size',
      width: 80,
      sorter: true,
      render: (text, record) => record.type === FILE_TYPE.FOLDER ? '-' : filesize(text, { round: 1 })
    }, {
      title: '修改人',
      key: 'roleTitle',
      dataIndex: 'roleTitle',
      width: 130,
      sorter: true,
      render: (text) => text || '无'
    }, {
      title: '修改时间',
      key: 'modifyTime',
      dataIndex: 'modifyTime',
      width: 160,
      sorter: true,
      render: (text) => <span style={{ 'whiteSpace': 'nowrap' }}>{moment(text).format('YYYY-MM-DD HH:mm:ss')}</span>
    }, {
      title: '操作',
      key: 'operation',
      width: 70,
      className: styles.operations,
      render: (text, record) => {
        const menu = (
          <Menu>
            {affair.validatePermissions(PERMISSION.MANAGE_FILE) ?
              <MenuItem key="0">
                {record.publicType === PUBLIC_TYPE.OPEN ?
                  <div className={styles.dropdownItem}
                    onClick={() => this.handleChangeFilesPublicType([record], PUBLIC_TYPE.SECRET)}
                  >设为保密</div>
                  :
                  <div className={styles.dropdownItem}
                    onClick={() => this.handleChangeFilesPublicType([record], PUBLIC_TYPE.OPEN)}
                  >取消保密</div>
                }
              </MenuItem>
              : null
            }
            <MenuItem key="1">
              <div onClick={() => this.handleShowMoveFileModal(record)} className={styles.dropdownItem}>移动到</div>
            </MenuItem>
            <MenuItem key="2">
              <div onClick={() => this.handleDeleteFile(record)} className={styles.dropdownItem}>删除</div>
            </MenuItem>
          </Menu>
        )
        return (
          <div onClick={(e) => {e.stopPropagation()}}>
            {record.type === FILE_TYPE.FOLDER ?
              <span style={{ width: 21, display: 'inline-block' }} />
              :
              <span onClick={() => this.downloadFiles([record])}><SprigDownIcon/></span>
            }
            <Dropdown overlay={menu} trigger={['click']} overlayClassName={styles.operationDropdown}>
              <span><MoreIcon/></span>
            </Dropdown>
          </div>
        )
      }
    }]

    return (
      <div className={styles.container}>
        {this.renderHeader()}
        {this.renderPathNav()}
        {
          dataSource.length === 0 ? (
            <div className={styles.noFile}>
              <img src={imageNoFile} />
              <div>暂无文件</div>
            </div>
          ) : (
            <div>
              <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                useFixedHeader
                scroll={{ y: window.innerHeight - 312 }}
                onChange={(pagination, filter, sorter) => this.setState({ dataSourceSorter: this.getDataSourceSorter(sorter) })}
                onRowClick={this.toggleSelectTableItem}
                loading={loading}
                rowClassName={this.getTableRowClassName}
                className={styles.tableContainer}
              />
            </div>
          )
        }

        {this.renderPreviewModal()}
        {this.renderCreateFolderModal()}
        <MoveFileModal visible={moveFileModalShow}
          affairMemberId={affair.get('affairMemberId')}
          affairId={affair.get('id')}
          roleId={affair.get('roleId')}
          onCancel={() => this.setState({ moveFileModalShow: false })}
          folderIds={selectedItems.map((v) => v.id)}
          onOk={this.handleMoveFiles}
        />
        {uploadFilesModalShow &&
          <UploadFilesModal
            affairId={this.props.affair.get('id')}
            roleId={this.props.affair.get('roleId')}
            visible={uploadFilesModalShow}
            files={uploadFiles}
            affairMemberId={affair.get('affairMemberId')}
            folderId={routeParams.folderId} uploaderId={affair.get('roleId')}
            fileId={previewFile && previewFile.id}
            publicType={fileMap.get(path).get('publicType')}
            onAddNewVersion={this.handleAddNewVersion}
            onCancel={() => this.setState({ uploadFilesModalShow: false })}
            onComplete={() => {
              this.setState({ uploadFilesModalShow: false })
            }}
            addFile={this.handleAddFile}
            newFolderId={newFolderId}
            newFolderName={newFolderName}
            handleChangeFilesPublicType={this.handleChangeFilesPublicType}
            hasSecretPermission={affair.validatePermissions(PERMISSION.MANAGE_FILE)}
          />
        }
        {renameFile &&
          <RenameModal file={renameFile}
            type={renameType}
            onOk={renameOk}
            onCancel={renameCancel}
            affairMemberId={affair.get('affairMemberId')}
          />
        }
      </div>
    )
  }
})

export default connect(null, (dispatch) => ({ pushURL: bindActionCreators(pushURL, dispatch) }))(FileListContainer)
