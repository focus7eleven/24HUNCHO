import React from 'react'
import notification from '../../components/notification/Notification'
import { Button } from 'antd'

let NotificationTest = React.createClass({
  render(){
    return <Button onClick={this.notificationTest}>通知测试</Button>
  },
    
  notificationTest() {
    notification.open({
      message: '通知测试',
      description: 'This is the content of the notification.',
      duration: 4.5,
      onClose: () => {
                // alert('close');
      },
      onClick: () => {
                // alert('click');
      }
    })
  }
})

export default NotificationTest