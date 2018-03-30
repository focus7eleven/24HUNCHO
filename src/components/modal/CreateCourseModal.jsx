import React from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { message, Icon, Upload, Modal, Form, Select, Input, Button, DatePicker } from 'antd'
import { fromJS } from 'immutable'
import { createCourse } from '../../actions/course'
import { getUserRole } from '../../actions/user'
import styles from './CreateCourseModal.scss'
import MemberListButton from '../button/MemberListButton'

const FormItem = Form.Item
const Option = Select.Option
const { RangePicker } = DatePicker
const { TextArea } = Input

const GRADE_LIST = ['大一', '大二', '大三', '大四', '研一', '研二', '研三']
const CREDIT_LIST = ['1', '2', '3', '4', '5', '6']
const YEAR_LIST = Array(100).fill(2018)

class CreateCourseModal extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    visible: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    visible: false,
    onClose: () => {},
    onSuccess: () => {}
  }

  state = {
    loading: false,
    selectedTeachers: [],
  }

  // visible 状态改变
  // componentWillReceiveProps(props) {
  //   if (props.visible != this.props.visible) {
  //     this.setState({
  //       loading: false,
  //       selectedTeachers: []
  //     }, this.props.form.resetFields())
  //
  //   }
  // }

  handleSelectTeacher = (selectedTeachers) => {
    this.setState({ selectedTeachers })
    this.props.form.setFieldsValue({ teachers: selectedTeachers })
  }

  handleOk = () => {
    this.props.form.validateFields(
      (err, values) => {
        if (!err) {

          this.setState({ loading: true })

          const formObj = {
            credit: values.credit,
            description: values.description,
            endDate: values.duration[1].format('x'),
            grade: values.grade,
            name: values.name,
            number: values.number,
            season: values.season,
            startDate: values.duration[0].format('x'),
            teacherList: this.state.selectedTeachers.map(v => v.id),
            type: values.type,
            year: values.year
          }

          this.props.getUserRole(this.props.departmentId).then(res => {
            this.props.createCourse(this.props.departmentId, this.props.roleId, JSON.stringify(formObj)).then(res => {
              if (res) {
                this.props.onSuccess()
              }
              this.props.form.resetFields()
              this.setState({
                selectedTeachers: [],
                isLoading: false
              })
            })
          })
        }
      }
    )
  }

  handleCancel = () => {
    this.props.onClose()
  }

  render() {
    const { visible, } = this.props
    const { loading, selectedTeachers } = this.state

    const formItemLayout = { labelCol: { span: 4 }, wrapperCol: { span: 19 } }
    const yearLayout = { labelCol: { span: 8 }, wrapperCol: { span: 14 } }
    const seasonLayout = { labelCol: { span: 2 }, wrapperCol: { span: 22 } }

    const { getFieldDecorator } = this.props.form;

    return (
        <Modal
          wrapClassName={styles.modalWrapper}
          width={500}
          visible={visible}
          title='开设课程'
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
              label='课程编号'
              hasFeedback
            >
              {getFieldDecorator('number', {
                rules: [{
                  required: true, message: `请输入课程编号`,
                }],
              })(
                <Input />
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label='课程名'
              hasFeedback
            >
              {getFieldDecorator('name', {
                rules: [{
                  required: true, message: `请输入课程名`,
                }],
              })(
                <Input />
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label='任课老师'
              hasFeedback
            >
              {getFieldDecorator('teachers', {
                rules: [{
                  required: true, message: `请选择任课老师`,
                }],
              })(
                <div>
                  <MemberListButton
                    onMemberChange={this.handleSelectTeacher}
                    defaultList={selectedTeachers}
                  />
                  <Input style={{display: 'none'}}/>
                </div>
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label='课程描述'
              hasFeedback
            >
              {getFieldDecorator('description', {
                rules: [{
                  required: true, message: `请输入课程描述`,
                }],
              })(
                <TextArea rows="4" />
              )}
            </FormItem>
            <div className={styles.homeworkExtra}>
              <FormItem
                {...yearLayout}
                label="所属学期"
              >
                {getFieldDecorator('year', {
                  rules: [{
                    required: true, message: `请选择学年`,
                  }],
                  initialValue: '2018',
                })(
                  <Select
                    placeholder="请选择学年"
                  >
                    {
                      YEAR_LIST.map((y, index) => (
                        <Option key={index + 'year'} value={'' + (y + index)}>{y + index}</Option>
                      ))
                    }
                  </Select>
                )}
              </FormItem>
              <FormItem
                {...seasonLayout}
                label=""
              >
                {getFieldDecorator('season', {
                  rules: [{
                    required: true, message: `请选择学年`,
                  }],
                  initialValue: '0',
                })(
                  <Select
                    placeholder="请选择学年"
                  >
                    <Option value='0'>SPRING</Option>
                    <Option value='1'>SUMMER</Option>
                    <Option value='2'>AUTUMN</Option>
                    <Option value='3'>WINTER</Option>
                  </Select>
                )}
              </FormItem>
            </div>

            <FormItem
              {...formItemLayout}
              label="所属年级"
            >
              {getFieldDecorator('grade', {
                rules: [{
                  required: true, message: `请选择年级`,
                }],
                initialValue: '0',
              })(
                <Select
                  placeholder="请选择所属年级"
                >
                  {
                    GRADE_LIST.map((g, index) => (
                      <Option key={index + 'grade'} value={'' + index}>{g}</Option>
                    ))
                  }
                </Select>
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="起止时间"
            >
              {getFieldDecorator('duration', {
                rules: [{ required: true, message: '请选择课程起止时间' }],
              })(
                <RangePicker format="YYYY-MM-DD HH:mm:ss" />
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="学分"
            >
              {getFieldDecorator('credit', {
                rules: [{
                  required: true, message: `请选择课程学分`,
                }],
                initialValue: '1',
              })(
                <Select
                  placeholder="请选择课程学分"
                >
                  {
                    CREDIT_LIST.map((c, index) => (
                      <Option key={index + 'credit'} value={c}>{c + '分'}</Option>
                    ))
                  }
                </Select>
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="课程类型"
            >
              {getFieldDecorator('type', {
                rules: [{
                  required: true, message: `请选择课程类型`,
                }],
                initialValue: '0',
              })(
                <Select
                  placeholder="请选择课程类型"
                >
                  <Option value='0'>选修</Option>
                  <Option value='1'>必修</Option>
                </Select>
              )}
            </FormItem>
          </Form>
        </Modal>
    )
  }
}

function mapStateToProps(state) {
  return {
    roleId: state.getIn(['user', 'role', 'roleId']),
    departmentId: state.getIn(['user', 'departmentId'])
  }
}

function mapDispatchToProps(dispatch) {
  return {
    createCourse: bindActionCreators(createCourse, dispatch),
    getUserRole: bindActionCreators(getUserRole, dispatch),
  }
}

const WrappedModal = Form.create()(CreateCourseModal)

export default connect(mapStateToProps, mapDispatchToProps)(WrappedModal)
