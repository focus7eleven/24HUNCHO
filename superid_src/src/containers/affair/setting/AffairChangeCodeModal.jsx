import React from 'react'
import { Modal, Form, Input, message } from 'antd'
const FormItem = Form.Item
import styles from './AffairChangeModal.scss'
import config from '../../../config.js'
import messageHandler from 'messageHandler'
import urlFormat from 'urlFormat'

const AffairChangeCodeModal = React.createClass({
  getInitialState(){
    return {
      visible: false,
    }
  },
  allianceExists(rule, value, callback) {
    if (!value) {
      callback()
    } else {
      fetch(config.api.alliance.code.validation(value), {
        method: 'get',
        credentials: 'include'
      }).then((res) => {
        return res.json()
      }).then((res) => {
        if (res.code == 0) {
          callback()
        } else {
          callback([new Error('抱歉，该盟代码已被占用。')])
        }
      })
    }
  },
  onShow(){
    this.setState({ visible: true })
  },
  onCancel(){
    this.setState({ visible: false })
    this.props.form.resetFields()
  },
  onOk(){
    const { getFieldValue, validateFields } = this.props.form
    validateFields((errors) => {
      if (errors) {
        return
      }
      const { affair } = this.props
      affair.get('allianceId')
      fetch(urlFormat(config.api.alliance.editCode(), {
        roleId: affair.get('roleId'),
        allianceId: affair.get('allianceId'),
        code: getFieldValue('code'),
        reason: getFieldValue('reason'),
      }), {
        method: 'POST',
        credentials: 'include',
        roleId: affair.get('roleId'),
        affairId: affair.get('id'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code == 0) {
          message.success('申请成功')
          this.setState({ visible: false })
          this.props.modifyAffairInfo(affair, affair.get('affairMemberId'), { allianceCode: getFieldValue('code') })
        }
      })
    })
  },
  render(){
    const { affair } = this.props
    const { visible } = this.state
    const { getFieldDecorator } = this.props.form
    const codeDecorator = getFieldDecorator('code', {
      initialValue: this.state.code,
      rules: [
        { required: true, message: '盟代码需要为2-15位大写字母' },
        { pattern: /^[A-Z]{2,15}$/, message: '盟代码需要为2-15位大写字母' },
        //后端检查是否重复
        // { validator: this.allianceExists },
      ],
    })
    const reasonDecorator = getFieldDecorator('reason', {})
    return (
      <div>
        <div onClick={this.onShow}>{this.props.children}</div>
        <Modal
          visible={visible}
          title={'申请变更代码'}
          onCancel={this.onCancel}
          onOk={this.onOk}
          wrapClassName={styles.modal}
        >
          <Form layout="horizontal">
            <FormItem label="现有代码">
              <p>{affair.get('allianceCode')}</p>
            </FormItem>
            <FormItem label="新代码" hasFeedback>
              {codeDecorator(<Input placeholder="2-15位英文大写字母" />)}
            </FormItem>
            <FormItem label="变更理由" >
              {reasonDecorator(<Input placeholder="请输入变更的原因" type="textarea" />)}
            </FormItem>
          </Form>
        </Modal>
      </div>
    )
  }
})

export default Form.create()(AffairChangeCodeModal)
