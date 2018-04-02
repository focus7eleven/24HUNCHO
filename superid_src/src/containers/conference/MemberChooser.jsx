import React, { PropTypes } from 'react'
import { Record, List } from 'immutable'
import { Checkbox } from 'antd'
import classNames from 'classnames'
import styles from './MemberChooser.scss'
import CircleAvatar from '../../components/avatar/CircleAvatar'
import config from '../../config'

const Role = Record({
  roleName: '平面设计师',
  userName: '成橙',
  avatar: null,
  id: null,
  userId: null,
  selected: false,
}, 'Role')
const IN_ALLIANCE = 'IN_ALLIANCE'
const IN_GROUP = 'IN_GROUP'

const MemberChooser = React.createClass({
  propTypes: {
    userId: PropTypes.number.isRequired,
    affair: PropTypes.object.isRequired,
    inGroupMember: PropTypes.array.isRequired,
    disabledRoleId: PropTypes.object, // 已经被选择的角色，不能再次被选中。
  },

  getDefaultProps() {
    return {
      disabledRoleId: List(),
    }
  },

  getInitialState() {
    const {
      inGroupMember,
      userId,
    } = this.props
    let groupMember = List(inGroupMember.map((v) => {
      return new Role({
        id: v.roleId || v.id,
        roleName: v.roleName || v.roleTitle,
        userName: v.userName || v.username,
        avatar: v.avatar,
        userId: v.userId,
      })
    }))
    // const role = groupMember.find((v) => v.get('userId') === userId)
    groupMember = groupMember.filter((v) => v.get('userId') !== userId)

    return {
      groupMember, // 当前讨论组中的角色，不包含当前操作角色。
      // inAllianceMember: Range(0, 15).map(() => new Role({
      //   id: ~~(Math.random() * 100000),
      //   userName: ~~(Math.random() * 1000).toString(),
      // })).toList(),
      inAllianceMember: List(),
      currentTab: IN_GROUP,
    }
  },

  componentDidMount() {
    this.fetchInAllianceMember()
  },

  fetchInAllianceMember() {
    fetch(config.api.affair.role.affair_roles(), {
      method: 'GET',
      credentials: 'include',
      roleId: this.props.affair.get('roleId'),
      affairId: this.props.affair.get('id'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          inAllianceMember: List(json.data.map((v) => {
            return new Role({
              id: v.roleId || v.id,
              roleName: v.roleName || v.roleTitle,
              userName: v.userName || v.username,
              avatar: v.avatar,
              userId: v.userId,
            })
          })),
        })
      }
    })
  },

  getSelectedRole() {
    return this.state.groupMember.concat(this.state.inAllianceMember).filter((v) => !!v.get('selected'))
      .reduce((r, v) => r.every((w) => w.get('id') !== v.get('id')) ? r.push(v) : r, List())
  },

  renderCheckboxList(members) {
    return (
      <div className={styles.checkboxList}>
        {
          members.map((member) => {
            return (
              <Checkbox
                key={member.get('id')}
                checked={!!this.props.disabledRoleId.find((v) => v == member.get('id')) || member.get('selected')}
                disabled={!!this.props.disabledRoleId.find((v) => v == member.get('id'))}
                onChange={() => {
                  this.setState({
                    groupMember: this.state.groupMember.map((v) => v.get('id') === member.get('id') ? v.update('selected', (w) => !w) : v),
                    inAllianceMember: this.state.inAllianceMember.map((v) => v.get('id') === member.get('id') ? v.update('selected', (w) => !w) : v),
                  })
                }}
              >
                <CircleAvatar radius={25} src={member.get('avatar')} />
                <div style={{ marginLeft: 4 }}>{`${member.get('roleName')}－${member.get('userName')}`}</div>
              </Checkbox>
            )
          })
        }
      </div>
    )
  },

  renderGroupChooser() {
    const allSelected = this.state.groupMember.every((v) => v.get('selected'))

    return (
      <div className={styles.groupChooser}>
        <Checkbox
          checked={allSelected}
          onClick={() => this.setState({ groupMember: this.state.groupMember.map((v) => v.set('selected', !allSelected)) })}
        >
          全选
        </Checkbox>

        <div className={styles.groupChooserContent}>
          <div className={styles.firstColumn}>
            {this.renderCheckboxList(this.state.groupMember.filter((v, k) => !(k % 2)))}
          </div>
          <div className={styles.secondColumn}>
            {this.renderCheckboxList(this.state.groupMember.filter((v, k) => k % 2))}
          </div>
        </div>
      </div>
    )
  },
  renderInAllianceChooser() {
    return (
      <div className={styles.inAllianceChooser}>
        <div className={styles.inAllianceChooserContent}>
          <div className={styles.firstColumn}>
            {this.renderCheckboxList(this.state.inAllianceMember.filter((v, k) => !(k % 2)))}
          </div>
          <div className={styles.secondColumn}>
            {this.renderCheckboxList(this.state.inAllianceMember.filter((v, k) => k % 2))}
          </div>
        </div>
      </div>
    )
  },
  renderLeft() {
    return (
      <div className={styles.leftGroup}>
        {/* 选择盟内或讨论组 */}
        <div className={styles.tabs}>
          <div
            className={classNames(styles.tab, this.state.currentTab === IN_GROUP ? styles.activeTab : null)}
            onClick={() => this.setState({ currentTab: IN_GROUP })}
          >
            讨论组
          </div>
          <div
            className={classNames(styles.tab, this.state.currentTab === IN_ALLIANCE ? styles.activeTab : null)}
            onClick={() => this.setState({ currentTab: IN_ALLIANCE })}
          >
            盟内
          </div>
        </div>

        {this.state.currentTab === IN_GROUP && this.renderGroupChooser()}
        {this.state.currentTab === IN_ALLIANCE && this.renderInAllianceChooser()}
      </div>
    )
  },
  renderRight() {
    const selected = this.getSelectedRole()

    return (
      <div className={styles.rightGroup}>
        <p>已选择</p>
        <div className={styles.selectedGroup}>
          {this.renderCheckboxList(selected)}
        </div>
      </div>
    )
  },
  render() {
    return (
      <div className={styles.container}>
        {this.renderLeft()}
        {this.renderRight()}
      </div>
    )
  }
})

export default MemberChooser
