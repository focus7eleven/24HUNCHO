import React from 'react'
import { Popover } from 'antd'
import styles from './AvatarGroup.scss'
import Avatar from './Avatar'

const AvatarGroup = React.createClass({

  renderContent(){
    const { users } = this.props
    return (
      <div className={styles.usersContent}>
        {users.map((v, k) => {
          return (
            <Avatar src={v.avatar} textList={[v.roleTitle, v.username]} key={k}/>
          )
        })}
      </div>
    )
  },

  render(){
    const { users } = this.props
    return (
      <Popover content={this.renderContent()}>
        <div className={styles.usersWrapper}>
          {users.map((v, k) => {
            if (k > 3){
              return null
            }
            return (
              <img src={v.avatar} alt="头像" key={k} style={{ right: k * 5 }}/>
            )
          })}
        </div>
      </Popover>
    )
  }
})

export default AvatarGroup