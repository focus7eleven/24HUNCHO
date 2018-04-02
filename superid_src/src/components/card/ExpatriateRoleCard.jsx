import React, { PropTypes } from 'react'
import styles from './ExpatriateRoleCard.scss'
import { Tooltip } from 'antd'
import { DetailsFullIcon } from '../../public/svg'


const ExpatriateRoleCard = React.createClass({
  PropTypes: {
    roleId: PropTypes.number.isRequired,
    roleTitle: PropTypes.string.isRequired,
    allianceName: PropTypes.string.isRequired,
    affairName: PropTypes.string.isRequired,
  },

  onClick(){
    const { clickCallback, roleId } = this.props
    clickCallback(roleId)
  },


  render(){
    const {
      roleTitle,
      allianceName,
      affairName
    } = this.props

    const tipTitle = allianceName + ' - ' + affairName
    // console.log(roleTitle)
    return (
      <div className={styles.card}>
        <div className={styles.left}>
          <div className={styles.role}>
            {roleTitle}
          </div>
          <Tooltip title={tipTitle}>
            <div className={styles.affair}>
              {allianceName} - {affairName}
            </div>
          </Tooltip>
        </div>
        <div className={styles.right} onClick={this.onClick}>
          <DetailsFullIcon fill="#7cb863"/>
          <span>详情</span>
        </div>
      </div>
    )
  }
})

// function mapStateToProps(state) {
//   return {
//     user: state.get('user')
//   }
// }

export default ExpatriateRoleCard