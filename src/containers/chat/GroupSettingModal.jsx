import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { editGroupInfo } from '../../actions/chat'
import styles from './GroupSettingModal.scss'
import { Button, Modal, Input, message } from 'antd'

const ERROR = [
  '',
  '讨论组名称不能为空',
  '讨论组名称不能超过15个字符',
]

class GroupSettingModal extends React.Component {

  static defaultProps = {
    group: null
  }

  constructor(props) {
    super(props)
  }

  state = {
    name: this.props.selectedChat.getIn(['groupInfo', 'name']),
    groupNameInvalid: 0,
    loading: false,
  }

  handleGroupNameChange = (e) => {
    const value = e.target.value

    let groupNameInvalid = 0
    if (value.trim().length > 15) {
      groupNameInvalid = 2
    } else if (value.trim().length === 0) {
      groupNameInvalid = 1
    }

    this.setState({
      groupNameInvalid,
      name: value
    })
  }

  handleOnOk = () => {
    const { onCancel, onOk, selectedChat, affairId, roleId } = this.props
    const { name, groupNameInvalid } = this.state
    if (name.trim() === '') {
      this.setState({ groupNameInvalid: 1})
      return
    }

    if (groupNameInvalid) {
      return
    }

    const requestBody = {
      name,
      groupId: selectedChat.getIn(['groupInfo', 'groupId'])
    }

    this.setState({ loading: true })
    this.props.editGroupInfo(requestBody, affairId, roleId).then(res => {
      if (res) {
        onCancel()
      }
      this.setState({ loading: false })
    })
  }

  render() {
    const { visible, onCancel } = this.props
    const { name, groupNameInvalid, loading } = this.state

    return (
      <Modal
        title="设置讨论组"
        visible={visible}
        onOk={this.handleOnOk}
        // okText={'保存修改'}
        onCancel={onCancel}
        wrapClassName={styles.groupSettingModal}
        footer={[
          <Button key="cancel" size="large" onClick={onCancel}>取消</Button>,
          <Button key="submit" type="primary" size="large" loading={loading} onClick={this.handleOnOk}>保存修改</Button>,
        ]}
      >
        <div className={styles.content}>
          <div className={styles.row}>
            <span>讨论组名：</span>
            <Input style={{ width: 300 }} value={name} placeholder="讨论组名称" onChange={this.handleGroupNameChange}/>
          </div>
          {groupNameInvalid ? <span className="danger">{ERROR[groupNameInvalid]}</span> : null}
        </div>
      </Modal>
    )
  }

}
function mapStateToProps(state, props) {
	return {
		roleId: state.getIn(['user', 'role', 'roleId']),
    affairId: props.match.params.groupId || props.match.params.id,
    selectedChat: state.getIn(['chat', 'selectedChat']),
	}
}

function mapDispatchToProps(dispatch) {
	return {
    editGroupInfo: bindActionCreators(editGroupInfo, dispatch),
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(GroupSettingModal))
