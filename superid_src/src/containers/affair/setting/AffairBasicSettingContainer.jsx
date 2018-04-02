import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom'
import styles from './AffairBasicSettingContainer.scss'
import _ from 'underscore'
import { Button, Switch, Rate, Radio, Icon, Input, Popconfirm, InputNumber, Checkbox, message } from 'antd'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { modifyAffairInfo, terminateAffair } from '../../../actions/affair'
import { pushPermittedURL } from 'actions/route'
import { fetchUserRoleList } from 'actions/user'
import { AuthenticatedIcon } from 'svg'
import AffairAvatar from '../../../components/avatar/AffairAvatar'
import EditLogoModal from '../../../components/modal/EditLogoModal'
import AffairChangeNameModal from './AffairChangeNameModal'
import AffairChangeCodeModal from './AffairChangeCodeModal'
import classNames from 'classnames'
import config from '../../../config'
import messageHandler from 'messageHandler'
import PERMISSION from 'utils/permission'

const RadioGroup = Radio.Group
const RELEASE_INFO_OPTIONS = [
  { label: '真实姓名', value: 'realname' },
  { label: '生日', value: 'birthday' },
  { label: '手机号码', value: 'mobile' },
  { label: '邮箱账号', value: 'email' },
  { label: '身份证号', value: 'idCard' },
]
const TERMINATE_STEP = {
  NONE: -1,
  SUB_AFFAIR: 0,
  TRANSACTION: 1,
  CONFIRM: 2,
}

const AffairBasicSettingContainer = React.createClass({
  propTypes: {
    affair: PropTypes.object.isRequired,
  },

  getInitialState(){
    return {
      shortName: this.props.affair.get('shortName'),
      isShortNameLegal: true,
      guestLimit: this.props.affair.get('guestLimit'),
      affairName: this.props.affair.get('name'),
      usernameShowType: 0,
      isMemberPublicOn: false,
      isRolePublicOn: false,
      terminateStep: TERMINATE_STEP.NONE,
      terminateInfo: {
        hasChildren: false,
        hasTrade: false,
      }
    }
  },
  componentWillMount(){
    this._modifyAffairInfo = _.debounce(this.props.modifyAffairInfo, 500)
    /* 根事务需要获取盟信息 */
    if (this.props.affair.get('level') == 1) {
      this.fetchAllianceInfo()
    }
    this.fetchTerminateInfo()
    this.setState({
      isRolePublicOn: this.props.affair.get('rolePublic').includes(true)
    })
    document.addEventListener('click', this.handleClick, false)
  },
  componentWillUnmount(){
    document.removeEventListener('click', this.handleClick, false)
  },
  handleClick(e){
    if (this.state.terminateStep == TERMINATE_STEP.NONE){
      return
    }
    if (!(document.getElementsByClassName('terminatePopupTarget')[0].contains(e.target)) && !(ReactDOM.findDOMNode(this.terminateButton).contains(e.target))) {
      this.setState({
        terminateStep: TERMINATE_STEP.NONE
      })
    }
  },
  componentWillReceiveProps(nextProps){
    if (nextProps.affair.get('id') != this.props.affair.get('id')) {
      this.fetchTerminateInfo()
      this.setState({
        isRolePublicOn: nextProps.affair.get('rolePublic').includes(true)
      })
    }
    this._modifyAffairInfo = _.debounce(nextProps.modifyAffairInfo, 500)

    this.setState({
      shortName: nextProps.affair.get('shortName'),
      guestLimit: nextProps.affair.get('guestLimit'),
      affairName: nextProps.affair.get('name'),
    })
  },
  fetchTerminateInfo(){
    const { affair } = this.props
    const roleId = affair.get('roleId')
    fetch(config.api.affair.terminateInfo(), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId,
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.setState({
          terminateInfo: json.data
        })
      }
    })
  },
  fetchAllianceInfo(){
    let affair = this.props.affair
    const allianceId = affair.get('allianceId')
    const roleId = affair.get('roleId')
    const affairMemberId = affair.get('affairMemberId')
    return fetch(config.api.alliance.info(allianceId, affair.get('id'), roleId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId,
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        /* 屏蔽来自allianceInfo的superid */
        const { superid, ...others } = json.data
        this.props.modifyAffairInfo(affair, affairMemberId, others, true)
        const memberPublic = json.data.memberPublic
        const isMemberPublicOn = Object.values(memberPublic).includes(true)
        this.setState({
          usernameShowType: this.props.affair.get('username'),
          isMemberPublicOn,
        })
      }
    })
  },
  handlePublicTypeChange(e){
    let { affair, modifyAffairInfo } = this.props
    modifyAffairInfo(affair, affair.get('affairMemberId'), { publicType: e.target.value })
  },
  // 修改用户名显示方式
  handleNameDisplayChange(e){
    const { affair } = this.props
    this.setState({ usernameShowType: e.target.value })
    this.props.modifyAffairInfo(affair, affair.get('affairMemberId'), { username: e.target.value })
  },
  // 修改评分
  handleRateChange(val) {
    const { affair } = this.props
    this.setState({ rate: val })
    this.props.modifyAffairInfo(affair, affair.get('affairMemberId'), { faith: val })
  },
  handleChangeAffairName() {
    let { affair, modifyAffairInfo } = this.props
    modifyAffairInfo(affair, affair.get('affairMemberId'), { name: this.state.affairName })
  },

  handleShortNameInputChange(e){
    let value = e.target.value
    if (value.trim() == 0 || value.length < 2 || value.length > 5) {
      this.setState({
        isShortNameLegal: false
      })
    } else {
      this.setState({
        isShortNameLegal: true
      })
    }
    this.setState({
      shortName: value.length > 5 ? value.trim() : value
    })
  },

  handleChangeGuestLimit(val) {
    const prevGuestLimit = this.state.guestLimit
    if (0 <= val && val <= 50) {
      this.setState({ guestLimit: val })
    } else {
      message.error('客方盟数限制必须为0-50之间的数')
      this.setState({ guestLimit: prevGuestLimit })
    }
  },

  handleChangeGuestLimitSubmit() {
    const { affair } = this.props
    const nextGuestLimit = this.state.guestLimit
    if (0 <= nextGuestLimit && nextGuestLimit <= 50) {
      this._modifyAffairInfo(affair, affair.get('affairMemberId'), { guestLimit: nextGuestLimit })
    } else {
      this.setState({ guestLimit: affair.get('guestLimit') })
    }
  },

  handleSaveShortName() {
    const { shortName } = this.state
    let { affair, modifyAffairInfo } = this.props
    if (shortName.length >= 2 && shortName.length <= 5) {
      modifyAffairInfo(affair, affair.get('affairMemberId'), { shortName: shortName })
      this.setState({
        isShortNameLegal: true,
      })
    } else {
      this.setState({
        isShortNameLegal: false
      })
    }
  },
  /* 终止事务的有关方法 */
  handleTerminateAffair(e) {
    const terminateStep = this.getTerminateStep()
    if (terminateStep == TERMINATE_STEP.CONFIRM) {
      this.props.terminateAffair(this.props.affair, this.props.affair.get('roleId')).then((json) => {
        if (json.code == 0) {
          message.success('终止事务成功')
          const nextAffair = this.props.affairList.get(0)
          this.props.pushPermittedURL(nextAffair.get('affairId'), nextAffair.get('roleId'), `/workspace/affair/${nextAffair.get('affairId')}`)
          // this.props.fetchUserRoleList().then((json) => {
          //   if (json.code == 0) {
          //
          //   }
          // })
        }
      })
    } else {
      e.preventDefault()
      e.stopPropagation()
      this.setState({
        terminateStep: terminateStep + 1
      })
    }
  },
  getTerminateStep(){
    const { terminateStep } = this.state
    const { hasChildren, hasTrade } = this.state.terminateInfo
    if (!hasChildren && !hasTrade && terminateStep != TERMINATE_STEP.NONE) {
      return TERMINATE_STEP.CONFIRM
    }
    if (hasChildren && !hasTrade && terminateStep == TERMINATE_STEP.TRANSACTION) {
      return TERMINATE_STEP.CONFIRM
    }
    if (!hasChildren && hasTrade && terminateStep == TERMINATE_STEP.SUB_AFFAIR) {
      return TERMINATE_STEP.TRANSACTION
    }
    return this.state.terminateStep
  },
  getTerminateConfirmText(){
    const terminateStep = this.getTerminateStep()
    if (terminateStep == TERMINATE_STEP.SUB_AFFAIR) {
      return '检测到本事务有子事务，终止后子事务也会一起终止，是否继续？'
    }
    if (terminateStep == TERMINATE_STEP.TRANSACTION) {
      return '检测到本事务有尚未关闭的交易，终止会强制关闭交易，是否继续？'
    }
    return '终止事务将不能继续操作本事务，是否继续？'
  },
  // 修改成员公开性
  handleEditMemberPublic(memberPublic) {
    const affair = this.props.affair
    let body = {
      'birthday': false,
      'email': false,
      'idCard': false,
      'mobile': false,
      'realname': false,
    }
    memberPublic.forEach((val) => {
      body[val] = true
    })
    fetch(config.api.affair.memberPublic(affair.get('id'), affair.get('roleId')), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify(body),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.props.modifyAffairInfo(affair, affair.get('affairMemberId'), { 'memberPublic': body }, true)
        message.success('修改已保存', 0.5)
      }
    })
  },
  // 按下成员公开性switch
  handleCheckMemberPublic(checked) {
    const { affair } = this.props
    const memberPublic = affair.get('memberPublic')
    const hasPublic = memberPublic.includes(true)
    // console.log(hasPublic)
    // var hasPublic = false
    // // const hasPublic = Object.values(memberPublic).includes(true)
    // if (memberPublic != null) {
    //   memberPublic.forEach((val) => {
    //     if (val == true) {
    //       hasPublic = true
    //     }
    //   })
    // }
    //
    // 关闭且存在公开性则清空公开性，否则不需要调用后台
    if (checked == false && hasPublic) {
      const body = memberPublic.map(() => (false)).toJS()
      fetch(config.api.affair.memberPublic(affair.get('allianceId')), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        body: JSON.stringify(body),
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code == 0) {
          this.props.modifyAffairInfo(affair, affair.get('affairMemberId'), { 'memberPublic': body }, true)
          this.setState({ isMemberPublicOn: false })
          message.success('修改已保存', 0.5)
        }
      })
    } else {
      this.setState({ isMemberPublicOn: checked })
    }
  },
  // 修改角色公开性
  handleEditRolePublic(rolePublic) {
    const affair = this.props.affair
    let body = {
      'birthday': false,
      'email': false,
      'idCard': false,
      'mobile': false,
      'realname': false,
    }
    rolePublic.forEach((val) => {
      body[val] = true
    })
    fetch(config.api.affair.rolePublic(affair.get('id'), affair.get('roleId')), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify(body),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.props.modifyAffairInfo(affair, affair.get('affairMemberId'), { 'rolePublic': body }, true)
        message.success('修改已保存', 0.5)
      }
    })
  },
  // 按下角色公开性switch
  handleCheckRolePublic(checked) {
    const { affair } = this.props

    const rolePublic = affair.get('rolePublic')
    const hasPublic = rolePublic.includes(true)
    // 关闭且存在公开性则清空公开性，否则不需要调用后台
    if (checked == false && hasPublic) {
      const body = rolePublic.map(() => (false)).toJS()
      fetch(config.api.affair.rolePublic(affair.get('id'), affair.get('roleId')), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        body: JSON.stringify(body),
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code == 0) {
          this.props.modifyAffairInfo(affair, affair.get('affairMemberId'), { 'rolePublic': body }, true)
          this.setState({ isRolePublicOn: false })
          message.success('修改已保存', 0.5)
        }
      })
    } else {
      this.setState({ isRolePublicOn: checked })
    }
  },

  onReuseAffair() {
    const { affair } = this.props
    fetch(config.api.affair.recover(), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.props.modifyAffairInfo(affair, affair.get('affairMemberId'), { 'disabled': false }, true)
        message.success('恢复成功')
      }
    })
  },

  render(){
    const {
      isShortNameLegal,
      shortName,
      guestLimit
    } = this.state
    const { affair, affairList } = this.props
    const isPersonal = function () {
      const found = affairList.find((item) => item.get('affairId') == affair.get('id'))
      if (found && found.get('isPersonal')) {
        return true
      }
      return false
    }()
    const isRootAffair = affair.get('level') === 1
    const isVerified = true // 当前无认证系统，默认盟已被认证 date:2017-09-13
    const saveLogo = (
      <span onClick={this.handleSaveShortName}>保存</span>
    )
    const memberPublic = affair.get('memberPublic')
    let memberPublicValues = []
    if (memberPublic != null) {
      memberPublic.forEach((val, key) => {
        if (val == true) {
          memberPublicValues.push(key)
        }
      })
    }
    const rolePublic = affair.get('rolePublic')
    let rolePublicValues = []
    if (rolePublic != null) {
      rolePublic.forEach((val, key) => {
        if (val == true) {
          rolePublicValues.push(key)
        }
      })
    }

    const editAlliancePermission = affair.validatePermissions(PERMISSION.SET_ALLIANCE_INFO)
    const editAffairPermission = isRootAffair ? editAlliancePermission : affair.validatePermissions(PERMISSION.SET_AFFAIR_INFO)
    const terminateAffairPermission = isRootAffair ? (
      isPersonal ? false : affair.validatePermissions(PERMISSION.ABANDON_ALLIANCE)
    ) : (
      affair.validatePermissions(PERMISSION.ABANDON_AFFAIR)
    )
    return (
      <div className={styles.container} ref={(el) => {this.container = el}}>
        {/* 组织名称 */}
        <div className={styles.row}>
          <div className={styles.title}>{isRootAffair ? '组织' : '事务'}名称：</div>
          <div className={`${styles.content}`}>
            <div className={styles.affairName}>
              {isRootAffair ?
                <div className={styles.dataSink}>
                  <span>{affair.get('name')}</span>
                </div>
              : (
                <Input
                  value={this.state.affairName}
                  onChange={(e) => this.setState({ affairName: e.target.value })}
                  style={{ width: 250, borderRadius: 4 }}
                  size="large"
                  onBlur={this.handleChangeAffairName}
                  onPressEnter={this.handleChangeAffairName}
                />
              )}
              {(isRootAffair && isVerified) &&
                <span className={styles.verified}><AuthenticatedIcon width="15px" height="12px" />已认证</span>
              }
            </div>
            {(isRootAffair && editAlliancePermission) &&
              <AffairChangeNameModal
                affair={affair}
                modifyAffairInfo={this.props.modifyAffairInfo}
              >
                <span className={styles.link}>申请变更</span>
              </AffairChangeNameModal>
            }
          </div>
        </div>
        {/* 盟代码 */}
        {
          isRootAffair &&
          <div className={styles.row}>
            <div className={styles.title}>{affair.name}代码：</div>
            <div className={styles.description}>
              所有{affair.name}子事务的SuperID以此代码为前缀。
            </div>
            <div className={styles.content}>
              <div className={styles.dataSink}>
                <span>{affair.get('allianceCode')}</span>
              </div>
              {editAlliancePermission &&
                <AffairChangeCodeModal
                  affair={affair}
                  modifyAffairInfo={this.props.modifyAffairInfo}
                >
                  <span className={styles.link}>申请变更</span>
                </AffairChangeCodeModal>
              }
            </div>
          </div>
        }

        {/* LOGO */}
        <div className={styles.row}>
          <div className={styles.title}>LOGO：</div>
          <div className={styles.content}>
            <AffairAvatar affair={affair} sideLength={56} />
            {editAffairPermission && (
              isRootAffair ? (
                <div className={styles.changeLogoPic}>
                  <EditLogoModal affair={affair}>
                    <Button type="ghost" size="small"><Icon type="upload" />{affair.get('avatar') ? '重新上传' : '上传'}</Button>
                  </EditLogoModal>
                  <div className={styles.intro}>支持扩展名：.jpeg .jpg .png .gif 支持最大图片大小：2M</div>
                </div>
              ) : (
                <div className={styles.changeLogo}>
                  <span>自定义事务简称，2-5个字符</span>
                  <Input onChange={this.handleShortNameInputChange} value={shortName} addonAfter={saveLogo} />
                  <div className={classNames('u-text-l-12', styles.shortNameError)} style={isShortNameLegal ? { opacity: 0 } : { opacity: 1 }}>请输入2-5个字符</div>
                </div>
              )
            )}
          </div>
        </div>

        {/* SuperID */}
        <div className={styles.row}>
          <div className={styles.title}>SuperID：</div>
          <div className={styles.description}>
            {isRootAffair ?
              <span>前缀为{affair.get('affairName')}代码，由字母数字组成，是事务在系统中的识别，每个事务SuperID在系统中唯一。</span>
            : (
              <span>事务的SuperID以盟代码为前缀，由字母数字组成，是事务在系统中的识别，每个事务SuperID在系统中唯一。</span>
            )}
          </div>
          <div className={styles.content}>
            <div className={styles.dataSink}>
              <span>{affair.superid}</span>
            </div>
          </div>
        </div>

        {/* 主页公开性 */}
        {isRootAffair ?
          <div className={styles.row}>
            <div className={styles.title}>盟可见性：</div>
            <div className={styles.description}>
              盟可见性是指盟主页对角色的可见范围。
            </div>
            <div className={styles.content}>
              <RadioGroup onChange={this.handlePublicTypeChange} value={this.props.affair.publicType} disabled={!editAffairPermission}>
                <Radio className={styles.radioGroup} key="d" value={1}>私密<span className={styles.radioInfo}>（本盟中的角色可以访问盟主页）</span></Radio>
                <Radio className={styles.radioGroup} key="a" value={0}>全网公开<span className={styles.radioInfo}>（所有角色都可以访问盟主页）</span></Radio>
              </RadioGroup>
            </div>
          </div>
        : (
          <div className={styles.row}>
            <div className={styles.title}>事务可见性：</div>
            <div className={styles.description}>
              事务可见性是指事务主页对角色的可见范围。
            </div>
            <div className={styles.content}>
              <RadioGroup onChange={this.handlePublicTypeChange} value={this.props.affair.publicType} disabled={!editAffairPermission}>
                <Radio className={styles.radioGroup} key="d" value={3}>私密<span className={styles.radioInfo}>（只有加入事务的角色可以访问事务主页）</span></Radio>
                <Radio className={styles.radioGroup} key="c" value={2}>事务内公开<span className={styles.radioInfo}>（本事务及其子事务中的角色可以访问事务主页）</span></Radio>
                <Radio className={styles.radioGroup} key="b" value={1}>盟内公开<span className={styles.radioInfo}>（本盟中的角色可以访问事务主页）</span></Radio>
                <Radio className={styles.radioGroup} key="a" value={0}>全网公开<span className={styles.radioInfo}>（所有角色都可以访问事务主页）</span></Radio>
              </RadioGroup>
            </div>
          </div>
        )}


        {/* 诚信值 */}
        {
          isRootAffair &&
          <div className={styles.row}>
            <div className={styles.title}>诚信值：</div>
            <div className={styles.description}>
              诚信值是盟客网根据盟的实力评估出的信誉等级。
            </div>
            <div className={styles.content}>
              <Rate value={this.state.rate} onChange={this.handleRateChange} disabled />
            </div>
          </div>
        }

        {/* 加入本事务的方式 */}
        <div className={styles.row}>
          <div className={styles.title}>加入本事务的方式：</div>
          <div className={styles.description}>
            其他角色申请加入当前事务时的审批策略，按钮打开时加入事务需要事务审批，按钮关闭时可直接加入。
          </div>
          <div className={styles.content}>
            <div className={styles.switchGroup}>
              <span className={styles.label}>父事务</span>
              <Switch checkedChildren="开" unCheckedChildren="关" disabled={!editAffairPermission}/>
            </div>
            <div className={styles.switchGroup}>
              <span className={styles.label}>本盟</span>
              <Switch checkedChildren="开" unCheckedChildren="关" disabled={!editAffairPermission}/>
            </div>
            <div className={styles.switchGroup}>
              <span className={styles.label}>盟客网</span>
              <Switch checkedChildren="开" unCheckedChildren="关" disabled={!editAffairPermission}/>
            </div>
          </div>
        </div>

        {/* 需要公开信息 */}
        {
          isRootAffair &&
          <div className={`${styles.row} ${styles.openInfo}`}>
            <div className={styles.title}>需要公开信息：</div>
            <div className={styles.description}>
              设置加入{affair.get('name')}的成员必须公开的信息
            </div>
            <div className={styles.content}>
              <div className={styles.wrapper}>
                {isRootAffair &&
                  <div className={styles.row}>
                    <div className={styles.member}>
                      作为成员加入{affair.get('name')}须公开的信息：
                      <Switch
                        checkedChildren="开"
                        unCheckedChildren="关"
                        checked={this.state.isMemberPublicOn}
                        onChange={this.handleCheckMemberPublic}
                        disabled={!editAffairPermission}
                      />
                    </div>
                    <div>
                      {this.state.isMemberPublicOn &&
                        <Checkbox.Group
                          options={RELEASE_INFO_OPTIONS}
                          value={memberPublicValues}
                          onChange={this.handleEditMemberPublic}
                          disabled={!editAffairPermission}
                        />
                      }
                    </div>
                  </div>
                }
                <div className={styles.row}>
                  <div className={styles.member}>
                    作为角色加入{affair.get('name')}须公开的信息：
                    <Switch
                      checkedChildren="开"
                      unCheckedChildren="关"
                      checked={this.state.isRolePublicOn}
                      onChange={this.handleCheckRolePublic}
                      disabled={!editAffairPermission}
                    />
                  </div>
                  <div>
                    {this.state.isRolePublicOn &&
                      <Checkbox.Group
                        options={RELEASE_INFO_OPTIONS}
                        value={rolePublicValues}
                        onChange={this.handleEditRolePublic}
                        disabled={!editAffairPermission}
                      />
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        {/* 角色数量限制 */}
        <div className={styles.row}>
          <div className={styles.title}>客方盟数限制：</div>
          <div className={styles.description}>
            角色是成员在事务中活动的主体，由盟内的角色和盟外的角色组成。盟外角色所在盟称为客方盟。
          </div>
          <div className={styles.content}>
            <span className={styles.label}>客方盟数量不超过：</span>
            {editAffairPermission ?
              <InputNumber
                min={0}
                max={50}
                value={Math.max(0, Math.min(50, guestLimit))}
                style={{ width: '60px' }}
                onChange={this.handleChangeGuestLimit}
                onBlur={this.handleChangeGuestLimitSubmit}
              />
            : <span className={styles.contentText}>{Math.max(0, Math.min(50, guestLimit))}</span>
            }
          </div>
        </div>


        {/* 邀请本事务角色的方式 */}
        <div className={styles.row}>
          <div className={styles.title}>邀请本事务角色的方式：</div>
          <div className={styles.description}>
            设置当前事务中角色担任其它事务角色时是否需要被邀请，按钮打开时角色邀请需要事务审批，按钮关闭时无需审批。
          </div>
          <div className={styles.content}>
            <div className={styles.switchGroup}>
              <span className={styles.label}>本事务</span>
              <Switch checkedChildren="开" unCheckedChildren="关" disabled={!editAffairPermission}/>
            </div>
            <div className={styles.switchGroup}>
              <span className={styles.label}>父事务</span>
              <Switch checkedChildren="开" unCheckedChildren="关" disabled={!editAffairPermission}/>
            </div>
            <div className={styles.switchGroup}>
              <span className={styles.label}>本盟</span>
              <Switch checkedChildren="开" unCheckedChildren="关" disabled={!editAffairPermission}/>
            </div>
            <div className={styles.switchGroup}>
              <span className={styles.label}>盟客网</span>
              <Switch checkedChildren="开" unCheckedChildren="关" disabled={!editAffairPermission}/>
            </div>
          </div>
        </div>

        {/* 用户名显示 */}
        {isRootAffair &&
          <div className={styles.row}>
            <div className={styles.title}>用户名显示：</div>
            <div className={styles.description}>
              选择角色或成员中用户名字段显示的内容，在事务要求成员公开真实姓名时，您可以选择将用户名显示为真实姓名。
            </div>
            <div className={styles.content}>
              <RadioGroup onChange={this.handleNameDisplayChange} value={this.state.usernameShowType} disabled={!editAffairPermission}>
                <Radio style={{ fontSize: '14px' }} key="a" value={1}>昵称</Radio>
                <Radio style={{ fontSize: '14px' }} key="b" value={0}>真实姓名</Radio>
              </RadioGroup>
            </div>
          </div>
        }

        {/* 服务方案 */}
        {isRootAffair &&
          <div className={styles.row}>
            <div className={styles.title}>服务方案：</div>
            <div className={styles.description}>
              盟客网为您的盟提供免费版、标准版、专业版三种不同服务方案，您可以根据需求进行选择。
            </div>
            <div className={styles.content}>
              <span className={styles.label}>标准版</span>
              <span className={styles.label} style={{ color: '#9b9b9b', marginLeft: '20px', marginRight: '20px' }}>剩余149天</span>
              {editAffairPermission &&
                <span className={styles.link}>改变方案</span>
              }
            </div>
          </div>
        }
        {terminateAffairPermission && affair.get('disabled') == false &&
          <div className={styles.row}>
            <Popconfirm
              onConfirm={this.handleTerminateAffair}
              onCancel={() => this.setState({ terminateStep: TERMINATE_STEP.NONE })}
              placement="top"
              overlayClassName={`${styles.stopAffairContainer} terminatePopupTarget`}
              cancelText="否"
              okText="是"
              title={this.getTerminateConfirmText()}
              visible={this.state.terminateStep != TERMINATE_STEP.NONE}
              ref={(el) => this.terminatePopup = el}
            >
              <Button
                type="ghost"
                size="large"
                className={styles.terminateButton}
                onClick={() => {
                  this.setState({ terminateStep: this.state.terminateStep == TERMINATE_STEP.NONE ? TERMINATE_STEP.SUB_AFFAIR : TERMINATE_STEP.NONE })
                }}
                ref={(el) => this.terminateButton = el}
              >终止本事务</Button>
            </Popconfirm>
          </div>
        }
        {affair.get('disabled') &&
          <div className={styles.row}>
            <Button
              type="ghost"
              size="large"
              className={styles.terminateButton}
              onClick={this.onReuseAffair}
            >恢复终止事务</Button>
          </div>
        }
      </div>
    )
  }
})

function mapStateToProps(state, props) {
  const alliance = state.get('alliance').get('myAllianceList').get(props.affair.allianceId)

  return {
    alliance: alliance,
    affairList: state.getIn(['affair', 'affairList']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    modifyAffairInfo: bindActionCreators(modifyAffairInfo, dispatch),
    terminateAffair: bindActionCreators(terminateAffair, dispatch),
    fetchUserRoleList: bindActionCreators(fetchUserRoleList, dispatch),
    pushPermittedURL: bindActionCreators(pushPermittedURL, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AffairBasicSettingContainer)
