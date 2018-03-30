import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { withRouter } from 'react-router-dom'
import { Motion, spring } from 'react-motion'
import styles from './CourseCard.scss'
import { DropDownIcon, DropUpIcon } from 'svg'
import { fromJS } from 'immutable'
import softwareInstituteLogo from 'images/nju_software_institute.png'

class CourseCard extends React.Component {
  static propTypes = {
    course: PropTypes.object.isRequired,
    currentCourseId: PropTypes.string.isRequired,
    currentGroupId: PropTypes.string.isRequired,
  }

  static defaultProps = {
    course: fromJS({
      id: 130008,
      term: "2015 FALL",
      grade: '大一',
      name: '软件工程',
      roleType: 2,
      groupSimpleList: []
    }),
    currentCourseId: '-1',
    currentGroupId: '-1',
  }

  state = {
    groupHeight: 0
  }

  handleExpandGroup = () => {
    const { course } = this.props
    const groupHeight = course.get('groupSimpleList').size * 24
    this.setState({ groupHeight })
  }

  handleShrinkGroup = () => {
    this.setState({ groupHeight: 0 })
  }

  handleJumpToDepartment = (id) => {
    const path = this.props.location.pathname
    const toPath = `/index/department/${id}/info`
    if (path != toPath) {
      this.props.history.push(toPath)
    }
  }

  handleJumpToCourse = (courseId) => {
    const pathname = this.props.location.pathname.split('/')
    let toPath = this.props.location.pathname
    if (courseId != pathname[3]) {
      if (pathname[4] === 'file') {
        toPath = `/index/course/${courseId}/file/0/path=%2F`
      } else {
        const target = pathname[4]
        toPath = `/index/course/${courseId}/${target}`
      }
    } else if (courseId == pathname[3] && pathname[5]) {
      toPath = `/index/course/${courseId}/info`
    }
    if (toPath != pathname.join('/')) {
      this.props.history.push(toPath)
    }
  }

  handleJumpToGroup = (groupId) => {
    const pathname = this.props.location.pathname.split('/')
    let subTarget
    if (pathname[4] === 'group' && pathname[6]) {
      subTarget = pathname[6]
    } else {
      subTarget = 'activity'
    }

    if (pathname[5] != groupId && subTarget === 'file') {
      this.props.history.push(`/index/course/${this.props.course.get('id')}/group/${groupId}/file/0/path=%2F`)
    } else if (pathname[5] != groupId){
      this.props.history.push(`/index/course/${this.props.course.get('id')}/group/${groupId}/${subTarget}`)
    }
  }

  renderArrow() {
    const { groupHeight } = this.state

    return (
      groupHeight === 0 ?
      <DropDownIcon
        style={{
          marginTop: 'auto',
          position: 'relative',
          fill: '#ccc',
          right: 3
        }}
        onClick={this.handleExpandGroup}
      />
      :
      <DropUpIcon
        style={{
          marginTop: 'auto',
          position: 'relative',
          fill: '#ccc',
          right: 3
        }}
        onClick={this.handleShrinkGroup}
      />
    )
  }

  render() {
    const { course, currentCourseId, currentGroupId } = this.props
    const { groupHeight } = this.state

    return (
      <div className={classNames(styles.container, course.get('id') == currentCourseId ? styles['isCurrent'] : '')}>
        <div className={styles.borderLine}></div>
        <div className={styles.content}>
          <span className={styles.left}>
            {
              course.get('grade') ?
              <span className={styles.logo}>
                {course.get('grade')}
              </span>
              :
              <span className={styles.staticLogo}>
                <img src={softwareInstituteLogo} />
              </span>
            }
            <span className={styles.courseName} onClick={course.get('grade') ? this.handleJumpToCourse.bind(this, course.get('id')) : this.handleJumpToDepartment.bind(this, course.get('id'))}>
              {course.get('name')}
            </span>
          </span>
          <span className={styles.right}>
            <span className={styles.term}>
              {course.get('term')}
            </span>
            {
              course.get('groupSimpleList') ? this.renderArrow() : null
            }
          </span>
        </div>
        {
          course.get('groupSimpleList') ?
          <Motion defaultStyle={{height: 0}} style={{height: spring(groupHeight)}}>
            {
              interpolatingStyle =>
                <div className={styles.group} style={interpolatingStyle}>
                  {
                    course.get('groupSimpleList').map(g => (
                      <div key={g.get('id')} className={classNames(styles.groupName, g.get('id') == currentGroupId ? styles['isCurrentGroup'] : '')} onClick={this.handleJumpToGroup.bind(this, g.get('id'))}>{g.get('name')}</div>
                    ))
                  }
                </div>
            }
          </Motion> : null
        }
      </div>
    )
  }
}

export default withRouter(CourseCard)
