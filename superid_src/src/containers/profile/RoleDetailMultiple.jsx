import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styles from './RoleDetail.scss'
import { fromJS, List } from 'immutable'
import { Select, Tag, Timeline, Button, Input, message, Form } from 'antd'
import classnames from 'classnames'
import permission from 'permission'
import config from '../../config'
import ExpatriateRoleCard from '../../components/card/ExpatriateRoleCard'
import messageHandler from '../../utils/messageHandler'
import { getAffairInfo } from '../../actions/affair'
import { fetchAffairPermission } from '../../actions/auth'

const Item = Timeline.Item
const FormItem = Form.Item

const LOGTYPE = {
  FUND: 1000,  //资金
  MATIRIAL: 1001, //物资
  AFFAIR: 1002, //事务
  ANNOUCEMENT: 1003, //发布
  TASK: 1004, //任务
  ROLE: 1005, //角色
  ALL: 0, //全部
}

const PUBLICTYPE = {
  ALL: 0, //全网公开
  ALLIANCE: 1, //盟内公开
  AFFAIR: 2, //事物内公开
  ADMIN: 3, //指定人员公开（私密）
}

const publicTypes = [
  PUBLICTYPE.ALL,
  PUBLICTYPE.ALLIANCE,
  PUBLICTYPE.AFFAIR,
  PUBLICTYPE.ADMIN,
]

const ROLE_TYPE = {
  MEMBER: 0,
  ROLE: 1,
}

const t = 324 //background的宽度

const RoleContainer = React.createClass({

  // contextTypes:{
  //   router:React.PropTypes.object,
  // },

  getInitialState() {
    return {
      isLoading: true,
      expatriateRoles: List(),
      activities: List(),
      currentActType: 0, //0代表全部
      scrollAction: { x: 'undefined', y: 'undefined' },
      scrollDirection: null,
      absoluteTop: -3,

      editTagMode: false,
      validateStatus: '',
      help: '',
      historyTypes: [],
      // isLoading: false,
      // roleId: 1000,
      // roleTitle: '前端开发工程师',
      // allianceName: 'bilibili',
      // affairName: '设计部',
      // username: '张文玘',
      // roleTags: fromJS(['hhh']),
      // avatar: '',
      // publicType: PUBLICTYPE.ALL,
      // expatriateRoles: fromJS([
      //   {
      //     expatriateRoleId: 1001,
      //     expatriateRoleTitle: 'Java工程师',
      //     expatriateAffairName: '开发部',
      //     expatriateAllianceName: '思目创意',
      //   }
      // ]),

      //   activities: fromJS([
      //     {
      //     time: '2017.09.19',
      //     subActs: fromJS([
      //       {
      //         actType: 1000, //actType: 1代表"任务"，2代表"资金"，3代表"事务",4代表"发布"
      //         roleId: 1000,
      //         log: 'JAVA工程师 陈树元 更新了任务［角色详情设计］的描述'
      //       }, {
      //         actType: 1001,
      //         roleId: 1000,
      //         log: 'JAVA工程师 陈树元 更新了任务［角色详情设计］的描述',
      //       }, {
      //         actType: 1001,
      //         roleId: 1000,
      //         log: 'JAVA工程师 陈树元 更新了任务［角色详情设计］的描述',
      //       }, {
      //         actType: 1001,
      //         roleId: 1000,
      //         log: 'JAVA工程师 陈树元 更新了任务［角色详情设计］的描述',
      //       }, {
      //         actType: 1001,
      //         roleId: 1000,
      //         log: 'JAVA工程师 陈树元 更新了任务［角色详情设计］的描述',
      //       }, {
      //         actType: 1001,
      //         roleId: 1000,
      //         log: 'JAVA工程师 陈树元 更新了任务［角色详情设计］的描述',
      //       }
      //     ])
      //   }
      //   ]),
      // roleIds: fromJS([1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008]),

    }
  },

  renderWidth() {
    const backgrounds = List(document.getElementsByClassName('background'))
    let width = 20
    backgrounds.forEach((background) => {
      width += parseInt(background.offsetWidth) + 20
    })
    this.tlContainer.style.width = width
  },

  componentDidMount() {

    const { isLoading, roleIds } = this.state
    if (isLoading){
      return
    }
    if (roleIds.size == 1){
      return
    }
    this.renderWidth()

  },

  componentDidUpdate() {
    const { isLoading, roleIds } = this.state
    if (isLoading){
      return
    }
    if (roleIds.size == 1){
      return
    }
    this.renderWidth()
  },

  componentWillMount() {

    //需要首先fetch当前查询角色的基本信息
    const affairId = this.props.params.affairId
    const optRoleId = this.props.params.optId
    const roleId = this.props.params.id

    this.props.getAffairInfo(affairId, optRoleId).then((res) => {
      if (res.code === 0) {
        fetch(config.api.permission.resourcePermission.get, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          affairId,
          roleId: optRoleId,
          body: JSON.stringify({
            affairId: affairId,
            roleId: optRoleId,
            resourceId: roleId,
            resourceType: 'ROLE',
          })
        }).then((res) => res.json()).then((json) => {

          this.setState({
            roleId,
            optRoleId,
            affairId,
            permissionList: json.operationIdList
          }, this.updateRole)

        })
      }
    })

    fetch(config.api.affair.role.history_types(), {
      method: 'GET',
      affairId: affairId,
      roleId: optRoleId,
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        res.data.push({ left: 0, right: '全部' })
        this.setState({
          historyTypes: res.data,
        })
      }
    })

  },

  updateRole() {
    const { roleId, optRoleId, activities, affairId } = this.state

    const types = List([LOGTYPE.AFFAIR, LOGTYPE.ROLE, LOGTYPE.ANNOUCEMENT, LOGTYPE.FUND, LOGTYPE.MATIRIAL, LOGTYPE.TASK])
    fetch(config.api.affair.role.get_role_info(), {
      method: 'GET',
      roleId: optRoleId,
      resourceId: roleId,
      affairId: affairId,
    }).then((res) => res.json()).then((res) => {
      if (res.code == 0) {
        const data = fromJS(res.data)
        const affairName = data.get('affairName')
        const roleTitle = data.get('roleTitle')
        const avatar = data.get('avatar')
        const allianceName = data.get('allianceName')
        const tags = data.get('tags')

        const type = data.get('type')
        const username = data.get('username')
        const expatriateAllianceName = data.get('actAllianceName')
        const expatriateRoleTitle = data.get('actRoleTitle')
        const expatriateAffairName = data.get('actAffairName')
        const roleType = data.get('roleType')

        const expatriateRoles = fromJS(data.get('expatriateRoleVOs'))

        let roleIds = fromJS([roleId])
        if (expatriateRoles.size !== 0) {
          expatriateRoles.forEach((ele) => {
            roleIds = roleIds.push(ele.get('roleId'))
          })
        }

        let formData = new FormData
        formData.append('roleIds', roleIds)
        formData.append('types', types)

        fetch(config.api.affair.role.history, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            roleIds: roleIds,
            types: types,
          }),
          affairId: this.props.params.affairId,
          roleId: this.props.params.optId,
        }).then((res) => res.json()).then((res) => {
          if (res.code == 0) {

            if (res.data == null) {

              this.setState({
                roleId: roleId,
                affairName: affairName,
                allianceName: allianceName,
                avatar: avatar,
                roleTitle: roleTitle,
                roleTags: tags,
                publicType: type,
                roleType,
                username: username,
                expatriateRoles: expatriateRoles,
                expatriateAllianceName: expatriateAllianceName,
                expatriateRoleTitle: expatriateRoleTitle,
                expatriateAffairName: expatriateAffairName,
                roleIds: roleIds,
                isLoading: false,
              })
            }

            let logList = fromJS(res.data)

            // logList = logList.sort((x, y) => {
            //   const time1 = new Date(x.get('createTime')).getTime()
            //   const time2 = new Date(y.get('createTime')).getTime()
            //   if (time1 < time2) {
            //     return -1
            //   } else {
            //     return 1
            //   }
            // })

            let newActivities = activities
            logList.forEach((ele) => {
              const date = new Date(ele.get('createTime'))
              const idx = newActivities.findIndex((act) => {
                if (this.compareDate(act.get('time'), date) == 0) {
                  return true
                }
              })

              if (idx >= 0) {
                //之前有这个日期的活动记录
                const activity = newActivities.get(idx)
                const log = fromJS({
                  actType: ele.get('type'),
                  roleId: ele.get('roleId'),
                  log: ele.get('operationLog'),
                })
                const subActs = activity.get('subActs').push(log)
                const act = activity.set('subActs', subActs)
                newActivities = newActivities.set(idx, act)
              } else {
                //之前没有这个日期的活动记录
                const activity = fromJS({
                  time: date,
                  subActs: fromJS([{
                    actType: ele.get('type'),
                    roleId: ele.get('roleId'),
                    log: ele.get('operationLog'),
                  }])
                })
                newActivities = newActivities.push(activity)
              }
            })
            newActivities = newActivities.sort((x, y) => {
              if (this.compareDate(x.get('time'), y.get('time')) < 0) {
                return 1
              } else {
                return -1
              }
            })
            this.setState({
              roleId: roleId,
              affairName: affairName,
              allianceName: allianceName,
              avatar: avatar,
              roleTitle: roleTitle,
              roleTags: tags,
              publicType: type,
              roleType,
              username: username,
              expatriateRoles: expatriateRoles,
              expatriateAllianceName: expatriateAllianceName,
              expatriateRoleTitle: expatriateRoleTitle,
              expatriateAffairName: expatriateAffairName,
              activities: newActivities,
              roleIds: roleIds,
              isLoading: false,
            })
          }
        })
      }
    })
  },

  updateType() {
    const { roleIds, currentActType, roleId, optRoleId, affairId, historyTypes } = this.state
    let types = List()
    if (currentActType == 0) {
      historyTypes.forEach((ele) => {
        types = types.push(ele.left)
      })
    } else {
      types = types.push(currentActType)
    }
    let formData = new FormData
    formData.append('roleIds', roleIds)
    formData.append('types', types)

    fetch(config.api.affair.role.history, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roleIds: roleIds,
        types: types,
      }),
      affairId: affairId,
      roleId: optRoleId,
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code == 0) {
        let logList = fromJS(res.data)
        logList = logList.sort((x, y) => {
          const time1 = new Date(x.get('createTime')).getTime()
          const time2 = new Date(y.get('createTime')).getTime()
          if (time1 < time2) {
            return -1
          } else {
            return 1
          }
        })

        let newActivities = List()
        logList.forEach((ele) => {
          const date = new Date(ele.get('createTime'))
          const idx = newActivities.findIndex((act) => {
            if (this.compareDate(act.get('time'), date) == 0) {
              return true
            }
          })

          if (idx >= 0) {
            //之前有这个日期的活动记录
            const activity = newActivities.get(idx)
            const log = fromJS({
              actType: ele.get('type'),
              roleId: ele.get('roleId'),
              log: ele.get('operationLog'),
            })
            const subActs = activity.get('subActs').push(log)
            const act = activity.set('subActs', subActs)
            newActivities = newActivities.set(idx, act)
          } else {
            //之前没有这个日期的活动记录
            const activity = fromJS({
              time: date,
              subActs: fromJS([{
                actType: ele.get('type'),
                roleId: ele.get('roleId'),
                log: ele.get('operationLog'),
              }])
            })
            newActivities = newActivities.push(activity)
          }
        })
        newActivities = newActivities.sort((x, y) => {
          if (this.compareDate(x.get('time'), y.get('time')) < 0) {
            return 1
          } else {
            return -1
          }
        })
        this.setState({
          roleId: roleId,
          activities: newActivities,
          roleIds: roleIds,
          isLoading: false,
        })
      }
    })
  },

  compareDate(date1, date2) {
    const year1 = date1.getYear()
    const year2 = date2.getYear()
    if (year1 < year2) {
      return -1
    } else if (year1 > year2) {
      return 1
    } else {
      const month1 = date1.getMonth()
      const month2 = date2.getMonth()
      if (month1 < month2) {
        return -1
      } else if (month1 > month2) {
        return 1
      } else {
        const day1 = date1.getDate()
        const day2 = date2.getDate()
        if (day1 < day2) {
          return -1
        } else if (day1 > day2) {
          return 1
        } else {
          return 0
        }
      }
    }
  },
  /* handler */
  handleShowPublicTypes(type) {
    switch (type) {
      case PUBLICTYPE.ALL:
        return '全网公开'
      case PUBLICTYPE.ALLIANCE:
        return '盟内公开'
      case PUBLICTYPE.AFFAIR:
        return '事务内公开'
      case PUBLICTYPE.ADMIN:
        return '私密'
      default:
        return '无对应角色公开性'
    }
  },

  handleShowActTypeTag(type) {
    switch (type) {
      case LOGTYPE.TASK:
        return (<Tag color="#6ca2f3">任务</Tag>)
      case LOGTYPE.FUND:
        return (<Tag color="#f27aa1">资金</Tag>)
      case LOGTYPE.AFFAIR:
        return (<Tag color="#926dea">事务</Tag>)
      case LOGTYPE.ANNOUCEMENT:
        return (<Tag color="#89ca89">发布</Tag>)
      case LOGTYPE.MATIRIAL:
        return (<Tag color="yellow">物资</Tag>)
      case LOGTYPE.ROLE:
        return (<Tag color="red">角色</Tag>)
    }
  },

  handleCardClick(roleId) {
    // this.setState({
    //   roleId: roleId
    // }, this.updateRole)
    // this.props.pushURL(`roleDetail/${roleId}`);

    window.open(`/roleDetail/${this.props.params.affairId}/${this.props.params.optId}/${roleId}`)
  },

  handleActTypeChange(value) {
    this.setState({
      currentActType: value
    }, this.updateType)
  },

  handleAddTag() {
    const tag = this.tagInput.refs.input.value
    if (tag.length < 1 || tag.length > 15) {
      this.setState({
        validateStatus: 'error',
        help: '标签字符长度为1-15'
      })
      return
    }
    const tagIdx = this.state.roleTags.findIndex((v) => v == tag)
    if (tagIdx >= 0) {
      this.setState({
        validateStatus: 'error',
        help: '该标签已存在'
      })
      return
    }
    const roleTags = this.state.roleTags.push(tag)
    this.updateTags(roleTags)
  },

  handleCancelAddTag() {
    this.setState({
      editTagMode: false,
      validateStatus: '',
      help: '',
    })
  },

  handleDeleteTags(tag) {
    const roleTags = this.state.roleTags.filter((v) => {
      return v !== tag
    })
    this.updateTags(roleTags)
  },

  updateTags(roleTags) {
    fetch(config.api.affair.role.edit_tags(), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      roleId: this.state.optRoleId,
      resourceId: this.state.roleId,
      affairId: this.state.affairId,
      body: JSON.stringify({
        tags: roleTags
      }),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          roleTags,
          editTagMode: false,
          validateStatus: '',
          help: ''
        }, message.success('修改成功'))
      } else {
        message.error('修改失败')
      }
    })
  },

  handlePublicTypeChange(type) {
    fetch(config.api.affair.role.modify_public_type(type), {
      method: 'GET',
      roleId: this.state.optRoleId,
      resourceId: this.state.roleId,
      affairId: this.state.affairId,
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          publicType: type
        }, message.success('修改成功'))
      } else {
        message.error('修改失败')
      }
    })
  },

  scrollFunc(e) {
    const { scrollAction, scrollDirection } = this.state
    let newScrollAction = scrollAction
    let newScrollDirection
    if (typeof scrollAction.x == 'undefined') {
      newScrollAction.x = e.target.scrollLeft
      newScrollAction.y = e.target.scrollTop
    }
    var diffX = newScrollAction.x - e.target.scrollLeft
    var diffY = newScrollAction.y - e.target.scrollTop

    //
    if (diffX < 0) {
      //     //向右滚动
      newScrollDirection = 'right'
    } else if (diffX > 0) {
      //     //向左滚动
      newScrollDirection = 'left'
    } else if (diffY > 0) {
      //向上滚动
      newScrollDirection = 'up'
    } else if (diffY < 0) {
      //向下滚动
      newScrollDirection = 'down'
    }
    //
    newScrollAction.x = e.target.scrollLeft
    newScrollAction.y = e.target.scrollTop
    this.setState({
      scrollAction: newScrollAction,
      scrollDirection: newScrollDirection,
    }, this.onScroll(e, scrollDirection, newScrollDirection))

  },

  onScroll(e, lastDirection, scrollDirection) {
    const { absoluteTop } = this.state
    const tails = List(document.getElementsByClassName('ant-timeline-item-tail'))
    const heads = List(document.getElementsByClassName('ant-timeline-item-head'))
    const times = List(document.getElementsByClassName('time'))
    const backgrounds = List(document.getElementsByClassName('background'))
    const titles = List(document.getElementsByClassName('bgTitle'))
    if (scrollDirection == 'down' || scrollDirection == 'up') {
      tails.forEach((tail) => {
        tail.style.position = 'absolute'
        tail.style.left = 5 + e.target.scrollLeft
        tail.style.top = absoluteTop
      })
      heads.forEach((head) => {
        head.style.position = 'absolute'
        head.style.left = -14 + e.target.scrollLeft
        head.style.top = absoluteTop
      })
      times.forEach((time) => {
        time.style.position = 'absolute'
        time.style.left = 25 + e.target.scrollLeft
        time.style.top = absoluteTop
      })
      backgrounds.forEach((background) => {
        background.style.position = 'fixed'
        let left = this.getElementAbsPosition(background).left

        if (lastDirection == 'left' || lastDirection == 'right' || !lastDirection) {
          left = left + t - e.target.scrollLeft - 25
        }
        background.style.top = 150
        background.style.left = left
      })
      titles.forEach((title) => {
        title.style.position = 'fixed'
        let left = this.getElementAbsPosition(title).left

        if (lastDirection == 'left' || lastDirection == 'right' || !lastDirection) {
          left = left + t - e.target.scrollLeft - 25
        }
        title.style.top = 133
        title.style.left = left
      })

    } else if (scrollDirection == 'left' || scrollDirection == 'right') {
      tails.forEach((tail) => {

        let top = this.getElementAbsPosition(tail).top
        if (lastDirection == 'up' || lastDirection == 'down') {
          top -= e.target.scrollTop
        }
        tail.style.position = 'fixed'
        tail.style.left = 325
        tail.style.top = top

      })
      heads.forEach((head) => {

        let top = this.getElementAbsPosition(head).top - 6
        if (lastDirection == 'up' || lastDirection == 'down') {
          top -= e.target.scrollTop
        }
        head.style.position = 'fixed'
        head.style.left = 306
        head.style.top = top
      })
      times.forEach((time) => {
        let top = this.getElementAbsPosition(time).top
        if (lastDirection == 'up' || lastDirection == 'down') {
          top -= e.target.scrollTop
        }
        time.style.position = 'fixed'
        time.style.left = 342
        time.style.top = top
      })
      backgrounds.forEach((background, idx) => {
        background.style.position = 'absolute'
        background.style.top = 90 + e.target.scrollTop
        background.style.left = 25 + (idx) * t
      })
      titles.forEach((title, idx) => {
        title.style.position = 'absolute'
        title.style.top = 67 + e.target.scrollTop
        title.style.left = 25 + (idx) * t
      })
    }
  },

  getElementAbsPosition(e) {
    let t = e.offsetTop
    let l = e.offsetLeft
    while ((e = e.offsetParent)) {
      t += e.offsetTop
      l += e.offsetLeft
    }

    return { left: l, top: t }
  },

  renderSidebar() {
    const {
      allianceName,
      affairName,
      roleTitle,
      publicType,
      roleTags,
      expatriateRoles,
      expatriateRoleTitle,
      // expatriateAllianceName,
      expatriateAffairName,
      avatar,
      roleType,
      username,

      editTagMode, // 是否为编辑标签的模式

      validateStatus, // 添加标签时的检验
      help,  // 添加标签时的检验

      permissionList,
    } = this.state

    const Option = Select.Option
    let canEditRole = false
    if (permissionList.indexOf(permission.EDIT_ROLE_INFO) >= 0) {
      canEditRole = true
    }

    return (
      <div className={styles.sidebar}>
        <div className={styles.title}>
          <h1>{roleTitle}</h1>
          <p>{allianceName}-{affairName}</p>
        </div>
        <div className={styles.user}>
          <p className={styles.partTitle}>担任者:</p>

          <div className={styles.userContent}>
            <img src={avatar} alt="用户头像"/>
            <span className={styles.userName}>
              {roleType == ROLE_TYPE.MEMBER ? username : expatriateRoleTitle + ' ' + expatriateAffairName + '-' + username}

            </span>
          </div>
        </div>

        <div className={styles.public}>
          <p className={styles.partTitle}>角色公开性:</p>
          { canEditRole ?
            <Select defaultValue={publicType.toString()} onChange={this.handlePublicTypeChange}>
              {publicTypes.map((type) => {
                return (
                  <Option value={type.toString()} key={type}>
                    {this.handleShowPublicTypes(type)}
                  </Option>
                )
              })}
            </Select>
            :
            <span>{this.handleShowPublicTypes(publicType.toString())}</span>
          }

        </div>


        <div className={styles.tags}>
          <p className={styles.partTitle}>角色标签:</p>
          {roleTags.size === 0 ? null :
              roleTags.map((tag) => {
                return (
                  <Tag key={tag} closable={canEditRole} afterClose={() => this.handleDeleteTags(tag)} style={{ marginBottom: 5 }}>{tag}</Tag>
                )
              })
              }
          {editTagMode &&
          <Form layout="inline" style={{ display: 'inline' }}>
            <FormItem
              validateStatus={validateStatus}
              help={help}
            >
              <Input
                ref={(el) => this.tagInput = el}
                size="small"
                style={{ width: 78 }}
                autoFocus="autoFocus"
                onBlur={this.handleCancelAddTag}
                onPressEnter={this.handleAddTag}
              />
            </FormItem>
          </Form>

              }
          {canEditRole && !editTagMode && <Button size="small" type="dashed" onClick={() => this.setState({ editTagMode: true })}>+</Button>}
        </div>



        {expatriateRoles.size !== 0 ?
          (<div className={styles.expatriateRoles}>
            <p className={styles.partTitle}>外派角色:</p>
            {expatriateRoles.map((ele, key) => {
              return (
                <ExpatriateRoleCard
                  key={key}
                  roleId={ele.get('roleId')}
                  roleTitle={ele.get('roleTitle')}
                  affairName={ele.get('affairName')}
                  allianceName={ele.get('allianceName')}
                  clickCallback={this.handleCardClick}
                />)
            })}

          </div>) :
          null}
      </div>)
  },

  renderSingleRoleLogs() {
    const { activities } = this.state
    return (

      <Timeline style={{ marginTop: 0 }}>
        <div className={styles.role}>
          {activities.map((activity, key) => {
            return (
              <Item
                dot={<span className={styles.lineDots}/>}
                key={key}
              >
                <div className="time" style={{ height: 30, position: 'absolute' }}>
                  <div>{activity.get('time').getFullYear()}.{activity.get('time').getMonth()}.{activity.get('time').getDate()}</div>
                </div>
                <div className={styles.itemContent}>
                  {activity.get('subActs').map((subAct, key) => {
                    return (
                      <div key={key}>
                        <p className={styles.singleActInfo}>
                          <span className={styles.actType}>{this.handleShowActTypeTag(subAct.get('actType'))}</span>
                          <span className={styles.actContent}>{subAct.get('log')}</span>
                        </p>
                        <br/>
                      </div>
                    )
                  })}
                </div>
              </Item>)
          })}
        </div>
        <div className={styles.div2}/>

      </Timeline>

    )
  },

  renderMultiRoleLogs() {
    const { roleTitle, allianceName, affairName, expatriateRoles, activities, roleIds } = this.state

    return (
      <div className={styles.timeLineContainer} ref={(el) => this.tlContainer = el}>
        <div className={styles.backgrounds}>
          <div className={classnames([styles.background], 'background')}
            style={{ left: '20px' }}
          />
          <div className={classnames([styles.bgTitle], 'bgTitle')} style={{ left: '20px' }}>
            {roleTitle} {allianceName}-{affairName}
          </div>

          {expatriateRoles.map((ele, key) => {
            const id = ele.get('roleId')
            const roleIdx = roleIds.findIndex((roleID) => {
              return roleID == id
            })
            return (
              <div key={key}>
                <div className={classnames([styles.background], 'background')}
                  style={{ left: 20 + t * (roleIdx) }}
                />
                <div className={classnames([styles.bgTitle], 'bgTitle')} style={{ left: 20 + t * roleIdx }}>
                  {ele.get('roleTitle')} {ele.get('allianceName')}-{ele.get('affairName')}
                </div>
              </div>
            )
          })}
        </div>
        <Timeline className={styles.timeLine}>
          {activities.map((act, key) => {
            const time = act.get('time')
            const subAct = act.get('subActs')
            return (
              <Item dot={<span className={styles.lineDots}/>} key={key}>
                <div className="time" style={{ height: 30, position: 'absolute' }}>
                  <div>
                    {time.getFullYear()}.{time.getMonth() + 1}.{time.getDate()}
                    {/*{time}*/}
                  </div>
                </div>
                <div className={styles.itemContent}>
                  {subAct.map((ele, key) => {
                    const actType = ele.get('actType')
                    const roleId = ele.get('roleId')
                    const log = ele.get('log')

                    const roleIdIdx = roleIds.findIndex((roleID) => {
                      return roleID == roleId
                    })
                    return (
                      <p
                        className={styles.role}
                        key={key}
                        style={{ marginLeft: roleIdIdx * t, display: 'block', minWidth: 270, maxWidth: 270 }}
                      >
                        <span className={styles.actType}>{this.handleShowActTypeTag(actType)}</span>
                        <span className={styles.actContent}>{log}</span>
                      </p>
                    )
                  })}

                </div>
              </Item>
            )
          })}
        </Timeline>
      </div>
    )
  },

  renderContent() {
    const { currentActType, expatriateRoles, historyTypes } = this.state
    const Option = Select.Option


    return (
      <div className={styles.content} onScroll={this.scrollFunc}>
        <div className={styles.title}>
          <h2 style={{ float: 'left' }}>角色活动记录</h2>
          <div className={styles.actTypes}>
            <span className={styles.actTypeSpan}>记录类型：</span>
            <Select defaultValue={currentActType.toString()} onChange={this.handleActTypeChange}>
              {historyTypes.map((value) => {
                return (
                  <Option value={value.left.toString()} key={value.left}>
                    {value.right}
                  </Option>
                )
              })}
            </Select>
          </div>
        </div>
        <div className={styles.details}>
          <div className={styles.detailCover}/>
          {/*这里需要添加几个没有内容的div，用于呈现不同外派角色的下方背景（原因：ant的时间线组件只能通过margin来对其，如果有多个timeline组件的话没有办法按照
          时间顺序排列，所以就用了这个笨方法，都用同一个timeline组件，并加一个假的下方包含div，
          定义每个div的宽度并在每次右移的时候让 下方div 和 时间线组件 都右移一个div的宽度*/}

          {expatriateRoles.size == 0 ?
            this.renderSingleRoleLogs() :
            this.renderMultiRoleLogs()
          }

        </div>

      </div>
    )

  },


  render() {
    const { isLoading } = this.state
    return (
      isLoading ? null :
      <div className={styles.container}>
        {this.renderSidebar()}
        {this.renderContent()}
      </div>
    )
  }


})

function mapStateToProps(state, props) {
  return {
    user: state.get('user'),
    permissionMap: state.getIn(['affair', 'affairMap', props.params.affairId, 'permissionMap']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchAffairPermission: bindActionCreators(fetchAffairPermission, dispatch),
    getAffairInfo: bindActionCreators(getAffairInfo, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(RoleContainer)
