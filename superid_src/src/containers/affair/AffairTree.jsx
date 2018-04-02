import React from 'react'
import { connect } from 'react-redux'
import { List } from 'immutable'
import styles from './AffairTree.scss'
import classNames from 'classnames'
import { ArrowRight } from 'svg'
// import ScrollArea from 'react-scrollbar'

let TreeContent = React.createClass({
  contextTypes: {
    scrollArea: React.PropTypes.object
  },

  componentDidUpdate(preProps) {
    if (!preProps.selectedPath.equals(this.props.selectedPath)) {
      // let scrollArea = this.context.scrollArea
      // scrollArea.refresh();
      // scrollArea.scrollRight();
    }
  },

  /**
   * 渲染每一个节点
   * @param affair,传入的事务
   * @param active,是否被选中
   * @param disabled,能否选中
   * @returns {XML}
   */
  renderTreeNode(affair, active = false, disabled = false) {
    let hasChildren = affair.get('children', List()).size
    if (affair.get('_path').equals(this.props.selfPath)) {
      disabled = true
    }
    return (
      <div key={'node_' + affair.get('id')} className={classNames(styles.treeNode, active ? 'active' : '', disabled ? 'disabled' : '')}
        style={{ paddingRight: hasChildren ? '' : '20px' }}
        onClick={() => disabled ? null : this.props.onSelectNode(affair.get('_path').push('children'))}
      >
        <span>{affair.get('name')}</span>
        {disabled || !hasChildren ? null : <ArrowRight className={styles.arrow}/>}
      </div>
    )
  },

  /**
   * 渲染每一个层级
   * @param treeList
   * @param selectedNode 选中节点所在位置
   * @param index selectedPath的位置,作为key
   * @returns {XML}
   */
  renderTreeMenu(treeList, selectedNode, index) {
    let treeMenu
    if (index == 0) {
      //第一层,需要显示当前盟和其他盟,区别处理
      treeMenu = (
        <div>
          <div className={styles.rootTitle}>当前盟：</div>
          {this.renderTreeNode(treeList.get(selectedNode), true)}
          <div className={styles.rootTitle}>其他盟：</div>
          {treeList.map((node, i) => {
            if (i == selectedNode) {
              return
            }
            return this.renderTreeNode(node, false, true)
          })}
        </div>
      )
    } else {
      treeMenu = treeList.map((node, i) => {
        return this.renderTreeNode(node, i == selectedNode)
      })
    }
    return (
      <div className={styles.treeMenu} key={'tree_menu_' + index}>
        {treeMenu}
      </div>
    )
  },

  /**
   * 渲染事务树
   * @returns {Array}
   */
  renderTree() {
    let { affairTree, selectedPath } = this.props
    let tree = []
    selectedPath.map((path, index) => {
      if (List.isList(affairTree)) {
        tree.push(this.renderTreeMenu(affairTree, path, index))
      }
      affairTree = affairTree.get(path)
    })
    List.isList(affairTree) && affairTree.size && tree.push(this.renderTreeMenu(affairTree, selectedPath.last(), selectedPath.size > 1 ? 'last' : 0))
    return tree
  },

  render() {
    return <div className={styles.tree}>{this.renderTree()}</div>
  }
})

let AffairTree = React.createClass({
  componentDidUpdate(preProps) {
    if (!preProps.selectedPath.equals(this.props.selectedPath)) {
      setTimeout(this.scrollAreaComponent.scrollArea.scrollRight, 100)
    }
  },

  render() {
    let { width } = this.props

    return (
      <ScrollArea ref={(component) => {this.scrollAreaComponent = component}} className={styles.treeScroll}
        style={{ width: width }}
        smoothScrolling
      >
        <TreeContent {...this.props}/>
      </ScrollArea>
    )
  }
})

function mapStateToProps(state) {
  return {
    affairTree: state.get('affair').get('affairTree'),
  }
}

function mapDispatchToProps() {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(AffairTree)
