import React from 'react'
import { Question } from 'svg'
import styles from './QuestionItem.scss'

export default class QuestionItem extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showAnswer: false,
    }
  }
  toggleAnswer = () => {
    this.setState({
      showAnswer: !this.state.showAnswer
    })
  }
  render() {
    return (<div className={styles.questionItem}>
      <Question/>
      <div>
        <p className="question" onClick={this.toggleAnswer}>{this.props.question}</p>
        {
            this.state.showAnswer && <p className="answer">答：{this.props.answer}</p>
          }
      </div>
    </div>)
  }
}
