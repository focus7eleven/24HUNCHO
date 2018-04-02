import React from 'react'
import PropTypes from 'prop-types'
import { Input } from 'antd'
import _ from 'underscore'


/*
* 延时输入组件
* 使用场景：
* 1）需要在onChange时发起后端请求，又希望请求不能过于频繁
* 2）需要屏蔽中文输入法输入时的onChange事件
* 注意: 组件不应该传入value, onCompositionStart, onCompositionEnd作为props, 也不应该使用form.getFieldDecorator包装起来
*/
class DelayedInput extends React.Component {

  static propTypes = {
    delay: PropTypes.number,
    format: PropTypes.func,
    onChange: PropTypes.func.isRequired
  }

  static defaultProps = {
    delay: 300,
    format: (value) => {
      return value
    },
  }

  state = {
    value: '',
  }

  componentDidMount() {
    this._delayOnChange = _.debounce(this.props.onChange, this.props.delay)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.delay !== nextProps.delay) {
      this._delayOnChange = _.debounce(nextProps.onChange, nextProps.delay)
    }
  }

  onChange = (e) => {
    const { type, isComposing } = e.nativeEvent

    if (type === 'input') {
      const value = e.target.value

      /* isComposing == true 表示使用输入法的状态 */
      if (isComposing) {
        this.setState({ value })
      } else {
        const formatValue = this.props.format(value)
        this.setState({ value: formatValue })
        this._delayOnChange(formatValue)
      }
      /* 结束输入法输入的状态 */
    } else if (type === 'compositionend') {
      this._delayOnChange(this.state.value)
    }
  }

  render() {
    const { onChange, onCompositionStart, onCompositionEnd, value, delay, format, ...others } = this.props
    return (
      <Input
        {...others}
        value={this.state.value}
        onChange={this.onChange}
        onCompositionEnd={this.onChange}
      />
    )
  }
}

export default DelayedInput
