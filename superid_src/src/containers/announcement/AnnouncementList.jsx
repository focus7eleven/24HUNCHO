import React, { PropTypes } from 'react'
import { findAffairInTree } from '../../reducer/affair'
import { connect } from 'react-redux'
import { fromJS, List, Map } from 'immutable'
import config from '../../config'
import AnnouncementItem from './AnnouncementItem'
import styles from './AnnouncementList.scss'
import AffairAvatar from '../../components/avatar/AffairAvatar'
import imageNoRelease from 'images/img_no_release.png'
import { DropDownIcon, LoadingIcon } from '../../public/svg'
import _ from 'underscore'
import messageHandler from 'messageHandler'

const LOAD_MORE_COUNT = 15 //加载更多加载的条数
const DEFAULT_COUNT = 10 //不包含子事务时,默认展开的发布条数
const SEARCHING_PAGE_SIZE = 2//搜索时每页发布条数
// const SUB_DEFAULT_COUNT = 10 //包含子事务时,默认展开的发布条数
const AnnouncementListItem = (props) => (
  <div className={styles.announcementBox} style={{ marginTop: 20, marginBottom: 20 }}>
    <div style={props.hideBottomBorder ? { borderColor: '#ffffff' } : { paddingBottom: 20 }}>
      <AnnouncementItem
        announcement={props.value}
        hideFromLabel={props.hideFromLabel}
        affair={props.affair}
        onUpdate={props.onUpdate}
        affairMemberId={props.affairMemberId}
      />
    </div>
  </div>
)
const AnnouncementList = React.createClass({
  _queriedAnnouncementsList: List(),
  PropTypes: {
    affair: PropTypes.object.isRequired,
    isContainChildren: PropTypes.bool,
    endTime: PropTypes.number,
    beginTime: PropTypes.number,
    sortType: PropTypes.string, //排序方式
    queryString: PropTypes.string, //查询关键字
  },
  getDefaultProps() {
    return {
      isContainChildren: false, //是否包含子事务
      sortType: 'affair', //包含子事务时排序方式,'affair'按事务排序,'time'按时间排序
      queryString: null,
      beginTime: null,
      endTime: null,
    }
  },
  getInitialState() {
    return {
      announcementMap: Map(),
      isExpanded: List(), // 展开的子事务id
      isLoaded: [], //已经获取过的子事务id
      affairTree: null,
      searchingPage: 0,
    }
  },
  componentDidMount() {
    this.fetchQueriedAnnouncementsList = _.debounce(this.fetchQueriedAnnouncementsList, 300)
    this.fetchAnnouncement(this.props)
  },
  componentWillReceiveProps(nextProps) {
    // if (
    //   this.props.affair.get('id') !== nextProps.affair.get('id')
    //   || this.props.beginTime !== nextProps.beginTime
    //   || this.props.endTime !== nextProps.endTime
    //   || this.props.isContainChildren !== nextProps.isContainChildren
    //   || this.props.queryString !== nextProps.queryString
    //   || this.props.sortType !== nextProps.sortType
    // ) {
    this.fetchAnnouncement(nextProps)
    this.setState({
      searchingPage: 0,
    })
  //  }
  },

  // 获取当前显示发布的内容。
  fetchAnnouncement(props) {
    if (props.isSearching) {
      this.fetchQueriedAnnouncementsList(props.affair, props.queryString, props.isContainChildren, props.beginTime, props.endTime)
    } else if (props.sortType === 'affair' && props.isContainChildren) {
      this.fetchAnnouncementWithChildren(props)
    } else {
      this.fetchAnnouncementList(props.affair, props.isContainChildren, props.state)
    }
  },
  fetchAnnouncementList(affair, isContainChildren = false, state) {
    if (affair) {
      fetch(config.api.announcement.get(), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        body: JSON.stringify({
          state: state,
          limit: DEFAULT_COUNT,
          isContainChild: isContainChildren,
        }),
      }).then((res) => res.json()).then(messageHandler).then((res) => {
        this.setState({
          announcementMap: this.state.announcementMap.set(affair.get('id'), Map({
            announcement: res.data ? fromJS(res.data.list) : List(),
            hasNextPage: res.data ? res.data.hasMore : false,
            isLoading: false,
          })),
        })
      })
    }
  },
  // 根据关键字获取announcement
  fetchQueriedAnnouncementsList(affair, queryString = '', isContainChildren = false, beginTime = null, endTime = null) {
    fetch(config.api.announcement.query.get(affair.get('roleId'), affair.get('id'), isContainChildren, this.state.searchingPage, SEARCHING_PAGE_SIZE, queryString, beginTime, endTime), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      this.setState({
        announcementMap: this.state.announcementMap.set(affair.get('id'), Map({
          announcement: res.data ? fromJS(res.data.announcementList) : List(),
          hasNextPage: res.data ? ((this.state.searchingPage + 1) * SEARCHING_PAGE_SIZE < res.data.totalElements) : false,
          isLoading: false,
        })),
        total: res.data ? res.data.totalElements : -1,
      })
    })
  },
  // 获取事务发布以及子事务列表。
  fetchAnnouncementWithChildren(props) {
    const affair = props.affair
    fetch(config.api.announcement.withChildren.get(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify({
        limit: DEFAULT_COUNT,
      }),
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      this.setState({
        affairTree: fromJS(affair.toJS())
          .set('children', fromJS(res.data.children))
          .update('children', (children) => children.map((v, k) => v.set('_path', List(['children', k])).set('roleId', affair.get('roleId')))),
        announcementMap: this.state.announcementMap.set(affair.get('id'), Map({
          announcement: fromJS(res.data.announcementList.list),
          hasNextPage: res.data.announcementList.hasMore,
          isLoading: false,
        }))
      })
    })
    this.state.isLoaded.map((affair) => {
      this.fetchChildrenAnnouncement(affair, () => {})
    })

  },
  fetchChildrenAnnouncement(affair, cb) {
    fetch(config.api.announcement.withChildren.get(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify({
        limit: DEFAULT_COUNT,
      }),
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      this.setState({
        affairTree: this.state.affairTree.updateIn(affair.get('_path'), (affair) =>
          affair
            .set('children', fromJS(res.data.children))
            .update('children', (children) =>
              children.map((v, k) =>
                v
                  .set('_path', affair.get('_path').concat(List(['children', k])))
                  .set('roleId', affair.get('roleId'))
              )
            )
        ),
        announcementMap: this.state.announcementMap.set(
          affair.get('id'),
          Map({
            announcement: fromJS(res.data.announcementList.list),
            hasNextPage: res.data.announcementList.hasMore,
            isLoading: false,
          })
        )
      })
      cb()
    })
  },
  filterByDateRange(v) {
    const {
        beginTime,
        endTime,
    } = this.props

    return (beginTime && endTime) ? v.get('modifyTime') > beginTime && v.get('modifyTime') < endTime : true
  },
  // Handler
  handleToggleSubaffair(affair) {
    let isExpanded = this.state.isExpanded
    if (isExpanded.includes(affair.get('id'))) {
      //折叠一个事务时,将它的子事务也一并折叠
      let filterIds = List()
      const recurs = (tempAffair) => {
        filterIds = filterIds.push(tempAffair.get('id'))
        !tempAffair.get('children', List()).isEmpty() && tempAffair.get('children').map((v) => recurs(v))
      }
      recurs(affair)
      this.setState({
        isExpanded: isExpanded.filter((v) => !filterIds.includes(v))
      })
    } else {
      this.fetchChildrenAnnouncement(affair, () => this.setState({
        isExpanded: isExpanded.push(affair.get('id'))
      }))
    }
    if (!this.hasLoaded(affair.get('id'))){
      let { isLoaded } = this.state
      isLoaded.push(affair)
      this.setState({ isLoaded })
    }
  },
  handleUpdateAnnouncement(announcement){
    const affairId = announcement.get('affairId')
    this.setState({
      announcementMap: this.state.announcementMap.update(affairId, (announcementListState) =>
        announcementListState
          .update('announcement', (announcementList) => {
            const index = announcementList.findIndex((target) => target.get('announcementId') == announcement.get('announcementId'))
            if (index >= 0) {
              announcementList = announcementList.set(index, announcement)
            }
            return announcementList
          })
      )
    })
  },
  //移除发布只显示两条的限制,默认都有限制,将id加入notLimitAffairs中表示不受限制
  handleRemoveLimit(affairId) {
    this.setState({
      notLimitAffairs: this.state.notLimitAffairs.push(affairId)
    })
  },
  handleLoadMore(affair) {
    const announcementInfo = this.state.announcementMap.get(affair.get('id'))
    this.setState({
      announcementMap: this.state.announcementMap.setIn([affair.get('id'), 'isLoading'], true)
    })
    fetch(config.api.announcement.get(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify({
        limit: LOAD_MORE_COUNT,
        lastTime: announcementInfo.get('announcement').last().get('modifyTime'),
      }),
    }).then((res) => res.json()).then(messageHandler).then((res) => this.setState({
      announcementMap: this.state.announcementMap.update(affair.get('id'), (v) => Map({
        announcement: res.data ? v.get('announcement').concat(fromJS(res.data.list)) : v.get('announcement'),
        hasNextPage: res.data ? res.data.hasMore : v.get('hasNextPage'),
        isLoading: false,
      }))
    }))
  },
  handleLoadSearchMore(affair){
    const { isContainChildren, beginTime, endTime, queryString } = this.props
    // const announcementInfo=this.state.announcementMap.get(affair.get('id'))
    this.setState({
      announcementMap: this.state.announcementMap.setIn([affair.get('id'), 'isLoading'], true)
    })
    fetch(config.api.announcement.query.get(affair.get('roleId'), affair.get('id'), isContainChildren, this.state.searchingPage + 1, SEARCHING_PAGE_SIZE, queryString, beginTime, endTime), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      this.setState({
        announcementMap: this.state.announcementMap.update(affair.get('id'), (v) => Map({
          announcement: res.data ? v.get('announcement').concat(fromJS(res.data.announcementList)) : v.get('announcement'),
          hasNextPage: res.data ? ((this.state.searchingPage + 2) * SEARCHING_PAGE_SIZE < this.state.total) : false,
          isLoading: false,
        })),
        searchingPage: this.state.searchingPage + 1,
      })
    })
  },
  // Render
  renderChildrenMode() {
    return [(
      <div key="main">
        {this.renderAnnouncementItemList(this.props.affair, true)}
      </div>
    ), this.renderAnnouncementTree(this.state.affairTree)]
  },
  //包含子事务且按事务排序时渲染的发布树
  renderAnnouncementTree(affair) {
    if (!affair) return null
    else if (!affair.get('children')) return null
    return affair.get('children').map((child, key) => {
      let hasExpanded = this.hasExpanded(child.get('id'))
      // const announcement = this.state.announcementMap.get(child.get('id')) || List()
      return (
        <div key={key}>
          {/* 事务发布折叠开关 */}
          <div className={styles.affairTitleWrapper}>
            <div className={styles.affairTitle} style={this.isNeedRetract(child) ? { paddingLeft: 60 } : {}}>
              <AffairAvatar affair={child} sideLength={40} />
              <div className={styles.affairName}>{child.get('name')}</div>
              <div className={styles.dropDownButton} onClick={() => this.handleToggleSubaffair(child)}>
                <DropDownIcon style={hasExpanded ? { transform: 'rotate(180deg)' } : { transform: 'rotate(0)' }}/>
              </div>
            </div>
          </div>
          {/* 发布列表, renderAnnouncementList只渲染该事务的发布(如果有的话), renderAnnouncementTree则负责递归渲染发布树和子事务标题 */}
          {hasExpanded ?
                this.renderAnnouncementItemList(child, true).push(this.renderAnnouncementTree(child))
                :
                null
            }
        </div>
      )
    })
  },
  // 已经展开,包含在展开事务列表里
  hasExpanded(affairId) {
    return this.state.isExpanded.includes(affairId)
  },
  hasLoaded(affairId){
    return this.state.isLoaded.filter((v) => v.get('id') == affairId).length != 0
  },
  // 是否需要缩进,本身需要缩进(它的子事务没有展开的,并且有子事务)且它的兄弟都需要缩进,除了第一级的事务全部折叠时候不需要缩进
  isNeedRetract(checkAffair) {
    const parentAffair = this.state.affairTree.getIn(checkAffair.get('_path').slice(0, checkAffair.get('_path').size - 2))
    const myfunc = (affair) => (!this.hasExpanded(affair.get('id')) && !affair.get('children', List()).some((v) => this.hasExpanded(v.get('id')))) ||
    (this.hasExpanded(affair.get('id')) && affair.get('children', List()).isEmpty())
    return myfunc(checkAffair) && parentAffair.get('children', List()).filter((v) => v.get('id') != checkAffair.get('id')).every((v) => myfunc(v))
  },
  renderQueriedAnnouncementList(){
    const {
        affairTree,
    } = this.props
    return this.state.queryResult
      .map((v) => findAffairInTree(affairTree, v.get('affairId')).getIn(['announcement', v.get('announcementId')]))
      .filter(this.filterByDateRange)
      .map((v, k) => v.get('title') ?
        <AnnouncementListItem
          key={k}
          value={v}
          affair={this.props.affair}
          onUpdate={(announcement) => this.handleUpdateAnnouncement(announcement)}
          affairMemberId={this.props.affair.get('affairMemberId')}
        />
        :
          null
        )
  },
  renderSearchList(affair, hideBottomBorder = false){
    const announcementInfo = this.state.announcementMap.get(affair.get('id'))
    if (!announcementInfo) return []
    return announcementInfo.get('announcement').map((v, k) => (
      <AnnouncementListItem
        affair={affair}
        key={k}
        value={v}
        hideFromLabel={false}
        hideBottomBorder={hideBottomBorder}
        onUpdate={(announcement) => this.handleUpdateAnnouncement(announcement)}
        affairMemberId={this.props.affair.get('affairMemberId')}
      />
    )).push(announcementInfo.get('hasNextPage') ? <div key="loademore" className={styles.loadmore} onClick={this.handleLoadSearchMore.bind(this, affair)}>{announcementInfo.get('isLoading') ? <LoadingIcon /> : null}加载更多</div> : null)
  },

  renderAnnouncementItemList(affair, hideBottomBorder = false) {
    const announcementInfo = this.state.announcementMap.get(affair.get('id'))
    if (!announcementInfo) return []
    return announcementInfo.get('announcement').map((v, k) => (
      <AnnouncementListItem
        affair={affair}
        key={k}
        value={v}
        hideFromLabel={false}
        hideBottomBorder={hideBottomBorder}
        onUpdate={(announcement) => this.handleUpdateAnnouncement(announcement)}
        affairMemberId={this.props.affair.get('affairMemberId')}
      />
    )).push(announcementInfo.get('hasNextPage') ? <div key="loademore" className={styles.loadmore} onClick={this.handleLoadMore.bind(this, affair)}>{announcementInfo.get('isLoading') ? <LoadingIcon /> : null}加载更多</div> : null)
  },
  render() {

    const {
        isContainChildren,
        sortType,
        affair,
        isSearching
    } = this.props
    const {
        announcementMap
    } = this.state
    // 还未加载到数据，显示空白页
    if (!announcementMap.getIn([affair.get('id'), 'announcement'])) {
      return null
    }
    else {
      if (announcementMap.getIn([affair.get('id'), 'announcement']).size) {
        //搜索列表
        if (isSearching){
          return (
            <div className={styles.container}>
              {this.renderSearchList(affair)}
            </div>
          )
        }
        // 包含子事务并且按照事务排序。
        else if (isContainChildren && sortType === 'affair'){
          return (
            <div className={styles.container}>
              {this.renderChildrenMode()}
            </div>
          )
        }
        else {
          return (
            <div className={styles.container}>
              {this.renderAnnouncementItemList(affair)}
            </div>
          )
        }

      } else {
        return (
          <div className={styles.noneAnnouncement}>
            <img src={imageNoRelease} />
            <div>暂无发布...</div>
          </div>
        )
      }
    }
  },
})
function mapStateToProps(state) {
  return {
    affairTree: state.getIn(['affair', 'affairTree']),
  }
}
function mapDispatchToProps() {
  return {
  }
}
export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(AnnouncementList)
