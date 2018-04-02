import React from 'react'
import { connect } from 'react-redux'
import Ladder from 'components/ladder/Ladder'

const NavRoute = React.createClass({
  getDefaultProps(){
    return {
      path: '',
      options: [],
    }
  },
  render(){
    return (
      <Ladder
        {...this.props}
        affair={this.props.affair}
        content={this.props.children}
      />
    )
  },
})

export default connect((state, props) => {
  return {
    affair: state.getIn(['affair', 'affairMap', props.params.id])
  }
})(NavRoute)
