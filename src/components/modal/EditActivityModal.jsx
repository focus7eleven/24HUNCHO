import React from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import oss from 'oss'
import { message, Icon, Upload, Modal, Form, Select, Input, Button, DatePicker } from 'antd'
import { fromJS } from 'immutable'
import { EditorState, convertToRaw, convertFromRaw } from 'draft-js'
import moment from 'moment'
import EditorDecorator from '../editor/EditorDecorator'
import { updateActivity } from '../../actions/activity'
import styles from './CreateActivityModal.scss'
import Editor from '../editor/AnnouncementEditor'

const FormItem = Form.Item
const Option = Select.Option

const ACTIVITY_TYPE = ['教学', '作业', '考试', '其它', '活动']

class EditActivityModal extends React.Component {
  static propTypes = {
    affairId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    visible: PropTypes.bool.isRequired,
    activity: PropTypes.object.isRequired,
  }

  static defaultProps = {
    affairId: '-1',
    title: '作业',
    visible: false,
    onClose: () => {},
    onSuccess: () => {},
    activity: {}
  }

  state = {
    loading: false,
  }

  handleOk = () => {
    // content from editor
    const content = this._editor.getWrappedInstance().getContent()

    this.props.form.validateFields(
      (err, values) => {
        if (!err) {
          const contentText = JSON.parse(content).blocks.reduce((r, v) => r + v.text, '')
          if (contentText.length === 0 || Object.keys(JSON.parse(content).entityMap) === 0) {
            message.error(this.props.title + '内容不能为空')
            return
          }

          const activityType = ACTIVITY_TYPE.indexOf(this.props.title)

          const formObj = {
            title: values.title,
            content: content,
            type: activityType,
            id: this.props.activity.get('id')
          }

          if (activityType === 1) {
            formObj['homeworkType'] = values.homeworkType
            formObj['deadline'] = values.deadline.format('x')
          }

          this.setState({ loading: true })

          const { affairId, roleId } = this.props
          this.props.updateActivity(affairId, roleId, JSON.stringify(formObj)).then(res => {
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

  render() {
    const { title, visible, activity } = this.props
    const { loading } = this.state

    const formItemLayout = { labelCol: { span: 3 }, wrapperCol: { span: 20 } }
    const footerItemLayout = { labelCol: { span: 6 }, wrapperCol: { span: 16 } }

    const { getFieldDecorator } = this.props.form;

    const contentState = activity.get('content') ? convertFromRaw(JSON.parse(activity.get('content'))) : convertFromRaw(convertToRaw(EditorState.createEmpty(EditorDecorator).getCurrentContent()))
    const editorState = EditorState.createWithContent(contentState)

    return (
        <Modal
          wrapClassName={styles.modalWrapper}
          width={700}
          visible={visible}
          title={'编辑' + title}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          footer={[
            <Button key="cancel" size="large" onClick={this.handleCancel}>取消</Button>,
            <Button key="submit" type="primary" size="large" loading={loading} onClick={this.handleOk}>保存</Button>,
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
                initialValue: activity.get('title'),
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
                  announcementToEdit={activity.toJS()}
                  hideFooter
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
              activity.get('type') === 1 ?
              <div className={styles.homeworkExtra}>
                <FormItem
                  {...footerItemLayout}
                  label="作业类型"
                >
                  {getFieldDecorator('homeworkType', {
                    initialValue: '' + activity.get('homeworkType'),
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
                    initialValue: moment(activity.get('deadline'))
                  })(
                    <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
                  )}
                </FormItem>
              </div>
              : null
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
    updateActivity: bindActionCreators(updateActivity, dispatch),
  }
}

const WrappedModal = Form.create()(EditActivityModal)

export default connect(mapStateToProps, mapDispatchToProps)(WrappedModal)
