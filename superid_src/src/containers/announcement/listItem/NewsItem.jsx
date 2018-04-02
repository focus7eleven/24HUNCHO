import React from 'react'
import { SprigDownIcon, ReleaseWorkIcon, ReleaseMeetingIcon, PDFIcon, PPTIcon, EXCELIcon, TEXTIcon, VIDEOIcon, UNKNOWNIcon, WORDIcon } from '../../../public/svg'
import { fromJS } from 'immutable'
import oss from 'oss'
import moment from 'moment'
import styles from './NewsItem.scss'

import { TEMPLATE, TEMPLATE_ATTRS } from '../inner/InnerAnnouncement'

const NEWS_TYPE = {
  SUB_ANNOUNCEMENT: 0,
  WORK: 1,
  MEETING: 2,
  FILE: 3,
}

const NewsItem = React.createClass({
  getDefaultProps(){
    return {
      avatar: '#',
      roleTitle: '前端开发',
      username: '张文玘',
      log: '不知道干了什么',
      type: NEWS_TYPE.WORK,
      time: '2017年5月20日 13:00',
      title: '不知道是什么的名称',

      //以下为工作项所需props
      respAvatar: '#', //负责人头像 (工作/子发布）
      endTime: '17/7/20 9:00',

      //以下为会议项所需props
      startTime: '17/9/30 9:00',
      lastTime: null,
      place: '项目会议室',

      //以下为子发布所需props
      subType: TEMPLATE.DEFAULT, //子发布类型，应为枚举，待拿到list各项类别之后再修改

    }
  },

  getFileIcon(filename){
    const fileType = filename.split('.')[1]
    switch (fileType){
      case 'pdf':
        return <PDFIcon className={styles.icon}/>
      case 'ppt':
        return <PPTIcon className={styles.icon}/>
      case 'xls':
      case 'xlsx':
        return <EXCELIcon className={styles.icon}/>
      case 'txt':
        return <TEXTIcon className={styles.icon}/>
      case 'word':
        return <WORDIcon className={styles.icon}/>
      case 'avi':
      case 'mp4':
      case 'wmv':
      case 'mkv':
      case 'mpg':
      case 'rmvb':
      case 'rm':
      case 'asf':
      case 'mpeg':
        return <VIDEOIcon className={styles.icon}/>
      default:
        return <UNKNOWNIcon className={styles.icon}/>

    }
  },

  formatNewsTime(time) {
    return moment(Number.parseInt(time)).format('YY/MM/DD HH:mm')
  },


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
              {this.formatNewsTime(operationDescription.get('offTime'))}
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
        title = operationDescription.get('name')
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
            {this.getFileIcon(fileURL)}
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
  },

  render(){
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
  },
})

export default NewsItem
