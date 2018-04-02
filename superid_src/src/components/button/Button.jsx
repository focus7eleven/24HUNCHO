import React, { PropTypes } from 'react'
import { Button } from 'antd'
import styles from './Button.scss'
import classNames from 'classnames'
import _ from 'underscore'

export const NormalButton = React.createClass({
  propTypes: {
    height: PropTypes.number,
    width: PropTypes.number,
    content: PropTypes.string,
    className: PropTypes.string,
  },
  getDefaultProps() {
    return {
      height: 40,
      width: 120,
      content: 'button',
    }
  },
  render(){
    const {
    height,
    width,
    content,
    className,
    style,
  } = this.props

    return <Button {...this.props} className={classNames(className, styles.normalButton)} style={_.extend({ height, width }, style)}>{content}</Button>
  }
})

export const WhiteButton = React.createClass({
  propTypes: {
    height: PropTypes.number,
    width: PropTypes.number,
    content: PropTypes.string,
  },
  getDefaultProps() {
    return {
      height: 40,
      width: 120,
      content: 'button',
    }
  },
  render(){
    const {
      height,
      width,
      content,
      className,
      style,
    } = this.props

    return <Button {...this.props} className={classNames(className, styles.whiteButton)} style={_.extend({ height, width }, style)}>{content}</Button>
  }
})

export const ImageFileButton = React.createClass({
  propTypes: {
    height: PropTypes.number,
    width: PropTypes.number,
    content: PropTypes.string,
    onFileSelect: PropTypes.func.isRequired,
  },
  getDefaultProps() {
    return {
      height: 40,
      width: 120,
      content: 'button',
    }
  },

  render(){
    const {
      height,
      width,
      content,
      className,
      style,
      onFileSelect,
    } = this.props

    return (
      <div style={{ position: 'relative' }}>
        {/* 使用一个不可见的<input type="file"/>来完成文件的选择 */}
        <input type="file" className={styles.invisibleInput} onChange={onFileSelect} accept="image/*"/>
        <Button className={classNames(className, styles.lightButton)} style={_.extend({ height, width }, style)}>{content}</Button>
      </div>
    )
  }
})
