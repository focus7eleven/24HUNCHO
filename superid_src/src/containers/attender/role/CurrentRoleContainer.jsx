import React from 'react'
import styles from './CurrentRoleContainer.scss'
import { Switch, Button } from 'antd'
import { SearchIcon, LoadMoreIcon, DropUpIcon } from 'svg'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import AffairRoleCard from '../../../components/card/AffairRoleCard'
import DelayedInput from '../../../components/input/DelayedInput'
import ChangeRoleModal from './ChangeRoleModal'
import { List } from 'immutable'
import { getAffairRoles } from '../../../actions/affair'
import AuthorityModal from '../member/AuthorityModal'
import { getSingleTree } from '../../../actions/alliance'
import config from '../../../config'
import PERMISSION from 'utils/permission'

let CurrentRoleContainer = React.createClass({
  getInitialState() {
    return {
      isContainChildren: false,
      queryString: '',
      showCreateRole: false,
      authorityModal: false,

      chosenMember: null,
      roleModalType: 0,
      member: null,
      queryResult: null,
      canRender: false,
      hasData: false,
      isExpanded: List(),
      isGot: List(),
      isShownMoreInAffair: List(),
      isShownMoreInAlliance: List(),
      isShownMoreOutAlliance: List(),
      isSearching: false,
      searchResult: {},
      keyword: '',
      contentRef: null,
    }
  },
  componentWillMount(){
    const { affair } = this.props
    if (affair.get('id') == 0) return
    this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true).then(() => {
      this.setState({
        canRender: true,
        isGot: this.state.isGot.push(affair.get('id'))
      })
    })
  },

  componentWillReceiveProps(nextProps){
    const { affair } = nextProps
    if (affair.get('id') == 0) return
    if (nextProps.affair.get('id') != this.props.affair.get('id')) {
      this.setState(this.getInitialState())
      this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true).then(() => {
        this.setState({
          canRender: true,
          isGot: this.state.isGot.push(affair.get('id')),
          isExpanded: List(),
        })
      })
    }
  },

  handleChildrenSwitch(checked){
    let { affair } = this.props

    if (this.state.isSearching){
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
          active: true,
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
        isContainChildren: checked,
      })
      // 当前实现方法有问题，循环中获取affairRoles的话，只有affairId是不同的，会被前端fetch的限制过滤掉
      // 最好的改进方法是获取affairRoles的时候可以设置containChild为true，当前设为true时不能返回data
      // 然而小鹏哥说这里后端不好改
      // 暂时改正为，打开包含子事务时每个子事务都不打开，用户手动点击子事务再去请求数据
      // let currentAffair = currentRoles.get(affair.get('id'))
      // let children = currentAffair.affairs
      // let beforeLength = currentRoles.size
      // if (children.length != 0){
      //
      //   children.map((v) => {
      //     if (!this.state.isGot.includes(v.id)){
      //       this.props.getAffairRoles(affair.get('roleId'), v.id, true).then(() => {
      //         if ((this.props.currentRoles.size - beforeLength) == children.length){
      //           this.setState({
      //             isContainChildren: checked,
      //             isExpanded: this.state.isExpanded.push(v.id),
      //             isGot: this.state.isGot.push(v.id),
      //           })
      //         }
      //         else {
      //           this.setState({
      //             isExpanded: this.state.isExpanded.push(v.id),
      //             isGot: this.state.isGot.push(v.id),
      //           })
      //         }
      //
      //       })
      //     }
      //     else {
      //       this.setState({
      //         isContainChildren: checked,
      //       })
      //     }
      //
      //   })
      // }
      // else {
      //   this.setState({
      //     isContainChildren: checked,
      //   })
      // }

    }

  },

  handleChangeQueryString(e){
    this.setState({
      queryString: e.target.value
    })
  },

  handleCreateRole(){
    this.setState({
      showCreateRole: true,
      roleModalType: 0,
    })
  },

  handleCloseReplaceMemberModal() {
    this.setState({
      replaceMemberModal: false,
    })
  },
  handleCloseAuthorityModal(){
    this.setState({
      authorityModal: false,
      chosenMember: {},
    })
  },


  handleCloseEnableRoleModal() {
    this.setState({
      enableRoleModal: false
    })
  },

  /* Card Handle */
  handleOpenReplaceMemberModal(role, affairId){
    this.setState({
      showCreateRole: true,
      roleModalType: 2,
      chosenMember: role,
      chosenAffairId: affairId,
    })
  },
  handleSwitchShow(affairId){
    let { affair } = this.props
    if (!this.state.isGot.includes(affairId)){
      this.props.getAffairRoles(affair.get('roleId'), affairId, true).then(() => {
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
  handleShowMoreInAffair(affairId){
    if (!this.state.isShownMoreInAffair.includes(affairId)){
      this.setState({
        isShownMoreInAffair: this.state.isShownMoreInAffair.push(affairId),
      })
    }
  },
  handleShowMoreInAlliance(affairId){
    if (!this.state.isShownMoreInAlliance.includes(affairId)){
      this.setState({
        isShownMoreInAlliance: this.state.isShownMoreInAlliance.push(affairId),
      })
    }
  },
  handleShowMoreOutAlliance(affairId){
    if (!this.state.isShownMoreOutAlliance.includes(affairId)){
      this.setState({
        isShownMoreOutAlliance: this.state.isShownMoreOutAlliance.push(affairId),
      })
    }
  },
  hasExpanded(affairId){
    return this.state.isExpanded.includes(affairId)
  },
  hasShownMoreInAffair(affairId){
    return this.state.isShownMoreInAffair.includes(affairId)
  },
  hasShownMoreInAlliance(affairId){
    return this.state.isShownMoreInAlliance.includes(affairId)
  },
  hasShownMoreOutAlliance(affairId){
    return this.state.isShownMoreOutAlliance.includes(affairId)
  },
  handleChangeAuthority(role){
    this.setState({
      authorityModal: true,
      chosenMember: role,
    })
  },
  handleSearchOnchange(value){
    const { affair } = this.props
    if (value == '') {
      this.setState({
        isSearching: false,
        keyword: ''
      })
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
        active: true,
        containChild: this.state.isContainChildren,
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.setState({
          isSearching: true,
          searchResult: json.data || {},
          keyword: value
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
        method: 'POST',
        credentials: 'include',
        roleId: affair.get('roleId'),
        affairId: affair.get('id'),
        body: JSON.stringify({
          key: event.target.value,
          lastTitlePY: '',
          limit: 20,
          active: true,
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

  /* Render */
  renderHeader() {
    // const selectBefore = (
    //   <Select defaultValue="all" dropdownMatchSelectWidth={false}>
    //     <Option value="all">所有角色</Option>
    //   </Select>
    // )
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

        <div>
          {affair.validatePermissions(PERMISSION.CHECK_CHILD_AFFAIR_ROLE) && [
            <div key="text" className="u-text-14" style={{ marginLeft: 30 }}>包含子事务</div>,
            <Switch key="switch" checkedChildren="开" unCheckedChildren="关" onChange={this.handleChildrenSwitch} style={{ marginLeft: '10px', marginRight: '20px' }} checked={this.state.isContainChildren}/>
          ]}
          {affair.validatePermissions(PERMISSION.CREATE_ROLE) &&
            <Button type="primary" size="large" className={styles.funcBtn} onClick={this.handleCreateRole}>创建角色</Button>
          }
        </div>
      </div>
    )
  },

  renderChildrenNode(affairId) {
    let { currentRoles } = this.props
    let children = currentRoles.get(affairId).affairs
    return children != [] && children.map((affair) => {
      let hasExpanded = this.hasExpanded(affair.id)
      let left = 35 + (affair.level - 1) * 20
      if (!currentRoles.get(affair.id)){
        return (
          <div className={styles.childrenBox} key={affair.id}>
            <div className={styles.childrenTitle} style={{ paddingLeft: `${left}px` }}>
              <div className={styles.titleContainer}>
                {/*<AffairAvatar affair={affair} sideLength={40}></AffairAvatar>*/}
                <span className={styles.affairName}>{affair.name}</span>
              </div>
              <DropUpIcon height="20" fill="#666666" onClick={this.handleSwitchShow.bind(null, affair.id)} style={hasExpanded ? { transform: 'rotate(0)' } : { transform: 'rotate(180deg)' }}/>
            </div>
          </div>
        )
      }
      let currentAffair = currentRoles.get(affair.id)
      return (
        <div className={styles.childrenBox} key={affair.id}>
          <div className={styles.childrenTitle} style={{ paddingLeft: `${left}px` }}>
            <div className={styles.titleContainer}>
              {/*<AffairAvatar affair={affair} sideLength={40}></AffairAvatar>*/}
              <span className={styles.affairName}>{affair.name}</span>
            </div>
            <DropUpIcon height="20" fill="#666666" onClick={this.handleSwitchShow.bind(null, affair.id)} style={hasExpanded ? { transform: 'rotate(0)' } : { transform: 'rotate(180deg)' }}/>
          </div>
          {hasExpanded &&
            <div className={styles.childContent}>
              <div className={styles.show}>
                <div className="u-text-12">本事务角色（{currentAffair.roles.length}）：</div>
                <div className={styles.cardContainer}>
                  {currentAffair.roles.map((role, num) => {
                    if (num < 6){
                      return (
                        <AffairRoleCard
                          affair={this.props.affair}
                          member={role}
                          key={role.roleId}
                          isHistory={false}
                          isPrimaryAffair
                          changeAuthority={this.handleChangeAuthority.bind(null, role)}
                          fromMemberCard={false}
                          replaceMember={this.handleOpenReplaceMemberModal.bind(null, role, affair.id)}
                          overflowRef={this.state.contentRef}
                        />
                      )}
                  })}
                  {this.hasShownMoreInAffair(affair.id) &&
                    currentAffair.roles.map((role, num) => {
                      if (num > 5){
                        return (
                          <AffairRoleCard
                            affair={this.props.affair}
                            member={role}
                            key={role.roleId}
                            isHistory={false}
                            isPrimaryAffair
                            changeAuthority={this.handleChangeAuthority.bind(null, role)}
                            fromMemberCard={false}
                            replaceMember={this.handleOpenReplaceMemberModal.bind(null, role, affair.id)}
                            overflowRef={this.state.contentRef}
                          />
                        )
                      }
                    })
                  }
                </div>
                {(currentAffair.roles.length > 6) && (!this.hasShownMoreInAffair(affair.id)) &&
                  <div className={styles.loadMore}>
                    <div onClick={this.handleShowMoreInAffair.bind(null, affair.id)}>
                      显示更多角色
                      <span><LoadMoreIcon /></span>
                    </div>
                  </div>
                }
              </div>
              {currentAffair.allianceRoles.length > 0 &&
                <div className={styles.show}>
                  <div className="u-text-12">盟内角色（{currentAffair.allianceRoles.length}）：</div>
                  <div className={styles.cardContainer}>
                    {currentAffair.allianceRoles.map((role, num) => {
                      if (num < 6) {
                        return (
                          <AffairRoleCard
                            affair={this.props.affair}
                            member={role}
                            key={role.roleId}
                            isHistory={false}
                            isPrimaryAffair={false}
                            changeAuthority={this.handleChangeAuthority.bind(null, role)}
                            fromMemberCard={false}
                            replaceMember={this.handleOpenReplaceMemberModal.bind(null, role, affair.id)}
                            overflowRef={this.state.contentRef}
                            noPermissionControl
                          />
                        )
                      }
                    })
                    }
                    {this.hasShownMoreInAlliance(affair.id) && currentAffair.allianceRoles.map((role, num) => {
                      if (num > 5) {
                        return (
                          <AffairRoleCard
                            affair={this.props.affair}
                            member={role}
                            key={role.roleId}
                            isHistory={false}
                            isPrimaryAffair={false}
                            changeAuthority={this.handleChangeAuthority.bind(null, role)}
                            fromMemberCard={false}
                            replaceMember={this.handleOpenReplaceMemberModal.bind(null, role, affair.id)}
                            overflowRef={this.state.contentRef}
                          />
                        )
                      }
                    })}
                  </div>
                  {(currentAffair.allianceRoles.length > 6) && (!this.hasShownMoreInAlliance(affair.id)) &&
                    <div className={styles.loadMore}>
                      <div onClick={this.handleShowMoreInAlliance.bind(null, affair.id)}>
                        显示更多角色
                        <span><LoadMoreIcon /></span>
                      </div>
                    </div>
                  }
                </div>
              }
              {currentAffair.guestRoles.length > 0 &&
                <div className={styles.show}>
                  <div className="u-text-12">盟外角色（{currentAffair.guestRoles.length}）：</div>
                  <div className={styles.cardContainer}>
                    {currentAffair.guestRoles.map((role, num) => {
                      if (num < 6) {
                        return (
                          <AffairRoleCard
                            affair={this.props.affair}
                            member={role}
                            key={role.roleId}
                            isHistory={false}
                            isPrimaryAffair={false}
                            changeAuthority={this.handleChangeAuthority.bind(null, role)}
                            fromMemberCard={false}
                            replaceMember={this.handleOpenReplaceMemberModal.bind(null, role, affair.id)}
                            overflowRef={this.state.contentRef}
                            noPermissionControl
                          />
                        )
                      }
                    })}
                    {this.hasShownMoreOutAlliance(affair.id) &&
                      currentAffair.guestRoles.map((role, num) => {
                        if (num > 5) {
                          return role.allianceId != this.props.affair.get('allianceId') && (
                            <AffairRoleCard
                              affair={this.props.affair}
                              member={role}
                              key={role.roleId}
                              isHistory={false}
                              isPrimaryAffair={false}
                              changeAuthority={this.handleChangeAuthority.bind(null, role)}
                              fromMemberCard={false}
                              replaceMember={this.handleOpenReplaceMemberModal.bind(null, role, affair.id)}
                              overflowRef={this.state.contentRef}
                            />
                          )
                        }
                      })}
                  </div>
                  {(currentAffair.guestRoles.length > 6) && (!this.hasShownMoreOutAlliance(affair.id)) &&
                    <div className={styles.loadMore}>
                      <div onClick={this.handleShowMoreOutAlliance.bind(null, affair.id)}>
                        显示更多角色
                        <span><LoadMoreIcon /></span>
                      </div>
                    </div>
                  }
                </div>
              }
              {affair.affairs != [] && this.renderChildrenNode(affair.id)}
            </div>
          }
        </div>
      )
    })
  },

  renderContent(currentAffair){
    if (!currentAffair){return null}
    let { isContainChildren } = this.state
    let { affair } = this.props
    return (
      <div className={styles.content} ref={(ref) => {
        if (!this.state.contentRef){
          this.setState({
            contentRef: ref
          })
        }
      }}
      >
        <div className="u-text-12">本事务角色（{currentAffair.roles.length}）：</div>
        <div className={styles.cardContainer}>
          {currentAffair.roles.map((role, num) => {
            if (num < 6){
              return (
                <AffairRoleCard
                  affair={this.props.affair}
                  member={role}
                  key={role.roleId}
                  isHistory={false}
                  isPrimaryAffair
                  changeAuthority={this.handleChangeAuthority.bind(null, role)}
                  fromMemberCard={false}
                  replaceMember={this.handleOpenReplaceMemberModal.bind(null, role, affair.get('id'))}
                  overflowRef={this.state.contentRef}
                />
              )
            }
          })}
          {this.hasShownMoreInAffair(affair.get('id')) &&
            currentAffair.roles.map((role, num) => {
              if (num > 5){
                return <AffairRoleCard affair={this.props.affair} member={role} key={role.roleId} isHistory={false} isPrimaryAffair changeAuthority={this.handleChangeAuthority.bind(null, role)} overflowRef={this.state.contentRef} fromMemberCard={false} replaceMember={this.handleOpenReplaceMemberModal.bind(null, role, affair.get('id'))}/>
              }
            })
          }
        </div>
        {(currentAffair.roles.length > 6) && (!this.hasShownMoreInAffair(affair.get('id'))) &&
          <div className={styles.loadMore}>
            <div onClick={this.handleShowMoreInAffair.bind(null, affair.get('id'))}>
              显示更多角色
              <span><LoadMoreIcon /></span>
            </div>
          </div>
        }

        {currentAffair.allianceRoles.length > 0 &&
          <div className={styles.show}>
            <div className="u-text-12">盟内角色（{currentAffair.allianceRoles.length}）：</div>
            <div className={styles.cardContainer}>
              {currentAffair.allianceRoles.map((role, num) => {
                if (num < 6){
                  return (
                    <AffairRoleCard
                      affair={this.props.affair}
                      member={role}
                      key={role.roleId}
                      isHistory={false}
                      isPrimaryAffair={false}
                      changeAuthority={this.handleChangeAuthority.bind(null, role)}
                      fromMemberCard={false}
                      replaceMember={this.handleOpenReplaceMemberModal.bind(null, role, affair.get('id'))}
                      overflowRef={this.state.contentRef}
                      noPermissionControl
                    />
                  )
                }
              })
              }
              {this.hasShownMoreInAlliance(affair.get('id')) &&
                currentAffair.allianceRoles.map((role, num) => {
                  if (num > 5){
                    return (
                      <AffairRoleCard
                        affair={this.props.affair}
                        member={role}
                        key={role.roleId}
                        isHistory={false}
                        isPrimaryAffair={false}
                        overflowRef={this.state.contentRef}
                        changeAuthority={this.handleChangeAuthority.bind(null, role)}
                        fromMemberCard={false}
                        replaceMember={this.handleOpenReplaceMemberModal.bind(null, role, affair.get('id'))}
                      />
                    )
                  }
                })
              }
            </div>
            {(currentAffair.allianceRoles.length > 6) && (!this.hasShownMoreInAlliance(affair.get('id'))) &&
              <div className={styles.loadMore}>
                <div onClick={this.handleShowMoreInAlliance.bind(null, affair.get('id'))}>
                  显示更多角色
                  <span><LoadMoreIcon /></span>
                </div>
              </div>
            }
          </div>
        }
        {currentAffair.guestRoles.length > 0 &&
          <div className={styles.show}>
            <div className="u-text-12">盟外角色（{currentAffair.guestRoles.length}）：</div>
            <div className={styles.cardContainer}>
              {currentAffair.guestRoles.map((role, num) => {
                if (num < 6){
                  return (
                    <AffairRoleCard
                      affair={this.props.affair}
                      member={role}
                      key={role.roleId}
                      isHistory={false}
                      isPrimaryAffair={false}
                      changeAuthority={this.handleChangeAuthority.bind(null, role)}
                      fromMemberCard={false}
                      replaceMember={this.handleOpenReplaceMemberModal.bind(null, role, affair.get('id'))}
                      overflowRef={this.state.contentRef}
                      noPermissionControl
                    />
                  )
                }
              })}
              {this.hasShownMoreOutAlliance(affair.get('id')) && currentAffair.guestRoles.map((role, num) => {
                if (num > 5){
                  return (
                    <AffairRoleCard
                      affair={this.props.affair}
                      member={role}
                      key={role.roleId}
                      isHistory={false}
                      isPrimaryAffair={false}
                      changeAuthority={this.handleChangeAuthority.bind(null, role)}
                      fromMemberCard={false}
                      replaceMember={this.handleOpenReplaceMemberModal.bind(null, role, affair.get('id'))}
                      overflowRef={this.state.contentRef}
                    />
                  )}
              })}
            </div>
            {(currentAffair.guestRoles.length > 6) && (!this.hasShownMoreOut(affair.get('id'))) &&
            <div className={styles.loadMore}>
              <div onClick={this.handleShowMoreOutAlliance.bind(null, affair.get('id'))}>
                显示更多角色
                <span><LoadMoreIcon /></span>
              </div>
            </div>
          }
          </div>
      }
        {isContainChildren && this.renderChildrenNode(affair.get('id'))}
      </div>)
  },

  renderSearch(){
    const { searchResult } = this.state
    let roleList = searchResult.roles || []
    return (
      <div className={styles.searchContainer}>
        {roleList.map((role) => {
          return <AffairRoleCard affair={this.props.affair} member={role} key={role.roleId} isHistory={false} hasLeftAffair={false} overflowRef={this.state.contentRef} />
        })}
      </div>
    )
  },
  render() {
    let { canRender, isSearching, authorityModal, showCreateRole } = this.state
    let { affair, currentRoles } = this.props
    let currentAffair = currentRoles.get(affair.get('id'))

    return canRender && (
    <div className={styles.container} ref="container">
      {this.renderHeader()}
      {isSearching ? this.renderSearch() : this.renderContent(currentAffair)}

      {showCreateRole &&
        <ChangeRoleModal
          callback={() => {
            if (this.state.roleModalType != 0){
              this.props.getAffairRoles(this.props.affair.get('roleId'), this.state.chosenAffairId, true)
            }
            this.setState({ showCreateRole: false, roleModalType: 0, chosenMember: null })

          }}
          affair={this.props.affair}
          modalType={this.state.roleModalType}
          member={this.state.chosenMember}
        />
      }
      {authorityModal &&
        <AuthorityModal type={0} affair={this.props.affair} member={this.state.chosenMember} callback={this.handleCloseAuthorityModal}/>
      }
    </div>
    )
  }
})

function mapStateToProps(state) {
  return {
    currentRoles: state.getIn(['affair', 'affairAttender', 'currentRoles']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getAffairRoles: bindActionCreators(getAffairRoles, dispatch),
    getSingleTree: bindActionCreators(getSingleTree, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CurrentRoleContainer)
