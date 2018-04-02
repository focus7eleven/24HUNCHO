import React from 'react'
import PropTypes from 'prop-types'
import { List } from 'immutable'
import { Input, Button, Popover, Tooltip, Icon, Form, DatePicker, Col, Row, notification } from 'antd'
import { ICReleaseWorkIcon, ICReleaseMeetingIcon, ICReleaseMemorandumIcon } from 'svg'
import config from 'config'
import messageHandler from 'messageHandler'
import SingleRolePopover from 'components/popover/SingleRolePopover'
import { BriefRoleSelector } from 'components/role/RoleSelector'
import grayImage from 'images/gray.png'
import { TASK_TYPE, TASK_TYPES } from '../constant/AnnouncementConstants'
import styles from './TaskCreateInput.scss'

const FormItem = Form.Item
class TaskCreateInput extends React.Component {

  state = {
    type: TASK_TYPE.WORK,
    showTypeSelector: false,
    nameError: '',
    showRespSelector: false,
    respRole: this.props.optRole,
    selectedMeetingRoles: List(),
    meetingRolesError: '',
    meetingRolesHelp: '',
    isCreating: false,
  }

  initialState = this.state

  handleCancel = () => {
    this.props.onCancel()
  }

  resetFields = () => {
    this.props.form.resetFields()
    this.nameInput.refs.input.value = '',
    this.setState(this.initialState)
  }

  handleOk = () => {
    const { selectedMeetingRoles, type, respRole } = this.state
    const { affair, announcementId } = this.props
    // 调用接口创建工作，成功后回调父组件
    const name = this.nameInput.refs.input.value.trim()
    if (!name) {
      this.setState({
        nameError: '请输入任务名称！'
      })
      return
    }

    if (type == TASK_TYPE.MEETING && selectedMeetingRoles.size === 0) {
      this.setState({
        meetingRolesError: 'error',
        meetingRolesHelp: '请选择至少一个会议参与者'
      })
      return
    }
    this.props.form.validateFields((err, values) => {
      if (err) {
        return
      }

      this.setState({
        isCreating: true,
      })

      let createBody = {
        announcementId: announcementId,
        title: name,
      }

      if (type == TASK_TYPE.WORK) {
        createBody.manageRole = respRole.get('roleId')
      } else if (type == TASK_TYPE.MEETING) {
        // 会议创建者是否需要在body里传？
        createBody.beginTime = values.beginTime.valueOf()
        createBody.address = values.address
        createBody.roleIds = selectedMeetingRoles.map((v) => v.get('roleId'))
        createBody.manageRole = this.props.optRole.get('roleId')
      } else {
        // 备忘
        createBody.manageRole = this.props.optRole.get('roleId')
      }
      fetch(config.api.announcement.detail.task.create(type), {
        method: 'POST',
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        resourceId: announcementId,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createBody)
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code == 0) {
          notification['success']({
            message: '创建任务成功',
          })
          this.resetFields()
          this.props.onSuccess()
        } else {
          notification['error']({
            message: '创建任务失败',
            description: json.data,
          })
        }
        this.setState({
          isCreating: false,
        })
      })

    })
  }

  getTypeSvg = (type) => {
    switch (type) {
      case TASK_TYPE.WORK:
        return (
          <div className={styles.taskIcon} style={{ background: TASK_TYPES[TASK_TYPE.WORK].icon }}>
            <ICReleaseWorkIcon/>
          </div>
        )
      case TASK_TYPE.MEETING:
        return (
          <div className={styles.taskIcon} style={{ background: TASK_TYPES[TASK_TYPE.MEETING].icon }}>
            <ICReleaseMeetingIcon/>
          </div>
        )
      case TASK_TYPE.MEMO:
        return (
          <div className={styles.taskIcon} style={{ background: TASK_TYPES[TASK_TYPE.MEMO].icon }}>
            <ICReleaseMemorandumIcon />
          </div>
        )
    }
  }

  onFocusWrapper = () => {
    this.inputWrapper.style.border = '1px solid #b399dc'
  }

  onBlurWrapper = () => {
    this.inputWrapper.style.border = '1px solid #d9d9d9'
  }

  onChangeName = () => {

    if (this.nameInput.refs.input.value.trim() && this.state.nameError) {
      this.setState({
        nameError: ''
      })
    }
  }

  renderTypeSelector = () => {
    const { type, showTypeSelector } = this.state


    const content = (
      <div className={styles.taskTypes}>
        { TASK_TYPES.map((v, k) => {
          return <div className={styles.taskType} key={k} onClick={() => this.setState({ type: v.type, showTypeSelector: false })}>
            {this.getTypeSvg(v.type)}
            <span>{v.text}</span>
          </div>
        })}
      </div>
    )
    return (
      <Popover
        content={content}
        overlayClassName={styles.taskTypesContainer}
        trigger="click"
        visible={showTypeSelector}
        placement="bottom"
        onVisibleChange={() => this.setState({ showTypeSelector: !showTypeSelector })}
      >
        <div className={styles.typeSelector} onFocus={this.onFocusWrapper} onBlur={this.onBlurWrapper}>
          {this.getTypeSvg(type)}
          <Icon type="caret-down" style={{ color: '#ccc', fontSize: 8 }} />
        </div>
      </Popover>
    )
  }

  renderAvatar = (role, index) => {
    return (
      <div className={styles.avatarWrapper} key={index} style={{ marginRight: 5 }}>
        <Tooltip title={role.get('roleTitle') + ' ' + role.get('username')}>
          <img src={role.get('avatar') || grayImage} />
        </Tooltip>
      </div>
    )
  }

  render() {
    const { type, nameError, showRespSelector, respRole, isCreating } = this.state
    const {
      form: {
        getFieldDecorator,
      },
      respCandidates,
    } = this.props
    let placeholder = '请输入普通任务内容'
    switch (type) {
      case TASK_TYPE.MEETING:
        placeholder = '请输入会议名称'
        break
      case TASK_TYPE.MEMO:
        placeholder = '请输入备忘内容'
        break
    }

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 5 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 17 },
      },
    }

    return (
      <div className={styles.container} ref={(el) => this.inputWrapper = el}>

        <div className={styles.inputWrapper}>
          {this.renderTypeSelector()}
          {/* <FormItem style={{ flexGrow: 1 }}>
            { getFieldDecorator('name', {
              rules: [
                { required: true, message: '请输入任务名称！' }
              ]
            })(<Input
              placeholder={placeholder}
              style={{ boder: 'none' }}
              className={styles.input}
              onFocus={this.onFocusWrapper}
              onBlur={this.onBlurWrapper}
              ref={(el) => this.nameInput=el}
            />)}
          </FormItem> */}
          <Tooltip title={nameError} visible={nameError ? true : false} placement="topLeft">
            <Input
              placeholder={placeholder}
              style={{ boder: 'none' }}
              className={styles.input}
              onFocus={this.onFocusWrapper}
              onBlur={this.onBlurWrapper}
              onChange={this.onChangeName}
              ref={(el) => this.nameInput = el}
              autoComplete="off"
            />
          </Tooltip>

          <div className={styles.btnGroup} onFocus={this.onFocusWrapper} onBlur={this.onBlurWrapper}>
            { type == TASK_TYPE.WORK &&
              <SingleRolePopover
                placement="bottom"
                overlayClassName={styles.respPopover}
                visible={showRespSelector}
                onVisibleChange={() => this.setState({ showRespSelector: !showRespSelector })}
                trigger="click"
                onValueChange={(role) => this.setState({ respRole: role, showRespSelector: false })}
                roleList={respCandidates}
              >
                <div className={styles.resp} onClick={() => this.setState({ showRespSelector: true })}>
                  负责人：
                  <Tooltip title={`${respRole.get('roleTitle')} ${respRole.get('username')}`}>
                    <img className={styles.avatar} src={respRole.get('avatar')}/>
                  </Tooltip>
                </div>
              </SingleRolePopover>

            }
            <Button type="default" onClick={this.handleCancel}>取消</Button>
            <Button type="primary" onClick={this.handleOk} loading={isCreating}>确定</Button>
          </div>
        </div>
        <br/>
        { type == TASK_TYPE.MEETING &&
        <div className={styles.meetingInfo} >
          <div className={styles.splitter}/>
          <Form layout="horizontal" className={styles.meetingForm}>
            <Row>
              <Col span={13}>
                <FormItem label="开始时间" {...formItemLayout}>
                  {getFieldDecorator('beginTime', {
                    rules: [
                            { required: true, message: '请选择会议开始时间' }
                    ]
                  })(
                    <DatePicker
                      showTime
                      format="YYYY-MM-DD hh:mm"
                    />
                        )}
                </FormItem>
              </Col>
              {/* <Col span={1}/> */}
              <Col span={11}>
                <FormItem label="地点" {...formItemLayout}>
                  {getFieldDecorator('address', {
                    rules: [
                            { required: true, message: '请输入会议地点' }
                    ]
                  })(<Input />)}
                </FormItem>
              </Col>

            </Row>

            <FormItem
              label="参与者"
              validateStatus={this.state.meetingRolesError}
              help={this.state.meetingRolesHelp}
              {...{ labelCol: { span: 3 }, wrapperCol: { span: 19 } }}
            >
              <BriefRoleSelector
                roleList={this.props.meetingCandidates}
                selectedRoleList={this.state.selectedMeetingRoles}
                onChange={(selectedMeetingRoles) => {
                  if (selectedMeetingRoles.size !== 0) {
                    this.setState({
                      selectedMeetingRoles,
                      meetingRolesError: '',
                      meetingRolesHelp: '',
                    })
                  } else {
                    this.setState({ selectedMeetingRoles })
                  }}
                      }
                renderAvatar={this.renderAvatar}
                className={styles.meetingRoleSelector}
              />
            </FormItem>
          </Form>
        </div>

            }


      </div>


    )
  }
}

TaskCreateInput.PropTypes = {
  respCandidates: PropTypes.array,
  meetingCandidates: PropTypes.array,
  optRole: PropTypes.object,
}

export default Form.create()(TaskCreateInput)
