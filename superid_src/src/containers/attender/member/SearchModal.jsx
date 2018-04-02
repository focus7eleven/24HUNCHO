import React from 'react'
import { Modal, Input, Checkbox, Select } from 'antd'
import styles from './SearchModal.scss'

const CheckboxGroup = Checkbox.Group
const SearchModal = React.createClass({
  getDefaultProps(){
    return {
      showSearchModal: false,
      onClose: () => {},
    }
  },
  componentDidUpdate(){
    if (this.refs.keyword){
      setTimeout(() => {this.refs.keyword.refs.input.focus()}, 500)
    }

  },
  handleCancel(){
    this.props.onClose()
  },
  handleOk(){
    this.props.onClose()
  },
  handleCountry(){
    return
  },
  render(){
    const type = [
      { label: '用户名', value: 'username' },
      { label: '角色', value: 'roleTitle' },
      { label: '主事务', value: 'belongAffair' },
      { label: '个人标签', value: 'tag' },
      { label: 'SuperID', value: 'superid' },
    ]
    const gender = [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
    ]
    return (<Modal title="高级搜索" onCancel={this.handleCancel} onOk={this.handleOk} visible={this.props.showSearchModal} className={styles.container} maskClosable={false}>
      <div className={styles.row}>
        <div className={styles.label}>类型:</div>
        <CheckboxGroup options={type} defaultValue={['username', 'roleTitle', 'belongAffair']}/>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>关键词:</span>
        <Input placeholder="请输入关键词" ref="keyword" />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>性别:</span>
        <CheckboxGroup options={gender} defaultValue={['male', 'female']} />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>地区:</span>
        <Select placeholder="请输入国家" onChange={this.handleCountry} />
        <Select placeholder="请输入省会" />
        <Select placeholder="请输入城市" />

      </div>
    </Modal>)
  }
})

export default SearchModal
