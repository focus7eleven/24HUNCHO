import React from 'react'
import { message } from 'antd'
import { connect } from 'react-redux'
import { Redirect } from 'react-router'
import { bindActionCreators } from 'redux'
import { fromJS } from 'immutable'
import Children from '../components/route/SubRoute'
import styles from './BaseContainer.scss'
import HeaderContainer from './header/HeaderContainer'
import CourseListContainer from './course/CourseListContainer'
import CourseIndexContainer from './course/CourseIndexContainer'
import { getMyCourse, getAllCourse } from '../actions/course'

class BaseContainer extends React.Component {

  state = {
    isLoading: true,
  }

  componentWillMount() {
    const getMy = this.props.getMyCourse()
    const getAll = this.props.getAllCourse()
    Promise.all([getMy, getAll]).then((res) => {
      fromJS(res).forEach((v) => {
        if (v && v.code !== 0) {
          // message.error(v.get('data'))
          return false
        }
      })
      this.setState({
        isLoading: false,
      })
    })
  }

  render() {
    const { isLoading } = this.state
    const { myCourse, allCourse } = this.props

    if(isLoading){
      return null
    }

    if(!myCourse.first() && !allCourse.first()) {
      return null
      // return <div className={styles.container}><div className={styles.error}>嗯，服务器挂了...</div></div>
    }

    const firstCourseId = myCourse.get(0).get('id')
    const affairType = myCourse.get(0).get('grade') ? 'course' : 'department'
    return (
      <div className={styles.container}>
        <HeaderContainer />
        <div className={styles.body}>
          <div className={styles.left}>
            <CourseListContainer />
          </div>
          <div className={styles.right}>
            {
              this.props.location.pathname.split('/').length < 3 &&
              <Redirect to={`/index/${affairType}/${firstCourseId}/info`}/>
            }
            <CourseIndexContainer {...this.props} />
            {/* <Children routes={this.props.routes}/> */}
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    myCourse: state.getIn(['course', 'myCourse']),
    allCourse: state.getIn(['course', 'allCourse']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getMyCourse: bindActionCreators(getMyCourse, dispatch),
    getAllCourse: bindActionCreators(getAllCourse, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(BaseContainer)
