import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Icon, Popover } from 'antd'
import styles from './AffairIndexContainer.scss'
import { ContentPanelHOC } from '../../enhancers/Content'
import AffairAvatar from '../../components/avatar/AffairAvatar'
import TaskDetailHeader from '../../containers/task/TaskDetailHeader'
import { getAffairInfo, changeAffairSetting } from '../../actions/affair'
import { fetchAffairPermission } from '../../actions/auth'
import { pushPermittedURL, pushLocalPermittedURL } from 'actions/route'
import { Cog, ShareIcon, MainRoleIcon } from 'svg'
import ShareAffair from './ShareAffair'
import { List, Map } from 'immutable'
import classNames from 'classnames'
import PERMISSION from 'utils/permission'

const LogoContainer = React.createClass({
  propTypes: {
    affair: PropTypes.object,
  },
  render() {
    if (!this.props.affair) return null
    return <AffairAvatar affair={this.props.affair} sideLength={54} />
  }
})

const INDEX_PERMISSION_MAP = {
  announcement: PERMISSION.ENTER_PUBLISH_STORE,
  role: PERMISSION.ENTER_ROLE_STORE,
  repo: [PERMISSION.ENTER_MEMBER_STORE, PERMISSION.ENTER_FUND_STORE, PERMISSION.ENTER_MATERIAL_STORE],
  chat: PERMISSION.ENTER_PUBLISH_STORE,
  task: PERMISSION.ENTER_PUBLISH_STORE,
  file: PERMISSION.ENTER_FILE_STORE,
  transaction: PERMISSION.ENTER_FUND_STORE,
  setting: PERMISSION.ENTER_AFFAIR_SETTING,
}

const NavigationContainer = connect((state, props) => ({
  showSettingPanel: state.getIn(['affair', 'affairSetting', 'isShow']),
  affair: state.getIn(['affair', 'affairMap', props.params.id]) || Map(),
}), (dispatch) => ({
  toggleSettingPanel: bindActionCreators(changeAffairSetting, dispatch),
  pushPermittedURL: bindActionCreators(pushPermittedURL, dispatch),
  pushLocalPermittedURL: bindActionCreators(pushLocalPermittedURL, dispatch),
}))(React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired,
  },
  propTypes: {
    affair: React.PropTypes.object,
  },

  getInitialState() {
    return {
      showShareAffairModal: false,
      activeTabElementStyle: {},
      currentTab: '',
    }
  },
  componentWillMount(){
    this.tabElements = {}
  },
  componentDidMount(){
    // to invoke componentDidUpdate func to render activeTab
    this.setState({})
  },
  componentDidUpdate(){
    const activeTabElementStyle = this.getActiveTabElementStyle()
    if (activeTabElementStyle.left != 0 && activeTabElementStyle.left != this.state.activeTabElementStyle.left) {
      this.setState({
        activeTabElementStyle
      })
    }
  },
  handleSwitchTab(path) {
    this.props.pushLocalPermittedURL(this.props.affair, `/workspace/affair/${this.props.routeParams.id}/${path}`)
  },
  getCurrentTab(){
    const firstTagPath = location.pathname.split('/')[4] || ''
    return firstTagPath
  },
  getActiveTabElementStyle(){
    const currentTab = this.getCurrentTab()
    if (currentTab == 'setting') {
      return {
        display: 'none',
      }
    } else {
      const target = this.tabElements[currentTab == '' ? 'homepage' : currentTab]
      /* 如果当前获取不到元素，则需要等到元素加载完成后再获取，因此使用一个刷新来轮询 */
      if (target == null) {
        setTimeout(() => this.setState({}), 100)
        return {
          display: 'none'
        }
      } else {
        return {
          width: target.clientWidth + 16,
          left: target.offsetLeft - 16,
          display: 'block'
        }
      }
    }
  },
  renderRoleSelectorItem(role, affair) {
    return (
      <div
        key={role.get('roleId')}
        className={classNames(styles.roleSelectorItem, role.get('roleId') === affair.get('roleId') ? styles.activeRoleSelectorItem : null )}
        onClick={() => {
          if (role.get('roleId') !== affair.get('roleId')) {
            this.props.pushPermittedURL(affair.get('id'), role.get('roleId'), location.pathname, 'role').then(() => {
              this.setState({
                roleSelectorPopoverVisible: false,
              })
            })
          }
        }}
      >
        {`${role.get('affairName')}－${role.get('roleName')}`}
        {role.get('roleId') == this.props.user.get('personalRoleId') &&
          <MainRoleIcon />
        }
      </div>
    )
  },
  renderRoleSelector(rolelist, affair) {
    const currentRole = rolelist.find((v) => v.get('roleId') == affair.get('roleId'))
    const inAffairRoleList = rolelist.filter((v) => v.get('allianceId') === affair.get('allianceId') && v.get('affairName') === affair.get('name'))
    const outAffairRoleList = rolelist.filter((v) => v.get('allianceId') !== affair.get('allianceId') || v.get('affairName') !== affair.get('name'))
    const content = (
      <div className={styles.selectorContent} key="renderRoleSelector">
        <p>当前事务：</p>
        {inAffairRoleList.map((role) => this.renderRoleSelectorItem(role, affair))}
        {
          outAffairRoleList.size ? (
            <p>其他事务：</p>
          ) : null
        }
        {outAffairRoleList.map((role) => this.renderRoleSelectorItem(role, affair))}
      </div>
    )

    return (
      <Popover
        key="myrole"
        placement="bottom"
        content={content}
        visible={!!this.state.roleSelectorPopoverVisible}
        trigger="click"
        overlayClassName={styles.roleSelectorPopover}
        onVisibleChange={(visible) => this.setState({ roleSelectorPopoverVisible: visible })}
      >
        <div className={styles.position}>
          <span>我的角色：</span>
          {currentRole ? <span style={{ color: '#4a4a4a' }}>{currentRole.get('roleName')}</span> : <span style={{ color: '#4a4a4a' }}>无</span>}
          <Icon type="caret-down" style={{ color: '#ccc', fontSize: 8, marginLeft: 5 }} />
        </div>
      </Popover>
    )
  },
  // Render
  render() {
    // 任务详情中特殊的导航栏
    if (this.props.params.taskId) {
      return <TaskDetailHeader {...this.props}/>
    }

    const { affair, affairList } = this.props
    const currentTab = this.getCurrentTab()

    /* 在fetch成功之前affair为null，这时候显示空的navbar */
    if (affair.isEmpty() || (affairList || List()).size == 0) {
      return <div className={styles.navigation} />
    }

    const rolelist = this.props.user.get('roles').sort((role, nextRole) => {
      const affairNameCompare = role.get('affairName').localeCompare(nextRole.get('affairName'), 'zh')
      return affairNameCompare == 0 ? role.get('roleName').localeCompare(nextRole.get('roleName'), 'zh') : affairNameCompare
    })

    return (
      <div className={styles.navigation}>
        {/* 分享事务的弹窗 */}
        { this.state.showShareAffairModal && affair ? <ShareAffair onClose={() => this.setState({ showShareAffairModal: false })} affair={affair} /> : null }

        {/* 事务名称 */}
        <p>
          { affair ? affair.get('name') : '' }
          { affair && affair.validatePermissions(PERMISSION.SHARE_AFFAIR) &&
            <span onClick={() => this.setState({ showShareAffairModal: true })}><ShareIcon /></span>
          }
        </p>

        {/* 事务设置 */}
        <div className={styles.rightPanel}>
          {/* 事务内容导航 */}
          <div className={styles.affairTab}>
            <div
              className={styles.activeAffairTabBar}
              style={this.state.activeTabElementStyle}
            />

            <div
              key="homepage"
              className={(currentTab || '') === '' ? styles.activeAffairTab : ''}
              onClick={this.handleSwitchTab.bind(this, '')}
              ref={(el) => this.tabElements = { ...this.tabElements, homepage: el }}
            >
              首页
            </div>
            {affair.validatePermissions(INDEX_PERMISSION_MAP.announcement) &&
              <div
                key="announcement"
                className={currentTab === 'announcement' ? styles.activeAffairTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'announcement')}
                ref={(el) => this.tabElements = { ...this.tabElements, announcement: el }}
              >
                发布
              </div>
            }
            {affair.validatePermissions(INDEX_PERMISSION_MAP.role) &&
              <div
                key="role"
                className={currentTab === 'role' ? styles.activeAffairTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'role')}
                ref={(el) => this.tabElements = { ...this.tabElements, role: el }}
              >
                角色
              </div>
            }
            {affair.validateSomePermissions(...INDEX_PERMISSION_MAP.repo) &&
              <div
                key="repo"
                className={currentTab === 'repo' ? styles.activeAffairTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'repo')}
                ref={(el) => this.tabElements = { ...this.tabElements, repo: el }}
              >
                库
              </div>
            }
            {affair.validatePermissions(INDEX_PERMISSION_MAP.chat) &&
              <div
                key="chat"
                className={currentTab === 'chat' ? styles.activeAffairTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'chat')}
                ref={(el) => this.tabElements = { ...this.tabElements, chat: el }}
              >
                会话
              </div>
            }
            {affair.validatePermissions(INDEX_PERMISSION_MAP.task) &&
              <div
                key="task"
                className={currentTab === 'task' ? styles.activeAffairTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'task')}
                ref={(el) => this.tabElements = { ...this.tabElements, task: el }}
              >
                任务
              </div>
            }
            {affair.validatePermissions(INDEX_PERMISSION_MAP.file) &&
              <div
                key="file"
                className={currentTab === 'file' ? styles.activeAffairTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'file')}
                ref={(el) => this.tabElements = { ...this.tabElements, file: el }}
              >
                文件
              </div>
            }
            {affair.validatePermissions(INDEX_PERMISSION_MAP.transaction) &&
              <div
                key="transaction"
                className={currentTab === 'transaction' ? styles.activeAffairTab : ''}
                onClick={this.handleSwitchTab.bind(this, 'transaction')}
                ref={(el) => this.tabElements = { ...this.tabElements, transaction: el }}
              >
                交易
              </div>
            }
          </div>

          {affair.validatePermissions(INDEX_PERMISSION_MAP.setting) ? [
            <div key="split1" className={styles.splitLine} />,
            this.renderRoleSelector(rolelist, affair),
            <div key="split2" className={styles.splitLine} style={{ marginRight: 0 }} />,
            <div key="setting" className={styles.setting} onClick={this.handleSwitchTab.bind(this, 'setting', null)}>
              <Cog isActive={currentTab === 'setting'} />
            </div>,
          ] : [
            <div key="split1" className={styles.splitLine} />,
            this.renderRoleSelector(rolelist, affair),
            <div key="blank" style={{ width: 10 }} />
          ]}
        </div>
      </div>
    )
  }
}))

const IndexContainer = connect(() => ({}), () => ({}))(React.createClass({
  render() {
    const { affair } = this.props
    if (!affair) return null

    return (
      <div className={styles.indexContainer}>
        {this.props.children}
      </div>
    )
  }
}))

function mapStateToProps(state, props) {
  return {
    affair: state.getIn(['affair', 'affairMap', props.params.id]),
    affairList: state.getIn(['affair', 'affairList']),
    currentPanelIndex: state.getIn(['affair', 'affairSetting', 'tab']),
    user: state.get('user'),
    affairMap: state.getIn(['affair', 'affairMap']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getAffairInfo: bindActionCreators(getAffairInfo, dispatch),
    changeAffairSetting: bindActionCreators(changeAffairSetting, dispatch),
    fetchAffairPermission: bindActionCreators(fetchAffairPermission, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ContentPanelHOC(LogoContainer, NavigationContainer, IndexContainer, 'AffairIndexContainer'))
