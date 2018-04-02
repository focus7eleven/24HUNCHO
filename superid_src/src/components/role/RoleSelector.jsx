import React from 'react'
import ReactDOM from 'react-dom'
import { Icon, Input, Checkbox, Dropdown, Popover } from 'antd'
import { fromJS, List } from 'immutable'
import { AddCircleIcon } from 'svg'
import classNames from 'classnames'
import styles from './RoleSelector.scss'
import ChoosePublishTarget from '../../containers/task/ChoosePublishTarget'
import AffairAvatar from 'components/avatar/AffairAvatar'
import StringHandler from 'utils/stringHandler'

class RoleItem extends React.Component {
  static defaultProps = {
    onRemoveRole: null,
    onClick: null,
    role: null,
    className: null,
    searchText: '',
  }

  handleRemoveRole = (evt) => {
    evt.stopPropagation()

    this.props.onRemoveRole && this.props.onRemoveRole(evt)
  }

  handleClick = (evt) => {
    evt.stopPropagation()
    this.props.onClick && this.props.onClick()
  }

  render() {
    const role = this.props.role
    if (!role) return null
    return (
      <div className={classNames(styles.roleItem, this.props.className)} onClick={this.handleClick} >
        <div className={styles.avatar}>
          {role.get('avatar') ? <img src={role.get('avatar')} /> : null}
          {this.props.onRemoveRole ? <div className={styles.mask} onClick={this.handleRemoveRole}><Icon type="close" /></div> : null}
        </div>
        <p>
          {this.props.searchText == '' ?
            `${role.get('roleTitle')}－${role.get('username')}`
          : (
            StringHandler
              .splitAndJoin(`${role.get('roleTitle')}－${role.get('username')}`, this.props.searchText)
              .map((str) => str == this.props.searchText ? <span style={{ color: '#926dea' }}>{str}</span> : str)
          )}
        </p>
      </div>
    )
  }
}

// 选择官方的选择器
class OfficialRoleSelector extends React.Component {
  static defaultProps = {
    onChange: () => {},
    selectedRoleList: fromJS([]),
    roleList: fromJS([]),
    selectedGuestList: List(),
  }

  state = {
    openPanel: false,
    searchWord: '',
  }

  componentWillMount(){
    document.addEventListener('click', this.onClick, true)
  }
  componentWillUnmount(){
    document.removeEventListener('click', this.onClick, true)
  }

  onClick = (e) => {
    if (!(ReactDOM.findDOMNode(this).contains(e.target)) && !(ReactDOM.findDOMNode(this.dropdown) && ReactDOM.findDOMNode(this.dropdown).contains(e.target))) {
      this.setState({
        openPanel: false,
      })
    }
  }

  onChange = (e) => {
    const role = e.target.value
    if (e.target.checked) {
      e = {
        ...e,
        target: {
          value: this.props.selectedRoleList.push(role)
        }
      }
    } else {
      e = {
        ...e,
        target: {
          value: this.props.selectedRoleList.filter((v) => v.get('roleId') !== role.get('roleId'))
        }
      }
    }

    /*
    * barely recommend using this event 'cause the event type is undetermined
    * developer should just use the first param
    */
    this.props.onChange && this.props.onChange(e.target.value, e)
  }

  renderSearch() {
    return (
      <Input.Search
        className={styles.searchInput}
        placeholder="搜索盟内角色"
        style={{ width: 200 }}
        onChange={(e) => this.setState({ searchWord: e.target.value })}
      />
    )
  }

  renderOpenPanel() {
    return (
      <div
        className={styles.openPanel}
        ref={(el) => this.dropdown = el}
      >
        {this.renderSearch()}
        <div className={styles.roleGroup}>
          {this.props.roleList
            .filter((role) => this.state.searchWord == '' ? true : `${role.get('roleTitle')}－${role.get('username')}`.includes(this.state.searchWord))
            .filter((role) => {return !this.props.selectedGuestList.some((w) => w.get('roleId') === role.get('roleId'))})
            .map((role) => {
              return (
                <Checkbox
                  value={role}
                  checked={!!this.props.selectedRoleList.find((v) => v.get('roleId') === role.get('roleId'))}
                  key={role.get('roleId')}
                  onChange={this.onChange}
                >
                  <RoleItem role={role} />
                </Checkbox>
              )
            })}
        </div>
      </div>
    )
  }

  renderSelectedRole() {
    return (
      <div className={styles.selectedRoleGroup}>
        {this.props.selectedRoleList.map((role) => {
          return (
            <RoleItem
              key={role.get('roleId')}
              role={role}
              onRemoveRole={(e) => {
                this.onChange({
                  ...e,
                  target: {
                    checked: false,
                    value: role
                  }
                })
              }}
            />
          )
        })}
      </div>
    )
  }

  render() {
    return (
      <Dropdown
        overlay={this.renderOpenPanel()}
        visible={this.state.openPanel}
      >
        <div
          className={classNames(styles.selector, this.props.className, this.props.selectedRoleList.size < 1 ? styles.redBorder : null)}
          onClick={() => this.setState({ openPanel: !this.state.openPanel })}
          style={this.props.style || {}}
        >
          {this.state.openPanel ? <Icon type="up" /> : <Icon type="down" />}
          {this.renderSelectedRole()}
        </div>
      </Dropdown>
    )
  }
}

// 选择客方的选择器
class GuestRoleSelector extends React.Component {
  static defaultProps = {
    onChange: () => {},
    selectedRoleList: fromJS([]),
    roleList: fromJS([]),
    selectedOfficialRoleList: List(),
    className: '',
  }

  state = {
    openPanel: false,
  }

  componentWillMount(){
    document.addEventListener('click', this.onClick, true)
  }
  componentWillUnmount(){
    document.removeEventListener('click', this.onClick, true)
  }

  onClick = (e) => {
    if (!(ReactDOM.findDOMNode(this).contains(e.target)) && !(ReactDOM.findDOMNode(this.dropdown) && ReactDOM.findDOMNode(this.dropdown).contains(e.target))) {
      this.setState({
        openPanel: false,
      })
    }
  }

  renderOpenPanel() {
    const { affairId, roleId, allianceId } = this.props

    return (
      <div
        className={styles.openPanel}
        style={{ padding: 0, width: 'inherit' }}
        ref={(el) => this.dropdown = el}
      >
        <ChoosePublishTarget
          affairId={Number.parseInt(affairId)}
          roleId={roleId}
          allianceId={allianceId}
          selectedOfficialRoleList={this.props.selectedOfficialRoleList}
          style={{
            padding: 0,
            width: 800,
            height: 200,
          }}
          onChange={(selectedList) => this.props.onChange(selectedList)}
        />
      </div>
    )
  }
  renderSelectedRole() {
    return (
      (this.props.selectedGuestList || List()).map((v, k) => {
        let affair, role
        switch (v.type) {
          case 'ROLE':
            role = v.payload
            return (
              <div key={k + ''} className={styles.boxContent}>
                {
                    role.avatar
                      ? <img className={styles.roleAvatar} src={role.avatar}/>
                      : <div className={styles.noRoleAvatar} />
                }
                <span className={styles.name}>{`${role.roleTitle}-${role.username}`}</span>
              </div>
            )
          case 'ALLIANCE_INNER_AFFAIRE':
            affair = v.payload
            return (
              <div key={k + ''} className={styles.boxContent}>
                <AffairAvatar sideLength={21} affair={affair}/>
                <span className={styles.name}>{affair.get('name')}</span>
              </div>
            )
          case 'MENKOR':
            affair = v.payload
            return (
              <div key={k + ''} className={styles.boxContent}>
                { affair.affairAvatar ? <AffairAvatar affair={this.props.affair} sideLength={21}/> : <div className={styles.noAvatar} /> }
                <span className={styles.name}>{affair.affairName}</span>
              </div>
            )
          default:
            return null
        }
      })
    )
  }
  render() {
    return (
      <Dropdown
        overlay={this.renderOpenPanel()}
        visible={this.state.openPanel}
      >
        <div
          className={classNames(styles.selector, this.props.className)}
          onClick={() => this.setState({ openPanel: !this.state.openPanel })}
        >
          {this.state.openPanel ? <Icon type="up" /> : <Icon type="down" />}
          {this.renderSelectedRole()}
        </div>
      </Dropdown>
    )
  }
}
GuestRoleSelector.defaultProps = {
  onChange: () => {},
  selectedRoleList: fromJS([]),
  roleList: fromJS([]),
  className: '',
}

class SingleRoleSelectPanel extends React.Component {
  state = {
    searchWord: '',
  }

  renderSearch() {
    return (
      <Input.Search
        className={styles.searchInput}
        placeholder="搜索盟内角色"
        style={{ width: 200 }}
        value={this.state.searchWord}
        onChange={(evt) => this.setState({ searchWord: evt.target.value })}
      />
    )
  }

  render(){
    const roleList = this.props.selectedRole ?
      this.props.roleList.filter((role) => {return this.props.selectedRole.get('roleId') !== role.get('roleId')})
      :
      this.props.roleList

    return (
      <div className={styles.openPanel}
        // onClick={(evt) => evt.stopPropagation()}
        style={this.props.style}
      >
        {this.renderSearch()}
        {/* 未选择的角色 */}
        <div className={styles.seg}>角色列表：</div>
        <div className={styles.roleList}>
          {roleList
            .filter((v) => {
              return !this.state.searchWord || ~v.get('roleTitle').indexOf(this.state.searchWord) || ~v.get('username').indexOf(this.state.searchWord)
            })
            .map((role) => {
              return (
                <RoleItem
                  role={role}
                  key={role.get('roleId')}
                  onClick={() => {
                    this.props.onChange({ role })
                  }}
                />)
            })
          }
        </div>
      </div>
    )
  }
}

SingleRoleSelectPanel.defaultProps = {
  roleList: fromJS([]),
  selectedRole: null,
  onChange: () => {},
  showPanel: true,
  style: '',
}

class SingleRoleSelector extends React.Component {
  state = {
    openPanel: false,
    searchWord: '',
  }

  componentWillMount(){
    document.addEventListener('click', this.onClick, true)
  }
  componentWillUnmount(){
    document.removeEventListener('click', this.onClick, true)
  }

  onClick = (e) => {
    if (ReactDOM.findDOMNode(this.search).contains(e.target)) {
      return
    }
    if (!(ReactDOM.findDOMNode(this).contains(e.target)) || !(ReactDOM.findDOMNode(this.dropdown))) {
      this.setState({
        openPanel: false,
      })
    }
  }

  onChange = (role) => {
    this.props.onChange && this.props.onChange(role)
  }

  renderOpenPanel(){
    return (
      <div
        className={styles.openPanel}
        style={{ height: '200px', position: 'static', overflow: 'auto' }}
        ref={(el) => this.dropdown = el}
      >
        <div className={styles.roleList}>
          <Input.Search
            className={styles.searchInput}
            placeholder="搜索角色"
            style={{ width: '100%', marginBottom: 5 }}
            value={this.state.searchWord}
            ref={(el) => this.search = el}
            onChange={(evt) => this.setState({ searchWord: evt.target.value })}
          />
          {this.props.roleList
            .filter((v) => {
              return !this.state.searchWord || ~v.get('roleTitle').indexOf(this.state.searchWord) || ~v.get('username').indexOf(this.state.searchWord)
            })
            .map((role, key) => {
              return (
                <RoleItem key={key} role={role} onClick={() => this.onChange(role)} />
              )
            })}
        </div>
      </div>
    )
  }

  renderSelectedRole() {
    const role = this.props.selectedRole

    if (!role) return null

    return (
      <div className={styles.selectedRoleGroup}>
        <RoleItem
          key={role.get('roleId')}
          role={role}
          onRemoveRole={() => {
            this.onChange(null)
          }}
        />
      </div>
    )
  }

  render() {
    return (
      <Dropdown
        overlay={this.renderOpenPanel()}
        visible={this.state.openPanel}
      >
        <div
          className={classNames(styles.selector, this.props.className)}
          onClick={() => this.setState({ openPanel: !this.state.openPanel })}
        >
          {this.state.openPanel ? <Icon type="up" /> : <Icon type="down" />}
          {this.renderSelectedRole()}
        </div>
      </Dropdown>
    )
  }
}

SingleRoleSelector.defaultProps = {
  onChange: () => {},
  selectedRole: null,
  roleList: fromJS([]),
  className: '',
}


// 普通角色的选择器
class RoleSelector extends React.Component {
  state = {
    openPanel: false,
    searchWord: '',
  }
  componentWillMount(){
    document.addEventListener('click', this.onClick, true)
  }
  componentWillUnmount(){
    document.removeEventListener('click', this.onClick, true)
  }

  onClick = (e) => {
    if (!(ReactDOM.findDOMNode(this).contains(e.target)) && !(ReactDOM.findDOMNode(this.dropdown) && ReactDOM.findDOMNode(this.dropdown).contains(e.target))) {
      this.setState({
        openPanel: false,
      })
    }
  }

  onChange = (e) => {
    const role = e.target.value
    if (e.target.checked) {
      e = {
        ...e,
        target: {
          value: this.props.selectedRoleList.push(role)
        }
      }
    } else {
      e = {
        ...e,
        target: {
          value: this.props.selectedRoleList.filter((v) => v.get('roleId') !== role.get('roleId'))
        }
      }
    }
    /*
    * barely recommend using this event 'cause the event type is undetermined
    * developer should just use the first param
    */
    this.props.onChange && this.props.onChange(e.target.value, e)
  }

  renderSearch() {
    return (
      <Input.Search
        className={styles.searchInput}
        placeholder="搜索盟内角色"
        onChange={(evt) => this.setState({ searchWord: evt.target.value })}
        style={{ width: 200 }}
      />
    )
  }
  renderOpenPanel() {
    const selected = !!this.props.selectedRoleList.size
    return (
      <div
        className={styles.openPanel}
        ref={(el) => this.dropdown = el}
      >
        {this.renderSearch()}

        {/* 已选择的角色 */}
        {selected && (
          <div className={styles.selectedList}>
            <div className={styles.seg}>已选择：</div>
            <div className={styles.roleList}>
              {this.props.selectedRoleList.map((role) => {
                return (
                  <Checkbox
                    value={role}
                    checked={!!this.props.selectedRoleList.find((v) => v.get('roleId') === role.get('roleId'))}
                    key={role.get('roleId')}
                    onChange={this.onChange}
                  >
                    <RoleItem role={role} />
                  </Checkbox>
                )
              })}
            </div>
          </div>
        )}

        {selected && (
          <div style={{ width: 'calc(100% - 20px)', height: 1, left: 10, backgroundColor: '#e9e9e9', position: 'relative', marginTop: 12 }} />
        )}

        {/* 未选择的角色 */}
        <div className={styles.seg}>角色列表：</div>
        <div className={styles.roleList}>
          {this.props.roleList
            .filter((role) => !this.props.selectedRoleList.find((v) => v.get('roleId') === role.get('roleId')))
            .filter((v) => {
              return !this.state.searchWord || ~v.get('roleTitle').indexOf(this.state.searchWord) || ~v.get('username').indexOf(this.state.searchWord)
            })
            .map((role) => {
              return (
                <Checkbox
                  value={role}
                  checked={!!this.props.selectedRoleList.find((v) => v.get('roleId') === role.get('roleId'))}
                  key={role.get('roleId')}
                  onChange={this.onChange}
                >
                  <RoleItem role={role} />
                </Checkbox>
              )
            })}
        </div>
      </div>
    )
  }
  renderSelectedRole() {
    if (this.props.selectAllRoles) {
      return <div className={styles.selectAllRoles}>所有角色</div>
    }

    if (this.props.renderSelectedAsText) {
      return <div className={styles.selectAllRoles}>{this.props.selectedRoleList.map((v) => `${v.get('roleTitle')}-${v.get('username')}`).join('、')}</div>
    }

    return (
      <div className={styles.selectedRoleGroup}>
        {this.props.selectedRoleList.map((role) => {
          return (
            <RoleItem
              key={role.get('roleId')}
              role={role}
              onRemoveRole={(e) => {
                this.onChange({
                  ...e,
                  target: {
                    checked: false,
                    value: role
                  }
                })
              }}
            />
          )
        })}
      </div>
    )
  }
  render() {
    return (
      <Dropdown
        overlay={this.renderOpenPanel()}
        visible={this.state.openPanel}
      >
        <div
          style={(this.props.hasSelected && this.props.hasSelected == false) ? { borderColor: 'red' } : {}}
          className={classNames(styles.selector, this.props.className)}
          onClick={() => this.setState({ openPanel: !this.state.openPanel })}
        >
          {/* {<Icon type="down" style={{ transition: 'all .2s ease', transform: `rotate(${this.state.openPanel ? 180 : 0 }deg)` }} />} */}
          {<Icon type="down" />}
          {this.props.children ? this.props.children : this.renderSelectedRole()}
        </div>
      </Dropdown>
    )
  }
}


// 简洁角色选择器，可以选是否包含子事务, 参见审批设置的角色选择
class BriefRoleSelector extends React.Component {

  static AVATAR_TYPE = { WRAP: 0, BRIEF: 1, }

  static defaultProps = {
    avatarType: BriefRoleSelector.AVATAR_TYPE.WRAP
  }

  state = {
    openPanel: false,
    searchText: '',
  }
  componentWillMount(){
    document.addEventListener('click', this.onClick, true)
  }
  componentWillUnmount(){
    document.removeEventListener('click', this.onClick, true)
  }

  onClick = (e) => {
    if (!(ReactDOM.findDOMNode(this).contains(e.target)) && !(ReactDOM.findDOMNode(this.dropdown) && ReactDOM.findDOMNode(this.dropdown).contains(e.target))) {
      this.setState({
        openPanel: false,
      })
    }
  }

  onChange = (e) => {
    const role = e.target.value
    if (e.target.checked) {
      e = {
        ...e,
        target: {
          value: this.props.selectedRoleList.push(role)
        }
      }
    } else {
      e = {
        ...e,
        target: {
          value: this.props.selectedRoleList.filter((v) => v.get('roleId') !== role.get('roleId'))
        }
      }
    }
    /*
    * barely recommend using this event 'cause the event type is undetermined
    * developer should just use the first param
    */
    this.props.onChange && this.props.onChange(e.target.value, e)
  }

  renderSearch() {
    return (
      <Input.Search
        className={styles.searchInput}
        placeholder={this.props.searchPlaceholder ? this.props.searchPlaceholder : '搜索盟内角色'}
        value={this.state.searchText}
        onChange={(e) => this.setState({ searchText: e.target.value })}
        style={{ width: 200 }}
      />
    )
  }
  renderOpenPanel() {
    const selected = !!this.props.selectedRoleList.size
    return (
      <div
        className={styles.panel}
        ref={(el) => this.dropdown = el}
      >
        {this.renderSearch()}

        {/* 已选择的角色 */}
        {selected && (
          <div className={styles.selectedList}>
            <div className={styles.seg}>已选择：</div>
            <div className={styles.roleList}>
              {this.props.selectedRoleList.map((role) => {
                return (
                  <Checkbox
                    value={role}
                    checked={!!this.props.selectedRoleList.find((v) => v.get('roleId') === role.get('roleId'))}
                    key={role.get('roleId')}
                    onChange={this.onChange}
                  >
                    <RoleItem role={role} />
                  </Checkbox>
                )
              })}
            </div>
          </div>
        )}

        {selected && (
          <div style={{ width: 'calc(100% + 20px)', height: 1, left: -10, backgroundColor: '#e9e9e9', position: 'relative', marginTop: 12 }} />
        )}

        {/* 未选择的角色 */}
        <div className={styles.seg}>角色列表：</div>
        <div className={styles.roleList}>
          {this.props.roleList
            .filter((role) => !this.props.selectedRoleList.find((v) => v.get('roleId') === role.get('roleId')))
            .filter((role) => this.state.searchText == '' ? true : `${role.get('roleTitle')}－${role.get('username')}`.includes(this.state.searchText))
            .map((role) => {
              return (
                <Checkbox
                  value={role}
                  checked={!!this.props.selectedRoleList.find((v) => v.get('roleId') === role.get('roleId'))}
                  key={role.get('roleId')}
                  onChange={this.onChange}
                >
                  <RoleItem role={role} searchText={this.state.searchText} />
                </Checkbox>
              )
            })}
        </div>
        {this.props.enableApplyChildren &&
          <div className={styles.blank} />
        }
        {this.props.enableApplyChildren &&
          <div className={styles.bottomNavbar}>
            <Checkbox
              checked={this.props.applyChildren}
              onChange={this.props.onApplyChildrenChange}
            >同时作用于子事务</Checkbox>
          </div>
        }
      </div>
    )
  }
  renderSelectedRole() {
    return (
      <div className={styles.selectedRoleGroup}>
        {this.props.selectedRoleList.map((role, index) => {
          return this.props.renderAvatar(role, index)
        })}
      </div>
    )
  }

  render() {
    return (
      <div className={classNames(this.props.className, styles.briefRoleSelector)}>
        <Popover
          trigger="hover"
          placement="bottom"
          content={this.renderOpenPanel()}
          overlayClassName={styles.overlay}
        >
          {this.renderSelectedRole()}
          {this.props.selectedRoleList.size < this.props.roleList.size &&
            <div className={styles.addCircleIcon}><AddCircleIcon /></div>
          }
        </Popover>
      </div>
    )
  }
}

export { OfficialRoleSelector, GuestRoleSelector, RoleSelector, SingleRoleSelector, SingleRoleSelectPanel, RoleItem, BriefRoleSelector }
