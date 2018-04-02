import React from 'react'
import { Dehaze, DeleteIcon } from 'svg'
import { Form, Input, Button } from 'antd'

import styles from './EditableQuestionItem.scss'
const createForm = Form.create
const FormItem = Form.Item
class EditableQuestionItem extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      editModel: false,
    }
  }
  resetEditTable = () => {
    const question = this.props.val
    this.props.form.setFieldsValue({
      quiz: question.question,
      answer: question.answer || '',
    })
  }
  showEditTable = () => {
    this.resetEditTable()
    this.props.moveDisable()
    this.setState({
      editModel: true
    })
  }
  deleteConfirm = () => {
    this.props.deleteQuestion(this.props.idx)
  }
  editConfirm = (e) => {
    e.preventDefault()
    this.props.moveEnable()
    const formVal = this.props.form.getFieldsValue()
    this.props.editQuestion(formVal.quiz, formVal.answer, this.props.idx)
    this.setState({
      editModel: false
    })
  }
  editCancel = () => {
    this.props.moveEnable()
    this.setState({
      editModel: false
    })
  }
  render() {
    const question = this.props.val
    const idx = this.props.idx
    const { getFieldDecorator } = this.props.form
    const questionOverview = question.question.length > 20 ? question.question.slice(0, 20) + '...' : question.question
    return (
      <div className={styles.editableQuestionItem}>
        <div className="questionContent">
          <div>
            <span><Dehaze onMouseDown={this.props.moveEnabled > 0 && this.props.dragItem} data-question={question.question} data-index={idx}/></span>
            <p>{questionOverview}</p>
          </div>
          <div className="control">
            <span onClick={this.showEditTable}>编辑</span>
            <DeleteIcon onClick={this.deleteConfirm}/>
          </div>
        </div>
        {
                    this.state.editModel && <Form layout="horizontal" onSubmit={this.editConfirm} className={styles.editTable}>
                      <FormItem label="问题:" labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
                        {getFieldDecorator('quiz')(<Input />)}
                      </FormItem>
                      <FormItem label="答案:" labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
                        {getFieldDecorator('answer')(<Input />)}
                      </FormItem>
                      <FormItem>
                        <Button className="cancel" onClick={this.editCancel}>取消</Button>
                        <Button className="confirm" htmlType="submit">确认</Button>
                      </FormItem>
                    </Form>
                }

      </div>
    )
  }
}
export default createForm()(EditableQuestionItem)
