import React, { PropTypes } from 'react'
import styles from './MemberCard.scss'
import { DropDownIcon } from 'svg'
import SimpleMemberCard from '../../../components/card/SimpleMemberCard'
import AffairRoleCard from '../../../components/card/AffairRoleCard'
import { Button, Tag, message, Select } from 'antd'
import AuthorityModal from './AuthorityModal'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getSingleTree } from '../../../actions/alliance'
import config from '../../../config'
import NewRoleModal from './NewRoleModal'
import ChangeRoleModal from '../role/ChangeRoleModal'
import PERMISSION from 'utils/permission'

const Option = Select.Option
const MemberCard = React.createClass({
  propTypes: {
    member: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
    affair: PropTypes.object,
    fresh: PropTypes.func,
    roleList: PropTypes.array,
  },
  getDefaultProps(){
    return {
    }
  },
  getInitialState(){
    return {
      showAuthorityModal: false,
      showNewRoleModal: false,
      modalType: 1,
      changeMember: {},
      showHistoryRoles: false,
      showRoleModal: false,
    }
  },
  componentWillReceiveProps(nextProps){
    this.setState({
      showHistoryRoles: false,
      ifHire: nextProps.member.ifHire,
    })
  },

  closeAuthorityModal(){
    this.setState({
      showAuthorityModal: false,
      changeMember: {},
    })
  },
  closeNewRoleModal(){
    this.setState({
      showNewRoleModal: false,
    })
    this.props.fresh()
  },
  changeAuthority(member){
    this.props.getSingleTree(this.props.affair.get('allianceId')).then(() => {
      this.setState({
        showAuthorityModal: true,
        modalType: 0,
        changeMember: member,
      })
    })
  },
  handleGiveNewRole(){
    this.props.getSingleTree(this.props.affair.get('allianceId')).then(() => {
      this.setState({
        showNewRoleModal: true,
      })
    })
  },
  handleRemoveMember(){
    fetch(config.api.personnel.delete(this.props.affair.get('id'), this.props.affair.get('roleId'), this.props.member.id), {
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.props.fresh()
        message.success('移出成员成功!可在离盟成员中查看')
      }
      else {
        message.error('移出成员失败!该成员还有角色在本盟中')
      }

    })
  },
  handleChangeEmployment(value){
    if (value == 'hired'){
      fetch(config.api.personnel.employ_add(this.props.member.id), {
        method: 'POST',
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
      }).then((res) => res.json()).then((json) => {
        if (json.code == 0){
          this.props.freshEmployment()
          message.success('修改成功')
        }
        else {
          message.error('修改失败，网络错误')
        }
      })
    }
    else if (value == 'noHired'){
      fetch(config.api.personnel.employ_delete(this.props.member.id), {
        method: 'POST',
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
      }).then((res) => res.json()).then((json) => {
        if (json.code == 0){
          this.props.freshEmployment()
          message.success('修改成功')
        }
        else {
          message.error('修改失败，网络错误')
        }
      })
    }
  },
  render(){
    const infoline = (label, value) => {
      return (value != null && value != '') && (
      <div className={styles.infoline}>
        <span className={styles.attr}>{label}:</span>
        <span className={styles.content}>{value}</span>
      </div>
      )
    }
    return this.props.roleList && (
    <div className={styles.container}>
      {
        this.props.member.affairNames ? null
        :
        <div className={styles.memberCard}>
          <span className={styles.title}>成员名片:{this.props.member.ifHire ? '有人事关系' : '无人事关系'}</span>
          <SimpleMemberCard member={this.props.member} />
        </div>
      }
      <div className={styles.fuckAdd}>
        <span className={styles.text}>人事关系</span>
        <Select value={this.props.member.ifHire ? 'hired' : 'noHired'} onChange={this.handleChangeEmployment}>
          <Option value="hired">有人事关系</Option>
          <Option value="noHired">无人事关系</Option>
        </Select>
      </div>
      <div className={styles.roleCard}>
        {this.props.roleList.length != 0 &&
          <span className={styles.title}>本事务角色:</span>
        }
        {
          this.props.roleList.map((v, k) => {
            return (
              <div className={styles.cardContainer} key={k}>
                {v.nowRole ?
                  <AffairRoleCard
                    affair={this.props.affair}
                    fresh={this.props.fresh}
                    member={v.nowRole}
                    isPrimaryAffair
                    isHistory={false}
                    changeAuthority={this.changeAuthority.bind(null, v.nowRole)}
                    fromMemberCard
                    expatriateRoles={v.expatriateRoles}
                  />
                : (
                  <div className={styles.noRole}>
                    <span className={styles.text}>该成员在本事务中暂无角色</span>
                    <Button type="ghost" size="large" onClick={() => {
                      this.setState({ showRoleModal: true })
                    }}
                    >+&nbsp;赋予角色</Button>
                  </div>
                )}
              </div>
            )
          })
        }
        {(this.props.roleList.length != 0 && this.props.roleList[0].historyRoles.length != 0) &&
          <span className={styles.historyRole}>
            历史角色&nbsp;({this.props.roleList[0].historyRoles.length})
            <DropDownIcon
              fill="#cccccc"
              height="20"
              onClick={() => {
                this.setState({ showHistoryRoles: !this.state.showHistoryRoles })
              }}
              style={{ transform: this.state.showHistoryRoles ? 'rotate(180deg)' : null }}
            />
          </span>
        }
        {this.state.showHistoryRoles &&
          <div className={styles.historyRoleContainer}>
            {
              this.props.roleList[0].historyRoles.map((v, k) => {
                return (
                  <div key={k} className={styles.card}>
                    <AffairRoleCard
                      affair={this.props.affair}
                      fresh={this.props.fresh}
                      member={v}
                      isPrimaryAffair
                      isHistory
                      changeAuthority={this.changeAuthority.bind(null, v)}
                      fromMemberCard
                    />
                  </div>
                )
              })
            }
          </div>
        }
      </div>
      <div className={styles.msgPanel}>
        <span className={styles.title}>个人信息:</span>
        <div className={styles.info}>
          {infoline('SuperID', this.props.member.superid)}
          {infoline('性别', this.props.member.gender == 0 ? '保密' : this.props.member.gender == 1 ? '男' : '女')}
          {infoline('地区', this.props.member.address)}
          {infoline('是否认证', this.props.member.authenticated ? '是' : '否')}
          {this.props.member.tags != '' &&
            <div className={styles.infoline}>
              <span className={styles.attr}>个人标签:</span>
              <div className={styles.tagContainer}>
                {
                  JSON.parse(this.props.member.tags).map((v, k) => {
                    return <Tag key={k}>{v}</Tag>
                  })
                }
              </div>
            </div>
          }
          {infoline('真实姓名', this.props.member.realname)}
          {infoline('出生日期', this.props.member.birthday)}
          {infoline('身份证号', this.props.member.idCard)}
          {infoline('手机号码', this.props.member.mobile)}
          {infoline('邮箱地址', this.props.member.email)}
        </div>
        {this.props.member.id != this.props.user.get('id') && this.props.member.state != 1 && this.props.member.state != 2 && !this.props.member.affairNames &&
          this.props.affair.validatePermissions(PERMISSION.REMOVE_MEMBER) &&
          <div className={styles.footer}>
            <Button type="ghost" className={styles.button}>调动成员</Button>
            <Button type="ghost" className={styles.button} onClick={this.handleRemoveMember}>移出成员</Button>
          </div>
        }
      </div>
      {this.state.showAuthorityModal &&
        <AuthorityModal member={this.state.changeMember} affair={this.props.affair} callback={this.closeAuthorityModal} />
      }
      {this.state.showNewRoleModal &&
        <NewRoleModal member={this.props.member} affair={this.props.affair} callback={this.closeNewRoleModal} />
      }
      {this.state.showRoleModal &&
        <ChangeRoleModal
          callback={() => {
            this.setState({ showRoleModal: false, })
            this.props.fresh()
          }}
          affair={this.props.affair}
          modalType={3}
          member={this.props.member}
        />
      }
    </div>
    )
  }//end render
})

function mapStateToProps(state) {
  return {
    allianceList: state.getIn(['alliance', 'myAllianceList']),
    user: state.get('user')
  }
}
function mapDispatchToProps(dispatch) {
  return {
    getSingleTree: bindActionCreators(getSingleTree, dispatch),
  }
}


export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(MemberCard)
