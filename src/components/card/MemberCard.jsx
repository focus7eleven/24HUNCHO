import React from 'react'
import PropTypes from 'prop-types'
import { fromJS } from 'immutable'
import { MaleIcon, FemaleIcon, DetailsFullIcon, ChatIcon } from 'svg'
import styles from './MemberCard.scss'
import { USER_ROLE_TYPE } from 'member-role-type'

class MemberCard extends React.Component {
  static propTypes = {
    member: PropTypes.object.isRequired,
    optRole: PropTypes.object.isRequired,
    onRemoveCallback: PropTypes.func,
  }

  static defaultProps = {
    member: fromJS({
      username: 'kdot',
      id: 'wwh7elven',
      avatar: 'http://superid-public.oss-cn-shanghai.aliyuncs.com/person_default.png',
      gender: 0,
      // type: 'groupMember'
    })
  }

  state = {
    showRemove: false,
  }

  handleShowRemove = () => {
    const {
      optRole,
      member,
     } = this.props
    const optRoleType = optRole.get('roleType')
    const optRoleId = optRole.get('roleId')
    if (optRoleId == member.get('id')) {
      // 操作者为当前角色卡片人员
      return
    } else if (optRoleType === USER_ROLE_TYPE.TEACHER || optRoleType === USER_ROLE_TYPE.ASSISTANT || optRoleType === USER_ROLE_TYPE.MANAGER) {
      this.setState({ showRemove: true })
    }
  }

  handleHideRemove = () => {
    this.setState({ showRemove: false })
  }

  handleRemoveMember = () => {
    this.props.onRemoveCallback(this.props.member.get('id'))
  }

  renderGender = (gender) => {
    switch(gender) {
      case 0:
      // 保密
        return ''
      case 1:
      // 男
        return <MaleIcon height="12" fill="#2db7f5" />
      case 2:
      // nv
        return <FemaleIcon height="12" fill="#f45b6c" />
    }
  }

  render() {
    const { member } = this.props
    const { showRemove } = this.state
    return (
      <div className={styles.container} onMouseEnter={this.handleShowRemove} onMouseLeave={this.handleHideRemove}>
        <div className={styles.left}>
          {
            member.get('avatar') ? <img className={styles.avatar} src={member.get('avatar')} /> : <div className={styles.avatar} style={{ backgroundColor: '#ebebeb' }} />
          }
        </div>
        <div className={styles.right}>
          <div className={styles.name}>
            { member.get('realName') }
            { this.renderGender(member.get('gender')) }
          </div>
          <div className={styles.id}>
            {member.get('roleType') !== USER_ROLE_TYPE.TEACHER && member.get('roleType') !== USER_ROLE_TYPE.ADMIN && `ID: ${ member.get('number') }` }
          </div>
          <div className={styles.operation}>
            <DetailsFullIcon fill="#7cb863" style={{ top: -1 }}/>
            <span style={{ marginRight: 21 }}>详情</span>
            <ChatIcon fill="#7477f9"/>
            <span>会话</span>
          </div>
        </div>
        {
          showRemove ? <span onClick={this.handleRemoveMember} className={styles.remove}>移出</span> : null
        }
      </div>
    )
  }
}


export default MemberCard
