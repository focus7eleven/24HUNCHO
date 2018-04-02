import React from 'react'
import { Form, Input, Button, Modal, Icon } from 'antd'
import styles from './QuestionsContainer.scss'
import QuestionItem from './QuestionItem.jsx'
import EditableQuestionItem from './EditableQuestionItem.jsx'
import { Motion, spring } from 'react-motion'
const createForm = Form.create
const FormItem = Form.Item

const springConfig = { stiffness: 300, damping: 50 }

function clamp(n, min, max) {
  return Math.max(Math.min(n, max), min)
}

function reinsert(arr, from, to) {
  let _arr = arr.slice(0)
  const val = _arr.get(from)
  return _arr.splice(from, 1).splice(to, 0, val)
}

function getIndexByProp(arr, question) {
  for (let i = 0; i < arr.size; i++) {
    if (arr.get(i).question === question) {
      return i
    }
  }
  return -1
}


class QuestionsContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      questionModel: false,
      addModel: false,
      topDeltaY: 0,
      mouseY: 0,
      isPressed: false,
      originalPosOfLastPressed: 0,
      questionList: null,
      moveEnabled: 1,
    }
  }
  componentDidMount() {
    window.addEventListener('touchmove', this.handleTouchMove)
    window.addEventListener('touchend', this.handleMouseUp)
    window.addEventListener('mousemove', this.handleMouseMove)
    window.addEventListener('mouseup', this.handleMouseUp)
  }
  componentWillUnmount() {
    window.removeEventListener('touchmove', this.handleTouchMove)
    window.removeEventListener('touchend', this.handleMouseUp)
    window.removeEventListener('mousemove', this.handleMouseMove)
    window.removeEventListener('mouseup', this.handleMouseUp)
  }
  handleTouchStart = (key, pressLocation, e) => {
    this.handleMouseDown(key, pressLocation, e.touches[0])
  }
  handleTouchMove = (e) => {
    e.preventDefault()
    this.handleMouseMove(e.touches[0])
  }
  moveEnable = () => {
    this.setState({
      moveEnabled: this.state.moveEnabled + 1
    })
  }
  moveDisable = () => {
    this.setState({
      moveEnabled: this.state.moveEnabled - 1
    })
  }
  handleMouseDown = (e) => {
    const { pageY } = e
    const dataset = e.currentTarget.dataset
    const pressY = dataset.index * 33
    const pos = dataset.question
    this.setState({
      topDeltaY: pageY - pressY,
      mouseY: pressY,
      isPressed: true,
      originalPosOfLastPressed: pos,
    })
  }
  handleMouseMove = ({ pageY }) => {
    const { isPressed, topDeltaY, originalPosOfLastPressed } = this.state
    const questionList = this.state.questionList
    if (isPressed) {
      const mouseY = pageY - topDeltaY
      const currentRow = clamp(Math.round(mouseY / 33), 0, questionList.size - 1)
      let newOrder = questionList
      if (questionList.get(currentRow).question !== originalPosOfLastPressed) {
        newOrder = reinsert(questionList, getIndexByProp(questionList, originalPosOfLastPressed), currentRow)
      }
      this.setState({ mouseY: mouseY, questionList: newOrder })
    }
  }
  handleMouseUp = () => {
    this.setState({ isPressed: false, topDeltaY: 0 })
  }
  editQuestions = () => {
    this.setState({
      questionModel: true,
      questionList: this.props.questionList
    })
  }
  editConfirm = () => {
    const quizList = this.state.questionList

    this.props.updateQuizList(quizList)
    this.setState({
      questionModel: false,
    })
  }
  editCancel = () => {
    this.setState({
      questionModel: false,
      questionList: this.props.questionList
    })
  }
  showAddModel = () => {
    this.setState({
      addModel: true
    })
  }
  addCancel = () => {
    this.setState({
      addModel: false
    })
  }
  addConfirm = (e) => {
    e.preventDefault()
    this.props.form.validateFields((errors, values) => {
      if (errors) return
      this.setState({
        addModel: false,
        questionList: this.state.questionList.push({ question: values.quiz, answer: values.answer })
      })
    })
  }
  deleteQuestion = (index) => {
    this.setState({
      questionList: this.state.questionList.splice(index, 1)
    })
  }
  editQuestion = (newQuiz, newAnswer, index) => {
    const roleId = this.props.roleId
    let quiz = Object.assign({}, this.state.questionList.get(index))
    if (quiz.question !== newQuiz) {
      quiz.modifyTime = null
      quiz.question = newQuiz
      quiz.quizzer = roleId
    }
    if (quiz.answer !== newAnswer) {
      quiz.modifyTime = null
      quiz.answer = newAnswer
      quiz.replier = roleId
    }

    this.setState({
      questionList: this.state.questionList.set(index, quiz)
    })
  }
  renderMotion() {
    const { mouseY, isPressed, originalPosOfLastPressed } = this.state
    const questionList = this.state.questionList
    return (
      <div className={styles.dragList}>
        {questionList && questionList.map((i, index) => {
          const style = originalPosOfLastPressed === i.question && isPressed
            ? {
              shadow: spring(1, springConfig),
              y: mouseY,
              offset: mouseY - index * 33
            }
            : {
              shadow: spring(0, springConfig),
              y: spring(index * 33, springConfig),
              offset: 0,
            }
          return (
            <Motion style={style} key={i.question}>
              {({ shadow, y, offset }) => ( // eslint-disable-line
                <div
                  className={`dragItem ${i.question === originalPosOfLastPressed && isPressed ? 'draged' : ''}`}
                  style={{
                    boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${6 * shadow}px 0px`,
                    transform: `translate3d(0, ${offset}px, 0)`,
                    WebkitTransform: `translate3d(0, ${offset}px, 0)`,
                    zIndex: i.question === originalPosOfLastPressed ? 99 : 0,
                  }}
                >
                  <EditableQuestionItem dragItem={this.handleMouseDown} val={i} idx={index} moveEnabled={this.state.moveEnabled} moveEnable={this.moveEnable} moveDisable={this.moveDisable} editQuestion={this.editQuestion} deleteQuestion={this.deleteQuestion}/>
                </div>
              )}
            </Motion>
          )
        })}
      </div>
    )
  }
  renderAskQuestion() {
    const { getFieldDecorator } = this.props.form
    const quizDecorator = getFieldDecorator('quiz', {
      rules: [{
        required: true,
        message: '请输入问题'
      }],
    })

    return (
      <div className={`${styles.addQuestionField} ${this.state.addModel ? styles.editTable : ''}`}>
        <div
          className={`addQuestionTitle ${this.state.addModel ? '' : 'hoveredTitle'}`}
          style={this.state.addModel ? { color: '#9b9b9b' } : {}}
          onClick={this.showAddModel}
        >
          <Icon type="plus" />
          <span>添加问题</span>
        </div>
        {
          this.state.addModel && <Form style={{ marginTop: 5 }} horizontal onSubmit={this.addConfirm}>
            <FormItem label="问题:" labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
              {quizDecorator(<Input style={{ width: 310 }} />)}
            </FormItem>
            <FormItem label="答案:" labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
              {getFieldDecorator('answer')(<Input style={{ width: 310 }} />)}
            </FormItem>
            <FormItem>
              <Button className="cancel" onClick={this.addCancel}>取消</Button>
              <Button className="confirm" htmlType="submit">确认</Button>
            </FormItem>
          </Form>
          }
      </div>
    )
  }
  render(){
    const { open } = this.props

    return (
      <div className={styles.container}>
        <div className={styles.questionList}>
          {
            this.props.questionList.map((item) => <QuestionItem key={item.id} question={item.question} answer={item.answer}/>)
          }
        </div>
        {open ?
          <div className={styles.editBtn}>
            <Button type="ghost" size="large" onClick={this.editQuestions}>编辑问题</Button>
          </div>
          :
          null
        }
        <Modal
          width={500}
          title="编辑问题"
          visible={this.state.questionModel}
          className={styles.modal}
          onOk={this.editConfirm} onCancel={this.editCancel}
          footer={[
            <Button key="back" type="ghost" onClick={this.editCancel}>取消</Button>,
            <Button key="submit" type="primary" onClick={this.editConfirm}>确认</Button>
          ]}
        >
          {this.renderMotion()}
          {this.renderAskQuestion()}
        </Modal>
      </div>
    )
  }
}

export default createForm()(QuestionsContainer)
