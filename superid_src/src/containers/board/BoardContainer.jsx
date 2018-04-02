import React from 'react'
import styles from './BoardContainer.scss'
import {
  BoardIcon,
  SearchIcon,
  FilterIcon,
  DropUpIcon,
} from 'svg'
import {
  connect
} from 'react-redux'
import {
  bindActionCreators
} from 'redux'
import {
  Input,
  Button,
  Checkbox,
  Tag,
  notification,
  Modal,
  DatePicker,
} from 'antd'
import {
  getAffairInfo
} from '../../actions/affair'
import { pushURL } from 'actions/route'
import {
  fetchAffairPermission
} from '../../actions/auth'
import Map from 'underscore'
import {
  Motion,
  spring
} from 'react-motion'
import config from '../../config'
import BoardCard from './BoardCard'
import moment from 'moment'
import { List } from 'immutable'




const BoardContainer = React.createClass({
  getInitialState() {
    return {
      moveX: 0,
      moveY: 0,
      oringinX: 0,
      originY: 0,
      deltaX: 0,
      deltaY: 0,
      moveState: -1, //拖动的列位置
      movePos: -1, //拖动的行位置
      isPressed: false,
      mouseInWhich: -1, //拖入的列位置
      completedList: [],
      failedList: [],
      ongoingList: [],
      pendingList: [],
      showFilterPanel: false,
      showBoard: null,
      showTimeModal: false,
      delayTime: null,
      searchWord: '',
      typeFilter: List(),
      priorityFilter: List(),
      roleList: List(),
      roleFilter: List(),
      tagList: List(),
      tagFilter: List(),
      showTypeFilter: true,
      showPriorityFilter: true,
      showRoleFilter: true,
      showTagFilter: true,
    }
  },
  componentWillMount() {
    this.props.getAffairInfo(this.props.params.id, '').then((json) => {
      if (json.code === 0) {
        let roleList = List()
        let tagList = List()
        this.props.fetchAffairPermission(json.data.id, json.data.roleId)
        fetch(config.api.board.list, {
          method: 'GET',
          affairId: this.props.affair.get('id'),
          roleId: this.props.affair.get('roleId'),
        }).then((res) => res.json()).then((json) => {
          if (json.code == 0){
            json.data.completedList.map((o) => {
              o.joinOfficials.map((v) => {
                if (!roleList.find((r) => r.roleId == v.roleId)){
                  roleList = roleList.push(v)
                }
              })
              if (o.tags){
                JSON.parse(o.tags).map((v) => {
                  if (!tagList.find((r) => r == v)){
                    tagList = tagList.push(v)
                  }
                })
              }
            })
            json.data.failedList.map((o) => {
              o.joinOfficials.map((v) => {
                if (!roleList.find((r) => r.roleId == v.roleId)){
                  roleList = roleList.push(v)
                }
              })
              if (o.tags){
                JSON.parse(o.tags).map((v) => {
                  if (!tagList.find((r) => r == v)){
                    tagList = tagList.push(v)
                  }
                })
              }
            })
            json.data.ongoingList.map((o) => {
              o.joinOfficials.map((v) => {
                if (!roleList.find((r) => r.roleId == v.roleId)){
                  roleList = roleList.push(v)
                }
              })
              if (o.tags){
                JSON.parse(o.tags).map((v) => {
                  if (!tagList.find((r) => r == v)){
                    tagList = tagList.push(v)
                  }
                })
              }
            })
            json.data.pendingList.map((o) => {
              o.joinOfficials.map((v) => {
                if (!roleList.find((r) => r.roleId == v.roleId)){
                  roleList = roleList.push(v)
                }
              })
              if (o.tags){
                JSON.parse(o.tags).map((v) => {
                  if (!tagList.find((r) => r == v)){
                    tagList = tagList.push(v)
                  }
                })
              }
            })
            this.setState({
              completedList: json.data.completedList,
              failedList: json.data.failedList,
              ongoingList: json.data.ongoingList,
              pendingList: json.data.pendingList,
              roleList,
              tagList,
            })
          }
        })
      }
    })
  },
  componentDidMount() {
    window.addEventListener('mousemove', this.handleMouseMove)
    window.addEventListener('mouseup', this.handleMouseUp)
  },
  componentWillUnmount(){
    this.setState = (state, callback) => {
      return { state, callback }
    }
  },
  componentWillReceiveProps(nextProps) {
    if (nextProps.params.id != this.props.params.id) {
      this.props.getAffairInfo(nextProps.params.id, '').then((json) => {
        if (json.code === 0) {
          this.props.fetchAffairPermission(json.data.id, json.data.roleId)
        }
      })
    }
  },

  handleMouseDown(moveState, movePos, board, e) {
    e.currentTarget.style.opacity = 0.5
    let deltaX = e.pageX - this.refs.contentPanel.offsetLeft - e.currentTarget.offsetLeft
    let deltaY = e.pageY - this.refs.contentPanel.offsetTop - e.currentTarget.offsetTop
    let moveX = e.currentTarget.offsetLeft
    let moveY = e.currentTarget.offsetTop
    this.setState({
      moveX, //移动中的横坐标
      moveY,
      deltaX, //鼠标与边框的想对位置
      deltaY,
      originX: e.currentTarget.offsetLeft,
      originY: e.currentTarget.offsetTop,
      isPressed: true,
      moveState,
      movePos,
      showBoard: board
    })
  },
  handleMouseMove({
    pageX,
    pageY
  }) {
    let {
      isPressed,
      deltaX,
      deltaY,
    } = this.state
    if (isPressed) {
      let x = pageX - this.refs.contentPanel.offsetLeft - deltaX
      let y = pageY - this.refs.contentPanel.offsetTop - deltaY
      this.setState({
        moveX: x,
        moveY: y,
      })
      if (this.refs.col0.offsetLeft < (pageX - this.refs.contentPanel.offsetLeft) && (pageX - this.refs.contentPanel.offsetLeft) < (this.refs.col0.offsetLeft + this.refs.col0.clientWidth)) {
        this.setState({
          mouseInWhich: this.state.moveState == 0 ? -1 : 0,
        })
      } else if (this.refs.col1.offsetLeft < (pageX - this.refs.contentPanel.offsetLeft) && (pageX - this.refs.contentPanel.offsetLeft) < (this.refs.col1.offsetLeft + this.refs.col1.clientWidth) ) {
        this.setState({
          mouseInWhich: this.state.moveState == 1 ? -1 : 1,
        })
      } else if (this.refs.col2.offsetLeft < (pageX - this.refs.contentPanel.offsetLeft) && (pageX - this.refs.contentPanel.offsetLeft) < (this.refs.col2.offsetLeft + this.refs.col2.clientWidth) ) {
        this.setState({
          mouseInWhich: this.state.moveState == 2 ? -1 : 2,
        })
      } else if (this.refs.col3.offsetLeft < (pageX - this.refs.contentPanel.offsetLeft) && (pageX - this.refs.contentPanel.offsetLeft) < (this.refs.col3.offsetLeft + this.refs.col3.clientWidth) ) {
        this.setState({
          mouseInWhich: this.state.moveState == 3 ? -1 : 3,
        })
      }
    }
  },
  handleMouseUp() {
    let {
      isPressed
    } = this.state
    if (isPressed && (this.state.moveState != this.state.mouseInWhich) && (this.state.mouseInWhich != -1) && this.checkOperation(this.state.moveState, this.state.mouseInWhich)) {
      if (this.state.mouseInWhich == 0){
        this.setState({
          showTimeModal: true,
          isPressed: false,
          moveX: this.state.originX,
          moveY: this.state.originY,
          originX: 0,
          originY: 0,
          deltaX: 0,
          deltaY: 0,
        })
        return
      }
      fetch(config.api.board.modify_state(this.state.showBoard.id, this.state.mouseInWhich), {
        method: 'POST',
        credentials: 'include',
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
        userId: this.props.user.get('id'),
      }).then((res) => res.json()).then((json) => {
        if (json.code == 0){
          this.setState({
            showBoard: json.data,
          })
          notification.success({
            message: '发布状态修改成功'
          })
          this.handleChangeList(this.state.moveState, this.state.movePos, this.state.mouseInWhich)
        }
        else {
          notification.error({
            message: '网络错误'
          })
        }
        this.setState({
          isPressed: false,
          moveX: this.state.originX,
          moveY: this.state.originY,
          originX: 0,
          originY: 0,
          deltaX: 0,
          deltaY: 0,
          moveState: -1,
          movePos: -1,
          mouseInWhich: -1,
          showBoard: null,
        })
      })
    }
    else {
      this.setState({
        isPressed: false,
        moveX: this.state.originX,
        moveY: this.state.originY,
        originX: 0,
        originY: 0,
        deltaX: 0,
        deltaY: 0,
        moveState: -1,
        movePos: -1,
        mouseInWhich: -1,
        showBoard: null,
      })
    }

  },

  handleChangeList(moveState, movePos, mouseInWhich) {
    let {
      pendingList,
      ongoingList,
      completedList,
      failedList,
    } = this.state
    let new1, new2, new3, new4
    new1 = new2 = new3 = new4 = []
    if (moveState == 0) {
      pendingList.map((v, k) => {
        if (k != movePos)
          new1.push(v)
      })
      this.setState({
        pendingList: new1
      })
    } else if (moveState == 1) {
      ongoingList.map((v, k) => {
        if (k != movePos)
          new2.push(v)
      })
      this.setState({
        ongoingList: new2
      })
    } else if (moveState == 2) {
      completedList.map((v, k) => {
        if (k != movePos)
          new3.push(v)
      })
      this.setState({
        completedList: new3
      })
    } else if (moveState == 3) {
      failedList.map((v, k) => {
        if (k != movePos)
          new4.push(v)
      })
      this.setState({
        failedList: new4
      })
    }
    if (mouseInWhich == 0) {
      pendingList.unshift(this.state.showBoard)
      this.setState({
        pendingList
      })
    } else if (mouseInWhich == 1) {
      ongoingList.unshift(this.state.showBoard)
      this.setState({
        ongoingList
      })

    } else if (mouseInWhich == 2) {
      completedList.unshift(this.state.showBoard)
      this.setState({
        completedList
      })

    } else if (mouseInWhich == 3) {
      failedList.unshift(this.state.showBoard)
      this.setState({
        failedList,
      })
    }
  },

  checkOperation(before, after){
    //穷举大法
    if (before == 0 && this.state.showBoard.isDraft == 1 && after == 1){
      return true
    }
    if (before == 0 && this.state.showBoard.isDraft == 0 && (after == 1 || after == 3)){
      return true
    }
    if (before == 1 && (after == 0 || after == 2 || after == 3)){
      return true
    }
    if (before == 2 && (after == 1 || after == 3)){
      return true
    }
    if (before == 3 && ((after == 0 && this.state.showBoard.isDraft == 0) || after == 1)){
      return true
    }
    else return false
  },
  handleDelayDateChange(v){
    this.setState({
      delayTime: v,
    })
  },
  handleCancelTime(){
    this.setState({
      showTimeModal: false,
      delayTime: null,
      mouseInWhich: -1,
      moveState: -1,
      movePos: -1,
      showBoard: null,
    })
  },
  handleOkTime(){
    fetch(config.api.board.modify_state(this.state.showBoard.id, this.state.mouseInWhich, this.state.delayTime.valueOf()), {
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      userId: this.props.user.get('id'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.setState({
          showBoard: json.data,
        })
        this.handleChangeList(this.state.moveState, this.state.movePos, this.state.mouseInWhich)
        notification.success({
          message: '发布状态修改成功'
        })
      }
      else {
        notification.error({
          message: '网络错误'
        })
      }
      this.setState({
        mouseInWhich: -1,
        moveState: -1,
        movePos: -1,
        showBoard: null,
        showTimeModal: false,
        delayTime: null,

      })
    })
  },
  handleChangeTypeFilter(type, e){
    let { typeFilter } = this.state
    if (e.target.checked){
      typeFilter = typeFilter.push(type)
    }
    else if (!e.target.checked){
      typeFilter = typeFilter.filter((v) => {return v != type})
    }
    this.setState({
      typeFilter
    })
  },
  handleChangePriorityFilter(type, e){
    let { priorityFilter } = this.state
    if (e.target.checked){
      priorityFilter = priorityFilter.push(type)
    }
    else if (!e.target.checked){
      priorityFilter = priorityFilter.filter((v) => {return v != type})
    }
    this.setState({
      priorityFilter
    })
  },
  handleChangeRoleFilter(role, e){
    let { roleFilter } = this.state
    if (e.target.checked){
      roleFilter = roleFilter.push(role)
    }
    else if (!e.target.checked){
      roleFilter = roleFilter.filter((v) => {return v.roleId != role.roleId})
    }
    this.setState({
      roleFilter,
    })
  },
  handleChangeTagFilter(tag){
    let { tagFilter } = this.state
    if (tagFilter.includes(tag)){
      tagFilter = tagFilter.filter((v) => v != tag)
    }
    else {
      tagFilter = tagFilter.push(tag)
    }
    this.setState({
      tagFilter
    })
  },
  allFilter(oldList){
    let { typeFilter, priorityFilter, roleFilter, tagFilter } = this.state
    if (typeFilter.size != 0){
      oldList = oldList.filter((v) => typeFilter.includes(v.plateType))
    }
    if (priorityFilter.size != 0){
      oldList = oldList.filter((v) => priorityFilter.includes(v.priority))
    }
    if (roleFilter.size != 0){
      oldList = oldList.filter((v) => {
        let tag = false
        v.joinOfficials.map((j) => {
          roleFilter.map((k) => {
            if (j.roleId == k.roleId){
              tag = true
            }
          })
        })
        return tag
      })
    }
    if (tagFilter.size != 0){
      oldList = oldList.filter((v) => {
        let tag = false
        if (v.tags){
          JSON.parse(v.tags).map((j) => {
            tagFilter.map((k) => {
              if (j == k){
                tag = true
              }
            })
          })
        }
        return tag
      })
    }
    return oldList
  },
  renderFilterPanel(){
    let { typeFilter, priorityFilter, roleList, roleFilter, tagList, tagFilter } = this.state
    return <Motion style={{ right: spring(this.state.showFilterPanel ? 0 : -268) }}>
      {(style) =>
        <div className={styles.filterPanel} style={{ right: `${style.right}px` }}>
          <div className={styles.title}>
            <span className={styles.text}>筛选</span>
          </div>

          <div className={styles.typeFilter}>
            <div className={styles.subTitle}>
              <span className={styles.text}>发布类型筛选</span>
              <div className={styles.right}>
                {typeFilter.size != 0 && <span className={styles.clearAll} onClick={() => {this.setState({ typeFilter: List() })}}>清除</span>}
                <DropUpIcon height="16" fill="#cccccc" onClick={() => {this.setState({ showTypeFilter: !this.state.showTypeFilter })}} style={this.state.showTypeFilter ? {} : { transform: 'rotate(180deg)' }}/>
              </div>
            </div>
            {
              this.state.showTypeFilter && <div className={styles.checkbox}>
                <Checkbox onChange={this.handleChangeTypeFilter.bind(null, 0)} checked={typeFilter.includes(0)}>发布</Checkbox>
                <Checkbox onChange={this.handleChangeTypeFilter.bind(null, 1)} checked={typeFilter.includes(1)}>BUG</Checkbox>
                <Checkbox onChange={this.handleChangeTypeFilter.bind(null, 2)} checked={typeFilter.includes(2)}>需求</Checkbox>
              </div>
            }

          </div>

          <div className={styles.typeFilter} style={{ marginTop: '10px' }}>
            <div className={styles.subTitle}>
              <span className={styles.text}>优先级筛选</span>
              <div className={styles.right}>
                {priorityFilter.size != 0 && <span className={styles.clearAll} onClick={() => {this.setState({ priorityFilter: List() })}}>清除</span>}
                <DropUpIcon height="16" fill="#cccccc" onClick={() => {this.setState({ showPriorityFilter: !this.state.showPriorityFilter })}} style={this.state.showPriorityFilter ? {} : { transform: 'rotate(180deg)' }}/>
              </div>
            </div>
            {
              this.state.showPriorityFilter && <div className={styles.checkbox}>
                <Checkbox onChange={this.handleChangePriorityFilter.bind(null, 0)} checked={priorityFilter.includes(0)}>高</Checkbox>
                <Checkbox onChange={this.handleChangePriorityFilter.bind(null, 1)} checked={priorityFilter.includes(1)}>中</Checkbox>
                <Checkbox onChange={this.handleChangePriorityFilter.bind(null, 2)} checked={priorityFilter.includes(2)}>低</Checkbox>
              </div>
            }
          </div>
          <div className={styles.typeFilter} style={{ marginTop: '15px' }}>
            <div className={styles.subTitle}>
              <span className={styles.text}>角色筛选</span>
              <div className={styles.right}>
                {roleFilter.size != 0 && <span className={styles.clearAll} onClick={() => {this.setState({ roleFilter: List() })}}>清除</span>}
                <DropUpIcon height="16" fill="#cccccc" onClick={() => {this.setState({ showRoleFilter: !this.state.showRoleFilter })}} style={this.state.showRoleFilter ? {} : { transform: 'rotate(180deg)' }}/>
              </div>
            </div>
            {
              this.state.showRoleFilter && <div className={styles.checkbox}>
                {
                  roleList.map((v, k) => {
                    return <Checkbox key={k} onChange={this.handleChangeRoleFilter.bind(null, v)} checked={!!roleFilter.find((r) => r.roleId == v.roleId)}>
                      <div className={styles.info}>
                        {
                          v.avatar ?
                            <img src={v.avatar} className={styles.avatar}/>
                            : <div className={styles.avatar} style={{ backgroundColor: '#e6e6e6' }} />
                        }
                        <span className={styles.roleName}>{v.roleTitle}</span>
                        <span className={styles.userName}>{v.username}</span>
                      </div>
                    </Checkbox>
                  })
                }
              </div>
            }
          </div>

          <div className={styles.typeFilter} style={{ marginTop: '15px' }}>
            <div className={styles.subTitle}>
              <span className={styles.text}>标签</span>
              <div className={styles.right}>
                {tagFilter.size != 0 && <span className={styles.clearAll} onClick={() => {this.setState({ tagFilter: List() })}}>清除</span>}
                <DropUpIcon height="16" fill="#cccccc" onClick={() => {this.setState({ showTagFilter: !this.state.showTagFilter })}} style={this.state.showTagFilter ? {} : { transform: 'rotate(180deg)' }}/>
              </div>
            </div>
            {
              this.state.showTagFilter && <div className={styles.tags}>
                {
                  tagList.map((v, k) => {
                    return <Tag key={k} onClick={this.handleChangeTagFilter.bind(null, v)} className={tagFilter.includes(v) ? styles.chosen : null}>{v}</Tag>
                  })
                }
              </div>
            }
          </div>
        </div>
      }
    </Motion>
  },
  renderTimeModal(){
    return <Modal
      width={500}
      wrapClassName={styles.delayPublishModal}
      footer={this.renderDelayFooter()}
      title="设置延迟时间"
      closable={false}
      visible
           >
      <div className={styles.delayPublishContent}>
        <DatePicker
          placeholder="设定延时时间"
          style={{ width: 300 }}
          showTime
          format="YYYY-MM-DD HH:mm"
          value={this.state.delayTime}
          onChange={this.handleDelayDateChange}
          disabledDate={(current) => {
            return current && current.valueOf() < moment().startOf('day')
          }}
        />
      </div>
    </Modal>
  },
  renderDelayFooter() {
    return (
      <div className={styles.footer}>
        <Button type="ghost" style={{ marginLeft: 'auto' }} onClick={this.handleCancelTime}>取消</Button>
        <Button type="primary" onClick={this.handleOkTime}>确定</Button>
      </div>
    )
  },
  render() {
    let {
      moveState,
      movePos,
      mouseInWhich,
      pendingList,
      ongoingList,
      completedList,
      failedList,
      searchWord,
    } = this.state
    pendingList = this.allFilter(pendingList).filter((v) => v.title.indexOf(searchWord) >= 0)
    ongoingList = this.allFilter(ongoingList).filter((v) => v.title.indexOf(searchWord) >= 0)
    completedList = this.allFilter(completedList).filter((v) => v.title.indexOf(searchWord) >= 0)
    failedList = this.allFilter(failedList).filter((v) => v.title.indexOf(searchWord) >= 0)


    const {
      affair,
      user
    } = this.props
    let role = Map()
    if (affair && user) {
      user.get('roles').map((v) => {
        if (v.get('roleId') == affair.get('roleId')) {
          role = v
        }
      })
    }

    return (affair && user) ? <div className={styles.boardContainer}>
      <div className={styles.header}>
        <div className={styles.left}>
          <BoardIcon style={{ marginRight: '13px' }}/>
          <span className={styles.text}>{affair.get('name')}的看板</span>
        </div>
        <div className={styles.right}>
          {
            role.get('logoUrl') ? <img src={role.get('logoUrl')} className={styles.avatar}/> : <div className={styles.avatar} style={{ backgroundColor: '#e6e6e6' }}/>
          }
          <span className={styles.roleTitle}>{role.get('roleName')}</span>
          <span className={styles.userName}>{user.get('username')}</span>
          <Button type="ghost" size="large" onClick={() => {
            this.props.pushURL(`/workspace/affair/${this.props.params.id}`)
          }}
          >退出</Button>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.search}>
          <div className={styles.searchInput}>
            <Input placeholder="搜索发布名称" onChange={(e) => {this.setState({ searchWord: e.target.value })}} value={this.state.searchWord}/>
            <SearchIcon height="16" width="16" fill="#cccccc"/>
          </div>
          <div className={styles.right} onClick={() => {this.setState({ showFilterPanel: !this.state.showFilterPanel })}}>
            <FilterIcon style={{
              marginRight: '6px',
              backgroundColor: this.state.showFilterPanel ? '#faf8fe' : '#fafafa',
              borderColor: this.state.showFilterPanel ? '#b499dc' : '#d9d9d9'
            }} fill={this.state.showFilterPanel ? '#926dea' : '#cccccc'}
            />
            <span className={styles.text} style={{ color: this.state.showFilterPanel ? '#926dea' : '' }}>筛选</span>
          </div>
        </div>
        <div className={styles.mainPanel} ref="contentPanel">
          <div className={styles.headerPanel}>
            {
              mouseInWhich == 0 && this.checkOperation(moveState, mouseInWhich) ? <div className={styles.emptyPanel}>
                <div className={styles.borderDiv}>
                  <span className={styles.title}>未发布&nbsp;({pendingList.length})</span>
                </div>
              </div>
                :
              <div className={styles.classPanel}>
                <span className={styles.title}>未发布&nbsp;({pendingList.length})</span>
              </div>
            }
            {
              mouseInWhich == 1 && this.checkOperation(moveState, mouseInWhich) ? <div className={styles.emptyPanel}>
                <div className={styles.borderDiv}>
                  <span className={styles.title}>进行中&nbsp;({ongoingList.length})</span>
                </div>
              </div>
                :
              <div className={styles.classPanel}>
                <span className={styles.title}>进行中&nbsp;({ongoingList.length})</span>
              </div>
            }
            {
              mouseInWhich == 2 && this.checkOperation(moveState, mouseInWhich) ? <div className={styles.emptyPanel}>
                <div className={styles.borderDiv}>
                  <span className={styles.title}>已完成&nbsp;({completedList.length})</span>
                </div>
              </div>
                :
              <div className={styles.classPanel}>
                <span className={styles.title}>已完成&nbsp;({completedList.length})</span>
              </div>
            }
            {
              mouseInWhich == 3 && this.checkOperation(moveState, mouseInWhich) ? <div className={styles.emptyPanel}>
                <div className={styles.borderDiv}>
                  <span className={styles.title}>已失效&nbsp;({failedList.length})</span>
                </div>
              </div>
                :
              <div className={styles.classPanel}>
                <span className={styles.title}>已失效&nbsp;({failedList.length})</span>
              </div>
            }
          </div>
          <div className={styles.overflow} >
            <div className={styles.contentPanel}>
              {
                mouseInWhich == 0 && this.checkOperation(moveState, mouseInWhich) ? <div className={styles.emptyPanel} ref="col0">
                  <div className={styles.borderDiv}/>
                </div>
                  :
                <div className={styles.classPanel} ref="col0">
                  {
                      pendingList.length == 0 ? null : pendingList.map((v, k) => {
                        return <div className={styles.boardCard} key={k} onMouseDown={this.handleMouseDown.bind(null, 0, k, v)} style={{ opacity: (moveState == 0 && movePos == k) ? 0.5 : 1 }}>
                          <BoardCard content={v}/>
                        </div>
                      })
                    }
                </div>
              }
              {
                mouseInWhich == 1 && this.checkOperation(moveState, mouseInWhich) ? <div className={styles.emptyPanel} ref="col1">
                  <div className={styles.borderDiv}/>
                </div>
                  :
                <div className={styles.classPanel} ref="col1">
                  {
                      ongoingList.length == 0 ? null : ongoingList.map((v, k) => {
                        return <div className={styles.boardCard} key={k} onMouseDown={this.handleMouseDown.bind(null, 1, k, v)} style={{ opacity: (moveState == 1 && movePos == k) ? 0.5 : 1 }}>
                          <BoardCard content={v}/>
                        </div>
                      })
                    }
                </div>
              }
              {
                mouseInWhich == 2 && this.checkOperation(moveState, mouseInWhich) ? <div className={styles.emptyPanel} ref="col2">
                  <div className={styles.borderDiv}/>
                </div>
                  :
                <div className={styles.classPanel} ref="col2">
                  {
                      completedList.length == 0 ? null : completedList.map((v, k) => {
                        return <div className={styles.boardCard} key={k} onMouseDown={this.handleMouseDown.bind(null, 2, k, v)} style={{ opacity: (moveState == 2 && movePos == k) ? 0.5 : 1 }}>
                          <BoardCard content={v}/>
                        </div>
                      })
                    }
                </div>
              }
              {
                mouseInWhich == 3 && this.checkOperation(moveState, mouseInWhich) ? <div className={styles.emptyPanel} ref="col3">
                  <div className={styles.borderDiv}/>
                </div>
                  :
                <div className={styles.classPanel} ref="col3">
                  {
                      failedList.length == 0 ? null : failedList.map((v, k) => {
                        return <div className={styles.boardCard} key={k} onMouseDown={this.handleMouseDown.bind(null, 3, k, v)} style={{ opacity: (moveState == 3 && movePos == k) ? 0.5 : 1 }}>
                          <BoardCard content={v} />
                        </div>
                      })
                    }
                </div>
              }
            </div>

            {
              this.state.showBoard && <div className={styles.move} style={{ backgroundColor: 'white', left: this.state.moveX, top: this.state.moveY, zIndex: 5, boxShadow: 'rgba(0,0,0,0.2) 0px 16px 32px 0px', borderRadius: '3px' }}>
                <BoardCard content={this.state.showBoard}/>
              </div>
            }
          </div>
          {
              this.renderFilterPanel()
          }
          {
            this.state.showTimeModal && this.renderTimeModal()
          }
        </div>
      </div>
    </div> :
      null
  },
})

function mapStateToProps(state, props) {
  return {
    user: state.get('user'),
    affair: state.getIn(['affair', 'affairMap', props.params.id])
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getAffairInfo: bindActionCreators(getAffairInfo, dispatch),
    fetchAffairPermission: bindActionCreators(fetchAffairPermission, dispatch),
    pushURL: bindActionCreators(pushURL, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(BoardContainer)
