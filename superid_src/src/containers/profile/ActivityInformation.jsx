import React from 'react'
import { connect } from 'react-redux'
import styles from './ActivityInformation.scss'
import { fromJS, List } from 'immutable'
import config from '../../config'
import AffairRoleCard from '../../components/card/AffairRoleCard'
import AffairAvatar from '../../components/avatar/AffairAvatar'
import { Card } from 'antd'
import messageHandler from '../../utils/messageHandler'


const ALLIANCE_TYPE = {
  PERSONAL: 0,
  OTHERS: 1,
}

const ActivityInformation = React.createClass({
  getInitialState() {
    return {
      isLoading: true,
      alliances: List(),
    }

  },
  componentWillMount() {

    fetch(config.api.affair.role.get_alliance_role_info, {
      method: 'GET',
      credentials: 'include',
      roleId: this.props.user.get('personalRoleId'),
      affairId: this.props.user.get('personalAffairId')
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code === 0){
        const result = fromJS(res.data)
        let alliances = List()
        result.forEach((alliance) => {
          const allianceId = alliance.get('allianceId')
          const allianceIdx = alliances.findIndex((a) => {
            return a.get('id') === allianceId
          })
          if (allianceIdx >= 0){
            //当前alliancelist中已经存在这个盟，查询事务是否存在
            // console.log('盟存在')
            const expatriateAffairs = alliances.getIn([allianceIdx, 'expatriateAffairs'])
            const expatriateRoleVOS = alliance.get('expatriateRoleVOS')
            const newExpatriateAffairs = this.getNewExpatriateAffairs(expatriateRoleVOS, expatriateAffairs)

            // console.log(newExpatriateAffairs);
            alliances = alliances.setIn([allianceIdx, 'expatriateAffairs'], newExpatriateAffairs)

          } else {
            //当前alliancelist中不存在这个盟，直接将其push进去
            // console.log('盟不存在');
            const expatriateRoleVOS = alliance.get('expatriateRoleVOS')
            let expatriateAffairs = this.getNewExpatriateAffairs(expatriateRoleVOS, List())

            // console.log(expatriateAffairs);

            const newAlliance = fromJS({
              id: allianceId,
              name: alliance.get('allianceName'),
              avatar: alliance.get('allianceAvatar'),
              inTime: new Date(alliance.get('time')),
              exitTime: alliance.get('state') === 1 ? new Date(alliance.get('endTime')) : null, // state 为1代表失效事务，即当前用户已经退出该事务
              type: alliance.get('type'),
              expatriateRolesNum: alliance.get('count'),
              affair: {
                affairId: alliance.get('affairId'),
                affairName: alliance.get('affairName') ? alliance.get('affairName') : '',
                ownerRoleId: alliance.get('ownerRoleId'),
                // 显示根事务的头像
                level: 1,
              },
              role: {
                roleId: alliance.get('roleId'),
                roleTitle: alliance.get('roleTitle'),
                state: alliance.get('state'),
                belongAffairName: alliance.get('affairName') ? alliance.get('affairName') : '',
              },
              expatriateAffairs: expatriateAffairs,
            })
            alliances = alliances.push(newAlliance)
          }
        })

        alliances = alliances.sort((x, y) => {
          //个人盟永远置顶
          if (x.get('type') == ALLIANCE_TYPE.PERSONAL){
            return -1
          } else if (y.get('type') == ALLIANCE_TYPE.PERSONAL){
            return 1
          } else {
            //如果有还未推出的盟则排前
            if (x.get('exitTime') === null){
              //进入时间晚的在前面
              if (x.get('inTime').getTime() > y.get('inTime').getTime()){
                return -1
              } else if (x.get('inTime').getTime() < y.get('inTime').getTime()){
                return 1
              } else {
                return 1
              }

            } else if (y.get('exitTime') === null){
              //进入时间晚的在前面
              if (x.get('inTime').getTime() > y.get('inTime').getTime()){
                return -1
              } else if (x.get('inTime').getTime() < y.get('inTime').getTime()){
                return 1
              } else {
                return -1
              }
            } else {
              //进入时间晚的在前面
              if (x.get('inTime').getTime() > y.get('inTime').getTime()){
                return -1
              } else {
                return 1
              }
            }
          }
        })

        this.setState({
          alliances: alliances,
          isLoading: false,
        })
      }
    })

  },
  getNewExpatriateAffairs(expatriateRoleVOS, expatriateAffairs){
    expatriateRoleVOS.forEach((role) => {
      const affairId = role.get('affairId')
      const affairIdx = expatriateAffairs.findIndex((exAffair) => {
        return exAffair.getIn(['affair', 'affairId']) === affairId
      })
      if (affairIdx >= 0){
        //外派事务列表中已经存在当前事务
        let roles = expatriateAffairs.get(affairIdx).get('roles')
        const newRole = fromJS({
          roleId: role.get('roleId'),
          roleTitle: role.get('roleTitle')
        })
        roles = roles.push(newRole)
        expatriateAffairs = expatriateAffairs.setIn([affairIdx, 'roles'], roles)
      } else {
        //外派事务列表中不存在当前事务
        const exAffair = fromJS({
          allianceId: role.get('allianceId'),
          allianceName: role.get('allianceName'),
          affair: {
            affairId: role.get('affairId'),
            affairName: role.get('affairName') ? role.get('affairName') : '',
            affairAvatar: role.get('avatar'),

            // add to test
            level: role.get('level'),
            shortName: role.get('shortName')
          },
          roles: [
            {
              roleId: role.get('roleId'),
              roleTitle: role.get('roleTitle'),
            }
          ]
        })
        expatriateAffairs = expatriateAffairs.push(exAffair)
      }
    })
    return expatriateAffairs
  },
  /* clickHandler */

  handleRoleDetails(roleId) {
    const { user } = this.props
    setTimeout(function(){
      window.open(`/roleDetail/${user.get('personalAffairId')}/${user.get('personalRoleId')}/${roleId}`)
    }, 1)

    //fetch操作获取对应盟中对应角色的具体信息，并作为props传给 roleDetails 的页面
  },

  /* window resize handler */
  handleWindowResize() {
    // this.forceUpdate()
  },


  /* render */
  renderAlliance(alliance) {
    //index，为查询得到的盟列表中的索引值
    const avatar = alliance.get('avatar')
    const name = alliance.get('name')
    const inTime = alliance.get('inTime')
    const exitTime = alliance.get('exitTime')

    const role = alliance.get('role')

    const affair = alliance.get('affair')

    let expatriateRolesNum = 0
    const expatriateAffairs = alliance.get('expatriateAffairs')
    expatriateAffairs.forEach((ele) => {
      const roles = ele.get('roles')
      expatriateRolesNum += roles.size * 1
    })

    const cardAffair = fromJS({
      id: affair.get('affairId'),
      roleId: role.get('roleId'),
      ownerRoleId: affair.get('ownerRoleId'),
    })

    const ifRootAffair = role.get('belongAffairName') ? false : true
    const cardMember = {
      state: role.get('state'),
      allianceName: name,
      roleId: role.get('roleId'),
      roleTitle: role.get('roleTitle'),
      belongAffairName: role.get('belongAffairName'),
      ifRootAffair: ifRootAffair,
      affairName: affair.get('affairName') ? affair.get('affairName') : null,
      allianceId: alliance.get('id'),

    }


    const exitString = exitTime ? exitTime.getFullYear() + '年' + (exitTime.getMonth() + 1) + '月' + exitTime.getDate() + '日' : '至今'

    return (
      <Card className={styles.allianceCard}>
        <div className={styles.allianceHead}>
          <div className={styles.allianceAvatar}>
            <AffairAvatar previewURL={avatar} sideLength={30} affair={affair} />
          </div>
          <span className={styles.allianceName}>{name}</span>
          <span className={styles.time}>
              加入时间：{inTime.getFullYear()}年{inTime.getMonth() + 1}月{inTime.getDate()}日-{exitString}
          </span>
        </div>
        <div className={styles.allianceBody}>
          <div className={styles.rootRole}>
            成员角色：
            <div className={styles.rootRoleCard}>
              <AffairRoleCard
                affair={cardAffair}
                member={cardMember}
                isHistory={false}
                isPrimaryAffair={false}
                // showRoleDetails={this.handleRoleDetails.bind(null, role.get('roleId'))}
                fromAllianceRoleCard
              />
              {expatriateRolesNum !== 0 &&
              <div className={styles.flag}>
                <span>{expatriateRolesNum}</span>
              </div>}
            </div>
          </div>
          {expatriateRolesNum === 0 ? null : (
            <div className={styles.expatriateRoles}>
              外派角色：
              {expatriateAffairs.map((ele) => {
                const allianceName = ele.get('allianceName')
                const affair = ele.get('affair')
                const roles = ele.get('roles')
                return (
                  <div className={styles.affair} key={affair.get('affairId')}>
                    <div className={styles.avatar}>
                      <AffairAvatar affair={affair} sideLength={30} previewURL={affair.get('affairAvatar')}/>
                    </div>
                    <div className={styles.name}>{allianceName}
                      {affair.get('affairName') && '-' + affair.get('affairName')}
                    </div>
                    |
                    <div className={styles.roles}>
                      {roles.map((r, idx) => {
                        return (
                          <span className={styles.roleTitle} onClick={this.handleRoleDetails.bind(null, r.get('roleId'))} key={idx}>
                            {idx === 0 ? r.get('roleTitle') : '、' + r.get('roleTitle')}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>
    )
  },


  render() {
    const { alliances, isLoading } = this.state
    // for(let i = 0; i < alliances.size; i++){
    //   console.log("i is " + i+", slidex is " + alliances.get(i).get("slideX"));
    // }

    return (
      isLoading ? null :
      <div className={styles.activityContainer} ref={(el) => {
        this.contWidth = el
      }}
      >
        {
            alliances.map((alliance) => {
              return (
                <div className={styles.alliance} key={alliance.get('id')}>
                  {this.renderAlliance(alliance)}
                </div>)
            })
          }
      </div>
    )

  }
})

function mapStateToProps(state) {
  return {
    user: state.get('user')
  }
}


export default connect(mapStateToProps)(ActivityInformation)
