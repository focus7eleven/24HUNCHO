import React from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import oss from 'oss'
import { message, Icon, Upload, Modal, Form, Select, Input, Button, DatePicker } from 'antd'
import { fromJS } from 'immutable'
import { createActivity } from '../../actions/activity'
import styles from './CreateActivityModal.scss'
import Editor from '../editor/AnnouncementEditor'
import moment from 'moment'

const FormItem = Form.Item
const Option = Select.Option

const ACTIVITY_TYPE = ['教学', '作业', '考试', '其它', '活动']

class CreateActivityModal extends React.Component {
  static propTypes = {
    affairId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    visible: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    affairId: '-1',
    title: '作业',
    visible: false,
    onClose: () => {},
    onSuccess: () => {}
  }

  state = {
    loading: false,
  }

  componentWillMount() {

  }

  handleOk = () => {
    // content from editor
    const content = this._editor.getWrappedInstance().getContent()
    console.log(content);

    this.props.form.validateFields(
      (err, values) => {
        if (!err) {
          const contentText = JSON.parse(content).blocks.reduce((r, v) => r + v.text, '')
          if (contentText.length === 0 || Object.keys(JSON.parse(content).entityMap) === 0) {
            message.error(this.props.title + '内容不能为空')
            return
          }

          const activityType = ACTIVITY_TYPE.indexOf(this.props.title)

          const attachments = values.appendix.map(f => ({fileName: f.name, size: f.size, url: f.response.path}))

          const formObj = {
            title: values.title,
            content: content,
            type: activityType,
            attachments: attachments,
          }

          if (activityType === 1) {
            formObj['homeworkType'] = values.homeworkType
            formObj['deadline'] = values.deadline.format('x')
          }

          this.setState({ loading: true })

          const { affairId, roleId } = this.props
          this.props.createActivity(affairId, roleId, JSON.stringify(formObj)).then(res => {
            if (res) {
              this.props.onSuccess()
            }
            this.setState({ loading: false })
          })
        }
      }
    )
  }

  handleCancel = () => {
    this.props.onClose()
  }

  normFile = (e) => {
    if (Array.isArray(e)) {
      return e
    }
    return e && e.fileList
  }

  // upload appendix
  handleUploadAttachment = ({ file, onSuccess, onProgress }) => {
    const { affairId, roleId } = this.props
    oss.uploadAnnouncementAttachmentPri(file, fromJS({ id: affairId, roleId: roleId }), (progress) => {
      onProgress({ percent: progress })
    }).then((res) => {
      onSuccess(res)
    })
  }

  disabledDate = (current) => {
    // Can not select days before today and today
    return current && current.valueOf() < Date.now();
  }

  render() {
    const { title, visible, } = this.props
    const { loading } = this.state

    const formItemLayout = { labelCol: { span: 3 }, wrapperCol: { span: 20 } }
    const footerItemLayout = { labelCol: { span: 6 }, wrapperCol: { span: 16 } }

    const { getFieldDecorator } = this.props.form;

    return (
        <Modal
          wrapClassName={styles.modalWrapper}
          width={700}
          visible={visible}
          title={'创建' + title}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          footer={[
            <Button key="cancel" size="large" onClick={this.handleCancel}>取消</Button>,
            <Button key="submit" type="primary" size="large" loading={loading} onClick={this.handleOk}>确认</Button>,
          ]}
        >
          <Form >
            <FormItem
              {...formItemLayout}
              label={title + '标题'}
              hasFeedback
            >
              {getFieldDecorator('title', {
                rules: [{
                  required: true, message: `请输入${title}标题`,
                }],
              })(
                <Input />
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label={title + '内容'}
              hasFeedback
            >
              {getFieldDecorator('content', {
              })(
                <Editor
                  className={styles.editor}
                  hideFooter
                  affairId={this.props.affairId}
                  roleId={this.props.roleId}
                  ref={(editor) => {this._editor = editor}}
                />
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="附件"
            >
              {getFieldDecorator('appendix', {
                valuePropName: 'fileList',
                getValueFromEvent: this.normFile,
                initialValue: [],
              })(
                <Upload
                  name="appendix"
                  customRequest={this.handleUploadAttachment}
                >
                  <Button className={styles.uploadButton}>
                    <Icon type="upload" /> 点击此处上传附件
                  </Button>
                </Upload>
              )}
            </FormItem>
            {
              title === '作业' &&
              <div className={styles.homeworkExtra}>
                <FormItem
                  {...footerItemLayout}
                  label="作业类型"
                >
                  {getFieldDecorator('homeworkType', {
                    initialValue: '0',
                  })(
                    <Select
                      placeholder="请选择作业类型"
                    >
                      <Option value="0">普通作业</Option>
                      <Option value="1">小组作业</Option>
                    </Select>
                  )}
                </FormItem>
                <FormItem
                  {...footerItemLayout}
                  label="截止时间"
                >
                  {getFieldDecorator('deadline', {
                    rules: [{ type: 'object', required: true, message: '请选择作业截止时间' }],
                  })(
                    <DatePicker
                      showTime={{ defaultValue: moment('23:59:59', 'HH:mm:ss') }}
                      disabledDate={this.disabledDate}
                      format="YYYY-MM-DD HH:mm:ss"
                    />
                  )}
                </FormItem>
              </div>
            }
          </Form>
        </Modal>
    )
  }
}

function mapStateToProps(state) {
  return {
    roleId: state.getIn(['user', 'role', 'roleId'])
  }
}

function mapDispatchToProps(dispatch) {
  return {
    createActivity: bindActionCreators(createActivity, dispatch),
  }
}

const WrappedModal = Form.create()(CreateActivityModal)

export default connect(mapStateToProps, mapDispatchToProps)(WrappedModal)
