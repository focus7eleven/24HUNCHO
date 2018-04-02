import React from 'react'
import { Popover } from 'antd'
import styles from './AvatarList.scss'
import Avatar from '../../containers/notice/modal/audit/component/Avatar'


//未完成，重叠起来的头像列表，hover显示所有人的"头像 角色名-用户名"列表
const AvatarList = React.createClass({

  getDefaultProps() {
    return {
      avatarSize: 21,
      style: {},
    }

  },

  render(){
    const { roleList, avatarSize, style } = this.props

    const roleContent = (
      <div className={styles.rolesWrapper}>
        {roleList.map((v, k) => {
          return (
            <Avatar src={v.get('avatar')} textList={[v.get('roleTitle'), v.get('username')]} key={k}/>
          )
        })
        }
      </div>
    )
    const size = roleList.size
    return (
      <div className={styles.rolesContainer} style={style}>
        <Popover content={roleContent}>

          <div className={styles.rolesWrapper}>
            {roleList.map((v, k) => {
              if (k < 3){
                return (
                  <span className={styles.avatarWrapper} key={k} style={{ zIndex: size - k, left: 5 * k }}>
                    <img src={v.get('avatar')} style={{ width: avatarSize, height: avatarSize }}/>
                  </span>
                )
              }
            })}
          </div>
        </Popover>
      </div>
    )
  }
})

export default AvatarList
