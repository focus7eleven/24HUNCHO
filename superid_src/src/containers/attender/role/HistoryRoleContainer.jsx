import React from 'react'
import styles from './CurrentRoleContainer.scss'
import { Switch, notification } from 'antd'
import { SearchIcon, LoadMoreIcon, DropUpIcon } from 'svg'
import { connect } from 'react-redux'
import AffairRoleCard from '../../../components/card/AffairRoleCard'
import DelayedInput from '../../../components/input/DelayedInput'
import { getAffairRoles } from '../../../actions/affair'
import { bindActionCreators } from 'redux'
import { List } from 'immutable'
import imageNoPeople from 'images/img_no_people.png'
import config from '../../../config'
import ChangeRoleModal from './ChangeRoleModal'
import PERMISSION from 'utils/permission'


let HistoryRoleContainer = React.createClass({
  getInitialState() {
    return {
      isContainChildren: false,
      queryString: '',
      // enableRoleModal: false,
      member: null,
      canrRender: false,
      isExpanded: List(),
      isGot: List(),
      hasShownMoreInvalid: List(),
      hasShownMoreOutAlliance: List(),
      isSearching: false,
      chosenRole: null,
      showEnableRole: false,
      roleModalType: 0,
      searchResult: {},
    }
  },
  componentWillMount(){
    let { affair } = this.props
    this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), false).then(() => {
      this.setState({
        canRender: true,
      })
    })
  },
  componentWillReceiveProps(nextProps){
    let { affair } = nextProps
    if (nextProps.affair.get('id') != this.props.affair.get('id')) {
      this.setState(this.getInitialState())
      this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), false).then(() => {
        this.setState({
          canRender: true,
          isExpanded: List(),
          isGot: List(),
        })
      })
    }
  },
  handleChildrenSwitch(checked) {
    let { affair } = this.props

    if (this.state.isSearching) {
      fetch(config.api.affair.role.current(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        roleId: affair.get('roleId'),
        affairId: affair.get('id'),
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          key: this.state.keyword,
          lastTitlePY: '',
          limit: 20,
          active: false,
          containChild: checked,
        })
      }).then((res) => res.json()).then((json) => {
        if (json.code == 0){
          this.setState({
            isSearching: true,
            searchResult: json.data || {},
            isContainChildren: checked,
          })
        }
      })
    }
    else {
      this.setState({
        isContainChildren: checked
      })
      // let currentAffair = historyRoles.get(affair.get('id'))
      // let children = currentAffair.affairs
      // let beforeLength = historyRoles.size
      // children.map((v) => {
      //   if (!this.state.isGot.includes(v.id)){
      //     this.props.getAffairRoles(affair.get('roleId'), v.id, false).then(() => {
      //       if ((this.props.historyRoles.size - beforeLength) == children.length){
      //         this.setState({
      //           isContainChildren: !this.state.isContainChildren,
      //           isExpanded: this.state.isExpanded.push(v.id),
      //           isGot: this.state.isGot.push(v.id),
      //         })
      //       }
      //       else {
      //         this.setState({
      //           isExpanded: this.state.isExpanded.push(v.id),
      //           isGot: this.state.isGot.push(v.id),
      //         })
      //       }
      //
      //     })
      //   }
      //   else {
      //     this.setState({
      //       isContainChildren: !this.state.isContainChildren,
      //     })
      //   }

      // })
    }
  },

  handleChangeQueryString(e){
    this.setState({
      queryString: e.target.value
    })
  },

  handleCloseEnableRoleModal() {
    this.setState({
      enableRoleModal: false
    })
  },

  /* Card Handle */
  handleOpenEnableRoleModal(member) {
    member && this.setState({
      enableRoleModal: true,
      member: member
    })
  },
  handleSwitchShow(affairId){
    let { affair } = this.props
    if (!this.state.isGot.includes(affairId)){
      this.props.getAffairRoles(affair.get('roleId'), affairId, false).then(() => {
        if (this.state.isExpanded.includes(affairId)){
          this.setState({
            isExpanded: this.state.isExpanded.filter((v) => v != affairId),
            isGot: this.state.isGot.push(affairId),
          })
        }
        else {
          this.setState({
            isExpanded: this.state.isExpanded.push(affairId),
            isGot: this.state.isGot.push(affairId),
          })
        }
      })
    }
    else {
      if (this.state.isExpanded.includes(affairId)){
        this.setState({
          isExpanded: this.state.isExpanded.filter((v) => v != affairId)
        })
      }
      else {
        this.setState({
          isExpanded: this.state.isExpanded.push(affairId)
        })
      }
    }
  },
  hasExpanded(affairId){
    return this.state.isExpanded.includes(affairId)
  },
  hasShownMoreInvalid(affairId){
    return this.state.hasShownMoreInvalid.includes(affairId)
  },
  hasShownMoreOutAlliance(affairId){
    return this.state.hasShownMoreOutAlliance.includes(affairId)
  },
  handleShowMoreInvalid(affairId){
    this.setState({
      hasShownMoreInvalid: this.state.hasShownMoreInvalid.push(affairId),
    })
  },
  handleShowMoreOutAlliance(affairId){
    this.setState({
      hasShownMoreOutAlliance: this.state.hasShownMoreOutAlliance.push(affairId)
    })
  },
  handleSearchOnchange(value){
    const { affair } = this.props
    if (value == '') {
      this.setState({ isSearching: false })
      return
    }
    fetch(config.api.affair.role.current(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      roleId: affair.get('roleId'),
      affairId: affair.get('id'),
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        key: value,
        lastTitlePY: '',
        limit: 20,
        active: false,
        containChild: this.state.isContainChildren,
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.setState({
          isSearching: true,
          searchResult: json.data || {},
        })
      }
    })
  },
  handleSearchEnter(event){
    const { affair } = this.props
    if (event.keyCode == 13){
      fetch(config.api.affair.role.current(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        roleId: affair.get('roleId'),
        affairId: affair.get('id'),
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          key: event.target.value,
          lastTitlePY: '',
          limit: 20,
          active: false,
          containChild: this.state.isContainChildren,
        })
      }).then((res) => res.json()).then((json) => {
        if (json.code == 0){
          this.setState({
            isSearching: true,
            searchResult: json.data || {},
            keyword: event.target.value,
          })
        }
      })
    }
  },
  handleInviteRole(role){
    const { affair } = this.props
    fetch(config.api.affair.invite.role(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        allianceRoles: role.allianceId == affair.get('allianceId') ? [role.roleId] : [],
        outAllianceRoles: role.allianceId == affair.get('allianceId') ? [role.roleId] : [],
      }),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        notification.success({
          message: '邀请成功!',
          description: '请等待对方处理邀请'
        })
      }
      else {
        notification.error({
          message: '邀请发送失败!',
        })
      }
    })
  },
  handleEnableRole(role){
    this.setState({
      chosenRole: role,
      showEnableRole: true,
      roleModalType: 1,
    })
  },
  renderHeader() {
    const { affair } = this.props
    return (
      <div className={styles.header}>
        <div>
          {/* 搜索角色 */}
          <div className={styles.searchField} style={{ margin: '0 0 0 20px' }}>
            <DelayedInput
              placeholder={'请输入关键词'}
              style={{ paddingLeft: 8 }}
              onChange={this.handleSearchOnchange}
            />
            <span className={styles.searchIcon}><SearchIcon/></span>
          </div>
        </div>
        {affair.validatePermissions(PERMISSION.CHECK_CHILD_AFFAIR_ROLE) &&
          <div style={{ marginRight: '16px' }}>
            <div style={{ color: '#4a4a4a', marginLeft: 30 }}>包含子事务</div>
            <Switch style={{ marginLeft: 10 }} checked={this.state.isContainChildren} checkedChildren="开" unCheckedChildren="关" onChange={this.handleChildrenSwitch}/>
          </div>
        }
      </div>
    )
  },
  renderChildrenNode(affairId) {
    let { historyRoles } = this.props
    let children = historyRoles.get(affairId).affairs

    return children != [] ? children.map((affair) => {
      let hasExpanded = this.hasExpanded(affair.id)
      let left = 35 + (affair.level - 1) * 20
      if (!historyRoles.get(affair.id)){
        return (<div className={styles.childrenBox} key={affair.id}>
          <div className={styles.childrenTitle} style={{ paddingLeft: `${left}px` }}>
            <div className={styles.titleContainer}>
              {/*<AffairAvatar affair={affair} sideLength={40}></AffairAvatar>*/}
              <span className={styles.affairName}>{affair.name}</span>
            </div>
            <DropUpIcon height="20" fill="#666666" onClick={this.handleSwitchShow.bind(null, affair.id)} style={hasExpanded ? { transform: 'rotate(0)' } : { transform: 'rotate(180deg)' }}/>
          </div>
        </div>)
      }
      let inValidNum = 0
      let outAllianceNum = 0
      let currentAffair = historyRoles.get(affair.id)
      currentAffair.roles = currentAffair.roles.concat(currentAffair.allianceRoles).concat(currentAffair.guestRoles)
      currentAffair.roles.map((role) => {
        if (role.belongAffairId == affair.id){
          inValidNum++
        }
        else {
          outAllianceNum++
        }
      })
      return (<div className={styles.childrenBox} key={affair.id}>
        <div className={styles.childrenTitle} style={{ paddingLeft: `${left}px` }}>
          <div className={styles.titleContainer}>
            {/*<AffairAvatar affair={affair} sideLength={40}></AffairAvatar>*/}
            <span className={styles.affairName}>{affair.name}</span>
          </div>
          <DropUpIcon height="20" fill="#666666" onClick={this.handleSwitchShow.bind(null, affair.id)} style={hasExpanded ? { transform: 'rotate(0)' } : { transform: 'rotate(180deg)' }}/>
        </div>
        {
          hasExpanded ? currentAffair.roles.length != 0 ? <div className={styles.childContent}>
            <div className={styles.show}>
              <div className="u-text-12">停用角色：</div>
              <div className={styles.cardContainer}>
                {
                  currentAffair.roles.map((role, num) => {
                    if (num < 6){
                      return role.belongAffairId == affair.id ? <AffairRoleCard affair={this.props.affair} member={role} key={role.roleId} isHistory hasLeftAffair={false} enableRole={this.handleEnableRole.bind(null, role)}/> : null
                    }
                  })
                }
                {
                  this.hasShownMoreInvalid(affair.id)
                    ? currentAffair.roles.map((role, num) => {
                      if (num > 5){
                        return role.belongAffairId == affair.id ? <AffairRoleCard affair={this.props.affair} member={role} key={role.roleId} isHistory hasLeftAffair={false} enableRole={this.handleEnableRole.bind(null, role)}/> : null
                      }
                    }) : null
                }
              </div>
              {
                ((inValidNum > 6) && (!this.hasShownMoreInvalid(affair.id)))
                  ? <div className={styles.loadMore}>
                    <div onClick={this.handleShowMoreInvalid.bind(null, affair.id)}>
                      显示更多停用角色
                      <span><LoadMoreIcon /></span>
                    </div>
                  </div> : null
              }
            </div>
            <div className={styles.show}>
              <div className="u-text-12">离开事务角色：</div>
              <div className={styles.cardContainer}>
                {
                  currentAffair.roles.map((role, num) => {
                    if (num < 6){
                      return role.belongAffairId != affair.id ? <AffairRoleCard affair={this.props.affair} member={role} key={role.roleId} isHistory hasLeftAffair inviteRole={this.handleInviteRole.bind(null, role)}/> : null
                    }
                  })
                }
                {
                  this.hasShownMoreOutAlliance(affair.id)
                    ? currentAffair.roles.map((role, num) => {
                      if (num > 5){
                        return role.belongAffairId != affair.id ? <AffairRoleCard affair={this.props.affair} member={role} key={role.roleId} isHistory hasLeftAffair inviteRole={this.handleInviteRole.bind(null, role)}/> : null
                      }
                    }) : null

                }
              </div>
              {
                ((outAllianceNum > 6) && (!this.hasShownMoreOutAlliance(affair.id)))
                  ? <div className={styles.loadMore}>
                    <div onClick={this.handleShowMoreOutAlliance.bind(null, affair.id)}>
                      显示更多离开事务角色
                      <span><LoadMoreIcon /></span>
                    </div>
                  </div> : null
              }
            </div>

            {affair.affairs != [] ? this.renderChildrenNode(affair.id) : null}
          </div>
              : <div className={styles.noRole}><img src={imageNoPeople} /><div>暂无历史角色...</div></div>
              : null
        }
      </div>)
    }) : null
  },

  renderContent(currentAffair){
    let { canRender, isContainChildren } = this.state
    let { affair } = this.props
    let inValidNum = 0
    let outAllianceNum = 0
    currentAffair.roles = currentAffair.roles.concat(currentAffair.allianceRoles).concat(currentAffair.guestRoles)
    if (canRender){
      currentAffair.roles.map((role) => {
        if (role.belongAffairId == affair.get('id')){
          inValidNum++
        }
        else {
          outAllianceNum++
        }
      })
    }
    return currentAffair.roles.length != 0 ?
      <div className={styles.content}>
        <div className="u-text-12">停用的角色：</div>
        <div className={styles.cardContainer}>
          {
              currentAffair.roles.map((role, num) => {
                if (num < 6){
                  return role.belongAffairId == affair.get('id') ? <AffairRoleCard affair={this.props.affair} member={role} key={role.roleId} isHistory hasLeftAffair={false} enableRole={this.handleEnableRole.bind(null, role)}/> : null
                }
              })
            }
          {
              this.hasShownMoreInvalid(affair.get('id'))
                  ? currentAffair.roles.map((role, num) => {
                    if (num > 5){
                      return role.belongAffairId == affair.get('id') ? <AffairRoleCard affair={this.props.affair} member={role} key={role.roleId} isHistory hasLeftAffair={false} enableRole={this.handleEnableRole.bind(null, role)}/> : null
                    }
                  }) : null
            }
        </div>
        {
            ((inValidNum > 6) && (!this.hasShownMoreInvalid(affair.get('id'))))
                ? <div className={styles.loadMore}>
                  <div onClick={this.handleShowMoreInvalid.bind(null, affair.get('id'))}>
                显示更多停用角色
                    <span><LoadMoreIcon /></span>
                  </div>
                </div> : null
          }


        <div className="u-text-12">离开事务的角色：</div>
        <div className={styles.cardContainer}>
          {
              currentAffair.roles.map((role, num) => {
                if (num < 6){
                  return role.belongAffairId != affair.get('id') ? <AffairRoleCard affair={this.props.affair} member={role} key={role.roleId} isHistory hasLeftAffair inviteRole={this.handleInviteRole.bind(null, role)} /> : null
                }
              })
            }
          {
              this.hasShownMoreOutAlliance(affair.get('id'))
                  ? currentAffair.roles.map((role, num) => {
                    if (num > 5){
                      return role.belongAffairId != affair.get('id') ? <AffairRoleCard affair={this.props.affair} member={role} key={role.roleId} isHistory hasLeftAffair inviteRole={this.handleInviteRole.bind(null, role)} /> : null
                    }
                  }) : null

            }
        </div>
        {
            ((outAllianceNum > 6) && (!this.hasShownMoreOutAlliance(affair.get('id'))))
                ? <div className={styles.loadMore}>
                  <div onClick={this.handleShowMoreOutAlliance.bind(null, affair.get('id'))}>
                显示更多离开事务角色
                    <span><LoadMoreIcon /></span>
                  </div>
                </div> : null
          }
        {isContainChildren ? this.renderChildrenNode(affair.get('id')) : null}
      </div>
        : <div className={styles.noRole}><img src={imageNoPeople} /><div>暂无历史角色...</div></div>

  },

  renderSearch(){
    const { searchResult } = this.state
    let roleList = searchResult.roles || []
    return (<div className={styles.searchContainer}>
      {
        roleList.map((role) => {
          return <AffairRoleCard affair={this.props.affair} member={role} key={role.roleId} isHistory hasLeftAffair={false} />
        })
      }
    </div>)
  },


  render() {
    let { canRender } = this.state
    let { affair, historyRoles } = this.props
    let currentAffair = historyRoles.get(affair.get('id'))
    return canRender ? (
      <div className={styles.container}>
        {this.renderHeader()}
        {this.state.isSearching ? this.renderSearch() : this.renderContent(currentAffair)}
        {
          this.state.showEnableRole ?
            <ChangeRoleModal callback={() => {this.setState({ showEnableRole: false, roleModalType: 0, chosenRole: null })}} affair={this.props.affair} modalType={this.state.roleModalType} member={this.state.chosenRole}/>
            :
            null
        }
      </div>
    ) : null
  }

})

function mapStateToProps(state) {
  return {
    historyRoles: state.getIn(['affair', 'affairAttender', 'historyRoles'])
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getAffairRoles: bindActionCreators(getAffairRoles, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HistoryRoleContainer)
