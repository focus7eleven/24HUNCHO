import React from 'react'
import { connect } from 'react-redux'
import { List, Set } from 'immutable'
import { bindActionCreators } from 'redux'
import { Tooltip, Icon, Button } from 'antd'
import { DragDropContext, DragSource, DropTarget } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import { TableInfoEdit, DeleteIcon, Dehaze, DropDownIcon, DropUpIcon, MenkorIcon } from 'svg'
import styles from './AffairDisplayTree.scss'
import { fetchAffairTree, fetchAllAffairInAlliance, terminateAffair, fetchAffairList, requestMoveAffair } from '../../actions/affair'
import { pushPermittedURL } from 'actions/route'
import CreateAffair from './CreateAffair'
import classNames from 'classnames'


const affairSource = {
  beginDrag(props) {
    return {
      affair: props.affair,
    }
  },
  canDrag(props) {
    return props.isEditing && props.isHoveringDehaze
  }
}

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging(),
  }
}

let DraggableAffair = React.createClass({
  contextTypes: {
    router: React.PropTypes.object,
  },
  propTypes: {
    activeAffairId: React.PropTypes.string,
    isHoveringDehaze: React.PropTypes.bool,
  },

  componentWillReceiveProps(nextProps) {
    if (!this.props.isOver && nextProps.isOver && !this.props.isOpened) {
      nextProps.onClick()
    }
  },

  render() {
    const {
      isOpened,
      isHovered,
      affair,
      handleCreateAffair,
      children,
      isEditing, // eslint-disable-line
      connectDragSource,
      connectDragPreview, // eslint-disable-line
      isLastOne, // eslint-disable-line
      isDragging,
      handleDisableAffair,
      connectDropTarget,
      isOver,
      canDrop,
      requestMoveAffair, // eslint-disable-line
      onClick,
      activeAffairId,
      onMouseLeaveDehaze,
      onMouseEnterDehaze,
      isHoveringDehaze,
      ...otherProps
    } = this.props

    const itemClassName = classNames(
      styles.affairItem,
      isHovered && !isDragging ? styles.hoverAffairItem : null,
      isOver && canDrop ? styles.dropAffairItem : null
    )

    const buttonGroup = isHovered ? (
      <div className={styles.affairItemButtonGroup}>
        <Tooltip placement="top" title="失效子事务">
          <DeleteIcon fill="#f55b6c" onClick={handleDisableAffair} />
        </Tooltip>
        <Tooltip placement="top" title="创建子事务">
          <Icon type="plus-circle" onClick={handleCreateAffair}/>
        </Tooltip>
        <Dehaze
          fill="#666"
          onMouseLeave={onMouseLeaveDehaze}
          onMouseEnter={onMouseEnterDehaze}
          style={isHoveringDehaze ? { cursor: isDragging ? 'grabbing' : 'grab' } : {}}
        />
      </div>
    ) : null

    return connectDropTarget(connectDragSource(
      <div
        className={styles.affair}
        style={{
          backgroundColor: isDragging ? '#F9F9F9' : 'rgba(0, 0, 0, 0)',
          border: isDragging ? '1px dashed #d9d9d9' : '1px dashed rgba(0, 0, 0, 0)',
          opacity: isDragging ? 0.5 : 1,
          borderRadius: 2,
        }}
      >
        <div className={itemClassName} {...otherProps}>
          {affair.get('children').size ? <Icon onClick={onClick} type={isOpened ? 'minus-square-o' : 'plus-square-o'} /> : <div className={styles.noChild} />}
          <p
            style={{ color: activeAffairId == affair.get('id') ? '#926dea' : affair.get('state') === 1 ? '#b9b9b9' : '#666', cursor: 'pointer' }}
            onClick={() => this.props.pushPermittedURL(affair.get('id'), 0, `/workspace/affair/${affair.get('id')}`)}
          >{affair.get('name')}{affair.get('state') == 1 && '（已失效）'}</p>
          {buttonGroup}
        </div>
        <div className={styles.affairContent} style={{ borderLeftColor: !isDragging ? '#e9e9e9' : 'rgba(0, 0, 0, 0)' }}>
          {children}
        </div>
      </div>
    ))
  }
})
DraggableAffair = DragSource('DraggableAffair', affairSource, collect)(DraggableAffair)

// 当事务作为 DropTarget ，被移动事务作为它的子事务存在。
DraggableAffair = DropTarget('DraggableAffair', {
  canDrop(props, monitor) {
    const item = monitor.getItem()
    const draggedAffair = item.affair
    const affair = props.affair

    return draggedAffair.get('id') !== affair.get('id')
  },

  drop(props, monitor) {
    const item = monitor.getItem()
    const draggedAffair = item.affair
    const affair = props.affair
    const isOver = monitor.isOver({
      shallow: true
    })

    isOver && props.requestMoveAffair(draggedAffair, affair).then((json) => {
      if (json.code == 0) {
        props.fetchAffairList()
      }
    })
  }
}, function(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver({
      shallow: true
    }),
    canDrop: monitor.canDrop(),
  }
})(DraggableAffair)


const insertTarget = {
  canDrop(props, monitor) {
    const item = monitor.getItem()
    const draggedAffair = item.affair
    const affair = props.affair

    return draggedAffair.get('_path').pop().pop().join(',') !== affair.get('_path').join(',')
  },

  drop(props, monitor) {
    const item = monitor.getItem()
    const draggedAffair = item.affair
    const affair = props.affair
    const isOver = monitor.isOver({
      shallow: true
    })

    isOver && props.requestMoveAffair(draggedAffair, affair)
  },
}

let InsertAffairTarget = React.createClass({
  render() {
    const {
      connectDropTarget,
      canDrop,
      isOver,
      onMouseEnter,
      onMouseLeave,
      onClick
    } = this.props

    return connectDropTarget(
      <div className={styles.insertBar} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
        {isOver && canDrop ? <div className={styles.circle} /> : null}
        {isOver && canDrop ? <div className={styles.circleLine} /> : null}
      </div>
    )
  }
})

InsertAffairTarget = DropTarget('DraggableAffair', insertTarget, function(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver({
      shallow: true
    }),
    canDrop: monitor.canDrop(),
  }
})(InsertAffairTarget)

let AffairDisplayTree = React.createClass({
  propTypes: {
    activeAffairId: React.PropTypes.string,
  },
  contextTypes: {
    router: React.PropTypes.object
  },
  getInitialState() {
    return {
      openedAffairId: Set(),
      fetchedAllianceTree: Set(), // 完整获取过的盟结构
      currentHoverAffairId: null,
      affairToAdd: null, // 正在为该事务创建子事务
      isHoveringDehaze: false,
    }
  },
  componentWillMount(){
    // 更新事务树，初始化当前展开的事务
    this.props.fetchAffairTree()
      .then((affairList) => affairList ? List(affairList).map((v) => v.id) : List())
      .then((displayedAffairs) => {
        let openedAffairId = this.state.openedAffairId
        displayedAffairs.forEach((affairId) => {
          openedAffairId = openedAffairId.add(affairId)
        })
        this.setState({
          openedAffairId,
        })
      })
  },
  handleToggleOpenAffair(affair, evt) {
    evt && evt.stopPropagation()

    const id = affair.get('id')
    !this.state.fetchedAllianceTree.has(affair.get('allianceId')) ? this.props.fetchAllAffairInAlliance(affair.get('allianceId')) : null

    this.setState({
      openedAffairId: this.state.openedAffairId.has(id) ? this.state.openedAffairId.delete(id) : this.state.openedAffairId.add(id),
      fetchedAllianceTree: this.state.fetchedAllianceTree.add(affair.get('allianceId')),
    })
  },
  handleToggleOpenAlliance(alliance, evt) {
    evt.stopPropagation()
    evt.preventDefault()

    this.handleToggleOpenAffair(alliance, evt)
  },
  handleEditAlliance(alliance, evt) {
    evt.stopPropagation()
    !this.state.openedAffairId.has(alliance.get('id')) ? this.props.fetchAllAffairInAlliance(alliance.get('allianceId')) : null

    this.setState({
      editingAlliance: alliance.get('id'),
      openedAffairId: this.state.openedAffairId.add(alliance.get('id')),
    })
  },
  handleCancelEditAlliance() {
    this.setState({
      editingAlliance: null,
    })
  },
  handleCreateAffair(affair, evt) {
    evt.stopPropagation()
    this.setState({
      affairToAdd: affair,
    })
  },
  handleDisableAffair(affair, evt) {
    evt.stopPropagation()
    this.props.terminateAffair(affair, this.props.affair.get('roleId'))
  },
  renderAffairChildren(affairList, parentAffair) {
    return (
      affairList.map((affair, index) => {
        const isOpened = this.state.openedAffairId.has(affair.get('id'))
        const isHovered = this.state.currentHoverAffairId === affair.get('id')
        const isLastOne = index === affairList.size - 1
        const affairItemProps = this.state.editingAlliance ? {
          onMouseEnter: () => this.setState({ currentHoverAffairId: affair.get('id') }),
          onMouseLeave: () => this.setState({ currentHoverAffairId: null }),
          onClick: this.handleToggleOpenAffair.bind(this, affair),
        } : {
          onClick: this.handleToggleOpenAffair.bind(this, affair),
        }

        return (
          <DraggableAffair
            affair={affair}
            activeAffairId={this.props.activeAffairId}
            isEditing={!!this.state.editingAlliance}
            isOpened={isOpened}
            isHovered={isHovered}
            isLastOne={isLastOne}
            key={affair.get('id')}
            requestMoveAffair={this.props.requestMoveAffair}
            fetchAffairList={this.props.fetchAffairList}
            handleCreateAffair={this.handleCreateAffair.bind(this, affair)}
            handleDisableAffair={this.handleDisableAffair.bind(this, affair)}
            onMouseLeaveDehaze={() => this.setState({ isHoveringDehaze: false })}
            onMouseEnterDehaze={() => this.setState({ isHoveringDehaze: true })}
            isHoveringDehaze={this.state.isHoveringDehaze}
            pushPermittedURL={this.props.pushPermittedURL}
            {...affairItemProps}
          >
            <InsertAffairTarget
              affair={parentAffair}
              requestMoveAffair={this.props.requestMoveAffair}
              pushPermittedURL={this.props.pushPermittedURL}
              {...affairItemProps}
            />
            {isOpened && affair.get('children').size ? this.renderAffairChildren(affair.get('children'), affair) : <div style={{ height: !isLastOne ? 10 : 0 }} />}
          </DraggableAffair>
        )
      })
    )
  },
  renderAlliance(alliance, forceOpen = false) {
    const allianceIsOpen = this.state.openedAffairId.has(alliance.get('id')) || forceOpen
    const allianceContent = allianceIsOpen && alliance.get('children').size ? (
      <div className={styles.allianceContent}>
        {this.renderAffairChildren(alliance.get('children'), alliance)}
      </div>
    ) : null
    const editIcon = !this.state.editingAlliance ? (
      <Tooltip placement="bottom" title="编辑模式">
        <span className={styles.editIcon} onClick={this.handleEditAlliance.bind(this, alliance)}>
          <TableInfoEdit />
        </span>
      </Tooltip>
    ) : (
      <Tooltip placement="top" title="创建子事务">
        <Icon type="plus-circle" style={{ color: '#66b966' }} onClick={this.handleCreateAffair.bind(this, alliance)}/>
      </Tooltip>
    )
    let dropDownIcon = allianceIsOpen ? (
      <DropDownIcon />
    ) : (
      <DropUpIcon />
    )
    dropDownIcon = !forceOpen ? (
      <span className={styles.allianceDrop} onClick={this.handleToggleOpenAlliance.bind(this, alliance)}>
        {dropDownIcon}
      </span>
    ) : null

    return (
      <div key={alliance.get('id')} className={styles.alliance}>
        {/* 盟的操作区域 */}
        <div className={styles.allianceItem} >
          <div className={styles.allianceAvatar}>
            {alliance.get('avatar') ? <img src={alliance.get('avatar')} /> : <MenkorIcon />}
          </div>
          <p
            style={{ color: this.props.activeAffairId == alliance.get('id') ? '#926dea' : alliance.get('state') == 0 ? '#666' : '#b9b9b9', cursor: 'pointer' }}
            onClick={() => this.props.pushPermittedURL(alliance.get('id'), 0, `/workspace/affair/${alliance.get('id')}`)}
          >{alliance.get('name')}{alliance.get('state') == 1 && '（已失效）'}</p>
          {editIcon}

          {/* 关闭和收起盟树 */}
          {dropDownIcon}
        </div>

        {/* 盟所包含事务区域 */}
        {allianceContent}
      </div>
    )
  },
  renderEditingPanel() {
    const alliance = this.props.affairTree.find((v) => v.get('id') === this.state.editingAlliance)

    return (
      <div className={styles.editingPanel}>
        {this.renderAlliance(alliance, true)}

        <div className={styles.editingPanelFooter}>
          <Button type="primary" onClick={this.handleCancelEditAlliance}>完成编辑</Button>
        </div>
      </div>
    )
  },
  render() {
    let content = null
    if (this.state.editingAlliance) {
      content = this.renderEditingPanel()
    } else {
      content = this.props.affairTree.map((alliance) => this.renderAlliance(alliance))
    }

    return (
      <div>
        {content}
        {
          this.state.affairToAdd ? (
            <CreateAffair
              parentAffair={this.state.affairToAdd}
              visible={!!this.state.affairToAdd}
              onCloseModal={() => this.setState({ affairToAdd: null })}
            />
          ) : (
            null
          )
        }
      </div>
    )
  }
})

function mapStateToProps(state, props){
  return {
    affair: state.getIn(['affair', 'affairMap', props.activeAffairId]),
    affairTree: state.getIn(['affair', 'affairTree']),
  }
}
function mapDispatchToProps(dispatch){
  return {
    fetchAffairTree: bindActionCreators(fetchAffairTree, dispatch),
    fetchAllAffairInAlliance: bindActionCreators(fetchAllAffairInAlliance, dispatch),
    terminateAffair: bindActionCreators(terminateAffair, dispatch),
    requestMoveAffair: bindActionCreators(requestMoveAffair, dispatch),
    fetchAffairList: bindActionCreators(fetchAffairList, dispatch),
    pushPermittedURL: bindActionCreators(pushPermittedURL, dispatch),
  }
}

AffairDisplayTree = connect(mapStateToProps, mapDispatchToProps)(AffairDisplayTree)
AffairDisplayTree = DragDropContext(HTML5Backend)(AffairDisplayTree)

export default AffairDisplayTree
