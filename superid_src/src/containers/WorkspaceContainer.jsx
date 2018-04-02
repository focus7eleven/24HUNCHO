import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import AffairManagementContainer from './affair/AffairManagementContainer'
import styles from './WorkspaceContainer.scss'
import { fetchAllianceList } from '../actions/alliance'
import { fetchUserTaskList, fetchAffairList } from '../actions/affair'
import { fetchUserRoleList } from '../actions/user'
import { initializeAffairDynamic } from 'actions/notification'
import { List } from 'immutable'
import { pushPermittedURL } from 'actions/route'

const WorkspaceComponent = React.createClass({
  componentDidMount() {
    const userId = this.props.user.get('id')
    this.props.fetchAllianceList(userId)
    this.props.fetchAffairList().then((json) => {
      if (json.code == 0) {
        const affairIds = json.data.map((affair) => affair.affairId)
        this.props.initializeAffairDynamic(userId, affairIds)

        const pathname = location.pathname.split('/')
        const affairList = this.getAffairList()
        if (pathname.length < 4 && affairList.size) {
          this.props.pushPermittedURL(affairList.get(0).get('affairId'), 0, `/workspace/affair/${affairList.get(0).get('affairId')}`)
        } else {
          this.props.pushPermittedURL(pathname[3], 0, location.pathname)
        }
      }
    })
    this.props.fetchUserRoleList()
    this.props.fetchUserTaskList()
  },
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
  renderContentPanel(){
    return <div className={styles.affairIndex}>{this.props.children}</div>
  },

  render: function() {
    return (
      <div className={styles.container}>
        <AffairManagementContainer className={styles.affairManangement} location={this.props.location} />
        {this.renderContentPanel()}
      </div>
    )
  },
})

function mapStateToProps(state) {
  return {
    user: state.get('user'),
    affairList: state.getIn(['affair', 'affairList'], List()),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchAllianceList: bindActionCreators(fetchAllianceList, dispatch),
    fetchUserRoleList: bindActionCreators(fetchUserRoleList, dispatch),
    fetchAffairList: bindActionCreators(fetchAffairList, dispatch),
    fetchUserTaskList: bindActionCreators(fetchUserTaskList, dispatch),
    initializeAffairDynamic: bindActionCreators(initializeAffairDynamic, dispatch),
    pushPermittedURL: bindActionCreators(pushPermittedURL, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WorkspaceComponent)
