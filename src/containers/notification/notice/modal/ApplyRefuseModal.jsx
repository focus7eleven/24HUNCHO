import React from 'react'
import PropTypes from 'prop-types'
import { Modal, Button, Input } from 'antd'
import styles from './ApplyRefuseModal.scss'
import { AFFAIR_TYPE, AFFAIR_TYPES } from '../../../header/HeaderContainer'

const TextArea = Input.TextArea
class ApplyRefuseModal extends React.Component {
  state = {
    role: {
      roleId: 1,

    }
  }

  handleCancel = () => {
    this.props.cancelCallback()
  }

  handleOk = () => {
    this.props.submitCallback(this.reason.textAreaRef.value)
  }

  render() {
    const { type } = this.props
    return (
      <Modal
        wrapClassName={styles.modalContainer}
        visible
        title="拒绝理由"
        onCancel={() => this.handleCancel()}
        onOk={() => this.handleOk()}
      >
        <div className={styles.body}>
          <TextArea
            ref={(el) => this.reason = el}
            style={{ resize: 'none'}}
            cols={5}
            rows={5}
            placeholder="请输入拒绝理由"
            onPressEnter={() => this.handleOk()} />
        </div>
      </Modal>
    )
  }
}

ApplyRefuseModal.propTypes = {
  cancelCallback: PropTypes.func.isRequired,
  submitCallback: PropTypes.func.isRequired,
}

export default ApplyRefuseModal
