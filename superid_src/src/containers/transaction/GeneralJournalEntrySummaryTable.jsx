import React from 'react'
import { fromJS } from 'immutable'
import config from '../../config'
import styles from './GeneralJournalEntrySummaryTable.scss'

const GeneralJournalEntrySummaryTable = React.createClass({
  getInitialState(){
    return {
      payable: fromJS([]),
      payableSum: fromJS([]),
      receivable: fromJS([]),
      receivableSum: fromJS([]),
      balance: fromJS([]),
    }
  },
  componentWillReceiveProps(nextProps){
    this.handleChange(nextProps)
  },
  componentDidMount(){
    this.handleChange(this.props)
  },
  handleChange(props){
    const { affair, containChildren, endTime } = props
    const formatEndTime = endTime === '' ? new Date() : endTime
    const timestamp = Date.parse(formatEndTime)
  // console.log("endTime:",formatEndTime);
  // console.log("url:",config.api.order.summary(timestamp,affair.get('id'),affair.get('roleId'),containChildren));
    fetch(config.api.order.summary(timestamp, containChildren), {
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((json) => {
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
      let formatSumAsArray = (sum) => {
        let values = []
        for (let key in sum){
          let fixedNum = parseSign(key) + (sum[key]).toFixed(2)
          values.push(fixedNum)
        }
        return values
      }
      let formatObject = (obj) => {
        let name = obj.name
        let allianceId = obj.id
        if (!obj.sum){
          obj.sum = { CNY: 0 }
        }
        let sum = obj.sum
        return {
          name: name,
          allianceId: allianceId,
          values: formatSumAsArray(sum),
        }
      }
      let data = json.data
      {/* ！！！be careful that the server named paylist as payable and receivelist as receivables */}
      this.setState({
        payable: fromJS(data.payable.map(formatObject)),
        payableSum: fromJS(formatSumAsArray(data.payableSum)),
        receivable: fromJS(data.receivables.map(formatObject)),
        receivableSum: fromJS(formatSumAsArray(data.receivableSum)),
        balance: fromJS(data.balance.map(formatObject)),
      })
  // console.log("state update:",this.state);
    })
  },
  /*
  params:
  list: data list, each item is a map containing keys : name and values
  title: the title of the list view
  totals: the total amount shown in tail
  color: '应收' is green, ‘应付’ is red
   */
  renderListView(list, title, totals, color){
    return (
      <div className={styles.listView}>
        <div className={styles.title}>
          {title}
        </div>
        <div className={styles.content}>
          {/* the first row is header row */}
          <div className={styles.headerRow}>
            <div className={styles.row} style={{ minHeight: '40px' }}>
              <div className={styles.nameData}>盟名称</div>
              <div className={styles.nameItem}>等值金额</div>
            </div>
          </div>
          <div className={styles.contentWrapper}>
            {/* data rows */}
            {
              list.map((data) => {
                var itemsHeight = 40 * data.get('values').size + 'px'
                return (
                  <div className={styles.row} style={{ lineHeight: itemsHeight, height: itemsHeight, minHeight: itemsHeight }} key={data.get('allianceId')}>
                    <div className={styles.nameData} style={{ lineHeight: itemsHeight, height: itemsHeight, minHeight: itemsHeight }}>
                      {data.get('name')}
                    </div>
                    <div className={styles.items} style={{ color: color, lineHeight: itemsHeight, height: itemsHeight, minHeight: itemsHeight }}
                      onClick={() => {this.props.onDetail(data.get('allianceId'), data.get('name'))}}
                    >
                      {
                        data.get('values').map((value, index) => (
                          <div className={styles.item} onClick={() => {this.props.onDetail()}} key={index}>
                            {value}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>
        <div className={styles.viewFooter}>
          <div className={styles.footerLeft}>合计：</div>
          <div className={styles.footerRight}>
            {
              totals.map((data, index) => (
                <div className={styles.total} style={{ color: color }} key={index}>{data}</div>
              ))
            }
          </div>
        </div>
      </div>
    )
  },
  render(){
    return (
      <div className={styles.wrapper}>
        {this.renderListView(this.state.receivable, '应收', this.state.receivableSum, '#00ac00')}
        {this.renderListView(this.state.payable, '应付', this.state.payableSum, '#f55b6c')}
        {this.renderListView(this.state.balance, '平账', ['¥0.00'], 'inherit')}
      </div>
    )
  },
})
export default GeneralJournalEntrySummaryTable
