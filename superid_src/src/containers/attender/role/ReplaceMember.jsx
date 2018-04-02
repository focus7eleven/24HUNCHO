import React from 'react'
import { Modal, Input, Select, Popover, notification } from 'antd'
import styles from './ModalCommon.scss'
import { LoadMoreIcon, SearchIcon, MemberCard } from 'svg'
import classNames from 'classnames'
import SimpleMemberCard from '../../../components/card/SimpleMemberCard'
import config from '../../../config'
import { bindActionCreators } from 'redux'
import { getAffairRoles } from '../../../actions/affair'
import { connect } from 'react-redux'

const Option = Select.Option

let ReplaceMember = React.createClass({
  getDefaultProps() {
    return {
      list: [],
      visible: true,
      onCloseModal: () => {
      }
    }
  },

  getInitialState() {
    return {
      chosenMember: {},
    }
  },
  handleChooseMember(member){
    this.setState({
      chosenMember: member,
    })
  },
  handleCloseModal(){
    this.props.onCloseModal()
    this.setState({
      chosenMember: {},
    })
  },
  handleOk(){
    let { affair, member } = this.props
    let { chosenMember } = this.state
    if (typeof(chosenMember.userId) != 'undefined'){
      fetch(config.api.affair.role.switch(member.roleId, chosenMember.roleId), {
        method: 'POST',
        credentials: 'include',
        roleId: affair.get('roleId'),
        resourceId: affair.get('roleId'),
        affairId: affair.get('id'),
      }).then((res) => res.json()).then((json) => {
        if (json.code == 0){
          this.setState({
            chosenMember: {},
          })
          this.props.onCloseModal()
          this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true).then(() => {
            notification.success({
              message: '角色已更换!',
              description: '更换成功,请在当前角色中查看该角色信息'
            })
          })
        }
        else {
          notification.error({
            message: '更改失败'
          })
          this.setState({
            chosenMember: {},
          })
          this.props.onCloseModal()
        }
      })
    }
    else {
      notification.error({
        message: '更改失败'
      })
    }
  },
  render() {
    let { visible } = this.props
    let { chosenMember } = this.state
    let { member } = this.props
    const selectBefore = (
      <Select defaultValue="in">
        <Option value="in">盟内成员</Option>
        <Option value="out">盟外成员</Option>
      </Select>
    )
    return (
      <Modal
        wrapClassName={styles.commonModal}
        title="更换成员"
        visible={visible}
        onCancel={this.handleCloseModal}
        onOk={this.handleOk}
        maskClosable={false}
      >
        <div className={styles.opt}>
          <div className={styles.role}>
            {
              member.avatar
                  ?
                    <img src={member.avatar}/>
                  :
                    <div className={styles.noavatar} />
            }
            <div>
              <div>{member.username}</div>
              <div>ID:{member.superid}</div>
            </div>
          </div>
          <div className={styles.transfer}>
            <div className="u-text-14">{member.roleTitle}</div>
            <div>
              <span>更换为</span>
              <span><LoadMoreIcon /></span>
            </div>
          </div>
          {typeof(chosenMember.username) == 'undefined' ?
            <div className={styles.role}>
              <div className={styles.circle}/>
            </div>
              :
            <div className={styles.role}>
              {chosenMember.avatar == '' ?
                <div className={styles.noavatar}/>
                    :
                <img src={chosenMember.avatar} alt="用户"/>
                }
              <div>
                <div>{chosenMember.username}</div>
                <div>ID:{chosenMember.superId}</div>
              </div>
            </div>


          }
        </div>

        <div className={styles.searchField}>
          <div className={styles.selectContainer}>
            {selectBefore}
          </div>
          <Input placeholder={'搜索用户名/SuperID'} style={{ paddingLeft: 88 }} />
          <span className={styles.searchIcon}><SearchIcon/></span>
        </div>

        <div className={styles.memberList}>
          {this.props.list.map((v, k) => {
            let checked = chosenMember.userId == v.userId
            if (v.userId == member.userId){
              return
            }
            else {
              return (<div className={classNames(styles.member, checked ? 'checked' : '')} key={`${v.userId}+${k}`} onClick={this.handleChooseMember.bind(null, v)}>
                {v.avatar == '' ?
                  <div className={styles.noavatar} />
                    :
                  <img src={v.avatar} alt="用户"/>
                }
                <div>
                  <div>
                    <span>{v.username}</span>
                    <Popover trigger="hover" content={<SimpleMemberCard member={v}/>} className={styles.popover} placement="top">
                      <span><MemberCard /></span>
                    </Popover>
                  </div>
                  <div>ID:{v.superId}</div>
                </div>
              </div>)
            }
          })}


        </div>
      </Modal>
    )
  }
})

function mapStateToProps() {
  return {
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getAffairRoles: bindActionCreators(getAffairRoles, dispatch),
  }


}

export default connect(mapStateToProps, mapDispatchToProps)(ReplaceMember)
