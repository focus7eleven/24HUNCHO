import React, { PropTypes } from 'react'
import { Modal, Input, Radio, message } from 'antd'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { startConference } from '../../actions/conference'
import MemberChooser from './MemberChooser'
import styles from './StartConferenceModal.scss'

const RadioGroup = Radio.Group

const StartConferenceModal = React.createClass({
  propTypes: {
    userId: PropTypes.number.isRequired,
    inGroupMember: PropTypes.array.isRequired,
    groupId: PropTypes.number.isRequired,
    affair: PropTypes.object.isRequired,
    onCancel: PropTypes.func.isRequired,
    onOk: PropTypes.func,
  },

  getInitialState() {
    return {
      roomName: '',
      recordingOption: 2, // 储存视频的相关选择。0：保存视频，1：仅保存音频，2：不保存
    }
  },

  getRecordingPath() {
    return `/${this.props.affair.get('name')}/meetingRecords/${this.state.roomName}`
  },

  handleCreateConference() {
    if (!this.state.roomName) {
      message.error('请输入视频会议的名称')
      return
    }

    const {
      affair,
      groupId,
    } = this.props

    const selectedRole = this._memberChooser.getSelectedRole()

    this.props.startConference(affair, groupId, selectedRole, this.state.roomName, this.state.recordingOption, this.getRecordingPath()).then((data) => {
      if (data) {
        const content = Object.assign({
          roleIds: selectedRole.map((v) => v.get('id')).push(affair.get('roleId')).toArray(),
        }, data)
        this.props.onOk(content)
        this.props.onCancel()
      }
    })
  },

  renderNameInput() {
    return (
      <div className={styles.nameInput}>
        <div style={{ whiteSpace: 'nowrap' }}>通话主题：</div>
        <Input value={this.state.roomName} placeholder="请输入视频会议的名称" onChange={(evt) => this.setState({ roomName: evt.target.value })} />
      </div>
    )
  },
  renderSelectMember() {
    const {
      userId,
      inGroupMember,
      affair,
    } = this.props

    return (
      <div className={styles.members}>
        <div>通话参与角色：</div>
        <MemberChooser
          affair={affair}
          userId={userId}
          inGroupMember={inGroupMember}
          ref={(ref) => this._memberChooser = ref}
        />
      </div>
    )
  },
  renderStoreLocation() {
    return (
      <div className={styles.storeLocation}>
        <RadioGroup onChange={(evt) => this.setState({ recordingOption: evt.target.value })} value={this.state.recordingOption}>
          <Radio value={0}>保存视频</Radio>
          <Radio value={1}>仅保存音频</Radio>
          <Radio value={2}>不保存</Radio>
        </RadioGroup>
        <p>{`存储路径：${this.getRecordingPath()}`}</p>
      </div>
    )
  },
  render() {
    return (
      <Modal
        title="发起视频通话"
        visible
        width={720}
        onCancel={this.props.onCancel}
        onOk={this.handleCreateConference}
        wrapClassName={styles.startConferenceModal}
      >
        {this.renderNameInput()}
        {this.renderSelectMember()}
        {this.renderStoreLocation()}
      </Modal>
    )
  }
})

function mapStateToProps() {
  return {}
}

function mapDispatchToProps(dispatch) {
  return {
    startConference: bindActionCreators(startConference, dispatch),
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(StartConferenceModal)
