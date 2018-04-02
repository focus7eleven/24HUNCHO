import React from 'react'
import styles from './RoleListPanel.scss'
import { Checkbox, Modal, Input, message } from 'antd'
import { SearchIcon } from 'svg'
import config from '../../config'
import { fromJS } from 'immutable'


const RoleListPanel = React.createClass({

  getInitialState() {
    return {
      rolelist: [],
      chosenList: [],
      searchWord: '',
    }
  },

  handleOk() {
    const { chosenList } = this.state
    if (chosenList.length === 0){
      message.error('没有选择对象')
      this.props.close()
    } else {
      this.props.onOk(chosenList)
    }
  },

  handleCancel() {
    this.props.close()
  },

  componentWillMount(){
    this.fetchRoles()
  },

  fetchRoles() {
    const { affair, existRoles } = this.props

    const filterRoles = fromJS(existRoles.map((r) => {return r.roleId}))

    if (this.props.usePrimaryRoleFilter) {
      fetch(config.api.affair.role.main_roles(), {
        method: 'GET',
        credentials: 'include',
        affairId: affair.get('id'),
        roleId: affair.get('roleId')
      }).then((res) => res.json()).then((json) => {
        if (json.code == 0) {
          this.setState({
            rolelist: json.data.filter((r) => {return !filterRoles.includes(r.roleId)}),
          })
        }
      })
    } else {
      fetch(config.api.affair.role.current(), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        body: JSON.stringify({
          active: true,
          inAlliance: true,
        })
      }).then((res) => res.json()).then((json) => {
        if (json.code === 0) {
          const roles = json.data.roles

          this.setState({

            roleList: roles.map((v) => ({
              roleId: v.roleId,
              roleTitle: v.roleTitle,
              username: v.username,
              avatar: v.avatar,
            })).filter((r) => {return !filterRoles.includes(r.roleId)})
          })
        }
      })
    }
  },

  handleChooseRole(e, v) {
    let { chosenList } = this.state
    if (e.target.checked) {
      chosenList.push(v)
    }
    else {
      chosenList = chosenList.filter((w) => {return w.roleId != v.roleId})
    }
    this.setState({ chosenList })
  },

  render() {
    let { rolelist, searchWord } = this.state
    rolelist = rolelist.filter((v) => {
      return (v.roleTitle.indexOf(searchWord) >= 0 || v.username.indexOf(searchWord) >= 0) 
    })
    return (
      <Modal
        maskClosable={false}
        visible
        wrapClassName={styles.addApproveRole}
        width={500}
        title="添加负责人"
        onCancel={this.handleCancel}
        onOk={this.handleOk}
      >
        <div className={styles.title}>选择角色:</div>
        <div className={styles.choosePanel}>
          <div className={styles.left}>
            <div className={styles.search}>
              <Input style={{ width: 175, height: 26 }} placeholder="搜索角色" onChange={(e) => {this.setState({ searchWord: e.target.value })}}/><SearchIcon/>
            </div>
            <div className={styles.memberList}>
              {rolelist.map((v, k) => {
                return (
                  <div key={k} className={styles.row}>
                    <Checkbox onChange={(e) => this.handleChooseRole(e, v)}>
                      {v.avatar ? <img src={v.avatar} className={styles.avatar}/> : <div className={styles.avatar} style={{ backgroundColor: '#e9e9e9' }} />}
                      <span>{v.roleTitle} {v.username}</span>
                    </Checkbox>
                  </div>
                )
              })}
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.span}>已选择:</div>
            <div className={styles.chosenList}>
              {this.state.chosenList.map((v, k) => {
                return (
                  <div key={k} className={styles.row}>
                    <Checkbox checked>
                      {v.avatar ? <img src={v.avatar} className={styles.avatar}/> : <div className={styles.avatar} style={{ backgroundColor: '#e9e9e9' }}/>}
                      <span>{v.roleTitle} {v.username}</span>
                    </Checkbox>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Modal>
    )
  }
})

export default RoleListPanel
