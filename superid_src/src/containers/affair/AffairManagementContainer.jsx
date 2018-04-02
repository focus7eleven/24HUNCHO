import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import classNames from 'classnames'
import { Rate } from 'antd'
import moment from 'moment'
import { DropDownIcon, DropUpIcon, LoadingIcon } from 'svg'
import styles from './AffairManagementContainer.scss'
import config from '../../config'
import { relativeTime } from '../../utils/time'
import {
  SearchIcon,
  CrownIcon,
  SprigIcon,
  MoreIcon,
} from 'svg'
import { List, Set, Map } from 'immutable'
import TimerMixin from 'react-timer-mixin'
import { TransitionMotion, spring } from 'react-motion'
import { Tree, Dropdown, Menu } from 'antd'
import { BadgeComponent } from '../../components/badge/Badge'
import AffairAvatar from '../../components/avatar/AffairAvatar'
import { readTrend, toggleStick, modifyAffairInfo, fetchFollowedAffairList } from '../../actions/affair'
import { setHomepage } from '../../actions/user'
import { pushPermittedURL } from 'actions/route'
import { fetchMoreDynamic, updateNotificationList, READ_STATE, MSG_TYPE } from 'actions/notification'
import NoticeModal from 'containers/notice/NoticeModal'
import AffairDisplayTree from './AffairDisplayTree'
const TreeNode = Tree.TreeNode

// Tab constants
const MY_TASK = 0
const MY_AFFAIR = 1
const MY_FOLLOW = 2
const AFFAIR_TREE_TAB = 3
const NOTIFICATION_NAMES = ['全部', '通知', '邀请', '物资', '资金', '审批']

const AffairManagementComponent = React.createClass({
  propTypes: {
    className: React.PropTypes.string,
    location: React.PropTypes.object.isRequired,
  },
  mixins: [TimerMixin],
  componentWillMount(){
    this.props.fetchFollowedAffairList()
  },
  componentWillReceiveProps(nextProps){
    const nextPathname = nextProps.location.pathname.split('/')[3]
    if (nextPathname != this.state.activeAffairId && nextPathname != null) {
      this.setState({ activeAffairId: nextPathname })
    }
  },
  getInitialState() {
    return {
      currentTab: MY_AFFAIR,
      currentOpenAlliance: Set(), // 事务树中展开的盟
      currentOpenAffair: Set(), // 事务列表中展开的事务
      isFolded: false, // 已加入事务是否折叠，默认不折叠
      searchKeyword: '',
      activeAffairId: null,
    }
  },

  // Getter
  getAffairList(props) {
    let affairList = (props || this.props).affairList || List()
    const user = (props || this.props).user

    // 优先级: 主页事务 > 有新动态的事务 > 用户手动置顶的事务 > 事务的默认排序 来进行排序。
    affairList = affairList.sort((a, b) => {
      // 主页事务在顶端
      if (a.get('affairId') == user.get('homepageAffairId')) return -1
      if (b.get('affairId') == user.get('homepageAffairId')) return 1

      // 个人事务只会落后于主页事务。
      const isPersonal = (b.get('isPersonal') && b.get('level') == 1) - (a.get('isPersonal') && a.get('level') == 1)
      if (isPersonal) {
        return isPersonal
      }

      // 是否是新动态事务
      const aHasNews = a.has('trends') && a.get('trends').some((trend) => !trend.read)
      const bHasNews = b.has('trends') && b.get('trends').some((trend) => !trend.read)
      if (aHasNews && !bHasNews) {
        return -1
      } else if (!aHasNews && bHasNews) {
        return 1
      } else {
        // 是否是用户手动置顶
        if (a.get('isStuck') && !b.get('isStuck')) {
          return -1
        } else if (!a.get('isStuck') && b.get('isStuck')) {
          return 1
        } else {
          // 事务的修改时间与默认排序
          return b.get('time') - a.get('time')
        }
      }
    })

    return affairList
  },
  getTreeNodes(affair, key) {
    return (
      <TreeNode title={affair.get('name')} key={key}>
        {
          affair.get('children', List()).map((child, index) => this.getTreeNodes(child, `${key}-${index}`)).toArray()
        }
      </TreeNode>
    )
  },
  getAffairListMotionStyles(affairList) {
    const styles = []
    let baseTop = 0

    return affairList.reduce((reduction, affair) => {
      let height
      const affairId = affair.get('affairId')
      const trendsExpand = this.state.currentOpenAffair.has(affair.get('affairId'))

      // 高度由基础高度与展开的动态列表高度组成
      height = (affair.get('visibleTrends') || List()).size * 28 + 70
      height = (affair.get('hasMoreTrends') && trendsExpand) ? height + 23 : height
      styles.push({
        style: {
          offsetY: spring(0),
          opacity: spring(1),
          top: spring(baseTop),
          height: spring(height),
        },
        key: String(affairId),
        data: affair,
      })

      baseTop += height

      return styles
    }, styles)
  },
  getAffairDynamicList(affair) {
    const { notifications, user } = this.props
    const roleList = user.get('roles')
    const affairId = affair.get('affairId')
    const affairRoleIdList = roleList.filter((role) => role.get('affairId') == affairId).map((role) => role.get('roleId'))
    const affairDynamicList = notifications
      .filter((v, k) => affairRoleIdList.some((id) => id == k))
      .map((peer) => peer.get('receive'))
      .toList()
      .flatten(1)
      .filter((notice) => notice.get('dynamicShow') || false)
      .filter((notice) => notice.get('msgType') != MSG_TYPE.NOTICE)
    // const affairNewsCount = notifications
    //   .get('news')
    //   .filter((v, k) => affairRoleIdList.some((id) => id == k))
    //   .toList()
    //   .map((news) => news.get('receive'))
    //   .reduce((a, b) => a + b, 0)
    return affairDynamicList || List()
  },
  getVisibleDynamicList(affair, affairDynamicList) {
    if (affairDynamicList.size == 0) return affairDynamicList
    /* 规则： 没有未读，则展开、收起均显示已读, 否则展开显示已读， 收起只显示未读， 收起最多显示10条 */
    const trendsExpand = this.state.currentOpenAffair.has(affair.get('affairId'))
    if (trendsExpand) return affairDynamicList.sort((a, b) => {
      if (b.get('readState') != a.get('readState')) {
        return b.get('readState') - a.get('readState')
      }
      return b.get('sendTime') - a.get('sendTime')
    })

    const unreadTrends = affairDynamicList.filter((v) => v.get('readState') === READ_STATE.UNREAD)
    const readTrends = affairDynamicList.filter((v) => v.get('readState') !== READ_STATE.UNREAD)
    if (unreadTrends.size > 0) return unreadTrends.take(10)

    return readTrends.take(10)
  },
  getDynamicListExpandable(affairDynamicList) {
    if (affairDynamicList.some((v) => v.get('readState') === READ_STATE.UNREAD)
    && affairDynamicList.some((v) => v.get('readState') !== READ_STATE.UNREAD)) {
      return true
    }
    if (affairDynamicList.size > 10) {
      return true
    }
    return false
  },
  handleReadOne(item){
    const roleId = item.get('receiverRoleId')
    const mode = 'receive'
    // 如果消息被点击过，则不再调用标记为已读的接口
    if (item.get('readFlush') || item.get('readState') == READ_STATE.READ) {
      return
    }
    const messageId = item.get('noticeId')
    const senderRoleId = item.get('senderRoleId')

    let url = config.api.message.receiverReadOne(messageId, senderRoleId)
    let header = {
      method: 'POST',
      json: true,
      credentials: 'include',
    }
    if (item.get('msgType') == MSG_TYPE.AUDIT) {
      url = config.api.message.readOne(messageId)
    }
    fetch(url, header)
      .then((res) => (res.json()))
      .then((json) => {
        if (json.code == 0) {
          item = item
            .set('readFlush', true)
            .set('readState', READ_STATE.READ)
          this.props.updateNotificationList(roleId, mode, [item])
        }
      })
  },
  handleLoadMoreTrend(affair) {
    const { user } = this.props
    const visibleTrends = affair.get('visibleTrends') || List()
    const unreadEarliestTime = (
      visibleTrends
        .filter((v) => v.get('readState') == READ_STATE.UNREAD)
        .sort((a, b) => b.get('sendTime') - a.get('sendTime'))
        .last() || Map()
    ).get('sendTime') || 0
    const readEarliestTime = (
      visibleTrends
        .filter((v) => v.get('readState') != READ_STATE.UNREAD)
        .sort((a, b) => b.get('sendTime') - a.get('sendTime'))
        .last() || Map()
    ).get('sendTime') || 0
    this.props.fetchMoreDynamic(user.get('id'), affair.get('affairId'), readEarliestTime ? 0 : unreadEarliestTime, readEarliestTime)
  },
  handleSwitchAffair(affairId) {
    this.setState({ activeAffairId: affairId })
    let pathname
    if (this.props.location.pathname.indexOf('board') > 0){
      pathname = `/workspace/affair/${affairId}`
    }
    else {
      pathname = this.props.location.pathname.replace(/workspace\/affair\/\d*/, `workspace/affair/${affairId}`)
    }
    this.props.pushPermittedURL(affairId, 0, pathname, 'affair')
  },
  handleSetHompage(affair) {
    fetch(config.api.affair.homepage(), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('affairId'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.data) {
        this.props.setHomepage(affair)
      }
    })
  },
  handleToggleAffairStuck(affair) {
    fetch(config.api.affair.stick(affair.get('allianceId'), !affair.get('isStuck')), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('affairId'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.data) {
        this.props.toggleStick(affair)
      }
    })
  },
  // 折叠已加入事务列表
  handleFoldJoinedAffair(){
    this.setState({ isFolded: true })
  },
  // 展开浏览过的事务列表
  handleExpandJoinedAffair(){
    this.setState({ isFolded: false })
  },
  onSearch(searchKeyword) {
    this.setState({ searchKeyword })
  },
  // Render
  renderTab() {
    const currentTab = this.state.currentTab
    const tabPadding = 20

    return (
      <div className={styles.tab}>
        <div
          className={classNames(styles.tabItem, currentTab === MY_TASK ? styles['tabItem-active'] : '')}
          onClick={() => {this.setState({ currentTab: MY_TASK })}}
        >
          <p>我的任务</p>
        </div>
        <div
          className={classNames(styles.tabItem, currentTab === MY_AFFAIR ? styles['tabItem-active'] : '')}
          onClick={() => {this.setState({ currentTab: MY_AFFAIR })}}
        >
          <p>加入事务</p>
        </div>
        <div
          className={classNames(styles.tabItem, currentTab === MY_FOLLOW ? styles['tabItem-active'] : '')}
          onClick={() => {
            this.setState({ currentTab: MY_FOLLOW })
            this.props.fetchFollowedAffairList()
          }}
        >
          <p>关注事务</p>
        </div>
        <div
          className={classNames(styles.tabItem, currentTab === AFFAIR_TREE_TAB ? styles['tabItem-active'] : '')}
          onClick={() => {this.setState({ currentTab: AFFAIR_TREE_TAB })}}
        >
          <p>事务树</p>
        </div>
        <span style={{ left: `calc(${currentTab * 25}% + ${tabPadding / 2}px)` }} className={styles.activeBar} />
      </div>
    )
  },
  renderSearch() {
    return (
      <div key="search" className={styles.search}>
        <SearchIcon />
        <input type="text" placeholder="搜索事务" value={this.state.searchKeyword} onChange={(e) => this.onSearch(e.target.value)} />
      </div>
    )
  },
  renderTrend(trend, key) {
    const unread = trend.get('readState') != READ_STATE.READ

    return (
      <div
        key={key}
        className={styles.trend}
        style={{ color: unread ? '#666666' : '#9b9b9b' }}
        onClick={() => {
          unread && this.handleReadOne(trend)
          this.setState({ handleMessage: trend })
        }}
      >
        <span style={{ opacity: unread ? 1 : 0 }} />
        <div style={{ fontWeight: unread ? 'bold' : 'normal' }}>{`${NOTIFICATION_NAMES[trend.get('msgType')]}：`}</div>
        <div className={styles.ellipsis} title={trend.get('content')}>{trend.get('content')}</div>
      </div>
    )
  },
  renderTrendList(affair) {
    const trends = affair.get('visibleTrends') || List()
    const hasMoreTrends = affair.get('hasMoreTrends') || false
    const isLoadingTrends = affair.get('isLoadingTrends') || false
    const trendsExpand = this.state.currentOpenAffair.has(affair.get('affairId'))

    return (
      <div className={styles.trendsList}>
        {trends.map((trend, key) => this.renderTrend(trend, key))}
        {(hasMoreTrends && trendsExpand) && (
          !isLoadingTrends ?
            <div className={styles.load} onClick={() => this.handleLoadMoreTrend(affair)}>加载更多</div>
          : (
            <div className={styles.load}><LoadingIcon />加载更多</div>
          )
        )}
      </div>
    )
  },
  renderMenu(affair, index, isStuck) {
    const isHomePage = affair.get('affairId') == this.props.user.get('homepageAffairId')
    return (
      <Menu
        onClick={({ key }) => {
          if (key == 'homepage') {
            this.handleSetHompage(affair)
          } else {
            this.handleToggleAffairStuck(affair)
          }
        }}
      >
        <Menu.Item disabled={isHomePage} key="homepage">
          <div data-index={index}>设为首页</div>
        </Menu.Item>
        <Menu.Item disabled={isHomePage} key="top">
          <div data-index={index}>{isStuck ? '取消置顶' : '置顶'}</div>
        </Menu.Item>
      </Menu>
    )
  },

  renderContent() {
    const { notifications } = this.props
    const { searchKeyword, currentTab } = this.state
    const joinedAffairIdList = this.props.affairList.map((affair) => affair.get('affairId'))
    // type : 1. joinedAffair 2. viewedAffair
    let affairList = currentTab === MY_AFFAIR ?
      this.getAffairList()
    :
      this.props.followedAffairList.filter((affair) => !(joinedAffairIdList.includes(affair.get('affairId'))))
    if (searchKeyword != '') {
      affairList = affairList.filter((affair) => (affair.get('affairName').includes(searchKeyword)))
    }
    affairList = affairList.map((affair) => {
      const affairDynamicList = this.getAffairDynamicList(affair)
      return affair
        .set('visibleTrends', this.getVisibleDynamicList(affair, affairDynamicList))
        .set('trends', affairDynamicList)
        .set('hasMoreTrends', notifications.getIn(['affairHasMoreMap', affair.get('affairId') + '']) || false)
        .set('isLoadingTrends', notifications.getIn(['affairLoadingMap', affair.get('affairId') + '']) || false)
    })
    const motionStyles = this.getAffairListMotionStyles(affairList)
    const activeAffairId = this.state.activeAffairId ? this.state.activeAffairId : window.location.pathname.split('/').length > 3 ? window.location.pathname.split('/')[3] : ''
    switch (currentTab) {
      case MY_FOLLOW:
      case MY_AFFAIR:
        if (!affairList.size) return null

        return (
          <TransitionMotion
            key="content"
            styles={motionStyles}
            willEnter = {
              (configThatEntered) => {
                return {
                  top: configThatEntered.style.top.val,
                  offsetY: configThatEntered.style.top.val * 0.4,
                  opacity: 0,
                  height: configThatEntered.style.height.val,
                  hover: 0,
                }
              }
            }
            willLeave = {() => ({ offsetY: 0, opacity: spring(0), height: spring(0) })}
          >
            {(interpolatedStyles) => {
              return (
                <div key="content" className={styles.content}>
                  {interpolatedStyles.map((config, index) => {

                    const itemStyle = {
                      opacity: config.style.opacity,
                      top: config.style.top + config.style.offsetY,
                      position: 'absolute',
                      left: 0,
                      height: config.style.height,
                      backgroundColor: `rgba(250, 250, 250, ${config.style.hover})`,
                    }
                    const hasIconStyle = { maxWidth: 'calc(100% - 80px)' }
                    const noIconStyle = { maxWidth: 'calc(100% - 60px)' }

                    const affair = config.data
                    const isRoot = affair.get('level') === 1
                    const isHomepage = affair.get('affairId') == this.props.user.get('homepageAffairId')
                    const trends = affair.get('visibleTrends')
                    const trendsExpandable = this.getDynamicListExpandable(affair.get('trends'))
                    const trendsExpand = this.state.currentOpenAffair.has(affair.get('affairId'))

                    return (
                      <div
                        className={activeAffairId == affair.get('affairId') ? `${styles.affairItemWrapper} ${styles.active}` : styles.affairItemWrapper}
                        style={itemStyle}
                        key={affair.get('affairId') + '0'}
                      >
                        <div
                          className={styles.affairItem}
                          data-affairid={affair.get('affairId')}
                          data-index={config.key}
                          onClick={() => {
                            this.handleSwitchAffair(affair.get('affairId'))
                          }}
                        >
                          {
                            trends ?
                              <BadgeComponent maxCount={9} count={trends.filter((v) => v.get('readState') === 2).size}>
                                <AffairAvatar affair={affair} sideLength={30} />
                              </BadgeComponent>
                            : <AffairAvatar affair={affair} sideLength={30} />
                          }

                          <div className={styles.affairContent}>
                            <div className={styles.title}>
                              <div className={styles.nameContainer} style={(isHomepage || affair.get('isStuck')) ? hasIconStyle : noIconStyle}>
                                <div className={styles.affairName}>
                                  {
                                    searchKeyword == '' ?
                                      affair.get('affairName')
                                    : (
                                      <span>
                                        {affair.get('affairName').split(searchKeyword)[0]}
                                        <span style={{ color: '#926dea', fontWeight: '500' }}>{searchKeyword}</span>
                                        {affair.get('affairName').split(searchKeyword)[1]}
                                      </span>
                                    )}
                                </div>

                                {/* 事务的所属盟 */}
                                {!isRoot ? <div className={styles.affairRoot}>{affair.get('rootName')}</div> : null}
                              </div>
                              {/* 主页事务标志 */}
                              {isHomepage ? <CrownIcon /> : null}
                              {/* 是否被置顶 */}
                              {affair.get('isStuck') && !isHomepage ? <div className={styles.sprig}><SprigIcon /></div> : null}

                              <div className={styles.affairTimestamp}>{relativeTime(affair.get('time'))}</div>
                            </div>

                            {this.renderTrendList(affair)}
                          </div>

                          {currentTab != MY_FOLLOW &&
                            <div className={styles.tool}>
                              <Dropdown
                                placement="bottomCenter"
                                overlay={this.renderMenu(affair, index, affair.get('isStuck'))}
                                trigger={['click']}
                                onClick={(e) => {e.stopPropagation()}}
                              >
                                <span className={styles.more}><MoreIcon /></span>
                              </Dropdown>

                              {/* 展开与关闭事务动态的按钮 */}
                              {
                                trendsExpandable ? (
                                  !trendsExpand ? (
                                    <DropDownIcon
                                      style={{
                                        marginTop: 'auto',
                                        position: 'relative',
                                        fill: '#ccc',
                                        right: 3
                                      }}
                                      onClick={(evt) => {
                                        evt.preventDefault()
                                        evt.stopPropagation()
                                        this.setState({
                                          currentOpenAffair: this.state.currentOpenAffair.add(affair.get('affairId')),
                                        })
                                      }}
                                    />
                                  ) : (
                                    <DropUpIcon
                                      style={{ marginTop: 'auto', position: 'relative', fill: '#ccc', right: 3 }}
                                      onClick={(evt) => {
                                        evt.preventDefault()
                                        evt.stopPropagation()
                                        this.setState({
                                          currentOpenAffair: this.state.currentOpenAffair.delete(affair.get('affairId')),
                                        })
                                      }}
                                    />
                                  )
                                ) : null
                              }
                            </div>
                          }
                        </div>
                      </div>

                    )
                  })}
                </div>
              )
            }
          }
          </TransitionMotion>
        )
      case AFFAIR_TREE_TAB:
        return (
          <div key="content" className={styles.content} style={{ maxHeight: '100%', height: '100%' }}>
            <AffairDisplayTree activeAffairId={activeAffairId}/>
          </div>
        )
      default:
        return null
    }
  },
  renderMyTasks() {
    return (
      <div className={styles.myTasks}>
        {this.props.affairTaskList
          .concat(this.props.affairTaskList)
          .concat(this.props.affairTaskList)
          .concat(this.props.affairTaskList)
          .concat(this.props.affairTaskList)
          .map((task, key) => {
            return (
              <div className={styles.taskListItem} key={key}>
                {/* 任务名称与评分 */}
                <div className={styles.firstRow}>
                  <div>
                    <span />
                    {task.get('name')}
                  </div>
                  <Rate disabled count={3} value={task.get('rate')} />
                </div>

                {/* 截止时间与来源 */}
                <div className={styles.secondRow}>
                  <p>{`截止时间：${task.get('endTime') ? moment(task.get('endTime')).format('YY/MM/DD h:mm') : '无'}`}</p>
                  <p>{`来自：${task.get('from')}`}</p>
                </div>
              </div>
            )
          })
        }
      </div>
    )
  },
  render() {
    const {
      className
    } = this.props
    return (
      <div className={classNames(styles.container, className)} ref={(el) => this.container = el}>
        { this.renderTab() }

        {/* 我的任务 */}
        { this.state.currentTab === MY_TASK && this.renderMyTasks() }

        {/* 加入事务  */}
        {[
          (this.state.currentTab === MY_AFFAIR || this.state.currentTab === MY_FOLLOW) ? this.renderSearch() : null,
          this.renderContent()
        ]}
        {this.state.handleMessage &&
          <NoticeModal message={this.state.handleMessage} onHide={() => this.setState({ handleMessage: false })} />
        }
      </div>
    )
  },
})

function mapStateToProps(state) {
  return {
    affairList: state.getIn(['affair', 'affairList'], List()),
    followedAffairList: state.getIn(['affair', 'followedAffairList'], List()),
    affairHistoryList: state.getIn(['affair', 'affairHistoryList'], List()),
    allianceMap: state.getIn(['alliance', 'allianceMap']),
    affairTaskList: state.getIn(['affair', 'affairTaskList'], List()),
    user: state.get('user'),
    notifications: state.get('notifications'),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    readTrend: bindActionCreators(readTrend, dispatch),
    toggleStick: bindActionCreators(toggleStick, dispatch),
    setHomepage: bindActionCreators(setHomepage, dispatch),
    modifyAffairInfo: bindActionCreators(modifyAffairInfo, dispatch),
    fetchFollowedAffairList: bindActionCreators(fetchFollowedAffairList, dispatch),
    fetchMoreDynamic: bindActionCreators(fetchMoreDynamic, dispatch),
    updateNotificationList: bindActionCreators(updateNotificationList, dispatch),
    pushPermittedURL: bindActionCreators(pushPermittedURL, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AffairManagementComponent)
