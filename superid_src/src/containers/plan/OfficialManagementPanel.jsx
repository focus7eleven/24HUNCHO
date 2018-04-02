import React from 'react'
import { List, fromJS } from 'immutable'
import { Icon, Tooltip, Popover } from 'antd'
import config from '../../config'
import messageHandler from 'messageHandler'
import styles from './OfficialManagementPanel.scss'

class OfficialManagementPanel extends React.Component {
  state = {
    officialList: List(),
    candidatesList: List(),
  }

  componentWillMount() {
    this.fetchOfficials(this.props)
    this.handleFetchOfficialRoleCandidates(this.props)
  }

  handleFetchOfficialRoleCandidates() {
    fetch(config.api.affair.role.main_roles(true), {
      method: 'GET',
      credentials: 'include',
      roleId: this.props.affair.get('roleId'),
      affairId: this.props.affair.get('id'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          officialRoleList: fromJS(json.data || []),
        })
      }
    })
  }

  fetchOfficials(props){
    const { affair, announcementId } = props

    return fetch(config.api.announcement.detail.officials.get(announcementId), {
      method: 'GET',
      affairId: affair.get('id'),
      roleId: affair.get('roleId')
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.setState({
          officialList: fromJS(json.data)
        })
      }
    })
  }

  handleChooseOfficial = ({ role }) => {
    this.props.addCallback(role)
  }

  renderOfficialList() {
    return this.state.officialList.map((official, index) => {
      return (
        <Tooltip title={`${official.get('roleTitle')}－${official.get('username')}`} key={index}>
          <div className={styles.offcial}>
            {official.get('avatar') ? <img src={official.get('avatar')} /> : null}
          </div>
        </Tooltip>
      )
    })
  }
  renderSelectOfficialPanel() {
    const candidates = this.state.candidatesList
      .filter((role) => !this.props.officialList.some((v) => v.get('roleId') == role.get('roleId')))

    return (
      <SingleRoleSelectPanel style={{ position: 'static' }} roleList={candidates} showPanel onChange={this.handleChooseOfficial}/>
    )
  }
  render() {
    return (
      <div className={styles.container}>
        {this.renderOfficialList()}

        {/* 添加官方 */}
        <Popover
          content={this.renderSelectOfficialPanel()}
          trigger="click"
          overlayClassName={styles.addOfficialPopover}
        >
          <div className={styles.addOfficial}><Icon type="plus" /></div>
        </Popover>
      </div>
    )
  }
}

export default OfficialManagementPanel
