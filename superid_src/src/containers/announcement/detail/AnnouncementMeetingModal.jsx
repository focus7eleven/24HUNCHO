import React from 'react'
import { Modal, Form, Input, DatePicker, Message } from 'antd'
import moment from 'moment'
import urlFormat from 'urlFormat'
import messageHandler from 'messageHandler'
import { List } from 'immutable'
import config from '../../../config'
import styles from './AnnouncementMeetingModal.scss'
import { RoleSelector } from '../../../components/role/RoleSelector'

const FormItem = Form.Item

const AnnouncementMeetingModal = React.createClass({
  getDefaultProps(){
    return {
      visible: true,
      title: '创建会议',
      meeting: null,
      roleList: List(),
    }
  },
  getInitialState(){
    return {
      searchText: '',
      dataSource: ['29 - 创建发布需求', '34 － 发布与工作', '51 － 发布与评论'],
      selectedRoleList: List(),
      hasSelected: true,
    }
  },
  componentDidMount(){
    const { meeting } = this.props
    if (meeting) {
      this.setState({
        selectedRoleList: meeting.get('joinRoles')
      })

      this.props.form.setFieldsValue({
        name: meeting.get('name'),
        time: moment(Number.parseInt(meeting.get('beginTime'))),
        duration: (meeting.get('lastTime') / 3600).toFixed(2),
        spot: meeting.get('address'),
        comment: meeting.get('note'),
      })
    }
  },
  onCancel(){
    this.props.onCancel && this.props.onCancel()
  },
  onRoleChange(val) {
    this.setState({
      selectedRoleList: val,
      hasSelected: val.size < 1 ? false : true,
    })
  },
  onSubmit(){
    const { affair, announcement, meeting } = this.props

    this.props.form.validateFields((err, values) => {
      if (this.state.selectedRoleList.size < 1) {
        this.setState({
          hasSelected: false,
        })
        return
      }
      if (!err) {
        const url = meeting ?
          urlFormat(config.api.announcement.detail.meeting.modify(), { meetingId: meeting.get('meetingId') })
        :
          config.api.announcement.detail.meeting.create()
        fetch(url, {
          method: 'POST',
          affairId: affair.get('id'),
          roleId: affair.get('roleId'),
          resourceId: announcement.get('announcementId'),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: values.spot,
            announcementId: announcement.get('announcementId'),
            beginTime: values.time.valueOf(),
            lastTime: values.duration * 3600,
            name: values.name,
            note: values.comment,
            roleIds: this.state.selectedRoleList.map((v) => v.get('roleId')).toJS(),
          }),
        }).then((res) => res.json()).then(messageHandler).then((json) => {
          if (json.code == 0) {
            const text = meeting ? '修改成功' : '创建成功'
            Message.success(text)
            this.props.onUpdateMeetingList()
            this.onCancel()
          }
        })
      }
    })
  },
  render(){
    const { visible, title } = this.props
    const { getFieldDecorator } = this.props.form
    let selectorProps = this.state.hasSelected ? {} : { validateStatus: 'error', help: '请选择至少一个参与者' }
    return (
      <Modal
        title={title}
        visible={visible}
        wrapClassName={styles.modal}
        maskClosable={false}
        width={500}
        onCancel={this.onCancel}
        onOk={this.onSubmit}
      >
        <Form layout="horizontal">
          <FormItem
            label="会议名称"
          >
            {getFieldDecorator('name', {
              rules: [
                { min: 2, message: '会议名称为2到50字符' },
                { max: 50, message: '会议名称为2到50字符' },
                { required: true, message: '会议名称为2到50字符' },
              ],
            })(
              <Input />
            )}
          </FormItem>
          <FormItem
            label="开始时间"
          >
            {getFieldDecorator('time', {
              rules: [{
                required: true, message: '请输入开始时间',
              }],
            })(
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
              />
            )}
          </FormItem>
          <FormItem
            label="预计时长"
          >
            {getFieldDecorator('duration', {
              rules: [{
                pattern: /^[0-9]+(\.[0-9]+)?$/g, message: '请输入数字',
              }],
            })(
              <Input addonAfter="小时" />
            )}
          </FormItem>
          <FormItem
            label="会议地点"
          >
            {getFieldDecorator('spot', {
              rules: [{
                max: 50, message: '最多输入50字符',
              }],
            })(
              <Input />
            )}
          </FormItem>
          <FormItem
            label="参与者"
            {
              ...selectorProps
            }
          >
            <RoleSelector
              className={styles.roleSelector}
              roleList={this.props.roleList}
              onChange={this.onRoleChange}
              selectedRoleList={this.state.selectedRoleList}
              hasSelected={this.state.hasSelected}
            />
          </FormItem>
          <FormItem
            label="备注"
          >
            {getFieldDecorator('comment', {
              rules: [{
                max: 500,
                message: '最多输入500字符'
              }],
            })(
              <Input.TextArea autosize={{ minRows: 4, maxRows: 6 }}/>
            )}
          </FormItem>
        </Form>
      </Modal>
    )
  },
})

export default Form.create()(AnnouncementMeetingModal)
