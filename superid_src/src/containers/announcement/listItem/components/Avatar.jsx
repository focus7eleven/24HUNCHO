import React from 'react'
import styles from './Avatar.scss'

const Avatar = React.createClass({
  getDefaultProps(){
    return {
      src: '',
      textList: [],
    }
  },
  render(){
    return (
      <div>
        <div style={{ backgroundImage: `url(${this.props.src})`, width: this.props.size, height: this.props.size }} className={styles.avatar}/>
        {
          this.props.textList && this.props.textList.map((text, k) => {
            return (
              <div className={styles.text} key={k}>{text}</div>
            )
          })
        }
      </div>
    )
  }
})
export default Avatar
