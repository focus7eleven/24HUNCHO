import React from 'react'
import { Input, Button, Popover, Tooltip } from 'antd'
import emojione from 'emojione'
import { EmojiBtn } from '../../public/svg'
import styles from './CommentInput.scss'
import classNames from 'classnames'
import Emoji from '../chat/Emoji'
import { EmojiList } from '../chat/ChatBox'


/*
* 发布-评论 输入框
*/
class CommentInput extends React.Component {

  state = {
    inputError: null,
  }

  onSubmit = () => {
    const value = this.input.refs.input.value
    if (value.trim() == '') {
      this.setState({
        inputError: '评论内容不能为空！'
      })
      return
    }
    this.props.onSubmit(emojione.toShort(value), null, () => {
      this.input.refs.input.value = ''
    })
  }

  onInput = () => {
    if (this.state.inputError) {
      this.setState({
        inputError: null
      })
    }
  }

  handleChooseEmoji = (value) => {
    const ele = this.input.refs.input
    if (document.selection){
      //ie
      ele.focus()
      let sel = document.selection.createRange()
      sel.text = value
      sel.select()
    } else if (ele.selectionStart || ele.selectionStart == '0'){
      const startPos = ele.selectionStart
      const endPos = ele.selectionEnd

      const left = ele.scrollLeft
      ele.value = ele.value.substring(0, startPos) + value + ele.value.substring(endPos, ele.value.length)

      if (left !== 0){
        ele.scrollLeft = left
      }

      ele.focus()
      ele.selectionStart = startPos + value.length
      ele.selectionEnd = startPos + value.length
    } else {
      ele.value += value
      ele.focus()
    }
    // this.input.refs.input.value = this.input.refs.input.value + value
  }

  renderEmojiPanel = () => {
    return (
      // <div>表情</div>
      <div className={styles.emojiPanel}>
        <div className={styles.scroll}>
          {EmojiList.map((v) => {
            return (
              <div className={styles.emojiBox} key={v}>
                <Emoji shortName={v} onChoose={this.handleChooseEmoji}/>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  render(){
    const { btnText, placeholder } = this.props
    const { inputError } = this.state

    return (
      <div className={classNames(styles.commentInput, 'sys-comment-input')} onClick={(e) => e.stopPropagation()}>
        <Tooltip title={inputError} visible={inputError ? true : false} placement="topLeft">
          <Input ref={(el) => this.input = el} placeholder={placeholder} onPressEnter={this.onSubmit} onChange={this.onInput}/>
        </Tooltip>
        <div className={styles.btnAfterContainer}>
          <Popover content={this.renderEmojiPanel()} trigger="click">
            <EmojiBtn />
          </Popover>
          <Button type="primary" onClick={this.onSubmit}>{btnText}</Button>
        </div>
      </div>
    )
  }
}

export default CommentInput
