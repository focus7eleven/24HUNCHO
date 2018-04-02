import React from 'react'
import { Popover, Checkbox, Modal, Dropdown, Menu, Form } from 'antd'
import styles from './MineTaskTable.scss'
import { fromJS, List } from 'immutable'
import classNames from 'classnames'
import config from '../../config'
import moment from 'moment'
import messageHandler from 'messageHandler'
import { ArrowDropDown, MoreIcon, Cog } from 'svg'
import { RoleItem } from '../../components/role/RoleSelector'
import CreateWorkModal from '../announcement/modal/CreateWorkModal'

const STATUS_STYLES = [{
  color: '#ca90e7',
  text: '待开始',
}, {
  color: '#926dea',
  text: '进行中',
}, {
  color: '#6ca2f3',
  text: '暂停中',
}, {
  color: '#55cce9',
  text: '已完成',
}, {
  color: '#c7cbd0',
  text: '已取消',
}]

class MineTaskTable extends React.Component {
  static defaultProps = {
    filterRoleId: null,
    roles: List(),
  }

  state = {
    workList: fromJS([]),
    showModifyTaskModal: null, //修改工作的模态框
    showTaskInformation: null, //模态框显示工作的详细信息
    filterList: fromJS([{
      name: '我负责的',
      active: true,
    }, {
      name: '我创建的',
      active: false,
    }, {
      name: '我协作的',
      active: false,
    }]),
    statusFilterList: fromJS([{
      name: '待开始',
      active: true,
    }, {
      name: '进行中',
      active: true,
    }, {
      name: '暂停',
      active: true,
    }, {
      name: '已完成',
      active: true,
    }, {
      name: '取消',
      active: true,
    }]),
  }
  getInitialState(){
    return {
      offTimeFilter: true
    }
  }
  componentDidMount() {
    this.fetchWorkList(this.props, this.state)
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextProps.filterRoleId != this.props.filterRoleId) {
      this.fetchWorkList(nextProps, nextState)
    }

    if (nextState.filterList != this.state.filterList) {
      this.fetchWorkList(nextProps, nextState)
    }

    if (nextState.statusFilterList != this.state.statusFilterList) {
      this.fetchWorkList(nextProps, nextState)
    }
  }

  fetchWorkList({
    filterRoleId,
    roles,
  }, {
    filterList,
    statusFilterList,
  }) {
    // 当前用户与准备获取的工作的关系
    let filterWorkRelation = filterList.findIndex((v) => v.get('active'))

    // 准备获取的工作的状态
    let filterWorkState = statusFilterList.map((filter, key) => {
      if (filter.get('active')) {
        return key
      } else {
        return null
      }
    }).filter((v) => v !== null).toJS()

    // 获取这些角色的工作
    let roleIds = filterRoleId ? [filterRoleId] : roles.map((v) => v.get('roleId')).toJS()

    return fetch(config.api.task.work.all, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        // 暂时获取所有数据。
        conditions: {
          lastTime: 0,
          limit: 10000,
        },
        choose: filterWorkRelation,
        roleIds: roleIds,
        states: filterWorkState,
      }),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        this.setState({
          workList: fromJS(json.data.workList)
        })
      }
    })
  }

  fetchWorkInformation = (work) => {
    // 标记该工作为已读
    fetch(config.api.announcement.detail.task.read.post(work.get('id')), {
      method: 'POST',
      affairId: work.get('affairId'),
      roleId: work.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0 ) {
        this.setState({
          workList: this.state.workList.map((v) => v.get('id') === work.get('id') ? v.set('readState', 1) : v)
        })
      }
    })

    return fetch(config.api.announcement.detail.task.get(work.get('id')), {
      method: 'GET',
      affairId: work.get('affairId'),
      roleId: work.get('roleId'),
    }).then((res) => res.json()).then(messageHandler)
  }

  handleShowWorkInformation = (work) => {
    this.fetchWorkInformation(work).then((json) => {
      if (json.code === 0){
        this.setState({
          showTaskInformation: fromJS(json.data),
        })
      }
    })
  }

  handleModifyWork = (work) => {
    this.fetchWorkInformation(work).then((json) => {
      if (json.code === 0) {
        this.setState({
          showModifyTaskModal: fromJS(json.data)
            .set('announcementId', work.get('announcementId'))
            .set('affairId', work.get('affairId'))
            .set('roleId', work.get('roleId'))
            .set('id', work.get('id')),
        })
      }
    })
  }

  handleDeleteWork = (work) => {
    fetch(config.api.announcement.detail.task.delete(work.get('id'), work.get('announcementId')), {
      method: 'POST',
      affairId: work.get('affairId'),
      roleId: work.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0){
        this.setState({
          workList: this.state.workList.filter((v) => v.get('id') !== work.get('id'))
        })
      }
    })
  }

  handleUpdateWork = () => {
    this.setState({
      showModifyTaskModal: null,
    })
    this.fetchWorkList(this.props, this.state)
  }

  getStatusFilterList = () => {
    return this.state.statusFilterList
  }

  renderStatusFilter() {
    const statusFilterList = this.state.statusFilterList
    const checkAllIndeterminate = statusFilterList.some((v) => v.get('active')) && statusFilterList.some((v) => !v.get('active'))
    const activeCount = statusFilterList.filter((v) => v.get('active')).size

    return (
      <div className={styles.statusFilterList}>
        <Checkbox
          indeterminate={checkAllIndeterminate}
          onChange={() => {
            let statusFilterList = this.state.statusFilterList
            if (activeCount > statusFilterList.size / 2) {
              statusFilterList = statusFilterList.map((v) => v.set('active', false))
            } else {
              statusFilterList = statusFilterList.map((v) => v.set('active', true))
            }
            this.setState({
              statusFilterList,
            })
          }}
          checked={activeCount === statusFilterList.size}
        >
          全部状态
        </Checkbox>

        {
          statusFilterList.map((filter) => {
            return (
              <Checkbox
                onChange={() => {
                  const newStatusFilterList = statusFilterList.map((v) => v.get('name') === filter.get('name') ? v.update('active', (w) => !w) : v)
                  this.setState({
                    statusFilterList: newStatusFilterList,
                  })
                }}
                checked={filter.get('active')}
                key={filter.get('name')}
              >
                {filter.get('name')}
              </Checkbox>
            )
          })
        }
      </div>
    )
  }
  renderTableHeader() {
    return (
      <div className={styles.tableHeader}>
        <Cog style={{ width: 12, height: 12, marginRight: 12, marginLeft: 12 }}/>
        <div style={{ width: '59.6%' }}>工作名称</div>
        <div className={styles.center} style={{ width: '13%', marginRight: '35px', cursor: 'pointer', minWidth: 70 }}>
          <Popover trigger="click" placement="bottom" content={this.renderStatusFilter()}>
            <p className={styles.workStatusFilter}>
              工作状态
              <ArrowDropDown />
            </p>
          </Popover>
        </div>
        <div style={{ width: '15%', minWidth: 148 }} className={styles.offTime}>
          <span>截止时间</span>
          <div className={styles.offTimeFilter}>
            <ArrowDropDown style={{ transform: 'rotate(180deg)', top: '5px', fill: this.state.offTimeFilter ? 'black' : '#ccc' }} onClick={() => {this.setState({ offTimeFilter: true })}}/>
            <ArrowDropDown style={{ top: '-5px', fill: this.state.offTimeFilter ? '#ccc' : 'black' }} onClick={() => {this.setState({ offTimeFilter: false })}}/>
          </div>
          
        </div>
      </div>
    )
  }
  renderWorkStatus(work, style = {}) {
    const statusStyle = STATUS_STYLES[work.get('state') || 0]

    return (
      <div className={styles.workStatus} style={style}>
        <span style={{ backgroundColor: statusStyle.color }} />
        {statusStyle.text}
      </div>
    )
  }
  renderEndTime(endTime) {
    const style = endTime < Date.now() ? { color: '#f45b6c' } : {}
    return <div className={styles.endTime} style={style}>{moment(endTime).format('YY/MM/DD hh:mm')}</div>
  }
  renderOperationPopover(work) {
    const menu = (
      <Menu>
        <Menu.Item key="0">
          <div className={styles.operationPopoverItem} onClick={() => this.handleModifyWork(work)}>修改</div>
        </Menu.Item>
        <Menu.Item key="1">
          <div className={styles.operationPopoverItem} onClick={() => this.handleDeleteWork(work)}>删除</div>
        </Menu.Item>
      </Menu>
    )

    return (
      <div className={styles.operationPopover} onClick={(evt) => evt.stopPropagation()}>
        <Dropdown overlay={menu} trigger={['click']}>
          <MoreIcon />
        </Dropdown>
      </div>
    )
  }
  renderTableContent() {
    let workList = this.state.workList
    if (this.state.offTimeFilter){
      workList = workList.sort((a, b) => {return a.get('offTime') < b.get('offTime')})
    } else {
      workList = workList.sort((a, b) => {return a.get('offTime') > b.get('offTime')})
    }

    return (
      <div className={styles.tableContent}>
        {
          workList.map((work) => {
            return (
              <div
                className={styles.tableItem}
                key={work.get('id')}
                onClick={() => this.handleShowWorkInformation(work)}
              >
                <div className={styles.readState}>
                  {!work.get('readState') ? <div className={styles.readBall} /> : null}
                </div>

                <div className={styles.workName}>
                  <div>{work.get('title')}</div>
                  <p>{`来自：${work.get('announcementName')}`}</p>
                </div>

                {this.renderWorkStatus(work)}

                {this.renderEndTime(work.get('offTime'))}

                {this.renderOperationPopover(work)}
              </div>
            )
          })
        }
      </div>
    )
  }
  renderFilters() {
    return (
      <div className={styles.filterGroup}>
        {
          this.state.filterList.map((filter) => {
            return (
              <div
                className={classNames(styles.filter, filter.get('active') ? styles.activeFilter : null)}
                key={filter.get('name')}
                onClick={() => {
                  const filterList = this.state.filterList.map((v) => v.set('active', v.get('name') === filter.get('name')))
                  this.setState({
                    filterList,
                  })
                }}
              >
                {filter.get('name')}
              </div>
            )
          })
        }
      </div>
    )
  }
  renderInformationModal() {
    const work = this.state.showTaskInformation
    if (!work) return

    return (
      <Modal
        visible
        title={'查看工作'}
        footer={null}
        onCancel={() => this.setState({ showTaskInformation: null })}
      >
        <div className={styles.taskInformation}>
          <div className={styles.informationItem}>
            <span>工作名称：</span>
            <span>{work.get('name')}</span>
          </div>

          <div className={styles.informationItem}>
            <span>截止时间：</span>
            <span>{moment(work.get('offTime')).format('YYYY/MM/DD m:ss')}</span>
          </div>

          <div className={styles.informationItem}>
            <span>状态：</span>
            {this.renderWorkStatus(work, { height: 20, lineHeight: '20px', width: 80, marginLeft: '17px' })}
          </div>

          <div className={styles.informationItem}>
            <span>负责人：</span>
            <div className={styles.roleGroup}>
              {work.get('ownerRole') && !!work.get('ownerRole').get('roleId') ? <RoleItem role={work.get('ownerRole')} /> : null}
            </div>
          </div>

          <div className={styles.informationItem}>
            <span>协作者：</span>
            <div className={styles.roleGroup}>{work.get('joinRoles').map((role, key) => <RoleItem key={key} role={role} />)}</div>
          </div>

          <div className={styles.informationItem}>
            <span style={{ marginRight: 33 }}>备注：</span>
            <span>{work.get('note')}</span>
          </div>
        </div>
      </Modal>
    )
  }
  renderModifyTaskModal() {
    const work = this.state.showModifyTaskModal
    if (!work) return null

    const workData = {
      title: work.get('name'),
      endTime: work.get('offTime'),
      remark: work.get('note') || '',
      state: work.get('state'),
      responsor: work.get('ownerRole'),
      cooperationRoles: work.get('joinRoles'),
      id: work.get('id'),
    }

    return (
      <CreateWorkModal
        announcementId={work.get('announcementId')}
        affairId={work.get('affairId')}
        roleId={work.get('roleId')}
        work={workData}
        isEdit
        onCancelCallback={() => this.setState({ showModifyTaskModal: false })}
        submitCallback={this.handleUpdateWork}
      />
    )
  }
  render() {
    return (
      <div className={styles.container}>
        {this.renderFilters()}

        {this.renderTableHeader()}
        {this.renderTableContent()}
        {this.renderInformationModal()}
        {this.renderModifyTaskModal()}
      </div>
    )
  }
}

export default Form.create()(MineTaskTable)
