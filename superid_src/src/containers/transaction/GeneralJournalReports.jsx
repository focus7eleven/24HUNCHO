import React from 'react'
import { DatePicker, Select } from 'antd'
import styles from './GeneralJournalReports.scss'
import GeneralJournalEntryFlowTable from './GeneralJournalEntryFlowTable'
import YearPicker from './YearPicker'
import QuarterPicker from './QuarterPicker'
import config from '../../config'
import moment from 'moment'
import currencyFormatter from '../../utils/currencyWrap'
import echarts from '../../utils/echarts.js'
const Option = Select.Option
const MonthPicker = DatePicker.MonthPicker

const tooltipRightArrow =
`
    padding:10px 20px 10px 20px;
    height: 62px;
    background-color: #ffffff;
    box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.15);
    z-index: 10;
`
const tooltipLeftArrow =
tooltipRightArrow +
`
    padding:10px 20px 10px 20px;
    height: 62px;
    background-color: #ffffff;
    box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.15);
    z-index: 11;
`

const createXAxisCategories = (type, year, month, quarter) => {
  let xAxisCategory = []
  let startMonth = null
  let monthDay = null
  switch (type) {
    case OPTION_TYPE.YEAR:
      for (let i = 1;i <= 12;i++){
        xAxisCategory.push(i)
      }
      break
    case OPTION_TYPE.QUARTER:
      startMonth = quarter * 3 - 2
      for (let i = startMonth;i < startMonth + 3;i++){
        xAxisCategory.push(`${i}月`)
      }
      xAxisCategory.push('')
      break
    case OPTION_TYPE.MONTH:
      monthDay = moment([year, month]).daysInMonth()
      for (let i = 1;i <= monthDay;i++){
        xAxisCategory.push(i)
      }
      break
    default:
      break
  }
  return xAxisCategory
}
const createFormatter = (currency, type, year, month, color) => {
  let formatter = function (params){
    const key = params.name
    const value = currencyFormatter.format(params.data.value, { code: currency })
    const tooltipFirstLine =
      `
          width: 67px;
          height: 18px;
          font-family: .PingFangSC;
          font-size: 14px;
          font-weight: 500;
      `
    const tooltipSecondLine =
      `
          width: 81px;
          height: 15px;
          font-family: .PingFangSC;
          font-size: 12px;
          color: #666666;
      `
    let res = `<span style="${tooltipFirstLine} color:${color};">${value}</span>`
      + '</br>'
    switch (type) {
      case OPTION_TYPE.MONTH:
        res += `<span style="${tooltipSecondLine}">${year}年${month + 1}月${key}日流水</span>`
        break
      case OPTION_TYPE.YEAR:
        res += `<span style="${tooltipSecondLine}">${year}年${key}月流水</span>`
        break
      default:
        res += `<span style="${tooltipSecondLine}">${year}年${key}流水</span>`
    }
    return res
  }
  return formatter
}
const createOption = (currency, type, data, year, month, quarter, color) => {
  let xAxisCategory = createXAxisCategories(type, year, month, quarter)
  let formatter = createFormatter(currency, type, year, month, color)
  let dataMin = 0
  let dataMax = 0
  let interval = 0
  let min = 0
  let max = 0
  data.forEach((value) => {
    dataMax = Math.max(value * 1, dataMax * 1)
    dataMin = Math.min(value * 1, dataMin * 1)
  })
  /*
  * 四种数据情况，是否平行x轴与是否最小值为0
  * 如果平行x轴，值不为0，居中（这里采用距离底部3/7，顶部4/7）
  * 如果平行x轴，值为0，放在底部
  * 如果不平行于x轴，最小值不为0，放在1/7到6/7的位置
  * 如果不平行于x轴，最小值为0，放在0/7到6/7的位置
  */
  if (dataMin != dataMax && dataMin != 0){
    interval = ((dataMax - dataMin) / 5).toFixed() * 1
    min = dataMin - interval
    max = dataMax + interval
  } else if (dataMin != dataMax && dataMin == 0){
    interval = ((dataMax - dataMin) / 6).toFixed() * 1
    min = dataMin
    max = dataMax + interval
  } else if (dataMin == dataMax && dataMin != 0){
    interval = (dataMin / 10).toFixed() * 1
    min = dataMin - interval * 3
    max = dataMax + interval * 4
  } else if (dataMin == dataMax && dataMin == 0){
    interval = 1000
    min = dataMin
    max = interval * 7
  }
  //console.log(dataMin,dataMax,interval,min,max);
  let maxLength = 0
  switch (type) {
    case OPTION_TYPE.YEAR:
      maxLength = 12
      break
    case OPTION_TYPE.QUARTER:
      maxLength = 3
      break
    default:
      maxLength = 31
  }
  let formatData = data.map((obj, index) => ({
    value: obj,
    // symbol:'emptyCircle',
    // symbolSize: 10,
    // itemStyle:{
    //
    // },
    tooltip: {
      position: (index < maxLength * 0.75) ? 'right' : 'left',
      extraCssText: (index < maxLength * 0.75) ? `${tooltipRightArrow}` : `${tooltipLeftArrow}`,
    }
  }))
  let option = {
    tooltip: {
          // trigger: 'item',
          // triggerOn:'mousemove|click',
      backgroundColor: '#fff',
      textStyle: {
        color: '#000',
      },
      formatter: formatter,
      alwaysShowContent: true,
          //extraCssText: `${tooltipLeftArrow}`,
    },
    grid: {
      x: '20',
      y: '10',
      x2: '20',
      y2: '20',
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisCategory,
      axisLabel: {
        textStyle: {
          color: '#ccc',
        }
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      boundaryGap: [0, '100%'],
      scale: false,
      splitNumber: 7,
      interval: interval,
      min: min,
      max: max,
      axisLabel: {
        show: false,
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['#fafafa', '#fff'],
        },
      },
    },
    series: [
      {
        name: '数据',
        type: 'line',
        smooth: false,
        symbol: 'emptyCircle',
        showAllSymbol: true,
        hoverAnimation: false,
        sampling: 'none',
        silent: false,
        lineStyle: {
          normal: {
            width: 1,
          },
        },
        itemStyle: {
          normal: {
            color: '#ca90e7'
          },
          emphasis: {
            color: '#ca90e7',
            borderColor: '#ca90e7',
            borderWidth: 4,
          }
        },
        data: formatData,
      }]
  }
  return option
}
{/* option in echarts is to define chart content, including styles and datas */}
const OPTION_TYPE = {
  YEAR: 0,
  QUARTER: 1,
  MONTH: 2,
}
const CHOOSE_TAB = {
  RECEIVE: 1,
  SEND: 2,
}
const TABLE_COLOR = {
  RECEIVE: '#00ac00',
  SEND: '#f55b6c',
}
const CURRENCY = {
  CNY: 'CNY',
  USD: 'USD',
  JPY: 'JPY',
  EUR: 'EUR',
}
const GeneralJournalReports = React.createClass({
  getInitialState() {
    const current = moment()
    const year = current.year()
    const month = current.month()
    const quarter = current.quarter()
    const day = current.date()
    return {
      beginTime: '',
      endTime: '',
      chooseTab: CHOOSE_TAB.SEND,   //选择发送或者接收的tab
      currency: CURRENCY.CNY,        //当前币种
      chart: null,
      option: {
        type: OPTION_TYPE.MONTH,
        year: year,
        month: month,
        quarter: quarter,
        day: day,
      },
      selectIndex: null,
      chartData: [],
      title: `${year}年${month + 1}月${day}日`,
    }
  },
  componentDidMount(){
    const chart = echarts.init(this.refs.lineChart)
    chart.on('click', (params) => {
      //const isOnLeft = params.event.offsetX<(chart.getWidth()/2);
      // let option = {
      //   tooltip:{
      //     alwaysShowContent:true,
      //     // position:isOnLeft?'right':'left',
      //     // extraCssText:isOnLeft?`${tooltipRightArrow}`:`${tooltipLeftArrow}`,
      //   },
      // };
      // chart.setOption(option);
      //记录需要持续高亮&tooltip的组件以及其状态
      const selectIndex = params.dataIndex
      // chart.focusData = {
      //   seriesIndex:params.seriesIndex,
      //   dataIndex:params.dataIndex,
      //   //option:option,
      // };
      chart.dispatchAction({
        type: 'downplay',
        seriesIndex: 0,
      })
      chart.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: selectIndex,
      })
      this.setState({ selectIndex: selectIndex }, () => {this.updateTable()})
    })
    chart.on('mouseover', (params) => {
      //const isOnLeft = params.event.offsetX<(chart.getWidth()/2);
      // let option = {
      //   tooltip:{
      //     position:isOnLeft?'right':'left',
      //     extraCssText:isOnLeft?`${tooltipRightArrow}`:`${tooltipLeftArrow}`,
      //   },
      // };
      // const shouldChartUpdate = chart.getOption().tooltip.position != option.tooltip.position;
      // if(shouldChartUpdate){
      //   chart.setOption(option);
      // }
      //高亮&tooltip鼠标移入的组件
      chart.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex: params.dataIndex,
      })
      chart.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: params.dataIndex,
      })
    })
    chart.on('mouseout', () => {
      //取消高亮本组件
      chart.dispatchAction({
        type: 'downplay',
        seriesIndex: 0,
        //dataIndex:params.dataIndex,
      })
      //高亮&tooltip之前的焦点元素(要么是最后一个元素，要么是用鼠标点过的最后一个元素)
      //const datas = chart.focusData;
      const selectIndex = this.state.selectIndex
      if (selectIndex != null){
        //chart.setOption(datas.option);
        chart.dispatchAction({
          type: 'showTip',
          seriesIndex: 0,
          dataIndex: selectIndex,
        })
        // chart.dispatchAction({
        //   type:'downplay',
        //   seriesIndex:datas.seriesIndex,
        // });
        chart.dispatchAction({
          type: 'highlight',
          seriesIndex: 0,
          dataIndex: selectIndex,
        })
      }
    })
    this.setState({ chart: chart })
    this.updateAll()
  },
  componentDidUpdate(){
    this.updateChart()
  },
  //获取折线图数据需要传入需要几个月的数据，如果是一个月，则返回按天计算的数据
  parseMonths(type, year, month, quarter){
    let months = []
    let startMonth = null
    switch (type) {
      case OPTION_TYPE.YEAR:
        for (let i = 1;i <= 12;i++){
          months.push(i)
        }
        break
      case OPTION_TYPE.QUARTER:
        startMonth = quarter * 3 - 2
        for (let i = startMonth;i < startMonth + 3;i++){
          months.push(i)
        }
        break
      case OPTION_TYPE.MONTH:
        months.push(month + 1)
        break
      default:
        break
    }
    return months
  },
  fetchFlowReport(){
    const affair = this.props.affair
    const send = this.state.chooseTab == CHOOSE_TAB.SEND
    const { type, year, month, quarter } = this.state.option

    fetch(config.api.order.flow_report(affair.get('allianceId')), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        month: this.parseMonths(type, year, month, quarter),
        year: year,
        send: send,
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        let data = json.data
        data.forEach((obj) => {
          if (obj.sum == null){
            obj.sum = {}
          }
        })
        // this.state.chart.clear();
        // this.state.chart.focusData = null;
        this.setState({ chartData: data, chartDataUpdate: true, })
      }
    })
  },
  /* this func should be called immediately after (re-)render virtual DOM */
  updateChart(){
    const { currency, chart, chartData, chartDataUpdate } = this.state
    if (!chartDataUpdate){
      return
    }
    this.setState({ chartDataUpdate: false })
    const { type, year, month, quarter } = this.state.option
    // 计算应该显示几个数据
    let dataLimitNum = 0
    let current = moment()
    let that
    switch (type) {
      case OPTION_TYPE.YEAR:
        if (current.year() == year){
          dataLimitNum = current.month() + 1
        } else {
          dataLimitNum = 12
        }
        break
      case OPTION_TYPE.QUARTER:
        that = moment([year, quarter * 3 - 3])
        if (current.isBefore(that)){
          dataLimitNum = 0
        } else {
          let diffMonth = current.month() - that.month()
          dataLimitNum = Math.min(diffMonth + 1, 3)
        }
        break
      default:
        that = moment([year, month])
        if (current.isBefore(that)){
          dataLimitNum = 0
        } else {
          let diffMonth = current.month() - that.month()
          if (diffMonth == 0){
            dataLimitNum = current.date()
          } else {
            dataLimitNum = chartData.length
          }
        }
    }
    let data = []
    for (let i = 0;i < dataLimitNum;i++){
      let value = chartData[i].sum[currency]
      if (value == null){
        value = 0
      }
      data.push(value)
    }
    // let data = chartData.map((obj)=>{
    //   let value = obj.sum[currency];
    //   if(value == null){
    //     value = 0;
    //   }
    //   return (value*1);
    // });
    let option = createOption(currency, type, data, year, month, quarter, this.renderFontColor())
    chart.setOption(option)
    const selectIndex = this.state.selectIndex || (data.length - 1)
    if (!this.state.selectIndex){
      this.setState({ selectIndex: data.length - 1 })
    }
    // else{
    //   chart.keepFocus = false;
    // }
    //const {seriesIndex,dataIndex} = chart.focusData;
    //高亮&tooltip鼠标移入的组件
    chart.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex: selectIndex,
    })
    chart.dispatchAction({
      type: 'downplay',
      seriesIndex: 0,
    })
    chart.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: selectIndex,
    })
  },
  // 根据select和时间选择器选择的时间来决定开始时间和结束时间，更新表格
  updateTable(){
    let beginTime, endTime = ''
    let nextTitle = ''
    const { chooseTab, selectIndex } = this.state
    let index = -1
    let monthDay, nextMonth, nextYear = null
    const { type, year, quarter, month, day } = this.state.option
    switch (type) {
      case OPTION_TYPE.YEAR:
        index = selectIndex == null ? month : selectIndex
        beginTime = moment([year, index]).toDate()
        endTime = index + 1 > 11 ? moment([year + 1, 0]).toDate() : moment([year, index + 1]).toDate()
        nextTitle = `${year}年${index + 1}月`
        break
      case OPTION_TYPE.QUARTER:
        index = selectIndex == null ? month - quarter * 3 + 3 : selectIndex
        beginTime = moment([year, quarter * 3 - 3 + index]).toDate()
        endTime = quarter * 3 - 3 + index + 1 > 11 ? moment([year + 1, 0]).toDate() : moment([year, quarter * 3 - 3 + index + 1]).toDate()
        nextTitle = `${year}年${quarter * 3 - 3 + index + 1}月`
        break
      default:
        index = selectIndex == null ? day * 1 - 1 : selectIndex
        monthDay = moment([year, month]).daysInMonth()
        beginTime = moment([year, month, 1 + index]).toDate()
        nextMonth = 2 + index > monthDay
        nextYear = month == 11 && nextMonth
        endTime = moment([year, month, 2 + index]).toDate()
        if (nextMonth){
          endTime = moment([year, month + 1, 1]).toDate()
        }
        if (nextYear){
          endTime = moment([year + 1, 0, 1]).toDate()
        }
        nextTitle = `${year}年${month + 1}月${index + 1}日`
    }
    //更新表格
    this.setState({ title: nextTitle })
    this.props.onReportsChange(beginTime, endTime, chooseTab == CHOOSE_TAB.SEND)
  },
  updateAll(){
    this.updateTable()
    this.fetchFlowReport()
  },
  // 选择月份、季度、年度时的回调
  handleChooseOption(type){
    let option = this.state.option
    const current = moment()
    option.type = type
    option.year = current.year()
    option.month = current.month()
    option.quarter = current.quarter()
    option.day = current.date()
    this.setState({ option: option, selectIndex: null }, () => {this.updateAll()})
  },
  // monthPicker回调
  handleMonthPickerChange(date){
    const year = date.getFullYear()
    const month = date.getMonth()
    let option = this.state.option
    option.year = year
    option.month = month
    const current = moment()
    let index = 0
    if (year == current.year() && month == current.month()){
      index = current.date() - 1
    } else {
      index = moment([year, month]).daysInMonth() - 1
    }
    this.setState({ option: option, selectIndex: index }, () => {this.updateAll()})
  },
  handleYearPickerChange(year){
    let option = this.state.option
    option.year = year
    const current = moment()
    let index = 0
    if (year == current.year()){
      index = current.month()
    } else {
      index = 11
    }
    this.setState({ option: option, selectIndex: index }, () => {this.updateAll()})
  },
  handleQuarterPickerChange(year, quarter){
    let option = this.state.option
    option.year = year
    option.quarter = quarter
    const current = moment()
    let index = 0
    if (year == current.year() && quarter == current.quarter()){
      index = (current.month()) % 3
    } else {
      index = 2
    }
    this.setState({ option: option, selectIndex: index }, () => {this.updateAll()})
  },
  // 图上的点被点击的事件
  handleChartClick(){
    this.updateTable()
  },
  renderFontColor(){
    if (this.state.chooseTab == CHOOSE_TAB.SEND){
      return TABLE_COLOR.SEND
    }
    return TABLE_COLOR.RECEIVE
  },
  renderHeader() {
    return (
      <div className={styles.header}>
        <span style={{ color: '#4990e2', cursor: 'pointer' }} onClick={() => {this.props.onDetailDisabled()}}>{this.props.affair.get('name')}交易流水表</span>
        <span className={styles.tag} style={{ color: '#9b9b9b' }}>></span>
          流水统计报表
      </div>
    )
  },
  renderChart() {
    return (
      <div id="lineChart" className={styles.chart} ref="lineChart" />
    )
  },
  renderTable() {
    return (
      <GeneralJournalEntryFlowTable onClickRow={this.props.onClickTableRow} tableData={this.props.tableData} color={this.renderFontColor()} currency={this.state.currency}/>
    )
  },
  render() {
    const { chooseTab, currency } = this.state
    const sendButtonStyle = chooseTab == CHOOSE_TAB.SEND ? styles.buttonActive : styles.button
    const receiveButtonStyle = chooseTab == CHOOSE_TAB.RECEIVE ? styles.buttonActive : styles.button
    const { type } = this.state.option
    const value = this.props.sum[currency]
    const total = currencyFormatter.format(value, { code: currency })
    return (
      <div className={styles.container}>
        {this.renderHeader()}
        <div className={styles.content}>
          {/* first row for selections */}
          <div className={styles.selectWrapper}>
            <div className={styles.left}>
              <Select style={{ width: '80px' }} defaultValue={CURRENCY.CNY}
                onChange={(value) => {
                  this.state.chart.keepFocus = true
                  this.setState({ currency: value, chartDataUpdate: true })
                }}
              >
                <Option value={CURRENCY.CNY}>人民币</Option>
                <Option value={CURRENCY.USD}>美元</Option>
                <Option value={CURRENCY.JPY}>日元</Option>
                <Option value={CURRENCY.EUR}>欧元</Option>
              </Select>
              <Select defaultValue={OPTION_TYPE.MONTH} onChange={(value) => {this.handleChooseOption(value)}}>
                <Option value={OPTION_TYPE.MONTH}>月份</Option>
                <Option value={OPTION_TYPE.QUARTER}>季度</Option>
                <Option value={OPTION_TYPE.YEAR}>年度</Option>
              </Select>
              <div className={styles.sign}>-</div>
              {
                type == OPTION_TYPE.MONTH ?
                  <MonthPicker format="YYYY年MM月" onChange={(date) => {this.handleMonthPickerChange(date)}}/>
                :
                type == OPTION_TYPE.YEAR ?
                  <YearPicker onChange={(year) => {this.handleYearPickerChange(year)}}/>
                :
                type == OPTION_TYPE.QUARTER ?
                  <QuarterPicker onChange={(year, quarter) => {this.handleQuarterPickerChange(year, quarter)}}/>
                :
                null
              }
            </div>
            <div className={styles.right}>
              <div className={styles.buttonGroup}>
                <div className={sendButtonStyle} onClick={() => {this.state.chart.keepFocus = true;this.setState({ chooseTab: CHOOSE_TAB.SEND }, () => this.updateAll())}}>
                  发出
                </div>
                <div className={receiveButtonStyle} onClick={() => {this.state.chart.keepFocus = true;this.setState({ chooseTab: CHOOSE_TAB.RECEIVE }, () => this.updateAll())}}>
                  收到
                </div>
              </div>
            </div>
          </div>
          {/* second row for chart */}
          <div className={styles.chartWrapper} style={{ padding: 0 }}>
            {this.renderChart()}
          </div>
          <div className={styles.totalWrapper}>
            {this.state.title}流水汇总 （等值金额：<div style={{ color: this.renderFontColor() }} className={styles.totalValue}>{total}</div>）
          </div>
          {/* third row for table */}
          <div className={styles.tableWrapper}>
            {this.renderTable()}
          </div>
        </div>
      </div>
    )
  }
})
export default GeneralJournalReports
