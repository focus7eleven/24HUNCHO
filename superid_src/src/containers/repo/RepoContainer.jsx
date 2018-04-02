import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { pushURL } from 'actions/route'
import styles from './RepoContainer.scss'
import { Motion, spring } from 'react-motion'
import PERMISSION from 'utils/permission'

const RepoContainer = React.createClass({

  render() {
    const { affair } = this.props
    let TAB_NAME = []
    let TAB_PATH = []
    if (affair.validatePermissions(PERMISSION.ENTER_MEMBER_STORE)) {
      TAB_NAME.push('人才库')
      TAB_PATH.push('member')
    }
    if (affair.validatePermissions(PERMISSION.ENTER_FUND_STORE)) {
      TAB_NAME.push('资金库')
      TAB_PATH.push('funds')
    }
    if (affair.validatePermissions(PERMISSION.ENTER_MATERIAL_STORE)) {
      TAB_NAME.push('物资库')
      TAB_PATH.push('assetrepo')
    }

    let path = this.props.location.pathname.split('/')
    let currentTabIndex = -1

    TAB_PATH.forEach((tabPath, i) => {
      if (~path.indexOf(tabPath)) {
        currentTabIndex = i
      }
    })
    let currentTab = TAB_NAME[currentTabIndex]

    return (
      <div className={styles.repoContainer}>
        {/* 左部导航栏 */}
        <div className={styles.left}>
          {TAB_NAME.map((v, k) => {
            return (
              <div
                className={currentTab === v ? styles.chosenTab : styles.tab}
                key={`table${k}`}
                onClick={() => {
                  this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/${TAB_PATH[k]}`)
                }}
              >
                {v}
              </div>
            )
          })}

          <Motion style={{ top: spring(TAB_NAME.indexOf(currentTab) * 37 + 11), opacity: ~TAB_NAME.indexOf(currentTab) ? 1 : 0 }}>
            {
              (style) => <div className={styles.smooth} style={{ top: `${style.top}px`, opacity: style.opacity }} />
            }
          </Motion>
        </div>

        {/* 主要内容 */}
        <div className={styles.right}>
          {React.cloneElement(this.props.children, { affair: this.props.affair })}
        </div>
      </div>
    )
  },
})

function mapStateToProps(state, props){
  return {
    affair: state.getIn(['affair', 'affairMap', props.params.id]),
  }
}

function mapDispatchToProps(dispatch){
  return {
    pushURL: bindActionCreators(pushURL, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(RepoContainer)
