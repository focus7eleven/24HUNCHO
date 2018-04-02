import React from 'react'
import { connect } from 'react-redux'
import Ladder from '../../components/ladder/Ladder.jsx'
import PERMISSION from 'utils/permission'

const AttenderContainer = React.createClass({
  render() {
    return (
      <Ladder
        path="role"
        affair={this.props.affair}
        content={this.props.children}
        options={[
          { tabName: '当前角色', tabPath: 'current', permission: PERMISSION.ENTER_ROLE_STORE },
          { tabName: '历史角色', tabPath: 'history', permission: PERMISSION.CHECK_HISTORY_ROLE },
        ]}
      />
    )
  }
})

export default connect((state, props) => {
  return {
    affair: state.getIn(['affair', 'affairMap', props.params.id])
  }
})(AttenderContainer)
