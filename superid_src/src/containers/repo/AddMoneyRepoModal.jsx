import React from 'react'
import styles from './AddMoneyRepoModal.scss'
import { Modal, Input, Select, Form, Checkbox, message } from 'antd'
import { fromJS, List } from 'immutable'
import config from '../../config'
import messageHandler from '../../utils/messageHandler'


import { ChinaIcon, JapanIcon, USAIcon, EuroIcon, HongkongIcon, EnglandIcon } from 'svg'
import OfficialListComponent from '../announcement/OfficialListComponent'

const FormItem = Form.Item
const createForm = Form.create

const Option = Select.Option

const IconMap = {
  'CNY': {
    svg: <ChinaIcon/>,
    text: 'CNY人民币'
  },
  'USD': {
    svg: <USAIcon/>,
    text: 'USD美元'
  },
  'JPY': {
    svg: <JapanIcon/>,
    text: 'JPY日元'
  },
  'EUR': {
    svg: <EuroIcon/>,
    text: 'EUR欧元'
  },
  'GBP': {
    svg: <EnglandIcon />,
    text: 'GBP英镑'
  },
  'HKD': {
    svg: <HongkongIcon/>,
    text: 'HKD港币'
  }
}

const defaultCheckedList = [
  { value: 'CNY', checked: true },
  { value: 'USD', checked: false },
  { value: 'JPY', checked: false },
  { value: 'EUR', checked: false },
  { value: 'GBP', checked: false },
	{ value: 'HKD', checked: false }
]

const VisibleTypeMap = {
  0: '所有人可见',
  1: '盟内可见',
  2: '事务内可见',
  3: '本事务可见',
  4: '私密'
}

const AddMoneyRepoModalForm = React.createClass({

  getInitialState(){
    return {
      repoName: '',
      visibility: '2',
      addMoneyRepoAuthorities: List(),
      checkedList: defaultCheckedList
    }

  },

  handleCancel(){
    this.props.form.resetFields()
    this.setState({
      checkedList: defaultCheckedList
    }, () => {
      this.props.onCancel()
    })
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
    const { affair } = this.props
    const { repoName, visibility, addMoneyRepoAuthorities, checkedList } = this.state

    const roleList = addMoneyRepoAuthorities.toJS()
    const currencyList = checkedList.filter((v) => v.checked)

    if (roleList.length <= 0) {
      message.error('请选择管理者')
      return
    }

    if (currencyList <= 0) {
      message.error('请选择币种')
      return
    }

    const data = {
      currencyTypes: currencyList.map((v) => v.value),
      name: repoName,
      ownerRoleIds: roleList.map((v) => v.roleId),
      publicType: parseInt(visibility),
    }

    fetch(config.api.fund.add_fund(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify(data),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        message.success('添加资金库成功')
      }
      if (json.code == 0 || json.code == 20000) {
        this.props.onCancel()
        this.props.fresh()
      }
    })

  },

  onChange(e){
    const { checked, value } = e.target
    const checkedList = this.state.checkedList.map((item) => {
      const newItem = {
        value: item.value,
        checked: item.checked
      }
      if (newItem.value === value) {
        newItem.checked = checked
      }
      return newItem
    })

    this.setState({
      checkedList
    })
  },

  handleNameChange(e) {
    this.setState({
      repoName: e.target.value
    })
  },

  handleSelect(value) {
    this.setState({
      visibility: value
    })
  },

  createCheckers() {
    const { getFieldProps } = this.props.form


    const nameProps = getFieldProps('repo-name', {
      rules: [
        { required: true, message: '请输入名称' },
        {
          validator: (rule, value, callback) => {
            if (value && value.trim() === '') {
              callback([new Error('资金库名称不能为空')])
            } else {
              callback()
              this.setState({
                repoName: value
              })
            }
          }
        },
      ]
    })

    return { nameProps }
  },




  render(){
    const { affair } = this.props
    const { repoName, visibility, checkedList } = this.state

    const { nameProps } = this.createCheckers()

    return (
      <Modal
        title="添加资金库"
        visible
        onCancel={this.handleCancel}
        onOk={this.handleOk}
        wrapClassName={styles.addMoneyRepoContainer}
        maskClosable={false}
      >

        <Form horizontal>
          <FormItem
            label="仓库名"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
          >
            <Input value={repoName} onChange={this.handleNameChange} {...nameProps}/>
          </FormItem>

          {/* 仓库可见性 */}
          <FormItem
            label="可见性"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
          >
            <Select value={visibility} onSelect={this.handleSelect}>
              <Option value="2">{VisibleTypeMap[2]}</Option>
              <Option value="1">{VisibleTypeMap[1]}</Option>
              <Option value="0">{VisibleTypeMap[0]}</Option>
              <Option value="3">{VisibleTypeMap[3]}</Option>
              <Option value="4">{VisibleTypeMap[4]}</Option>
            </Select>
          </FormItem>

          <FormItem
            label="管理者"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
          >
            <OfficialListComponent
              roleId={affair.get('roleId')}
              affairId={parseInt(affair.get('id'))}
              canRemoveSelf
              showTitle
              usePrimaryRoleFilter
              officialList={this.state.addMoneyRepoAuthorities.toJS()}
              onAddOfficial={(v) => this.setState({ addMoneyRepoAuthorities: this.state.addMoneyRepoAuthorities.push(fromJS(v)) })}
              onDeleteOfficial={(v) => {
                const nextAuthorities = this.state.addMoneyRepoAuthorities.filter((w) => (w.get('roleId') != v.roleId))
                this.setState({ addMoneyRepoAuthorities: nextAuthorities })
              }}
            />
          </FormItem>

          <FormItem
            label="币种"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
          >
            <div className={styles.checkBoxList}>
              {checkedList.map((item, i) => {
                const icon = IconMap[item.value]
                return (
                  <Checkbox key={i} value={item.value} onChange={this.onChange} checked={item.checked}>{icon.svg}{icon.text}</Checkbox>
                )
              })}
            </div>

          </FormItem>
        </Form>


      </Modal>
    )
  }

})

const AddMoneyRepoModal = createForm()(AddMoneyRepoModalForm)

export default AddMoneyRepoModal
