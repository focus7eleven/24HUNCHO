import React from 'react'
import PropTypes from 'prop-types'
import { Tooltip, Popover, Input } from 'antd'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { AddIcon } from 'svg'
import styles from './MemberListButton.scss'
import { getAllTeacher } from '../../actions/user'


class MemberListButton extends React.Component {
  static propTypes = {
    onMemberChange: PropTypes.func.isRequired,
    defaultList: PropTypes.array.isRequired,
  }

  static defaultProps = {
    onMemberChange: () => {},
    defaultList: [],
  }

  state = {
    memberList: [],
    selectedMemberList: this.props.defaultList,
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.defaultList != this.state.selectedMemeberList) {
      this.setState({
        selectedMemberList: nextProps.defaultList
      })
    }
  }

  componentDidMount() {
    this.props.getAllTeacher().then(res => {
      this.setState({ memberList: res })
    })
  }

  handleAddMember = (member) => {
    const newMemberList = this.state.selectedMemberList.concat([member])
    this.setState({ selectedMemberList: newMemberList })
    this.props.onMemberChange(newMemberList)
  }

  handleRemoveMember = (id) => {
    const newMemberList = this.state.selectedMemberList.filter(v => v.id !== id)
    this.setState({ selectedMemberList: newMemberList })
    this.props.onMemberChange(newMemberList)
  }

  renderSelectedMemberList() {
    const { selectedMemberList } = this.state
    return (
      selectedMemberList.map((m, k) => (
        <div key={k} className={styles.officialContainer}>
          <div className={styles.official}>
            {m.avatar ? <img src={m.avatar} /> : null}
            <div className={styles.officialMask} onClick={this.handleRemoveMember.bind(this, m.id)}>
              <AddIcon fill="#fff" />
            </div>
          </div>
          <div className={styles.title} style={{color: 'black'}}>{`${m.title}-${m.realName}`}</div>
        </div>
      ))
    )
  }

  renderMemberPanel() {
    const { memberList, selectedMemberList } = this.state

    return (
      <div className={styles.mainRolePanel}>
        {/* <Input /> */}
        {
          memberList.filter(v => selectedMemberList.indexOf(v) === -1).map((v, k) => {
            return (
              <div key={k} className={styles.mainRole} onClick={this.handleAddMember.bind(this, v)}>
                <div className={styles.mainRoleAvatar}>
                  <img src={v.avatar} />
                </div>
                <div>{`${v.title} ${v.realName}`}</div>
              </div>
            )
          })
        }
      </div>
    )
  }

  render() {
    const { memberList } = this.state

    return (
      <div className={styles.container}>

        { this.renderSelectedMemberList() }
        {
          memberList.length ? (
            <Popover overlayClassName={styles.officialPopover} placement="bottomLeft" content={this.renderMemberPanel()} trigger="click">
              <div className={styles.addIcon}>
                <AddIcon />
              </div>
            </Popover>
          ) : null
        }
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  return {
    // roleId: state.getIn(['user', 'role', 'roleId']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getAllTeacher: bindActionCreators(getAllTeacher, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MemberListButton)
