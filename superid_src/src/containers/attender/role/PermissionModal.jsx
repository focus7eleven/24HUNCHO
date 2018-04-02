import React from 'react'
import { connect } from 'react-redux'
import styles from './PermissionModal.scss'
import AuthEditor from '../../../components/auth/AuthEditor'
import { Modal, Button, Select, Checkbox, message } from 'antd'
import { fromJS, List } from 'immutable'
import config from '../../../config'
import messageHandler from 'messageHandler'
const Option = Select.Option

const NULL_IDENTITY = fromJS({
  id: -1,
  name: '无',
})

const equals = (al, bl) => {
  return al.size == bl.size && al.every((a) => (bl.includes(a)))
}

const PROCESS = {
  DEFAULT: 0, //修改权限模态框
  SET_IDENTITY: 1, //确认权限设置为已有身份
  NEW_IDENTITY: 2, //确认权限设置为新身份
}
const NEW_IDENTITY = '新建身份'
const PermissionModal = React.createClass({
  getInitialState(){
    return {
      permissionList: List(),
      modifiedPermissionList: List(),
      identityList: List(),
      process: PROCESS.DEFAULT,
      modifiable: false,
      selectedIdentity: NULL_IDENTITY,
      popoverVisible: false,
      useExistIdentity: false,
      isLoading: false,
    }
  },
  componentWillMount(){
    const { affair, member } = this.props
    //访问事务身份模板列表
    fetch(config.api.permission.alliance(affair.get('allianceId')), {
      method: 'GET',
      json: true,
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        const identityList = fromJS(json.data)
        //访问个人权限
        fetch(config.api.permission.role(member.belongAffairId, member.roleId), {
          method: 'GET',
          json: true,
          affairId: affair.get('id'),
          roleId: affair.get('roleId'),
        }).then((res) => res.json()).then(messageHandler).then((json) => {
          if (json.code == 0) {
            const defaultIdentity = identityList.find((obj) => (obj.get('defaultIdentity') == true))

            const data = json.data
            const useIdentity = data.useIdentity
            // 如果角色使用了身份，则在身份列表中找到对应的身份， 否则
            if (useIdentity) {
              const identityId = data.identityId
              const identity = identityList.find((identity) => (identity.get('id') == identityId))
              const permissionList = identity.get('permissionCategory')
              this.setState({
                identityList: identityList,
                defaultIdentity: defaultIdentity,
                permissionList: permissionList,
                modifiedPermissionList: permissionList,
                selectedIdentity: identity,
                useExistIdentity: true,
                userDefaultIdentity: identity,
              })
            } else {
              const permissionList = fromJS(data.permissionList)
              this.setState({
                identityList: identityList,
                defaultIdentity: defaultIdentity,
                permissionList: permissionList,
                modifiedPermissionList: permissionList,
                selectedIdentity: NULL_IDENTITY,
                userDefaultIdentity: NULL_IDENTITY,
              })
            }
          }
        })
      }
    })
  },
  /*
  * 将角色身份设置为某一已存在模板
  */
  onSetIdentity(){
    const { affair, member } = this.props
    const { modifiedPermissionList } = this.state
    const identityId = this.getIdentityId(modifiedPermissionList)
    fetch(config.api.permission.setRole(member.belongAffairId, member.roleId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: member.roleId,
      body: JSON.stringify({
        identityId: identityId,
      }),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        message.success('修改成功', 0.5)
        this.onHide()
      }
    })
  },
  /*
  * 将角色身份设置为新模板
  */
  onNewIdentity(){
    const { affair, member } = this.props
    const { modifiedPermissionList, newIdentityName } = this.state
    // 先创建一个身份模板
    fetch(config.api.permission.alliance(affair.get('allianceId')), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      body: JSON.stringify({
        name: newIdentityName,
        permissionCategory: modifiedPermissionList.toJS(),
      }),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        const identityId = json.data.identityId
        // 将角色设置为对应的新模板
        fetch(config.api.permission.role(member.belongAffairId, member.roleId), {
          method: 'POST',
          json: true,
          affairId: affair.get('id'),
          roleId: affair.get('roleId'),
          resourceId: member.roleId,
          body: JSON.stringify({
            identityId: identityId,
          }),
        }).then((res) => res.json()).then(messageHandler).then((json) => {
          if (json.code == 0) {
            message.success('修改成功', 0.5)
            this.onHide()
          }
        })
      }
    })
  },
  /*
  * 修改身份模板，（后端）将关联角色的权限进行更新
  */
  onModifyIdentity(){
    this.setState({ isLoading: true })
    const { affair, member } = this.props
    const { modifiedPermissionList, useExistIdentity, selectedIdentity } = this.state

    let body = {}
    if (useExistIdentity) {
      body.identityId = selectedIdentity.get('id')
    } else {
      body.permissionList = modifiedPermissionList.toJS()
    }
    fetch(config.api.permission.setRole(member.belongAffairId, member.roleId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: member.roleId,
      body: JSON.stringify(body),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      this.setState({ isLoading: false })
      if (json.code == 0) {
        message.success('修改成功', 0.5)
      }
      if (json.code == 0 || json.code == 20000) {
        this.onHide()
      }
    })
  },
  onHide(){
    this.props.onCancel()
  },
  /*
  * 选择是否使用已有身份的监听
  */
  onCheckUseExistIdentity(e){
    const checked = e.target.checked
    if (checked) {
      this.setState({
        useExistIdentity: false,
        modifiable: true,
      })
    } else {
      this.setState({
        useExistIdentity: true,
        modifiable: true,
      }, () => this.onSelectIdentity(this.state.selectedIdentity.get('name')))
    }
  },
  /*
  * 选择身份的监听
  */
  onSelectIdentity(value){
    const { identityList } = this.state
    const identity = identityList.find((obj) => (obj.get('name') == value))
    if (identity != null) {
      this.setState({
        modifiedPermissionList: identity.get('permissionCategory'),
        selectedIdentity: identity,
        modifiable: true,
      })
    }
  },
  onAuthChange(permissionList){
    this.setState({
      modifiedPermissionList: fromJS(permissionList),
      modifiable: true,
    })
  },
  getIdentityDisplayName(permissionList){
    const { identityList } = this.state
    const identity = identityList.find((identity) => (equals(identity.get('permissionCategory'), permissionList)))
    return identity == null ? NEW_IDENTITY : identity.get('name')
  },
  getIdentityId(permissionList){
    const { identityList } = this.state
    const identity = identityList.find((identity) => (equals(identity.get('permissionCategory'), permissionList)))
    return identity == null ? -1 : identity.get('id')
  },
  renderEditPermissionModal(){
    const { member } = this.props
    return (
      <Modal
        maskClosable={false}
        visible
        title="权限设置"
        wrapClassName={styles.permissionModal}
        footer={[
          <Button key="cancel" type="ghost" onClick={this.onHide}>取消</Button>,
          <Button key="submit" type="primary" onClick={this.onModifyIdentity} disabled={!this.state.modifiable} loading={this.state.isLoading}>修改</Button>
        ]}
        width={500}
        onCancel={this.onHide}
      >
        <div className={styles.top}>
          <div className={styles.left}>
            <div className={styles.avatar} style={{ backgroundImage: `url(${member.avatar})` }} />
            <span className={styles.roleName}>{member.roleTitle}</span>
            <span>{member.username}</span>
            <Select style={{ width: 120, height: 26 }} disabled={!this.state.useExistIdentity} value={this.state.selectedIdentity.get('name')} onSelect={this.onSelectIdentity}>
              {
                this.state.identityList.map((identity, index) => {
                  const name = identity.get('name')
                  return (
                    <Option key={`${index}`} value={name}>{name}</Option>
                  )
                })
              }
            </Select>
          </div>
          <div className={styles.right}>
            <Checkbox checked={!this.state.useExistIdentity} onChange={this.onCheckUseExistIdentity} />
            <span className={styles.key}>自定义</span>
          </div>
        </div>
        <AuthEditor
          disabled={this.state.useExistIdentity}
          permissionList={this.state.permissionList}
          modifiedPermissionList={this.state.modifiedPermissionList}
          onChange={this.onAuthChange}
        />
      </Modal>
    )
  },
  render(){
    const modal = this.renderEditPermissionModal()
    return (
      modal
    )
  }
})

function mapStateToProps(state){
  return {
    defaultPermissionList: state.getIn(['auth', 'defaultPermissionList'], List()),
  }
}
export default connect(mapStateToProps)(PermissionModal)
