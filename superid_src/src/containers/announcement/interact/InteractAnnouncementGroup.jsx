import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { pushURL } from 'actions/route'
import { notificationTime } from 'time'
import styles from './InteractAnnouncementGroup.scss'

export const TEMPLATE = {
  DEFAULT: 0,
  REQUIREMENT: 1,
  BUG: 2,
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

const InteractAnnouncementGroup = React.createClass({
  renderIcon(announcement){
    const attrs = TEMPLATE_ATTRS[Number.parseInt(announcement.get('plateType'))]
    return (
      <div className={styles.icon} style={{ borderColor: attrs.color, color: attrs.color }}>
        {attrs.text}
      </div>
    )
  },
  onClick(announcement) {
    const { affair } = this.props
    this.props.pushURL(`/workspace/affair/${affair.get('id')}/announcement/interact/detail/${announcement.get('id')}`)
  },
  render(){
    const { announcementGroup } = this.props
    return (
      <div className={styles.container} data-type="default">
        <div className={styles.avatar}><img src={announcementGroup.getIn(['items', 0, 'avatar'])} /></div>
        <div className={styles.mainWrapper}>
          {announcementGroup.get('items').map((announcement) => {
            return (
              <div className={styles.announcement} key={announcement.get('announcementId')}>
                <div className={styles.headline} >
                  <div className={styles.highlight}>{announcement.get('roleName')}-{announcement.get('username')}</div>
                  <div>在</div>
                  <div className={styles.highlight}>{announcement.get('affairName')}</div>
                  <div>事务中发布了一条{TEMPLATE_ATTRS[announcement.get('plateType')].text == '发布' ? '普通' : TEMPLATE_ATTRS[announcement.get('plateType')].text }发布：</div>
                  <div className={styles.time}>{notificationTime(announcement.get('modifyTime'))}</div>
                </div>
                <div className={styles.header} onClick={() => this.onClick(announcement)}>
                  {this.renderIcon(announcement)}
                  <div className={styles.title}>{`${announcement.get('number')} - ${announcement.get('title')}`}</div>
                  <div className={styles.avatarWrapper} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
})

export default connect(null, (dispatch) => ({ pushURL: bindActionCreators(pushURL, dispatch) }))(InteractAnnouncementGroup)
