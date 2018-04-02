import React from 'react'
import styles from './TaskIndexContainer.scss'
import { Switch } from 'antd'
import { AxisIcon, TableIcon, TemplateIcon } from 'svg'
import TableViewContainer from './TableViewContainer'
import AxisViewContainer from './AxisViewContainer'
import TemplateViewContainer from './TemplateViewContainer'
import { connect } from 'react-redux'

const TaskIndexContainer = React.createClass({
  getInitialState(){
    return {
      currentTab: 'table',
      isContainChildren: true, //是否包含子事务
    }
  },

  // renders
  renderHeader(){
    const { currentTab } = this.state
    return (<div className={styles.header}>
      <div className={styles.left}>
        <span className={styles.text}>包含子事务</span>
        <Switch checkedChildren="开" unCheckedChildren="关" checked={this.state.isContainChildren} onChange={(checked) => this.setState({ isContainChildren: checked })} />
      </div>
      <div className={styles.right}>
        <AxisIcon height="16" fill={currentTab == 'axis' ? '#4a4a4a' : '#cccccc'} style={{ marginRight: '2px' }} onClick={() => {this.setState({ currentTab: 'axis' })}} />
        <TableIcon height="16" fill={currentTab == 'table' ? '#4a4a4a' : '#cccccc'} style={{ marginRight: '2px' }} onClick={() => {this.setState({ currentTab: 'table' })}} />
        <TemplateIcon height="16" fill={currentTab == 'template' ? '#4a4a4a' : '#cccccc'} onClick={() => {this.setState({ currentTab: 'template' })}} />
      </div>
    </div>)
  },
  renderContent(){
    const { currentTab } = this.state
    switch (currentTab){
      case 'axis':
        return <AxisViewContainer/>
      case 'table':
        return <TableViewContainer isContainChildren={this.state.isContainChildren} affair={this.props.affair}/>
      case 'template':
        return <TemplateViewContainer />
      default:
        return <AxisViewContainer />
    }
  },

  render(){
    return (<div className={styles.taskContainer}>
      {this.renderHeader()}
      {this.renderContent()}
    </div>)
  }
})

function mapStateToProps(state, props){
  return {
    affair: state.getIn(['affair', 'affairMap', props.params.id])
  }
}

function mapDispatchToProps(){
  return {}
}
export default connect(mapStateToProps, mapDispatchToProps)(TaskIndexContainer)
