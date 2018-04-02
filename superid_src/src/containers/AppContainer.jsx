import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import NetworkError from './NetworkError'
import { logout } from '../actions/user'
import config from '../config'

if (config.debug) {
  let mock = 'true'
  if (localStorage) {
    if (localStorage.getItem('mock') == null) {
      localStorage.setItem('mock', 'true')
    }
    mock = localStorage.getItem('mock') == 'true' ? 'true' : 'false'
  }
  /* eslint-disable no-undef */
  mock == 'true' && require('../__mock__')
  /* eslint-enable no-undef */
}

const AppComponent = React.createClass({
  getInitialState() {
    return {
      isNetworkError: false,
    }
  },

  componentDidMount() {
    fetch(config.api.ping, {
      method: 'GET',
      credentials: 'include',
    }).catch(() => this.setState({ isNetworkError: true }))
  },

  render: function() {
    // 连接不到服务器的页面
    if (this.state.isNetworkError) return <NetworkError />

    return this.props.children
  },
})

function mapStateToProps (){
  return {}
}
function mapDispatchToProps (dispatch){
  return {
    logout: bindActionCreators(logout, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppComponent)
