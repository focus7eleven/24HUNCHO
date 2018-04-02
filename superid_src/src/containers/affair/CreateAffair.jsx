import React, { PropTypes } from 'react'
import { Modal, Form, Select, Button, Input, Popover, Tooltip, message } from 'antd'
import styles from './CreateAffair.scss'
import AffairAvatar from '../../components/avatar/AffairAvatar'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fetchAffairChildren, addAffairToList, getAffairInfo } from '../../actions/affair'
import { fetchUserRoleList } from '../../actions/user'
import config from '../../config'
import { Affair } from '../../models/Affair'
const Option = Select.Option
import messageHandler from 'messageHandler'
import { AddIcon, DeleteIcon } from 'svg'

const PUBLICTYPE_DESCRIPTION = [{
  name: '全网公开',
  description: '将事务发布到盟客网上'
}, {
  name: '盟内公开',
  description: '盟内所有成员都可以访问事务主页'
}, {
  name: '事务内公开',
  description: '事务成员可以访问事务'
}, {
  name: '私密',
  description: '只有本事务成员可以访问事务'
}]

const RULES = {
  affairName: {
    rules: [{
      required: true,
      min: 2,
      max: 15,
      message: '事务名为2-15个非空字符',
      pattern: /^([^\s]){2,15}$/
    }]
  },
  affairLogo: {
    rules: [{
      required: true,
      min: 1,
      max: 5,
      message: 'LOGO为1-5个非空字符',
      pattern: /^([^\s]){1,5}$/
    }]
  },
}

const FormItem = Form.Item
let CreateAffair = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired,
  },
  PropTypes: {
    parentAffair: PropTypes.object.isRequired, //创建事务的父事务
    visible: PropTypes.bool, //控制对话框
    onCloseModal: PropTypes.func, //回调函数，关掉对话框
  },
  getDefaultProps() {
    return {
      visible: true,
      onCloseModal: () => {},
    }
  },
  getInitialState() {
    return {
      loading: false,
      newAffair: new Affair({
        level: this.props.parentAffair.get('level') + 1,
        id: this.props.parentAffair.get('id'),
        allianceId: this.props.parentAffair.get('allianceId'),
      }),
      roleList: [],
      owner: null,
      managers: [],
      allianceName: '',
      searchText: '',
    }
  },
  componentDidMount(){
    const { affair } = this.props
    fetch(config.api.affair.role.affair_roles(), {
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      method: 'GET',
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.setState({
          roleList: json.data,
        })
      }
    })
    fetch(config.api.alliance.simple_info(this.props.parentAffair.get('allianceId')), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: this.props.parentAffair.get('id'),
      roleId: this.props.parentAffair.get('roleId'),
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.setState({
          allianceName: json.data[0].name,
        })
      }
    })
  },
  componentDidUpdate(preProps) {
    if (this.props.parentAffair.get('id') != preProps.parentAffair.get('id')) {
      this.setState(this.getInitialState())
    }
  },

  handleCreate() {
    const { getFieldValue, getFieldError, resetFields, validateFields } = this.props.form

    validateFields((errors) => {
      if (errors) {
        return
      }

      const parentAffair = this.props.parentAffair
      if (!getFieldError('affairName') && !getFieldError('affairLogo')) {
        this.setState({
          loading: true
        })
        let managers = []
        this.state.managers.map((v) => {
          if (v.roleId){
            managers.push(v.roleId)
          }
          else {
            managers.push(0)
          }
        })
        const body = {
          name: getFieldValue('affairName'),
          logo: getFieldValue('affairLogo'),
          publicType: parseInt(getFieldValue('publicType')),
          directorRoleId: this.state.owner ? this.state.owner.roleId : 0,
          adminRoleIdList: managers,
        }
        const { affair } = this.props
        /*
        * 这里affairId为需要被创建子事务的事务id，roleId为当前选择的角色id
        */
        fetch(config.api.affair.post(), {
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(body),
          affairId: this.props.parentAffair.get('id'),
          roleId: this.props.affair.get('roleId'),
          json: true,
        }).then((res) => {
          return res.json()
        }).then(messageHandler).then((res) => {
          const {
            code,
            data,
          } = res

          if (code === 0) {
            message.success('创建成功')
            this.props.addAffairToList(data, parentAffair)
            this.props.fetchAffairChildren(parentAffair.get('id'), affair.get('roleId'))
            this.props.fetchUserRoleList()
            resetFields()
            this.setState(this.getInitialState())
            this.props.onCloseModal()
          } else {
            this.setState({
              loading: false,
            })
          }
        })
      }
    })
  },
  //关闭对话框
  handleClose() {
    const { resetFields } = this.props.form
    resetFields()
    this.props.onCloseModal()
  },

  //输入事务logo
  inputAffairLogo(e) {

    const { newAffair } = this.state
    this.setState({
      newAffair: newAffair.set('shortName', e.target.value)
    })
  },
  handleNameInputChange(e) {

    const { newAffair } = this.state
    this.setState({
      newAffair: newAffair.set('name', e.target.value)
    })
  },

  handleAffairLogoOnBlur(e){
    e.target.value = e.target.value.replace(/\s+/g, '')
    const { newAffair } = this.state
    this.setState({
      newAffair: newAffair.set('shortName', e.target.value)
    })
  },
  handleNameInputOnBlur(e){
    e.target.value = e.target.value.replace(/\s+/g, '')
    const { newAffair } = this.state
    this.setState({
      newAffair: newAffair.set('name', e.target.value)
    })
  },
  choosepublicType(value) {
    const { newAffair } = this.state
    this.setState({
      newAffair: newAffair.set('publicType', value)
    })
  },
  renderMainRolePanel(key = -1) {
    return (
      <div className={styles.mainRolePanel}>
        <Input.Search
          placeholder={'搜索盟内角色'}
          value={this.state.searchText}
          onChange={(e) => this.setState({ searchText: e.target.value })}
          style={{ width: 200, height: 30, marginBottom: 10 }}
        />
        {
          this.state.roleList
            .filter((role) => this.state.searchText == '' ? true : `${role.roleTitle}－${role.username}`.includes(this.state.searchText))
            .map((v, k) => {
              return (
                <div key={k} className={styles.mainRole} onClick={key != -1 ? this.handleChooseManager.bind(null, v, key) : this.handleChooseOwner.bind(null, v)}>
                  <div className={styles.mainRoleAvatar}>
                    <img src={v.avatar} />
                  </div>
                  <div>{`${v.roleTitle} ${v.username}`}</div>
                </div>
              )
            })
        }
      </div>
    )
  },
  handleChooseOwner(v){
    this.setState({
      owner: v,
    })
  },
  handleChooseManager(chosen, key){
    let tmp = this.state.managers
    tmp.map((v, k) => {
      if (k == key){
        v.roleId = chosen.roleId
        v.username = chosen.username
        v.roleName = chosen.roleTitle
        v.superId = chosen.superId
        v.avatar = chosen.avatar
      }
    })
    this.setState({
      managers: tmp,
    })
  },
  handleShowOwnerPopover(visible){
    this.setState({
      showOwnerPopover: visible
    })
  },
  handleShowManagerPopover(k){
    if (k == this.state.showManagerPopover){
      this.setState({
        showManagerPopover: -1,
      })
    }
    else {
      this.setState({
        showManagerPopover: k
      })
    }
  },
  render() {
    const { getFieldDecorator } = this.props.form
    const { newAffair } = this.state

    return (
      <Modal
        wrapClassName={styles.createAffairModal}
        title="创建事务"
        visible
        onOK={this.handleCreate}
        onCancel={this.handleClose}
        maskClosable={false}
        footer={[
          <div key = {0}>
            <Button onClick={this.handleClose} type="ghost" key={1}>取消</Button>
            <Button type="primary" key = {2} loading={this.state.loading} onClick={this.handleCreate}>确定</Button>
          </div>
        ]}
      >
        <Form layout="horizontal" autoComplete={false}>
          <FormItem label={<span><span className={styles.require}>*&nbsp;</span>事务名称</span>} labelCol={{ span: 4, offset: 1 }} wrapperCol={{ span: 15, offset: 0 }} required>
            {getFieldDecorator(
              'affairName',
              { onChange: this.handleNameInputChange, rules: RULES.affairName.rules }
            )(<Input type="text" placeholder="2-15个非空字符" autoComplete={false} onBlur={this.handleNameInputOnBlur} />)}
          </FormItem>

          <div className={styles.affairLogo}>
            <div className={styles.affairAvatar}>
              <AffairAvatar affair={newAffair} sideLength={56} />
            </div>
            <div>
              <FormItem label={<span><span className={styles.require}>*&nbsp;</span>LOGO</span>} labelCol={{ span: 4, offset: 1 }} wrapperCol={{ span: 11, offset: 0 }}>
                {getFieldDecorator(
                  'affairLogo',
                  { initialValue: this.props.form.getFieldValue('affairName') ? this.props.form.getFieldValue('affairName').slice(0, 4) : null, onChange: this.inputAffairLogo, rules: RULES.affairLogo.rules }
                )(<Input type="text" size="large" placeholder="输入简称来定制logo，1-5个非空字符" onBlur={this.handleAffairLogoOnBlur}/>)}
              </FormItem>
            </div>
          </div>

          <FormItem label={<span><span className={styles.require}>*&nbsp;</span>公开性</span>} labelCol={{ span: 4, offset: 1 }} wrapperCol={{ span: 11, offset: 0 }}>
            <div>
              {getFieldDecorator('publicType', { initialValue: newAffair.get('publicType').toString() })(
                <Select
                  dropdownMatchSelectWidth={false}
                  onSelect={this.choosepublicType}
                  className={styles.select}
                >
                  {PUBLICTYPE_DESCRIPTION.map((value, index) => (
                    <Option value={index.toString()} key={'publicType_' + index}>
                      <div>
                        <div className={'u-text-14'}>{value.name}</div>
                      </div>
                    </Option>
                  ))}
                </Select>
              )}
            </div>
          </FormItem>
          <FormItem label="添加角色" labelCol={{ span: 4, offset: 1 }} wrapperCol={{ span: 19, offset: 0 }}>
            <div className={styles.official}>
              <div className={styles.left}>
                <span className={styles.rolename}>负责人</span>
                <span className={styles.affairname}>{this.props.form.getFieldValue('affairName')}</span>
              </div>
              <div className={styles.right}>
                {this.state.owner ?
                  <div className={styles.owner}>
                    <span>担任者:</span>
                    {this.state.owner.avatar ?
                      <Tooltip placement="top" title={this.state.owner.roleTitle == '' ? `${this.state.owner.username} ${this.state.ownersuperId}` : `${this.state.owner.roleTitle} ${this.state.owner.username}`}>
                        <div className={styles.avatarContainer}>
                          <img src={this.state.owner.avatar} className={styles.avatar}/>
                          <div className={styles.mask} onClick={() => {this.setState({ owner: null })}}><AddIcon fill="#fff" /></div>
                        </div>
                      </Tooltip>
                    :
                      <Tooltip placement="top" title={this.state.owner.roleTitle == '' ? `${this.state.owner.username} ${this.state.owner.superId}` : `${this.state.owner.roleTitle} ${this.state.owner.username}`}>
                        <div className={styles.avatarContainer}>
                          <div className={styles.avatar} style={{ backgroundColor: '#e9e9e9' }} />
                          <div className={styles.mask} onClick={() => {this.setState({ owner: null })}}><AddIcon fill="#fff" /></div>
                        </div>
                      </Tooltip>
                    }
                  </div>
                :
                  <Popover overlayClassName={styles.officialPopover} placement="bottom" content={this.renderMainRolePanel()} trigger="click" visible={this.state.showOwnerPopover} onVisibleChange={this.handleShowOwnerPopover}>
                    <Button type="ghost">添加担任者</Button>
                  </Popover>
                }
              </div>
            </div>
            {
              this.state.managers.map((v, k) => {
                return <div className={styles.official} style={{ border: '1px dashed #d9d9d9' }} key={k}>
                  <div className={styles.left}>
                    <span className={styles.rolename}>管理员</span>
                    <span className={styles.affairname}>{this.props.form.getFieldValue('affairName')}</span>
                  </div>
                  <div className={styles.right} style={{ paddingRight: '5px' }}>
                    {v.roleId ?
                      <div className={styles.owner}>
                        <span>管理员:</span>
                        {v.avatar ?
                          <Tooltip placement="top" title={v.roleName == '' ? `${v.username} ${v.superId}` : `${v.roleName} ${v.username}`}>
                            <div className={styles.avatarContainer}>
                              <img src={v.avatar} className={styles.avatar}/>
                            </div>
                          </Tooltip>
                        :
                          <Tooltip placement="top" title={v.roleName == '' ? `${v.username} ${v.superId}` : `${v.roleName} ${v.username}`}>
                            <div className={styles.avatarContainer}>
                              <div className={styles.avatar} style={{ backgroundColor: '#e9e9e9' }} />
                            </div>
                          </Tooltip>
                        }
                      </div>
                    :
                      <Popover overlayClassName={styles.officialPopover} placement="bottom" content={this.renderMainRolePanel(k)} trigger="click" visible={this.state.showManagerPopover == k} onVisibleChange={this.handleShowManagerPopover.bind(null, k)}>
                        <Button type="ghost">添加担任者</Button>
                      </Popover>
                    }
                    <DeleteIcon
                      fill="#cccccc"
                      height="12px"
                      onClick={() => {
                        this.setState({ managers: this.state.managers.filter((m) => {return v.id != m.id}) })
                      }}
                    />
                  </div>
                </div>
              })
            }
            <span
              className={styles.add}
              onClick={() => {
                let managerList = this.state.managers
                managerList.push({ id: this.state.managers.length + 1 })
                this.setState({ managers: managerList })
              }}
            >
              +&nbsp;添加管理员
            </span>
          </FormItem>
        </Form>
      </Modal>
    )
  }
})

function mapStateToProps(state) {
  return {
    affair: state.getIn(['affair', 'affairMap', window.location.pathname.split('/')[3]]),
  }
}
function mapDispatchToProps(dispatch) {
  return {
    fetchAffairChildren: bindActionCreators(fetchAffairChildren, dispatch),
    addAffairToList: bindActionCreators(addAffairToList, dispatch),
    getAffairInfo: bindActionCreators(getAffairInfo, dispatch),
    fetchUserRoleList: bindActionCreators(fetchUserRoleList, dispatch),
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(CreateAffair))
