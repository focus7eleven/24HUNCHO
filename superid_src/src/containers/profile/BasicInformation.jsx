import React from 'react'
import { connect } from 'react-redux'
import { Form, Input, Button, Radio, Dropdown, message, Icon } from 'antd'
import { CloseIcon } from 'svg'
import { List } from 'immutable'
import styles from './BasicInformation.scss'
import UserAvatarModal from './modal/UserAvatarModal'
import EditableTagGroup from '../../components/tag/EditableTagGroup'
import Location from '../../components/address/Location'
import SuperIDChangeModal from './modal/SuperIDChangeModal'
import messageHandler from 'messageHandler'

const FormItem = Form.Item
const RadioGroup = Radio.Group

const EDIT_MODE = {
  NONE: -3,
  REALNAME: -2,
  NEW_NICKNAME: -1,
  EDIT_NICKNAME: (value) => (value),
}
const NameMenu = React.createClass({
  getInitialState(){
    return {
      realName: '',
      nicknames: [],
      editMode: EDIT_MODE.NONE,
      validateStatus: 'success',
      help: '',
    }
  },
  setEditMode(editMode){
    this.setState({ editMode: editMode })
  },
  onInputNickName(e) {
    const value = e.target.value
    const regPattern = /^[\u4E00-\u9FA50-9a-zA-Z]{2,12}$/
    if (regPattern.test(value)) {
      this.setState({
        validateStatus: 'success',
        help: '',
      })
    } else {
      this.setState({
        validateStatus: 'error',
        help: '请输入2-12位数字、字母、汉字组合'
      })
    }
  },
  handleAddNickName(){
    if (this.state.validateStatus !== 'success') {
      return
    }
    const nickName = this.editInput.refs.input.value
    this.props.onAddNickName(nickName)
  },
  handleDeleteNickName(nickName){
    this.props.onDeleteNickName(nickName)
  },
  handleSetUsername(username){
    this.props.onSetUserName(username)
  },
  renderEditInput(){
    return (
      <div className={styles.inputGroup}>
        <Form>
          <FormItem validateStatus={this.state.validateStatus} help={this.state.help}>
            <Input ref={(el) => {this.editInput = el}} onChange={this.onInputNickName} onPressEnter={this.handleAddNickName} />
            <Button type="primary" onClick={this.handleAddNickName}>保存</Button>
          </FormItem>
        </Form>
      </div>
    )
  },
  render(){
    const realName = this.props.user.get('realname')
    const nicknames = this.props.user.get('nicknames') || []
    const { editMode } = this.state
    return (
      <div className={styles.nameMenuWrapper}>
        <div className={styles.nameMenu}>
          <div className={styles.group}>
            <div className={styles.titleGroup}>
              <div className={styles.title}>真实姓名：</div>
            </div>
            <div className={styles.value} onClick={() => this.handleSetUsername(realName)}>
              {realName}
            </div>
          </div>
          <div className={styles.group}>
            <div className={styles.titleGroup}>
              <div className={styles.title}>昵称：</div>
              <div className={styles.linkButton} onClick={() => {this.setState({ editMode: EDIT_MODE.NEW_NICKNAME })}}>+ 添加昵称</div>
            </div>
            <div className={styles.valueGroup}>
              {editMode == EDIT_MODE.NEW_NICKNAME &&
                this.renderEditInput()
              }
              {(nicknames.length == 0 && editMode != EDIT_MODE.NEW_NICKNAME) &&
              <div className={styles.noValue}>
                  无昵称
              </div>
              }
              {
                nicknames.map((value, index) => {
                  return (
                    <div key={index} className={styles.value}>
                      <span onClick={() => {this.handleSetUsername(value)}} >{value}</span>
                      <span onClick={() => {this.handleDeleteNickName(value)}}><CloseIcon /></span>
                    </div>
                  )
                })
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
})

const BasicInformation = React.createClass({
  getInitialState() {
    return {
      editingAvatar: false, // 用户处于修改头像的界面。
      showSuperIDModal: false, //是否处于修改superIDmodal
    }
  },
  onAddNickName(nickName){

    let nicknames = this.props.user.get('nicknames') || List()
    nicknames = List.isList(nicknames) ? nicknames.toJS() : nicknames
    nicknames.unshift(nickName)
    this.updateUser({
      nicknames: nicknames.reduce((prev, current) => (`${prev},${current}`)),
    }).then(() => {
      this.nameMenu.setEditMode(EDIT_MODE.NONE)
    })
  },
  onDeleteNickName(nickName){
    const { user } = this.props
    let nicknames = this.props.user.get('nicknames') || []
    nicknames.splice(nicknames.indexOf(nickName), 1)
    nicknames = nicknames.filter((v) => v !== nickName)

    this.updateUser({
      nicknames: nicknames.size > 0 || nicknames.length > 0 ? nicknames.reduce((prev, current) => (`${prev},${current}`)) : null,
      username: nickName == user.get('username') ? user.get('realname') : user.get('username')
    }).then(() => {
      this.nameMenu.setEditMode(EDIT_MODE.NONE)
    })
  },
  onSetUserName(username){
    this.updateUser({
      username: username,
    }).then(() => {
      this.nameMenu.setEditMode(EDIT_MODE.NONE)
    })
  },
  handleChangeGender(e){
    const gender = e.target.value
    this.updateUser({
      gender: gender
    })
  },
  handleChangeAddress(address) {
    this.updateUser({
      address: address.join('/')
    })
  },

  handleChangeTags(tags){
    this.updateUser({
      tags: tags,
    })
  },

  updateUser(userInfo){
    return this.props.updateUser(userInfo)
      .then((res) => res.response)
      .then(messageHandler)
      .then((json) => {
        if (json.code == 0) {
          message.success('修改已保存', 0.5)
        }
        return json
      })
  },
  // 昵称表单项验证
  getNameFieldDecorator() {
    const that = this

    return this.props.form.getFieldDecorator('name', {
      initialValue: this.props.username,
      onChange() {
        that.setState({
          touchedUserName: true,
        })
      },
      validate: [{
        rules: [{
          required: true,
          message: '请输入一个昵称',
        }],
        trigger: ['onBlur', 'onChange'],
      }, {
        rules: [{
          max: 12,
          message: '用户名不能超过 12 个字符',
        }],
        trigger: ['onBlur', 'onChange'],
      }],
    })
  },
  // 对生日的选择范围进行限制。
  disabledBirthday(current) {
    return current.getTime() > Date.now() || current.getTime() < -2208988800000
  },
  render() {
    const {
      user,
      form: {
        getFieldDecorator,
      },
    } = this.props
    return (
      <div>
        <Form layout="horizontal" className={styles.container}>
          {/* 修改头像 */}
          <UserAvatarModal >
            <div className={styles.imageWrapper}>
              <img src={user.get('avatar')} />
              <div>修改头像</div>
            </div>
          </UserAvatarModal>

          {/* 用户昵称 */}
          <FormItem label="用户名">
            <Dropdown
              overlay={
                <NameMenu
                  ref={(el) => {this.nameMenu = el}}
                  user={user}
                  onAddNickName={this.onAddNickName}
                  onDeleteNickName={this.onDeleteNickName}
                  onSetUserName={this.onSetUserName}
                />
              }
              trigger={['click']}
              onVisibleChange={(visible) => {
                if (visible == true && this.nameMenu) {
                  this.nameMenu.setEditMode(EDIT_MODE.NONE)
                }
              }}
            >
              <div className={styles.nameInputWrapper}>
                <Input size="large" readOnly value={this.props.username} />
                <Icon type="down" />
              </div>
            </Dropdown>
          </FormItem>

          {/* 用户性别 */}
          <FormItem label="性别">
            {getFieldDecorator('gender', { initialValue: user.get('gender') })(
              <RadioGroup onChange={this.handleChangeGender} className={styles.genderRadioGroup}>
                <Radio value={1}>男</Radio>
                <Radio value={2}>女</Radio>
                <Radio value={0}>保密</Radio>
              </RadioGroup>
            )}
          </FormItem>

          {/* superId */}
          <FormItem label="SuperID">
            {user.get('superid')}
            <div className={styles.linkButton} onClick={() => this.setState({ showSuperIDModal: true })}>申请变更</div>
          </FormItem>

          {/* 地区 */}
          <FormItem label="地区">
            <Location
              defaultValue={(user.get('address') || '').split('/')}
              onChange={this.handleChangeAddress}
              placeholder="请选择地区"
              showSearch
            />
          </FormItem>


          <FormItem label="标签">
            <EditableTagGroup
              className={styles.labelGroupItem}
              tags={user.get('tags') || []}
              onTagsChange={(tags) => {this.handleChangeTags(tags)}}
              distinctWarning
            />
          </FormItem>

        </Form>

        {this.state.showSuperIDModal ?
          <SuperIDChangeModal superId={user.get('superid')} cancelCallback={() => this.setState({ showSuperIDModal: false })}/>
        :
          null
        }
      </div>
    )
  },
})

export default Form.create()(connect((state) => ({
  username: state.get('user').get('username'),
}))(BasicInformation))
