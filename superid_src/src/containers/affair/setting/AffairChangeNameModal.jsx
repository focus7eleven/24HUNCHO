import React from 'react'
import { Modal, Form, Input, message } from 'antd'
const FormItem = Form.Item
import styles from './AffairChangeModal.scss'
import config from '../../../config'
import urlFormat from 'urlFormat'
import messageHandler from 'messageHandler'

const AffairChangeNameModal = React.createClass({
  getInitialState(){
    return {
      visible: false,
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
      fetch(urlFormat(config.api.alliance.editName(), {
        roleId: affair.get('roleId'),
        allianceId: affair.get('allianceId'),
        name: getFieldValue('name'),
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
          this.props.modifyAffairInfo(affair, affair.get('affairMemberId'), { name: getFieldValue('name') })
          this.props.form.resetFields()
        }
      })
    })
  },
  render(){
    const { affair } = this.props
    const { visible } = this.state
    const { getFieldDecorator } = this.props.form
    const nameDecorator = getFieldDecorator('name', {
      rules: [
        { required: true, message: '盟名称需要为汉字、字母或数字， 2到15个字符' },
        { pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9_]{2,15}$/, message: '盟名称需要为汉字、字母或数字， 2到15个字符' },
      ],
    })
    const reasonDecorator = getFieldDecorator('reason', {
      rules: [
        { required: true,
          message: '变更理由不能为空'
        }],
    })
    return (
      <div>
        <div onClick={this.onShow}>{this.props.children}</div>
        <Modal
          visible={visible}
          title={'申请变更名称'}
          onCancel={this.onCancel}
          onOk={this.onOk}
          wrapClassName={styles.modal}
        >
          <Form layout="horizontal">
            <FormItem label="现有名称">
              <p>{affair.get('name')}</p>
            </FormItem>
            <FormItem label="新名称" hasFeedback>
              {nameDecorator(<Input placeholder="2-15个字符" />)}
            </FormItem>
            <FormItem label="变更理由">
              {reasonDecorator(<Input placeholder="请输入变更的原因" type="textarea" />)}
            </FormItem>
          </Form>
        </Modal>
      </div>
    )
  }
})

export default Form.create()(AffairChangeNameModal)
