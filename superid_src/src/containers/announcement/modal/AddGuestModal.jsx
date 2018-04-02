import React from 'react'
import { Modal, Button } from 'antd'
import { List } from 'immutable'

import styles from './AddGuestModal.scss'
import ChoosePublishTarget from '../../task/ChoosePublishTarget'

class AddGuestModal extends React.Component {
  static defaultProps = {
    alreadyGuestList: List(),
  }

  handleEditGuest(){
    const chosenMap = this._choosePublishTarget.getWrappedInstance().getChosenList()
    this.props.submitCallback(chosenMap)
  }

  handleCancel(){
    this.props.cancelCallback()
  }

  render(){
    const { affair } = this.props
    return (
      <Modal wrapClassName={styles.editGuestModal}
        width={900}
        title="添加客方"
        visible
        onOk={() => {}}
        onCancel={this.handleCancel.bind(this)}
        maskClosable={false}
        footer={[
          <div key={0}>
            <Button onClick={this.handleCancel.bind(this)} type="ghost">取消</Button>
            <Button type="primary" onClick={this.handleEditGuest.bind(this)}>确定</Button>
          </div>
        ]}
      >
        <ChoosePublishTarget
          ref={(ref) => this._choosePublishTarget = ref}
          allianceId={affair.get('allianceId')}
          roleId={affair.get('roleId')}
          affairId={parseInt(affair.get('id'))}
          affair={this.props.affair}
          alreadyGuestList={this.props.alreadyGuestList}
        />
      </Modal>
    )
  }
}


export default AddGuestModal
