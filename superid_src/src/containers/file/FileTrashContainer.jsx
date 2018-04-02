import React from 'react'
import { Button, Input, Table, Modal, Icon, message } from 'antd'
import { SearchIcon, RestoreIcon, ShiftDeleteIcon } from 'svg'
import { Set, List, fromJS } from 'immutable'
import moment from 'moment'
import filesize from 'filesize'
import RestoreModal from './FoldersModal'
import { getFileTypeIcon, getFileType } from 'filetype'
import styles from './FileListContainer.scss'
import config from '../../config'
import oss from 'oss'
import { DUP_CODE, FOLDER_NOT_EXIST_CODE } from './FileListContainer'
import RenameModal from './RenameModal'
import imageNoFile from 'images/img_no_file.png'

const FileTrashContainer = React.createClass({
  getInitialState() {
    return {
      fileList: List(),
      loading: false, //目录内容是否正在加载
      selectedItems: Set(), // 被选中的文件
      dataSourceSorter: this.getDataSourceSorter({ columnKey: 'modifyTime', order: 'descend' }), // 表格数据排序
      phrase: '',
      restoreModalShow: false,
      renameFile: null, //需要重命名的文件
      renameType: null, //重命名文件后需要操作的类型（上传、移动、还原）,
      renameOk: null, //重命名文件后的确定操作,
      renameCancel: null, //重命名文件时取消操作,
      renameDesFolderId: null, //重命名文件该去的文件夹id
    }
  },
  componentDidMount() {
    this.getTrashFiles(this.props)
  },
  componentWillReceiveProps(nextProps) {
    if (this.props.affair !== nextProps.affair) {
      this.getTrashFiles(nextProps)
    }
  },

  getTrashFiles(props) {
    fetch(config.api.file.trash.get(props.affair.get('id'), props.affair.get('roleId')), {
      method: 'GET',
      credentials: 'include',
      affairId: props.affair.get('id'),
      roleId: props.affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      res.data = res.data || []
      this.setState({
        fileList: fromJS(res.data.map((file) => {
          file.type = getFileType(file.name)
          file.fileName = file.name
          return file
        })),
      })
    })
  },

  getDataSourceSorter(sorter = {}) {
    switch (sorter.columnKey) {
      case 'fileName':
        return (a, b) => sorter.order === 'ascend' ? a.fileName.localeCompare(b.fileName) : b.fileName.localeCompare(a.fileName)
      case 'size':
        //文件夹在前，如果同是文件夹按时间排序，如果同是其他类型则按大小排序
        return (a, b) => sorter.order === 'ascend' ? a.size - b.size : b.size - a.size
      case 'roleTitle':
        return (a, b) => sorter.order === 'ascend' ? a.roleTitle.localeCompare(b.roleTitle) : b.roleTitle.localeCompare(a.roleTitle)
      case 'modifyTime':
        return (a, b) => sorter.order === 'descend' ? b.modifyTime - a.modifyTime : a.modifyTime - b.modifyTime
      default:
        //默认按时间顺序排列（倒序），文件夹排在前
        return (a, b) => b.modifyTime - a.modifyTime
    }
  },

  // handle
  // 处理文件点击事件，点击选中
  toggleSelectTableItem(record) {
    const {
      selectedItems
    } = this.state

    // Toggle select table items
    this.setState({
      selectedItems: !selectedItems.find((v) => v.id == record.id) ? selectedItems.add(record) : selectedItems.filter((v) => v.id != record.id)
    })
  },

  //清空回收站
  handleEmptyTrash() {
    Modal.confirm({
      className: styles.modalConfirm,
      content: <div className={styles.confirmContent}><Icon type="info-circle"/>清空后所有文件将无法恢复。确认清空回收站？</div>,
      okText: '清空回收站',
      width: 500,
      onOk: this.handleDeleteFile.bind(this, this.state.fileList.map((v) => v.get('id')).toArray()),
    })
  },

  // 彻底删除
  handleShiftDelete(files) {
    Modal.confirm({
      className: styles.modalConfirm,
      content: <div className={styles.confirmContent}><Icon type="info-circle"/>文件删除后将无法恢复。确认彻底删除选中文件？</div>,
      okText: '彻底删除',
      width: 500,
      onOk: this.handleDeleteFile.bind(this, files.map((v) => v.id)),
    })
  },
  handleDeleteFiles() {
    this.handleShiftDelete(this.state.selectedItems.toArray())
  },
  handleDeleteFile(fileIdArray) {
    // 彻底删除文件
    oss.deleteAffairFile(fileIdArray, this.props.affair.get('id'), this.props.affair.get('roleId')).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const data = res.data.res

        this.setState({
          fileList: this.state.fileList.filter((v) => {
            return !(data[v.get('id')] === true)
          })
        })
      }
    })
  },

  //真正的还原文件
  restoreFunc(restoreFile, folderId) {
    return fetch(config.api.file.restore(restoreFile.id, folderId, restoreFile.name), {
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        // const params = this.props.params
        // let navigationInfo = res.data
        // let folderId = res.data ? res.data[res.data.length - 1].id : 0
        // const path = res.data ? res.data.map((info) => `/${info.name}`) : '/'
        // message.info(
        //   <span>
        //     文件 {restoreFile.name}（{filesize(restoreFile.size, { round: 1 })}）已还原到
        //     <span className="u-link-12" style={{ cursor: 'pointer' }}
        //       onClick={() => this.props.pushURL(`/workspace/affair/${params.id}/file/${folderId}/path=` + encodeURIComponent(path))}
        //     >
        //       全部文件{navigationInfo.map((info) => `/${info.name}`)}
        //     </span>
        //   </span>
        // )
        message.info(
          <span>
            文件 {restoreFile.name}（{filesize(restoreFile.size, { round: 1 })}）已还原
          </span>
        )
        this.setState({
          fileList: this.state.fileList.filter((v) => v.get('id') !== restoreFile.id),
          restoreModalShow: false,
        })
      } else if (res.code === DUP_CODE) {
        //原文件夹有重名
        this.setState({
          renameFile: {
            id: restoreFile.id,
            name: restoreFile.name,
            size: restoreFile.size,
            dupSize: res.data.dupSize,
            type: restoreFile.type
          },
          renameType: 'restore',
          renameOk: (file) => {
            return this.restoreFunc(file).then((res) => {
              if (res.code === 0) {
                this.setState({
                  renameFile: null
                })
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
      } else if (res.code === FOLDER_NOT_EXIST_CODE) {
        this._readyForRestoreFile = restoreFile
        this.setState({
          restoreModalShow: true,
        })
      }

      return res
    })
  },

  restoreFile(file, folderId) {
    if (folderId) {
      return this.restoreFunc(file, folderId)
    } else {
      //直接还原
      return this.restoreFunc(file)
    }
  },

  handlePhraseChange(evt) {
    this.setState({
      phrase: evt.target.value,
    })
  },

  handleSelectTargetPath(folderId) {
    return this.restoreFile(this._readyForRestoreFile, folderId)
  },

  // Render
  renderHeader() {
    const { selectedItems } = this.state
    const canOperate = selectedItems.size > 0

    return (<div className={styles.header}>
      <div className={styles.searchField}>
        <Input placeholder={'输入文件名／角色'} onChange={this.handlePhraseChange} />
        <span className={styles.searchIcon}><SearchIcon/></span>
      </div>

      {canOperate ?
        <div>
          <Button type="ghost" size="large" style={{ marginRight: 20 }} onClick={this.handleDeleteFiles}>彻底删除</Button>
        </div>
        :
        <Button type="ghost" size="large" style={{ marginRight: 20 }} onClick={this.handleEmptyTrash} disabled={!this.state.fileList.size}>清空回收站</Button>
      }

    </div>)
  },

  getTableRowClassName(record) {
    const { selectedItems } = this.state
    if (selectedItems.find((v) => v.id == record.id)) {
      return styles.highlightRow
    } else {
      return ''
    }
  },

  filterByPhrase(dataSource) {
    if (this.state.phrase) {
      return dataSource.filter((v) => {
        return v.roleTitle.includes(this.state.phrase) || v.fileName.includes(this.state.phrase)
      })
    } else {
      return dataSource
    }
  },

  //目录导航
  renderPathNav() {
    return (
      <div className={styles.pathNav}>
        <span>回收站</span>
      </div>
    )
  },

  render() {
    const { loading, selectedItems, fileList, renameFile, renameType, renameOk, renameCancel } = this.state
    const { affair } = this.props
    let dataSource = fileList.toJS().sort(this.state.dataSourceSorter)
    dataSource = this.filterByPhrase(dataSource)
    const rowSelection = {
      selectedRowKeys: selectedItems.toArray().map((v) => dataSource.findIndex((w) => w.id == v.id)),
      onChange: (keys, items) => this.setState({ selectedItems: Set(items) }),
    }

    const columns = [{
      title: '文件名',
      key: 'fileName',
      dataIndex: 'fileName',
      width: 300,
      className: styles.fileName,
      sorter: true,
      render: (text, record, index) => {
        return (
          <div key={index}>
            <span>{getFileTypeIcon(record.type)}</span>
            <span className="name">{text}</span>
          </div>
        )
      }
    }, {
      title: '大小',
      key: 'size',
      dataIndex: 'size',
      width: 80,
      sorter: true,
      render: (text) => filesize(text, { round: 1 })
    }, {
      title: '删除人',
      key: 'roleTitle',
      dataIndex: 'roleTitle',
      width: 130,
      sorter: (a, b) => a.roleTitle.localeCompare(b.roleTitle),
    }, {
      title: '删除时间',
      key: 'modifyTime',
      dataIndex: 'modifyTime',
      width: 160,
      sorter: true,
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss')
    }, {
      title: '操作',
      key: 'operation',
      width: 70,
      className: styles.operations,
      render: (text, record, index) => {
        return (
          <div onClick={(e) => {e.stopPropagation()}} key={index}>
            <span onClick={() => this.restoreFunc(record, null)}><RestoreIcon/></span>
            <span onClick={() => this.handleShiftDelete([record])}><ShiftDeleteIcon/></span>
          </div>
        )
      }
    }]

    // 当没有任何文件时
    if (dataSource.length === 0) {
      return (
        <div className={styles.container}>
          {this.renderHeader()}
          <div className={styles.noFile}>
            <img src={imageNoFile} />
            <div>暂无文件</div>
          </div>
        </div>
      )
    }

    return (<div className={styles.container}>
      {this.renderHeader()}
      {this.renderPathNav()}
      <RestoreModal affairId={this.props.affair.get('id')}
        roleId={this.props.affair.get('roleId')}
        affairMemberId={this.props.affair.get('affairMemberId')}
        onOk={this.handleSelectTargetPath}
        onCancel={() => this.setState({ restoreModalShow: false })}
        visible={this.state.restoreModalShow}
        type="restore"
      />
      <Table rowSelection={rowSelection}
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
      {renameFile &&
      <RenameModal file={renameFile}
        type={renameType}
        onOk={renameOk}
        onCancel={renameCancel}
        affairMemberId={affair.get('affairMemberId')}
      />
        }
    </div>)
  }
})

export default FileTrashContainer
