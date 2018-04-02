import React from 'react'
import { connect } from 'react-redux'
import { List, fromJS } from 'immutable'
import { Icon } from 'antd'
import styles from './PermissionWrapper.scss'

class PermissionWrapper extends React.Component {

  static defaultProps = {
    originalPermissionList: List(),
    newPermissionList: List(),
  }

  render() {
    const { originalPermissionList, newPermissionList, permissionInformationList } = this.props
    const peerList = originalPermissionList
      .zip(newPermissionList)
      .map((peer) => List(peer)).toJS()
    var originalList = new Array(8)
    var newList = new Array(8)
    for (var x = 0; x < 8; x++ ){
      originalList[x] = peerList[x][0]
      newList[x] = peerList[x][1]
    }
    originalList.sort()
    newList.sort()
    for (var i = 0; i < 8; i++ ){
      peerList[i][0] = originalList[i]
      peerList[i][1] = newList[i]
    }
    return (
      <div className={styles.permissionWrapper}>
        {fromJS(peerList)
          .filter((peer) => !newPermissionList.some((value) => peer.get(0) == value))
          .map((peer, index) => {
            const originalPermission = permissionInformationList.find((permissionItem) => permissionItem.get('id') == peer.get('0'))
            const newPermission = permissionInformationList.find((permissionItem) => permissionItem.get('id') == peer.get('1'))
            return (
              <div className={styles.permission} key={index}>
                <div className={styles.label}>{originalPermission.get('categoryName')}：</div>
                <div className={styles.originalInfo}>{originalPermission.get('levelName')}</div>
                <div className={styles.tag}><Icon type="double-right" /></div>
                <div className={styles.newInfo}>{newPermission.get('levelName')}</div>
              </div>
            )
          })
        }
      </div>
    )
  }
}

export default connect((state) => ({
  permissionInformationList: state.getIn(['auth', 'permissionInformationList']) || List()
}))(PermissionWrapper)
