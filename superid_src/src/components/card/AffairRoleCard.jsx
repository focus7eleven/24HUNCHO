import React, { PropTypes } from 'react'
import styles from './AffairRoleCard.scss'
import { ChatIcon, DetailsFullIcon, PermissionIcon, MoreIcon } from 'svg'
import classNames from 'classnames'
import { Popconfirm, Popover, message, Modal, Input, Button, Icon } from 'antd'
import config from '../../config'
import { bindActionCreators } from 'redux'
import { getAffairRoles } from '../../actions/affair'
import { updateChatRole } from '../../actions/message'
import { pushURL } from 'actions/route'
import { fetchUserRoleList } from 'actions/user'
import { connect } from 'react-redux'
import PermissionModal from '../../containers/attender/role/PermissionModal'
import messageHandler from 'messageHandler'
import PERMISSION from 'utils/permission'

const AffairRoleCard = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired,
  },

  propTypes: {
    member: PropTypes.object,
    isHistory: PropTypes.bool.isRequired,
    isPrimaryAffair: PropTypes.bool.isRequired,
    hasLeftAffair: PropTypes.bool.isRequired,
    inviteRole: PropTypes.func,
    moveOut: PropTypes.func,
    replaceMember: PropTypes.func,
    stopUsing: PropTypes.func,
    fromMemberCard: PropTypes.bool,
    affair: PropTypes.object,
    fresh: PropTypes.func,
  },

  getDefaultProps(){
    return {
      isHistory: false,
      isPrimaryAffair: false,
      hasLeftAffair: true,
      expatriateRoles: [],
      fromAllianceRoleCard: false,
      noPermissionControl: false,
    }
  },

  getInitialState() {
    return {
      isMouseIn: -1,
      showStopPopover: false,
      showMovePopover: false,
      showPermissionModal: false,
      visible: false,
      showModifyRoleNameModal: false,
      newTitle: '',
    }
  },

  /* Handle */

  //isMouseIn为1则不允许改变,这时只有popover才能改变isMouseIn
  handleMouseEnter() {
    if (this.state.isMouseIn != 1) {
      this.setState({
        isMouseIn: 0
      })
    }
  },

  handleMouseLeave() {
    if (this.state.isMouseIn != 1) {
      this.setState({
        isMouseIn: -1
      })
    }
  },

  //点击卡片, 当popover消失时, isMouseIn从-1变为0
  handleClick() {
    if (this.state.isMouseIn < 0) {
      this.setState({
        isMouseIn: 0
      })
    }
  },

   //卡片显示隐藏回调
  handleStopVisibleChange(visible) {
    if (!visible) {
         //操作选项消失(移出,停用等)
      this.setState({
        isMouseIn: -1,
        showStopPopover: visible,
      })
    } else {
         //操作选项出现
      this.setState({
        isMouseIn: 1,
        showStopPopover: visible,
      })
    }
  },
  handleMoveVisibleChange(visible) {
    if (!visible) {
         //操作选项消失(移出,停用等)
      this.setState({
        isMouseIn: -1,
        showMovePopover: visible,
      })
    } else {
         //操作选项出现
      this.setState({
        isMouseIn: 1,
        showMovePopover: visible,
      })
    }
  },
  handleDisableRole(){
    const { affair, member } = this.props
    fetch(config.api.affair.role.disable(member.roleId), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      roleId: affair.get('roleId'),
      affairId: affair.get('id'),
      resourceId: member.roleId,
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        this.setState({
          visible: false,
        })
        this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true).then(() => {
          if (this.props.fresh){
            this.props.fresh()
          }
          message.success('停用成功')
        })
      }
    })
  },
  handleEnableRole(){
      // const { affair, member }=this.props
      // fetch(config.api.affair.role.enable(affair.get('roleId'), member.roleId), {
      //    method:'GET',
      //    credentials:'include',
      // }).then((res) => res.json()).then((json) => {
      //    if (json.code==0){
      //       this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), false).then(() => {
      //          notification.success({
      //             message:'角色已启用!',
      //             description:'启用成功,请在当前角色中查看该角色信息'
      //          })
      //       })
      //    }
      //    else if (json.code==2003){
      //       notification.error({
      //          message:'角色启用失败!',
      //          description:'原成员已离开盟'
      //       })
      //    }
      // })
    this.props.enableRole()
  },
  handleDeleteRole(){
    const { affair, member } = this.props
    fetch(config.api.affair.role.delete(member.roleId), {
      method: 'POST',
      credentials: 'include',
      roleId: affair.get('roleId'),
      affairId: affair.get('id'),
      resourceId: member.roleId,
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true).then(() => {
          message.success('删除成功')
        })
      }
    })
  },
  handleMoveOut(){
    const { affair, member } = this.props
    fetch(config.api.affair.role.remove(member.roleId), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        this.setState({
          visible: false,
        })
        this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true).then(() => {
          message.success('移出成功')
        })
      }
    })
  },
  handleVisibleChange(visible) {
    this.setState(
      { visible },
      () => visible == false && this.setState({
        showSecondaryPopover: false
      })
    )
  },
  onShowPermissionModal(){
    this.setState({ showPermissionModal: true })
  },
  onClosePermissionModal(){
    this.setState({ showPermissionModal: false })
  },
  showRoleDetails(){
    const roleId = this.props.member.roleId
    const optRoleId = this.props.affair.get('roleId')
    const affairId = this.props.affair.get('id')
    setTimeout(function(){
      window.open(`/roleDetail/${affairId}/${optRoleId}/${roleId}`)
    }, 1)
  },
  handleReplaceMember(){
    this.setState({
      visible: false,
    })
    this.props.replaceMember()
  },
  handleModifyRoleName(){
    this.setState({
      showModifyRoleNameModal: true,
      visible: false,
    })
  },
  handleModifyOnchange(e){
    this.setState({
      newTitle: e.target.value,
    })
  },
  handleModifyOnBlur(e){
    e.target.value = e.target.value.replace(/\s+/g, '')
    this.setState({
      newTitle: e.target.value,
    })
  },
  handleRouteToChat(member) {
    const { isPrimaryAffair, affair } = this.props
    let affairId
    if (isPrimaryAffair) {
      affairId = member.belongAffairId
      this.props.updateChatRole(member)
      this.props.pushURL(`/workspace/affair/${affairId}/chat?forceRoleId=${affair.get('roleId')}`)
    } else {
      affairId = affair.get('id')
      this.props.updateChatRole(member)
      this.props.pushURL(`/workspace/affair/${affairId}/chat`)
    }

  },
  onCloseModifyModal(){
    this.setState({
      showModifyRoleNameModal: false,
      newTitle: '',
    })
  },
  onModifyRoleNameSubmit(){
    if (this.state.newTitle.length < 2 || this.state.newTitle.length > 15) {
      message.error('角色名需2-15个字符')
      return
    }
    if (this.state.newTitle == this.props.member.roleTitle){
      message.error('新角色名不能与原角色名相同')
      return
    }
    fetch(config.api.affair.role.modify_name(this.props.member.roleId, this.state.newTitle), {
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      resourceId: this.props.member.roleId,
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        this.props.getAffairRoles(this.props.affair.get('roleId'), this.props.affair.get('id'), true).then(() => {
          message.success('修改角色名成功')
          this.setState({
            showModifyRoleNameModal: false,
          })
        })
        this.props.fetchUserRoleList()
      }
    })
  },
   /*
   * 事务角色卡片以及其中担任者称谓显示规则 更新时间：2017.11.08
   * 角色卡片内容：
   * 如果是根事务(isRootAffair == true)，只显示盟名称，否则显示盟-事务
   * 担任者：
   * 1、如果是成员担任(ownerRole.type == 0)，则显示 用户名(superid)
   * 2、如果是角色担任(ownerRole.type == 2)，分如下情况
   * - 2.1 担任角色是该事务的角色(ownerRole.affairId == affair.id)，显示 角色名-用户名
   * - 2.2 担任角色不是该事务的角色，但是与该事务同盟(ownerRole.allianceId == affair.allianceId)，显示 角色名 事务名-用户名
   * - 2.3 担任角色与该事务不同盟，显示 角色名 盟名-用户名
   */
  render(){
    const {
      className,
      isHistory,   //是否是历史卡片
      fromAllianceRoleCard,
    } = this.props

    const expatriateContent = (
      <div className={styles.expatriateContent}>
        <span className={styles.title}>外派角色({this.props.expatriateRoles.length})</span>
        <div className={styles.content}>
          {this.props.expatriateRoles.map((v, k) => {
            return (
              <div className={styles.roleCard} key={k}>
                <div className={styles.info}>
                  <span className={styles.roleName}>{v.roleTitle}</span>
                  <span className={styles.affairName}>{v.allianceName}-{v.belongAffairName}</span>
                </div>
                <div className={styles.operate}>
                  <div onClick={this.showRoleDetails}>
                    <DetailsFullIcon fill="#7cb863"/>
                    <span>详情</span>
                  </div>
                </div>
              </div>
            )
          })
          }
        </div>
      </div>
      )

    return this.props.member && (
    <div
      className={classNames(styles.wrap, className, isHistory ? styles.history : '')}
      onClick={this.handleClick}
      onMouseEnter={this.handleMouseEnter}
      onMouseLeave={this.handleMouseLeave}
    >
      <div className={styles.card} style={{ height: !fromAllianceRoleCard ? 130 : 110 }}>
        {this.renderContent()}
        {!fromAllianceRoleCard ? this.renderFooter() : null}
      </div>
      {this.props.expatriateRoles.length != 0 &&
        <div className={styles.flag}>
          <Popover getPopupContainer={() => {return this.props.overflowRef ? this.props.overflowRef : document.body}} trigger="click" content={expatriateContent} placement="bottomRight" >
            <span className={styles.leftNumber}>{this.props.expatriateRoles.length}</span>
          </Popover>
        </div>
        }
    </div>
    )
  },
  renderContent(){
    const {
      isHistory,  //是否是历史卡片
      isPrimaryAffair,  //是否是主事务
      hasLeftAffair,  //是否已离开事务
      // inviteRole,    //邀请角色
      fromMemberCard, //是否从成员卡片点入
      fromAllianceRoleCard, //是否是盟及角色的卡片
      affair,
      member,
    } = this.props
    const { isMouseIn } = this.state
    return (
      <div className={styles.content}>
        <div className={styles.left}>
          <div className={styles.top}>
            <span className={styles.roleTitle} title={member.roleTitle}>{member.roleTitle}</span>
            {
              isPrimaryAffair && member.state == 2 ?
                <Popconfirm placement="bottomLeft"
                  title={<span>确认删除该角色?</span>}
                  cancelText="否"
                  overlayClassName={styles.popover}
                  onConfirm={this.handleDeleteRole}
                  visible={this.state.showStopPopover}
                  onVisibleChange={this.handleStopVisibleChange}
                >
                  <span className={styles.click}>删除</span>
                </Popconfirm>
              : null
            }
          </div>
          {/* 参见角色卡片内容显示规则 */}
          <span className={styles.affairName}>
            {member.ifRootAffair ?
              member.allianceName
            :
              `${member.allianceName}-${member.belongAffairName}`
            }
          </span>
        </div>
        {isHistory ?
          <div className={styles.right}>
            <div onClick={this.showRoleDetails}>
              <DetailsFullIcon fill="#7cb863"/>
              <span>详情</span>
            </div>
            {fromMemberCard ? (
              null
            ) :
              hasLeftAffair ?
                // <span onClick={inviteRole} className={classNames(isMouseIn == -1 ? styles.none : '', styles.click)}>邀请角色</span>
                null
              : affair.validatePermissions(PERMISSION.RECOVER_ROLE) && (
                <span onClick={this.handleEnableRole} className={classNames(isMouseIn == -1 ? styles.none : '', styles.click)}>恢复角色</span>
              )}
          </div>
        : (
          <div className={styles.right}>
            <div onClick={this.showRoleDetails}>
              <DetailsFullIcon fill="#7cb863"/>
              <span>详情</span>
            </div>
            {this.props.affair.get('roleId') != member.roleId
              && !this.props.noPermissionControl &&
              <div onClick={this.onShowPermissionModal}>
                <PermissionIcon fill="#f29333"/>
                <span>权限</span>
              </div>
            }
            {(this.props.affair.get('roleId') != member.roleId && (!fromAllianceRoleCard)) &&
              <div onClick={() => this.handleRouteToChat(member)}>
                <ChatIcon fill="#7477f9"/>
                <span>会话</span>
              </div>
            }

          </div>
        )}
        {this.state.showPermissionModal &&
          <PermissionModal affair={affair} member={member} onCancel={this.onClosePermissionModal}/>
        }
        {
          this.state.showModifyRoleNameModal &&
          <Modal
            maskClosable={false}
            visible
            title="变更角色名称"
            wrapClassName={styles.modifyRoleNameModal}
            footer={[
              <Button key="cancel" type="ghost" onClick={this.onCloseModifyModal}>取消</Button>,
              <Button key="submit" type="primary" onClick={this.onModifyRoleNameSubmit} loading={this.state.isLoading}>修改</Button>
            ]}
            width={500}
            onCancel={() => {this.setState({ showModifyRoleNameModal: false })}}
          >
            <div className={styles.modifyRoleNameContainer}>
              <div className={styles.old}>
                <span className={styles.title}>原角色名:</span>
                <span className={styles.value}>{this.props.member.roleTitle}</span>
              </div>
              <div className={styles.new}>
                <span className={styles.title}>新角色名:</span>
                <Input onChange={this.handleModifyOnchange} onBlur={this.handleModifyOnBlur}/>
              </div>
            </div>
          </Modal>
        }
      </div>
    )
  },
  renderFooter(){
    const {
      isHistory,   //是否是历史卡片
      replaceMember,  //更换成员callback
      fromMemberCard, //是否从成员卡片点入
      affair,
      member,
      isPrimaryAffair,
    } = this.props
    const ownerRole = member.ownerRole
    const isSelf = member.roleId == affair.get('roleId')
    const createPopover = () => {
      return (this.state.showSecondaryPopover) ? (
        <div className={styles.confirmPopover}>
          <div className={styles.content}><Icon type="exclamation-circle" />{isPrimaryAffair ? '角色停用后将无法继续活动,您可以在历史角色中找到它。是否继续?' : '确认将角色移出事务？'}</div>
          <div className={styles.footer}>
            <Button size="small" onClick={() => this.handleVisibleChange(false)}>否</Button>
            <Button size="small" type="primary" onClick={() => isPrimaryAffair ? this.handleDisableRole() : this.handleMoveOut()}>是</Button>
          </div>
        </div>
      ) : (
        <div className={styles.repoOperation}>
          <div className={styles.repoOperationItem} onClick={this.handleModifyRoleName}>变更角色名称</div>
          { !isSelf && <div className={styles.repoOperationItem} onClick={this.handleReplaceMember}>更换担任者</div>}
          { !isSelf && <div className={styles.repoOperationItem} onClick={() => this.setState({ showSecondaryPopover: true })}>
            {
              isPrimaryAffair ? (
                <span className={styles.click}>停用</span>
              ) : (
                <span className={styles.click}>移出</span>
              )
            }
          </div>}
        </div>
      )
    }
    /* 参见角色卡片担任者显示规则 */
    return (
      ownerRole ?
        ownerRole.type == 0 ? (
            //成员担任
          <div className={styles.footer}>
            <div
              className={styles.left}
              style={{
                opacity: member.state == 4 ? 0.5 : 1,
                maxWidth: ((!fromMemberCard) && (!isHistory)) ? '90%' : '100%'
              }}
            >
              {member.avatar ?
                <img src={member.avatar} className={styles.avatar}/>
              : (
                <div className={styles.avatar} style={{ backgroundColor: '#ebebeb' }} />
              )}
              <div className={styles.userInfo}>
                <span className={styles.username} title={`${member.username}(${member.superid})`}>
                  {member.username}
                  <span className={styles.superid}>({member.superid})</span>
                </span>
              </div>
              {
                member.state == 4 ?
                  <Popover getPopupContainer={() => {return this.props.overflowRef ? this.props.overflowRef : document.body}} placement="bottom" content={<div><Icon type="exclamation-circle" style={{ color: '#ffa770', marginRight: '8px' }}/>该担任者不可用，请联系对方管理员或做其他处理</div>}>
                    <Icon type="exclamation-circle" style={{ marginLeft: '8px' }} />
                  </Popover>
                : null
              }
            </div>

            {((!fromMemberCard) && (!isHistory)) &&
              <Popover
                content={createPopover()}
                trigger="click"
                overlayClassName={styles.iconPopover}
                placement="topRight"
                visible={this.state.visible}
                onVisibleChange={this.handleVisibleChange}
                getPopupContainer={() => {return this.props.overflowRef ? this.props.overflowRef : document.body}}
              >
                <span className={styles.moreIcon + ' more-icon'}><MoreIcon className="more-icon"/></span>
              </Popover>
            }
          </div>
        ) : ownerRole.type == 2 ? (
            //角色担任
          <div className={styles.footer}>
            <div
              className={styles.left}
              style={{
                opacity: member.state == 4 ? 0.5 : 1,
                maxWidth: ((!fromMemberCard) && (!isHistory)) ? '90%' : '100%'
              }}
            >
              {member.avatar ?
                <img src={member.avatar} className={styles.avatar}/>
              : (
                <div className={styles.avatar} style={{ backgroundColor: '#ebebeb' }} />
              )}
              {member.belongAffairId == affair.get('id') ? //是否事务内
                <div className={styles.userInfo}>
                  <span className={styles.username} title={`${ownerRole.title} ${member.username}`}>
                    {`${ownerRole.title} ${member.username}`}
                  </span>
                </div>
              : member.allianceId == affair.get('allianceId') ? //是否盟内
                <div className={styles.userInfo}>
                  <span className={styles.username} title={`${ownerRole.title} ${ownerRole.affairName}-${member.username}`}>
                    {`${ownerRole.title} ${ownerRole.affairName}-${member.username}`}
                  </span>
                </div>
              : (
                <div className={styles.userInfo}>
                  <span className={styles.username} title={`${ownerRole.title} ${ownerRole.allianceName}-${member.username}`}>
                    {`${ownerRole.title} ${ownerRole.allianceName}-${member.username}`}
                  </span>
                </div>
              )}
              {
                member.state == 4 ?
                  <Popover getPopupContainer={() => {return this.props.overflowRef ? this.props.overflowRef : document.body}} placement="bottom" content={<div><Icon type="exclamation-circle" style={{ color: '#ffa770', marginRight: '8px' }}/>该担任者不可用，请联系对方管理员或做其他处理</div>}>
                    <Icon type="exclamation-circle" style={{ marginLeft: '8px' }}/>
                  </Popover>
                : null
              }
            </div>
            {
              // member.state == 4 ? null
              // :
              //  && ((member.roleId) != affair.get('roleId'))
              (((!fromMemberCard) && (!isHistory)) &&
              <Popover
                content={createPopover()}
                trigger="click"
                overlayClassName={styles.iconPopover}
                placement="topRight"
                visible={this.state.visible}
                onVisibleChange={this.handleVisibleChange}
                getPupopContainer={() => {return this.props.overflowRef ? this.props.overflowRef : document.body}}
              >
                <span className={styles.moreIcon + ' more-icon'}><MoreIcon className="more-icon"/></span>
              </Popover>)
            }
          </div>
        ) : (
         null
        ) : (
          <div className={styles.footer} style={{ justifyContent: 'center' }}>
            <span onClick={replaceMember} style={{ cursor: 'pointer' }}>+添加担任者</span>
          </div>
       )
    )
  },
})

function mapStateToProps(state) {
  return {
    affairList: state.getIn(['affair', 'affairList']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getAffairRoles: bindActionCreators(getAffairRoles, dispatch),
    updateChatRole: bindActionCreators(updateChatRole, dispatch),
    fetchUserRoleList: bindActionCreators(fetchUserRoleList, dispatch),
    pushURL: bindActionCreators(pushURL, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AffairRoleCard)
