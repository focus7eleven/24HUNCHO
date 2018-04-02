import React from 'react'
import { Popover, message, Tooltip } from 'antd'
import { AddIcon } from 'svg'
import { fromJS } from 'immutable'
import RoleListPanel from './RoleListPanel'
import styles from './FundOwnerListPopup.scss'
import config from '../../config'
import messageHandler from '../../utils/messageHandler'

const FundOwnerListPopup = React.createClass({

  getDefaultProps() {
    return {

    }
  },

  getInitialState() {
    const { fund } = this.props
    
    let addOwnerList = []

    if (fund.roleVOs && fund.roleVOs.length > 0) {
      addOwnerList = fromJS(fund.roleVOs)
    } else {
      addOwnerList = fromJS([])
    }
    return {
      visible: false,
      showRoleList: false,
      addOwnerList,
    }
  },

  componentDidMount() {

  },

  handleVisibleChange(visible) {
    this.setState({ visible })
  },

    // 添加负责人
  handleAddRoles(roles) {
    const { affair, fund } = this.props
    const data = {
      delOrAdd: 0,
      operatorId: affair.get('roleId'),
      ownerRoleIds: roles.map((r) => r.roleId),
      poolId: fund.poolId
    }

    fetch(config.api.fund.modify_owner(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify(data)
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        message.success('添加负责人成功！')
        this.setState({
          visible: true,
          addOwnerList: this.state.addOwnerList.concat(fromJS(roles.map((r) => {
            r.id = r.roleId
            return r
          }))),
          showRoleList: false,
        })
      }
    })

  },

    // 删除负责人
  handleDeleteRole(v) {
    const { affair, fund } = this.props

    const data = {
      delOrAdd: 1,
      operatorId: affair.get('roleId'),
      ownerRoleIds: [v.roleId],
      poolId: fund.poolId
    }

    fetch(config.api.fund.modify_owner(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify(data)
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        message.success('删除负责人成功！')
        const nextAuthorities = this.state.addOwnerList.filter((w) => (w.get('roleId') != v.roleId))
        this.setState({ addOwnerList: nextAuthorities })
      }
    })

  },

  renderFundOwnerList() {
    const { affair } = this.props
    const { addOwnerList } = this.state
    let ownerList = addOwnerList.toJS()
    return (
      <div className={styles.ownerPopupList}>
        <ol className={styles.ownerListOl}>
          {ownerList.map((official, k) => (
            <li className={styles.officialContainer} key={k}>
              <div className={styles.official}>

                {official.avatar ? <img src={official.avatar} /> : null}

                {(official.roleId !== affair.get('roleId')) ?
									(
  <Tooltip placement="top" title="移除负责人">
    <div className={styles.officialMask} onClick={() => this.handleDeleteRole(official)}>
      <AddIcon fill="#fff" />
    </div>
  </Tooltip>
									) : null
								}
              </div>

              {<div className={styles.title}>{`${official.roleTitle}－${official.username}`}</div>}
            </li>
					))}
        </ol>

        <div className={styles.addOwnerBtn} onClick={() => this.setState({ showRoleList: true })}><span>添加负责人</span></div>
      </div>
    )
  },

  render() {
    const { affair } = this.props
    const { showRoleList, addOwnerList } = this.state

    let ownerList = addOwnerList.filter((o, i) => i < 3)

    return (
      <Popover
        placement="bottom"
        content={this.renderFundOwnerList()}
        trigger="hover"
        visible={this.state.visible}
        onVisibleChange={this.handleVisibleChange}
        overlayClassName={styles.FundOwnerListPopup}
      >
        <div className={styles.ownerList} style={{ width: `${24 + (ownerList.size - 1) * 8}px` }}>
          {ownerList.map((o, i) => {
            const oStyle = {
              zIndex: (4 - i),
              left: (8 * i ) + 'px'
            }
            return (
              <img key={i} className={styles.ownerLogo} src={o.get('avatar')} style={oStyle}/>
            )
          })}
        </div>
        {showRoleList ?
          <RoleListPanel
            affair={affair}
            usePrimaryRoleFilter
            existRoles={addOwnerList.toJS()}
            onOk={this.handleAddRoles}
            close={() => this.setState({ showRoleList: false })}
          /> : null}
      </Popover>
    )
  }
})

export default FundOwnerListPopup
