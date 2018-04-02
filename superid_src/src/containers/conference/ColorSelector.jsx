import React, { PropTypes } from 'react'
import { Popover, Icon } from 'antd'
import { FontColor } from 'svg'
import classNames from 'classnames'
import styles from './ColorSelector.scss'

export const COLORS = ['#4a4a4a', null, '#f55b6c', '#f7c924', '#63d321', '#50e3c2', '#59b9ff', '#bd10e0']

const ColorSelector = React.createClass({
  propTypes: {
    color: PropTypes.string,
    onChange: PropTypes.func,
  },

  getDefaultProps() {
    return {
      color: '#4a4a4a',
    }
  },

  renderColorPanel() {
    const {
      color,
    } = this.props

    let colorCircles = COLORS.map((v) => {
      if (!v) {
        return (
          <div className={styles.splitter} key="spliter" />
        )
      }

      return (
        <div
          key={v}
          className={classNames(styles.circle, color === v ? styles.activeCircle : null)} style={{ backgroundColor: v }}
          onClick={() => this.props.onChange && this.props.onChange(v)}
        >
          {color === v ? <Icon type="check" /> : null}
        </div>
      )
    })

    return (
      <div className={styles.colorPanel}>
        {colorCircles}
      </div>
    )
  },

  render() {
    return (
      <Popover placement="top" content={this.renderColorPanel()} trigger="click">
        <div className={styles.container}>
          <FontColor underlineColor={this.props.color} />
        </div>
      </Popover>
    )
  }
})

export default ColorSelector
