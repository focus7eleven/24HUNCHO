import React from 'react'
import styles from './HistoryMemberContainer.scss'
import { connect } from 'react-redux'
import { Table, Input, Switch } from 'antd'
import { SearchIcon } from 'svg'
import MemberCard from './MemberCard'
import config from '../../../config'
import InviteAllianceMember from './InviteAllianceMember'
import SearchModal from './SearchModal'
import imageNoPeople from 'images/img_no_people.png'
import _ from 'underscore'
const HistoryMemberContainer = React.createClass({
  getInitialState(){
    return {
      showMember: {},
      showInviteModal: false,
      hasData: false,
      canRender: false,
      total: 0,
      roleList: [],
      isSearching: false,
      isContainChildren: false,
      keyword: '',
    }
  },
  componentWillMount(){
    const data = {
      key: '',
      page: 1,
      count: 100,
      sortColumn: 'name',
      isReverseSort: false,
      includeSubAffair: false,
      needTotal: true,
      leaveAlliance: true,
    }
    fetch(config.api.affair.member.current(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      body: JSON.stringify(data),
    }).then((res) => {
      return res.json()
    }).then((json) => {
      let data = json.data
      if (!json.data.list.length){
        this.setState({
          hasData: false,
          // hasData:true,
          canRender: true,
        })
      }
      else {
        fetch(config.api.affair.member.detail(json.data.list[0].userId), {
          method: 'GET',
          credentials: 'include',
          affairId: this.props.affair.get('id'),
          roleId: this.props.affair.get('roleId'),
        }).then((res) => res.json()).then((json) => {
          this.setState({
            list: data.list.map((v, k) => {return { avatar: v.avatar, belongAffair: v.belongAffair, level: v.level, roleTitle: v.roleTitle, userId: v.userId, username: v.username, id: k + 1 }}),
            hasData: true,
            showMember: json.data,
            canRender: true,
            total: data.total,
          })
        })
        fetch(config.api.affair.member.cards(this.props.affair.get('roleId')), {
          method: 'GET',
          credentials: 'include',
          affairId: this.props.affair.get('id'),
          roleId: json.data.list[0].userId,
        }).then((res) => res.json()).then((json) => {
          this.setState({
            roleList: json.data,
          })
        })
      }

    })
  },
  componentDidMount(){
    this._search = _.debounce((keyword) => {

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
          key: keyword,
          page: 1,
          count: 100,
          sortColumn: 'name',
          isReverseSort: false,
          includeSubAffair: this.state.isContainChildren,
          needTotal: false,
          leaveAlliance: true,
        }),
      }).then((res) => res.json()).then((json) => {
        let data = json.data
        if (!json.data.list.length){
          this.setState({
            hasData: false,
            canRender: true,
          })
        }
        else {
          fetch(config.api.affair.member.detail(json.data.list[0].userId), {
            method: 'GET',
            credentials: 'include',
            affairId: this.props.affair.get('id'),
            roleId: this.props.affair.get('roleId'),
          }).then((res) => res.json()).then((json) => {
            this.setState({
              list: data.list.map((v, k) => {return { avatar: v.avatar, belongAffair: v.belongAffair, level: v.level, roleTitle: v.roleTitle, userId: v.userId, username: v.username, id: k + 1 }}),
              hasData: true,
              canRender: true,
              showMember: json.data,
            })
          })
        }
      })
    }, 300)

  },
  componentWillReceiveProps(nextProps){
    if (this.props.affair.get('id') != nextProps.affair.get('id')){
      const data = {
        key: '',
        page: 1,
        count: 100,
        sortColumn: 'name',
        isReverseSort: false,
        includeSubAffair: false,
        needTotal: true,
        leaveAlliance: true,
      }
      fetch(config.api.affair.member.current(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        credentials: 'include',
        affairId: nextProps.affair.get('id'),
        roleId: nextProps.affair.get('roleId'),
        body: JSON.stringify(data),
      }).then((res) => {
        return res.json()
      }).then((json) => {
        let data = json.data
        if (!json.data.list.length){
          this.setState({
            hasData: false,
            // hasData:true,
            canRender: true,
          })
        }
        else {
          fetch(config.api.affair.member.detail(nextProps.affair.get('roleId'), this.props.affair.get('id'), json.data.list[0].userId), {
            method: 'GET',
            credentials: 'include',
            affairId: nextProps.affair.get('id'),
            roleId: nextProps.affair.get('roleId'),
          }).then((res) => res.json()).then((json) => {
            this.setState({
              list: data.list.map((v, k) => {return { avatar: v.avatar, belongAffair: v.belongAffair, level: v.level, roleTitle: v.roleTitle, userId: v.userId, username: v.username, id: k + 1 }}),
              hasData: true,
              showMember: json.data,
              canRender: true,
              total: data.total,
            })
          })
          fetch(config.api.affair.member.cards(this.props.affair.get('roleId')), {
            method: 'GET',
            credentials: 'include',
            affairId: this.props.affair.get('id'),
            roleId: json.data.list[0].userId,
          }).then((res) => res.json()).then((json) => {
            this.setState({
              roleList: json.data,
            })
          })
        }
        this.setState({ isContainChildren: false })
      })
    }

  },

  closeInviteModal(){
    this.setState({
      showInviteModal: false,
    })
  },
  handleRowClick(record){
    if (record.userId == this.state.showMember.id){
      return
    }
    fetch(config.api.affair.member.detail(this.props.affair.get('roleId'), this.props.affair.get('id'), record.userId), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => {
      return res.json()
    }).then((json) => {
      if (json.code == 0){
        this.setState({
          showMember: json.data,
        })
      }
    })
    fetch(config.api.affair.member.cards(this.props.affair.get('roleId')), {
      method: 'GET',
      credentials: 'include',
      roleId: record.userId,
      affairId: this.props.affair.get('id'),
    }).then((res) => res.json()).then((json) => {
      this.setState({
        roleList: json.data,
      })
    })
  },
  handleSearchMore(){
    this.setState({
      showSearchModal: true,
    })
  },
  handleSearch(e){
    if (e.target.value){
      this._search(e.target.value)
      this.setState({
        isSearching: true,
        keyword: e.target.value,
      })
    }
    else {
      this._search(e.target.value)
      this.setState({
        isSearching: false,
        keyword: '',
      })
    }
  },
  handleChildrenSwitch(checked){
    if (this.state.isSearching){
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
          key: this.state.keyword,
          page: 1,
          count: 100,
          sortColumn: 'name',
          isReverseSort: false,
          includeSubAffair: checked,
          needTotal: false,
          leaveAlliance: true,
        }),
      }).then((res) => res.json()).then((json) => {
        let data = json.data
        if (!json.data.list.length){
          this.setState({
            hasData: false,
            canRender: true,
            isContainChildren: checked,
          })
        }
        else {
          fetch(config.api.affair.member.detail(this.props.affair.get('roleId'), this.props.affair.get('id'), json.data.list[0].userId), {
            method: 'GET',
            credentials: 'include',
            affairId: this.props.affair.get('id'),
            roleId: this.props.affair.get('roleId'),
          }).then((res) => res.json()).then((json) => {
            this.setState({
              list: data.list.map((v, k) => {return { avatar: v.avatar, belongAffair: v.belongAffair, level: v.level, roleTitle: v.roleTitle, userId: v.userId, username: v.username, id: k + 1 }}),
              hasData: true,
              canRender: true,
              showMember: json.data,
              isContainChildren: checked,
            })
          })
        }
      })
    }
    else {
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
          key: '',
          page: 1,
          count: 100,
          sortColumn: 'name',
          isReverseSort: false,
          includeSubAffair: checked,
          needTotal: false,
          leaveAlliance: true,
        }),
      }).then((res) => res.json()).then((json) => {
        let data = json.data
        if (!json.data.list.length){
          this.setState({
            hasData: false,
            canRender: true,
            isContainChildren: checked,
          })
        }
        else {
          fetch(config.api.affair.member.detail(this.props.affair.get('roleId'), this.props.affair.get('id'), json.data.list[0].userId), {
            method: 'GET',
            credentials: 'include',
            affairId: this.props.affair.get('id'),
            roleId: this.props.affair.get('roleId'),
          }).then((res) => res.json()).then((json) => {
            this.setState({
              list: data.list.map((v, k) => {return { avatar: v.avatar, belongAffair: v.belongAffair, level: v.level, roleTitle: v.roleTitle, userId: v.userId, username: v.username, id: k + 1 }}),
              hasData: true,
              canRender: true,
              showMember: json.data,
              isContainChildren: checked,
            })
          })
        }
      })
    }
  },
  render(){
    const columns = [
      {
        dataIndex: 'username',
        title: '用户名',
        width: 200,
        render: (text, record) => {return <div className={styles.nameDiv}>{record.avatar ? <img src={record.avatar} className={styles.avatar}/> : <div className={styles.nullAvatar} />}<span className={styles.name}>{text}</span></div>}
        // sorter:(a,b)=>a.name.localeCompare(b.name)
      }, {
        dataIndex: 'roleTitle',
        title: '角色',
        width: 150,
        // sorter:(a,b)=>a.role.length>b.role.length,
        // render:(text,record,lineindex)=><div>{text.map((self,index)=><p key={'role'+lineindex+index}>{self}</p>)}</div>
      }, {
        dataIndex: 'belongAffairName',
        title: '主事务',
        width: 150,
        // render:(text,record,lineindex)=><div>{text.map((self,index)=><p key={'affair'+lineindex+index}>{self}</p>)}</div>
      },
    ]
    return this.state.canRender ? <div className={styles.container}>
      <div className={styles.operations}>
        <div className={styles.leftSide}>
          <div className={styles.searchField}>
            <Input placeholder="请输入关键词" onChange={this.handleSearch} />
            <span className={styles.searchIcon}><SearchIcon/></span>
          </div>
          <span className={styles.searchMore} onClick={this.handleSearchMore}>高级搜索</span>
        </div>
        <div className={styles.switchField}>
          <span>包含子事务</span>
          <Switch checkedChildren="开" unCheckedChildren="关" checked={this.state.isContainChildren} onChange={this.handleChildrenSwitch} />
        </div>
      </div>
      {this.state.hasData ?
        <div className={styles.show}>
          <div className={styles.tableContainer}>
            {!this.state.isSearching ? <div className={styles.tableTitle}>当前成员共&nbsp;{this.state.total}&nbsp;人</div> : <div className={styles.tableTitle}>搜索结果如下:</div>}
            <Table columns={columns} dataSource={this.state.list} align="center" onRowClick={this.handleRowClick} />
          </div>
          <div className={styles.memberCard}>
            <MemberCard member={this.state.showMember} roleList={this.state.roleList} invite={() => {this.setState({ showInviteModal: true })}} type="history" affair={this.props.affair} />
          </div>
        </div> : <div className={styles.noMember}><img src={imageNoPeople} /><div>暂无离盟成员...</div></div>}


      <InviteAllianceMember visible={this.state.showInviteModal} onCloseModal={this.closeInviteModal}/>
      <SearchModal showSearchModal={this.state.showSearchModal} onClose={() => {this.setState({ showSearchModal: false })}} />
    </div> : null
  }
})

function mapStateToProps(state) {
  return {
    members: state.get('user').get('members'),
  }
}

function mapDispatchToProps() {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(HistoryMemberContainer)
