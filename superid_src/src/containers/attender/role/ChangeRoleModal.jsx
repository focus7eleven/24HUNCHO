import React, { PropTypes } from 'react'
import styles from './ChangeRoleModal.scss'
import { Modal, Input, Radio, message, Tree, Popover, Checkbox, notification } from 'antd'
import { SearchIcon, ArrowDropDown } from 'svg'
import { Motion, spring } from 'react-motion'
import config from '../../../config'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getAffairRoles, createNewRole } from '../../../actions/affair'
import { getSingleTree } from '../../../actions/alliance'
import messageHandler from 'messageHandler'
import DelayedInput from 'components/input/DelayedInput'

const ModalType = ['创建角色', '恢复角色', '更换担任者', '赋予角色']
const MemberState = ['事务内', '盟内', '盟外']
const TreeNode = Tree.TreeNode

const ChangeRoleModal = React.createClass({
  propTypes: {
    modalType: PropTypes.number.isRequired, //modal的类型
  },
  getInitialState(){
    return {
      currentTab: 0, //0,1,2代表事务内,盟内,盟外
      roleTitle: '',
      candidates: [],
      chosenCandidate: null,
      affairTree: null,
      showAffairIds: [this.props.affair.get('id')],
      showAffairNames: [this.props.affair.get('name')],
      showInAlliance: [],
      keyword: '',
      showAffairPopover: false,
      showAlliancePopover: false,
      searchAllianceId: [],
    }
  },
  handleCancel(){
    this.setState(this.getInitialState())
    this.props.callback()
  },
  handleSwitchTab(k){
    this.setState({
      currentTab: k,
      keyword: '',
    })
    if (k == 0) {
      this.fetchChooseList('', this.state.showAffairIds, k)
    }
    if (k == 1) {
      let tmp = []
      const add = (root) => {
        tmp.push(root.id)
        if (root.children != []) {
          root.children.map((v) => {
            add(v)
          })
        }
      }
      add(this.props.allianceTree.get(this.props.affair.get('allianceId')))
      this.setState({ showInAlliance: tmp })
      this.fetchChooseList('', tmp, k)
    }
    if (k == 2){
      this.fetchChooseList('', this.state.showAffairIds, k)
    }
  },
  handleOk(){
    const { affair } = this.props

    //创建角色
    if (this.props.modalType == 0) {
      if (this.state.roleTitle.length < 2 || this.state.roleTitle.length > 15) {
        notification.error({
          message: '角色名需2-15个字符'
        })
        return
      }

      // if (this.state.chosenCandidate == null) {
      //   message.error('未选择担任者')
      //   return
      // }

      fetch(config.api.affair.role.allocate(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-SIMU-RoleId': affair.get('roleId'),
          'X-SIMU-AffairId': affair.get('id'),
        },
        method: 'POST',
        roleId: affair.get('roleId'),
        affairId: affair.get('id'),
        body: JSON.stringify({
          title: this.state.roleTitle,
          ownerRoleId: this.state.chosenCandidate ? this.state.chosenCandidate.roleId : 0,
          alliancePermissions: [],
          affairPermissions: [],
          affairId: affair.get('id'),
          reason: '',
        }),
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code == 0) {
          message.success('创建成功')
          json.data.affairName = this.props.affair.get('name')
          this.props.createNewRole(json.data)

          this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true).then(() => {
            this.props.callback()
          })
        } else if (json.code == 20000) {
          this.props.callback()
        }
      })
    }


    //恢复角色
    if (this.props.modalType == 1) {
      if (!this.state.chosenCandidate){
        notification.error({
          message: '未选择担任者',
        })
        return
      }
      fetch(config.api.personnel.allocate(this.state.chosenCandidate.roleId, this.props.member.roleId, this.props.affair.get('roleId'), ''), {
        method: 'POST',
        credentials: 'include',
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code == 0) {
          message.success('恢复成功,请在当前角色中查看该角色信息。')
          this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), false).then(() => {
            this.props.callback()
          })
        } else if (json.code == 20000) {
          this.props.callback()
        }
      })
    }

    //更换担任者
    if (this.props.modalType == 2 && this.props.member.userId != 0) {
      fetch(config.api.affair.role.switch(this.props.member.roleId, this.state.chosenCandidate.roleId), {
        method: 'POST',
        credentials: 'include',
        roleId: this.props.affair.get('roleId'),
        affairId: this.props.affair.get('id'),
        resourceId: this.props.member.roleId,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code == 0) {
          message.success('更换成功')
          if (this.props.member.belongAffairId == affair.get('id')) {
            /* 这个角色是当前本事务的，更新本事务roles列表 */
            this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true).then(() => {
              this.props.callback() // 除currentRoleContainer之外调用这个接口时，为避免出错
            })
          } else {
            /*这个角色不是当前本事务的（为子事务的，则调用该角色所属事务的更新roles列表
              为避免其它调用这段代码的地方报错，仍写到调用房的callback里*/
            this.props.callback()
          }
        } else if (json.code == 20000) {
          this.props.callback()
        }
      })
    }
    //添加担任者
    if (this.props.member && this.props.member.userId == 0) {
      fetch(config.api.personnel.allocate(this.state.chosenCandidate.roleId, this.props.member.roleId, this.props.affair.get('roleId'), ''), {
        method: 'POST',
        credentials: 'include',
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code == 0) {
          message.success('添加成功')
          if (this.props.member.belongAffairId == affair.get('id')) {
            /* 这个角色是当前本事务的，更新本事务roles列表 */
            this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true).then(() => {
              this.props.callback() // 除currentRoleContainer之外调用这个接口时，为避免出错
            })
          } else {
            /*这个角色不是当前本事务的（为子事务的，则调用该角色所属事务的更新roles列表
              为避免其它调用这段代码的地方报错，仍写到调用房的callback里*/
            this.props.callback()
          }
        } else if (json.code == 20000) {
          this.props.callback()
        }
      })
    }

    //赋予角色
    if (this.props.modalType == 3) {
      if (this.state.roleTitle == '') {
        message.error('角色名不能为空')
        return
      }
      fetch(config.api.affair.role.allocate(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-SIMU-RoleId': affair.get('roleId'),
          'X-SIMU-AffairId': affair.get('id'),
        },
        method: 'POST',
        roleId: affair.get('roleId'),
        affairId: affair.get('id'),
        credentials: 'include',
        body: JSON.stringify({
          title: this.state.roleTitle,
          ownerRoleId: this.props.member.personalRoleId,
          alliancePermissions: [],
          affairPermissions: [],
          affairId: affair.get('id'),
          reason: '',
        }),
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code == 0) {
          message.success('创建成功')
          this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true).then(() => {
            this.props.callback()
          })
        } else if (json.code == 20000) {
          this.props.callback()
        }
      })
    }
  },
  componentWillMount(){
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
  componentDidMount(){
    this.fetchChooseList()
  },
  fetchChooseList(keyword = '', orgIds = [this.props.affair.get('id')], searchType = 0){
    fetch(config.api.personnel.candidate(this.props.affair.get('roleId')), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        currentAffairId: this.props.affair.get('id'),
        keyword: keyword,
        orgIds: searchType == 2 ? this.state.searchAllianceId : orgIds,
        searchType: searchType,
      }),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        let data = json.data
        if (this.props.modalType == 2) {
          data = data.filter((v) => {
            return v.roleId != this.props.member.roleId
          })
        }
        this.setState({
          candidates: data,
        })
      }

    })
  },
  createTreeNode(root){
    return root.children.length != 0 ?
      <TreeNode
        title={
          <Checkbox
            disabled={root.id == this.props.affair.get('id')}
            onChange={this.handleShowByAffair.bind(null, root.id, root.name)}
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
            onChange={this.handleShowByAffair.bind(null, root.id, root.name)}
            checked={this.state.showAffairIds.some(((v) => {return v == root.id}))}
          >
            {root.name}
          </Checkbox>
        }
        value={`${root.id}`}
        key={root.id}
        isLeaf
      />
  },
  createNodeInAlliance(root){
    return root.children.length != 0 ?
      <TreeNode
        title={
          <Checkbox
            onChange={this.handleShowInAlliance.bind(null, root.id)}
            checked={this.state.showInAlliance.some(((v) => {return v == root.id}))}
          >
            {root.name}
          </Checkbox>
        }
        value={`${root.id}`}
        key={root.id}
      >
        {root.children.map((v) => {
          return this.createNodeInAlliance(v)
        })}
      </TreeNode>
    :
      <TreeNode
        title={
          <Checkbox
            onChange={this.handleShowInAlliance.bind(null, root.id)}
            checked={this.state.showInAlliance.some(((v) => {return v == root.id}))}
          >
            {root.name}
          </Checkbox>
        }
        value={`${root.id}`}
        key={root.id}
        isLeaf
      />
  },
  handleChooseAllAffair(){
    let tmp = []
    const add = (root) => {
      tmp.push(root.id)
      if (root.children != []) {
        root.children.map((v) => {
          add(v)
        })
      }
    }
    add(this.state.affairTree)
    this.setState({ showAffairIds: tmp, showAffairPopover: false })
    this.fetchChooseList(this.state.keyword, tmp, this.state.currentTab)
  },
  handleChooseAllInAlliance(){
    let tmp = []
    const add = (root) => {
      tmp.push(root.id)
      if (root.children != []) {
        root.children.map((v) => {
          add(v)
        })
      }
    }
    add(this.props.allianceTree.get(this.props.affair.get('allianceId')))
    this.setState({ showInAlliance: tmp, showAffairPopover: false })
    this.fetchChooseList(this.state.keyword, tmp, this.state.currentTab)
  },
  handleShowByAffair(id, name, e){
    let newlist = this.state.showAffairIds
    let newNameList = this.state.showAffairNames || []
    if (e.target.checked) {
      newlist.push(id.toString())
      newNameList.push(name)
    } else {
      newlist = newlist.filter((v) => v != id)
      newNameList = newNameList.filter((v) => v != name)
    }
    this.fetchChooseList(this.state.keyword, newlist, this.state.currentTab)
    this.setState({
      showAffairIds: newlist,
      showAffairNames: newNameList
    })
  },
  handleShowInAlliance(id, e){
    let newlist = this.state.showInAlliance
    if (e.target.checked) {
      newlist.push(id.toString())
    } else {
      newlist = newlist.filter((v) => {
        return v != id
      })
    }
    this.fetchChooseList(this.state.keyword, newlist, this.state.currentTab)
    this.setState({
      showInAlliance: newlist
    })
  },
  handleAffairSearch(value){
    this.fetchChooseList(value, this.state.currentTab == 0 ? this.state.showAffairIds : this.state.showInAlliance, this.state.currentTab)
  },
  handleChooseMenkor(alliance, e){
    let { searchAllianceId } = this.state
    if (e.target.checked){
      searchAllianceId.push(alliance.id)
      this.setState({
        searchAllianceId
      }, () => this.fetchChooseList(this.state.keyword, [], this.state.currentTab))
    } else {
      this.setState({
        searchAllianceId: searchAllianceId.filter((v) => {return v != alliance.id})
      }, () => this.fetchChooseList(this.state.keyword, [], this.state.currentTab))
    }
  },
  handleChooseAllInMenkor(){
    this.setState({
      searchAllianceId: this.state.candidates.map((v) => {return v.belongAffairId}),
      showAlliancePopover: false,
    }, () => this.fetchChooseList(this.state.keyword, [], this.state.currentTab))
  },
  renderInAffair(){
    const root = this.state.affairTree
    const { showAffairNames } = this.state
    const affairPopover = (
      <div className={styles.belongAffairPopover}>
        <div className={styles.inAlliance}>
          <div className={styles.title} onClick={this.handleChooseAllAffair}>
            全部
          </div>
          <div className={styles.content}>
            <Tree defaultExpandAll>
              {root && this.createTreeNode(root)}
            </Tree>
          </div>
        </div>
      </div>
    )
    const showAffairNameStr = showAffairNames.length > 2 ? `${showAffairNames[0]}、${showAffairNames[1]}...` : showAffairNames.join('、')
    return (
      <div className={styles.inAffair}>
        <div className={styles.title}>
          <div className={styles.type}>
            <span>{showAffairNames.length == 0 ? '全部' : showAffairNameStr}</span>
            <Popover trigger="click" content={affairPopover} placement="bottom" visible={this.state.showAffairPopover} overlayClassName={styles.affairPopover} onVisibleChange={(visible) => {
              this.setState({ showAffairPopover: visible })
            }}
            >
              <ArrowDropDown height="20" fill="#cccccc"/>
            </Popover>
          </div>
          <div className={styles.search}>
            <DelayedInput placeholder="搜索关键词" onChange={this.handleAffairSearch} />
            <SearchIcon fill="#cccccc" height="12"/>
          </div>
        </div>
        <div className={styles.show}>
          <div className={styles.header}>
            <span className={styles.roleName}>角色名</span>
            <span className={styles.belongAffair}>所属事务</span>
            <span className={styles.userName}>担任者</span>
            <span className={styles.tag}>标签</span>
          </div>
          {
            this.state.candidates.map((v, k) => {
              return (
                <div className={styles.row} key={k}>
                  <Radio onChange={() => {
                    this.setState({ chosenCandidate: v })
                  }} checked={this.state.chosenCandidate ? this.state.chosenCandidate.roleId == v.roleId : false}
                  >
                    <span className={styles.roleName}>{v.personnel ? '-' : v.roleName}</span>
                    <span className={styles.belongAffair}>{v.belongAffairName}</span>
                    <span className={styles.userName}>{v.username ? v.username : '-'}</span>
                    <span className={styles.tag}>{v.tag}</span>
                  </Radio>
                </div>
              )
            })
        }
        </div>
      </div>
    )
  },
  renderInAlliance(){
    const root = this.props.allianceTree.get(this.props.affair.get('allianceId'))
    const affairPopover = (
      <div className={styles.belongAffairPopover}>
        <div className={styles.inAlliance}>
          <div className={styles.title} onClick={this.handleChooseAllInAlliance}>全部</div>
          <div className={styles.content}>
            <Tree defaultExpandAll>
              {root ? this.createNodeInAlliance(root) : null}
            </Tree>
          </div>
        </div>
      </div>
    )
    return (
      <div className={styles.inAffair}>
        <div className={styles.title}>
          <div className={styles.type}>
            <span>全部</span>
            <Popover trigger="click" content={affairPopover} placement="bottom" visible={this.state.showAffairPopover} overlayClassName={styles.affairPopover} onVisibleChange={(visible) => {
              this.setState({ showAffairPopover: visible })
            }}
            >
              <ArrowDropDown height="20" fill="#cccccc"/>
            </Popover>
          </div>
          <div className={styles.search}>
            <DelayedInput placeholder="搜索关键词" onChange={this.handleAffairSearch} />
            <SearchIcon fill="#cccccc" height="12"/>
          </div>
        </div>
        <div className={styles.show}>
          <div className={styles.header}>
            <span className={styles.roleName}>角色名</span>
            <span className={styles.belongAffair}>所属事务</span>
            <span className={styles.userName}>担任者</span>
            <span className={styles.tag}>标签</span>
          </div>
          {
            this.state.candidates.map((v, k) => {
              return (
                <div className={styles.row} key={k}>
                  <Radio onChange={() => {
                    this.setState({ chosenCandidate: v })
                  }} checked={this.state.chosenCandidate ? this.state.chosenCandidate.roleId == v.roleId : false}
                  >
                    <span className={styles.roleName}>{v.personnel ? '-' : v.roleName}</span>
                    <span className={styles.belongAffair}>{v.belongAffairName}</span>
                    <span className={styles.userName}>{v.username ? v.username : '-'}</span>
                    <span className={styles.tag}>{v.tag}</span>
                  </Radio>
                </div>
              )
            })
          }
        </div>
      </div>
    )
  },
  renderMenkor(){
    let allianceList = this.state.candidates.map((v) => {return { name: v.belongAffairName, id: v.belongAffairId }})
    const alliancePopover = (
      <div className={styles.belongAffairPopover}>
        <div className={styles.inAlliance}>
          <div className={styles.title} onClick={this.handleChooseAllInMenkor}>全部</div>
          <div className={styles.allianceContent}>
            {
              allianceList.map((v, k) => {
                return <Checkbox value={v.id} onChange={this.handleChooseMenkor.bind(null, v)} checked={this.state.searchAllianceId.find((l) => {return v.id == l})} key={k}>{v.name}</Checkbox>
              })
            }
          </div>
        </div>
      </div>
    )
    return (
      <div className={styles.inAffair}>
        <div className={styles.title}>
          <div className={styles.type}>
            <span>全部</span>
            <Popover trigger="click" content={alliancePopover} placement="bottom" visible={this.state.showAlliancePopover} overlayClassName={styles.affairPopover} onVisibleChange={(visible) => {
              this.setState({ showAlliancePopover: visible })
            }}
            >
              <ArrowDropDown height="20" fill="#cccccc"/>
            </Popover>
          </div>
          <div className={styles.right}>
            <div className={styles.search}>
              <DelayedInput placeholder="搜索关键词" onChange={this.handleAffairSearch} />
              <SearchIcon fill="#cccccc" height="12"/>
            </div>
            <div className={styles.menkorBtn}>
              在盟客网搜索
            </div>
          </div>
        </div>
        <div className={styles.show}>
          <div className={styles.header}>
            <span className={styles.roleName}>角色名</span>
            <span className={styles.belongAffair}>所属事务</span>
            <span className={styles.userName}>担任者</span>
            <span className={styles.tag}>标签</span>
          </div>
          {
            this.state.candidates.map((v, k) => {
              return (
                <div className={styles.row} key={k}>
                  <Radio onChange={() => {
                    this.setState({ chosenCandidate: v })
                  }} checked={this.state.chosenCandidate ? this.state.chosenCandidate.roleId == v.roleId : false}
                  >
                    <span className={styles.roleName}>{v.personnel ? '-' : v.roleName}</span>
                    <span className={styles.belongAffair}>{v.belongAffairName}</span>
                    <span className={styles.userName}>{v.username ? v.username : '-'}</span>
                    <span className={styles.tag}>{v.tag}</span>
                  </Radio>
                </div>
              )
            })
          }
        </div>
      </div>
    )
  },
  render(){
    const { chosenCandidate } = this.state
    let chosenCandidateStr
    if (chosenCandidate == null) {
      chosenCandidateStr = '在下面操作框内选择担任者'
    }
    else if (this.state.currentTab == 0) {
      chosenCandidateStr = chosenCandidate.belongAffairName + ' ' + (!chosenCandidate.personnel ? chosenCandidate.roleName : chosenCandidate.username)
    }
    else if (this.state.currentTab == 1) {
      chosenCandidateStr = chosenCandidate.roleName + ' ' + chosenCandidate.belongAffairName + '-' + chosenCandidate.username
    }
    else if (this.state.currentTab == 2) {
      chosenCandidateStr = chosenCandidate.roleName + ' ' + chosenCandidate.belongAffairName
    }
    return (
      <Modal
        maskClosable={false}
        visible
        wrapClassName={styles.changeRoleModal}
        width={590}
        title={(this.props.modalType == 2 && this.props.member.userId == 0) ? '添加担任者' : ModalType[this.props.modalType]}
        onCancel={this.handleCancel}
        onOk={this.handleOk}
        okText={'确认'}
      >
        <div className={styles.content}>
          <div className={styles.formRow}>
            <span className={styles.tag}>角色名:</span>
            {this.props.modalType == 0 || this.props.modalType == 3 ?
              <Input
                onChange={(e) => {
                  this.setState({ roleTitle: e.target.value })
                }}
                onBlur={(e) => {
                  e.target.value = e.target.value.replace(/\s+/g, '')
                  this.setState({ roleTitle: e.target.value })
                }}
              />
            : (
              <span className={styles.roleTitle}>{this.props.member.roleTitle}</span>
            )}
          </div>
          <div className={styles.formRow}>
            <span className={styles.tag}>担任者:</span>
            {this.props.modalType == 3 ?
              <span className={styles.tag}>{this.props.member.username}</span>
            : (
              <Input disabled value={chosenCandidateStr}/>
            )}
          </div>
          {this.props.modalType == 3 ?
            null
          : (
            <div className={styles.choose}>
              <div className={styles.choosePanel}>
                <div className={styles.left}>
                  {
                    MemberState.map((v, k) => {
                      return (
                        <div
                          className={styles.row}
                          key={k}
                          style={{
                            color: this.state.currentTab == k ? '#926dea' : '#666666',
                            backgroundColor: this.state.currentTab == k ? 'white' : 'transparent',
                            fontWeight: this.state.currentTab == k ? 500 : 'normal'
                          }}
                          onClick={this.handleSwitchTab.bind(null, k)}
                        >
                          {v}
                        </div>
                      )
                    })
                  }
                  <Motion style={{ top: spring(this.state.currentTab * 30 + 10) }}>
                    {(motionstyle) => <div className={styles.motion} style={{ top: motionstyle.top }}/>}
                  </Motion>
                </div>
                <div className={styles.right}>
                  {this.state.currentTab == 0 ? this.renderInAffair() : this.state.currentTab == 1 ? this.renderInAlliance() : this.renderMenkor()}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    )
  }
})

function mapStateToProps(state) {
  return {
    allianceTree: state.getIn(['alliance', 'allianceTree']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getAffairRoles: bindActionCreators(getAffairRoles, dispatch),
    getSingleTree: bindActionCreators(getSingleTree, dispatch),
    createNewRole: bindActionCreators(createNewRole, dispatch),
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(ChangeRoleModal)
