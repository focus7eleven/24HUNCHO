import React from 'react'
import ReactDOM from 'react-dom'
import { Dropdown } from 'antd'
import moment from 'moment'

const CHINESE_DICT = ['一季度', '二季度', '三季度', '四季度']
const QuarterPicker = React.createClass({
  getInitialState() {
    let current = moment()
    let currentYear = current.year()
    let currentQuarter = current.quarter()
    return {
      year: currentYear,
      quarter: currentQuarter,
      popupVisible: false,
    }
  },
  handleSelectQuarter(nextYear, nextQuarter){
    this.setState({
      year: nextYear,
      quarter: nextQuarter,
      popupVisible: false,
    })
    if (this.props.onChange){
      this.props.onChange(nextYear, nextQuarter)
    }
  },
  render(){
    const { year, quarter, popupVisible } = this.state
    const selectPanel = (<SelectPanel parentNode={this} year={year} quarter={quarter} onClickOutside={() => {this.setState({ popupVisible: false })}} onChange={(nextYear, nextQuarter) => {this.handleSelectQuarter(nextYear, nextQuarter)}}/>)
    return (
      <Dropdown overlay={selectPanel} trigger={['click']} visible={popupVisible}>
        <div style={{ maxHeight: 0, position: 'relative', top: -4 }}>
          <span style={{ position: 'relative', top: 4 }} className="ant-calendar-picker">
            <span>
              <input readOnly="" value={year + '年 ' + CHINESE_DICT[quarter - 1]} placeholder="请选择日期" className="ant-calendar-range-picker ant-input" onClick={() => {this.setState({ popupVisible: true })}}/>
              <span className="ant-calendar-picker-icon" />
            </span>
          </span>
        </div>
      </Dropdown>
    )
  },
})

const SelectPanel = React.createClass({
  getInitialState(){
    return {
      yearPos: this.props.year,
      quarterPos: this.props.quarter,
      subSelectVisible: true,
      forceShow: false,
    }
  },
  handleClick(e){
    if (this.state.forceShow){
      this.setState({ forceShow: false })
      return
    }
    const { parentNode } = this.props
    if (!(ReactDOM.findDOMNode(this).contains(e.target)) && !(ReactDOM.findDOMNode(parentNode).contains(e.target))) {
      this.props.onClickOutside()
      setTimeout(() => {this.setState(this.getInitialState())}, 500)
    }
  },
  componentWillMount(){
    document.addEventListener('click', this.handleClick, false)
  },
  componentWillUnmount(){
    document.removeEventListener('click', this.handleClick, false)
  },
  handleOnLastDecade(){
    this.setState({ yearPos: this.state.yearPos - 10 })
  },
  handleOnNextDecade(){
    this.setState({ yearPos: this.state.yearPos + 10 })
  },
  handleOnLastYear(){
    this.setState({ yearPos: this.state.yearPos - 1 })
  },
  handleOnNextYear(){
    this.setState({ yearPos: this.state.yearPos + 1 })
  },
  handleSelectYear(nextYear){
    this.setState({ yearPos: nextYear, subSelectVisible: true, forceShow: true })
  },
  handleSelectQuarter(nextQuarter){
    this.setState({ quarterPos: nextQuarter })
    if (this.props.onChange){
      this.props.onChange(this.state.yearPos, nextQuarter)
    }
  },
  renderSelectYear(){
    const year = this.state.yearPos
    const lowerBound = year - year % 10
    const yearWrapper = (value) => {
      if (value == this.props.year){
        return (
          <td role="gridcell" title={value} className="ant-calendar-year-panel-cell ant-calendar-year-panel-selected-cell"
            onClick={() => {this.handleSelectYear(value)}}
          >
            <a className="ant-calendar-year-panel-year">{value}</a>
          </td>
        )
      }
      return (
        <td role="gridcell" title="{value}" className="ant-calendar-year-panel-cell"
          onClick={() => {this.handleSelectYear(value)}}
        >
          <a className="ant-calendar-year-panel-year">{value}</a>
        </td>
      )
    }
    return (
      <div className="ant-calendar-picker-container ant-calendar-picker-container-placement-bottomLeft">
        <div className="ant-calendar ant-calendar-month" style={{ position: 'relative' }}>
          <div className="ant-calendar-month-panel" style={{ position: 'relative' }}>
            <div className="ant-calendar-year-panel" style={{ position: 'relative' }}>
              <div>
                <div className="ant-calendar-year-panel-header">
                  <a className="ant-calendar-year-panel-prev-decade-btn" role="button" title="上一年代" onClick={() => {this.handleOnLastDecade()}}>«</a>
                  <a className="ant-calendar-year-panel-decade-select" role="button" title="选择年代">
                    <span className="ant-calendar-year-panel-decade-select-content">{lowerBound}-{lowerBound + 9}</span>
                    <span className="ant-calendar-year-panel-decade-select-arrow">x</span></a>
                  <a className="ant-calendar-year-panel-next-decade-btn" role="button" title="下一年代" onClick={() => {this.handleOnNextDecade()}}>»</a>
                </div><div className="ant-calendar-year-panel-body">
                  <table className="ant-calendar-year-panel-table" cellSpacing="0" role="grid">
                    <tbody className="ant-calendar-year-panel-tbody">
                      <tr role="row">
                        <td role="gridcell" title="" className="ant-calendar-year-panel-cell ant-calendar-year-panel-last-decade-cell"><span className="ant-calendar-year-panel-year" onClick={() => {this.handleOnLastDecade()}} /></td>
                        {yearWrapper(lowerBound)}
                        {yearWrapper(lowerBound + 1)}
                      </tr>
                      <tr role="row">
                        {yearWrapper(lowerBound + 2)}
                        {yearWrapper(lowerBound + 3)}
                        {yearWrapper(lowerBound + 4)}
                      </tr>
                      <tr role="row">
                        {yearWrapper(lowerBound + 5)}
                        {yearWrapper(lowerBound + 6)}
                        {yearWrapper(lowerBound + 7)}
                      </tr>
                      <tr role="row">
                        {yearWrapper(lowerBound + 8)}
                        {yearWrapper(lowerBound + 9)}
                        <td role="gridcell" title="" className="ant-calendar-year-panel-cell ant-calendar-year-panel-next-decade-cell"><a className="ant-calendar-year-panel-year" onClick={() => {this.handleOnNextDecade()}} /></td>
                      </tr>
                    </tbody>
                  </table>
                </div></div></div></div></div></div>
    )
  },
  renderSelectQuarter(){
    const quarter = this.state.quarterPos
    const year = this.state.yearPos
    const quarterWrapper = (value) => {
      if (value == quarter && year == this.props.year){
        return (
          <td role="gridcell" title={value} className="ant-calendar-year-panel-cell ant-calendar-year-panel-selected-cell"
            onClick={() => {this.handleSelectQuarter(value)}}
          >
            <a className="ant-calendar-year-panel-year" style={{ width: 200 }}>{`${year}年 ${CHINESE_DICT[value - 1]}`}</a>
          </td>
        )
      }
      return (
        <td role="gridcell" title={value} className="ant-calendar-year-panel-cell"
          onClick={() => {this.handleSelectQuarter(value)}}
        >
          <a className="ant-calendar-year-panel-year" style={{ width: 200 }}>{`${year}年 ${CHINESE_DICT[value - 1]}`}</a>
        </td>
      )
    }
    return (
      <div className="ant-calendar-picker-container ant-calendar-picker-container-placement-bottomLeft">
        <div className="ant-calendar ant-calendar-month" style={{ position: 'relative' }}>
          <div className="ant-calendar-month-panel" style={{ position: 'relative' }}>
            <div className="ant-calendar-year-panel" style={{ position: 'relative' }}>
              <div>
                <div className="ant-calendar-year-panel-header">
                  <a className="ant-calendar-year-panel-prev-decade-btn" role="button" title="上一年代" onClick={() => {this.handleOnLastYear()}}>«</a>
                  <a className="ant-calendar-year-panel-decade-select" role="button" title="选择年代">
                    <span className="ant-calendar-year-panel-decade-select-content" onClick={() => {this.setState({ subSelectVisible: false })}}>{year}</span>
                    <span className="ant-calendar-year-panel-decade-select-arrow">x</span></a>
                  <a className="ant-calendar-year-panel-next-decade-btn" role="button" title="下一年代" onClick={() => {this.handleOnNextYear()}}>»</a>
                </div><div className="ant-calendar-year-panel-body">
                  <table className="ant-calendar-year-panel-table" cellSpacing="0" role="grid">
                    <tbody className="ant-calendar-year-panel-tbody">
                      <tr role="row">
                        {quarterWrapper(1)}
                      </tr>
                      <tr role="row">
                        {quarterWrapper(2)}
                      </tr>
                      <tr role="row">
                        {quarterWrapper(3)}
                      </tr>
                      <tr role="row">
                        {quarterWrapper(4)}
                      </tr>
                    </tbody>
                  </table>
                </div></div></div></div></div></div>
    )
  },
  render(){
    if (this.state.subSelectVisible){
      return (this.renderSelectQuarter())
    }
    return (this.renderSelectYear())
  },
})
export default QuarterPicker
