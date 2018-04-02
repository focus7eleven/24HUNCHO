import React from 'react'
import { Modal, TreeSelect, message, Button, Popconfirm } from 'antd'
import { List } from 'immutable'
import config from '../../config'
import { PUBLIC_TYPE } from './FileListContainer'
import styles from './FileListContainer.scss'

const PropTypes = React.PropTypes
const TreeNode = TreeSelect.TreeNode

const FoldersModal = React.createClass({
  propTypes: {
    affairId: PropTypes.string.isRequired,
    roleId: PropTypes.number.isRequired,
    affairMemberId: PropTypes.number.isRequired,
    onOk: PropTypes.func.isRequired,  //need return a Promise
    onCancel: PropTypes.func,
    visible: PropTypes.bool.isRequired,
    folderIds: PropTypes.object,
    type: PropTypes.string
  },
  getDefaultProps() {
    return {
      onCancel: () => {},
      folderIds: List(),
      type: 'move'
    }
  },
  getInitialState() {
    return {
      fileTree: [{
        id: 0,
        name: '全部文件'
      }],
      desFolder: {},
      loading: false,
      popoverShow: false
    }
  },
  componentDidUpdate(preProps) {
    if (!preProps.visible && this.props.visible) {
      this.fetchFolderTree(this.props)
    }

    //清空目录树
    if (preProps.visible && !this.props.visible) {
      this.setState({
        desFolder: {}
      })
    }
  },

  // 获取文件夹树
  fetchFolderTree(props) {
    //开始移动或还原文件，获取整个文件夹目录
    const { affairId, roleId } = props
    fetch(config.api.file.dir(), {
      method: 'GET',
      credentials: 'include',
      affairId,
      roleId,
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0 && res.data) {
        let treeData = [{
          id: 0,
          name: '全部文件',
          children: res.data
        }]

        this.setState({
          fileTree: treeData,
        })
      } else {
        message.error('获取文件目录失败！')
      }
    })
  },

  //handle
  handleOnOk() {
    this.setState({
      loading: true
    })
    this.props.onOk(parseInt(this.state.desFolder.id)).then(() => {
      this.setState({
        loading: false
      })
    })
  },

  confirm() {
    this.setState({
      popoverShow: false
    })
  },

  cancel() {
    this.setState({
      popoverShow: false,
      desFolder: {}
    })
  },

  //render

  renderTreeNode(folder) {
    const { folderIds } = this.props

    if (folder.children && folder.children.length) {
      return (
        <TreeNode value={String(folder.id)} title={folder.name} key={String(folder.id)} publicType={folder.publicType}>
          {folder.children.filter((v) => !folderIds.includes(v.id)).map((v) => this.renderTreeNode(v))}
        </TreeNode>
      )
    } else {
      return <TreeNode value={String(folder.id)} title={folder.name} key={String(folder.id)} publicType={folder.publicType}/>
    }
  },

  render(){
    const { visible, onCancel, type } = this.props
    const { loading, desFolder, popoverShow } = this.state
    return (
      <Modal title={type === 'move' ? '移动文件' : '还原文件'}
        visible={visible || false}
        onCancel={() => onCancel()}
        width={500}
        wrapClassName={styles.foldersModal}
        footer={[
          <div key="move-foot" >
            <Button type="ghost" key="cancel" onClick={onCancel}>取消</Button>
            <Button type = "primary" key="ok" onClick={this.handleOnOk} loading={loading}>确定</Button>
          </div>]}
      >
        {type === 'restore' ? <div className={styles.foldersError}>原文件夹已被删除，请重新选择还原位置！</div> : null}
        <div style={{ display: 'flex', justifyContent: 'center' }} className="u-text-14">
          <div>{type === 'move' ? '移动' : '还原'}至：</div>
          <Popconfirm title={type === 'move' ? `"${desFolder.name}"为保密文件夹，移入后文件会设为保密，是否移动？` : `"${desFolder.name}"为保密文件夹，还原后文件会设为保密，是否还原？`}
            visible={popoverShow}
            placement="bottomLeft"
            overlayClassName={styles.popover}
            okText="是"
            cancelText="否"
            onConfirm={this.confirm}
            onCancel={this.cancel}
          >
            <TreeSelect style={{ width: 300 }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              placeholder="请选择"
              treeDefaultExpandAll
              onChange={(value, label, extra) => {
                if (!value) return

                this.setState({ desFolder: {
                  id: value,
                  publicType: extra.triggerNode.props.publicType,
                  name: label
                } })

                if (extra.triggerNode.props.publicType === PUBLIC_TYPE.SECRET) {
                  this.setState({
                    popoverShow: true
                  })
                }
              }}
              value={desFolder && desFolder.id}
            >
              {this.renderTreeNode(this.state.fileTree[0])}
            </TreeSelect>
          </Popconfirm>
        </div>
      </Modal>
    )
  }
})

export default FoldersModal
