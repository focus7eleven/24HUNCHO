import React from 'react'
import { Tabs, Table } from 'antd'
import { DropUpIcon } from 'svg'
import DeadlineContainer from './DeadlineContainer'
import styles from './MyNoticeContainer.scss'

const TabPane = Tabs.TabPane
class MyNoticeContainer extends React.Component {
  render() {
    return (
      <div className={styles.container}>
        <Tabs defaultActiveKey="deadline" className={styles.tabContainer}>
          <TabPane tab="Deadline" key="deadline">
            <DeadlineContainer />
          </TabPane>
          <TabPane tab="工作" key="work"></TabPane>
          <TabPane tab="日程" key="routine"></TabPane>
        </Tabs>
        <div className={styles.workCounts}>1</div>
        <div className={styles.close}>
          <div onClick={this.props.onCancel}><DropUpIcon width="28" height="28"/></div>
        </div>
      </div>
    )
  }
}

export default MyNoticeContainer
