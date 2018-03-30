import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { Button } from 'antd'
import BoundModal, { MODAL_TYPE } from './modal/BoundEmailAndPhoneModal'
import ResetPasswordModal from './modal/ResetPasswordModal'
import styles from './AccountBinding.scss'

class AccountBinding extends React.Component {
  state = {
    type: MODAL_TYPE.BOUND_PHONE,
    showBoundModal: false,
    showResetPasswordModal: false,
  }
  handleBoundMobile = () => {
    const { user } = this.props
    this.setState({
      showBoundModal: true,
      type: user.get('mobile') ? MODAL_TYPE.MODIFY_PHONE : MODAL_TYPE.BOUND_PHONE
    })
  }

  handleBoundEmail = () => {
    const { user } = this.props
    this.setState({
      showBoundModal: true,
      type: user.get('email') ? MODAL_TYPE.MODIFY_EMAIL : MODAL_TYPE.BOUND_EMAIL
    })
  }

  handleCancelModal = () => {
    this.setState({
      showBoundModal: false,
      type: MODAL_TYPE.BOUND_PHONE,
    })
  }

  handleResetPassword = () => {
    this.setState({
      showResetPasswordModal: true,
      showBoundModal: false,
      type: MODAL_TYPE.BOUND_PHONE,
    })
  }

  render() {
    const { user } = this.props
    const { showBoundModal, showResetPasswordModal, type } = this.state
    return (
      <div className={styles.container}>
        <div className={styles.row}>
          <div className={styles.label}>手机绑定</div>
          <div className={styles.content}>{ user.get('mobile') }</div>
          <Button type="ghost" className={styles.button} onClick={this.handleBoundMobile}>修改绑定</Button>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>邮箱绑定</div>
          <div className={styles.content}>{ user.get('email') }</div>
          {/* <Button type="ghost" className={styles.button} onClick={this.handleBoundEmail}>修改绑定</Button> */}
        </div>

        {showBoundModal &&
          <BoundModal
            type={type}
            callback={this.handleCancelModal}
            onShowResetPasswordModal={this.handleResetPassword}
          />
        }
        {showResetPasswordModal &&
          <ResetPasswordModal
            user={user}
            visible={showResetPasswordModal}
            callback={() => this.setState({ showResetPasswordModal: false })}
          />
        }
      </div>
    )
  }
}

function mapStateToProps(state) {
	return {
		user: state.get('user'),
	}
}
function mapDispatchToProps(dispatch) {
	return {
		// fetchUser: bindActionCreators(fetchUser, dispatch),
		// updateUser: bindActionCreators(updateUser, dispatch),
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AccountBinding))
