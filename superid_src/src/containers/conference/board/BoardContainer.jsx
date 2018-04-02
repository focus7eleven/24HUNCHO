import React from 'react'
import { List, fromJS } from 'immutable'
import styles from './BoardContainer.scss'
import WhiteBoard from './WhiteBoard'
import { REMOTE_OPERATION, OPERATION_TYPE } from './ConstantUtil'
import { TOOL_PENCIL } from './tools'

import { v4 } from 'uuid'
import { connect } from 'react-redux'
import config from '../../../config'

const BOARD_MSG_TYPE = 'BOARD_MSG'

class BoardContainer extends React.Component {

  static defaultProps = {
    board: null,
    isHost: false, // 是否是屏幕申请者
  };

  constructor(props) {
    super(props)
  }

  state = {
    containerWidth: 3600,
    containerHeight: 2700,
    remoteType: REMOTE_OPERATION.INCREMENT,
    operationList: List([]), // 操作数组
    undoHistory: List([]), // 属于当前用户的 undo 的历史操作
    isLock: false, // 白板写权限
  }

  componentDidMount() {

    // const container = this.container

    // if (container) {
    //   this.setState({
    //     containerWidth: container.offsetWidth,
    //     containerHeight: container.offsetHeight
    //   })
    // }

    this.props.addListener((message) => this.insertBoardOperation(message))
  }

  componentWillReceiveProps(nextProps) {
    const { board } = nextProps

    if (board && board.get('id')) {
      if (this.props.board) {
        if (this.props.board.get('id') !== board.get('id')) {
          this.fetchOperationList(board.get('id'))
        } else {
          if (this.state.operationList.size === 0) {
            this.fetchOperationList(board.get('id'))
          }
        }
      } else {
        this.fetchOperationList(board.get('id'))
      }
    }
  }

  componentWillUnMount() {
    this.props.removeListener()
  }

  fetchOperationList = (id) => {
    const { affair } = this.props
    const affairId = affair.get('id')
    const roleId = affair.get('roleId')
    fetch(`${config.videoURL}/board/operation_list?boardId=${id}`, {
      method: 'GET',
      credentials: 'include',
      affairId: affairId,
      roleId: roleId
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const list = res.data

        const operationList = list.map((item) => {
          return JSON.parse(item.data)
        })

        let isLock = false

        if (operationList.length > 0) {
          const last = operationList[operationList.length - 1]
          isLock = last.isLock ? true : false
        }

        this.setState({
          isLock,
          operationList: List(this.filterUndoOperations(operationList)),
          undoHistory: List([])
        })
      }
    })
  }

  cleanBoard = (id) => {
    const { affair } = this.props
    const affairId = affair.get('id')
    const roleId = affair.get('roleId')
   
    return new Promise((resolve) => {
      fetch(`${config.videoURL}/board/empty?boardId=${id}`, {
        method: 'GET',
        credentials: 'include',
        affairId: affairId,
        roleId: roleId
      }).then((res) => res.json()).then((res) => {
        resolve(res)
      })
    })
    
  }

  insertBoardOperation = (message, isLocal = false) => {
    const op = message.op
    let remoteType = REMOTE_OPERATION.DECREMENT
    const { operationList, undoHistory } = this.state

    let oItem = null
    let newUndoHistory = List([])
    let newOperationList = null

    switch (op) {
      case OPERATION_TYPE.UNDO:
        oItem = operationList.findLast((msg) => msg.roleId === message.roleId)
        newOperationList = operationList.filter((msg) => msg.id !== oItem.id)
        if (isLocal) {
          newUndoHistory = undoHistory.push(oItem)
        } else {
          newUndoHistory = undoHistory
        }
        break
      case OPERATION_TYPE.MOVE:
        newOperationList = operationList.push(message)
        if (!isLocal) {
          newUndoHistory = undoHistory
        }
        break
      case OPERATION_TYPE.REDO:
        remoteType = REMOTE_OPERATION.INCREMENT
        if (isLocal) {
          oItem = undoHistory.last()
          newUndoHistory = undoHistory.pop()
        } else {
          oItem = message
        }
        newOperationList = operationList.push(oItem)
        break
      case OPERATION_TYPE.CLEAR_ALL:
        newOperationList = List([])
        newUndoHistory = List([])
        break
      case OPERATION_TYPE.LOCK:
        this.setState({
          isLock: message.isLock
        })
        return
      default:
        remoteType = REMOTE_OPERATION.INCREMENT
        newOperationList = operationList.push(message)
        if (!isLocal) {
          newUndoHistory = undoHistory
        }
        break
    }

    this.setState({
      remoteType,
      operationList: newOperationList,
      undoHistory: newUndoHistory
    })
  }

  handleSendMessage = (msg) => {
    const { affair } = this.props
    const { isLock } = this.state
    const roleId = affair.get('roleId')
    const message = Object.assign({}, msg, {
      id: v4(),
      roleId,
      timestamp: Date.now(),
      isLock
    })

		// TODO 向房间中其他客户端广播
    this.props.onSendData({
      type: BOARD_MSG_TYPE,
      content: message
    })

		// 修改 state 中的数据
    this.insertBoardOperation(message, true)

    // 调用后端接口存储房间历史数据
    this.fetchInsertOperation(message)

  }

  handleUndo = (msg) => {
    const { affair } = this.props
    const { operationList, isLock } = this.state
    const roleId = affair.get('roleId')
    const message = Object.assign({}, msg, {
      id: v4(),
      roleId,
      timestamp: Date.now(),
      isLock
    })

    const undoItem = operationList.findLast((msg) => msg.roleId === message.roleId)
    message.did = undoItem.id

    // TODO 向房间中其他客户端广播
    this.props.onSendData({
      type: BOARD_MSG_TYPE,
      content: message
    })

		// 修改 state 中的数据
    this.insertBoardOperation(message, true)

    // 调用后端接口删除历史数据
    this.fetchInsertOperation(message)

  }

  handleCleanAll = () => {
    const { board } = this.props
    const id = board.get('id')

    const message = {
      id: v4(),
      timestamp: Date.now(),
      op: OPERATION_TYPE.CLEAR_ALL
    }

    this.cleanBoard(id).then((res) => {
      if (res.code === 0) {
        this.props.onSendData({
          type: BOARD_MSG_TYPE,
          content: message
        })

        this.setState({
          remoteType: REMOTE_OPERATION.DECREMENT,
          operationList: List([]),
          undoHistory: List([])
        })
      }
    })
  }

  handleRedo = (msg) => {
    const { affair } = this.props
    const { undoHistory, isLock } = this.state
    const roleId = affair.get('roleId')
    const message = Object.assign({}, msg, {
      id: v4(),
      roleId,
      timestamp: Date.now(),
      isLock
    })

    if (!undoHistory || undoHistory.size <= 0) {
      return
    }

    const redoItem = undoHistory.last()

    redoItem.id = v4()

    // TODO 向房间中其他客户端广播
    this.props.onSendData({
      type: BOARD_MSG_TYPE,
      content: redoItem
    })

    // 修改 state 中的数据
    this.insertBoardOperation(message, true)

    // 调用后端接口添加历史数据
    this.fetchInsertOperation(redoItem)

  }

  handleChangeWritePermission = (isLock) => {
    const { affair } = this.props
    const roleId = affair.get('roleId')
    const message = Object.assign({}, {
      id: v4(),
      roleId,
      timestamp: Date.now(),
      op: OPERATION_TYPE.LOCK,
      isLock
    })

    this.setState({
      isLock
    })
    

		// TODO 向房间中其他客户端广播
    this.props.onSendData({
      type: BOARD_MSG_TYPE,
      content: message
    })
  }

  // 调用后端接口存储房间历史数据
  fetchInsertOperation = (message) => {
    const { affair, board } = this.props
    const affairId = affair.get('id')
    const roleId = affair.get('roleId')
    const allianceId = affair.get('allianceId')

    fetch(`${config.videoURL}/board/insert`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      affairId: affairId,
      roleId: roleId,
      body: JSON.stringify({
        allianceId,
        boardId: board.get('id'),
        roleId: roleId,
        data: JSON.stringify(message),
        operator: message.op
      })
    })
  }

  filterUndoOperations = (oList) => {
    const undoIds = oList.filter((o) => o.op === OPERATION_TYPE.UNDO).map((o) => o.did)
    const newList = oList.filter((o) => (undoIds.indexOf(o.id) === -1) && (o.op !== OPERATION_TYPE.UNDO))
    return newList
  }

  mergeOperations = (operationList) => {
    const data = operationList.toJS()
    let relocate = (pos, diff) => {
      pos.x = pos.x + diff.x
      pos.y = pos.y + diff.y
      const center = pos.center
      pos.center = [center[0] + diff.x, center[1] + diff.y]
      return pos
    }

    let normalItems = []
    let moveItems = []

    data.forEach((item) => {
      switch (item.op) {
        case OPERATION_TYPE.MOVE:
          moveItems.push(item)
          break
        default:
          normalItems.push(item)
      }
    })

    normalItems.sort((a, b) => a.timestamp - b.timestamp)
    const resultItems = normalItems.map((item) => {
      moveItems.forEach((m) => {
        if (m.data.ops.indexOf(item.id) !== -1) {
          item = _moveItem(item, m.data.diff)
          item.data.position = relocate(item.data.position, m.data.diff)
        }
      })
      return item
    })
    return resultItems
  }

  render() {
    const { isHost, suspensionMode } = this.props
    const { containerWidth, containerHeight, isLock } = this.state
    
    return (
      <div className={styles.container} ref={(c) => this.container = c}>
        <div className={styles.sketchPadContainer}>
          <WhiteBoard
            suspensionMode={suspensionMode}
            isLock={isLock}
            isHost={isHost}
            containerWidth={containerWidth}
            containerHeight={containerHeight}
            items={this.mergeOperations(this.state.operationList)}
            undo={this.handleUndo}
            redo={this.handleRedo}
            changeWritePermission={this.handleChangeWritePermission}
            cleanAll={this.handleCleanAll}
            remoteType={this.state.remoteType}
            sendMessage={this.handleSendMessage.bind(this)}
          />
        </div>
      </div>
    )
  }
}


function mapStateToProps(state) {
  const board = state.getIn(['conference', 'board'])

  return {
    board: board,
  }
}
function mapDispatchToProps() {
  return {

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(BoardContainer)

const _moveItem = (item, diff) => {
  const diffXFn = (x) => x + diff.x
  const diffYFn = (y) => y + diff.y

  item = fromJS(item)
  switch (item.get('op')) {
    case OPERATION_TYPE.DRAW_LINE:
      if (item.getIn(['data', 'tool']) === TOOL_PENCIL) {
        item = item.updateIn(['data', 'points'], (points) => points.map((p) => p.update('x', diffXFn).update('y', diffYFn)))
      } else {
        item = item.updateIn(['data', 'start', 'x'], diffXFn)
                  .updateIn(['data', 'start', 'y'], diffYFn)
                  .updateIn(['data', 'end', 'x'], diffXFn)
                  .updateIn(['data', 'end', 'y'], diffYFn)
      }
      break
    case OPERATION_TYPE.DRAW_SHAPE:
      item = item.updateIn(['data', 'start', 'x'], diffXFn)
                .updateIn(['data', 'start', 'y'], diffYFn)
                .updateIn(['data', 'end', 'x'], diffXFn)
                .updateIn(['data', 'end', 'y'], diffYFn)
      break
    case OPERATION_TYPE.TEXT:
      item = item.updateIn(['data', 'pos', 0], diffXFn)
                .updateIn(['data', 'pos', 1], diffYFn)
      break
    case OPERATION_TYPE.INSERT_PIC:
      item = item.updateIn(['data', 'pos', 0], diffXFn)
                .updateIn(['data', 'pos', 1], diffYFn)
      break
    default:
      break
  }
  return item.toJS()
}
