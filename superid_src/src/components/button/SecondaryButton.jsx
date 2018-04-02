import React from 'react'
import { Button } from 'antd'
import './SecondaryButton.scss'

class SecondaryButton extends React.Component {
  render() {
    return (
      <Button {...this.props} className={this.props.className + ' ant-btn-secondary'}>
        {this.props.children}
      </Button>
    )
  }
}

export default SecondaryButton
