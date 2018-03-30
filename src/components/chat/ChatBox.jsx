import React from 'react'
import PropTypes from 'prop-types'
import {
  Editor,
  EditorState,
  getDefaultKeyBinding,
  Modifier,
  SelectionState
} from 'draft-js'
import createClass from 'create-react-class'
import styles from './ChatBox.scss'
import { EmojiBtn, File, Material, Money, ImageUpLoad, VideoConference } from 'svg'
import { Button, Tooltip, Popover } from 'antd'
import Emoji from './Emoji'
import emojione from 'emojione.js'
// import StartConferenceModal from '../../containers/conference/StartConferenceModal'

const Constants = window.SocketClient.Constants

export const EmojiList = ['grinning', 'grimacing', 'grin', 'joy', 'smiley', 'smile', 'sweat_smile', 'laughing', 'innocent',
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

const ChatBox = createClass({
  PropTypes: {
    width: PropTypes.number,
    height: PropTypes.number,
    affairId: PropTypes.number,
    userId: PropTypes.number,
    // groupId: PropTypes.number.isRequired,
  },

  getDefaultProps(){
    return {
      height: 140,
      width: '100%',
      onSend: () => {}
    }
  },

  getInitialState() {
    return {
      imageUrl: '',
      editorState: EditorState.createEmpty(),
      videoConferenceModalVisible: false,
      materials: []
    }
  },

    //editor change
  onChange(editorState) {
    const input = editorState.getCurrentContent().getPlainText()
    if (input.length <= 1000) {
      this.setState({ editorState })
    }
  },

  sendKeyBindingFn(e) {
    if (e.keyCode === 13 /* `Enter` key */ && !(e.metaKey || e.ctrlKey || e.shiftKey)) {
            //换行，metaKey || ctrlKey + enter
      return 'send-message'
    }
    return getDefaultKeyBinding(e)
  },

  handleKeyCommand(command) {
    if (command === 'send-message') {
      this.handleSendMessage()
      return 'handled'
    }
    return 'not-handled'
  },

    //发送普通消息
  handleSendMessage() {
    let { editorState } = this.state
    let contentState = editorState.getCurrentContent()

    if (contentState.hasText()) {
      let message = ''

      contentState.getBlocksAsArray().map((block) => {
        if (block.text === '') {
          message += '\n'
        } else {
          message += block.text
        }
      })
      this.props.onSend(emojione.toShort(message))

      // clear content
      const firstBlock = contentState.getFirstBlock()
      const lastBlock = contentState.getLastBlock()
      const allSelected = new SelectionState({
        anchorKey: firstBlock.getKey(),
        anchorOffset: 0,
        focusKey: lastBlock.getKey(),
        focusOffset: lastBlock.getLength(),
        hasFocus: true
      })
      contentState = Modifier.removeRange(contentState, allSelected, 'backward')
      editorState = EditorState.push(editorState, contentState, 'remove-range')
      this.setState({ editorState })
    }
  },

  //发送图片
  handleSendImage(imageUrl) {
    if (imageUrl !== '') {
      this.props.onSend(`${imageUrl.host}/${imageUrl.path}`, Constants.CHAT_SUBTYPE.IMAGE)
    }
  },

    //选择emoji表情
  handleChooseEmoji(value) {
    let { editorState } = this.state
    let contentState = editorState.getCurrentContent()

    contentState = Modifier.insertText(contentState, editorState.getSelection(), value)
    editorState = EditorState.push(editorState, contentState, 'insert-characters')
    this.setState({ editorState })
  },

    //发送文件
  handleSendFiles(files, subType) {
    for (let i = 0; i < files.length; i++) {
      this.props.initFileMessage(files[i], subType)
    }
  },

   //组织成员数据结构，发送资金，发送物资，视频会议使用
  formatRoles(members, filterTag = false) {

    const roleId = this.props.affair.get('roleId')
    let roleList = members.toJS()
    if (filterTag) {
      roleList = roleList.filter((m) => m.id !== roleId)
    }
    roleList = roleList.map((v) => {
      v.roleId = v.id
      v.roleName = v.roleTitle
      v.userName = v.username
      return v
    })

    return roleList
  },

    //emoji 选择框
  renderEmojiPanel() {
    return (
      <div className={styles.emojiPanel}>
        <div className={styles.scroll}>
          {EmojiList.map((v) => {
            return (<div className={styles.emojiBox} key={v}>
              <Emoji shortName={v} onChoose={this.handleChooseEmoji}/>
            </div>)
          })}
        </div>
      </div>
    )
  },

  render(){
    const { height, width, affairId } = this.props
    // const { affair, height, width, affairId, userId, members, onSend, groupId } = this.props
    const { editorState, moneyModalVisible, assetModalVisible, materials } = this.state

    function getBlockStyle(block) {
      switch (block.getType()) {
        case 'blockquote':
          return 'RichEditor-blockquote'
        default:
          return null
      }
    }

    return (
      <div style={{ height: height, width: width }} className={styles.container}>
        <div className={styles.btns}>
          <Tooltip placement="bottom" title={'发送表情'}>
            <Popover content={this.renderEmojiPanel()} trigger="click" placement="topLeft"
              arrowPointAtCenter
            >
              <EmojiBtn height={21} width={21}/>
            </Popover>
          </Tooltip>
          <Tooltip placement="top" title={'发送文件'}>
            <File height={21} width={21} onClick={() => this.refs.fileUploader.click()}/></Tooltip>
          <Tooltip placement="top" title={'图片'}>
            <ImageUpLoad height={14} width={14} onClick={() => this.refs.imageUploader.click()} style={{ marginLeft: '8px', marginRight: '5px', position: 'relative', top: -2 }}/>
          </Tooltip>
          {/* <Tooltip placement="top" title={'视频通话'} onClick={() => this.setState({ videoConferenceModalVisible: true })}>
            <VideoConference height={18} width={18} style={{ position: 'relative', top: -1 }}/>
          </Tooltip> */}
        </div>
        <input title="点击选择文件" accept="*/*" type="file" name="html5uploader" ref="fileUploader"
          style={{ display: 'none' }} onChange={() => this.handleSendFiles(this.refs.fileUploader.files, Constants.CHAT_SUBTYPE.FILE)}
          onClick={(e) => e.target.value = null}
        />
        <input title="点击选择图片" accept="image/*" type="file" name="html5uploader" ref="imageUploader"
          style={{ display: 'none' }} onChange={() => this.handleSendFiles(this.refs.imageUploader.files, Constants.CHAT_SUBTYPE.IMAGE)}
          onClick={(e) => e.target.value = null}
        />

        <div className={styles.textarea}>
          <Editor
            blockStyleFn={getBlockStyle}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            keyBindingFn={this.sendKeyBindingFn}
            onChange={this.onChange}
          />
        </div>

        <div className={styles.footer}>
          <span>按下ctrl+enter换行</span>
          <Button type="primary" size="large" className={styles.sendBtn} onClick={this.handleSendMessage}>发送</Button>
        </div>
        {
          // this.state.videoConferenceModalVisible && userId &&
          // <StartConferenceModal
          //   inGroupMember={this.formatRoles(members)}
          //   affair={affair}
          //   userId={userId}
          //   groupId={groupId}
          //   onCancel={() => this.setState({ videoConferenceModalVisible: false })}
          //   onOk={(data) => {
          //     this.props.onSend(JSON.stringify(data), Constants.CHAT_SUBTYPE.VIDEO.INVITATION)
          //   }}
          // />
        }
      </div>
    )
  }
})

export default ChatBox
