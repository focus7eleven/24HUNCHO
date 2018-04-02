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
        <div style={{ background: `url(${this.props.src})`, backgroundSize: '21px 21px', verticalAlign: 'middle' }} className={styles.avatar}/>
        {
          this.props.textList && this.props.textList.map((text, index) => {
            return (
              <div key={index} className={styles.text}>{text}</div>
            )
          })
        }
      </div>
    )
  }
})
export default Avatar
