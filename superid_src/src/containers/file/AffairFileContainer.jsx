import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { pushURL } from 'actions/route'
import { Motion, spring } from 'react-motion'
import classNames from 'classnames'
import styles from './AffairFileContainer.scss'
import PERMISSION from 'utils/permission'

const FILE_REPO = 'repo'
const TRASH = 'trash'

let AffairFileContainer = React.createClass({

  componentWillReceiveProps(nextProps) {
    if (nextProps.routes[4].path.includes('trash') && !nextProps.affair.validatePermissions(PERMISSION.CHECK_FILE_BIN)) {
      this.props.pushURL(`/workspace/affair/${this.props.params.id}/file`)
    }
  },
  // Handler
  handleSwitchTab(path) {
    this.props.pushURL(`/workspace/affair/${this.props.params.id}/file/${path}`)
  },

  // Renderer
  renderLeftTab() {
    const isFileList = !this.props.routes[4].path.includes('trash')

    return (
      <div className={styles.leftTab}>
        <div className={classNames(styles.leftTabItem, isFileList ? styles.activeLeftTabItem : null)} onClick={() => this.handleSwitchTab(FILE_REPO)}>事务文件</div>
        {this.props.affair.validatePermissions(PERMISSION.CHECK_FILE_BIN) &&
          <div className={classNames(styles.leftTabItem, !isFileList ? styles.activeLeftTabItem : null)} onClick={() => this.handleSwitchTab(TRASH)}>回收站</div>
        }
        <Motion style={{ top: spring((isFileList ? 0 : 1) * 37 + 10) }}>
          {
            (style) => <div className={styles.smooth} style={{ top: `${style.top}px` }} />
          }
        </Motion>
      </div>
    )
  },
  renderContent() {
    return (
      <div className={styles.content}>
        {React.cloneElement(this.props.children, { affair: this.props.affair, renderHeader: true })}
      </div>
    )
  },
  render() {
    return (
      <div className={styles.container}>
        {this.renderLeftTab()}
        {this.renderContent()}
      </div>
    )
  }
})

function mapStateToProps(state, props) {
  const affair = state.getIn(['affair', 'affairMap']).find((v, k) => {return k == props.params.id})
  return {
    affair,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    pushURL: bindActionCreators(pushURL, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AffairFileContainer)
