import React from 'react'
import { Radio, Select, Button } from 'antd'
import moment from 'moment'
import _constant from 'react-big-calendar/utils/constants'

const RadioGroup = Radio.Group
const RadioButton = Radio.Button
const Option = Select.Option

var MyToolbar = React.createClass({
  getDefaultProps() {
    return {
      locale: {},
      fullscreen: true,
      yearSelectOffset: 10,
      yearSelectTotal: 20,
      prefixCls: 'ant-fullcalendar',
    }
  },

  getInitialState() {
    return {
      value: moment()
    }
  },

  componentWillMount() {
    this.viewMap = {
      'month': '月',
      'week': '周',
      'day': '天',
    }
  },

  getYearSelectElement(year) {
    const { yearSelectOffset, yearSelectTotal, locale, prefixCls, fullscreen } = this.props
    const start = year - yearSelectOffset
    const end = start + yearSelectTotal
    const suffix = locale.year === '年' ? '年' : ''

    const options = []
    for (let index = start; index < end; index++) {
      options.push(<Option key={`${index}`}>{index + suffix}</Option>)
    }
    return (
      <Select
        size={fullscreen ? null : 'small'}
        dropdownMatchSelectWidth={false}
        className={`${prefixCls}-year-select`}
        onChange={this.onYearChange}
        value={String(year)}
      >
        {options}
      </Select>
    )
  },

  getMonthsLocale() {
    const current = moment()
    const localeData = current.localeData()
    const months = []
    for (let i = 0; i < 12; i++) {
      current.month(i)
      months.push(localeData.monthsShort(current))
    }
    return months
  },

  getMonthSelectElement(month, months) {
    const props = this.props
    const { prefixCls, fullscreen } = props
    const options = []

    for (let index = 0; index < 12; index++) {
      options.push(<Option key={`${index}`}>{months[index]}</Option>)
    }

    return (
      <Select
        size={fullscreen ? null : 'small'}
        dropdownMatchSelectWidth={false}
        className={`${prefixCls}-month-select`}
        value={String(month)}
        onChange={this.onMonthChange}
      >
        {options}
      </Select>
    )
  },

  onYearChange(year) {
    const newValue = this.state.value.clone()
    newValue.year(year)
    this.setState({ value: newValue })
    this.props.onNavigate(_constant.navigate.DATE, newValue._d)
  },

  onMonthChange(month) {
    const newValue = this.state.value.clone()
    newValue.month(month)
    this.setState({ value: newValue })
    this.props.onNavigate(_constant.navigate.DATE, newValue._d)
  },

  onTypeChange(e) {
    this.props.onViewChange(e.target.value)
  },

  navigate(action) {
    this.props.onNavigate(action)
  },


  render: function () {
    const yearSelect = this.getYearSelectElement(this.props.date.getFullYear())
    const monthSelect = this.props.view === 'month' ?
            this.getMonthSelectElement(this.props.date.getMonth(), this.getMonthsLocale()) : null
    const typeSwitch = (
      <RadioGroup onChange={this.onTypeChange} value={this.props.view}
        size={this.props.fullscreen ? 'default' : 'small'}
      >
        {this.props.views.map((name, index) => {
          return <RadioButton key={index} value={name}>{this.viewMap[name]}</RadioButton>
        })}
      </RadioGroup>
        )
    return (
      <div>
        <Button onClick={this.navigate.bind(this, _constant.navigate.PREVIOUS)}><i className="fa fa-angle-left" /></Button>
        <span className="rbc-toolbar-label">{this.props.label}</span>
        {yearSelect}
        {monthSelect}
        {typeSwitch}
        <Button onClick={this.navigate.bind(this, _constant.navigate.NEXT)}><i className="fa fa-angle-right" /></Button>
        <Button onClick={this.navigate.bind(this, _constant.navigate.TODAY)}>今天</Button>
      </div>
    )
  }
})
export default MyToolbar
