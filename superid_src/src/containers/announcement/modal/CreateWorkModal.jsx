import React from 'react'
import { connect } from 'react-redux'
import { Modal, Form, Input, DatePicker, Select, message } from 'antd'
import messageHandler from 'messageHandler'
import { List, fromJS } from 'immutable'
import moment from 'moment'
import styles from './CreateWorkModal.scss'
import config from '../../../config'
import { fetchAnnouncementGuest } from '../../../actions/announcement'
import { workStateList } from '../constant/AnnouncementConstants'
import { RoleSelector, SingleRoleSelector } from '../../../components/role/RoleSelector'
import { ReleaseMeetingIcon, ReleaseWorkIcon, DetailsFullIcon } from 'svg'

const FormItem = Form.Item
const TextArea = Input.TextArea
const Option = Select.Option

export const WorkTypeIcon = (props) => {
  const { type } = props

  if (type == '0') {
    return <span className={styles.typeIcon} style={{ backgroundColor: '#f5a623' }}><ReleaseWorkIcon /></span>
  } else if (type == '1') {
    return <span className={styles.typeIcon} style={{ backgroundColor: '#66b966' }}><ReleaseMeetingIcon /></span>
  } else if (type == '2') {
    return <span className={styles.typeIcon} style={{ backgroundColor: '#b39479' }}><DetailsFullIcon /></span>
  } else {
    return null
  }
}

//创建工作 修改工作 modal
const CreateWorkModal = React.createClass({
  getDefaultProps(){
    return {
      announcementId: null, //在这个发布中创建工作
      affairId: null, //在这个事务中创建发布
      roleId: null,
      work: null, // 被编辑的工作，初始化表单的数据。
      idEdit: false,
      onCancelCallback: () => {},
      submitCallback: () => {},
    }
  },

  getInitialState() {
    return {
      officialsList: List(),
      guestsList: List(),
      selectedCoopList: List(),
      selectedResp: null,
      roleList: fromJS([]),
    }
  },

  componentDidMount() {
    const {
      work,
      isEdit,
    } = this.props

    if (work && isEdit) {
      this.setState({
        selectedResp: work.responsor,
        selectedCoopList: work.cooperationRoles,
      })
    }

    this.fetchOfficials()
    this.fetchGuestsList()
    this.handleFetchOfficialRoleCandidates()
  },

  fetchOfficials() {
    const { announcementId, affairId, roleId } = this.props

    return fetch(config.api.announcement.detail.officials.get(announcementId), {
      method: 'GET',
      affairId: affairId,
      roleId: roleId,
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.setState({
          officialsList: fromJS(json.data)
        })
      }
    })
  },

  fetchGuestsList() {
    const { announcementId, affairId, roleId } = this.props

    fetchAnnouncementGuest(announcementId, affairId, roleId).then((guestMap) => {
      let guestsList = List()
      guestsList = guestsList
        .concat(guestMap.get('innerAffair'))
        .concat(guestMap.get('innerAlliance').map((v) => v.get('roleList')).reduce((r, v) => r.concat(v), List()))
        .concat(guestMap.get('menkor').map((v) => v.get('roleList')).reduce((r, v) => r.concat(v), List()))
      guestsList = guestsList.map((v) => v.get('roleId')).toSet().toList().map((v) => guestsList.find((w) => w.get('roleId') === v))

      this.setState({
        guestsList,
      })
    })
  },

  getResponsorCandidates() {
    if ((this.props.permission && this.props.permission.some((v) => v == 507)) || this.state.officialsList.find((v) => v.get('roleId') === this.props.roleId)) {
      // 若操作者为官方，则可以为官方/客方创建工作。
      return this.state.officialsList.concat(this.state.guestsList)
    } else {
      // 否则，只可以为自己创建工作。
      return this.state.guestsList.filter((v) => v.get('roleId') === this.props.roleId)
    }
  },

  // getCooperatorCandidates() {
  //   const otherRoles = this.props.roleList.filter((v) => v.get('affairId') == this.props.affairId && v.get('roleId') != this.props.roleId)
  //     .map((v) => fromJS({
  //       roleTitle: v.get('roleName'),
  //       roleId: v.get('roleId'),
  //       username: this.props.username,
  //       avatar: v.get('avatar'),
  //     }))
  //   return this.getResponsorCandidates().concat(otherRoles)
  // },
  getCooperatorCandidates() {
    return this.state.roleList
  },
  handleFetchOfficialRoleCandidates() {
    const { affairId, roleId } = this.props
    fetch(config.api.affair.role.main_roles(true), {
      method: 'GET',
      credentials: 'include',
      affairId: affairId,
      roleId: roleId,
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
    const { isEdit, affairId, roleId, announcementId, work } = this.props
    const { selectedResp, selectedCoopList } = this.state

    validateFields((err, value) => {
      if (err) {
        return
      }

      if (!selectedResp && selectedCoopList && selectedCoopList.size > 0) {
        message.error('若选择了协作者，则必须指定一个负责人')
        return
      }

      // 创建工作
      if (!isEdit) {
        return fetch(config.api.announcement.detail.task.create(value.workType || '0'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          affairId,
          roleId,
          resourceId: announcementId,
          body: JSON.stringify({
            announcementId: announcementId,
            manageRole: selectedResp ? selectedResp.get('roleId') : null,
            roleIds: selectedCoopList.map((v) => {
              return v.get('roleId')
            }).toJS(),
            note: value.remark,
            offTime: value.duration[1].valueOf(),
            beginTime: value.duration[0].valueOf(),
            title: value.name,
          })
        }).then((res) => res.json()).then((json) => {
          if (json.code === 0){
            this.props.submitCallback(json)
          }
        })
      } else {
        // 编辑工作
        fetch(config.api.announcement.detail.task.modify(work.id), {
          method: 'POST',
          affairId,
          roleId,
          resourceId: announcementId,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            announcementId,
            note: value.remark,
            offTime: value.duration[1].valueOf(),
            beginTime: value.duration[0].valueOf(),
            ownerRoleId: selectedResp ? selectedResp.get('roleId') : null,
            roleIds: selectedCoopList.map((v) => {
              return v.get('roleId')
            }).toJS(),
            state: value.state,
            title: value.name,
          })
        }).then((res) => res.json()).then((json) => {
          if (json.code === 0){
            this.props.submitCallback(json)
          }
        })
      }
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

  onRemarkInput(e) {
    const length = e.target.value.length

    this.textNum.innerHTML = `${length}/100`
    if (length > 100){
      this.textNum.style.color = 'red'
    } else {
      this.textNum.style.color = '#cccccc'
    }
  },

  renderTypeSelector() {
    return (
      <Select
        style={{ width: 300 }}
      >
        <Option value="0"><WorkTypeIcon type={'0'} />工作</Option>
        <Option value="1"><WorkTypeIcon type={'1'} />会议</Option>
        <Option value="2"><WorkTypeIcon type={'2'} />备忘</Option>
      </Select>
    )
  },

  render(){
    const { work, isEdit } = this.props
    const { getFieldDecorator } = this.props.form
    const { selectedCoopList, selectedResp } = this.state

    const nameDecorator = getFieldDecorator('name', {
      rules: [{
        required: true,
        message: '请输入工作名称！'
      }, {
        max: 32,
        message: '最多输入32个字符！'
      }],
      initialValue: isEdit && work ? work.title : '',
    })

    const durationDecorator = getFieldDecorator('duration', {
      rules: [{
        type: 'array',
        required: true,
        message: '请选择时间',
      }],
      initialValue: isEdit && work ? [moment(work.beginTime), moment(work.endTime)] : null,
    })

    const remarkDecorator = getFieldDecorator('remark', {
      rules: [{
        max: 100,
        message: '备注最多100字！'
      }],
      initialValue: isEdit && work ? work.remark : null,
    })

    // const workTypeDecorator = getFieldDecorator('workType', {
    //   rules: [{
    //     required: true,
    //     message: '请选择工作类型！'
    //   }],
    //   initialValue: isEdit && work ? '0' : '0',
    // })

    const remarkNumStr = isEdit && work ? `${work.remark.length}/100` : '0/100'

    return (
      <Modal
        okText="确定"
        cancelText="取消"
        title={!isEdit ? '创建工作' : '编辑工作'}
        wrapClassName={styles.createWorkModal}
        visible
        onOk={this.handleFormSubmit}
        onCancel={this.props.onCancelCallback}
      >
        <Form layout="horizontal">
          {/*
            <FormItem label="工作类型" >
              {workTypeDecorator(this.renderTypeSelector())}
            </FormItem>
           */}

          <FormItem label="工作名称" >
            {nameDecorator(<Input />)}
          </FormItem>

          <FormItem label="时间" >
            {durationDecorator(
              <DatePicker.RangePicker showTime format="YYYY-MM-DD HH:mm" />
            )}
          </FormItem>

          {/* 当编辑状态时才能修改状态 */}
          {isEdit && (
            <FormItem label="状态" >
              {getFieldDecorator('state', {
                initialValue: work.state,
              })(
                <Select className={styles.stateSelector}>
                  {workStateList.map((v, k) => {
                    return (
                      <Option value={v.get('state')} key={k}>
                        <span className={styles.icon} style={{ background: v.get('icon') }}/>
                        {v.get('text')}
                      </Option>
                    )
                  })}
                </Select>
              )}
            </FormItem>
          )}

          <FormItem label="负责人" >
            <SingleRoleSelector
              placeholder="请选择负责人"
              selectedRole={selectedResp}
              onChange={this.handleChangeRespRole}
              className={styles.roleSelector}
              roleList={this.getResponsorCandidates()}
            />
          </FormItem>

          <FormItem label="协作者" >
            <RoleSelector
              placeholder="请选择协作者"
              roleList={this.getCooperatorCandidates()}
              selectedRoleList={selectedCoopList}
              onChange={this.handleChangeCoopRole}
              className={styles.roleSelector}
            />
          </FormItem>

          <FormItem label="备注" className={styles.numWrapper}>
            {remarkDecorator(
              <TextArea rows={6} placeholder="请输入备注" style={{ resize: 'none' }} onInput={this.onRemarkInput}/>
            )}
            <div className={styles.textNum} ref={(el) => this.textNum = el}>{remarkNumStr}</div>
          </FormItem>
        </Form>
      </Modal>
    )
  }
})

const CreateWorkModalContainer = connect((state) => {
  return {
    roleList: state.getIn(['user', 'roles']) || List(),
    username: state.getIn(['user', 'username']),
  }
})(CreateWorkModal)
export default Form.create()(CreateWorkModalContainer)
