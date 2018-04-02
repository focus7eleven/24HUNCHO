import * as React from 'react' // eslint-disable-line
import Notification from 'rc-notification'
import assign from 'object-assign'
import 'antd/lib/notification/style/index.css'
import WindowNotification from './WindowNotification'
let defaultTop = 24
let notificationInstance
let defaultDuration = 45

const Icon = (props) => {
  const { type, className = '' } = props
  return <i {...props} className={`${className} anticon anticon-${type}`.trim()} />
}

//check if browser notification is available
function getNotificationInstance() {
  if (notificationInstance) {
    return notificationInstance
  }

  if ('Notification' in window) {
    notificationInstance = WindowNotification.newInstance(notificationInstance)
  }

  if (!notificationInstance || !WindowNotification.isPermissible()){
    notificationInstance = Notification.newInstance({
      prefixCls: 'ant-notification',
      style: {
        top: defaultTop,
        right: 0,
      },
    })
  }
  return notificationInstance
}

function notice(args) {
  const prefixCls = args.prefixCls || 'ant-notification-notice'

  let duration
  if (args.duration === undefined) {
    duration = defaultDuration
  } else {
    duration = args.duration
  }

  let iconType = ''
  switch (args.type) {
    case 'success':
      iconType = 'check-circle-o'
      break
    case 'info':
      iconType = 'info-circle-o'
      break
    case 'error':
      iconType = 'cross-circle-o'
      break
    case 'warning':
      iconType = 'exclamation-circle-o'
      break
    default:
      iconType = 'info-circle'
  }

  let iconNode
  if (args.icon) {
    iconNode = (
      <span className={`${prefixCls}-icon`}>
        {args.icon}
      </span>
        )
  } else if (args.type) {
    iconNode = <Icon className={`${prefixCls}-icon ${prefixCls}-icon-${args.type}`} type={iconType} />
  }

  getNotificationInstance().notice({
    content: (
      <div className={`${prefixCls}-content ${iconNode ? `${prefixCls}-with-icon` : ''}`} onClick={args.onClick} style={{ cursor: 'pointer' }}>
        {iconNode}
        <div className={`${prefixCls}-message`}>{args.message}</div>
        <div className={`${prefixCls}-description`}>{args.description}</div>
        {args.btn ? <span className={`${prefixCls}-btn`}>{args.btn}</span> : null}
      </div>
        ),
    duration,
    closable: true,
    onClose: args.onClose,
    key: args.key,
    style: {},
  })
}

const api = {
  open(args) {
    if (WindowNotification.isPermissible()) {
      WindowNotification.notice(args)
    } else {
      notice(args)
    }
  },
  close(key) {
    if (notificationInstance) {
      notificationInstance.removeNotice(key)
    }
  },
  config(options) {
    if ('top' in options) {
      defaultTop = options.top
    }
    if ('duration' in options) {
      defaultDuration = options.duration
    }
  },
  destroy() {
    if (notificationInstance) {
      notificationInstance.destroy()
      notificationInstance = null
    }
  },
};

['success', 'info', 'warning', 'error'].forEach((type) => {
  api[type] = (args) => api.open(assign({}, args, { type }))
})

api.warn = api.warning

export default api
