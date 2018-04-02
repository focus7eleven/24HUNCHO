import React from 'react'
import { Tabs } from 'antd'
import { fromJS } from 'immutable'
import config from '../../config'
import styles from './GeneralJournalEntryDetailTable.scss'
const TabPane = Tabs.TabPane
const GeneralJournalEntryDetailTable = React.createClass({
  getInitialState(){
    return {
      sign: '',
      list: [],
      CNY: fromJS([]),
      USD: fromJS([]),
      JPY: fromJS([]),
      EUR: fromJS([]),
    }
  },
  componentWillReceiveProps(nextProps){
    this.handleChange(nextProps)
  },
  componentDidMount(){
    this.handleChange(this.props)
  },
  handleChange(props){
    const { affair, containChildren, startTime, endTime, toAllianceId } = props
    const formatStartTime = !startTime ? new Date('1971-01-01 00:00:00') : startTime
    const formatEndTime = !endTime ? new Date() : endTime
    const startTimestamp = Date.parse(formatStartTime)
    const endTimestamp = Date.parse(formatEndTime)
    fetch(config.api.order.alliance_deals(toAllianceId, startTimestamp, endTimestamp, containChildren, affair.get('allianceId')), {
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      method: 'GET',
      credentials: 'include',
    }).then((res) => {return res.json()}).then((json) => {
      if (!json.data || json.data.length == 0){
        this.setState(this.getInitialState())
        return
      }
      {/* parseSign is to make CNY as ¥, USD as $ ,the function should refactor afterwards*/}
      let parseSign = (key) => {
        switch (key) {
          case 'CNY':
            return '¥'
          case 'USD':
            return '$'
          case 'JPY':
            return 'JP¥'
          case 'EUR':
            return '€'
          default:
            return '¥'
        }
      }
      {/*  */}
      const data = json.data.sort((obj1, obj2) => (obj1.time - obj2.time))
      let nextState = {}
      data.forEach((obj) => {
        const currency = obj.currency
        const receive = (currency in obj.receive) ? obj.receive[currency] : 0
        const send = (currency in obj.send) ? obj.send[currency] : 0
        const balance = send - receive
        const reception = obj.reception
        const remark = (obj.remark == null || obj.remark == undefined || obj.remark == '') ? '无交易表单信息' : obj.remark
        const timestamp = obj.time
        const total = obj.total
        const type = obj.type
        const date = new Date(timestamp)
        const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes()}`
        const formatType = type == 1 ? '资金' : type == 0 ? '物资' : '未知'
        let dataType, dataValue, dataInfo, dataType2, dataValue2, dataInfo2 = ''
        {/* that reception is true means receiving things */}
        if (reception == true){
          dataType = formatType
          dataValue = parseSign(currency) + total.toFixed(2)
          dataInfo = remark
        } else {
          dataType2 = formatType
          dataValue2 = parseSign(currency) + total.toFixed(2)
          dataInfo2 = remark
        }
        if (!nextState[currency]){
          nextState[currency] = []
        }
        nextState[currency].push({
          time: dateStr,
          type: dataType,
          value: dataValue,
          info: dataInfo,
          negative: balance < 0,
          remain: parseSign(currency) + Math.abs(balance).toFixed(2),
          type2: dataType2,
          value2: dataValue2,
          info2: dataInfo2,
          totalIn: parseSign(currency) + receive.toFixed(2),
          totalOut: parseSign(currency) + send.toFixed(2),
        })
      })
      for (let key in nextState){
        nextState[key] = fromJS(nextState[key])
      }
      this.setState(nextState)
    })
  },
  renderTable(list){
    return (
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <div className={styles.tableHeaderTime}>时间</div>
          <div className={styles.tableHeaderName}>{this.props.name}</div>
          <div className={styles.tableHeaderSummary}>往来汇总</div>
          <div className={styles.tableHeaderName}>我方</div>
        </div>
        <div className={styles.tableContent}>
          {/* second table header */}
          <div className={styles.tableRow}>
            <div className={styles.tableDataTime} />
            <div className={styles.tableDataType}>类型</div>
            <div className={styles.tableDataValue}>等值金额</div>
            <div className={styles.tableDataRemain}><span>往来余额</span></div>
            <div className={styles.tableDataType}>类型</div>
            <div className={styles.tableDataValue}>等值金额</div>
          </div>
          {/* table rows */}
          {
            list.map((data, index) => (
              <div className={styles.tableRow} key={index}>
                <div className={styles.tableDataTime}>{data.get('time')}</div>
                <div className={styles.tableDataType}>{data.get('type')}</div>
                <div className={styles.tableDataValue}>
                  <div className={styles.tableDataNumber}>{data.get('value') !== '' ? this.props.sign : null}{data.get('value')}</div>
                  <div className={styles.tableDataInfo}>{data.get('info')}</div>
                </div>
                <div className={styles.tableDataRemain}>
                  {data.get('negative') ?
                    <span style={{ color: '#f55b6c' }}>应付{data.get('remain')}</span>
                  :
                    <span style={{ color: '#00ac00' }}>应收{data.get('remain')}</span>
                  }
                  {/* card-info should occur when mouseover*/}
                  <div className={styles.card} style={{}}>
                    <div className={styles.cardContent}>
                      <div className={styles.cardColumn}>
                        <div className={styles.cardHeader}>收入总计</div>
                        <div className={styles.cardData}>{data.get('totalIn')}</div>
                      </div>
                      <div className={styles.cardColumn}>
                        <div className={styles.cardSign}>-</div>
                      </div>
                      <div className={styles.cardColumn}>
                        <div className={styles.cardHeader}>支出总计</div>
                        <div className={styles.cardData}>{data.get('totalOut')}</div>
                      </div>
                      <div className={styles.cardColumn}>
                        <div className={styles.cardSign}>=</div>
                      </div>
                      <div className={styles.cardColumn}>
                        <div className={styles.cardHeader}>往来余额</div>
                        <div className={styles.cardData}>
                          {data.get('negative') ?
                            <span style={{ color: '#f55b6c' }}>{data.get('remain')}</span>
                          :
                            <span style={{ color: '#00ac00' }}>{data.get('remain')}</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* card ends  */}
                </div>
                <div className={styles.tableDataType}>{data.get('type2')}</div>
                <div className={styles.tableDataValue}>
                  <div className={styles.tableDataNumber}>{data.get('value2') !== '' ? this.props.sign : null}{data.get('value2')}</div>
                  <div className={styles.tableDataInfo}>{data.get('info2')}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    )
  },
  render(){
    return (
      <div className={styles.wrapper}>
        <Tabs type="card">
          {this.state.CNY.size && <TabPane tab="人民币" key="1">{this.renderTable(this.state.CNY)}</TabPane>}
          {this.state.USD.size && <TabPane tab="美元" key="2">{this.renderTable(this.state.USD)}</TabPane>}
          {this.state.JPY.size && <TabPane tab="日元" key="3">{this.renderTable(this.state.JPY)}</TabPane>}
          {this.state.EUR.size && <TabPane tab="欧元" key="4">{this.renderTable(this.state.EUR)}</TabPane>}
        </Tabs>
      </div>
    )
  },
})
export default GeneralJournalEntryDetailTable
