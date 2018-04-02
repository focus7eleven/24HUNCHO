import React from 'react';
import { findDOMNode } from 'react-dom';
import cn from 'classnames';
import dates from './utils/dates';
import localizer from './localizer'
import chunk from 'lodash/chunk';

import { navigate } from './utils/constants';
import { notify } from './utils/helpers';

import EventRow from './EventRow';
import BackgroundCells from './BackgroundCells';

import { dateFormat } from './utils/propTypes';
import {
    segStyle, inRange, eventSegments
  , endOfRange, eventLevels, sortEvents } from './utils/eventLevels';

let eventsForWeek = (evts, start, end, props) =>
  evts.filter(e => inRange(e, start, end, props));

let isSegmentInSlot = (seg, slot) => seg.left <= slot && seg.right >= slot;

let propTypes = {
  ...EventRow.PropTypes,

  culture: React.PropTypes.string,

  date: React.PropTypes.instanceOf(Date),

  min: React.PropTypes.instanceOf(Date),
  max: React.PropTypes.instanceOf(Date),

  dateFormat,

  weekdayFormat: dateFormat,

  popup: React.PropTypes.bool,

  popupOffset: React.PropTypes.oneOfType([
    React.PropTypes.number,
    React.PropTypes.shape({
      x: React.PropTypes.number,
      y: React.PropTypes.number
    })
  ]),

  onSelectEvent: React.PropTypes.func,
  onSelectSlot: React.PropTypes.func
};

let MonthView = React.createClass({

  displayName: 'MonthView',

  propTypes,

  componentWillMount() {
    this._bgRows = []
    this._pendingSelection = []
  },

  componentWillReceiveProps({ date }) {
  },

  componentDidMount() {
  },

  componentDidUpdate() {
  },

  componentWillUnmount() {
  },

  render() {
    let { date, culture, weekdayFormat, className } = this.props
      , month = dates.visibleDays(date, culture)
      , weeks  = chunk(month, 7);


    return (
      <div className={cn('rbc-month-view', className)}>
        <div className='rbc-row rbc-month-header'>
          {this._headers(weeks[0], weekdayFormat, culture)}
        </div>
        { weeks.map((week, idx) =>
            this.renderWeek(week, idx, false))
        }
      </div>
    )
  },

  renderWeek(week, weekIdx, content) {
    let { first, last } = endOfRange(week);
    let evts = eventsForWeek(this.props.events, week[0], week[week.length - 1], this.props)

    evts.sort((a, b) => sortEvents(a, b, this.props))

    let segments = evts = evts.map(evt => eventSegments(evt, first, last, this.props))
    let { levels } = eventLevels(segments)


    content = content || ((lvls, wk) => {return this.renderRowLevel(levels, week, 0)})

    return (
      <div key={'week_' + weekIdx}
        className='rbc-month-row'
        ref={!weekIdx && (r => this._firstRow = r)}
      >
        {
          this.renderBackground(week, weekIdx)
        }
        <div
          className='rbc-row-content'
        >
          <div
            className='rbc-row'
            ref={!weekIdx && (r => this._firstDateRow = r)}
          >
            { this._dates(week) }
          </div>
          {
            content(levels, week, weekIdx)
          }
        </div>
      </div>
    )
  },

  renderBackground(row, idx){
    let self = this;

    function onSelectSlot({ start, end }) {
      self._pendingSelection = self._pendingSelection
        .concat(row.slice(start, end + 1))

      clearTimeout(self._selectTimer)
      self._selectTimer = setTimeout(()=> self._selectDates())
    }

    return (
    <BackgroundCells
      container={() => findDOMNode(this)}
      selectable={this.props.selectable}
      slots={7}
      ref={r => this._bgRows[idx] = r}
      onSelectSlot={onSelectSlot}
    />
    )
  },

  renderRowLevel(segments, week, idx){
    let { first, last } = endOfRange(week);
    return (
      <EventRow
        {...this.props}
        eventComponent={this.props.components.event}
        onSelect={this._selectEvent}
        key={idx}
        segments={segments}
        start={first}
        end={last}
      />
    )
  },

  _dates(row){
    return row.map((day, colIdx) => {
      var offRange = dates.month(day) !== dates.month(this.props.date);

      return (
        <div
          key={'header_' + colIdx}
          style={segStyle(1, 7)}
          className={cn('rbc-date-cell', {
            'rbc-off-range': offRange,
            'rbc-now': dates.eq(day, new Date(), 'day'),
            'rbc-current': dates.eq(day, this.props.date, 'day')
          })}
        >
          <a href='#' onClick={this._dateClick.bind(null, day)}>
            { localizer.format(day, this.props.dateFormat, this.props.culture) }
          </a>
        </div>
      )
    })
  },

  _headers(row, format, culture){
    let first = row[0]
    let last = row[row.length - 1]

    return dates.range(first, last, 'day').map((day, idx) =>
      <div
        key={'header_' + idx}
        className='rbc-header'
        style={segStyle(1, 7)}
      >
        { localizer.format(day, format, culture) }
      </div>
    )
  },

  _dateClick(date, e){
    e.preventDefault();
    this.clearSelection()
    notify(this.props.onNavigate, [navigate.DATE, date])
  },

  _selectEvent(...args){
    //cancel any pending selections so only the event click goes through.
    this.clearSelection()

    notify(this.props.onSelectEvent, args)
  },

  _selectDates(){
    let slots = this._pendingSelection.slice()

    this._pendingSelection = []

    slots.sort((a, b) => +a - +b)

    notify(this.props.onSelectSlot, {
      slots,
      start: slots[0],
      end: slots[slots.length - 1]
    })
  },


  clearSelection(){
    clearTimeout(this._selectTimer)
    this._pendingSelection = [];
  }

});

MonthView.navigate = (date, action)=>{
  switch (action){
    case navigate.PREVIOUS:
      return dates.add(date, -1, 'month');

    case navigate.NEXT:
      return dates.add(date, 1, 'month')

    default:
      return date;
  }
}

MonthView.range = (date, { culture }) => {
  let start = dates.firstVisibleDay(date, culture)
  let end = dates.lastVisibleDay(date, culture)
  return { start, end }
}

export default MonthView
