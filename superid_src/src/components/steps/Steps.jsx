import React, { PropTypes } from 'react'
import { IDIdentifyIcon, PhoneIdentifyIcon, FinishIcon, NextIcon, EmailIdentifyIcon } from './svgrepo/StepsIcon'
import styles from './Steps.scss'
import _ from 'underscore'

const onThisStepStyle = {
  marginTop: '15px',
  color: '#A75123',
}

const notOnThisStepStyle = {
  marginTop: '15px',
  color: '#999999',
}

export const ChangeAccountSteps = React.createClass({
  PropTypes: {
    width: PropTypes.number,
    height: PropTypes.number,
    style: PropTypes.object,
    step: PropTypes.number, //当前所在步骤
    type: PropTypes.string, //当前是修改邮箱还有修改手机
  },
  getDefaultProps(){
    return {
      width: 565,
      height: 80,
    }
  },

  render(){
    const {
      width,
      height,
      style,
      step,
    } = this.props
    return (
      <div style={_.extend({ width: width, height: height }, style)} className={styles.stepbody}>
        <div className={styles.stepItem}>
          <IDIdentifyIcon active={step >= 0}/>
          <div style={step >= 0 ? onThisStepStyle : notOnThisStepStyle}>验证身份</div>
        </div>
        <NextIcon active={step >= 0}/>
        {this.props.type == 'phone' ?
          <div className={styles.stepItem}><PhoneIdentifyIcon active={step >= 1}/><div style={step >= 1 ? onThisStepStyle : notOnThisStepStyle} >修改手机</div></div> : <div className={styles.stepItem}><EmailIdentifyIcon active={step >= 1}/><div style={step >= 1 ? onThisStepStyle : notOnThisStepStyle}>修改邮箱</div></div>}
        <NextIcon active={step >= 1}/>
        <div className={styles.stepItem}>
          <FinishIcon active={step >= 2}/>
          <div style={step >= 2 ? onThisStepStyle : notOnThisStepStyle}>完成</div>
        </div>

      </div>
    )
  }
})
