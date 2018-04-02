import React from 'react'
import { connect } from 'react-redux'
import { Motion, spring } from 'react-motion'
import classNames from 'classnames'
import styles from './TransactionContainer.scss'
import GeneralJournalEntries from './GeneralJournalEntries'
import GeneralJournalSummaryEntries from './GeneralJournalSummaryEntries'



const TAB = ['流水表', '往来汇总表']

const Transaction = React.createClass({
  getInitialState() {
    return {
      currentTab: TAB[0],
      tabIndex: 0,
    }
  },

  // 左侧导航栏
  renderLeftTab() {
    const { tabIndex } = this.state
    return (
      <div className={styles.tabNavigator}>
        {
          TAB.map((tab, k) => (
            <div
              className={classNames(styles.navigatorItem, this.state.currentTab === tab ? styles.activeNavigatorItem : null)}
              key={k}
              onClick={() => this.setState({ currentTab: tab, tabIndex: k })}
            >
              {tab}
            </div>
          ))
        }
        <Motion style={{ top: spring((tabIndex) * 37 + 10) }}>
          {
            (style) => <div className={styles.smooth} style={{ top: `${style.top}px` }} />
          }
        </Motion>
      </div>
    )
  },
  render() {
    return (
      <div className={styles.container}>
        {this.renderLeftTab()}
        <div className={styles.content}>
          {this.state.currentTab === TAB[0] ?
            <GeneralJournalEntries affair={this.props.affair}/>
          :
            <GeneralJournalSummaryEntries affair={this.props.affair}/>
          }
        </div>
      </div>
    )
  }
})

function mapStateToProps(state, props){
  return {
    affair: state.getIn(['affair', 'affairMap', props.params.id]),
  }
}

function mapDispatchToProps(){
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(Transaction)
