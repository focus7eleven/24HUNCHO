import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fromJS } from 'immutable'
import { Tag, Icon } from 'antd'
import { ChatGroupIcon, Comment, ReleaseWorkIcon, AnnouncementSubIcon } from 'svg'
import classNames from 'classnames'
import styles from './InnerAnnouncement.scss'
import { announcementTime } from 'time'
import { pushURL } from 'actions/route'

export const VISION = {
  BRIEF: 0,
  DEFAULT: 1,
}
export const TEMPLATE = {
  DEFAULT: 0,
  REQUIREMENT: 2,
  BUG: 1,
}
export const TEMPLATE_ATTRS = [{
  text: '发布',
  typeName: '普通',
  color: '#4a90e2',
}, {
  text: 'BUG',
  color: '#f45b6c',
}, {
  text: '需求',
  color: '#66b966',
}]

const MAX_WORDCOUNT = 150

const InnerAnnouncement = React.createClass({
  onClick() {
    const { affairId, announcement } = this.props

    if (!announcement.get('isDraft')) {
      this.props.pushURL(`/workspace/affair/${affairId}/announcement/inner/detail/${announcement.get('id')}`)
    } else {
      this.props.handleEditDraft && this.props.handleEditDraft(announcement.get('id'))
    }
  },
  renderIcon(){
    const { announcement } = this.props
    const attrs = TEMPLATE_ATTRS[Number.parseInt(announcement.get('plateType') || TEMPLATE.DEFAULT)]
    return (
      <div className={styles.icon} style={{ borderColor: attrs.color, color: attrs.color }}>
        {attrs.text}
      </div>
    )
  },
  renderContent(){
    const {
      announcement,
    } = this.props

    const thumbContent = announcement.get('thumbContent') || ''

    return (
      <div className={styles.container}>
        {announcement.get('type') === 0 &&
        <div className={styles.body}>
          {thumbContent.length > MAX_WORDCOUNT ?
              thumbContent.slice(0, MAX_WORDCOUNT) + '...'
            :
              thumbContent
            }
        </div>
        }
      </div>
    )
  },
  render(){
    const { announcement, vision, className, onClick } = this.props
    const invalidClassName = announcement.get('isDraft') || announcement.get('state') === 0 ? styles.invalidContainer : null

    // 纯文字展示
    if (vision == null) {
      return (
        <div className={classNames(styles.container, className, invalidClassName)} data-type="brief" onClick={onClick || this.onClick}>
          {this.renderIcon()}
          <div className={styles.title}>{announcement.get('title')}</div>
        </div>
      )
    }

    return vision == VISION.BRIEF ? (
      <div className={classNames(styles.container, this.props.wrapClassName, invalidClassName)} data-type="brief" onClick={this.onClick}>
        {this.renderIcon()}
        <div className={styles.title}>
          {`${announcement.get('number')} - ${announcement.get('title')}`}
          {!announcement.get('isDraft') && announcement.get('state') === 0 && <Icon type="clock-circle-o" style={{ marginLeft: 5 }} />}
        </div>
        <div className={styles.avatarWrapper}>
          <div className={styles.name}>{announcement.get('roleName')}－{announcement.get('username')}</div>
          {announcement.get('avatar') ? (
            <img className={styles.avatar} src={announcement.get('avatar')} />
          ) : (
            <div className={styles.avatar} />
          )}
        </div>
      </div>
    ) : (
      <div className={classNames(styles.container, this.props.wrapClassName, invalidClassName)} data-type="default" onClick={this.onClick}>
        {this.renderIcon()}
        <div className={styles.mainWrapper}>
          <div className={styles.header}>
            <div className={styles.title}>{`${announcement.get('number')} - ${announcement.get('title')}`}</div>
            <div className={styles.avatarWrapper}>
              <div className={styles.name}>{announcement.get('roleName')}－{announcement.get('username')}</div>
              {announcement.get('avatar') ? (
                <img className={styles.avatar} src={announcement.get('avatar')} />
              ) : (
                <div className={styles.avatar} />
              )}
            </div>
          </div>
          <div className={styles.optionGroup}>
            {announcement.get('params') && announcement.get('params').map((v, k) => {
              return (
                <div className={styles.option} key={k}>
                  <div className={styles.name}>{k}：</div>
                  <div className={styles.value}>{v}</div>
                </div>
              )
            })}
          </div>
          <div className={styles.content}>
            {this.renderContent()}
          </div>
          <div className={styles.tagGroup}>
            {announcement.get('tags') && fromJS(JSON.parse(announcement.get('tags'))).map((obj, index) => {
              return (
                <Tag key={index}>{obj}</Tag>
              )
            })}
          </div>
          <div className={styles.stateGroup}>
            <div className={styles.state}>
              <ReleaseWorkIcon />
              <div>
                工作：{announcement.get('completeTaskNum')}
                /{announcement.get('totalTaskNum')}
              </div>
            </div>
            <div className={styles.state}>
              <ChatGroupIcon />
              <div>会议：{announcement.get('totalMeetingNum')}</div>
            </div>
            <div className={styles.state}>
              <AnnouncementSubIcon />
              <div>子发布：{announcement.get('totalChildNum')}</div>
            </div>
            <div className={styles.state}>
              <Comment />
              <div>评论：{announcement.get('totalCommentNum')}</div>
            </div>
            <div className={styles.time}>
              {announcementTime(announcement.get('modifyTime'))}
            </div>
          </div>
        </div>
      </div>
    )
  },
})

export default connect(null, (dispatch) => ({ pushURL: bindActionCreators(pushURL, dispatch) }))(InnerAnnouncement)
