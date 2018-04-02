import React from 'react'
import styles from './FileRepoContainer.scss'
import { connect } from 'react-redux'
import { VisiblilityIcon, MoreIcon, AddIcon } from 'svg'
import { Tooltip, Popover } from 'antd'
import config from '../../config'
import AddRepoModal from './AddRepoModal'

const FileRepoContainer = React.createClass({
  getInitialState(){
    return {
      showRepoCardPopover: -1,
      repoList: [],
      showAddRepo: false,
    }
  },

  componentWillMount(){
    this.fetchRepoList(this.props)
  },
  fetchRepoList(props){
    fetch(config.api.file.file_repo.list(), {
      method: 'GET',
      credentials: 'include',
      affairId: props.affair.get('id'),
      roleId: props.affair.get('roleId'),
      userId: props.user.get('id'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.setState({
          repoList: json.data,
        })
      }
    })
  },
  handleVisibleChange(key, visible){
    this.setState({
      showRepoCardPopover: visible ? key : -1
    })
  },
  renderFileRepoCard(repo, key){
    const content = (
      <div className={styles.wrap}>
        <div className={styles.row}>编辑文件库</div>
        <div className={styles.row}>删除文件库</div>
      </div>
    )
    return <div className={styles.fileRepoCard} key={key}>
      <div className={styles.repoType}>
        <span className={styles.leftName}>公共文件库</span>
        <div>
          <Tooltip placement="top" title="本事务公开、指定角色公开"><VisiblilityIcon fill="#cccccc" height="18px"/></Tooltip>
          <Popover overlayClassName={styles.fileRepoPopover} content={content} placement="top" trigger="click" visible={this.state.showRepoCardPopover == key} onVisibleChange={this.handleVisibleChange.bind(null, key)}>
            <MoreIcon fill="#cccccc" height="18px" style={{ marginLeft: '5px' }} />
          </Popover>
        </div>
      </div>
    </div>
  },
  render(){
    return <div className={styles.fileRepoContainer}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>{this.props.affair.get('name')}文件库</span>
      </div>
      <div className={styles.content}>
        <div className={styles.contentTitle}>我能使用的</div>
        <div className={styles.cardContainer}>
          {
            [1, 2, 3, 4, 5].map((v, k) => {
              return this.renderFileRepoCard(v, k)
            })
          }
          <div className={styles.addRepoBtn} onClick={() => {this.setState({ showAddRepo: true })}}>
            <AddIcon fill="#cccccc" height="18px" />
            <span>添加文件库</span>
          </div>
        </div>
      </div>
      {
        this.state.showAddRepo && <AddRepoModal cancel={() => {this.setState({ showAddRepo: false })}} affair={this.props.affair} />
      }
    </div>
  }
})

function mapStateToProps(state){
  return {
    user: state.get('user')
  }
}

function mapDispatchToProps(){
  return {

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(FileRepoContainer)