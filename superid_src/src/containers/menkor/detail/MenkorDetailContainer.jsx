import React from 'react'
import styles from './MenkorDetailContainer.scss'
import { fromJS } from 'immutable'
import ApplyButton from '../component/ApplyButton'
import StarButton from '../component/StarButton'
import { message } from 'antd'
import ApplyAttendAffairModal from '../../../components/modal/ApplyAttendAffairModal'
import config from '../../../config'
import messageHandler from 'messageHandler'

const MenkorDetailContainer = React.createClass({
  getInitialState(){
    return {
      affair: {},
      selectedIndex: 0,
    }
  },
  componentWillMount(){
    this.fetchAffair()
  },
  fetchAffair(){
    const affairId = this.props.routeParams.id
    fetch(config.api.affair.info.get(), {
      method: 'GET',
      credentials: 'include',
      affairId: affairId,
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        json.data.covers = (json.data.covers == '') ? [] : JSON.parse(json.data.covers)
        json.data.tags = (json.data.tags == '') ? [] : JSON.parse(json.data.tags)
        this.setState({ affair: json.data })
      }
    })
  },
  onStarAffair(){
    const affairId = this.props.routeParams.id
    fetch(config.api.affair.star(affairId, true), {
      method: 'POST',
      credentials: 'include',
      affairId: affairId,
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        message.success('关注成功', 0.5)
        let affair = this.state.affair
        affair.star = true
        this.setState({ affair: affair })
      }
    })
  },
  render(){
    const { affair, selectedIndex } = this.state
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>
            <div className={styles.icon} style={{ backgroundImage: `url(${affair.avatar})` }}/>
            <div className={styles.name}>
              {`${affair.allianceName || ''} ${affair.name || ''}`}
            </div>
          </div>
          <div className={styles.operationGroup}>
            {!affair.core &&
              <StarButton disabled={affair.star} onClick={this.onStarAffair}/>
            }
            <ApplyAttendAffairModal menkor affair={fromJS({ 'id': this.props.routeParams.id })}>
              <ApplyButton disabled={affair.core} />
            </ApplyAttendAffairModal>
          </div>
        </div>
        <div className={styles.graphGroup}>
          {(affair.covers && affair.covers.length != 0) ?
            <div className={styles.mainGraph} style={{ backgroundImage: `url(${affair.covers[selectedIndex].url})` }}/>
          : (
            <div className={styles.mainGraph}/>
          )}
          <div className={styles.graphList}>
            {affair.covers &&
              affair.covers.map((cover, index) => {
                return (
                  <div
                    key={index}
                    data-status={index == selectedIndex ? 'active' : ''}
                    className={styles.graph}
                    style={{ backgroundImage: `url(${cover.url})` }}
                    onClick={() => this.setState({ selectedIndex: index })}
                  />
                )
              })
            }
          </div>
        </div>
        <div className={styles.content}>
          {affair.description}
        </div>
        <div className={styles.tagGroup}>
          {affair.tags &&
            affair.tags.map((tag, index) => {
              return (
                <div key={index} className={styles.tag}>{tag}</div>
              )
            })
          }
        </div>
      </div>
    )
  },
})

export default MenkorDetailContainer
