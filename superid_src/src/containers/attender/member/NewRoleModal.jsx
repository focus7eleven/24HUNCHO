import React, { PropTypes } from 'react'
import { Modal, Button, Form, Input, TreeSelect, notification, Checkbox, Tabs } from 'antd'
import styles from './AuthorityModal.scss'
import { MaleIcon, FemaleIcon } from 'svg'
import config from '../../../config'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getAffairRoles, getAffairInfo } from '../../../actions/affair'
import { fetchUserRoleList } from '../../../actions/user'


const Item = Form.Item
const TreeNode = TreeSelect.TreeNode
const TabPane = Tabs.TabPane

const NewRoleModal = React.createClass({
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
      })
    })
  },
  handleCancel(){
    this.props.form.resetFields()
    this.props.callback()
  },
  handleOk(){
    let form = this.props.form.getFieldsValue()
    fetch(config.api.affair.role.give(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      roleId: this.props.affair.get('roleId'),
      affairId: this.props.affair.get('id'),
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        userId: this.props.member.id,
        affairId: form.affairId,
        title: form.roleTitle,
        alliancePermissions: this.state.alliancePermissions,
        affairPermissions: this.state.permissions,
      }),

    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.props.form.resetFields()
        this.props.callback()
        this.props.fetchUserRoleList()
        this.props.getAffairInfo(this.props.affair.get('id'), this.props.affair.get('roleId'))
      }
      else {
        notification.error({
          message: '赋予新角色失败'
        })
      }
    })
  },

  createTreeNode(root){
    return root.children.length != 0
        ? <TreeNode title={root.name} value={`${root.id}`} key={root.id}>
          {root.children.map((v) => {
            return this.createTreeNode(v)
          })}
        </TreeNode>
        : <TreeNode title={root.name} value={`${root.id}`} key={root.id} isLeaf />
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
      if (!this.state.permissions.some((v) => {
        return v == child.id
      })) {
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
              return (<Checkbox checked={permissions.some((p) => {return p == child.id})} key={key} onChange={this.handleChangeSingle.bind(null, child)}>{child.name}</Checkbox>)
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
    return v.id <= 0 ?
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
        <Checkbox onChange={this.handleAllianceChangeSingle.bind(null, v)} checked={alliancePermissions.some((p) => {
          return p == v.id
        })}
        >{v.name}</Checkbox>
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
    let root = this.props.allianceTree.get(this.props.affair.get('allianceId'))
    const { getFieldDecorator } = this.props.form
    return (
      <Modal
        title="赋予新角色" onCancel={this.handleCancel} className={styles.adContainer} maskClosable={false}
        visible
        footer={[
          <Button key="au_cancel" className={styles.cancelBtn} onClick={this.handleCancel} type="ghost">取消</Button>,
          <Button key="au_ok" className={styles.okBtn} type="primary" onClick={this.handleOk}>确定</Button>
        ]}
      >
        <div className={styles.leftPanel}>
          <div className={styles.withInput}>
            <div className={styles.show}>
              {member.avatar == '' ? <div className={styles.avatar}/> : <img src={member.avatar}/>}
              <div className={styles.info}>
                <div className={styles.username}>
                  <span className={styles.namelabel}>{member.username}</span>
                  {this.props.member.gender == 0 ? <MaleIcon height="12" fill="#2db7f5"/> : <FemaleIcon height="12" fill="#2db7f5"/>}
                </div>
                <div className={styles.rolename}>SuperID:{member.superid}</div>
              </div>
            </div>
            <Form>
              <Item className={styles.affairInput}>
                {getFieldDecorator('affair')(<TreeSelect treeDefaultExpandAll placeholder="请选择事务">
                  {this.createTreeNode(root)}
                </TreeSelect>)}
              </Item>
              <Item className={styles.roleInput}>{getFieldDecorator('roleTitle')(<Input placeholder="添加角色" />)}</Item>
            </Form>
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
  },
})

function mapStateToProps(state) {
  return {
    allianceTree: state.getIn(['alliance', 'allianceTree']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getAffairRoles: bindActionCreators(getAffairRoles, dispatch),
    getAffairInfo: bindActionCreators(getAffairInfo, dispatch),
    fetchUserRoleList: bindActionCreators(fetchUserRoleList, dispatch),
  }
}

export default Form.create()(connect(mapStateToProps, mapDispatchToProps)(NewRoleModal))
