import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fetchUserRoleList } from '../../actions/user'
import { Form, Modal, Select, Button, Input, message } from 'antd'
import styles from './ApplyAttendAffairModal.scss'
import messageHandler from 'messageHandler'
import config from '../../config'

const Item = Form.Item
const Option = Select.Option
/* 申请加入事务模态框 */
const ApplyAttendAnnouncementModal = React.createClass({
  getDefaultProps() {
    return {
      menkor: false,
    }
  },
  getInitialState(){
    return {
      visible: false,
      reasonWordNum: 0,
    }
  },
  componentWillMount() {
    if (this.props.user.get('roles').size == 0) {
      this.props.fetchUserRoleList()
    }
  },
  onCancel() {
    this.setState({ visible: false })
  },
  onShow() {
    this.setState({ visible: true })
  },
  onCommit() {
    const { affair, form, announcement } = this.props
    form.validateFields((errors) => {
      if (errors){
        return
      } else {
        const role = this.props.user.get('roles').find((v) => v.get('roleId') == form.getFieldValue('role'))
        fetch(config.api.announcement.apply(announcement.get('announcementId'), form.getFieldValue('reason')), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          affairId: affair.get('id'),
          roleId: role.get('roleId'),
          resourceId: announcement.get('announcementId'),
        }).then((res) => res.json()).then(messageHandler).then((res) => {
          if (res.code === 0) {
            this.setState({ visible: false, reasonWordNum: 0 })
            form.resetFields()
            message.success('已发送加入发布申请给事务管理员，请耐心等待')
            this.props.onSubmitSucceed && this.props.onSubmitSucceed()
          }
        })
      }
    })
  },
  onReasonContentChange(e) {
    this.setState({ reasonWordNum: e.target.value.length })
  },
  render(){
    const { form } = this.props
    const { getFieldDecorator, getFieldError } = form
    return (
      <div>
        <div onClick={this.onShow}>{this.props.children}</div>
        <Modal
          maskClosable={false}
          wrapClassName={this.props.menkor ? `${styles.applyModal} ${styles.menkorModal}` : styles.applyModal}
          title="申请加入发布"
          visible={this.state.visible}
          onCancel={this.onCancel}
          width={500}
          footer={[
            <div key="applyfoot">
              <Button type="ghost" size="large" key="applycancel" onClick={this.onCancel}>取消</Button>
              <Button type="primary" size="large" key="applysure" onClick={this.onCommit}>确定</Button>
            </div>
          ]}
        >
          <Form layout="horizontal">
            <Item style={{ height: '32px', overflow: 'visible' }}>
              <label className={styles.roleLabel}>选择角色:</label>
              {getFieldDecorator('role', {
                rules: [{
                  required: true,
                  message: '请选择加入角色'
                }],
                initialValue: (this.props.affair.get('roleId') || '').toString(),
              })(
                <Select
                  className={styles.role}
                  placeholder="请选择角色"
                  dropdownClassName={styles.roleDropdown}
                >
                  {
                    this.props.user.get('roles').map((value, key) => {
                      return (
                        <Option value={value.get('roleId').toString()} key={key.toString()}>
                          <div>{value.get('roleName')}－{value.get('allianceName')}</div>
                        </Option>
                      )
                    })
                  }
                </Select>
              )}
            </Item>
            <Item help={getFieldError('reason')} style={{ marginTop: '30px', height: '175px' }}>
              <label className={styles.reasonLabel}>申请理由:</label>
              {getFieldDecorator('reason', {
                initialValue: '',
                rules: [{
                  max: 300,
                  message: '申请理由小于300个字符',
                }, {
                  required: true,
                  message: '请填写申请理由'
                }],
                onChange: this.onReasonContentChange,
              })(
                <Input
                  type="textarea"
                  className={styles.reason}
                  autosize={{ minRows: 4, maxRows: 4 }}
                />
              )}
              <span className={styles.span}>{`${this.state.reasonWordNum}/300`}</span>
            </Item>
          </Form>
        </Modal>
      </div>
    )
  },
})

function mapStateToProps(state) {
  return {
    user: state.get('user'),
  }
}
function mapDispatchToProps(dispatch) {
  return {
    fetchUserRoleList: bindActionCreators(fetchUserRoleList, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(ApplyAttendAnnouncementModal))
