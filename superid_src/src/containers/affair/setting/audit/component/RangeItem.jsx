import React from 'react'
import { Input } from 'antd'
import styles from './RangeItem.scss'

const POSITIVE_NUMBER_REGEX = /^[0-9]*$/

class RangeItem extends React.Component {

  defaultProps = {
    min: null,
    max: null,
    onChange: () => {},
  }

  onChange = (field) => (e) => {
    const { min, max } = this.props
    if (POSITIVE_NUMBER_REGEX.test(e.target.value)) {
      this.props.onChange({
        min,
        max,
        [field]: e.target.value
      })
    } else {
      this.props.onChange({
        min,
        max
      })
    }
  }

  render(){
    return (
      <div className={styles.rangeItem}>
        <div className={styles.label}>范围：</div>
        <Input
          value={this.props.min}
          placeholder="金额"
          onChange={this.onChange('min')}
        />
        <div className={styles.line}>--</div>
        <Input
          value={this.props.max}
          placeholder="金额"
          onChange={this.onChange('max')}
        />
      </div>
    )
  }
}

export default RangeItem
