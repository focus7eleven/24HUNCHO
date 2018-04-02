import React, { PropTypes } from 'react'
import { Input } from 'antd'
import _ from 'underscore'

const labelStyleClicked = {
  position: 'absolute',
  display: 'inline-block',
  height: '30px',
  right: '0px',
  top: '5px',
  marginRight: '5px',
  cursor: 'pointer',
  color: '#A75123',
  fontSize: '14px',
}
const labelStyleUnclicked = {
  position: 'absolute',
  display: 'inline-block',
  height: '30px',
  right: '0px',
  top: '5px',
  marginRight: '5px',
  cursor: 'pointer',
  color: '#CBCBCB',
  fontSize: '14px'
}

export const InputWithLabel = React.createClass({
  PropTypes: {
    text: PropTypes.string.isRequire,
    onLabelClick: PropTypes.func,
    enableLabelClick: PropTypes.bool.isRequire, //控制label是否可点击
    onInputBlur: PropTypes.func, //用户离开输入框
    height: PropTypes.number,
    width: PropTypes.number,
  },

  handleClick() {
    if (this.props.enableLabelClick) this.props.onLabelClick()
  },
  render(){
    const {
      text,
      enableLabelClick,
      ...other
    } = this.props

    return (
      <div style={{ display: 'block', width: this.props.width, height: this.props.height, position: 'relative' }}>
        <div>
          <Input disabled={!enableLabelClick} style={_.extend({ width: this.props.width, height: this.props.height }, this.props.style)} {...other} placeholder="填写验证码" onBlur={this.props.onInputBlur}/>
          <div style={!enableLabelClick ? labelStyleUnclicked : labelStyleClicked} onClick={this.handleClick}>{text}</div>
        </div>
      </div>
    )
  }
})
