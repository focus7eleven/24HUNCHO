import React from 'react'
import ReactDOM from 'react-dom'
import { Icon, Input, Checkbox, Dropdown } from 'antd'
import { fromJS } from 'immutable'
import classNames from 'classnames'
import styles from './RoleSelector.scss'
// import ChoosePublishTarget from '../../containers/task/ChoosePublishTarget'

class RoleItem extends React.Component {
  static defaultProps = {
    onRemoveRole: null,
    onClick: null,
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
      <div className={styles.roleItem} onClick={this.handleClick}>
        <div className={styles.avatar}>
          {role.get('avatar') ? <img src={role.get('avatar')} /> : null}
          {this.props.onRemoveRole ? <div className={styles.mask} onClick={this.handleRemoveRole}><Icon type="close" /></div> : null}
        </div>
        <p>{`${role.get('roleTitle')}－${role.get('username')}`}</p>
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
        placeholder="搜索盟内成员、角色"
        style={{ width: 200 }}
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
          {this.props.roleList.map((role) => {
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
          className={classNames(styles.selector, this.props.className)}
          onClick={() => this.setState({ openPanel: !this.state.openPanel })}
        >
          {this.state.openPanel ? <Icon type="caret-up" /> : <Icon type="caret-down" />}
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
        style={{ padding: 0 }}
        ref={(el) => this.dropdown = el}
      >
        {/* <ChoosePublishTarget
          affairId={Number.parseInt(affairId)}
          roleId={roleId}
          allianceId={allianceId}
          style={{
            padding: 0,
            width: 800,
            height: 200,
          }}
        /> */}
      </div>
    )
  }
  renderSelectedRole() {
    return (
      <div className={styles.selectedRoleGroup}>
        {this.props.selectedRoleList.map((role) => {
          return <RoleItem key={role.get('roleId')} role={role} />
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
          className={classNames(styles.selector, this.props.className)}
          onClick={() => this.setState({ openPanel: !this.state.openPanel })}
        >
          {this.state.openPanel ? <Icon type="caret-up" /> : <Icon type="caret-down" />}
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
  renderSearch() {
    return (
      <Input.Search
        className={styles.searchInput}
        placeholder="搜索盟内成员、角色"
        style={{ width: 200 }}
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
          {roleList.map((role) => {
            return (
              <RoleItem
                role={role}
                key={role.get('roleId')}
                onClick={() => {
                  this.props.onChange({ role })
                }}
              />)
          })}
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

  onChange = (role) => {
    this.props.onChange && this.props.onChange(role)
  }

  renderOpenPanel(){
    return (
      <div
        className={styles.openPanel}
        style={{ height: 'auto', position: 'static' }}
        ref={(el) => this.dropdown = el}
      >
        <div className={styles.roleList}>
          {this.props.roleList
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
          {this.state.openPanel ? <Icon type="caret-up" /> : <Icon type="caret-down" />}
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
        placeholder="搜索盟内成员、角色"
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
        <div style={{ width: 'calc(100% + 20px)', height: 1, left: -10, backgroundColor: '#e9e9e9', position: 'relative', marginTop: 12 }} />
        )}

        {/* 未选择的角色 */}
        <div className={styles.seg}>角色列表：</div>
        <div className={styles.roleList}>
          {this.props.roleList
            .filter((role) => !this.props.selectedRoleList.find((v) => v.get('roleId') === role.get('roleId')))
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
          className={classNames(styles.selector, this.props.className)}
          onClick={() => this.setState({ openPanel: !this.state.openPanel })}
        >
          {this.state.openPanel ? <Icon type="caret-up" /> : <Icon type="caret-down" />}
          {this.renderSelectedRole()}
        </div>
      </Dropdown>
    )
  }
}

export { OfficialRoleSelector, GuestRoleSelector, RoleSelector, SingleRoleSelector, SingleRoleSelectPanel }
