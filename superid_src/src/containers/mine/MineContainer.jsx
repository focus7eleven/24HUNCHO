import React from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fetchUserRoleList } from '../../actions/user'
import { Icon, Tooltip } from 'antd'
import styles from './MineContainer.scss'
import MineTaskTable from './MineTaskTable'

const TAB_LIST = ['工作', '日程', '文件']

class MineComponent extends React.Component {
  state = {
    filterRoleId: null,
    currentTab: TAB_LIST[0],
    filterWorkRelation: [0, 1, 2],
  }

  componentDidMount() {
    this.props.fetchUserRoleList()
  }

  renderFilterItem(role) {
    if (!role) {
      return (
        <div
          className={classNames(styles.filterItem, !this.state.filterRoleId ? styles.activeFilterItem : null)}
          onClick={() => this.setState({ filterRoleId: null })}
        >
          所有角色
        </div>
      )
    } else {
      return (
        <div
          className={classNames(styles.filterItem, this.state.filterRoleId === role.get('roleId') ? styles.activeFilterItem : null)}
          onClick={() => this.setState({ filterRoleId: role.get('roleId') })}
          key={role.get('roleId')}
        >
          <Tooltip title={`${role.get('affairName')}－${role.get('roleName')}`} placement="right">
            <div className={styles.text}>{`${role.get('affairName')}－${role.get('roleName')}`}</div>
          </Tooltip>

        </div>
      )
    }
  }
  renderLeftPanel() {
    return (
      <div className={styles.leftPanel}>
        <div className={styles.label}>我的</div>

        {this.renderFilterItem()}

        {this.props.roles.map((role) => {
          return (
            this.renderFilterItem(role)
          )
        })}
      </div>
    )
  }
  renderContentTab() {
    return (
      <div className={styles.tabList}>
        {
          TAB_LIST.map((tab) => {
            return (
              <div
                className={classNames(styles.tabItem, this.state.currentTab === tab ? styles.activeTabItem : null)}
                key={tab}
              >
                {tab}
              </div>
            )
          })
        }
      </div>
    )
  }
  renderCloseButton() {
    return (
      <Icon type="close" onClick={() => {this.props.onCancel()}} className={styles.closeButton} />
    )
  }
  render() {
    return (
      <div className={styles.container}>
        {this.renderLeftPanel()}

        <div className={styles.rightPanel}>
          {this.renderContentTab()}
          {this.renderCloseButton()}

          <MineTaskTable
            filterRoleId={this.state.filterRoleId}
            roles={this.props.roles}
          />
        </div>
      </div>
    )
  }
}

const MineContainer = connect((state) => {
  return {
    roles: state.getIn(['user', 'roles']),
  }
}, (dispatch) => {
  return {
    fetchUserRoleList: bindActionCreators(fetchUserRoleList, dispatch),
  }
})(MineComponent)

export default MineContainer
