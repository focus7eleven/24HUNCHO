import React, { PropTypes } from 'react'

export const LinkComponent = React.createClass({
  propTypes: {
    content: PropTypes.string.isRequired,
    url: PropTypes.string,
  },

  getDefaultProps: function(){
    return {
      content: 'link',
    }
  },

  render(){
    const {
      content,
      url
    } = this.props

    return <a id="defaultLink" href={url} {...this.props}>{content}</a>
  }
})
