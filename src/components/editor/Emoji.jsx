import React from 'react'
import emojione from 'emojione.js'

class Emoji extends React.Component{
  constructor(props) {
    super(props)
    this.state = {
      emoji: ''
    }
  }

  componentWillMount() {
    this.setState({
      emoji: emojione.shortnameToUnicode(':' + this.props.shortName + ':')
    })
  }

  // 问题：stopPropagation没有用
  onClick = (e) => {
    e.stopPropagation()
    this.props.onChoose(this.state.emoji)
  }

  render() {
    const style = {
      fontSize: this.props.size
    }
    return (
      <div style={style} onClick={this.onClick} data-index="emoji">{this.state.emoji}</div>
    )
  }
}

Emoji.defaultProps = {
  shortName: 'spinning',
  size: 20,
  onChoose: () => {}
}

export default Emoji
