import React from 'react'
import styles from './LoginRecord.scss'
import { IphoneIcon, ImacIcon } from 'svg'

const LoginRecord = React.createClass({

  render(){
    return (<div className={styles.loginRecordContainer}>
      <div className={styles.current}>
        <div className={styles.title}>
          当前设备:
        </div>
        <div className={styles.show}>
          <div className={styles.row}>
            <div className={styles.icon}>
              <IphoneIcon height="19"/>
            </div>
            <div className={styles.info}>
              <span className={styles.name}>iPhone</span>
              <span className={styles.time}>08-23 09:55 iphone6</span>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.icon}>
              <ImacIcon height="19"/>
            </div>
            <div className={styles.info}>
              <span className={styles.name}>iMac</span>
              <span className={styles.time}>08-23 13:55 iMac</span>
            </div>
            <div className={styles.remark}>
              本机
            </div>
          </div>
        </div>
      </div>
      <div className={styles.recently}>
        <div className={styles.title}>
          最近登录:
        </div>
        <div className={styles.show}>
          <div className={styles.row}>
            <IphoneIcon height="19"/>
            <span className={styles.name}>iPhone 6</span>
            <span className={styles.address}>江苏 南京</span>
            <span className={styles.time}>昨天 20:01</span>
          </div>
          <div className={styles.row}>
            <IphoneIcon height="19"/>
            <span className={styles.name}>iPhone 6</span>
            <span className={styles.address}>江苏 南京</span>
            <span className={styles.time}>2017-08-24 20:01</span>
          </div>
          <div className={styles.row}>
            <IphoneIcon height="19"/>
            <span className={styles.name}>iMAC OS X</span>
            <span className={styles.address}>江苏 南京</span>
            <span className={styles.time}>2017-08-23 14:01</span>
          </div>
        </div>
      </div>
    </div>)
    
  }
})

export default LoginRecord
