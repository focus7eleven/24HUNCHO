import React from 'react'
import PropTypes from 'prop-types'
import { fromJS } from 'immutable'
import moment from 'moment'
import oss from 'oss'
import { ReleaseWorkIcon, ReleaseMeetingIcon, SprigDownIcon } from 'svg'
import { getFileIcon } from 'file'
import styles from './NewsItem.scss'
import { TEMPLATE_ATTRS } from '../inner/InnerAnnouncement'

const NEWS_TYPE = {
  SUB_ANNOUNCEMENT: 0,
  WORK: 1,
  MEETING: 2,
  FILE: 3,
}

class NewsItem extends React.Component {
  formatNewsTime = (time) => {
    return moment(Number.parseInt(time)).format('YY/MM/DD HH:mm')
  }

  renderCard(){
    const { news } = this.props
    const operationDescription = fromJS(JSON.parse(news.get('operationDescription')))

    let valueComponent = null
    let iconComponent = null
    let subAnnouncementType = null
    let title = null
    let fileURL = null
    switch (news.get('type')){
      case NEWS_TYPE.WORK:
        valueComponent = (
          <span className={styles.cardRight}>
            <span className={styles.item}>
              <span className={styles.label}> 截止时间：</span>
              {operationDescription.get('offTime') ? this.formatNewsTime(operationDescription.get('offTime')) : '无'}
            </span>
            <span className={styles.smallAvatar}><img src={operationDescription.get('ownerAvatar')}/></span>
          </span>
      )
        iconComponent = (
          <span className={styles.circleIconWrapper} style={{ backgroundColor: '#f5a623' }}>
            <ReleaseWorkIcon/>
          </span>
      )
        title = operationDescription.get('title')
        break
      case NEWS_TYPE.MEETING:
        valueComponent = (
          <span className={styles.cardRight}>
            <span className={styles.item}>
              <span className={styles.label}> 开始时间：</span>
              {this.formatNewsTime(operationDescription.get('beginTime'))}
            </span>
            {operationDescription && operationDescription.get('lastTime') != null &&
            <span className={styles.item}>
              <span className={styles.label}> 时长：</span>
              {operationDescription.get('lastTime')}
            </span>
          }
            {operationDescription && operationDescription.get('address') != null &&
            <span className={styles.item}>
              <span className={styles.label}> 地点：</span>
              {operationDescription.get('address')}
            </span>
          }
          </span>
        )
        iconComponent = (
          <span className={styles.circleIconWrapper} style={{ backgroundColor: '#66b966' }}>
            <ReleaseMeetingIcon/>
          </span>
      )
        title = operationDescription.get('title')
        break
      case NEWS_TYPE.FILE:
        fileURL = (operationDescription.get('url').get && operationDescription.get('url').get(0)) || operationDescription.get('url')
        valueComponent = (
          <span className={styles.cardRight} onClick={() => oss.downloadFile(fileURL, this.props.affair)}>
            <SprigDownIcon/>
          </span>
        )
        iconComponent = (
          <span className={styles.iconWrapper}>
            {getFileIcon(fileURL)}
          </span>
        )
        title = fileURL.split('/').pop()
        break
      case NEWS_TYPE.SUB_ANNOUNCEMENT:
        subAnnouncementType = TEMPLATE_ATTRS[operationDescription.get('subType') || 0]
        valueComponent = (
          <span className={styles.cardRight}>
            <span className={styles.smallAvatar}><img src={operationDescription.get('respAvatar')}/></span>
          </span>
        )
        iconComponent = (
          <span className={styles.announcementType} style={{ borderColor: subAnnouncementType.color, color: subAnnouncementType.color }}>
            {subAnnouncementType.text}
          </span>
        )
        title = operationDescription.get('announcementTitle')
        break
      default:
        valueComponent = null

    }

    return (
      <div className={styles.cardContainer}>
        {iconComponent}
        <span className={styles.title}>{title}</span>
        {valueComponent}
      </div>
    )
  }

  render() {
    const { news } = this.props
    return (
      <div className={styles.newsContainer}>
        <div className={styles.avatar}>
          <img src={news.get('avatar')}/>
        </div>
        <div className={styles.right}>
          <div className={styles.news}>
            <a href="#">{news.get('roleName')}－{news.get('username')}</a>
            <span>{news.get('title')}</span>
            <span className={styles.time}>{this.formatNewsTime(news.get('modifyTime'))}</span>
          </div>
          {this.renderCard()}
        </div>
      </div>
    )
  }
}

NewsItem.PropTypes = {
  news: PropTypes.object.isRequired,
  affair: PropTypes.object.isRequired,
}

export default NewsItem
