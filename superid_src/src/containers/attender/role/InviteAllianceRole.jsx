import React from 'react'
import { Modal, Select, Input } from 'antd'
import styles from './ModalCommon.scss'
import { CloseIcon, SearchIcon } from 'svg'
import classNames from 'classnames'
import config from '../../../config'
import { List } from 'immutable'
import _ from 'underscore'
import { getAffairRoles } from '../../../actions/affair'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

const Option = Select.Option

let InviteAllianceRole = React.createClass({
  getDefaultProps() {
    return {
      visible: true,
      onCloseModal: () => {
      }
    }
  },
  getInitialState(){
    return {
      data: {},
      checkedlist: List(),
    }
  },
  componentWillReceiveProps(nextProps){
    if (nextProps.visible == true) {
      fetch(config.api.affair.role.other(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        affairId: nextProps.affair.get('id'),
        roleId: nextProps.affair.get('roleId'),
        body: JSON.stringify({
          key: '',
          page: 1,
          count: 100,
          isAllianceUser: true,
          needTotal: true,
          section: 1,
        })
      }).then((res) => res.json()).then((json) => {
        this.setState({
          data: json.data,
        })
      })
    }
  },
  componentDidMount(){
    this.search = _.debounce(() => {
      fetch(config.api.affair.role.other(), {
        headers: {
          'Accept': 'application/json',
          'Content-TYpe': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
        body: JSON.stringify({
          key: this.state.searchKey,
          page: 1,
          count: 100,
          isAllianceUser: true,
          needTotal: true,
          section: 1,
        })
      }).then((res) => res.json()).then((json) => {
        this.setState({
          data: json.data,
        })
      })
    }, 300)
  },
  chooseMember(role){
    if (this.state.checkedlist.includes(role)){
      this.setState({
        checkedlist: this.state.checkedlist.filter((v) => v.roleId != role.roleId)
      })
    } else {
      this.setState({
        checkedlist: this.state.checkedlist.push(role),
      })
    }
  },
  handleDeleteRole(role){
    this.setState({
      checkedlist: this.state.checkedlist.filter((v) => v.roleId != role.roleId),
    })
  },
  handleCloseModal(){
    let clear = _.debounce(() => this.setState({ checkedlist: List() }), 500)
    clear()
    this.props.onCloseModal()
  },
  handleSendInvite(){
    const { affair } = this.props
    let allianceRoles = []
    this.state.checkedlist.map((v) => {
      allianceRoles.push(v.roleId)
    })
    fetch(config.api.affair.role.invite(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        allianceRoles: allianceRoles,
        outAllianceRoles: [],
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true).then(() => {
          let clear = _.debounce(() => this.setState({ checkedlist: List() }), 500)
          clear()
          this.props.onCloseModal()
        })
      }
    })
  },
  handleSearch(e){
    this.setState({
      searchKey: e.target.value,
    })
    this.search()
  },
  render() {
    let { visible } = this.props
    let list = this.state.data.list

    const selectBefore = (
      <Select defaultValue="in">
        <Option value="in">盟内角色</Option>
        <Option value="out">盟外角色</Option>
      </Select>
    )
    return (
      <Modal
        wrapClassName={styles.commonModal}
        title="邀请角色"
        visible={visible}
        onCancel={this.handleCloseModal}
        onOk={this.handleSendInvite}
        maskClosable={false}
      >
        <div className={styles.content}>
          <div className={styles.searchField} style={{ margin: '10px 0 20px 0' }}>
            <div className={styles.selectContainer}>
              {selectBefore}
            </div>
            <Input placeholder={'搜索角色／用户名／SuperID／主事务／标签/手机号'} style={{ paddingLeft: 88 }} onChange={this.handleSearch}/>
            <span className={styles.searchIcon}><SearchIcon/></span>
          </div>

          <div className={styles.memberList}>
            {
              list ? list.map((v, k) => {
                let checked = this.state.checkedlist.includes(v)
                return (<div className={classNames(styles.member, checked ? 'checked' : '')} onClick={this.chooseMember.bind(null, v)} key={k}>
                  {v.avatar ? <img src={v.avatar} alt="" /> : <div className={styles.noavatar} />}
                  <div>
                    <div className={styles.roleTitle}>{v.roleTitle}</div>
                    <div>{v.username}</div>
                  </div>
                </div>)
              }) : null
            }
          </div>

          <div className="u-text-12" style={{ marginTop: 20 }}>已添加：</div>
          <div className={styles.checkList}>
            {
              this.state.checkedlist.map((role) => {
                return (
                  <div className={styles.role} key={role.roleId}>
                    <span onClick={this.handleDeleteRole.bind(null, role)}><CloseIcon/></span>
                    <div className={styles.name}>{role.username}</div>
                    <div className={styles.participant}>{role.roleTitle}</div>
                  </div>
                )
              })
            }
          </div>
        </div>
      </Modal>
    )
  }
})

function mapStateToProps() {
  return {}
}

function mapDispatchToProps(dispatch) {
  return {
    getAffairRoles: bindActionCreators(getAffairRoles, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(InviteAllianceRole)
