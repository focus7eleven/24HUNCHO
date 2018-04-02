import React from 'react'
import { Modal, Form, Select, Input } from 'antd'
import styles from './InviteAllianceMember.scss'
import { MaleIcon, FemaleIcon } from 'svg'
import { connect } from 'react-redux'

const FormItem = Form.Item

let InviteAllianceMember = React.createClass({
  getDefaultProps() {
    return {
      visible: true,
      onCloseModal: () => {}
    }
  },

  render() {
    let { visible } = this.props

    return (
      <Modal
        wrapClassName={styles.inviteMemberModal}
        title="邀请成员"
        visible={visible}
        onCancel={this.props.onCloseModal}
        maskClosable={false}
      >
        {/*用户面板*/}
        <div className={styles.leftPanel}>
          <Form>
            <div className={styles.user}>
              <img src="http://simucy.oss-cn-shanghai.aliyuncs.com/user/1892/1.png" alt="头像"/>
              <div>
                <div className={styles.userName}>
                  <span>userName</span>
                  {true ? // eslint-disable-line
                    <MaleIcon className={styles.male}/>
                    :
                    <FemaleIcon className={styles.female}/>
                  }
                </div>
                <div className={styles.superId}>SuperID:1234</div>
              </div>
            </div>

            <FormItem>
              <Input placeholder="添加角色" />
            </FormItem>
            <FormItem>
              <Select placeholder="添加主事务" />
            </FormItem>
            <FormItem>
              <Input type="textarea" placeholder="填写邀请理由，等待对方通过" rows={5} style={{ resize: 'none' }} />
            </FormItem>
          </Form>
        </div>

        {/*权限*/}
        <div className={styles.rightPanel} />
      </Modal>
    )
  }
})

function mapStateToProps() {
  return {}
}

function mapDispatchToProps() {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(InviteAllianceMember))
