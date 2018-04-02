import React from 'react'
import { Cascader } from 'antd'
import address from 'address'

const CHINA_ADDR = function () {
  let temp = null
  address.forEach((area) => {
    if (area.value == 'CN') {
      temp = area.children
    }
  })
  return temp
}()

class Location extends React.Component {
  render() {
    return (
      <Cascader
        options={CHINA_ADDR}
        {...this.props}
      />
    )
  }
}

export default Location
