import React from 'react'
import { connect } from 'react-redux'
import styles from './MenkorIndexContainer.scss'
import { Motion, spring } from 'react-motion'
import { SearchIcon } from 'svg'
import { message } from 'antd'
import { fromJS } from 'immutable'
import ApplyButton from './component/ApplyButton'
import StarButton from './component/StarButton'
import ApplyAttendAffairModal from '../../components/modal/ApplyAttendAffairModal'
import DynamicScrollPane from '../../components/scrollpane/DynamicScrollPane'
import config from '../../config'
import messageHandler from 'messageHandler'
import urlFormat from 'urlFormat'

const TABS = ['事务', '人力', '物力', '财力', '价值链']
let LOAD_COUNT = 10
const MenkorIndexContainer = React.createClass({

  getInitialState(){
    return {
      currentTabIndex: 0,
      keyword: '',
      list: [],
      applyingList: [],
      limit: 0,
      isLoading: false,
      hasMore: true,
    }
  },
  componentWillMount(){
    const height = window.innerHeight
    LOAD_COUNT = Number.parseInt(height / 140) + 5
    if (this.props.user.get('auth')) {
      this.fetchApplyingList(this.props.user.get('id'))
    }
  },
  componentWillReceiveProps(nextProps) {
    if (nextProps.user.get('id') != this.props.user.get('id')) {
      this.fetchApplyingList(nextProps.user.get('id'))
    }
  },
  fetchApplyingList(userId){
    if (userId == 0) {
      return
    }
    fetch(urlFormat(config.api.affair.member.applyingAffairList(), {
      checkedUserId: userId
    }), {
      method: 'GET',
      credentials: 'include'
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.setState({ applyingList: json.data })
      }
    })
  },
  wrapAffair(affair){
    const affairCovers = (affair.affairCover == '') ? [] : JSON.parse(affair.affairCover)
    affair.affairCover = affairCovers.length > 0 && affairCovers[0].url
    affair.tags = (affair.tags == '') ? [] : JSON.parse(affair.tags)
    return affair
  },
  handleSearch(){
    this.setState({
      isLoading: true,
      hasMore: true,
    })
    const { keyword } = this.state
    fetch(config.api.affair.search_affair(encodeURIComponent(keyword), 0, LOAD_COUNT), {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code == 0) {
        let affairs = res.data.affairs
        affairs = (affairs == null) ? [] : affairs
        affairs = affairs.map(this.wrapAffair)
        this.setState({
          list: affairs,
          limit: 0 + 1,
          isLoading: false,
          hasMore: affairs.length == LOAD_COUNT,
        })
      }
    })
  },
  handleLoad(){
    this.setState({ isLoading: true })
    const { keyword, limit } = this.state
    fetch(config.api.affair.search_affair(encodeURIComponent(keyword), limit, LOAD_COUNT), {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code == 0) {
        let affairs = res.data.affairs
        affairs = (affairs == null) ? [] : affairs
        affairs.map(this.wrapAffair)
        this.setState({
          list: this.state.list.concat(affairs),
          limit: limit + 1,
          isLoading: false,
          hasMore: affairs.length == LOAD_COUNT,
        })
      }
    })
  },
  handleClickAffair(affairId){
    //this.props.pushURL(`/menkor/${affairId}`)
    window.open(`/menkor/${affairId}`)
  },
  handleStarAffair(affairId) {
    fetch(config.api.affair.star(affairId, true), {
      method: 'POST',
      credentials: 'include',
      affairId: affairId,
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        message.success('关注成功', 0.5)
        let list = this.state.list
        let affairIndex = list.findIndex((obj) => (obj.affairId == affairId))
        if (affairIndex >= 0) {
          list[affairIndex].hasStar = true
        }
        this.setState({ list: list })
      }
    })
  },
  render() {
    const { currentTabIndex, list, isLoading, hasMore } = this.state
    return (
      <div className={styles.container}>
        {/* 搜索框 */}
        <div className={styles.searchBarWrapper}>
          <div className={styles.searchBar}>
            <input placeholder="请输入关键词"
              onChange={(e) => {this.setState({ keyword: e.target.value })}}
              onKeyUp={(e) => {e.keyCode == 13 && this.handleSearch()}}
            />
            <SearchIcon onClick={() => {this.handleSearch()}} />
          </div>
        </div>
        {/* tab选择 */}
        <div className={styles.tabWrapper}>
          <div className={styles.tabContainer}>
            {TABS.map((tab, index) => {
              const isActive = index == currentTabIndex
              const style = isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab
              return (
                <div key={index} className={style} onClick={() => { false && this.setState({ currentTabIndex: index })}} data-status={index != 0 && 'disabled'}>
                  {tab}
                </div>
              )
            })}
            <Motion style={{ left: spring((currentTabIndex) * 88) }}>
              {(style) => (
                <div className={styles.smooth} style={{ left: style.left }} />
              )}
            </Motion>
          </div>
        </div>
        {/* 内容列表 */}
        <DynamicScrollPane onLoad={this.handleLoad} isLoading={isLoading} hasMore={hasMore}>
          {list && list.map((item, index) => {
            return (
              <div key={index} className={styles.item}>
                <div className={styles.itemContent}>
                  <div
                    className={styles.avatar}
                    style={{ backgroundImage: `url(${item.affairCover})` }}
                    onClick={() => this.handleClickAffair(item.affairId)}
                  />
                  <div className={styles.information}>
                    <div className={styles.affair}>
                      <div
                        className={styles.icon}
                        style={{ backgroundImage: `url(${(item.affairAvatar == null || item.affairAvatar == '') ? item.allianceAvatar : item.affairAvatar})` }}
                        onClick={() => this.handleClickAffair(item.affairId)}
                      />
                      <div className={styles.name} onClick={() => this.handleClickAffair(item.affairId)}>{`${item.allianceName} ${item.affairName}`}</div>
                    </div>
                    <div className={styles.responsor}>
                      <div className={styles.left}>负责人：</div>
                      <div className={styles.right}>{item.roleTitle && item.username ? `${item.roleTitle}-${item.username}` : '无'}</div>
                    </div>
                    <div className={styles.tagGroup}>
                      {item.tags &&
                        item.tags.map((tag, index) => {
                          return (
                            <div key={index} className={styles.tag}>{tag}</div>
                          )
                        })
                      }
                    </div>
                  </div>
                </div>
                <div className={styles.operationGroup}>
                  {!(item.affairUserId && item.affairUserId != '') &&
                    <StarButton disabled={item.hasStar} onClick={() => {this.handleStarAffair(item.affairId)}} />
                  }
                  {(item.affairUserId && item.affairUserId != '') ? (
                    <ApplyButton disabled />
                  ) : this.state.applyingList.find((applyId) => applyId == item.affairId) ? (
                    <ApplyButton disabled disabledText="申请中" />
                  ) : (
                    <ApplyAttendAffairModal
                      menkor
                      affair={fromJS({ 'id': item.affairId })}
                      onSubmitSucceed={() => this.setState({ applyingList: this.state.applyingList.concat([item.affairId]) })}
                    >
                      <ApplyButton />
                    </ApplyAttendAffairModal>
                  )}
                </div>
              </div>
            )
          })
          }
        </DynamicScrollPane>
      </div>
    )
  },
})

function mapStateToProps(state) {
  return {
    user: state.get('user'),
  }
}

export default connect(mapStateToProps, null)(MenkorIndexContainer)
