import React from 'react'
import { List } from 'immutable'
import styles from './RoleSelect.scss'
import ArrowDropDown from 'svg'

const RoleSelect = React.createClass({
  getDefaultProps(){
    return {
      selectedRoleList: List(),
      roleList: List(),
      searchPlaceholder: '搜索盟内成员、角色',
    }
  },
  getInitialState(){
    return {
      showSelectPane: false,
    }
  },
  renderSelectPane(){
    //const { roleList, selectedRoleList } = this.props
    const { showSelectPane } = this.state
    if (showSelectPane) {
      return (
        <div />
      )
    }
    return null
  },
  render(){
    const { selectedRoleList } = this.props
    const { showSelectPane } = this.state
    const iconStyle = {
      transform: `rotate(${showSelectPane ? '180deg' : '0'})`
    }
    return (
      <div>
        <div className={styles.select} onClick={() => this.setState({ showSelectPane: !showSelectPane })}>
          <div className={styles.text}>
            {selectedRoleList.map((role) => (role.get('name'))).join('、')}
          </div>
          <div className={styles.icon} style={iconStyle}><ArrowDropDown /></div>
        </div>
        <div className={styles.selectPaneWrapper}>
          {this.renderSelectPane()}
        </div>
      </div>
    )
  },
})

export default RoleSelect
