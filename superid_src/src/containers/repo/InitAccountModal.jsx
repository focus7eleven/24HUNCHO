import React from 'react'
import styles from './InitAccountModal.scss'
import { Modal, Input, Form } from 'antd'

const FormItem = Form.Item
const createForm = Form.create



const InitAccountModalForm = React.createClass({

  getInitialState(){
    return {
      money: 0,
      moneyValid: {
        status: '',
        help: ''
      }
    }
  },

  handleCancel(){
    this.props.onCancel()
  },

  handleOk(){
    let hasError = false
    this.props.form.validateFields((errors) => {
      if (errors) {
        hasError = true
        return
      }
    })
    if (hasError){
      return
    }

    const { money } = this.state

    this.props.initAccount(money)

  },

  handleMoneyChange(e) {
    const value = e.target.value
    if (isNaN(value) || (value.indexOf('.') >= 0 && value.length > value.indexOf('.') + 3) || (value.length > 16)) {
      e.preventDefault()
    } else {
      this.setState({
        money: value,
        moneyValid: {
          status: '',
          help: ''
        }
      })
    }
  },

  render() {
    const { account } = this.props
    const { moneyValid } = this.state
    return (
      <Modal
        title="初始化账户"
        visible
        onCancel={this.handleCancel}
        onOk={this.handleOk}
        wrapClassName={styles.initAccountModalContainer}
        maskClosable={false}
      >
        <Form horizontal>
          <FormItem
            label="金额"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
            validateStatus={moneyValid.status}
            help={moneyValid.help}
          >
            <Input value={this.state.money} addonBefore={account.currency} onChange={this.handleMoneyChange} />
          </FormItem>

        </Form>
      </Modal>
    )
  }
})

const InitAccountModal = createForm()(InitAccountModalForm)

export default InitAccountModal
