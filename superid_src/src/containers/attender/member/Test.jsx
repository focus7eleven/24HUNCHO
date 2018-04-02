import React from 'react'
import { MaleIcon } from 'svg'
import styles from './Test.scss'
import { Modal } from 'antd'
const Test = React.createClass({
  render(){
    return (<Modal visible>
      <div className={styles.container}>
        <span>test</span>
        <MaleIcon fill="black" height="12" />
      </div>
    </Modal>)
  }
})

export default Test