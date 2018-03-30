import React from 'react'
import { Modal, Input, Form, Button } from 'antd'
import styles from './groupModal.scss'

const FormItem = Form.Item
const TextArea = Input.TextArea
class CreateGroupModal extends React.Component {

  state = {
    loading: false
  }

  onCancel = () => {
    this.props.onCancelCallback()
  }

  handleCreateGroup = () => {
    this.props.form.validateFields((err, value) => {
      if (err) {
        return
      }
      this.setState({ loading: true })
      this.props.onSubmitCallback(value, () => this.setState({ loading: false }))
    })
  }

  render() {
    const { loading } = this.state

    const {
      form: {
        getFieldDecorator
      }
    } = this.props

    const formItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 14 },
    }

    const titleDecorator = getFieldDecorator('name', {
      rules: [{
        required: true,
        message: '请输入小组名称'
      }]
    })

    const descriptionDecorator = getFieldDecorator('description', {
      rules: [{
        required: true,
        message: '请输入小组描述'
      }]
    })



    return (
      <Modal
        wrapClassName={styles.modalWrapper}
        visible
        title="创建小组"
        onCancel={this.onCancel}
        onOk={this.handleCreateGroup}
        footer={[
          <Button key="cancel" size="large" onClick={this.onCancel}>取消</Button>,
          <Button key="submit" type="primary" size="large" loading={loading} onClick={this.handleCreateGroup}>
            确定
          </Button>,
        ]}
      >
        <Form layout='horizontal' hideRequiredMark>
          <FormItem
            label="小组名称"
            {...formItemLayout}
          >
            {titleDecorator(<Input />)}
          </FormItem>
          <FormItem
            label="小组描述"
            {...formItemLayout}
          >
            {descriptionDecorator(<TextArea rows={5}/>)}
          </FormItem>
        </Form>
      </Modal>
    )
  }
}

export default Form.create()(CreateGroupModal)
