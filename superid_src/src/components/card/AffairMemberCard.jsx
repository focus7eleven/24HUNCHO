import React, { PropTypes } from 'react'
import styles from './AffairMemberCard.scss'
import { UserHomepageIcon, ChatIcon } from 'svg'
import classNames from 'classnames'

const AffairMemberCard = React.createClass({
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

  getInitialState(){
    return {}
  },

  handleShowCard(){
    let card = this.refs.card
    let avatar = this.refs.avatar
    let info = this.refs.info
    let container = this.refs.container
    card.style.opacity = 1
    card.style.visibility = 'visible'
    card.style.zIndex = 15
    container.style.zIndex = 15
    avatar.style.zIndex = -1
    info.style.zIndex = -1
  },

  handleHideCard(){
    let card = this.refs.card
    let avatar = this.refs.avatar
    let info = this.refs.info
    let container = this.refs.container
    card.style.opacity = 0
    card.style.visibility = 'hidden'
    card.style.zIndex = -1
    container.style.zIndex = 9
    avatar.style.zIndex = 1
    info.style.zIndex = 1
  },

  handleUserHomepage(){
    // TODO: Enter user homepage
  },

  handleStartToChat(){
    // TODO: Start to chat
  },

  render(){
    const { member, className } = this.props

    return (
      <div className={classNames(styles.container, className)} onMouseEnter={this.handleShowCard} onMouseLeave={this.handleHideCard} ref="container">
        {
          member.avatar ? <img className={styles.avatar} src={member.avatar} ref="avatar" /> : <div className={styles.avatar} ref="avatar" style={{ backgroundColor: '#ebebeb' }} />
        }
        <div className={styles.info} ref="info">
          <div className={styles.nameAndBuff}>
            <span>{member.username}</span>
            <span>{member.belongAffair}</span>
          </div>
          <div>{member.roleTitle}</div>
        </div>
        <div className={styles.card} ref="card">
          <div className={styles.cardTop}>
            {
              member.avatar ? <img className={styles.avatar} src={member.avatar} /> : <div className={styles.avatar} style={{ backgroundColor: '#ebebeb' }} />
            }
            <div className={styles.cardInfo}>
              <div className={styles.username}>{member.username}</div>
              <div className={styles.role}><span>角色：</span>{member.roleTitle}</div>
              <div className={styles.role}><span>主事务：</span>{member.belongAffair ? member.belongAffair : member.belongAffairName}</div>
            </div>
          </div>
          <div className={styles.cardBottom}>
            <div className={styles.flagAndId}>
              <div className={styles.flagContainer}>
                <img src={member.nationalFlag} />
              </div>
              <span>ID:{member.superid}</span>
            </div>
            <div className={styles.icon}>
              <UserHomepageIcon height="14" width="20" onClick={this.handleUserHomepage} />
              <ChatIcon height="14" width="20" fill="#9b9b9b" onClick={this.handleStartToChat} />
            </div>
          </div>
        </div>
      </div>
    )
  }
})

export default AffairMemberCard
