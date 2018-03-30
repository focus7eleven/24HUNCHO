import React from 'react'
import styles from './ChatMessage.scss'
import { Map } from 'immutable'
import emojione from 'emojione.js'
import classNames from 'classnames'
import FileCard, { FILE_STATE, FILE_CARD_POSITION } from '../card/FileCard'
import ImageCard, { IMAGE_STATE, IMAGE_CARD_POSITION } from '../card/ImageCard'
import { announcementTime } from 'time'

const DEFAULT_AVATOR = 'http://superid-public.oss-cn-shanghai.aliyuncs.com/person_default.png'

const Constants = window.SocketClient.Constants

export const MESSAGE_POSITION = {
  LEFT: 0,
  RIGHT: 1,
}

export default class ChatMessage extends React.Component {

  static defaultProps = {
    message: {}, // 消息体
    position: MESSAGE_POSITION.LEFT, // 消息位置
    onSend: () => {}, // 消息处理回调函数

    affair: Map({}), // 消息关联事务
    role: {}, // 消息发送方角色

    inAffair: false, // 事务内消息
  }

  constructor(props) {
    super(props)
  }

  state = {

  }

  // 根据 roleId 获取角色信息
  getRoleFromMembers = (roleId) => {
    const { members } = this.props
    const role = members.find((m) => m.id === parseInt(roleId))
    return role
  }

  handleMessage = () => {
    const { onSend } = this.props
    onSend && onSend()
  }

  renderMessageContent = (message, isRightPosition) => {
    const { affairId, roleId, role, inAffair } = this.props
    const maxWidth = inAffair ? '300px' : '160px'
    let content

    switch (message.sub) {
      case Constants.CHAT_SUBTYPE.DEFAULT:
        return (
          <div className={styles.msg} style={{ maxWidth }}>
            <pre style={{ maxWidth }}>{emojione.shortnameToUnicode(message.content)}</pre>
            <div className={styles.bulge} />
          </div>
        )
      case Constants.CHAT_SUBTYPE.FUND.SEND:
        content = JSON.parse(message.content)

        return (
          <FundCard
            position={isRightPosition ? FUND_CARD_POSITION.RIGHT : FUND_CARD_POSITION.LEFT}
            message={message}
            onSend={this.handleMessage}
            roleId={roleId}
            toRole={this.getRoleFromMembers(content.toRoleId)}
            affairId={affairId}
          />
        )

      case Constants.CHAT_SUBTYPE.FILE:
        return (
          <FileCard
            file={message.file}
            state={FILE_STATE.NOT_UPLOADED}
            position={isRightPosition ? FILE_CARD_POSITION.RIGHT : FILE_CARD_POSITION.LEFT}
            roleId={roleId}
            affairId={affairId}
            content={message.content}
            updateMessage={message.callback}
            cancelMessage={message.cancel}
          />
        )
      case Constants.CHAT_SUBTYPE.IMAGE:
        return (
          <ImageCard
            file={message.file}
            state={IMAGE_STATE.NOT_UPLOADED}
            position={isRightPosition ? IMAGE_CARD_POSITION.RIGHT : IMAGE_CARD_POSITION.LEFT}
            roleId={roleId}
            affairId={affairId}
            content={message.content}
            updateMessage={message.callback}
            cancelMessage={message.cancel}
            scrollToBottom={this.props.scrollToBottom}
            updateMessageHeight={this.props.updateMessageHeight}
          />
        )
      case Constants.CHAT_SUBTYPE.MATERIAL.SEND:
        content = JSON.parse(message.content)

        return (
          <AssetCard
            message={message}
            affair={this.props.affair}
            position={isRightPosition ? ASSET_CARD_POSITION.RIGHT : ASSET_CARD_POSITION.LEFT}
            roleId={this.props.affair.get('roleId')}
            toRole={this.getRoleFromMembers(content.toRoleId)}
            role={role}
          />
        )
      case Constants.CHAT_SUBTYPE.VIDEO.INVITATION:
        return (
          <div className={styles.msg} style={{ backgroundColor: 'rgba(74, 144, 226, 0.12)' }} >
            <pre>发起视频通话，<span className={styles.link} onClick={() => this.props.enterConference(message)}>点击进入</span></pre>
            <div className={styles.bulge} style={isRightPosition ? { borderLeftColor: 'rgba(74, 144, 226, 0.12)' } : { borderRightColor: 'rgba(74, 144, 226, 0.12)' }} />
          </div>
        )
      default:
        return null
    }
  }

  renderSystemNotice = (message) => {

    const { currentRoleId } = this.props
    if (!message.content) {
      return null
    }
    const content = JSON.parse(message.content)
    let role, roleName, messageContent = null

    switch (message.sub) {
      case Constants.CHAT_SUBTYPE.GROUP.CREATE:
        messageContent = (
          <div className={styles.systemNotice}>
            <div>{`${announcementTime(message.time)} ${content.name}创建了群聊`}</div>
          </div>
        )
        break
      case Constants.CHAT_SUBTYPE.GROUP.INVITATION:
        messageContent = (
          <div className={styles.systemNotice}>
            <div>{`${announcementTime(message.time)} ${content.inviterName}邀请${content.inviteeName}加入了群聊`}</div>
          </div>
        )
        break
      case Constants.CHAT_SUBTYPE.GROUP.REMOVE:
        messageContent = (
          <div className={styles.systemNotice}>
            <div>{`${announcementTime(message.time)} ${content.removerName}将${content.removeeName}移出了群聊`}</div>
          </div>
        )
        break
      case Constants.CHAT_SUBTYPE.GROUP.EXIT:
        messageContent = (
          <div className={styles.systemNotice}>
            <div>{`${announcementTime(message.time)} ${content.roleTitle}退出了群聊`}</div>
          </div>
        )
        break
      case Constants.CHAT_SUBTYPE.GROUP.DISMISS:
        messageContent = (
          <div className={styles.systemNotice}>
            <div>{`${announcementTime(message.time)} ${content.name}解散了群聊`}</div>
          </div>
        )
        break
      case 75:
        messageContent = (
          <div className={styles.systemNotice}>
            <div>{`${announcementTime(message.time)} ${currentRoleId === content.roleId ? '你' : content.name}修改讨论组名为${content.newGroupName}`}</div>
          </div>
        )
        break
      default:
        break
    }

    return messageContent

  }

  render() {
    const { message, position, role } = this.props
    const isRightPosition = (position === MESSAGE_POSITION.RIGHT)

    let chatMessage = null

    if (message.fromUserId === 0) {
      chatMessage = this.renderSystemNotice(message)
    } else {
      const roleName = role ? role.title + '-' + role.realName : ''
      const roleAvatar = role ? role.avatar : DEFAULT_AVATOR

      if (isRightPosition) {
        chatMessage = (
          <div className={classNames(styles.chatMessage, styles.rightMsg)} >
            <div className={styles.title}>
              <span>{roleName} {message.time ? announcementTime(message.time) : ''}</span>
            </div>
            {this.renderMessageContent(message, isRightPosition)}
            <div className={styles.avatar}>
              <img src={roleAvatar} />
            </div>
          </div>
        )
      } else {
        chatMessage = (
          <div className={classNames(styles.chatMessage, styles.leftMsg)}>
            <div className={styles.title}>
              <span>{roleName} {announcementTime(message.time)}</span>
            </div>
            <div className={styles.avatar}>
              <img src={roleAvatar} />
            </div>
            {this.renderMessageContent(message, isRightPosition)}
          </div>
        )
      }
    }


    return chatMessage
  }

}
