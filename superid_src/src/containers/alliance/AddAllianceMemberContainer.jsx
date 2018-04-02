import React from 'react'
import { connect } from 'react-redux'
import { Modal, Button, Input, Checkbox, Tooltip, message, Select, Popover } from 'antd'
import { SearchIcon, DeleteIcon, ImgEditIcon } from 'svg'
import styles from './AddAllianceMemberContainer.scss'
import { List, Range, fromJS, Record } from 'immutable'
import _ from 'underscore'
import config from '../../config'
import messageHandler from 'messageHandler'


const SearchResultRecord = Record({
  avatar: '',
  name: '',
  superid: '',
  id: null,
  tage: [],
  comments: '',
  isCandidate: false,
  mainAffairId: '',
  roleTitle: '',
  roleId: '',
  memberId: '',
  permissions: [],
  rootRoleId: '',
  hired: null,
  ifHire: 'false',
})

const Option = Select.Option

const AddAllianceMemberComponent = React.createClass({
  getInitialState() {
    return {
      searchKeyword: '',
      userSearchResult: List(),
      candidateList: List(),
      currentFocusCandidate: null,

      comments: '', //备注
      containNameChecked: true, //按用户名查询
      containTagChecked: false, //按标签查询
      options: this.props.options,
      permissionTemplet: [],
      showCommentsEdit: false,
    }
  },
  getDefaultProps() {
    return {
      onClose: () => {},
      options: [],
    }
  },
  componentDidMount() {
    this._roleList = this.props.options
    this.handleTriggerSearchRequest = _.debounce((value) => {
      if (!value) {
        this.setState({
          userSearchResult: List(),
        })
      }

      fetch(config.api.alliance.candidates.search(this.props.affair.get('roleId'), value), {
        method: 'GET',
        credentials: 'include',
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
      }).then((res) => res.json()).then(messageHandler).then((res) => {
        const data = res.data
        if (res.code == 0)
          this.setState({
            userSearchResult: List(data).map((v) => SearchResultRecord({
              avatar: v.avatar,
              name: v.name,
              superid: v.superId,
              id: v.id,
              memberId: v.memberId,
              rootRoleId: v.rootRoleId,
              hired: v.hired,
            }))
          })
      })
    }, 300)
    this.handleRoleSelectOnChange = _.debounce((superid, value) => {
      if (value){
        let options = this._roleList.filter( (v) => {
          return v.title.indexOf(value) != -1
        })

        this.setState({
          options: options.length == 0 ? [] : options
        })
      } else {
        this.setState({
          options: this._roleList
        })
      }
      let index = this.state.candidateList.findIndex( (v) => v.get('superid') == superid)
      this.setState({
        candidateList: this.state.candidateList.setIn([index, 'roleTitle'], value)
      })
    }, 200)

    this.submit = _.throttle(() => {
      let data = this.state.candidateList.map( (v) => {

        return {
          beInvitedRoleId: v.get('rootRoleId'),
          affairId: this.props.affair.get('id'),
          roleTitle: v.get('roleTitle').trim(),
          beAllocatedRoleId: 0,
          reason: v.get('comments'),
          ifHire: v.get('ifHire') == 'true' ? true : false,
					// permissions:v.get('permissions'),
        }
      }).toJS()
      fetch(config.api.alliance.member.post(this.props.affair.get('roleId')), {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
        body: JSON.stringify({
          beInvitedUsers: data,
        }),
        credentials: 'include',
      }).then((res) => res.json()).then(messageHandler).then((res) => {
        if (res.code == 0){
          message.success('成功发送邀请', 1)
          this.props.onRefresh && this.props.onRefresh()
          this.clearState()
          this.props.onClose()
        }
      })
    }, 1000, { trailing: false })
  },
  clearState(){
    this.setState({
      searchKeyword: '',
      userSearchResult: List(),
      candidateList: List(),
      currentFocusCandidate: {},

      options: [], //role list
      comments: '', //备注
      containNameChecked: true, //按用户名查询
      containTagChecked: false, //按标签查询
    })
  },
	// Getter
  getTreeData() {
    function walk(tree){
      return tree.map( (v) => {
        if (v.get('children').isEmpty()){
          return {
            label: v.get('name'),
            value: v.get('id'),
            key: v.get('id'),
          }
        } else {
          return {
            label: v.get('name'),
            value: v.get('id'),
            key: v.get('id'),
            children: walk(v.get('children'))
          }
        }
      }).toJS()
    }

    let result = walk(this.props.affairTree)
    return result
  },

	// Handler
  handleSearchKeywordChange(evt) {
    const value = evt.target.value
    this.handleTriggerSearchRequest(value)
    this.setState({
      searchKeyword: value,
    })
  },
  handleSearch(e){
    if (e.keyCode == 13){
      const value = e.target.value
      if (!value) {
        this.setState({
          userSearchResult: List(),
        })
      }
      fetch(config.api.alliance.candidates.search(this.props.affair.get('roleId'), value), {
        method: 'GET',
        credentials: 'include',
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
      }).then((res) => res.json()).then((res) => {
        const data = res.data
        if (res.code == 0) {
          this.setState({
            userSearchResult: List(data).map((v) => SearchResultRecord({
              avatar: v.avatar,
              name: v.name,
              superid: v.superId,
              id: v.id,
              memberId: v.memberId,
              rootRoleId: v.rootRoleId
            }))
          })
        }
      })
    }
  },
  handleCheckboxChange(superid, evt) {
    this.setState({
      candidateList: evt.target.checked ?
				this.state.candidateList.push(this.state.userSearchResult.find((v) => v.get('superid') == superid))
			:
				this.state.candidateList.filter((v) => v.get('superid') != superid),
      currentFocusCandidate: evt.target.checked ?
				this.state.currentFocusCandidate
			: this.state.currentFocusCandidate == superid ?
				null
			:
				this.state.currentFocusCandidate,
    })
  },
  handleRemoveCandidate(superid, evt) {
		// Prevent switch focus unintentially when click delete button.
    evt.stopPropagation()

    this.setState({
      candidateList: this.state.candidateList.filter((v) => v.get('superid') != superid),
      currentFocusCandidate: superid == this.state.currentFocusCandidate ? null : this.state.currentFocusCandidate,
    })
  },
  handleSwitchFocuseCandidate(superid) {
    this.setState({
      currentFocusCandidate: superid,
    })
  },
  handleSelectSearchType(name){
    if (name == 'name'){
      this.state.containTagChecked ? this.setState({
        containNameChecked: !this.state.containNameChecked
      }) : null
    } if (name == 'tag'){
      this.state.containNameChecked ? this.setState({
        containTagChecked: !this.state.containTagChecked
      }) : null
    }
  },


  handleCommentsEdit(superid, comments, visible){
    if (!visible){
      let index = this.state.candidateList.findIndex( (v) => v.get('superid') == superid)
      this.setState({
        candidateList: this.state.candidateList.setIn([index, 'comments'], this.state.comments),
        comments: '',
        showCommentsEdit: false,
      })
    } else {
      this.setState({
        comments: comments,
        showCommentsEdit: true,
      })
    }
  },

  handleSubmit(){
    if (this.state.candidateList.size == 0){
      message.error('未选择成员', 1)
      return
    }
		// else if (this.state.candidateList.some((v) => v.get('roleTitle')=='')){
		// 	message.error('未添加角色', 1)
		// }
    else {
      this.submit()
    }
  },

  handleCancel(){
    this.clearState()
    this.props.onClose()
  },

  handleMainAffairSelect(superid, value){
    let index = this.state.candidateList.findIndex( (v) => v.get('superid') == superid)
    this.setState({
      candidateList: this.state.candidateList.setIn([index, 'mainAffairId'], value)
    })
  },

  handleRoleSelect(superid, value, option){
    let index = this.state.candidateList.findIndex( (v) => v.get('superid') == superid)
    this.setState({
      candidateList: this.state.candidateList.setIn([index, 'roleTitle'], option.props.data[0]).setIn([index, 'roleId'], option.props.data[1])
    })
  },

  handleChangePermission(e){
    let index = this.state.candidateList.findIndex((v) => v.get('superid') == this.state.currentFocusCandidate)
    this.setState({
      candidateList: this.state.candidateList.setIn([index, 'permissions'], fromJS({
        '管理盟成员与角色': {
          chosen: e.target.checked,
          value: 5,
        }
      })),
    })
  },

  renderPopoverContent(props){
    return (
      <div className={styles.popOver}>
        <div className={styles.name}>对{props.name}说些什么：</div>
        <div className={styles.input}>
          <Input type="textarea" value={this.state.comments} onChange={(e) => {
            if (e.target.value.length > 200){
              message.error('备注不能超过200字', 1)
              return
            }
            else {
              this.setState({ comments: e.target.value })
            }
          }
					} style={{ resize: 'none' }} rows={5}
          />
        </div>
      </div>
    )
  },

	// Render
  renderHighlightContent(text) {
    if (text == ''){
      return <span>{text}</span>
    }
    else if (this.state.searchKeyword) {
      let segments = List(text ? text.split(this.state.searchKeyword) : [])
      Range(0, segments.size - 1).forEach((v) => {
        segments = segments.insert(2 * v + 1, this.state.searchKeyword)
      })
      return (<span>
        {segments.map((v, k) => <span key={k} className={k % 2 ? styles.highlight : null}>{v}</span>)}
      </span>)
    } else {
      return <span>{text}</span>
    }
  },
  renderSearchUser (){
    return (<div className={styles.searchUserContainer}>
      {false &&
        <div>
          <div className={styles.searchType}>
            <Checkbox onChange={this.handleSelectSearchType.bind(this, 'name')} checked={this.state.containNameChecked} className={styles.searchTypeCheckBox} style={{ top: '0px', left: '-11px' }}>用户名/SuperID</Checkbox>
            <Checkbox onChange={this.handleSelectSearchType.bind(this, 'tag')} checked={this.state.containTagChecked} className={styles.searchTypeCheckBox} style={{ top: '0px', right: '-11px' }}>标签</Checkbox>
          </div>
        </div>
			}
      <div className={styles.searchField}>
        <Input placeholder={'搜索用户名/SuperID/标签'} value={this.state.searchKeyword} onChange={this.handleSearchKeywordChange} onKeyDown={this.handleSearch} />
        <span className={styles.searchIcon}><SearchIcon/></span>
      </div>

      <div className={styles.userSearchResult}>
        {
          this.state.userSearchResult.filter((v) => {
            return v.get('id') != this.props.user.get('id')
          }).map((v, k) => {
            return v.get('memberId') == -1 ?
              <div className={styles.searchResultItem} key={k}>
                <Checkbox checked={this.state.candidateList.some((w) => v.get('superid') == w.get('superid'))} onChange={this.handleCheckboxChange.bind(this, v.get('superid'))} />
                <div className={styles.searchResultAvatar}>{v.get('avatar') ? <img src={v.get('avatar')}/> : null}</div>
                <div className={styles.searchResultInfo}>
                  <div className={styles.name}>{this.renderHighlightContent(v.get('name'))}</div>
                  <div className={styles.id}>ID:{this.renderHighlightContent(v.get('superid'))}</div>
                </div>
              </div> :
              <div className={styles.searchResultItem} key={k}>
                <Checkbox checked disabled />
                <div className={styles.searchResultAvatar}>{v.get('avatar') ? <img src={v.get('avatar')}/> : null}</div>
                <div className={styles.searchResultInfo}>
                  <div className={styles.name}>{this.renderHighlightContent(v.get('name'))}</div>
                  <div className={styles.id}>ID:{this.renderHighlightContent(v.get('superid'))}</div>
                </div>
              </div>
          })
        }
      </div>
    </div>)
  },
  renderCandidateList() {
    return (
      <div className={styles.candidateList}>
        <p>已选择成员：</p>

        <div className={styles.tableHeader}>
          <div className={styles.tableHeaderName}>用户名</div>
          <div style={{ width: '120px', marginRight: '10px' }}>主事务</div>
          <div style={{ width: '120px', marginRight: '10px' }}>人事关系</div>
          <div style={{ width: '120px', marginRight: '10px' }}>角色</div>
          <div>备注</div>
        </div>

        <div className={styles.tableBody}>
          {
						this.state.candidateList.map((v, k) => {
  return (
    <div className={styles.tableItem} key={k} style={this.state.currentFocusCandidate == v.get('superid') ? { backgroundColor: '#fafafa' } : {}} onClick={this.handleSwitchFocuseCandidate.bind(this, v.get('superid'))}>
      <span className={styles.deleteIcon} onClick={this.handleRemoveCandidate.bind(this, v.get('superid'))}>
        <Tooltip placement="bottom" title="移除">
          <DeleteIcon />
        </Tooltip>
      </span>

      <div className={styles.tableItemName}>
        <span className={styles.name}>{v.get('name')}</span>
        <span className={styles.id}>ID:{v.get('superid')}</span>
      </div>

      {/* 选择主事务
                    <TreeSelect treeData={this.getTreeData()} onSelect={this.handleMainAffairSelect.bind(this,v.get('superid'))} dropdownStyle={{height:'150px',overflow:'scroll'}} style={{width: '130px', height: '26px'}} placeholder="选择主事务" treeDefaultExpandAll dropdownMatchSelectWidth={false}></TreeSelect>
                  */}
      <Input value={this.props.affair.get('name')} disabled style={{ width: '120px', height: '26px', marginRight: '10px' }}/>
      <Select style={{ width: '120px', height: '26px', marginRight: '10px' }} onChange={(value) => {this.setState({ candidateList: this.state.candidateList.setIn([k, 'ifHire'], value) })}} defaultValue={v.get('ifHire')}>
        <Option value="true">有人事关系</Option>
        <Option value="false">无人事关系</Option>
      </Select>

      {/*<Select ref="role" combobox style={{ width: '120px', height: '26px', marginLeft: 10 }} filterOption={false} placeholder="添加角色" onSelect={this.handleRoleSelect.bind(this, v.get('superid'))} onChange={this.handleRoleSelectOnChange.bind(null, v.get('superid'))}>*/}
      {/*{this.state.options.map( (v) => (*/}
      {/*<Option value={v.title} data={[v.title, v.id]} key={''+v.id} >*/}
      {/*{*/}
      {/*v.id!=0?<div className={styles.roleItem}>*/}
      {/*<div className={styles.description}>*/}
      {/*<span className={styles.roleTitle}>{v.title}</span>*/}
      {/*<span className={styles.mainAffair}>{v.affairName}</span>*/}
      {/*</div>*/}
      {/*<div className={styles.icon}><HistoryIcon style={{ width:'32px', height:'20px', fill:'#e8b2b8' }}/></div>*/}
      {/*</div>:<div>*/}
      {/*<span>{v.title}</span>*/}
      {/*</div>*/}
      {/*}*/}
      {/*</Option>*/}
      {/*))}*/}
      {/*</Select>*/}

      <Input placeholder="输入角色名" style={{ width: '120px', height: '26px', marginRight: '10px' }} onChange={(e) => {this.setState({ candidateList: this.state.candidateList.setIn([k, 'roleTitle'], e.target.value) })}}/>
      <Popover trigger="click" content={this.renderPopoverContent({ name: v.name })} overlayClassName={styles.popOverOverlay} placement="bottomRight" onVisibleChange={this.handleCommentsEdit.bind(this, v.get('superid'), v.get('comments'))}>
        {
                      v.get('comments') ? <span className={styles.comments}>{v.get('comments').length > 2 ? v.get('comments').substring(0, 2) + '...' : v.get('comments')}</span> :
                      <span className={styles.editIcon}>
                        <ImgEditIcon fill={this.state.showCommentsEdit ? '#926dea' : '#cccccc'}/>
                      </span>
                    }
      </Popover>

      {/*<Input placeholder="输入备注" style={{ width:'160px', height:'26px' }} onChange={(e) => {this.setState({ candidateList:this.state.candidateList.setIn([k, 'comments'], e.target.value) })}}/>*/}
    </div>
  )
})
					}
        </div>
      </div>
    )
  },
  handleChangeSingle(child, chosenMember, e){
    const { candidateList } = this.state
    if (e.target.checked == true){
      chosenMember.get('permissions').push(child.id)
      this.setState({
        candidateList: candidateList,
      })
    }
    else if (e.target.checked == false){
      chosenMember = chosenMember.set('permissions', chosenMember.get('permissions').filter((v) => {return v != child.id}))
      this.setState({
        candidateList: candidateList.set(candidateList.findIndex((v) => v.get('superid') == chosenMember.get('superid')), chosenMember),
      })
    }
  },
  handleChangeGroup(group, chosenMember, e){
    const { candidateList } = this.state
    if (e.target.checked == true){
      group.childs.map((child) => {
        if (!chosenMember.get('permissions').some((v) => {return v == child.id})){
          chosenMember.get('permissions').push(child.id)
        }
      })
      this.setState({
        candidateList: candidateList
      })
    }
    else if (e.target.checked == false){
      let tmp = chosenMember.get('permissions')
      group.childs.map((child) => {
        tmp = tmp.filter((v) => {return v != child.id})
      })
      chosenMember = chosenMember.set('permissions', tmp)
      this.setState({
        candidateList: candidateList.set(candidateList.findIndex((v) => v.get('superid') == chosenMember.get('superid')), chosenMember),
      })
    }
  },
  renderPermissionBlock(v, k, chosenMember){
    let groupChecked = true
    v.childs.map((child) => {
      if (!chosenMember.get('permissions').some((v) => {return v == child.id})){
        groupChecked = false
      }
    })
    return v.id <= 0 ?
      <div className={styles.permissionBlock} key={k}>
        <Checkbox onChange={this.handleChangeGroup.bind(null, v, chosenMember)} checked={groupChecked}>{v.name}</Checkbox>
        <div className={styles.children}>
          {
							v.childs != [] ?
									v.childs.map((child, key) => {
  return <Checkbox key={key} onChange={this.handleChangeSingle.bind(null, child, chosenMember)} checked={chosenMember.get('permissions').some((v) => {return child.id == v})}>{child.name}</Checkbox>
})
									: null
						}
        </div>
      </div>
				:
      <div className={styles.permissionBlock} key={k}>
        <Checkbox onChange={this.handleChangeSingle.bind(null, v, chosenMember)} checked={chosenMember.get('permissions').some((w) => {return v.id == w})}>{v.name}</Checkbox>
      </div>
  },
  render() {
    const footer = [
      <Button key="back" type="ghost" className={styles.button} onClick={this.handleCancel}>取 消</Button>,
      <Button key="submit" type="primary" onClick={this.handleSubmit} className={styles.button}>
							完成添加
      </Button>,
    ]
    return (
      <Modal
        visible
        title="添加成员"
        footer={footer}
        wrapClassName={styles.container}
        width={798}
        onOK={this.handleSubmit}
        onCancel={this.handleCancel}
        maskClosable={false}
      >
        <div className={styles.content}>
          {this.renderSearchUser()}
          {this.renderCandidateList()}
        </div>
      </Modal>
    )
  },
})

function mapStateToProps(state) {
  return {
    user: state.get('user'),
    affairMap: state.getIn(['affair', 'affairMap'])
  }
}

function mapDispatchToProps() {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(AddAllianceMemberComponent)
