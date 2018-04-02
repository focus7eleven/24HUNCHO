import React, { PropTypes } from 'react'
import { Modal, Button, notification, Checkbox, Tabs } from 'antd'
import styles from './AuthorityModal.scss'
import { MaleIcon, FemaleIcon } from 'svg'
import config from '../../../config'
import { getAffairRoles } from '../../../actions/affair'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

const TabPane = Tabs.TabPane

let AuthorityModal = React.createClass({
  propTypes: {
    member: PropTypes.object.isRequired,
    affair: PropTypes.object.isRequired,
    callback: PropTypes.func,
  },
  getDefaultProps(){
    return {
      member: {},
      affair: {},
      callback: () => {},
    }
  },
  getInitialState(){
    return {
      permissions: [],
      permissionTemplet: [],
      permissionMap: [],
      alliancePermissions: [],
      alliancePermissionTemplet: [],
      alliancePermissionMap: [],
    }
  },

  componentWillMount(){
    const handlePermissionFormat = (permissions, templet) => {
      let result = []
      if (permissions.length == 0){
        return result
      }
      else if (permissions[0] == '*'){
        templet.map((v) => {
          result.push(v.value)
        })
        return result
      }
      else {
        permissions.map((v) => {
          result.push(parseInt(v))
        })
        return result
      }
    }

    const handleAlliancePermissionFormat = (permissions, templet) => {
      let result = []
      if (permissions.length == 0) {
        return result
      }
      else if (permissions[0] == '*') {
        templet.map((v) => {
          result.push(v.value)
        })
        return result
      }
      else {
        permissions.map((v) => {
          result.push(parseInt(v))
        })
        return result
      }
    }

    //获取事务权限模板
    fetch(config.api.affair.permissions.get, {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((json) => {
      let permissionTemplet = []
      JSON.parse(json.data).map((v) => {
        v.childs.map((child) => {
          permissionTemplet.push({
            value: child.id,
            label: child.name,
          })
        })
      })
      this.setState({
        permissionTemplet: permissionTemplet,
        permissionMap: JSON.parse(json.data),
        permissions: handlePermissionFormat((this.props.member.permissions) ? this.props.member.permissions.split(',') : [], permissionTemplet),
      })
    })

    //获取盟权限模板

    fetch(config.api.alliance.permissions.get, {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((json) => {
      let alliancePermissionTemplet = []
      JSON.parse(json.data).map((v) => {
        if (v.id > 0){
          alliancePermissionTemplet.push({
            value: v.id,
            label: v.name,
          })
        }
        else {
          v.childs.map((child) => {
            alliancePermissionTemplet.push({
              value: child.id,
              label: child.name,
            })
          })
        }
      })
      this.setState({
        alliancePermissionTemplet: alliancePermissionTemplet,
        alliancePermissionMap: JSON.parse(json.data),
        alliancePermissions: handleAlliancePermissionFormat((this.props.member.alliancePermissions) ? this.props.member.alliancePermissions.split(',') : [], alliancePermissionTemplet)
      })
    })

  },
  handleCancel(){
    this.props.callback()
  },
  handleOk(){
    const { member, affair } = this.props
    fetch(config.api.affair.role.edit_authority(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        beOperatedRoleId: member.roleId,
        permissions: this.state.permissions
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        fetch(config.api.affair.role.alliance_authority(), {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          roleId: affair.get('roleId'),
          affairId: affair.get('affairId'),
          resourceId: member.roleId,
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            targetRoleId: member.roleId,
            permissions: this.state.alliancePermissions,
          })
        }).then((res) => res.json()).then((res) => {
          if (res.code == 0){
            this.props.getAffairRoles(this.props.affair.get('roleId'), this.props.affair.get('id'), true).then(() => {
              this.props.callback()
            })
          }
          else {
            notification.error({
              message: '没有权限进行该操作',
            })
          }
        })
      }
      else {
        notification.error({
          message: '没有权限进行该操作',
        })
      }
    })

  },
  handleSelectAll(e){
    const { permissionTemplet } = this.state
    let result = []
    if (e.target.checked){
      permissionTemplet.map((v) => {
        result.push(v.value)
      })
    }
    else {
      result = []
    }
    this.setState({
      permissions: result,
    })
  },
  handleSelectAllianceAll(e){
    const { alliancePermissionTemplet } = this.state
    let result = []
    if (e.target.checked){
      alliancePermissionTemplet.map((v) => {
        result.push(v.value)
      })
    }
    else {
      result = []
    }
    this.setState({
      alliancePermissions: result,
    })
  },
  handleChangeSingle(child, e){
    let tmp = this.state.permissions
    if (e.target.checked == true){
      tmp.push(child.id)
      this.setState({
        permissions: tmp,
      })
    }
    else if (e.target.checked == false){
      this.setState({
        permissions: this.state.permissions.filter((v) => {return v != child.id})
      })
    }
  },
  handleAllianceChangeSingle(child, e){
    let tmp = this.state.alliancePermissions
    if (e.target.checked == true){
      tmp.push(child.id)
      this.setState({
        alliancePermissions: tmp,
      })
    }
    else if (e.target.checked == false){
      this.setState({
        alliancePermissions: this.state.alliancePermissions.filter((v) => {return v != child.id})
      })
    }
  },
  handleChangeGroup(group, e){
    let tmp = this.state.permissions
    if (e.target.checked == true){
      group.childs.map((child) => {
        if (!tmp.some((v) => {return v == child.id})){
          tmp.push(child.id)
        }
      })
    }
    else if (e.target.checked == false){
      group.childs.map((child) => {
        tmp = tmp.filter((v) => {return v != child.id})
      })
    }
    this.setState({
      permissions: tmp,
    })
  },
  handleAllianceChangeGroup(group, e){
    let tmp = this.state.alliancePermissions
    if (e.target.checked == true){
      group.childs.map((child) => {
        if (!tmp.some((v) => {return v == child.id})){
          tmp.push(child.id)
        }
      })
    }
    else if (e.target.checked == false){
      group.childs.map((child) => {
        tmp = tmp.filter((v) => {return v != child.id})
      })
    }
    this.setState({
      alliancePermissions: tmp,
    })
  },

  renderPermissionBlock(v, k){
    const { permissions } = this.state
    let groupChecked = true
    v.childs.map((child) => {
      if (!this.state.permissions.some((v) => {return v == child.id})){
        groupChecked = false
      }
    })
    return (<div key={k} className={styles.permissionBlock}>
      <Checkbox onChange={this.handleChangeGroup.bind(null, v)} checked={groupChecked}>{v.name}</Checkbox>
      <div className={styles.children}>
        {
          v.childs != []
              ?
              v.childs.map((child, key) => {
                return <Checkbox checked={permissions.some((p) => {return p == child.id})} key={key} onChange={this.handleChangeSingle.bind(null, child)}>{child.name}</Checkbox>
              })
              :
              null
        }
      </div>
    </div>)
  },
  renderAlliancePermissionBlock(v, k){
    const { alliancePermissions } = this.state
    let groupChecked = true
    v.childs.map((child) => {
      if (!this.state.alliancePermissions.some((v) => {
        return v == child.id
      })) {
        groupChecked = false
      }
    })
    return v.id <= 0
      ?
      (<div key={k} className={styles.permissionBlock}>
        <Checkbox onChange={this.handleAllianceChangeGroup.bind(null, v)} checked={groupChecked}>{v.name}</Checkbox>
        <div className={styles.children}>
          {
            v.childs != []
              ?
              v.childs.map((child, key) => {
                return (<Checkbox checked={alliancePermissions.some((p) => {return p == child.id})} key={key} onChange={this.handleAllianceChangeSingle.bind(null, child)}>{child.name}</Checkbox>)
              })
              :
              null
          }
        </div>
      </div>)
      :
      <div className={styles.permissionBlock} key={k}>
        <Checkbox onChange={this.handleAllianceChangeSingle.bind(null, v)} checked={alliancePermissions.some((p) => {return p == v.id})}>{v.name}</Checkbox>
      </div>
  },

  //事务权限
  renderAffairPermission(){
    let selectAll = true
    this.state.permissionMap.map((block) => {
      block.childs.map((child) => {
        if (!this.state.permissions.some((v) => {return v == child.id})){
          selectAll = false
        }
      })
    })
    return (<div className={styles.tab}>
      <Checkbox onChange={this.handleSelectAll} checked={selectAll} style={{ marginLeft: '20px' }}>全选</Checkbox>
      <div className={styles.permissions}>
        {
          this.state.permissionMap.map((v, k) => {
            return this.renderPermissionBlock(v, k)
          })
        }
      </div>
    </div>)
  },

  //盟权限
  renderAlliancePermission(){
    let selectAll = true
    this.state.alliancePermissionTemplet.map((block) => {
      if (!this.state.alliancePermissions.some((v) => {
        return v == block.value
      })) {
        selectAll = false
      }
    })
    return (<div className={styles.tab}>
      <Checkbox onChange={this.handleSelectAllianceAll} checked={selectAll} style={{ marginLeft: '20px' }}>全选</Checkbox>
      <div className={styles.permissions}>
        {
          this.state.alliancePermissionMap.map((v, k) => {
            return this.renderAlliancePermissionBlock(v, k)
          })
        }
      </div>
    </div>)
  },
  render(){
    const { member } = this.props
    return (
      <Modal
        title={'高级权限'}
        onCancel={this.handleCancel}
        className={styles.adContainer}
        maskClosable={false}
        visible
        footer={[
          <Button key="au_cancel" className={styles.cancelBtn} onClick={this.handleCancel} type="ghost">取消</Button>,
          <Button key="au_ok" className={styles.okBtn} type="primary" onClick={this.handleOk}>确定</Button>
        ]}
      >
        <div className={styles.leftPanel}>
          <div className={styles.noInput}>
            {member.avatar ? <img src={member.avatar}/> : <div className={styles.avatar}/>}

            <div className={styles.info}>
              <div className={styles.username}>{member.username}{this.props.member.gender == 0 ? <MaleIcon height="12" fill="#2db7f5"/> : <FemaleIcon height="12" fill="#2db7f5"/>}</div>
              <div className={styles.rolename}>{member.roleTitle}</div>
            </div>
          </div>

        </div>
        <div className={styles.rightPanel}>
          <Tabs type="card">
            <TabPane tab="事务权限" key="1">{this.renderAffairPermission()}</TabPane>
            <TabPane tab="盟权限" key="2">{this.renderAlliancePermission()}</TabPane>
          </Tabs>

        </div>
      </Modal>
    )
  }
})

function mapStateToProps(state) {
  return {
    allianceTree: state.getIn(['alliance', 'allianceTree']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getAffairRoles: bindActionCreators(getAffairRoles, dispatch),
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(AuthorityModal)
