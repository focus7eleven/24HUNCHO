import React from 'react'
import { connect } from 'react-redux'
import { Modal, Form, Input, DatePicker, Select, Menu, Dropdown, Button, Tooltip, Popover, Row, Col } from 'antd'
import messageHandler from 'messageHandler'
import oss from 'oss'
import { List, fromJS, Map } from 'immutable'
import moment from 'moment'
import { getFileIcon } from 'file'
import styles from './EditTaskModal.scss'
import config from '../../../config'
import { workStateList, WORK_PRIOS, KEY_STATES, TASK_TYPE, TASK_TYPES, WORK_STATE } from '../constant/AnnouncementConstants'
import { SingleRoleSelector, BriefRoleSelector } from 'components/role/RoleSelector'
import { TEMPLATE_ATTRS } from '../inner/InnerAnnouncement'
import { ICReleaseWorkIcon, ICReleaseMeetingIcon, ICReleaseMemorandumIcon, MoreIcon, SprigDownIcon, TrashIcon, FlagIcon } from 'svg'

import AddAttachmentModal from './AddAttachmentModal'
import RoleItem from 'components/role/RoleItem'

//操作类型
const OPT_TYPE = {
  // EDIT: 0,
  DELETE: 1,
  ADD_ATTACHMENT: 2,
  CANCEL_MEETING: 3,
}
const FormItem = Form.Item
const TextArea = Input.TextArea
const Option = Select.Option
const Item = Menu.Item

//创建工作 修改工作 modal
const EditTaskModal = React.createClass({
  getDefaultProps(){
    return {
      announcement: null, //在这个发布中创建工作
      affair: null, //在这个事务中创建发布
      task: null, // 被编辑的工作，初始化表单的数据。
      onCancelCallback: () => {},
      submitCallback: () => {},
    }
  },

  getInitialState() {
    return {
      title: {
        isEdit: false,
        error: '',
        value: '',
      },
      isLoading: true,
      task: null,

      coopSelectorError: '',

      showAddAttachmentModal: false,

      officialList: this.props.officialList,
      guestList: this.props.guestList,
      selectedCoopList: List(),
      selectedResp: null,
      roleList: fromJS([]),


      canModify: this.props.permission.some((v) => v === 508),
    }
  },

  componentWillMount() {
    this.fetchTaskDetail()
  },

  fetchTaskDetail() {
    const { taskId, affair } = this.props
    const { selectedCoopList } = this.state
    // const { task } = this.state
    fetch(config.api.announcement.detail.task.get(taskId), {
      method: 'GET',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code === 0) {
        const task = fromJS(res.data)
        this.setState({
          task,
          ...this.state.task,
          isLoading: false,
          selectedResp: this.state.selectedResp ? this.state.selectedResp : task.get('ownerRole'),
          selectedCoopList: selectedCoopList.size != 0 ? selectedCoopList : task.get('joinRoles'),

        }, () => {
          this.handleFetchOfficialRoleCandidates()
        })
      }

    })
  },

  getResponsorCandidates() {
    const {
      affair,
    } = this.props
    const {
      canModify,
      officialList,
      guestList
    } = this.state
    const isOfficial = officialList.find((v) => v.get('roleId') === affair.get('roleId')) ? true : false
    if (canModify && isOfficial) {
      // 若操作者为官方，则可以为官方/客方创建工作。
      return officialList.concat(guestList)
    } else {
      // 否则，只可以为自己创建工作。
      return guestList.filter((v) => v.get('roleId') === affair.get('roleId'))
    }
  },
  getCooperatorCandidates() {
    return this.state.roleList
  },
  handleFetchOfficialRoleCandidates() {
    const { affair } = this.props
    fetch(config.api.affair.role.main_roles(true), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          roleList: fromJS(json.data || []),
        })
      }
    })
  },
  handleFormSubmit(){
    const { validateFields } = this.props.form
    const {
      selectedResp,
      selectedCoopList,
      title,
      task,
    } = this.state

    const type = task.get('type')

    if (title.error) {
      return
    }

    if (type == TASK_TYPE.WORK && !selectedResp || type == TASK_TYPE.MEETING && !selectedCoopList) {
      return
    }

    let fieldNames = []
    switch (task.get('type')){
      case TASK_TYPE.WORK:
        fieldNames = ['priority', 'state', 'duration', 'note']
        break
      case TASK_TYPE.MEETING:
        fieldNames = ['beginTime', 'lastTime', 'address', 'note']
        break
      case TASK_TYPE.MEMO:
        fieldNames = ['note']
        break
    }

    validateFields(fieldNames, (err, value) => {
      if (err) {
        return
      }

      let newTask = value
      newTask.title = title.value || task.get('name') // 修改后的任务名称
      if (type == TASK_TYPE.WORK) {
        //工作需要添加负责人和协作者
        newTask.ownerRoleId = selectedResp ? selectedResp.get('roleId') : null
        newTask.roleIds = selectedCoopList.map((v) => {
          return v.get('roleId')
        }).toJS()
        newTask.beginTime = value.duration[0].valueOf()
        newTask.offTime = value.duration[1].valueOf()
        delete newTask.duration

      } else if (type == TASK_TYPE.MEETING) {
        //会议需要添加参与人
        newTask.roleIds = selectedCoopList.map((v) => {
          return v.get('roleId')
        }).toJS()
      }
      // 备忘有note即可（再value里）

      this.props.onChangeCallback(task.get('announcementTaskId'), newTask, task.get('type'))

    })
  },

  handleChangeRespRole(role){
    const selectedResp = role
    const selectedCoopList = this.state.selectedCoopList.filter((v) => {return v.get('roleId') !== role.get('roleId')})

    this.setState({
      selectedResp,
      selectedCoopList,
    })
  },

  handleChangeCoopRole(selected){
    const { selectedResp } = this.state

    this.setState({
      selectedCoopList: selected,
      selectedResp: selectedResp && selected.some((v) => v.get('roleId') === selectedResp.get('roleId')) ? null : selectedResp
    })
  },

  handleOptTask({ key }){
    if (key == OPT_TYPE.DELETE) {
      //删除任务
      this.handleDeleteTask()
    } else if (key == OPT_TYPE.ADD_ATTACHMENT) {
      //添加附件
      this.setState({
        showAddAttachmentModal: true,
      })
    } else if (key == OPT_TYPE.CANCEL_MEETING){
      //取消会议
      this.props.onChangeCallback(
        this.state.task.get('announcementTaskId'),
        {
          state: WORK_STATE.CANCELED
        },
        TASK_TYPE.MEETING
      )
    }
  },
  handleDeleteTask(){
    const { affair, announcementId } = this.props
    const { task } = this.state
    const announcement = task.get('belongAnnouncement')
    fetch(config.api.announcement.detail.task.delete(task.get('announcementTaskId'), announcement.get('id')), {
      method: 'POST',
      affairId: affair.get('id'),
      resourceId: announcementId,
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0){
        this.props.submitCallback()
      }
    })
  },

  handleDeleteFile(file) {
    const { affair } = this.props
    return fetch(config.api.announcement.detail.task.attachment.delete(file.get('fileId')), {
      method: 'POST',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {

        this.fetchTaskDetail()
      }
    })
  },

  onRemarkInput(e) {
    const length = e.target.value.length

    this.textNum.innerHTML = `${length}/500`
    if (length > 500){
      this.textNum.style.color = 'red'
    } else {
      this.textNum.style.color = '#cccccc'
    }
  },
  handleKeyTask(){
    if (!this.state.canModify) {
      return
    }
    this.props.onKeyCallback().then((json) => {
      if (json.code == 0) {
        this.setState({
          task: this.state.task.merge(
            Map({
              keyState: json.data
            })
          )
        })
      }
    })

  },

  handleAddAttachment(){
    this.fetchTaskDetail()
    this.setState({
      showAddAttachmentModal: false
    })
  },

  getTypeIcon(type) {
    switch (type) {
      case TASK_TYPE.WORK:
        return <ICReleaseWorkIcon />
      case TASK_TYPE.MEETING:
        return <ICReleaseMeetingIcon />
      case TASK_TYPE.MEMO:
        return <ICReleaseMemorandumIcon />

    }
  },

  renderTitle() {
    const { permission } = this.props
    const {
      title,
      task,
      canModify,
    } = this.state
    const type = task.get('type')
    const optMenu = (
      <Menu mode="vertical" onClick={this.handleOptTask}>
        {canModify && <Item key={OPT_TYPE.ADD_ATTACHMENT}>添加附件</Item>}
        {canModify && type == TASK_TYPE.MEETING && <Item key={OPT_TYPE.CANCEL_MEETING}>取消会议</Item>}
        {permission.some((v) => v == 509) && <Item key={OPT_TYPE.DELETE}>删除{TASK_TYPES[type].text.slice(-2)}</Item>}
      </Menu>
    )

    return (
      <div className={styles.title}>
        <div className={styles.type}>
          <span className={styles.typeIcon} style={{ backgroundColor: TASK_TYPES[type].icon, height: 20, width: 20 }}>{this.getTypeIcon(type)}</span>
          {TASK_TYPES[type].text}
        </div>
        <div className={styles.divide} />
        {title.isEdit ?
          <Tooltip title={title.error} visible={title.error ? true : false} placement="topLeft">
            <Input.TextArea
              autosize
              defaultValue={title.value || task.get('name')}
              onChange={(e) => {
                let error = ''
                if (!e.target.value.trim()) {
                  error = '请输入任务名称'
                }
                this.setState({
                  title: {
                    ...title,
                    error,
                    value: e.target.value
                  }
                })
              }}
              onPressEnter={() => this.setState({ title: { ...title, isEdit: false } })}
              onBlur={() => this.setState({ title: { ...title, isEdit: false } })}
              className={styles.name}
              autoComplete="off"
            />
          </Tooltip>
          :
          <div className={styles.name} onClick={() => canModify && this.setState({ title: { ...title, isEdit: true, } })}>
            {title.value || task.get('name')}
          </div>

        }


        <span className={styles.options}>
          { canModify &&
            <Dropdown overlay={optMenu}>
              <MoreIcon id="more"/>
            </Dropdown>
          }

          {type == TASK_TYPE.WORK &&
            <FlagIcon className={styles.key} onClick={this.handleKeyTask} style={{ fill: KEY_STATES[task.get('keyState')].icon }}/>
          }
        </span>
      </div>
    )
  },

  renderHistoryRoles() {
    const { task } = this.state
    const historyRoles = task.get('historyOwnerRoles')
    return (
      historyRoles.size > 0 ?
        <Popover
          overlayClassName={styles.historyRolesContainer}
          placement="bottom"
          content={
            <div className={styles.historyRoleList}>
              {historyRoles.map((r, key) => {
                const role = {
                  avatar: r.get('avatar'),
                  roleTitle: r.get('roleTitle'),
                  roleName: r.get('username')
                }
                return <RoleItem key={key} role={role} />
              })}
            </div>
          }
        >
          <div className={styles.history}>
            <span className={styles.roleCount}>{historyRoles.size}</span>
            <span>历史负责人</span>
          </div>
        </Popover>
        :
        <div className={styles.history}>
          <span className={styles.roleCount}>{historyRoles.size}</span>
          <span>历史负责人</span>
        </div>


    )
  },



  render(){
    const { affair } = this.props

    const { getFieldDecorator } = this.props.form
    const {
      selectedCoopList,
      selectedResp,
      canModify,
      showAddAttachmentModal,
      task,
      isLoading,
    } = this.state

    if (isLoading) {
      return null
    }

    const announcement = task.get('belongAnnouncement')
    const attachments = task.getIn(['fileVO', 'urls'], List()).map((w, k) => fromJS({
      url: w,
      fileId: task.getIn(['fileVO', 'fileIds', k], List()),
    }))

    const type = task.get('type')
    const owner = {
      avatar: task.getIn(['ownerRole', 'avatar']),
      roleTitle: task.getIn(['ownerRole', 'roleTitle']),
      roleName: task.getIn(['ownerRole', 'username']),
    }


    const affairId = affair.get('id')
    const roleId = affair.get('roleId')

    const durationDecorator = getFieldDecorator('duration', {
      rules: [{
        type: 'array',
        required: true,
        message: '请选择时间',
      }],
      initialValue: task ? [moment(task.get('beginTime')), moment(task.get('offTime'))] : null,
    })

    const remarkDecorator = getFieldDecorator('note', {
      rules: [{
        max: 500,
        message: '备注最多500字！'
      }],
      initialValue: canModify && task ? task.get('note') : null,
    })


    const remarkNumStr = canModify && task ? `${task.get('note').length}/500` : '0/500'
    return (
      <Modal
        title={this.renderTitle()}
        wrapClassName={styles.editTaskModal}
        visible
        onCancel={this.props.onCancelCallback}
        footer={ canModify ? [
          <Button key="back" type="default" onClick={this.props.onCancelCallback}>取消</Button>,
          <Button key="submit" type="primary" onClick={this.handleFormSubmit}>确定</Button>
        ] : null}
      >
        <Form layout="horizontal">
          {type == TASK_TYPE.WORK ?
            <FormItem
              label="负责人"
              validateStatus={selectedResp ? '' : 'error'}
              help={selectedResp ? '' : '请选择任务负责人'}
              className={styles.numWrapper}
            >
              <Row gutter={8}>
                <Col span={18}>
                  {canModify ?
                    <SingleRoleSelector
                      placeholder="请选择负责人"
                      selectedRole={selectedResp}
                      onChange={this.handleChangeRespRole}
                      className={styles.roleSelector}
                      roleList={this.getResponsorCandidates()}
                    />
                    :
                    <RoleItem role={selectedRole} />
                  }

                </Col>
                <Col span={6}>
                  {this.renderHistoryRoles()}
                </Col>
              </Row>


            </FormItem>
            :
            <FormItem label={type == TASK_TYPE.MEMO ? '记录人' : '创建者'}>
              <RoleItem role={owner} />
            </FormItem>
          }



          {type != TASK_TYPE.MEMO &&
            <FormItem
              label={type == TASK_TYPE.MEETING ? '参与人' : '协作者'}
              validateStatus={
                type == TASK_TYPE.MEETING ?
                 selectedCoopList ? '' : 'error'
                 : ''
              }
              help={
                type == TASK_TYPE.MEETING ?
                  selectedCoopList ? '' : '请选择会议参与者'
                  : ''
              }
            >
              {canModify ?
                <BriefRoleSelector
                  roleList={this.getCooperatorCandidates()}
                  selectedRoleList={selectedCoopList}
                  onChange={this.handleChangeCoopRole}
                  renderAvatar={(role, index) => {
                    return (
                      <div className={styles.avatarWrapper} key={index} style={{ marginRight: 5 }}>
                        <Tooltip title={role.get('roleTitle') + ' ' + role.get('username')}>
                          <img src={role.get('avatar')} />
                        </Tooltip>
                      </div>
                    )
                  }}
                  className={styles.roleSelector}
                />
                :
                selectedCoopList.map((role, index) => {
                  return (
                    <div className={styles.avatarWrapper} key={index} style={{ marginRight: 5 }}>
                      <Tooltip title={role.get('roleTitle') + ' ' + role.get('username')}>
                        <img src={role.get('avatar')} />
                      </Tooltip>
                    </div>
                  )
                })
              }

            </FormItem>

          }

          {type == TASK_TYPE.WORK &&
            <FormItem label="所属发布" >
              <div className={styles.announcementHeader}>
                <span className={styles.announcementType} style={{ borderColor: TEMPLATE_ATTRS[announcement.get('plateType')].color, color: TEMPLATE_ATTRS[announcement.get('plateType')].color }}>
                  {TEMPLATE_ATTRS[announcement.get('plateType')].text}
                </span>
                <span style={{ 'verticalAlign': 'middle' }}>{`${announcement.get('number')} - ${announcement.get('title')}`}</span>
              </div>
            </FormItem>
          }

          {type != TASK_TYPE.MEMO &&
            <div className={styles.divideRow} />
          }

          {type == TASK_TYPE.WORK &&
            <FormItem label="优先级" >
              {canModify ?
                getFieldDecorator('priority', {
                  initialValue: task.get('priority') + '',
                })(
                  <Select className={styles.stateSelector}>
                    {WORK_PRIOS.map((v, k) => {
                      return (
                        <Option value={v.state + ''} key={k + ''}>
                          {WORK_PRIOS[v.state].text}
                        </Option>
                      )
                    })}
                  </Select>
                )
                :
                <span>{WORK_PRIOS[task.get('priority')].text}</span>
              }
            </FormItem>
          }

          {/* 当编辑状态时才能修改状态 */}
          {type == TASK_TYPE.WORK && (
            <FormItem label="状态" >
              {canModify ?
                getFieldDecorator('state', {
                  initialValue: task.get('state') + '',
                })(
                  <Select className={styles.stateSelector}>
                    {workStateList.map((v, k) => {
                      return (
                        <Option value={v.get('state') + ''} key={k + ''}>
                          <span className={styles.icon} style={{ background: v.get('icon') }}/>
                          {v.get('text')}
                        </Option>
                      )
                    })}
                  </Select>
                )
                :
                <span className={stateSelector}>
                  <span className={styles.icon} style={{ background: workStateList.get(task.get('state')).get('icon') }}/>
                  {workStateList.get(task.get('state')).get('text')}
                </span>
              }

            </FormItem>
          )}
          {type == TASK_TYPE.WORK &&
            <FormItem label="计划时间" >
              {canModify ?
                durationDecorator(
                  <DatePicker.RangePicker showTime format="YYYY/MM/DD HH:mm" />
                )
                :
                <span>{moment(task.get('beginTime')).format('YYYY/MM/DD HH:mm')} - {moment(task.get('offTime')).format('YYYY/MM/DD HH:mm')}</span>
              }
            </FormItem>
          }

          {type == TASK_TYPE.MEETING &&
            <FormItem label="开始时间" >
              {canModify ?
                getFieldDecorator('beginTime', {
                  rules: [{
                    required: true, message: '请输入开始时间',
                  }],
                  initialValue: moment(task.get('beginTime')),
                })(
                  <DatePicker showTime format="YYYY/MM/DD HH:mm" />
                )
                :
                <span>{moment(task.get('beginTime')).format('YYYY/MM/DD HH:mm')}</span>
              }

            </FormItem>
          }

          {type == TASK_TYPE.MEETING &&
            <FormItem label="预计时长" >
              {canModify ?
                getFieldDecorator('lastTime', {
                  rules: [{
                    pattern: /^[0-9]+(\.[0-9]+)?$/g, message: '请输入数字',
                  }],
                  initialValue: task.get('lastTime')
                })(<Input addonAfter="小时" autoComplete="off"/>)
                :
                <span>{task.get('lastTime')}小时</span>
              }
            </FormItem>
          }

          {type == TASK_TYPE.MEETING &&
            <FormItem label="地点" >
              {canModify ?
                getFieldDecorator('address', {
                  rules: [
                    { max: 50, message: '最多输入50字符', },
                    { required: true, message: '请输入会议地点' }
                  ],
                  initialValue: task.get('address')
                })(<Input autoComplete="off"/>)
                :
                <span>{task.get('address')}</span>
              }
            </FormItem>
          }

          {type == TASK_TYPE.MEMO &&
            <FormItem label="记录时间">
              {moment(task.get('createTime')).format('YYYY/MM/DD kk:mm')}
            </FormItem>
          }

          <FormItem label="备注" className={styles.numWrapper}>
            {canModify ?
              remarkDecorator(
                <TextArea rows={6} placeholder="请输入备注" style={{ resize: 'none', width: '100%' }} onInput={this.onRemarkInput}/>
              )
              :
              task.get('note')
            }
            <div className={styles.textNum} ref={(el) => this.textNum = el}>{remarkNumStr}</div>
          </FormItem>

          {attachments.size !== 0 ?
            <FormItem label="附件" className={styles.attachment}>
              <div className={styles.attachmentList}>
                {
                attachments.map((file) => (
                  <div className={styles.attachmentItem} key={file.get('fileId')}>
                    {getFileIcon(file.get('url'))}
                    <div style={{ marginLeft: 5, marginRight: 5 }}>{file.get('url').split('/').pop()}</div>
                    {canModify && <SprigDownIcon style={{ marginLeft: 10, marginRight: 10, fill: '#ccc' }} onClick={() => oss.downloadFile(file.get('url'), new Map({ id: affairId, roleId: roleId }))} />}
                    {canModify && <TrashIcon style={{ fill: '#ccc' }} onClick={() => this.handleDeleteFile(file)} />}
                  </div>
                ))
              }
              </div>
            </FormItem>
          :
          null
          }
        </Form>


        {showAddAttachmentModal &&
          <AddAttachmentModal
            visible
            affair={affair}
            onCancel={() => this.setState({ showAddAttachmentModal: false })}
            onSuccess={this.handleAddAttachment}
            taskId={task.get('announcementTaskId')}
          />
        }
      </Modal>
    )
  }
})

const EditTaskModalContainer = connect((state) => {
  return {
    roleList: state.getIn(['user', 'roles']) || List(),
    username: state.getIn(['user', 'username']),
  }
})(EditTaskModal)
export default Form.create()(EditTaskModalContainer)
