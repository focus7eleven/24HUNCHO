import React from 'react'
import { fromJS } from 'immutable'
import { Modal, Row, Col } from 'antd'
import styles from './LateWorkModal.scss'
import RoleItem from '../../../../components/RoleItem'

class LateWorkModal extends React.Component {

  handleRemind = (id) => {
    this.props.onRemindCallback(id)
  }

  render() {
    const { userList } = this.props
    return (
      <Modal
        title="未交列表"
        wrapClassName={styles.modalContainer}
        visible
        footer={null}
        onCancel={this.props.onCancelCallback}
      >
        <div className={styles.container}>
          <Row>
            {userList.map((v, k) => {
              return (
                <Col span={12} key={k}>
                  <Row className={styles.userContainer}>
                    <Col span={16}>
                      <RoleItem role={v} />
                    </Col>
                    <Col span={8} style={{ height: 24 }}>
                      <span className={styles.remind} onClick={this.handleRemind.bind(this, v.get('roleId'))}>提醒</span>
                    </Col>
                  </Row>
                </Col>
              )
            })}
          </Row>
        </div>
      </Modal>
    )
  }
}

LateWorkModal.defaultProps = {
  userList: fromJS([
    {
      roleId: 1001,
      avatar: '',
      realName: '张文玘'
    }, {
      roleId: 1002,
      avatar: '',
      realName: '张文玘'
    }, {
      roleId: 1003,
      avatar: '',
      realName: '张文玘'
    }, {
      roleId: 1004,
      avatar: '',
      realName: '张文玘'
    }, {
      roleId: 1005,
      avatar: '',
      realName: '张文玘'
    }
  ])
}

export default LateWorkModal
