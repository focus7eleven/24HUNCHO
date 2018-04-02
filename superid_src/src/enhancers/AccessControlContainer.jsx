import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import LoginContainer from '../containers/LoginContainer'
import { checkJWT, refreshJWT } from '../actions/auth'

function mapStateToProps(state) {
  return {
    user: state.get('user')
  }
}
function mapDispatchToProps(dispatch) {
  return {
    refreshJWT: bindActionCreators(refreshJWT, dispatch),
  }
}

export const LoginControlHOC = (Component) => connect(mapStateToProps, mapDispatchToProps)(React.createClass({
  getInitialState() {
    return {
      checked: this.props.user.get('auth') ? false : true,
    }
  },

  componentDidMount() {
    if (this.props.user.get('auth')) {
      checkJWT(this.props.user.get('auth')).then((refresh_token) => {
        if (refresh_token) {
          this.props.refreshJWT(refresh_token).then(() => {
            this.setState({
              checked: true,
            })
          })
        } else {
          this.setState({
            checked: true,
          })
        }
      })
    }
  },

  render() {
    const auth = this.props.user.get('auth')
    if (auth) {
      return this.state.checked ? <Component {...this.props} /> : null
    } else {
      return <LoginContainer {...this.props} />
    }
  },
}))
