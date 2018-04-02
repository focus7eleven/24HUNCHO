import React from 'react'
import { Entity } from 'draft-js'
import _ from 'underscore'
import { fromJS } from 'immutable'
import { Input, Icon, Tooltip } from 'antd'
import { DeleteIcon } from 'svg'
import styles from './Table.scss'
import editorControlStyles from './EditorControl.scss'

const Table = React.createClass({
  getInitialState() {
    return {
      selectedCol: -1, // 被选择准备删除的列
      selectedRow: -1, // 被选择准备删除的行
    }
  },

  componentWillMount(){
    this.setState({
      data: fromJS(this.props.blockProps.data),
    })
  },

  componentWillReceiveProps(nextProps) {
    this.setState({
      data: fromJS(nextProps.blockProps.data)
    })
  },
  componentDidMount() {
    window.addEventListener('mousemove', this.handleAdjustHandleMouseMove)
    window.addEventListener('mouseup', this.handleAdjustHandleMouseUp)
  },
  componentWillUnmount() {
    window.removeEventListener('mousemove', this.handleAdjustHandleMouseMove)
    window.removeEventListener('mouseup', this.handleAdjustHandleMouseUp)
  },

  handleGridChange(row, col, e){
    if (this.props.blockProps.isEditable) {
      this.setState({
        data: this.state.data.setIn(['tableData', row, col], e.target.value),
      })
    }
  },

  handleGridBlur(){
    const entityKey = this.props.block.getEntityAt(0)

    Entity.mergeData(
      entityKey,
      { data: this.state.data.toJS() }
    )
    this.props.blockProps.onFinishEdit(this.props.block.getKey())
  },

  handleAddCol(evt) {
    evt.stopPropagation()
    evt.preventDefault()

    const data = this.state.data.update('tableData', (tableData) => tableData.map((v) => v.push('')))
    const entityKey = this.props.block.getEntityAt(0)

    Entity.mergeData(
      entityKey,
      { data: data.toJS() }
    )

    this.setState({
      data,
    })
  },
  handleAddRow(evt) {
    evt.stopPropagation()
    evt.preventDefault()

    const data = this.state.data.update(
      'tableData',
      (tableData) => tableData.push(tableData.last().map(() => ''))
    )
    const entityKey = this.props.block.getEntityAt(0)
    Entity.mergeData(
      entityKey,
      { data: data.toJS() }
    )

    this.setState({
      data,
    })
  },
  handleDeleteColumn(evt) {
    evt.stopPropagation()
    evt.preventDefault()

    const data = this.state.data.update(
      'tableData',
      (tableData) => tableData.map((v) => v.splice(this.state.selectedCol, 1))
    )

    const entityKey = this.props.block.getEntityAt(0)
    Entity.mergeData(
      entityKey,
      { data: data.toJS() }
    )

    this.setState({
      data,
      selectedCol: -1,
    })
  },
  handleDeleteRow(evt) {
    evt.stopPropagation()
    evt.preventDefault()

    const data = this.state.data.update(
      'tableData',
      (tableData) => tableData.splice(this.state.selectedRow, 1)
    )

    const entityKey = this.props.block.getEntityAt(0)
    Entity.mergeData(
      entityKey,
      { data: data.toJS() }
    )

    this.setState({
      data,
      selectedRow: -1,
    })
  },
  handleTitleChange(evt) {
    if (this.props.blockProps.isEditable) {
      this.setState({
        data: this.state.data.set('title', evt.target.value),
      })
    }
  },
  handleBlurInput() {
    const entityKey = this.props.block.getEntityAt(0)

    Entity.mergeData(
      entityKey,
      { data: this.state.data.toJS() }
    )
    this.props.blockProps.onFinishEdit(this.props.block.getKey())
  },
  handleAdjustHandleMouseDown(evt, col) {
    evt.stopPropagation()
    evt.preventDefault()

    this._activeAdjustHandle = col
    this._x = evt.clientX
  },
  handleAdjustHandleMouseMove(evt) {
    const col = this._activeAdjustHandle

    if (!!col || col === 0) {
      evt.stopPropagation()
      evt.preventDefault()

      this.setState({
        data: this.state.data.updateIn(['colWidth', col], (colWidth) => {
          return Math.max(colWidth + (evt.clientX - this._x), 35)
        })
      })

      this._x = evt.clientX
    }
  },
  handleAdjustHandleMouseUp(evt) {
    if (!!this._activeAdjustHandle || this._activeAdjustHandle === 0) {
      evt.stopPropagation()
      evt.preventDefault()

      this._activeAdjustHandle = null
      const entityKey = this.props.block.getEntityAt(0)

      Entity.mergeData(
        entityKey,
        { data: this.state.data.toJS() }
      )
    }
  },

  // Render
  renderGrid(row, col) {
    const {
      onStartEdit,
    } = this.props.blockProps
    const blockKey = this.props.block.getKey()
    const style = col === this.state.selectedCol || row === this.state.selectedRow ? {
      backgroundColor: '#f0ebf8',
      width: this.state.data.getIn(['colWidth', col]),
    } : {
      width: this.state.data.getIn(['colWidth', col]),
    }

    return (
      <div key={col} className={styles.grid} style={style}>
        <Input
          disabled={!this.props.blockProps.isEditable}
          style={{ fontWeight: row ? 'normal' : 'bold' }}
          onChange={(e) => {this.handleGridChange(row, col, e)}}
          onFocus={() => {onStartEdit(blockKey)}}
          value={this.state.data.getIn(['tableData', row, col])}
          onBlur={this.handleGridBlur}
          type="textarea"
          autosize
        />
      </div>
    )
  },
  renderRowOperator(count) {
    return (
      <div className={styles.rowOperator}>
        {
          _.range(count).map((row) => {
            const style = row === this.state.selectedRow ? {
              color: '#926dea',
              backgroundColor: '#f0ebf8',
            } : {}

            return (
              <div
                key={row}
                className={styles.row}
                style={style}
                onClick={() => {
                  // 表格至少含一行
                  if (count !== 1) {
                    this.setState({
                      selectedRow: row === this.state.selectedRow ? -1 : row,
                    })
                  }
                }}
              >
                {row + 1}
              </div>
            )
          })
        }

        <div className={styles.addRow} onClick={this.handleAddRow}>
          <Icon type="plus" />
        </div>
      </div>
    )
  },
  renderColumnOperator(count) {
    const colWidth = this.state.data.get('colWidth')

    return (
      <div className={styles.columnOperator} ref={(ref) => this._columnOperator = ref}>
        {
          _.range(count).map((col) => {
            const style = col === this.state.selectedCol ? {
              color: '#926dea',
              backgroundColor: '#f0ebf8',
              width: colWidth.get(col),
            } : {
              width: colWidth.get(col),
            }

            return (
              <div
                key={col}
                className={styles.column}
                style={style}
                onClick={() => {
                  // 表格至少含一列
                  if (count !== 1) {
                    this.setState({
                      selectedCol: col === this.state.selectedCol ? -1 : col,
                    })
                  }
                }}
              >
                {String.fromCharCode(65 + col)}
                <span
                  className={styles.widthAdjustHandle}
                  onMouseDown={(evt) => this.handleAdjustHandleMouseDown(evt, col)}
                />
              </div>
            )
          })
        }

        <div className={styles.addCol} onClick={this.handleAddCol}>
          <Icon type="plus" />
        </div>
      </div>
    )
  },
  renderColumnDeleteOperator(count) {
    return (
      <div className={styles.columnDeleteOperator}>
        {
          _.range(count).map((col) => {
            const style = col === this.state.selectedCol ? {
              opacity: 1,
            } : {
              opacity: 0,
            }

            return (
              <div
                key={col}
                className={styles.column}
                style={style}
              >
                <Tooltip title="删除一列">
                  <div className={styles.deleteIcon} onClick={this.handleDeleteColumn}>
                    <DeleteIcon />
                  </div>
                </Tooltip>
              </div>
            )
          })
        }
      </div>
    )
  },
  renderRowDeleteOperator(count) {
    return (
      <div className={styles.rowDeleteOperator}>
        {
          _.range(count).map((row) => {
            const style = row === this.state.selectedRow ? {
              opacity: 1,
            } : {
              opacity: 0,
            }

            return (
              <div
                key={row}
                className={styles.row}
                style={style}
              >
                <Tooltip title="删除一行">
                  <div className={styles.deleteIcon} onClick={this.handleDeleteRow}>
                    <DeleteIcon />
                  </div>
                </Tooltip>
              </div>
            )
          })
        }
      </div>
    )
  },

  render() {
    const tableData = this.state.data.get('tableData')
    const rowCount = tableData.size
    const columnCount = tableData && tableData.get(0) ? tableData.get(0).size : 0
    const blockKey = this.props.block.getKey()
    const {
      isEditable,
      onStartEdit,
    } = this.props.blockProps

    return (
      <div className={styles.container}>
        <div
          contentEditable="false"
          className={styles.tableContainer}
        >
          {isEditable ? this.renderColumnOperator(columnCount) : null}
          {isEditable && ~this.state.selectedCol ? this.renderColumnDeleteOperator(columnCount) : null}
          {isEditable ? this.renderRowOperator(rowCount) : null}
          {isEditable && ~this.state.selectedRow ? this.renderRowDeleteOperator(rowCount) : null}

          {
            _.map(_.range(rowCount), (row) => (
              <div key={row} className={styles.tableRow}>
                {
                  _.map(_.range(columnCount), (column) => this.renderGrid(row, column))
                }
              </div>
            ))
          }
        </div>

        <Input
          disabled={!this.props.blockProps.isEditable}
          className={editorControlStyles.titleInput}
          value={this.state.data.get('title')}
          onChange={this.handleTitleChange}
          onFocus={() => onStartEdit(blockKey)}
          onBlur={this.handleBlurInput}
        />
      </div>
    )
  }
})

export default Table
