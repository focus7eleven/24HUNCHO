import React from 'react'
import PropTypes from 'prop-types'
import { List, fromJS } from 'immutable'
import config from 'config'
import messageHandler from 'messageHandler'
import urlFormat from 'urlFormat'
import SecondaryButton from 'components/button/SecondaryButton'
import DynamicScrollPane from 'components/scrollpane/DynamicScrollPane'
import { LOAD_LIMIT } from '../constant/AnnouncementConstants'
import AnnouncementItem, { VISION } from '../inner/InnerAnnouncement'
import CreateAnnouncementModal from '../create/CreateAnnouncementModal'
import styles from './SubContainer.scss'

class SubContainer extends React.Component {
  state = {
    subAnnouncementList: List()
  }

  componentWillMount() {
    this.fetchSubAnnouncementList()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.announcement.get('announcementId') != this.props.announcement.get('announcementId')) {
      this.fetchSubAnnouncementList( List(), LOAD_LIMIT, nextProps)
    }
  }

  //创建子发布
  onCreateAnnouncement = () => {
    this.setState({
      showCreateAnnouncementModal: this.props.announcement,
    })
  }

  fetchSubAnnouncementList = (list = List(), limit = LOAD_LIMIT, props = this.props) => {
    const {
      affair,
      announcement,
    } = props

    fetch(urlFormat(config.api.announcement.detail.subAnnouncementList(), {
      announcementId: announcement.get('announcementId')
    }), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify({
        lastTime: list.size == 0 ? null : list.get(list.size - 1).get('createTime'),
        limit: limit,
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.setState({
          subAnnouncementList: list.concat(fromJS(json.data.list))
        })
      }
    })
  }

  render() {
    const { showCreateAnnouncementModal } = this.state

    // console.log(this.props.announcement.get('announcementId'), this.state.subAnnouncementList.toJS())

    return (
      <div className={styles.subAnnouncement}>
        <div className={styles.tabTitle}>
          子发布列表：
          {this.props.announcement.get('permission').some((v) => v == 507) && <SecondaryButton type="primary" className={styles.createBtn} size="small" onClick={this.onCreateAnnouncement}>新建子发布</SecondaryButton>}
        </div>
        <DynamicScrollPane onLoad={this.fetchSubAnnouncementList} isLoading={false} hasMore={false} wrapClassName={styles.scrollPane + ' ' + styles.subAffairScrollPane}>
          {this.state.subAnnouncementList.map((announcement) => {
            return (
              <AnnouncementItem
                key={announcement.get('announcementId')}
                affairId={this.props.affair.get('id')}
                announcement={announcement}
                vision={VISION.BRIEF}
                wrapClassName={styles.item}
              />
            )
          })}
        </DynamicScrollPane>

        {/* 创建子发布 */}
        {showCreateAnnouncementModal &&
          <CreateAnnouncementModal
            onClose={() => {
              this.fetchSubAnnouncementList()
              this.setState({ showCreateAnnouncementModal: false })
            }}
            onSucceed={() => {
              this.fetchSubAnnouncementList()
              this.setState({
                showCreateAnnouncementModal: false,
              })
            }}
            affairId={this.props.affair.get('id')}
            roleId={this.props.affair.get('roleId')}
            allianceId={this.props.affair.get('allianceId')}
            parentAnnouncement={showCreateAnnouncementModal}
          />
        }
      </div>
    )
  }
}

SubContainer.PropTypes = {
  affair: PropTypes.object.isRequired,
  announcement: PropTypes.object.isRequired,
}

export default SubContainer
