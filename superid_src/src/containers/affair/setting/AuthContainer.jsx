import React from 'react'
import { connect } from 'react-redux'
import { Button, Input, message } from 'antd'
import { fromJS, List } from 'immutable'
import styles from './AuthContainer.scss'
import AuthEditor from '../../../components/auth/AuthEditor'
import messageHandler from 'messageHandler'
import config from '../../../config'
import PERMISSION from 'utils/permission'

const EDIT_MODE = {
  DEFAULT: 0,
  CREATE: 1,
}
const AuthContainer = React.createClass({
  getInitialState(){
    return {
      editMode: EDIT_MODE.DEFAULT,
      selectedIdentityId: 0,
      newIdentityName: '',
      identityList: List(),
      permissionList: List(),
      modifiedPermissionList: List(),
      isLoading: false,
    }
  },
  componentWillMount(){
    fetch(config.api.permission.alliance(this.props.affair.get('allianceId')), {
      method: 'GET',
      json: true,
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        const identityList = fromJS(json.data)
        this.setState({
          identityList: identityList
        }, () => this.onClickIdentity(identityList.get(0)))
      }
    })
  },
  onClickIdentity(identity){
    const permissionList = fromJS(identity.get('permissionCategory'))
    this.setState({
      editMode: EDIT_MODE.DEFAULT,
      newIdentityName: '',
      selectedIdentityId: identity.get('id'),
      permissionList: permissionList,
      modifiedPermissionList: permissionList,
    })
  },
  onClickCreateIdentity(){
    this.setState({
      editMode: EDIT_MODE.CREATE,
      permissionList: this.props.defaultPermissionList,
      modifiedPermissionList: this.props.defaultPermissionList,
      selectedIdentityId: 0,
    })
  },
  onChangeNewIdentityName(e){
    this.setState({
      newIdentityName: e.target.value,
    })
  },
  onAuthChange(permissionList) {
    this.setState({
      modifiedPermissionList: fromJS(permissionList),
    })
  },
  onCancelEdit() {
    const { selectedIdentityId, identityList } = this.state
    const identity = identityList.find((item) => item.get('id') == selectedIdentityId) || identityList.get(0)
    this.onClickIdentity(identity)
  },
  onSaveIdentitySetting() {
    this.setState({ isLoading: true })
    const { affair } = this.props
    const { editMode, modifiedPermissionList, selectedIdentityId, newIdentityName, identityList } = this.state
    // 默认模式下修改盟身份， 创建模式下新建一个盟身份
    if (editMode == EDIT_MODE.DEFAULT) {
      fetch(config.api.permission.identity(affair.get('allianceId'), selectedIdentityId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        body: JSON.stringify({
          permissionCategory: modifiedPermissionList.toJS(),
        }),
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code == 0) {
          message.success('修改成功', 0.5)
          this.setState({
            permissionList: modifiedPermissionList,
            isLoading: false,
          })
        }
      })
    } else {
      if (newIdentityName == null || newIdentityName == '') {
        message.error('请输入身份名称')
        this.createInput && this.createInput.focus()
        return
      }
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
          message.success('创建成功', 0.5)
          // 直接根据现有数据生成一个身份，不需要从后端拿
          this.setState({
            editMode: EDIT_MODE.DEFAULT,
            newIdentityName: '',
            selectedIdentityId: json.data,
            identityList: identityList.push(fromJS({
              id: json.data,
              allianceId: affair.get('allianceId'),
              name: newIdentityName,
              permissionCategory: modifiedPermissionList.toJS(),
              superIdentity: false,
              defaultIdentity: false,
            })),
            isLoading: false,
          })
        }
      })
    }
  },
  render() {
    const { affair } = this.props
    return (
      <div className={styles.container}>
        <div className={styles.row}>
          <div className={styles.titleText}>盟权限身份：</div>
          <div className={styles.titleText}>权限设置：</div>
        </div>
        <div className={styles.row}>
          <div className={styles.identityGroup}>
            {this.state.identityList.map((identity) => {
              const active = this.state.selectedIdentityId == identity.get('id')
              return (
                <div
                  key={identity.get('id')}
                  className={active ? `${styles.identity} ${styles.identitySelected}` : styles.identity}
                  onClick={() => this.onClickIdentity(identity)}
                >
                  {identity.get('name')}
                </div>
              )
            })}
            {affair.validatePermissions(PERMISSION.CREATE_AUTH_ROLE) && (
              this.state.editMode == EDIT_MODE.DEFAULT ?
                <div className={styles.identityAdd} onClick={this.onClickCreateIdentity}>+ 创建新身份</div>
              : (
                <div className={styles.identityInputWrapper}>
                  <Input
                    value={this.state.newIdentityName}
                    onChange={this.onChangeNewIdentityName}
                    placeholder="输入身份名称"
                    ref={(el) => this.createInput = el}
                  />
                </div>
              )
            )}
          </div>
          <div className={styles.settingContainer}>
            <div className={styles.settingPane}>
              <AuthEditor
                showHistory={this.state.editMode == EDIT_MODE.DEFAULT}
                permissionList={this.state.permissionList}
                modifiedPermissionList={this.state.modifiedPermissionList}
                onChange={this.onAuthChange}
                disabled={!affair.validatePermissions(PERMISSION.MODIFY_AUTH_ROLE)}
              />
            </div>
            {affair.validatePermissions(PERMISSION.MODIFY_AUTH_ROLE) &&
              <div className={styles.footer}>
                <div className={styles.buttonGroup}>
                  <Button size="large" type="ghost" onClick={this.onCancelEdit}>取消</Button>
                  <Button size="large" type="primary" onClick={this.onSaveIdentitySetting}>保存</Button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    )
  }
})

function mapStateToProps(state){
  return {
    defaultPermissionList: state.getIn(['auth', 'defaultPermissionList'], List()),
  }
}
export default connect(mapStateToProps)(AuthContainer)
