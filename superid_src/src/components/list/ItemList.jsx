import React from 'react'
import styles from './ItemList.scss'

class ItemList extends React.Component {

  static defaultProps = {
    wrapClassName: '',
  }

  render() {
    const { wrapClassName, children } = this.props
    return (
      <div className={`${styles.list} ${wrapClassName}`}>
        {children}
      </div>
    )
  }
}

export default ItemList
