import React from 'react'
import { Button } from 'antd'
import styles from './NetworkError.scss'
import imageNoNetwork from 'images/img_no_network.png'

class NetworkError extends React.Component {
  render() {
    return (
      <div className={styles.container}>
        <img src={imageNoNetwork} />
        <div style={{ marginBottom: 30 }}>网络连接失败，请检查网络设置后重试</div>
        <Button onClick={() => location.reload()}>刷新</Button>
      </div>
    )
  }
}

export default NetworkError
