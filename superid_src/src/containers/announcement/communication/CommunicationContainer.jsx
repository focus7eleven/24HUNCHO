import React from 'react'
import { connect } from 'react-redux'
import { DropDownIcon } from 'svg'
import config from '../../../config'
import { List } from 'immutable'
import QuestionContainer from '../question/QuestionsContainer.jsx'
import classNames from 'classnames'
import styles from '../question/QuestionsContainer.scss'

class CommunicationContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      questions: List(),
      questionStore: List(),
    }
  }

  componentWillMount() {
    this.getQuestions(this.props.scope, true)
  }

  componentDidUpdate(preProps) {
    if (preProps.scope !== this.props.scope) {
      this.getQuestions(this.props.scope)
    }
  }

  updateQuizList = (quizList) => {
    const { affair, announcementId, scope } = this.props
    const quiz = {
      allianceId: affair.get('allianceId'),
      announcementId: announcementId,
      type: scope,
      roleId: affair.get('roleId'),
      affairId: parseInt(affair.get('id')),
      quizList: quizList.toJS()
    }
    fetch((config.api.announcement.question.post), {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: announcementId,
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(quiz)
    }).then((res) => {
      return res.json()
    }).then(() => {
      this.getQuestions(scope, true)
    })
  }
  getQuestions = (questionScope) => {
    const { affair, announcementId } = this.props
    const questionStore = this.state.questionStore
    fetch(config.api.announcement.question.list.get(questionScope, announcementId, affair.get('allianceId'), affair.get('roleId'), affair.get('id')), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => {
      return res.json()
    }).then((json) => {
      let quizList = List(json.data)
      this.setState({
        questionStore: questionStore.set(questionScope, quizList),
        questions: quizList,
      })
    })
  }
  render() {
    const { affair, open, handleExpandQuestions } = this.props

    return (
      <div className={classNames(styles.question, open ? styles.open : null)}>
        <div className={styles.header}>
          <div>公共问题（{this.state.questions.size}）</div>
          <div className={open ? styles.open : ''} onClick={handleExpandQuestions}><DropDownIcon/></div>
        </div>
        <div className={styles.questionsContainer}>
          {open && <QuestionContainer questionList={this.state.questions} updateQuizList={this.updateQuizList} roleId={affair.get('roleId')} open={open}/>}
        </div>
      </div>
    )
  }
}
export default connect()(CommunicationContainer)
