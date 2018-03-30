import React from 'react'
import { Input, Button, Popover, Tooltip } from 'antd'
import emojione from 'emojione'
import classNames from 'classnames'
import { EmojiBtn } from 'svg'
import styles from './CommentInput.scss'
import Emoji from '../editor/Emoji'
//
//
const EmojiList = ['grinning', 'grimacing', 'grin', 'joy', 'smiley', 'smile', 'sweat_smile', 'laughing', 'innocent',
  'wink', 'blush', 'slightly_smiling_face', 'upside_down_face', 'yum', 'relieved', 'heart_eyes', 'kissing_heart',
  'kissing', 'kissing_smiling_eyes', 'kissing_closed_eyes', 'stuck_out_tongue_winking_eye', 'stuck_out_tongue_closed_eyes', 'stuck_out_tongue', 'money_mouth_face', 'nerd_face', 'sunglasses',
  'hugging_face', 'smirk', 'no_mouth', 'neutral_face', 'expressionless', 'unamused', 'face_with_rolling_eyes', 'thinking_face', 'flushed',
  'disappointed', 'worried', 'angry', 'rage', 'pensive', 'confused', 'slightly_frowning_face', 'white_frowning_face', 'persevere',
  'confounded', 'tired_face', 'weary', 'triumph', 'open_mouth', 'scream', 'fearful', 'cold_sweat', 'hushed',
  'frowning', 'anguished', 'cry', 'disappointed_relieved', 'sleepy', 'sweat', 'sob', 'dizzy_face', 'astonished',
  'zipper_mouth_face', 'mask', 'face_with_thermometer', 'face_with_head_bandage', 'sleeping', 'zzz', 'hankey', 'smiling_imp', 'imp',
  '+1', '-1', 'eyes', 'fist', 'v', 'ok_hand', 'clap_tone1', 'pray', 'muscle', 'point_up', 'point_down', 'point_left', 'point_right', 'ear', 'open_hands', 'couple',
  'boy', 'girl', 'nauseated_face'
]
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
      <div className={styles.emojiPanel} data-index="emoji">
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
        <Tooltip title={inputError} visible={inputError} placement="topLeft">
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
