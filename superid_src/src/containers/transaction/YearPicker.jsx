import React from 'react'
import ReactDOM from 'react-dom'
import { Dropdown } from 'antd'
import moment from 'moment'

const YearPicker = React.createClass({
  getInitialState() {
    let currentYear = moment().year()
    return {
      year: currentYear,
      popupVisible: false,
    }
  },
  handleSelectYear(nextYear){
    this.setState({
      year: nextYear,
      popupVisible: false,
    })
    if (this.props.onChange){
      this.props.onChange(nextYear)
    }
  },
  render(){
    const { year, popupVisible } = this.state
    const selectPanel = (<SelectPanel parentNode={this} year={year} onClickOutside={() => {this.setState({ popupVisible: false })}} onChange={(nextYear) => {this.handleSelectYear(nextYear)}}/>)
    return (
      <Dropdown overlay={selectPanel} trigger={['click']} visible={popupVisible}>
        <div style={{ maxHeight: 0, position: 'relative', top: -4 }}>
          <span style={{ position: 'relative', top: 4 }} className="ant-calendar-picker">
            <span>
              <input readOnly="" value={year + '年'} placeholder="请选择日期" className="ant-calendar-range-picker ant-input" onClick={() => {this.setState({ popupVisible: true })}} />
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
    }
  },
  handleClick(e){
    const { parentNode } = this.props
    if (!(ReactDOM.findDOMNode(this).contains(e.target)) && !(ReactDOM.findDOMNode(parentNode).contains(e.target))) {
      this.props.onClickOutside()
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
  handleSelectYear(nextYear){
    this.setState({ yearPos: nextYear })
    if (this.props.onChange){
      this.props.onChange(nextYear)
    }
  },
  render(){
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
        <td role="gridcell" title={value} className="ant-calendar-year-panel-cell"
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
})
export default YearPicker
