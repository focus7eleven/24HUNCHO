import React from 'react'
import { Modal, Form, Input, DatePicker, Select } from 'antd'
import { List } from 'immutable'

import styles from './CreateWorkModal.scss'
import { WORK_STATE, WORK_STATE_ATTR, OPT_TYPE } from '../WorkContainer'
import { USER_ROLE_TYPE } from '../../../course/CourseIndexContainer'

import { RoleSelector, SingleRoleSelector } from '../../../../components/select/RoleSelector'
import moment from 'moment'


const FormItem = Form.Item
const TextArea = Input.TextArea
const Option = Select.Option
//创建工作 修改工作modal
class CreateWorkModal extends React.Component {

  // getDefaultProps(){
  //   return {
  //     onCancelCallback: null,
  //     type: 0,
  //     optRoleId: null, //当前正在操作的角色
  //     optRoleType: OPT_ROLE.OFFICIAL,
  //     submitCallback: null,
  //   }
  // }

  constructor(props) {
    super(props)
    const { work } = this.props
    let roleList = List()
    this.state = {
      respRoleList: roleList,
      coopRoleList: roleList,
      selectedResp: work ? work.get('responsor') : null,
      selectedCoopList: work ? work.get('cooperationRoles') : List(),
      state: work ? work.get('state') : WORK_STATE.WAIT_BEGIN
    }
  }



  handleFormSubmit = () => {
    const { validateFields } = this.props.form
    const { selectedResp, selectedCoopList } = this.state
    validateFields((err, value) => {
      if (err){
        return
      }
      // value
      const formValue = {
        name: value.name,
        note: value.remark,
        offTime: value.endTime.valueOf(),
        state: value.state,
        roleId: selectedResp ? selectedResp.get('roleId') : null,
        roleIds: selectedCoopList.map((v) => {
          return v.get('roleId')
        }),
      }
      this.props.submitCallback(formValue)
    })
  }

  handleChangeRespRole = (role) => {
    const selectedResp = role
    const coopRoleList = this.state.coopRoleList.filter((v) => {return v.get('roleId') !== role.get('roleId')})

    this.setState({
      selectedResp,
      coopRoleList,
    })

  }


  handleChangeCoopRole = (e) => {
    const role = e.target.value
    if (!role) return

    if (e.target.checked){
      const selectedCoopList = this.state.selectedCoopList.push(role)
      const respRoleList = this.state.respRoleList.filter((v) => { return v.get('roleId') !== role.get('roleId') })
      this.setState({
        selectedCoopList,
        respRoleList,
      })
    } else {
      const selectedCoopList = this.state.selectedCoopList.filter((v) => {return v.get('roleId' !== role.get('roleId'))})
      const respRoleList = this.state.respRoleList.push(role)
      this.setState({
        selectedCoopList,
        respRoleList
      })
    }
  }

  handleCancel = () => {
    this.props.onCancelCallback()
  }

  onRemarkInput = (e) => {
    const length = e.target.value.length
    this.textNum.innerHTML = `${length}/100`
    if (length > 100){
      this.textNum.style.color = 'red'
    } else {
      this.textNum.style.color = '#cccccc'
    }
  }

  render(){
    const { getFieldDecorator, getFieldValue } = this.props.form
    const { type, work } = this.props
    const { respRoleList, coopRoleList, selectedCoopList, selectedResp } = this.state

    const nameDecorator = getFieldDecorator('name', {
      rules: [{
        required: true,
        message: '请输入工作名称！'
      }, {
        maxLength: 32,
        message: '最多输入32个字符！'
      }],
      initialValue: type === OPT_TYPE.EDIT ? work.get('title') : null,
    })

    const endTimeDecorator = getFieldDecorator('endTime', {
      rules: [{
        required: true,
        message: '请选择截止时间！'
      }],
      // initialValue: type === OPT_TYPE.EDIT ? moment(work.get('endTime')) : null,
    })

    const noteDecorator = getFieldDecorator('remark', {
      rules: [{
        maxLength: 100,
        message: '备注最多100字！'
      }],
      initialValue: type === OPT_TYPE.EDIT ? work.get('note') : null,
    })

    const responsorDecorator = getFieldDecorator('responsor', {
      validator: function(rule, value, callback){
        // console.log('check');
        if (getFieldValue('cooperator')){
          callback('请选择负责人，或清除选择的协作者')
        }
      }
    })

    const noteNumStr = type === OPT_TYPE.EDIT ? `${work.get('note').length}/100` : '0/100'

    return (
      <Modal
        okText="确定"
        cancelText="取消"
        title={type === OPT_TYPE.CREATE ? '新建工作' : '编辑工作'}
        wrapClassName={styles.createWorkModal}
        visible
        onOk={this.handleFormSubmit}
        onCancel={this.handleCancel}
      >
        <Form layout="horizontal" hideRequiredMark>
          <FormItem label="工作名称" >
            {nameDecorator(<Input />)}
          </FormItem>
          <FormItem label="截止时间" >
            {endTimeDecorator(<DatePicker showTime format="YYYY-MM-DD HH:mm:ss" placeholder="请选择截止时间"/>)}
          </FormItem>
          {type === OPT_TYPE.EDIT &&
            <FormItem label="状态" >
              {getFieldDecorator('state', {
                initialValue: work.get('state').toString(),
              })(<Select className={styles.stateSelector}>
                {WORK_STATE_ATTR.map((v, k) => {
                  return (
                    <Option value={k+''} key={k+''}><span className={styles.icon} style={{ background: v.icon }}/>{v.text}</Option>
                  )
                })}
              </Select>)}
            </FormItem>
          }

          <FormItem label="负责人" >
            {responsorDecorator(
              <SingleRoleSelector
                placeholder="请选择负责人"
                roleList={respRoleList}
                selectedRole={selectedResp}
                // onChange={this.handleChangeRespRole}
                className={styles.roleSelector}
              />
            )}
          </FormItem>
          <FormItem label="协作者" >
            {getFieldDecorator('cooperator')(
              <RoleSelector
                placeholder="请选择协作者"
                roleList={coopRoleList}
                selectedRoleList={selectedCoopList}
                // onChange={this.handleChangeCoopRole}
                className={styles.roleSelector}
              />
            )}
          </FormItem>
          <FormItem label="备注" className={styles.numWrapper}>
            {noteDecorator(<TextArea rows={6} placeholder="请输入备注" style={{ resize: 'none' }} onInput={this.onRemarkInput}/>)}
            <div className={styles.textNum} ref={(el) => this.textNum = el}>{noteNumStr}</div>

          </FormItem>
        </Form>
      </Modal>
    )
  }
}

export default Form.create()(CreateWorkModal)
