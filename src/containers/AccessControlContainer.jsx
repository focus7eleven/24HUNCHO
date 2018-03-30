import React from 'react'
import createClass from 'create-react-class'
import { connect } from 'react-redux'
import LoginContainer from './LoginContainer'

const LoginControlHOC = (Component) => {
  const AccessControl = createClass({
    render() {
      const isAuth = this.props.user.get('auth')
      return isAuth ? <Component {...this.props} /> : <LoginContainer {...this.props} />
    }
  })

  function mapStateToProps(state) {
  	return {
  		user: state.get('user')
  	}
  }

  return connect(mapStateToProps)(AccessControl)
}

export default LoginControlHOC
