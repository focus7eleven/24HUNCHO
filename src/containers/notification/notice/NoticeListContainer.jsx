import React from 'react'
import styles from './NoticeListContainer.scss'
import { fromJS } from 'immutable'
import NoticeItem from './NoticeItem'
import { LoadingIcon } from 'svg'
import imageNoTask from 'images/img_no_message.png'

class NoticeListContainer extends React.Component{

  // 向下传播到NoticeItem，有的NoticeItem需要关闭整个Container
  handleContainerClose(){
    this.props.handleContainerClose()
  }
  handleLoad(){
    this.props.handleLoad()
  }
  render(){
    const { notificationList, hasMore, isLoading, role } = this.props
    const filteredNotifications =
      notificationList
      .map((obj) => {
        if (obj.urls && typeof obj.urls[0] == 'string') {
          obj.urls = JSON.parse(obj.urls)
        }
        return fromJS(obj)
      })
      .sort((a, b) => b.get('createTime') - a.get('createTime'))
    return (
      <div className={styles.container}>
        <div style={{ flex: '1 0 auto' }}>
          <div className={styles.messageList}>
            {(filteredNotifications == null || filteredNotifications.isEmpty()) &&
            <div className={styles.noMore}>
              <img src={imageNoTask} />
              <div className={styles.note}>暂无消息...</div>
            </div>
            }
            {
              filteredNotifications.map((item) => {
                return (
                  <NoticeItem
                    key={item.get('noticeId')}
                    item={item}
                    role={role}
                    hasIcon
                    handleContainerClose={() => {this.handleContainerClose()}}
                    updateNotificationList={(roleId, data) => {this.props.updateNotificationList(roleId, data)}}
                    handleReload={() => this.handleLoad()}
                  />
                )
              })
            }
            {hasMore &&
            <div className={styles.loadMore} onClick={() => {this.handleLoad()}}>
              {isLoading && <LoadingIcon />}
                加载更多
            </div>
            }
          </div>
        </div>
      </div>
    )
  }
}

export default NoticeListContainer
