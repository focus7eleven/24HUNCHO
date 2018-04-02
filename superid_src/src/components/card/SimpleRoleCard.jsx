import React, { PropTypes } from 'react'
import styles from './SimpleRoleCard.scss'
import { AbadonIcon, ManageIcon } from 'svg'

const SimpleRoleCard = React.createClass({
  PropTypes: {
    role: PropTypes.object.isRequired,
    changeAuthority: PropTypes.object.isRequired,
    isHistory: PropTypes.object,
  },
  getDefaultProps(){
    return {
      role: {
        roleName: '酒吞童子',
        mainAffair: '大后期',
      },
    }
  },
  render(){
    return (<div className={styles.container}>
      <div className={styles.roleName}>{this.props.role.roleTitle}</div>
      <div className={styles.mainAffair}>主事务:&nbsp;{this.props.role.belongAffairName}</div>
      {
                this.props.isHistory ? null :
                <div className={styles.footer}>
                  <div className={styles.linkDiv}><AbadonIcon height="12" fill="#4990e2"/><span style={{ marginLeft: '3px' }}>停用角色</span></div>
                  <div className={styles.linkDiv} onClick={this.props.changeAuthority}><ManageIcon height="12" fill="#4aa0e2"/><span style={{ marginLeft: '3px' }}>高级权限</span></div>
                </div>
            }
            
    </div>)
  }
})

export default SimpleRoleCard