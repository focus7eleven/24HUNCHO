import React from 'react'
import emojione from 'emojione.js'

const Emoji = React.createClass({
  getDefaultProps(){
    return {
      shortName: 'spinning',
      size: 20,
      onChoose: () => {}
    }
  },

  getInitialState() {
    return {
      emoji: ''
    }
  },

  componentWillMount() {
    this.setState({
      emoji: emojione.shortnameToUnicode(':' + this.props.shortName + ':')
    })
  },

  render() {
    const style = {
      fontSize: this.props.size
    }
    return (
      <div style={style} data-index="emoji" onClick={() => this.props.onChoose(this.state.emoji)}>{this.state.emoji}</div>
    )
  }
})

export default Emoji
