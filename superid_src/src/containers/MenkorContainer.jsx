import React from 'react'
import styles from './MenkorContainer.scss'

const MenkorContainer = React.createClass({

  render(){
    return (
      <div className={styles.container}>
        {this.props.children}
      </div>
    )
  },
})

export default MenkorContainer
