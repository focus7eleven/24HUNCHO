import React from 'react'
import { fromJS } from 'immutable'
import CourseCard from '../course/CourseCard'
import MemberListButton from '../../components/button/MemberListButton'

class TestCardContainer extends React.Component {
  state = {
    course: fromJS({
      id: 130008,
      term: "2015 FALL",
      grade: '大一',
      name: '软件工程',
      roleType: 2,
      groupSimpleList: [
        {
          "id": 340503,
          "name": "葬爱家族",
          "mine": false
        },
        {
          "id": 343008,
          "name": "抗寒小组",
          "mine": false
        },
        {
          "id": 340504,
          "name": "tss开发小队",
          "mine": false
        },
        {
          "id": 340505,
          "name": "开锁大王",
          "mine": false
        },
        {
          "id": 341303,
          "name": "被遗忘的学生们",
          "mine": false
        },
        {
          "id": 342003,
          "name": "古典舞二班",
          "mine": false
        },
        {
          "id": 342004,
          "name": "古典舞一班",
          "mine": false
        }
      ]
    }),
    course2: fromJS({
      id: 130009,
      term: "2016 SUMMER",
      grade: '大四',
      name: '计算体系结构',
      roleType: 2,
      groupSimpleList: []
    })
  }

  handleMemberChange = (member) => {
    console.log(member);
  }

  render() {
    const { course, course2 } = this.state

    return (
      <div style={{padding: 100}}>
        <CourseCard
          course={course}
        />
        <CourseCard
          course={course2}
        />
        <MemberListButton
          onMemberChange={this.handleMemberChange}
        />
      </div>
    )
  }
}

export default TestCardContainer
