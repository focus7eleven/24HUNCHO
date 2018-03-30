import React from 'react'
import moment from 'moment'
import { ChatGroupIcon, ChatIcon, ReleaseWorkIcon, AnnouncementSubIcon } from 'svg'
import styles from './InnerActivity.scss'
import { ACTIVITY_ATTRS, ACTIVITY_TYPE } from './ActivityList'

const MAX_WORDCOUNT = 90

class InnerActivity extends React.Component {

  onClick = (e) => {
    e.preventDefault()
    this.props.onClick(this.props.activity.get('id'))
  }

  renderIcon(){
    const { activity } = this.props
    const attrs = ACTIVITY_ATTRS[Number.parseInt(activity.get('type'))] || ACTIVITY_TYPE.OTHERS
    return (
      <div className={styles.icon} style={{ borderColor: attrs.color, color: attrs.color }}>
        {attrs.text}
      </div>
    )
  }
  renderContent(){
    const {
      activity,
    } = this.props

    const thumbContent = activity.get('content') || ''

    return (
      <div className={styles.container}>
        <div className={styles.body}>
          {thumbContent.length > MAX_WORDCOUNT ?
              thumbContent.slice(0, MAX_WORDCOUNT) + '...'
            :
              thumbContent
            }
        </div>
      </div>
    )
  }
  render(){
    const { activity } = this.props
    const lastComment = activity.get('latestComment')
    return (
      <div className={styles.container} data-type="default" onClick={this.onClick}>
        {this.renderIcon()}
        <div className={styles.mainWrapper}>
          <div className={styles.header}>
            <div className={styles.title}>{activity.get('title')}</div>
            <div className={styles.avatarWrapper}>
              <div className={styles.name}>{activity.get('createRoleTitle')}－{activity.get('creatorUserName')}</div>
              {activity.get('creatorAvatar') ? (
                <img className={styles.avatar} src={activity.get('creatorAvatar')} />
              ) : (
                <div className={styles.avatar} />
              )}
            </div>
          </div>
          <div className={styles.content}>
            {this.renderContent()}
          </div>
          <div className={styles.stateGroup}>

            <div className={styles.state}>
              <ChatIcon />
              <div>消息：{activity.get('commentNum')}</div>

              {
                lastComment &&
                <div className={styles.stateContent} >
                  最新：
                  <div className={styles.avatarWrapper}>
                    <img src={lastComment.getIn(['role', 'avatar'])} className={styles.avatar} />
                    <div className={styles.name}>{lastComment.getIn(['role', 'title'])}－{lastComment.getIn(['role', 'realName'])}</div>
                    {lastComment.get('toRole') &&
                      <span className={styles.replyContent}>
                        {' 回复 '}<a href="#">@{lastComment.getIn(['toRole','title'])}－{lastComment.getIn(['toRole', 'realName'])}</a>
                      </span>
                    }:
                  </div>
                  <div className={styles.content}>
                    {lastComment.get('content')}
                  </div>
                </div>
              }
            </div>

            <div className={styles.createTime}>
              {moment(activity.get('createTime')).format('YYYY/MM/DD kk:mm')}
            </div>
          </div>

        </div>
      </div>
    )
  }
}

export default InnerActivity
