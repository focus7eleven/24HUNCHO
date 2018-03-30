import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fromJS, List } from 'immutable'
import { Table } from 'antd'
import styles from './DeadlineContainer.scss'
import { getMyDeadlines } from '../../../actions/notification'

class DeadlineContainer extends React.Component {
  state = {
    sortInfo: null,
    dataSource: List(),
  }
  componentWillMount() {
    this.props.getMyDeadlines().then((res) => {
      this.setState({
        dataSource: fromJS(res.data)
      })
    })
  }
  render() {

    return (
      <div className={styles.container}>
        deadline
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getMyDeadlines: bindActionCreators(getMyDeadlines, dispatch),
  }
}




export default connect(mapStateToProps, mapDispatchToProps)(DeadlineContainer)
