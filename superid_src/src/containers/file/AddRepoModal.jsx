import React from 'react'
import styles from './AddRepoModal.scss'
import { Modal, Input, Dropdown, Checkbox } from 'antd'
import config from '../../config'
import { DropDownIcon, SearchIcon } from 'svg'
import ReactDOM from 'react-dom'



const AddRepoModal = React.createClass({
  getInitialState(){
    return {
      roleList: [],
      selectedList: [],
      showManagerPopover: false,
    }
  },
  componentWillMount(){
    document.addEventListener('click', this.onClick, true)
    fetch(config.api.affair.role.announcementGuests(), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.setState({
          roleList: json.data,
          unSelectedList: json.data,
        })
      }
    })
  },
  componentWillUnmount(){
    document.removeEventListener('click', this.onClick, true)
  },

  onClick(e){
    if (this.state.showManagerPopover && !(ReactDOM.findDOMNode(this.managerPopover) && ReactDOM.findDOMNode(this.managerPopover).contains(e.target))) {
      this.setState({
        showManagerPopover: false,
      })
    }
  },
  handleCancel(){
    this.props.cancel()
  },
  handleOk(){

  },
  handleRoleOnchange(role, e){
    let { selectedList } = this.state
    if (e.target.checked){
      selectedList.push(role)
    }
    else if (!e.target.checked){
      selectedList = selectedList.filter((v) => v.roleId != role.roleId)
    }
    this.setState({
      selectedList,
    })
  },
  renderPickManager(){
    const { selectedList, roleList } = this.state
    return <div className={styles.roleListContainer} ref={(el) => {this.managerPopover = el}}>
      <div className={styles.search}>
        <Input/>
        <SearchIcon fill="#cccccc" height="16px"/>
      </div>
      <div className={styles.selected}>
        <div className={styles.header}>
          <span className={styles.text}>已选择:</span>
          <span className={styles.clearAll}>清空已选</span>
        </div>
        <div className={styles.content}>
          <div className={styles.selectedList}>
            {
              selectedList.map((v, k) => {
                return <Checkbox key={k} onChange={this.handleRoleOnchange.bind(null, v)} checked={selectedList.find((role) => v.roleId == role.roleId)}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {
                      v.avatar ?
                        <img src={v.avatar} className={styles.avatar} />
                        : <div className={styles.avatar} style={{ backgroundColor: '#e9e9e9' }} />
                    }
                    <span>人事总监 铁蛋</span>
                  </div>
                </Checkbox>
              })
            }
          </div>
          <div className={styles.unSelected}>
            {
              roleList.map((v, k) => {
                return !selectedList.find((role) => role.roleId == v.roleId) && <Checkbox key={k} onChange={this.handleRoleOnchange.bind(null, v)}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {
                      v.avatar ?
                        <img src={v.avatar} className={styles.avatar} />
                        : <div className={styles.avatar} style={{ backgroundColor: '#e9e9e9' }} />
                    }
                    <span>{`${v.roleTitle}  ${v.username}`}</span>
                  </div>
                </Checkbox>
              })
            }
          </div>
        </div>

      </div>
    </div>
  },
  renderChoosePublicType(){
    return <div>ss</div>
  },
  render(){
    return <Modal maskClosable={false} title="添加文件库" width={500} visible wrapClassName={styles.addRepoContainer} onCancel={this.handleCancel} onOk={this.handleOk}>
      <div className={styles.content}>
        <div className={styles.row}>
          <span className={styles.property}>文件库名称:</span>
          <Input/>
        </div>
        <div className={styles.row}>
          <span className={styles.property}>文件库管理者:</span>
          <Dropdown overlay={this.renderPickManager()} trigger={['click']} visible={this.state.showManagerPopover}>
            <div className={styles.selectedRole} onClick={() => {this.setState({ showManagerPopover: !this.state.showManagerPopover })}}>
              <DropDownIcon fill="#cccccc" height="32px"/>
            </div>
          </Dropdown>
        </div>
        <div className={styles.row}>
          <span className={styles.property}>文件库公开性:</span>
          <Dropdown overlay={this.renderChoosePublicType()} trigger={['click']} >
            <div className={styles.selectedRole}>
              <DropDownIcon fill="#cccccc" height="32px"/>
            </div>
          </Dropdown>
        </div>
      </div>
    </Modal>
  }
})

export default AddRepoModal