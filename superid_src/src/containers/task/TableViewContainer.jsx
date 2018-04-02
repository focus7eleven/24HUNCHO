import React, { PropTypes } from 'react'
import styles from './TableViewContainer.scss'
import { Cog, SearchIcon, TableInfoEdit } from 'svg'
import { Table, Input, Button, message, Popover, Checkbox, DatePicker, Icon, Tooltip } from 'antd'
import { fromJS, List } from 'immutable'
import _ from 'underscore'
import config from '../../config'
import { SLOGAN_BG_COLORS } from '../../components/avatar/AffairAvatar'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getAffairTasks, changeTaskOwner } from '../../actions/affair'
import { pushURL } from 'actions/route'
import onClickOutside from 'react-onclickoutside'
import imageNoTask from 'images/img_no_task.png'

const { RangePicker } = DatePicker
const stateMap = {
  1: '未开始',
  2: '进行中',
  3: '已完成',
  4: '取消',
}
const EditMember = onClickOutside(React.createClass({
  getInitialState(){
    return {
    }
  },
  render(){
    return (<div className={styles.allMemberContainer}>
      <div className={styles.left}>
        {this.props.text.map((v, k) => {
          return v.avatar ? <img src={v.avatar} className={styles.avatar} key={`member${k}`}/> : <div className={styles.noAvatar} key={`member${k}`} />
        })}
        <Popover trigger="click" placement="bottom" content={
          <div className={styles.addMemberContainer} />
        }
        >
          <div className={styles.addIcon} onClick={(e) => {e.stopPropagation()}}>+</div>
        </Popover>
      </div>

    </div>)
  },
  handleClickOutside: function(){
    this.props.callback()
  },
}))
const TableViewContainer = React.createClass({
  propTypes: {
    isContainChildren: PropTypes.bool.isRequired,
  },
  getInitialState() {
    return {
      isAddingTask: false,
      isSearchingTaskByName: false,
      stateShowingPencil: -1,
      isEditingState: false,
      ownerShowingPencil: -1,
      isEditingOwner: false,
      isSearching: false,
      searchingResult: [],
      isShowingAllMember: -1,
      isEditingMember: false,
      addingTaskName: '',
      mainRoles: [],
      data: [],
      flexibleTableHeaders: fromJS([{
        title: '任务名称',
        visible: true,
        dataIndex: 'taskName'
      }, {
        title: '负责人',
        visible: true,
        dataIndex: 'taskOwner',
      }, {
        title: '任务状态',
        visible: true,
        dataIndex: 'taskState',
      }, {
        title: '起止时间',
        visible: true,
        dataIndex: 'time',
      }, {
        title: '参与者',
        visible: true,
        dataIndex: 'taskMember',
      }]),
      childrenData: fromJS([{
        name: '一级子事务 A',
        isCollapsed: true,
        data: [{
          tableId: 116,
          taskName: '文件部分交互确认',
          taskMember: _.range(3),
          taskState: '进行中',
          time: '2017-04-01--2017-04-05',
        }, {
          tableId: 117,
          taskName: 'superid任务模块开发',
          taskMember: _.range(3),
          taskState: '进行中',
          time: '2017-04-01--2017-04-05',
        }],
        children: [{
          name: '二级子事务 A',
          isCollapsed: false,
          data: [{
            tableId: 110,
            taskName: '文件部分交互确认',
            taskMember: _.range(3),
            taskState: '进行中',
            time: '2017-04-01--2017-04-05',
          }, {
            tableId: 111,
            taskName: 'superid任务模块开发',
            taskMember: _.range(3),
            taskState: '进行中',
            time: '2017-04-01--2017-04-05',
          }],
        }],
      }, {
        name: '一级子事务 B',
        isCollapsed: false,
        data: [{
          tableId: 118,
          taskName: '文件部分交互确认',
          taskMember: _.range(4),
          taskState: '进行中',
          time: '2017-04-01--2017-04-05',
        }, {
          tableId: 119,
          taskName: 'superid任务模块开发',
          taskMember: _.range(4),
          taskState: '进行中',
          time: '2017-04-01--2017-04-05',
        }],
        children: [],
      }]),
    }
  },
  componentWillMount(){
    const { affair } = this.props
    this.props.getAffairTasks(affair.get('id'), affair.get('roleId'))

    fetch(config.api.affair.role.main_roles(), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      this.setState({
        mainRoles: json.data,
      })
    })
  },

  componentDidMount(){
    const { affair } = this.props
    this._search = _.debounce((key) => {
      fetch(config.api.task.list(key), {
        method: 'GET',
        credentials: 'include',
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
      }).then((res) => res.json()).then((json) => {
        if (json.code == 0) {
          let data = json.data
          let list = []
          data.map((v, k) => {
            let tmp = {}
            tmp.taskName = v.name
            tmp.taskState = stateMap[v.stateId]
            tmp.taskMember = v.roles
            tmp.id = v.id
            tmp.tableId = k + 1
            tmp.key = `${k + 1}`
            list.push(tmp)
          })
          this.setState({
            isSearching: true,
            searchingResult: list,
          })
        }
      })
    }, 300)
  },
  componentDidUpdate(preProps, preState){
    if (!preState.isSearchingTaskByName && this.state.isSearchingTaskByName) {
      this.refs.searchName.refs.input.focus()
    }
    if (!preState.isAddingTask && !!this.state.isAddingTask) {
      this._newTaskNameInput.refs.input.focus()
    }
  },
  handleTaskNameOnchange(e) {
    this.setState({
      addingTaskName: e.target.value,
    })
  },
  handleHeaderCheckboxChange(index, e) {
    const checked = e.target.checked
    this.setState({
      flexibleTableHeaders: this.state.flexibleTableHeaders.update(index, (v) => v.set('visible', checked))
    })
  },
  handleAddTask() {
    let {
        addingTaskName
    } = this.state
    const { affair } = this.props

    if (!addingTaskName) {
      // TODO: 任务名称的限制
      message.error('任务名不能为空!', 1)
      return
    }

    fetch(config.api.task.create(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        name: addingTaskName,
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.setState({
          isAddingTask: false,
        })
        this.props.getAffairTasks(this.props.affair.get('id'), this.props.affair.get('roleId'))
        // this.props.pushURL(`/workspace/affair/${affair.get('id')}/task`)
      }
      else {
        message.error('添加任务失败')
      }
    })
  },
  handleEditTaskState(record, type){
    fetch(config.api.task.edit(record.id), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        stateId: type,
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.setState({
          isEditingState: false,
        })
        this.props.pushURL(`/workspace/affair/${this.props.affair.get('id')}/task`)
        message.success('修改成功', 1)
      }
      else {
        message.error('修改失败', 1)
      }
    })
  },

  handleSearchNameOnchange(e){
    if (e.target.value){
      this._search(e.target.value)
    }
    else {
      this.setState({ isSearching: false })
    }
  },

  handleChangeAdmin(record, role){
    const { affair } = this.props
    this.props.changeTaskOwner(affair, record.id, role).then(() => {
      this.setState({
        isEditingOwner: false,
      })
    })
  },

  handleClickTableRow(record) {
    this.props.pushURL(`/workspace/affair/${this.props.affair.get('id')}/task/${record.id}`)
  },

  handleRenderMember(text, record){
    const { isShowingAllMember, isEditingMember } = this.state
    const less = (<div className={styles.memberContainer}>
      {text.map((v, k) => {
        return v.avatar ? <img src={v.avatar} className={styles.avatar} key={`member${k}`}/> : <div className={styles.noAvatar} key={`member${k}`} />
      })
      }
    </div>)

    const more = isShowingAllMember != record.tableId ? (
      <div
        className={styles.memberContainer}
        onMouseEnter={() => {
          if (!this.state.isEditingMember){
            this.setState({ isShowingAllMember: record.tableId })
          }
        }}
      >
        {
          text.map((v, k) => {
            if (k < 5) {
              return v.avatar ? <img src={v.avatar} className={styles.avatar} key={`member${k}`}/> : <div className={styles.noAvatar} key={`member${k}`} />
            }
          })
        }
        <span>...</span>
      </div>
    ) : isEditingMember ? (
      <EditMember text={text} callback={() => {this.setState({ isEditingMember: false, isShowingAllMember: -1 })}}/>
    ) : (
      <div className={styles.allMemberContainer} onMouseLeave={() => {
        if (!this.state.isEditingMember){
          this.setState({ isShowingAllMember: -1 })
        }
      }}
      >
        <div className={styles.left}>
          {text.map((v, k) => {
            return v.avatar ? <img src={v.avatar} className={styles.avatar} key={`member${k}`}/> : <div className={styles.noAvatar} key={`member${k}`} />
          })}
        </div>
        <div className={styles.right}>
          <TableInfoEdit fill="#926dea" height="14" onClick={(e) => {
            e.stopPropagation()
            this.setState({ isEditingMember: true })
          }}
          />
        </div>
      </div>
    )
    return text.length > 5 ? more : less
  },

  renderFoot() {
    const {
        isAddingTask,
    } = this.state

    return isAddingTask ? (
      <div
        className={styles.addingFooter}
        style={isAddingTask ? { borderLeft: '3px solid #926dea' } : null}
      >
        <Input
          ref={(dom) => this._newTaskNameInput = dom}
          placeholder="输入任务标题"
          onChange={this.handleTaskNameOnchange}
        />
        <div>
          <Button
            type="ghost"
            style={{ marginRight: '10px' }}
            onClick={() => {
              this.setState({ isAddingTask: false })
            }}
          >取消</Button>
          <Button
            type="primary"
            onClick={this.handleAddTask}
          >确定</Button>
        </div>
      </div>
    ) : (
      <div className={styles.footer}>
        <div
          className={styles.cursor}
          onClick={() => {
            this.setState({ isAddingTask: true })
          }}
        >
          <span style={{ position: 'relative', top: '-1px' }}>+</span>
          <span>&nbsp;&nbsp;新建任务</span>
        </div>
      </div>
    )
  },

  renderChildren() {
    if (!this.props.isContainChildren) return null

    // 子事务中的任务
    let childList = List()

    function addChildren(list, data, path) {
      childList = childList.push(data.set('_path', path))
      data.get('children', List()).forEach((child, k) => childList = addChildren(childList, child, path.concat(List(['children', k]))))
      return childList
    }

    this.state.childrenData.forEach((childData, k) => childList = addChildren(childList, childData, List([k])))
    return childList.map((child, k) => (
      <div key={`child${k}`}>
        {this.renderChildItem(child)}
      </div>
    ))
  },

  renderChildItem(data) {
    const dataSource = data.get('data').toJS()
    const columns = this.renderColumns()
    const isCollapsed = data.get('isCollapsed')
    const level = (data.get('_path').size - 1) / 2

    return (
      <div className={styles.childTable}>
        <div className={styles.childTableHeader} style={isCollapsed ? { borderLeftColor: SLOGAN_BG_COLORS[level] } : { borderBottomWidth: 0, borderLeftColor: SLOGAN_BG_COLORS[level] }}>
          {
              isCollapsed ? (
                <Icon type="plus-square-o" onClick={() => this.setState({ childrenData: this.state.childrenData.updateIn(data.get('_path'), (v) => v.set('isCollapsed', false)) })}/>
              ) : (
                <Icon type="minus-square-o" onClick={() => this.setState({ childrenData: this.state.childrenData.updateIn(data.get('_path'), (v) => v.set('isCollapsed', true)) })}/>
              )
            }
          {data.get('name')}
        </div>
        {/*{*/}
        {/*isCollapsed ? null : (*/}
        <Table dataSource={dataSource} pagination={false} bordered showHeader={false} columns={columns} rowClassName={() => {
          return styles.tableRow
        }}
        />
        {/*)*/}
        {/*}*/}
      </div>
    )
  },

  renderColumns() {
    const { isSearchingTaskByName, flexibleTableHeaders, stateShowingPencil, mainRoles } = this.state
    const colorMap = {
      '未开始': '#ca90e7',
      '进行中': '#926dea',
      '已完成': '#55cce9',
      '取消': '#cccccc',
    }
    const idTitle = (
      <Popover
        trigger="click"
        placement="bottomLeft"
        content={
          <div className={styles.setupContent}>
            <div className={styles.title}>表格列配置</div>
            {
                  flexibleTableHeaders.map((v, k) => (
                    <div className={styles.setupRow} key={`header${k}`}>
                      <Checkbox
                        checked={v.get('visible')}
                        onChange={this.handleHeaderCheckboxChange.bind(this, k)}
                      />
                      <span>
                        {v.get('title')}
                      </span>
                    </div>
                  ))
                }
          </div>
            }
      >
        <Cog
          height="16"
          fill="#d9d9d9"
          style={{ position: 'relative', top: '2px' }}
        />
      </Popover>
    )

    const nameTitle = isSearchingTaskByName ? (
      <div className={styles.searching}>
        <Input placeholder="搜索名称" ref="searchName" onChange={this.handleSearchNameOnchange}/>
        <SearchIcon
          fill="#9b9b9b"
          height="14"
          onClick={() => {
            this.setState({ isSearchingTaskByName: false, isSearching: false })
          }}
        />
      </div>
    ) : (
      <div className={styles.taskNameDiv}>
        <span>任务名称</span>
        <SearchIcon
          fill="#9b9b9b"
          height="14"
          onClick={() => {
            this.setState({ isSearchingTaskByName: true })
          }}
        />
      </div>
    )

    let columns = [{
      title: idTitle,
      dataIndex: 'tableId',
      width: 48,
      className: styles.taskId,
      key: 'tableId',
    }, {
      title: nameTitle,
      dataIndex: 'taskName',
      className: styles.taskName,
      key: 'taskName'
    }, {
      title: '负责人',
      dataIndex: 'taskOwner',
      width: 87,
      className: styles.taskOwner,
      key: 'taskOwner',
      render: (text, record) => (
        <div
          className={styles.ownerContainer}
          onMouseEnter={() => {
            if (!this.state.isEditingOwner) {
              this.setState({
                ownerShowingPencil: record.tableId
              })
            }
          }}
          onMouseLeave={() => {
            if (!this.state.isEditingOwner) {
              this.setState({
                ownerShowingPencil: -1,
              })
            }
          }}
        >
          {
          record.taskMember.map((v, k) => {
            if (v.type == 0) {
              return (<Tooltip placement="bottom" title={`${v.roleTitle} ${v.username}`} key={`image${k}`}>
                { v.avatar ? <img className={styles.avatar} src={v.avatar}/> : <div className={styles.noavatar} />}
              </Tooltip>)
            }
          })
        }
          {this.state.ownerShowingPencil == record.tableId ?
            <Popover trigger="click" placement="bottom" visible={this.state.isEditingOwner}
              onVisibleChange={(visible) => {
                this.setState({ isEditingOwner: visible })
              }}
              content={
                <div className={styles.ownerContainer}>
                  <div className={styles.title}>
                  所有任务参与者
                  </div>
                  <div className={styles.content}>
                    {(() => {
                      let ownerId = 0
                      record.taskMember.map((v) => {
                        if (v.type == 0){
                          ownerId = v.roleId
                        }
                      })
                      return mainRoles.map((v, k) => {
                        if (v.roleId != ownerId){
                          return (<div className={styles.row} key={`mainRole${k}`} onClick={this.handleChangeAdmin.bind(null, record, v)}>
                            {v.avatar ? <img className={styles.avatar} src={v.avatar}/> : <div className={styles.noavatar} />}
                            <div style={{ marginRight: '8px' }} className={styles.roletitle}>{v.roleTitle}</div>
                            <div className={styles.username}>{v.username}</div>
                          </div>)
                        }
                      })
                    })()}
                  </div>
                </div>
              }
            >
              <TableInfoEdit
                fill="#926dea"
                height="14"
                onClick={(e) => {e.stopPropagation()}}
              />
            </Popover>
            : null}
        </div>)
      ,
    }, {
      title: '任务参与者',
      dataIndex: 'taskMember',
      width: 180,
      className: styles.taskMember,
      key: 'taskMember',
      render: (text, record, index) => this.handleRenderMember(text, record, index)
    }, {
      title: '任务状态',
      dataIndex: 'taskState',
      width: 118,
      className: styles.taskState,
      key: 'taskState',
      render: (text, record) => (
        <div
          className={styles.stateContainer}
          onMouseEnter={() => {
            if (!this.state.isEditingState)
              this.setState({ stateShowingPencil: record.tableId })
          }}
          onMouseLeave={() => {
            if (!this.state.isEditingState) {
              this.setState({ stateShowingPencil: -1 })
            }
          }}
        >
          <div className={styles.left}>
            <div
              className={styles.color}
              style={{ backgroundColor: colorMap[text] }}
            />
            {text}
          </div>

          {
              stateShowingPencil == record.tableId ? (
                <div className={styles.right}>
                  <Popover
                    trigger="click"
                    placement="bottomRight"
                    visible={this.state.isEditingState}
                    onVisibleChange={(visible) => {
                      this.setState({ isEditingState: visible })
                    }}
                    content={
                      <div className={styles.taskStateContent}>
                        <div className={styles.row} onClick={this.handleEditTaskState.bind(null, record, 1)}>
                          <div
                            className={styles.color}
                            style={{ backgroundColor: '#ca90e7' }}
                          />
                              未开始
                        </div>
                        <div className={styles.row} onClick={this.handleEditTaskState.bind(null, record, 2)}>
                          <div
                            className={styles.color}
                            style={{ backgroundColor: '#926dea' }}
                          />
                              进行中
                        </div>
                        <div className={styles.row} onClick={this.handleEditTaskState.bind(null, record, 3)}>
                          <div
                            className={styles.color}
                            style={{ backgroundColor: '#55cce9' }}
                          />
                              已完成
                        </div>
                        <div className={styles.row} onClick={this.handleEditTaskState.bind(null, record, 4)}>
                          <div
                            className={styles.color}
                            style={{ backgroundColor: '#cccccc' }}
                          />
                              取消
                        </div>
                      </div>
                        }
                  >
                    <TableInfoEdit
                      fill="#926dea"
                      height="14"
                      onClick={(e) => {e.stopPropagation()}}
                    />
                  </Popover>
                </div>
              ) : null
            }
        </div>
      )
    }, {
      title: '起止时间',
      dataIndex: 'time',
      width: 227,
      className: styles.taskTime,
      key: 'taskTime',
      render: () => <RangePicker format="yy/MM/dd HH:mm" showTime/>
    }]

    // 显示配置可见的列
    columns = columns.filter((column) => {
      if (flexibleTableHeaders.find((v) => v.get('dataIndex') === column.dataIndex && !v.get('visible'))) {
        return false
      } else {
        return true
      }
    })

    return columns
  },

  render() {
    const { tasklist } = this.props
    const { isSearching, searchingResult, isAddingTask } = this.state
    const columns = this.renderColumns()

    if (tasklist && tasklist.length === 0 && !isAddingTask) {
      return (
        <div className={styles.noTask}>
          <img src={imageNoTask} />
          <div style={{ marginBottom: 30 }}>暂无任务...</div>
          <Button type="primary" onClick={() => this.setState({ isAddingTask: true })}>新建任务</Button>
        </div>
      )
    }

    return (
      <div className={styles.tableViewContainer}>
        <Table
          onRowClick={this.handleClickTableRow}
          columns={columns}
          dataSource={isSearching ? searchingResult : tasklist}
          bordered
          pagination={false}
          footer={this.renderFoot}
          scroll={{ y: true }}
          rowClassName={() => {
            return styles.tableRow
          }}
        />
        {/*{this.renderChildren()}*/}
      </div>
    )
  }
})

function mapStateToProps(state, props){
  return {
    tasklist: state.getIn(['affair', 'affairTask', props.affair.get('id')]),
  }
}
function mapDispatchToProps(dispatch){
  return {
    getAffairTasks: bindActionCreators(getAffairTasks, dispatch),
    changeTaskOwner: bindActionCreators(changeTaskOwner, dispatch),
    pushURL: bindActionCreators(pushURL, dispatch),
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(TableViewContainer)
