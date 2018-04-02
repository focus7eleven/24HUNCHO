import React from 'react'
import styles from './GroupSettingModal.scss'
import { Modal, Input, message } from 'antd'
import config from '../../config'



export default class GroupSettingModal extends React.Component {

  static defaultProps = {
    group: null
  };

  constructor(props) {
    super(props)
  }

  state = {
    name: this.props.group.name,
    groupNameInvalid: false,
    limit: 100
  }

  handleGroupNameChange = (e) => {
    const value = e.target.value

    this.setState({
      groupNameInvalid: !value.trim(),
      name: value
    })
  }

  handleLimitChange = (value) => {
    this.setState({
      limit: value
    })
  }

  handleOnOk = () => {
    const { group, onCancel, onOk, affairId, roleId } = this.props
    const { name } = this.state
    if (name.trim() === '') {
      this.setState({
        groupNameInvalid: true
      })
      return
    }
    const groupId = group.id ? group.id : group.groupId

    fetch(config.api.chat.edit(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId,
      roleId,
      body: JSON.stringify({
        groupId,
        name: name
      })
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        message.success('编辑讨论组成功！', 1)
        setTimeout(() => {
          onCancel && onCancel()
          onOk({ id: groupId, name: name })
        }, 1000)
      } else {
        message.error('编辑讨论组失败，请检查信息是否完整！')
      }
    })
  }

  render() {
    const { visible, onCancel } = this.props
    const { name, groupNameInvalid } = this.state

    return (
      <Modal
        title="设置讨论组"
        visible={visible}
        onOk={this.handleOnOk}
        okText={'保存修改'}
        onCancel={onCancel}
        wrapClassName={styles.groupSettingModal}
      >
        <div className={styles.content}>
          <div className={styles.row}>
            <span>讨论组名：</span>
            <Input style={{ width: 300 }} value={name} placeholder="讨论组名称" onChange={this.handleGroupNameChange}/>
          </div>
          {groupNameInvalid ? <div className="danger">讨论组名称不能为空！</div> : null}
          {/* <div className={styles.row}>
            <span>角色上限：</span>
            <InputNumber min={2} max={300} defaultValue={limit} onChange={this.handleLimitChange}/>
          </div>*/}
        </div>
      </Modal>
    )
  }

}
