import React from 'react'
import styles from './CurrentMemberContainer.scss'
import { Input, Switch, Button, Collapse, Popover, Checkbox, Tree, message } from 'antd'
import { SearchIcon, ArrowDropDown } from 'svg'
import _ from 'underscore'
import MemberCard from './MemberCard'
import config from '../../../config'
import AddAllianceMemberComponent from '../../alliance/AddAllianceMemberContainer'
import SearchModal from './SearchModal'
import imageNoPeople from 'images/img_no_people.png'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getSingleTree } from '../../../actions/alliance'
import messageHandler from 'messageHandler'
import PERMISSION from 'utils/permission'

const MemberState = {
  VALID: 0,
  INVALID: 1,
  ALL: 2,
}
const TreeNode = Tree.TreeNode
const Panel = Collapse.Panel
const CurrentMemberContainer = React.createClass({
  getInitialState(){
    return {
      showMember: {},
      showAddModal: false,
      hasData: false,
      canRender: false,
      showSearchModal: false,
      roleList: null,
      disableRoles: [],
      isContainChildren: false,
      keyword: '',
      list: [],
      memberState: MemberState.ALL,
      affairTree: null,
      showType: 2,
      showAffairIds: [this.props.affair.get('id')]
    }
  },
  componentDidMount(){
    this._search = _.debounce((keyword) => {
      this.initial(this.props, keyword, 2, this.state.showAffairIds)
    }, 300)
  },
  componentWillMount(){
    this.initial(this.props)
    this.props.getSingleTree(this.props.affair.get('allianceId'))
    fetch(config.api.alliance.simpleTree(this.props.affair.get('allianceId')), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((data) => data.json()).then((data) => {
      if (data.code === 0) {
        data = data.data
        this.setState({
          affairTree: data,
        })
      }
    })
  },
  onRefresh(){
    this.initial(this.props)
  },
  componentWillReceiveProps(nextProps){
    if (nextProps.affair.get('id') != this.props.affair.get('id')){
      this.setState({
        hasData: false,
        canRender: false,
      })
      this.initial(nextProps)
    }
  },

  //点击某一行成员刷新成员卡片信息

  handleRowClick(member){
    if (member.userId == this.state.showMember.id){
      return
    }
    fetch(config.api.affair.member.detail(member.userId), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => {
      return res.json()
    }).then((json) => {
      if (json.code == 0){
        fetch(config.api.affair.member.cards(member.personalRoleId ? member.personalRoleId : member.roleId), {
          method: 'GET',
          credentials: 'include',
          roleId: this.props.affair.get('roleId'),
          affairId: this.props.affair.get('id'),
        }).then((res) => res.json()).then((res) => {
          if (res.code == 0) {
            json.data.personalRoleId = member.personalRoleId
            json.data.state = member.state
            json.data.roleId = member.roleId
            json.data.ifHire = member.ifHire
            if (member.affairNames){
              json.data.affairNames = member.affairNames
            }
            this.setState({
              roleList: res.data,
              showMember: json.data,
            })
          }
        })
      }
    })

  },

  //刷新成员卡片中的角色卡片
  handleFreshMember(){
    fetch(config.api.affair.member.cards(this.state.showMember.personalRoleId ? this.state.showMember.personalRoleId : this.state.showMember.roleId), {
      method: 'GET',
      credentials: 'include',
      roleId: this.props.affair.get('roleId'),
      affairId: this.props.affair.get('id'),
    }).then((res) => res.json()).then((json) => {
      this.setState({
        roleList: json.data,
      })
    })
    this.onRefresh()
  },
  initial(props, keyword, personnelSearchType, affairIds){
    return fetch(config.api.personnel.search(props.affair.get('roleId')), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      affairId: props.affair.get('id'),
      roleId: props.affair.get('roleId'),
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        keyword: keyword ? keyword : '',
        personnelSearchType: personnelSearchType ? personnelSearchType : 2,
        affairIds: affairIds ? affairIds : [props.affair.get('id')]
      }),
    }).then((res) => res.json()).then((json) => {
      if (json.code != 0) {
        this.setState({
          hasData: false,
          canRender: true,
        })
        return
      }
      let data = json.data
      let total = json.data.staff.concat(json.data.allianceCoopRoles.concat(json.data.guestCoopRoles))
      if (total.length == 0){
        this.setState({
          hasData: false,
          canRender: true,
        })
        return
      } else {
        fetch(config.api.affair.member.detail(total[0].userId), {
          method: 'GET',
          credentials: 'include',
          affairId: props.affair.get('id'),
          roleId: props.affair.get('roleId'),
        }).then((res) => res.json()).then((json) => {
          fetch(config.api.affair.member.cards(total[0].personalRoleId ? total[0].personalRoleId : total[0].roleId), {
            method: 'GET',
            credentials: 'include',
            affairId: props.affair.get('id'),
            roleId: props.affair.get('roleId'),
          }).then((res) => res.json()).then((res) => {
            if (json.code == 0){
              json.data.personalRoleId = total[0].personalRoleId
              json.data.state = total[0].state
              json.data.roleId = total[0].roleId
              json.data.ifHire = total[0].ifHire
              if (total[0].affairNames){
                json.data.affairNames = total[0].affairNames
              }
              this.setState({
                roleList: res.data,
                list: data,
                hasData: true,
                showMember: json.data,
                canRender: true,
              })
            }
            else {
              message.error('没有权限查看当前界面')
            }
          })
        })
      }
    })

  },

  //高级搜索modal
  handleSearchMore(){
    this.setState({
      showSearchModal: true,
    })
  },

  //添加成员modal
  handleShowAddModal(){
    // fetch(config.api.alliance.role.get(this.props.affair.get('roleId')), {
    //   method: 'GET',
    //   credentials: 'include',
    // }).then((res) => res.json()).then( (res) => {
    //   if (res.code==0){
    //     this.setState({
    //       showAddModal:true,
    //       disableRoles:res.data,
    //     })
    //   }
    // })
    this.setState({
      showAddModal: true,
    })
  },
  handleSearch(e){
    // if (e.target.value){
    this._search(e.target.value)
    this.setState({
      keyword: e.target.value,
    })
    // }
    // else {
    //   this._search(e.target.value)
    //   this.setState({
    //     keyword:'',
    //   })
    // }
  },
  handleSearchEnter(e){
    if (e.keyCode == 13){
      fetch(config.api.affair.member.current(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
        body: JSON.stringify({
          key: e.target.value,
          page: 1,
          count: 100,
          sortColumn: 'name',
          isReverseSort: false,
          includeSubAffair: this.state.isContainChildren,
          needTotal: false,
          leaveAlliance: false,
        }),
      }).then((res) => res.json()).then((json) => {
        let data = json.data
        if (!json.data.length){
          this.setState({
            hasData: false,
            canRender: true,
          })
        }
        else {
          fetch(config.api.affair.member.detail(json.data[0].userId), {
            method: 'GET',
            credentials: 'include',
            affairId: this.props.affair.get('id'),
            roleId: this.props.affair.get('roleId'),
          }).then((res) => res.json()).then((json) => {
            this.setState({
              list: data.map((v, k) => {return { avatar: v.avatar, belongAffair: v.belongAffair, level: v.level, roleTitle: v.roleTitle, userId: v.userId, username: v.username, id: k + 1 }}),
              hasData: true,
              canRender: true,
              showMember: json.data,
            })
          })
        }
      })
    }
  },
  handleChildrenSwitch(checked){
    if (checked) {
      let affairList = []
      const getAffairIdList = (root) => {
        affairList.push(root.id.toString())
        if (root.children == []) return
        else {
          root.children.map((v) => {
            getAffairIdList(v)
          })
        }
      }
      getAffairIdList(this.state.affairTree)

      this.initial(this.props, this.state.keyword, 2, affairList).then(() => {
        this.setState({
          isContainChildren: checked,
          showAffairIds: affairList,
        })
      })
    }
    else {
      this.initial(this.props, this.state.keyword, 2, [this.props.affair.get('id')]).then(() => {
        this.setState({
          isContainChildren: checked,
          showAffairIds: [this.props.affair.get('id')],
        })
      })
    }
  },
  handleShowByAffair(id, e){
    let newlist = this.state.showAffairIds
    if (e.target.checked){
      newlist.push(id.toString())
    }
    else {
      newlist = newlist.filter((v) => {return v != id})
    }
    this.initial(this.props, this.state.keyword, 2, newlist)
    this.setState({
      showAffairIds: newlist
    })
    if (newlist.length > 1){
      this.setState({
        isContainChildren: true,
      })
    }
  },
  handleShowByType(type){
    // this.initial(this.props,'' ,type, this.state.showAffairIds)
    this.setState({
      showType: type,
      showTypePopover: false,
    })
  },
  handleShowTypePopover(visible){
    this.setState({
      showTypePopover: visible,
    })
  },
  handleCancelInvite(v, e){
    e.stopPropagation()
    fetch(config.api.affair.member.cancelInvite(v.userId, v.personalRoleId), {
      method: 'POST',
      credentials: 'include',
      roleId: this.props.affair.get('roleId'),
      affairId: this.props.affair.get('id'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        message.success('成功取消邀请')
        this.initial(this.props)
      }
    })
  },
  handleFreshEmployment(){
    fetch(config.api.personnel.search(this.props.affair.get('roleId')), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        keyword: '',
        personnelSearchType: 2,
        affairIds: [this.props.affair.get('id')]
      }),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        let total = json.data.staff.concat(json.data.allianceCoopRoles.concat(json.data.guestCoopRoles))
        let tmp = this.state.showMember
        total.map((v) => {
          if (v.userId == this.state.showMember.id){
            tmp.ifHire = v.ifHire
          }
        })
        this.setState({
          showMember: tmp,
          list: json.data,
        })
      }
    })
  },
  createTreeNode(root){
    return (root.children.length != 0 ?
      <TreeNode
        title={
          <Checkbox
            disabled={root.id == this.props.affair.get('id')}
            onChange={this.handleShowByAffair.bind(null, root.id)}
            checked={this.state.showAffairIds.some(((v) => {return v == root.id}))}
          >
            {root.name}
          </Checkbox>
        }
        value={`${root.id}`}
        key={root.id}
      >
        {root.children.map((v) => {
          return this.createTreeNode(v)
        })}
      </TreeNode>
    :
      <TreeNode
        title={
          <Checkbox
            disabled={root.id == this.props.affair.get('id')}
            onChange={this.handleShowByAffair.bind(null, root.id)}
            checked={this.state.showAffairIds.some(((v) => {return v == root.id}))}
          >
            {root.name}
          </Checkbox>
        }
        value={`${root.id}`}
        key={root.id}
        isLeaf
      />
    )
  },
  render(){
    const { affair } = this.props
    let root = this.state.affairTree
    // const { list, memberState, } = this.state
    const memberStatePopover = (
      <div className={styles.memberStatePopoverContainer}>
        <div className={styles.row} onClick={this.handleShowByType.bind(null, 2)}>全部人才</div>
        <div className={styles.row} onClick={this.handleShowByType.bind(null, 0)}>当前人才</div>
        <div className={styles.row} onClick={this.handleShowByType.bind(null, 1)}>离盟人才</div>
      </div>
    )
    const belongAffairPopover = (
      <div className={styles.belongAffairPopover}>
        <div className={styles.inAlliance}>
          <div className={styles.title}>盟内事务:</div>
          <div className={styles.content}>
            <Tree defaultExpandAll>
              {root ? this.createTreeNode(root) : null}
            </Tree>
          </div>
        </div>
      </div>
    )
    // const memberFilter = memberState == MemberState.ALL ? () => {return true} : (member) => (member.personnelState == memberState)
    // const dataList = list.map((obj, index) => {
    //   obj.id = index
    //   return obj
    // }).filter(memberFilter)
    //const currentNum = list.filter((member) => (member.personnelState == MemberState.VALID))
    return this.state.canRender ? <div className={styles.container}>
      <div className={styles.operations}>
        <div className={styles.leftSide}>
          <Input placeholder="请输入关键词" onChange={this.handleSearch} />
          <SearchIcon height="16"/>
          <span className={styles.searchMore} onClick={this.handleSearchMore} style={{ display: 'none' }}>高级搜索</span>
        </div>
        <div className={styles.rightSide}>
          {affair.validatePermissions(PERMISSION.CHECK_CHILD_AFFAIR_MEMBER) &&
            <div className={styles.switchField}>
              <span>包含子事务</span>
              <Switch checkedChildren="开" unCheckedChildren="关" checked={this.state.isContainChildren} onChange={this.handleChildrenSwitch} />
            </div>
          }
          {affair.validatePermissions(PERMISSION.ADD_MEMBER) &&
            <Button className={styles.addBtn} size="large" type="primary" onClick={this.handleShowAddModal}>添加成员</Button>
          }
        </div>
      </div>
      {this.state.hasData ?
        <div className={styles.show}>
          <div className={styles.memberList}>
            <div className={styles.header}>
              <span className={styles.id}>编号</span>
              <div className={styles.memberState}>
                <span>{this.state.showType == 2 ? '全部人才' : this.state.showType == 1 ? '离盟人才' : '当前人才'}</span>
                <Popover trigger="click" content={memberStatePopover} placement="bottom" visible={this.state.showTypePopover} onVisibleChange={this.handleShowTypePopover} overlayClassName={styles.memberStatePopover}>
                  <ArrowDropDown height="16" fill="#cccccc"/>
                </Popover>
              </div>
              <span className={styles.gender}>性别</span>
              <div className={styles.belongAffair}>
                <span>所在事务</span>
                {this.state.isContainChildren &&
                  <Popover trigger="click" content={belongAffairPopover} placement="bottom">
                    <ArrowDropDown height="16" fill="#cccccc"/>
                  </Popover>
                }
              </div>
            </div>
            <div className={styles.content}>
              <Collapse defaultActiveKey={['affair', 'inAlliance', 'outAlliance']}>
                <Panel header="正式成员:" key="affair">
                  {this.state.list.staff.map((v, k) => {
                    if ((this.state.showType == 2) || (this.state.showType == 0 && v.state == 0) || (this.state.showType == 1 && v.state == 1)){
                      return (
                        <div
                          className={styles.row}
                          key={k}
                          onClick={this.handleRowClick.bind(null, v, 'member')}
                          style={{ backgroundColor: v.userId == this.state.showMember.id ? '#fbf8ff' : 'white', color: v.state == 0 || v.state == 2 ? '#4a4a4a' : '#cccccc' }}
                        >
                          <span className={styles.id}>{k + 1}</span>
                          <div className={styles.avatarAndName}>
                            {v.avatar ? <img src={v.avatar} className={styles.avatar}/> : <div className={styles.avatar} style={{ backgroundColor: '#e9e9e9' }}/>}
                            <span className={styles.name}>{v.username}</span>
                            {v.state == 2 && <span style={{ color: '#cccccc' }}>(邀请中)</span>}
                          </div>
                          {v.state == 2 ? <span className={styles.gender} /> : <span className={styles.gender}>{v.gender == 0 ? '保密' : v.gender == 1 ? '男' : '女'}</span>}
                          {v.state == 2 ? <span className={styles.cancelInvite} onClick={this.handleCancelInvite.bind(null, v)}>取消邀请</span> : <span className={styles.belongAffair}>{v.belongAffairName}</span>}
                        </div>
                      )
                    }
                  })}
                </Panel>

                <Panel header="盟内协作角色:" key="inAlliance">
                  {this.state.list.allianceCoopRoles.map((v, k) => {
                    if ((this.state.showType == 2) || (this.state.showType == 0 && v.state == 0) || (this.state.showType == 1 && v.state == 1)) {
                      return (
                        <div
                          className={styles.row}
                          key={k}
                          onClick={this.handleRowClick.bind(null, v, 'role')}
                          style={{ backgroundColor: v.userId == this.state.showMember.id ? '#fbf8ff' : 'white' }}
                        >
                          <span className={styles.id}>{k + 1}</span>
                          <div className={styles.affairAndName}>
                            {v.avatar ? <img src={v.avatar} className={styles.avatar}/> : <div className={styles.avatar} style={{ backgroundColor: '#e9e9e9' }}/>}
                            <span className={styles.name}>{v.roleName}&nbsp;{v.belongAffairName}-{v.username}</span>
                          </div>
                          <span className={styles.affairs}>{v.affairNames.join('、')}</span>
                        </div>
                      )
                    }
                  })}
                </Panel>
                <Panel header="盟外协作角色:" key="outAlliance" >
                  {this.state.list.guestCoopRoles.map((v, k) => {
                    if ((this.state.showType == 2) || (this.state.showType == 0 && v.state == 0) || (this.state.showType == 1 && v.state == 1)) {
                      return (
                        <div className={styles.row} key={k} onClick={this.handleRowClick.bind(null, v, 'role')} style={{ backgroundColor: v.userId == this.state.showMember.id ? '#fbf8ff' : 'white' }}>
                          <span className={styles.id}>{k + 1}</span>
                          <div className={styles.affairAndName}>
                            {v.avatar ? <img src={v.avatar} className={styles.avatar}/> : <div className={styles.avatar} style={{ backgroundColor: '#e9e9e9' }}/>}
                            <span className={styles.name}>{v.roleName}&nbsp;{v.belongAffairName}-{v.username}</span>
                          </div>
                          <span className={styles.affairs}>{v.affairNames.join('、')}</span>
                        </div>
                      )
                    }
                  })}
                </Panel>
              </Collapse>
            </div>
          </div>
          <div className={styles.memberCard}>
            <MemberCard
              ref={(el) => {this.memberCard = el}}
              member={this.state.showMember}
              roleList={this.state.roleList}
              affair={this.props.affair}
              type="current"
              fresh={this.handleFreshMember}
              initial={this.initial.bind(null, this.props)}
              freshEmployment={this.handleFreshEmployment}
            />
          </div>
        </div>
      : (
        <div className={styles.noMember}>
          <img src={imageNoPeople} />
          <div>暂无成员...</div>
        </div>
      )}
      {this.state.showAddModal &&
        <AddAllianceMemberComponent
          onClose={() => {this.setState({ showAddModal: false })}}
          affair={this.props.affair}
          options={this.state.disableRoles}
          onRefresh={this.onRefresh}
        />
      }
      <SearchModal showSearchModal={this.state.showSearchModal} onClose={() => {this.setState({ showSearchModal: false })}} />
    </div> : null
  }
})

function mapStateToProps(state) {
  return {
    members: state.get('user').get('members'),
    allianceTree: state.getIn(['alliance', 'allianceTree']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getSingleTree: bindActionCreators(getSingleTree, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CurrentMemberContainer)
