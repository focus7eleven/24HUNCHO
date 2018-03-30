import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import classNames from 'classnames'
import moment from 'moment'
import { Motion, spring } from 'react-motion'
import { AddNewCourse, SearchIcon } from 'svg'
import { Tree, Collapse } from 'antd'
import { Map } from 'immutable'
import { USER_ROLE_TYPE } from 'member-role-type'
import styles from './CourseListContainer.scss'
import CourseCard from './CourseCard'
import { getMyCourse, getAllCourse } from '../../actions/course'
import CreateCourseModal from '../../components/modal/CreateCourseModal'

const Panel = Collapse.Panel
const TreeNode = Tree.TreeNode

const MY_COURSE = 0
const ALL_COURSE = 1
const ACTIVE_BAR_LEFT = [20, 200, 290]

class CourseListContainer extends React.Component {
  state = {
    CREATE_COURSE_MODAL_STATE: false,
    currentTab: MY_COURSE,
    searchKeyword: '',
    currentTerm: [this.props.myCourse.keySeq().get(0)],
    currentInstitute: [this.props.allCourse.keySeq().get(0)],
    expandedKeys: [],
    highlightCourse: [],
    selectedCourse: [],
    courseList: this.props.myCourse,
  }

  componentDidMount() {
    const { userType, allCourse } = this.props
    if (userType === USER_ROLE_TYPE.ADMIN) {
      this.setState({ courseList: allCourse, currentTab: ALL_COURSE })
    }
  // }

  // componentDidMount() {
    if (window.navigator.platform === 'MacIntel') {
      window.addEventListener('keydown', e => {
        if (e.metaKey && e.code === 'KeyF') {
          e.preventDefault()
          this.refs.courseSearchInput.focus()
        }
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    let currentTab = MY_COURSE
    let courseList = nextProps.myCourse
    if (nextProps.userType === USER_ROLE_TYPE.ADMIN) {
      currentTab = ALL_COURSE
      courseList = nextProps.allCourse
    }
    this.setState({
      courseList,
      currentTab
    })
  }


  handleInstituteChange = e => {
    this.setState({ currentInstitute: e})
  }

  handleTermChange = e => {
    this.setState({ currentTerm: e})
  }

  handleSwitchTab = tab => {
    this.setState({ selectedCourse: [], currentTab: tab })
    if (tab === ALL_COURSE) {
      const pathname = this.props.location.pathname.split('/')
      this.setState({ selectedCourse: [pathname[3]], courseList: this.props.allCourse, currentInstitute: [this.props.allCourse.keySeq().get(0)]})
    } else if (tab === MY_COURSE) {
      this.setState({ courseList: this.props.myCourse})
    }
  }

  handleSearchCourse = e => {
    const searchKeyword = e.target.value
    this.setState({ searchKeyword })
    const { courseList, currentTab } = this.state
    if (currentTab === ALL_COURSE) {
      const targetInstitute = []
      const targetGrade = []
      const highlightCourse = []
      courseList.keySeq().forEach(ins => {
        courseList.get(ins).keySeq().forEach(term => {
          courseList.getIn([ins, term]).keySeq().forEach(grade => {
            courseList.getIn([ins, term, grade]).forEach(course => {
              const keywordIndex = course.get('name').indexOf(searchKeyword)
              if (~keywordIndex) {
                if (!~targetInstitute.indexOf(ins)) {
                  targetInstitute.push(ins)
                }
                const termKey = ins + '/' + term
                const gradeKey = ins + '/' + term + '/' + grade
                if (!~targetGrade.indexOf(gradeKey)) {
                  targetGrade.push(termKey)
                  targetGrade.push(gradeKey)
                }
                highlightCourse.push({start: keywordIndex, length: searchKeyword.length, name: course.get('name')})
              }
            })
          })
        })
      })
      this.setState({ highlightCourse, currentInstitute: targetInstitute, expandedKeys: targetGrade })
    } else if (currentTab === MY_COURSE) {
      const newCourseList = this.props.myCourse.filter(c => ~c.get('name').indexOf(searchKeyword))
      this.setState({ courseList: newCourseList })
    }
  }

  handleTreeExpand = e => {
    this.setState({ expandedKeys: e })
  }

  handleSelectCourse = e => {
    if (!e.length) {
      this.props.history.push(`/index/course/${this.state.selectedCourse[0]}/info`)
      return
    } else {
      const pathname = this.props.location.pathname.split('/')
      const target = e[0]
      this.setState({ selectedCourse: e })
      if (pathname[4] === 'file') {
        pathname[3] !== target || pathname.length > 5 ? this.props.history.push('/index/course/' + target + '/file/0/path=%2F') : null
      } else {
        pathname[3] !== target || pathname.length > 5 ? this.props.history.push('/index/course/' + target + '/' + pathname[4]) : null
      }
    }
  }

  handleModalControl = (state) => {
    this.setState({ CREATE_COURSE_MODAL_STATE: state })
  }

  handleCourseCreated = () => {
    this.props.getMyCourse()
    this.props.getAllCourse()
    this.handleModalControl(false)
  }

  renderName(name) {
    const { highlightCourse } = this.state
    let renderedName = name
    for (let i = 0; i < highlightCourse.length; i++) {
      const h = highlightCourse[i]
      if (h.name === name) {
        const before = name.slice(0, h.start)
        const target = name.slice(h.start, h.start + h.length)
        const after = name.slice(h.start + h.length)
        renderedName = (
          <span>
            {before}
            <span className={styles.highlight}>{target}</span>
            {after}
          </span>
        )
        break
      }
    }
    return renderedName
  }

  renderAllCourse(courseList) {
    const { currentTab, currentInstitute, currentTerm, expandedKeys, selectedCourse } = this.state
    const defaultCoursePanel = courseList.keySeq().get(0)
    return (
      <div className={styles.tree}>
        <Collapse bordered={false} defaultActiveKey={[defaultCoursePanel]} activeKey={currentInstitute} onChange={this.handleInstituteChange}>
          {
            courseList.keySeq().map((ins, index) => (
              <Panel className={styles.term} header={ins} key={ins}>
                <Tree
                  defaultExpandAll={true}
                  showLine
                  onExpand={this.handleTreeExpand}
                  expandedKeys={expandedKeys}
                  autoExpandParent={false}
                  selectedKeys={selectedCourse}
                  onSelect={this.handleSelectCourse}
                >
                  {
                    courseList.get(ins).keySeq().map((term, termIndex) => (
                      <TreeNode title={term} key={ins + '/' + term} selectable={false} >
                        {
                          courseList.getIn([ins, term]).keySeq().map((grade, gradeIndex) => (
                            <TreeNode title={grade} key={ins + '/' + term + '/' + grade} selectable={false} >
                              {
                                courseList.getIn([ins, term, grade]).map((course, courseIndex) => (
                                  <TreeNode title={this.renderName(course.get('name'))} key={course.get('id')}>
                                    {/* {
                                      course.get('groupSimpleList') && course.get('groupSimpleList').map((group, groupIndex) => (
                                        <TreeNode title={group.get('name')} key={term + '/' + grade + '/' + course.get('id') + '/' + group.get('id')} />
                                      ))
                                    } */}
                                  </TreeNode>
                                ))
                              }
                            </TreeNode>
                          ))
                        }
                      </TreeNode>
                    ))
                  }
                </Tree>
              </Panel>
            ))
          }
        </Collapse>
      </div>
    )
  }

  renderMyCourse() {
    const { courseList } = this.state
    return (
      <div className={styles.list}>
        {
          courseList.map(c => (
            <CourseCard
              key={c.get('id')}
              course={c}
              currentCourseId={this.props.courseId}
              currentGroupId={this.props.groupId}
            />
          ))
        }
      </div>
    )
  }

  renderList() {
    const { currentTab } = this.state
    const { userType, allCourse } = this.props

    if (userType === USER_ROLE_TYPE.ADMIN) {
      // this.setState({ courseList: allCourse})
      return this.renderAllCourse(allCourse)
    } else {
      if (currentTab === MY_COURSE) {
        return this.renderMyCourse()
      } else if (currentTab === ALL_COURSE) {
        return this.renderAllCourse(allCourse)
      }
    }
  }

  render() {
		const { currentTab, searchKeyword, currentTerm, expandedKeys, courseList, selectedCourse, CREATE_COURSE_MODAL_STATE } = this.state
    const { userType } = this.props

    return (
      <div className={styles.container}>
        {
          userType === USER_ROLE_TYPE.ADMIN ?
          <div className={styles.tab}>
            <div className={classNames(styles.singleTabItem, currentTab === ALL_COURSE ? styles['tabItem-active'] : '')} onClick={this.handleSwitchTab.bind(this, ALL_COURSE)}><p>所有课程</p></div>
						<span style={{ left: 0, width: 360 }} className={styles.activeBar} />
          </div>
          :
          <Motion style={{ activeBarLeft: spring(ACTIVE_BAR_LEFT[currentTab]) }}>
    				{(interpolatingStyle) =>
    					(
    						<div className={styles.tab}>
    							<div className={classNames(styles.tabItem, currentTab === MY_COURSE ? styles['tabItem-active'] : '')} onClick={this.handleSwitchTab.bind(this, MY_COURSE)}><p>我的课程</p></div>
    							<div className={classNames(styles.tabItem, currentTab === ALL_COURSE ? styles['tabItem-active'] : '')} onClick={this.handleSwitchTab.bind(this, ALL_COURSE)}><p>所有课程</p></div>
    							<span style={{ left: interpolatingStyle.activeBarLeft, width: 140 }} className={styles.activeBar} />
    						</div>
    					)
    				}
    			</Motion>
        }

        <div key="search" className={styles.search}>
    			<SearchIcon />
    			<input ref="courseSearchInput" type="text" placeholder="搜索课程" value={searchKeyword} onChange={this.handleSearchCourse} />
    		</div>

        { this.renderList() }

        {
          userType === USER_ROLE_TYPE.ADMIN ?
          <div className={styles.addCourse} onClick={this.handleModalControl.bind(this, true)}>
            <AddNewCourse /> 开设课程
          </div>
          : null
        }


        <CreateCourseModal
          visible={CREATE_COURSE_MODAL_STATE}
          onClose={this.handleModalControl.bind(this, false)}
          onSuccess={this.handleCourseCreated}
        />
      </div>
    )
  }
}

function mapStateToProps(state, props) {
	return {
		myCourse: state.getIn(['course', 'myCourse']),
		allCourse: state.getIn(['course', 'allCourse']),
		userType: state.getIn(['user', 'type']),
    courseId: props.location.pathname.split('/')[3],
    groupId: props.location.pathname.split('/')[5] || '-1'
	}
}

function mapDispatchToProps(dispatch) {
  return {
    getMyCourse: bindActionCreators(getMyCourse, dispatch),
    getAllCourse: bindActionCreators(getAllCourse, dispatch)
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(CourseListContainer))
