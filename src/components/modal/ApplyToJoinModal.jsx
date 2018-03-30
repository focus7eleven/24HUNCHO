import React from 'react'
import PropTypes from 'prop-types'
import { Modal, Form, Input, Button } from 'antd'
import { AFFAIR_TYPE, AFFAIR_TYPES } from '../../containers/header/HeaderContainer'
import styles from './ApplyToJoinModal.scss'

const FormItem = Form.Item
const TextArea = Input.TextArea

class ApplyToJoinModal extends React.Component {

  handleJoinGroup = () => {
    const {
      name,
      onSubmitCallback,
      form: {
        validateFields
      }
    } = this.props
    validateFields((err, value) => {
      if (err) {
        return
      }

      onSubmitCallback(value)
    })
  }

  onCancel = () => {
    this.props.onCancelCallback()
  }

  render() {
    const {
      form: {
        getFieldDecorator
      },
      name,
      type,
      isRequesting,
    } = this.props

    const formItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 14 },
    }

    const reasonDecorator = getFieldDecorator('reason', {
      rules: [{
        required: true,
        message: '请输入申请理由'
      }]
    })

    return (
      <Modal
        title={`申请加入${AFFAIR_TYPES[type]}`}
        visible
        wrapClassName={styles.modalWrapper}
        okText="发送申请"
        onOk={this.handleJoinGroup}
        onCancel={this.onCancel}
        confirmLoading={isRequesting}
      >
        <Form layout="horizontal" hideRequiredMark>
          <FormItem
            label={`${AFFAIR_TYPES[type]}名称`}
            {...formItemLayout}
          >
            <span className={styles.groupName}>{name}</span>
          </FormItem>
          <FormItem
            label="申请理由"
            {...formItemLayout}
          >
            {reasonDecorator(<TextArea rows={5} />)}
          </FormItem>
        </Form>
      </Modal>
    )
  }
}

ApplyToJoinModal.propTypes = {
  name: PropTypes.string.isRequired,
  type: PropTypes.number.isRequired,
  onSubmitCallback: PropTypes.func.isRequired,
  onCancelCallback: PropTypes.func.isRequired,
  isRequesting: PropTypes.bool.isRequired,
}

export default Form.create()(ApplyToJoinModal)
