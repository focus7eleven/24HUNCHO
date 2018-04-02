import React from 'react'
import Calendar from 'react-big-calendar'
import moment from 'moment'
import MyToolbar from './MyToolbar'
import { Row, Col } from 'antd'
import 'moment/locale/zh-cn'
import styles from 'react-big-calendar/scss/style.scss'
import _constant from 'react-big-calendar/utils/constants'

moment.locale('zh-cn')
Calendar.setLocalizer(
  Calendar.momentLocalizer(moment)
)

var MyCalendar = React.createClass({
  onSelectEvent(event) {
    alert(event.title)
  },

  onSelectSlot(slotInfo) {
    alert('该日期区间:\n' +
        slotInfo.start.toLocaleString() +
        '到' +
        slotInfo.end.toLocaleString())
  },

  render(){
    let components = {
      toolbar: MyToolbar
    }
    let events = [
      {
        'title': 'All Day Event1',
        'allDay': true,
        'start': new Date(2016, 8, 3),
        'end': new Date(2016, 8, 3)
      },
      {
        'title': 'All Day Event2',
        'allDay': true,
        'start': new Date(2016, 8, 2),
        'end': new Date(2016, 8, 2)
      },
      {
        'title': 'All Day Event3',
        'allDay': true,
        'start': new Date(2016, 8, 2),
        'end': new Date(2016, 8, 2)
      },
      {
        'title': 'All Day Event4',
        'allDay': true,
        'start': new Date(2016, 8, 2),
        'end': new Date(2016, 8, 2)
      },
      {
        'title': 'All Day Event5',
        'allDay': true,
        'start': new Date(2016, 8, 2),
        'end': new Date(2016, 8, 2)
      },
      {
        'title': 'All Day Event6',
        'allDay': true,
        'start': new Date(2016, 8, 2),
        'end': new Date(2016, 8, 2)
      },
      {
        'title': 'All Day Event7',
        'allDay': true,
        'start': new Date(2016, 8, 2),
        'end': new Date(2016, 8, 2)
      },
      {
        'title': 'Long Event',
        'start': new Date(2016, 8, 18),
        'end': new Date(2016, 8, 21)
      }
    ]
    return (
      <Row>
        <Col span={6} />
        <Col span={16} style={{ height: 500 }}>
          <Calendar
            components={components}
            events={events}
            views={[_constant.views.MONTH, _constant.views.WEEK]}
            style={styles}
            onSelectEvent={this.onSelectEvent}
          />
        </Col>
      </Row>
    )
  }

})

export default MyCalendar
