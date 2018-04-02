import React from 'react'
import styles from './AddAccountModal.scss'
import { Modal, Radio, Input, Select, Form, Message } from 'antd'
import config from '../../config'
import messageHandler from '../../utils/messageHandler'
import luhmCheck from 'luhmCheck'

const FormItem = Form.Item
const createForm = Form.create

const RadioGroup = Radio.Group
const Option = Select.Option
const ADD_TYPE = {
  CARD: 'card',
  OTHER: 'other',
  ACCOUNT: 'account',
}
const BANK = [
  { name: '中国工商银行', value: '10' }, { name: '中国交通银行', value: '11' }, { name: '中国农业银行', value: '12' },
]
const OTHER = [
  { name: '支付宝', value: '200' }, { name: '微信钱包', value: '201' }
]
const AddAccountModalForm = React.createClass({
  getInitialState(){
    return {
      type: ADD_TYPE.CARD,
      card: {},
      other: {},
      account: {},
    }

  },
  handleCancel(){
    this.setState({
      type: ADD_TYPE.CARD,
    })
    this.props.form.resetFields()
    this.props.callback()
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

    let data = {}
    const { affair } = this.props
    const formValues = this.props.form.getFieldsValue()
    const type = this.state.type

    switch (type){
      case 'card':
        data.type = 1
        data.subType = formValues[type + '-selectBank']
        data.accountNumber = formValues[type + '-accountNumber']
        data.amount = formValues[type + '-amount']
        data.currency = this.props.currencyType
        data.accountOwner = formValues[type + '-name']
        data.poolId = this.props.poolType
        break
      case 'other':
        data.type = 2
        data.subType = formValues[type + '-selectType']
        data.accountNumber = formValues[type + '-accountNumber']
        data.amount = formValues[type + '-amount']
        data.currency = this.props.currencyType
        data.accountOwner = formValues[type + '-userName']
        data.poolId = this.props.poolType
        break

      case 'account':
        data.type = 3
        data.subType = formValues[type + '-selectBank']
        data.accountNumber = formValues[type + '-accountNumber']
        data.amount = formValues[type + '-amount']
        data.currency = this.props.currencyType
        data.accountOwner = formValues[type + '-company']
        data.poolId = this.props.poolType
        break

      default:
        data.type = 1
        data.subType = formValues[type + '-selectBank']
        data.accountNumber = formValues[type + '-accountNumber']
        data.amount = formValues[type + '-amount']
        data.currency = this.props.currencyType
        data.accountOwner = formValues[type + '-name']
        data.poolId = this.props.poolType
    }
    fetch(config.api.fund.add(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      credentials: 'include',
      body: JSON.stringify(data),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        Message.success('添加账户成功')
        this.handleCancel()
      }
    })
  },
  handleTypeChange(e){
    this.setState({
      type: e.target.value,
    })
    // should clear the inputs when change to another form
    this.props.form.resetFields()
  },

  //checkers
  checkBankAccount(rule, value, callback){
    if (value && (value.length < 3 || value.length > 26)){
      callback([new Error('银行账户长度为3-26位')])
    } else if (value && !luhmCheck(value)){
      callback([new Error('银行卡号错误')])
    } else {
      callback()
    }
  },
  checkOtherAccount(rule, value, callback){
    if (value && (value.length < 3 || value.length > 18)){
      callback([new Error('第三方账户长度为3-18位')])
    } else {
      callback()
    }
  },
  checkName(rule, value, callback){
    if (value && (value.length < 2 || value.length > 10)){
      callback([new Error('姓名为2-10位')])
    } else {
      callback()
    }
  },
  checkAmount(rule, value, callback){
    if (value && (isNaN(value) || parseFloat(value) < 0)){
      callback([new Error('金额为大于0的数')])
    } else if (/[1-9][0-9]{15,}/.test(value)) {
      callback([new Error('金额异常')])
    } else {
      callback()
    }
  },
  checkCompany(rule, value, callback){
    if (value && (value.length < 3 || value.length > 10)){
      callback([new Error('公司名称为3-10位')])
    } else {
      callback()
    }
  },

  renderBottom(){
    const { getFieldDecorator } = this.props.form

    //to differ props from different forms send type as a sign
    //type contains card,other,account as in switch cases
    const selectBankDecorator = (type) => getFieldDecorator(type + '-selectBank', {
      rules: [
        { required: true, message: '请选择发卡行' },
      ],
    })
    const selectTypeDecorator = (type) => getFieldDecorator(type + '-selectType', {
      rules: [{ required: true, message: '请选择第三方' }],
    })
    const accountNumberDecorator = (type) => getFieldDecorator(type + '-accountNumber', {
      rules: [
        { required: true, message: '请输入银行账号' },
        { validator: this.checkBankAccount },
      ]
    })
    const otherAccountNumberDecorator = (type) => getFieldDecorator(type + '-accountNumber', {
      rules: [
        { required: true, message: '请输入第三方账号' },
        { validator: this.checkOtherAccount },
      ]
    })
    const otherUserNameDecorator = (type) => getFieldDecorator(type + '-userName', {
      rules: [
        { required: true, message: '请输入用户名' }
      ]
    })
    const nameDecorator = (type) => getFieldDecorator(type + '-name', {
      rules: [
        { required: true, message: '请输入姓名' },
        { validator: this.checkName },
      ]
    })
    const amountDecorator = (type) => getFieldDecorator(type + '-amount', {
      rules: [
        { required: true, message: '请输入金额' },
        { validator: this.checkAmount },
        { max: 16, message: '金额不能超过16位' }
      ]
    })
    const companyDecorator = (type) => getFieldDecorator(type + '-company', {
      rules: [
        { required: true, message: '请输入公司名称' },
        { validator: this.checkCompany },
      ]
    })

    const type = this.state.type
    switch (this.state.type){
      case 'card':
        return (
          <div className={styles.bottom}>
            <Form layout="horizontal" form={this.props.form}>
              <FormItem label="银行" className={styles.row}>
                {selectBankDecorator(type)(
                  <Select className={styles.select} placeholder="选择发卡行">
                    {BANK.map((v, k) => {
                      return <Option value={v.value} key={k}>{v.name}</Option>
                    })}
                  </Select>
              )}
              </FormItem>
              <FormItem label="卡号" className={styles.row}>
                {accountNumberDecorator(type)(<Input />)}
              </FormItem>
              <FormItem label="姓名" className={styles.row}>
                {nameDecorator(type)(<Input />)}
              </FormItem>
              <FormItem label="金额" className={styles.row}>
                {amountDecorator(type)(<Input addonBefore={this.props.currencyType} />)}
              </FormItem>
            </Form>
          </div>
        )
      case 'other':
        return (
          <div className={styles.bottom}>
            <Form layout="horizontal" form={this.props.form}>
              <FormItem label="类型" className={styles.row}>
                {selectTypeDecorator(type)(
                  <Select className={styles.select} placeholder="选择第三方">
                    {
                    OTHER.map((v, k) => {
                      return <Option value={v.value} key={k}>{v.name}</Option>
                    })
                  }
                  </Select>
              )}
              </FormItem>
              
              <FormItem label="账号" className={styles.row}>
                {otherAccountNumberDecorator(type)(<Input />)}
              </FormItem>
              <FormItem label="用户名" className={styles.row}>
                {otherUserNameDecorator(type)(<Input />)}
              </FormItem>
              <FormItem label="金额" className={styles.row}>
                {amountDecorator(type)(<Input addonBefore={this.props.currencyType} />)}
              </FormItem>
            </Form>
          </div>
        )
      case 'account':
        return (
          <div className={styles.bottom}>
            <Form layout="horizontal" form={this.props.form}>
              <FormItem label="银行" className={styles.row}>
                {selectBankDecorator(type)(
                  <Select className={styles.select} placeholder="选择发卡行" >
                    {BANK.map((v, k) => {
                      return <Option value={v.value} key={k}>{v.name}</Option>
                    })}
                  </Select>
              )}
              </FormItem>
              <FormItem label="账号" className={styles.row}>
                {accountNumberDecorator(type)(<Input />)}
              </FormItem>
              <FormItem label="公司" className={styles.row}>
                {companyDecorator(type)(<Input />)}
              </FormItem>
              <FormItem label="金额" className={styles.row}>
                {amountDecorator(type)(<Input addonBefore={this.props.currencyType} />)}
              </FormItem>
            </Form>
          </div>
        )
      default:
        return (<span>ERROR AddAccountModal</span>)
    }
  },
  render(){
    const { type } = this.state
    return (
      <Modal
        title="添加现实账户"
        visible={this.props.visible}
        onCancel={this.handleCancel}
        onOk={this.handleOk}
        wrapClassName={styles.addAccountContainer}
        maskClosable={false}
      >
        <div className={styles.top}>
          <RadioGroup value={type} onChange={this.handleTypeChange}>
            <Radio key="a" value={ADD_TYPE.CARD}>银行卡</Radio>
            <Radio key="b" value={ADD_TYPE.OTHER}>第三方</Radio>
            <Radio key="c" value={ADD_TYPE.ACCOUNT}>对公账户</Radio>
          </RadioGroup>
        </div>
        <div className={styles.bottom}>
          {this.renderBottom()}
        </div>

      </Modal>
    )
  }
})

const AddAccountModal = createForm()(AddAccountModalForm)

export default AddAccountModal
