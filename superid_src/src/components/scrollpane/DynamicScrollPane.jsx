import React from 'react'
import styles from './DynamicScrollPane.scss'
import { LoadingIcon } from 'svg'

const DynamicScrollPane = React.createClass({
  getDefaultProps(){
    return {
      isLoading: false,
      hasMore: true,
      wrapClassName: 'dynamic-scroll-pane',
      showNoMore: false,
    }
  },
  onScroll(e) {
    if (this.props.isLoading || !this.props.hasMore) {
      return
    }
    const clientHeight = e.target.clientHeight
    const scrollHeight = e.target.scrollHeight
    const scrollTop = e.target.scrollTop
    const isBottom = (clientHeight + scrollTop === scrollHeight)
    // console.log(isBottom, this.props.isLoading)
    if (isBottom) {
      this.props.onLoad && this.props.onLoad()
    }
  },
  render(){
    const { isLoading, hasMore, wrapClassName, showNoMore } = this.props
    return (
      <div className={wrapClassName} style={{ overflowY: 'auto' }} onScroll={this.onScroll}>
        {this.props.children}
        {(isLoading || !hasMore) &&
          <div className={styles.loadMore}>
            {hasMore &&
              <span><LoadingIcon />正在加载</span>
            }
            {!hasMore && showNoMore &&
              <span>没有更多了...</span>
            }
          </div>
        }
      </div>
    )
  },
})

export default DynamicScrollPane
