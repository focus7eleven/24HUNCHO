import React, { PropTypes } from 'react'
import { List } from 'immutable'
import { Icon } from 'antd'
import classNames from 'classnames'
import styles from './ConferenceNotificationList.scss'

export const REFUSE_APPLY_TYPE = 'REFUSE_APPLY_TYPE'
export const NO_MIC = 'NO_MIC'
export const GRANT_SCREEN = 'GRANT_SCREEN'
export const APPLY_SCREEN = 'APPLY_SCREEN'

const ConferenceNotificationList = React.createClass({
  propTypes: {
    size: PropTypes.number,
    notifications: PropTypes.object,
    handleCloseNofication: PropTypes.func,
    className: PropTypes.string,
  },

  getDefaultProps() {
    return {
      size: 3,
      notifications: List([]),
      // notifications: fromJS([{
      //   id: 1,
      //   type: REFUSE_APPLY_TYPE,
      // }, {
      //   id: 2,
      //   type: NO_MIC,
      // }, {
      //   id: 3,
      //   type: GRANT_SCREEN,
      // }, {
      //   id: 4,
      //   type: APPLY_SCREEN,
      //   proposer: '设计师陈深文'
      // }]),
      handleCloseNofication: () => {},
    }
  },

  render() {
    const {
      notifications,
      handleCloseNofication,
      className,
    } = this.props

    return (
      <div className={classNames(styles.container, className)}>
        {
          notifications.slice(-3).reverse().map((notification) => {
            switch (notification.get('type')) {
              // 申请屏幕被拒绝
              case REFUSE_APPLY_TYPE:
                return (
                  <div className={styles.notificationItem} key={notification.get('id')}>
                    <Icon type="exclamation-circle" />
                    <p style={{ marginRight: 80 }}>您使用屏幕的申请已被拒绝！</p>
                    <Icon type="cross" onClick={() => handleCloseNofication(notification)} />
                  </div>
                )
              case NO_MIC:
                return (
                  <div className={styles.notificationItem} key={notification.get('id')}>
                    <Icon type="exclamation-circle" />
                    <p style={{ marginRight: 130 }}>发言人对全员禁麦！</p>
                    <Icon type="cross" onClick={() => handleCloseNofication(notification)} />
                  </div>
                )
              case GRANT_SCREEN:
                return (
                  <div className={styles.notificationItem} key={notification.get('id')}>
                    <Icon type="check-circle" />
                    <p style={{ marginRight: 5 }}>您使用屏幕的申请已被同意，将在 10s 后切入主屏幕！</p>
                    <Icon type="cross" onClick={() => handleCloseNofication(notification)} />
                  </div>
                )
              case APPLY_SCREEN:
                return (
                  <div className={styles.notificationItem} key={notification.get('id')}>
                    <p style={{ marginRight: 5 }}>{`${notification.get('proposer')} 申请使用屏幕`}</p>

                    <div className={styles.buttonGroup}>
                      <div onClick={notification.get('refuseCb')}>拒绝</div>
                      <div className={styles.agreeButton} onClick={notification.get('agreeCb')}>同意</div>
                    </div>
                  </div>
                )
              default:
                return null
            }
          })
        }
      </div>
    )
  }
})

export default ConferenceNotificationList
