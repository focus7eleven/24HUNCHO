import React, { PropTypes } from 'react'
import { Record, List } from 'immutable'
import classNames from 'classnames'
import { Input, Button, Popover } from 'antd'
import { Confuse, ThumbDown, ThumbUp } from 'svg'
import styles from './ConferenceChat.scss'
import CircleAvatar from '../../components/avatar/CircleAvatar'
import ColorSelector, { COLORS } from './ColorSelector'
import { VelocityComponent } from 'velocity-react'
import { VideoQuickReply } from 'svg'
import moment from 'moment'

export const NormalMessage = Record({
  avatar: 'https://unsplash.it/50',
  roleName: '财务主管',
  userName: '陈三',
  message: '客方针对此条公告所回复的消息内容',
  color: COLORS[0],
  timestamp: Date.now(),
  messageType: 'NormalMessage',
}, 'NormalMessage')

export const SystemMessage = Record({
  message: '视觉设计师-南京沃夫 申请使用屏幕',
  timestamp: Date.now(),
  messageType: 'SystemMessage',
}, 'SystemMessage')

const ConferenceChat = React.createClass({
  propTypes: {
    className: PropTypes.string,
    onSendData: PropTypes.func.isRequired, // 发送聊天的信息
    dataMap: PropTypes.object.isRequired,
    role: PropTypes.object.isRequired,
  },
  getInitialState() {
    return {
      messages: List(),
      ownMessages: List(),
      currentColor: COLORS[0], // 当前使用的字体颜色
      text: '', // 当前聊天输入框中的内容
      isSendingMessage: false,
    }
  },
  componentDidMount() {
    this.setState({
      mounted: true,
    })
  },

  sendMessage(quickReply) {
    const {
      role,
    } = this.props

    if (!quickReply && !this.state.text) return

    this.setState({
      isSendingMessage: true,
    })

    const message = NormalMessage({
      message: quickReply || this.state.text,
      color: quickReply ? COLORS[0] : this.state.currentColor,
      timestamp: Date.now(),
      avatar: role.get('avatar'),
      userName: role.get('userName'),
      roleName: role.get('roleName'),
    })

    this.props.onSendData({
      type: 'message',
      payload: {
        content: message,
      },
    })
    this.setState({
      isSendingMessage: false,
      text: '',
      ownMessages: this.state.ownMessages.push(message),
    })
  },

  renderChatHistory() {
    let totalMessages = this.props.dataMap.toList()
      .map((v) => v.get('message'))
      .flatten()
      .filter((v) => !!v)
      .map((v) => {
        v = v.content
        if (v.messageType === 'NormalMessage') {
          return new NormalMessage(v)
        } else if (v.messageType === 'SystemMessage') {
          return new SystemMessage(v)
        } else {
          return null
        }
      })
      .filter((v) => !!v)
    totalMessages = totalMessages.concat(this.state.ownMessages)
    totalMessages = totalMessages.sort((a, b) => a.get('timestamp') - b.get('timestamp'))

    return (
      <div className={styles.chatHistory} ref={(ref) => this._chatHistory = ref}>
        {
          totalMessages.map((msg, index) => {
            const type = msg._name

            if (type === 'NormalMessage') {
              const isMyOwnMessage = msg.get('roleName') === this.props.role.get('roleName') && msg.get('userName') === this.props.role.get('userName')

              let affixIcon = null
              if (msg.get('message') === '赞同') affixIcon = <ThumbUp />
              if (msg.get('message') === '疑问') affixIcon = <Confuse />
              if (msg.get('message') === '反对') affixIcon = <ThumbDown />

              if (isMyOwnMessage) {
                return (
                  <div key={index} className={classNames(styles.normalMessage, styles.myOwnMessage)}>
                    <div style={{ marginTop: 10, marginLeft: 10 }}>
                      <CircleAvatar radius={24} src={msg.get('avatar')} />
                    </div>

                    <div className={styles.normalMessageRight}>
                      <p>{`${msg.get('roleName')}－${msg.get('userName')} ${moment(msg.get('timestamp')).format('HH:mm')}`}</p>
                      <div style={{ color: msg.get('color') }} className={classNames(styles.messageBubble, affixIcon ? styles.preformatMessage : null )}>
                        {msg.get('message')}
                        {affixIcon}
                        <div className={styles.arrow} />
                      </div>
                    </div>
                  </div>
                )
              } else {
                return (
                  <div key={index} className={styles.normalMessage}>
                    <div style={{ marginTop: 10 }}>
                      <CircleAvatar radius={24} src={msg.get('avatar')} />
                    </div>

                    <div className={styles.normalMessageRight}>
                      <p>{`${msg.get('roleName')}－${msg.get('userName')} ${moment(msg.get('timestamp')).format('HH:mm')}`}</p>
                      <div style={{ color: msg.get('color') }} className={classNames(styles.messageBubble, affixIcon ? styles.preformatMessage : null )}>
                        {msg.get('message')}
                        {affixIcon}
                        <div className={styles.arrow} />
                      </div>
                    </div>
                  </div>
                )
              }
            } else if (type === 'SystemMessage') {
              return (
                <div className={styles.systemMessage} key={index}>
                  {`${msg.get('message')} ${moment(msg.get('timestamp')).format('HH:mm')}`}
                </div>
              )
            } else {
              return null
            }
          }).map((v, k) => {
            if (k === totalMessages.size - 1 && this.state.mounted) {
              return (
                <VelocityComponent container={this._chatHistory} key={k} animation="scroll" offset={0} duration={500} runOnMount>
                  {v}
                </VelocityComponent>
              )
            } else {
              return v
            }
          })
        }
      </div>
    )
  },
  renderMessageInput() {
    const content = (
      <div className={styles.quickReply}>
        <div className={styles.quickReplyItem} onClick={() => this.sendMessage('赞同')}>
          <ThumbUp />
          <div>赞同</div>
        </div>
        <div className={styles.quickReplyItem} onClick={() => this.sendMessage('疑问')}>
          <Confuse />
          <div>疑问</div>
        </div>
        <div className={styles.quickReplyItem} onClick={() => this.sendMessage('反对')}>
          <ThumbDown />
          <div>反对</div>
        </div>
      </div>
    )

    return (
      <div className={styles.messageInput}>
        <div>
          <ColorSelector color={this.state.currentColor} onChange={(color) => this.setState({ currentColor: color })} />
          <Input placeholder="发送消息" onKeyPress={(evt) => evt.key === 'Enter' && this.sendMessage()} value={this.state.text} onChange={(evt) => this.setState({ text: evt.target.value })} style={{ color: this.state.currentColor, width: 200 }}/>
        </div>
        <div>
          <Popover placement="top" content={content} trigger="click">
            <span style={{ cursor: 'pointer' }}>
              <VideoQuickReply />
            </span>
          </Popover>
          <Button type="primary" onClick={() => this.sendMessage()} disabled={!this.state.text} loading={this.state.isSendingMessage}>发送</Button>
        </div>
      </div>
    )
  },
  render() {
    const {
      className,
    } = this.props

    return (
      <div className={classNames(styles.container, className)}>
        {this.renderChatHistory()}
        {this.renderMessageInput()}
      </div>
    )
  }
})

export default ConferenceChat
