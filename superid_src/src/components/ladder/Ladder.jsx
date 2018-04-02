import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Motion, spring } from 'react-motion'
import styles from './Ladder.scss'
import { pushURL } from 'actions/route'

const Ladder = React.createClass({
  propTypes: {
    affair: PropTypes.object.isRequired,
    content: PropTypes.object.isRequired,
    options: PropTypes.array.isRequired,
    path: PropTypes.string.isRequired,
  },
  contextTypes: {
    router: PropTypes.object.isRequired,
  },

  getInitialState(){
    return {
      currentTabName: null,
      validOptions: [],
    }
  },
  componentWillMount(){
    this.onReceiveProps(this.props, true)
  },
  componentWillReceiveProps(nextProps) {
    this.onReceiveProps(nextProps)
  },

  onReceiveProps(nextProps) {
    /* BUG permissions 仍然可以为空串 不知道为什么 因此这里先加个过滤 */
    if (nextProps.affair == null || nextProps.affair.get('permissions') == '') { return }

    this.setState({
      validOptions: this.props.options.filter((option) => nextProps.affair.validatePermissions(option.permission))
    })
    const currentRoute = (this.props.routes[4] || { path: '' }).path.split('/')[0]
    const nextRoute = (nextProps.routes[4] || { path: '' }).path.split('/')[0]
    if (nextRoute != currentRoute || this.state.currentTabName == null) {
      const currentTab = this.props.options.find((option) => option.tabPath == nextRoute)
      if (currentTab != null) {
        this.setState({
          currentTabName: currentTab.tabName
        })
      }
    }
  },

  handleSwitchTab(option){
    this.setState({ currentTabName: option.tabName }, () => {
      this.props.pushURL(`/workspace/affair/${this.props.affair.get('id')}/${this.props.path}/${option.tabPath}`)
    })
  },

  render(){
    const { currentTabName, validOptions } = this.state
    if (validOptions.length == 0 || this.props.affair == null) {
      return <div />
    }
    const currentIndex = validOptions.map((opt) => opt.tabName).indexOf(currentTabName)
    return (
      <div className={styles.container}>
        <div className={styles.tabContainer}>
          {validOptions.map((option) => {
            return (
              <div
                key={option.tabName}
                className={currentTabName == option.tabName ? styles.selectedTab : styles.tab}
                onClick={() => this.handleSwitchTab(option)}
              >{option.tabName}</div>
            )
          })}
          <Motion style={{ top: currentIndex >= 0 ? spring(currentIndex * 37 + 11) : -50 }}>
            {(style) => <div className={styles.smooth} style={{ top: `${style.top}px` }} />}
          </Motion>
        </div>
        <div className={styles.content}>
          {this.props.affair && React.cloneElement(this.props.content, { affair: this.props.affair })}
        </div>
      </div>
    )
  }
})

export default connect(
  null,
  (dispatch) => ({
    pushURL: bindActionCreators(pushURL, dispatch)
  })
)(Ladder)
