import React from 'react'
import { Modal, Input, Form } from 'antd'
import styles from './InviteCodeModal.scss'
import { USER_ROLE_TYPE } from '../CourseIndexContainer'
import { setInviteCode } from '../../../actions/course'

const FormItem = Form.Item
class InviteCodeModal extends React.Component {

  handleCancel = () => {
    this.props.cancelCallback()
    // console.log('cancel')
  }

  handleSubmit = () => {
    const {
      form: {
        validateFields
      },
      courseId,
      roleType,
    } = this.props
    validateFields((err, value) => {
      if(err) {
        return
      }
      this.props.submitCallback(value.code)
    })
  }

  render() {
    const {
      defaultValue,
      title,
      form: {
        getFieldDecorator
      },
      isRequesting,
    } = this.props;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 18 }
    }

    return (
      <Modal
        title={ this.props.title }
        onCancel={ this.handleCancel }
        onOk={ this.handleSubmit }
        confirmLoading={ isRequesting }
        wrapClassName={ styles.modalContainer }
        visible
      >
        <Form layout="horizontal">
          <FormItem
            {...formItemLayout}
            label="邀请码"
          >
            {getFieldDecorator('code', {
              rules: [
                {
                  max: 10,
                  message: '邀请码不得超过10个字符'
                }, {
                  pattern: /^[0-9a-zA-Z]{1,10}$/,
                  message: '邀请码由数字、字母组成，不得超过10个字符'
                }
              ]
            })(<Input placeholder={this.props.defaultValue ? this.props.defaultValue : '邀请码可以为数字、字母，不超过10个字符'}/>)}
          </FormItem>
        </Form>
      </Modal>
    )
  }
}

InviteCodeModal.defaultProps = {
  defaultValue: null,
  title: '',
  submitCallback: () => {},
  cancelCallback: () => {},
  isRequesting: false,
}

export default Form.create()(InviteCodeModal)
