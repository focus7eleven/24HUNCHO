import React from 'react'
import PropTypes from 'prop-types'
import { List, fromJS } from 'immutable'
import config from 'config'
import messageHandler from 'messageHandler'
import DynamicScrollPane from 'components/scrollpane/DynamicScrollPane'
import styles from './NewsContainer'
import NewsItem from './NewsItem'
import { LOAD_LIMIT } from '../constant/AnnouncementConstants'

class NewsContainer extends React.Component {
  state = {
    newsList: List(),
    isLoading: true,
  }

  componentWillMount() {
    this.fetchNewsList()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isNewsTab) {
      this.fetchNewsList()
    }
    if (nextProps.announcement.get('announcementId') != this.props.announcement.get('announcementId')) {
      this.fetchNewsList(List(), LOAD_LIMIT, nextProps)
    }
  }

  fetchNewsList = (newsList = List(), limit = LOAD_LIMIT, props = this.props) => {
    const { affair, announcement } = props
    this.setState({
      isLoading: true,
    })
    return fetch(config.api.announcement.detail.news(announcement.get('announcementId')), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify({
        lastTime: newsList.size !== 0 ? newsList.get(newsList.size - 1).get('modifyTime') : null,
        limit: limit,
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        this.setState({
          newsList: newsList.concat(fromJS(json.data.simpleDynamicVOs)),
          hasMore: json.data.hasMore,
          isLoading: false,
        })
      }
    })
  }

  render() {
    const { newsList, isLoading, hasMore } = this.state
    return (
      <DynamicScrollPane onLoad={this.loadMoreNews} isLoading={isLoading} hasMore={hasMore} wrapClassName={styles.container}>
        {newsList.sort((a, b) => b.get('modifyTime') - a.get('modifyTime')).map((v, k) => {
          return (
            <NewsItem
              key={k}
              affair={this.props.affair}
              news={v}
            />
          )
        })}
      </DynamicScrollPane>
    )
  }
}

NewsContainer.PropTypes = {
  affair: PropTypes.object.isRequired,
  announcement: PropTypes.object.isRequired,
  isNewsTab: PropTypes.bool.isRequired,
}

export default NewsContainer
