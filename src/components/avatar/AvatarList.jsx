import React from 'react'
import { Popover } from 'antd'
import styles from './AvatarList.scss'
import RoleItem from '../RoleItem'


//未完成，重叠起来的头像列表，hover显示所有人的"头像 角色名-用户名"列表
class AvatarList extends React.Component{

  render(){
    const { roleList } = this.props

    const roleContent = (
      <div className={styles.rolesWrapper}>
        {roleList.map((v, k) => {
          return (
            <RoleItem role={v} key={k}/>
          )
        })
        }
      </div>
    )
    return (
      <div className={styles.rolesContainer}>
        <Popover content={roleContent}>
          {/*<div className={styles.rolesWrapper}>*/}
          {/*<div className={styles.avatarWrapper} style={{ backgroundColor:'red', right:0 }}>*/}
          {/*<img src="#"/>*/}
          {/*</div>*/}
          {/*<div className={styles.avatarWrapper} style={{ backgroundColor: 'green', right: 5 }}>*/}
          {/*<img src="#"/>*/}
          {/*</div>*/}
          {/*<div className={styles.avatarWrapper} style={{ backgroundColor: 'yellow', right: 10 }}>*/}
          {/*<img src="#"/>*/}
          {/*</div>*/}
          {/*</div>*/}
          <div className={styles.rolesWrapper}>
            {roleList.map((v, k) => {
              if (k < 3){
                return (
                  <span className={styles.avatarWrapper} key={k} style={{ right: 5 * k }}>
                    {v.get('avatar') ?
                      <img src={v.get('avatar')} />
                      :
                      <span className={styles.defaultAvatar} />
                    }

                  </span>
                )
              }
            })}
          </div>
        </Popover>
      </div>
    )
  }
}

export default AvatarList
