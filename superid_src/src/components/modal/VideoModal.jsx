import React, { PropTypes } from 'react'
import plyr from 'plyr'
import styles from './VideoModal.scss'
import { Modal } from 'antd'

const VideoModal = React.createClass({
  PropTypes: {
    onClose: PropTypes.func,
    source: PropTypes.string,
  },

  getDefaultProps(){
    return {
      source: ''
    }
  },
  getInitialState(){
    return {
      visible: false
    }
  },
  handleClick(){
    this.props.onClose()
  },
  componentDidMount(){
    plyr.setup(document.querySelector('#player1'))
  },
  componentWillReceiveProps(nextProps){
    this.setState({
      visible: nextProps.visible
    })

  },
  render(){
    return (
      <Modal className={styles.wrapper} visible={this.props.visible}
        onCancel={this.handleClick}
        closable
        width={1000}
        maskClosable={false}
      >
        <video id="player1" poster="" controls>
          <source src={this.props.source}/>
        </video>
      </Modal>
    )
  }

})

export default VideoModal
