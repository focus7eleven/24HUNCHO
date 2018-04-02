import moment from 'moment'
import React from 'react'
import { Switch, DatePicker } from 'antd'
import styles from './GeneralJournalSummaryEntries.scss'
import GeneralJournalEntrySummaryTable from './GeneralJournalEntrySummaryTable'
import GeneralJournalEntryDetailTable from './GeneralJournalEntryDetailTable'

const RangePicker = DatePicker.RangePicker

const GeneralJournalSummaryEntries = React.createClass({

  getInitialState(){
    return ({
      detail: false,
      toAllianceId: '',
      toAllianceName: '',

      detailStartTime: null,
      detailEndTime: null,
      summaryEndTime: this.getDefaultTime(),

      containChildren: false,
    })
  },
  getDefaultTime() {
    return new Date(Date.now())
  },
  handleOnDetail(toAllianceId, toAllianceName){
    this.setState({
      detail: true,
      toAllianceId: toAllianceId,
      toAllianceName: toAllianceName,
    })
  },
  handleOnSummary(){
    this.setState({
      detail: false,
      toAllianceId: '',
    })
  },
  renderSummaryHeader(){
    return (
      <div className={styles.header}>
        <div>{this.props.affair.get('name')}交易汇总表</div>
        <div className={styles.rightGroup}>
          <div className={styles.endTime}>截止时间:</div>
          {/* 汇总表时间筛选 */}
          <div className={styles.datePicker}>
            <DatePicker style={{ width: 265, marginRight: 10 }} showTime format="YYYY-MM-DD HH:mm" value={moment(this.state.summaryEndTime, 'YYYY-MM-DD HH:mm')}
              onChange={(date) => {this.setState({ summaryEndTime: date })}}
            />
          </div>
          {/* 是否包含子事务 */}
          <div style={{ marginRight: 2 }}>包含子事务</div>
          <Switch size="large" checkedChildren="开" unCheckedChildren="关" checked={this.state.containChildren}
            onChange={(checked) => {this.setState({ containChildren: checked })}}
          />
        </div>
      </div>
    )
  },
  renderDetailHeader(){
    return (
      <div className={styles.header}>
        <div>
          <span style={{ color: '#4990e2', cursor: 'pointer' }} onClick={() => {this.handleOnSummary()}}>{this.props.affair.get('name')}交易汇总表</span>
          <span className={styles.tag} style={{ color: '#9b9b9b' }}>></span>
          {this.state.toAllianceName}往来明细表
        </div>
        <div className={styles.rightGroup}>
          {/* 明细表时间筛选 */}
          <RangePicker style={{ width: 265, marginRight: 10 }} showTime format="YYYY/MM/DD" value={[this.state.detailStartTime, this.state.detailEndTime]}
            onChange={(dates) => {this.setState({ detailStartTime: dates[0], detailEndTime: dates[1] })}}
          />
          {/* 是否包含子事务 */}
          <div style={{ marginRight: 2 }}>包含子事务</div>
          <Switch size="large" checkedChildren="开" unCheckedChildren="关" checked={this.state.containChildren}
            onChange={(checked) => {this.setState({ containChildren: checked })}}
          />
        </div>
      </div>
    )
  },
  renderHeader() {
    const header = this.state.detail === false ? this.renderSummaryHeader() : this.renderDetailHeader()
    return (
      header
    )
  },
  renderContent(){
    return (
      <div className={styles.content}>
        {this.state.detail === false ?
          <GeneralJournalEntrySummaryTable {...this.props} containChildren={this.state.containChildren} endTime={this.state.summaryEndTime}
            onDetail={this.handleOnDetail} onTableUpdated={this.handleOnTableUpdated}
          />
        : (
          <GeneralJournalEntryDetailTable {...this.props} toAllianceId={this.state.toAllianceId} containChildren={this.state.containChildren}
            startTime={this.state.detailStartTime} endTime={this.state.detailEndTime} onTableUpdated={this.handleOnTableUpdated}
          />
        )}
      </div>
    )
  },
  render(){
    return (
      <div className={styles.container}>
        {this.renderHeader()}
        {this.renderContent()}
      </div>
    )
  }
})

export default GeneralJournalSummaryEntries
