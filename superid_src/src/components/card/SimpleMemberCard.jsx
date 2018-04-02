import React, { PropTypes } from 'react'
import styles from './SimpleMemberCard.scss'
import { Rate } from 'antd'
import { MaleIcon, FemaleIcon, MemberBadge } from 'svg'


const SimpleMemberCard = React.createClass({
  propTypes: {
    member: PropTypes.object.isRequired,
  },
  getDefaultProps(){
    return {
      member: {
        avatarUrl: 'http://simucy.oss-cn-shanghai.aliyuncs.com/user/1178/EnterpriseValidate/1479112747473.jpeg',
        name: 'kdottttttttttttttttttttttttttttt',
        role: 'designerrrrrrrrrrrrrrrrrrrrrrrrr',
        mainAffair: '产品部门门门门门门门门门门门门门门',
        buff: '盟主',
        superid: '我的天123abc',
        nationalFlag: 'http://simucy.oss-cn-shanghai.aliyuncs.com/user/1178/EnterpriseValidate/1479176146388.png',
      }
    }
  },
  render(){
    return (<div className={styles.container}>
      <div className={styles.content}>
        {this.props.member.avatar ? <img src={this.props.member.avatar} className={styles.avatar}/> : <div className={styles.nullavatar} />}
        <div className={styles.info}>
          <div className={styles.nameContainer}>
            <span className={styles.name}>{this.props.member.username}</span>
            {this.props.member.gender == 0 ? null : (this.props.member.gender == 1 ? <MaleIcon height="12" fill="#2db7f5" /> : <FemaleIcon height="12" fill="#2db7f5" />)}
          </div>
          <span className={styles.superid}>ID:{this.props.member.superid}</span>
          <Rate value={3} disabled/>
          <div className={styles.badgePanel}>
            <MemberBadge fill="#f55b6c" height="12" />
            <MemberBadge fill="#4990e2" height="12" />
          </div>
        </div>
      </div>
    </div>)
  }
})

export default SimpleMemberCard
