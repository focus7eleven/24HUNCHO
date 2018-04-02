import React from 'react'
import styles from './AccountBinding.scss'
import { Button } from 'antd'
import BoundEmailAndPhoneModal from './BoundEmailAndPhoneModal'
import BoundOthersModal from './BoundOthersModal'
import ResetPasswordModal from './ResetPasswordModal'

const SOCIAL_NAME = [{
  name: 'QQ',
  index: 'qq',
}, {
  name: '微博',
  index: 'weibo',
}, {
  name: '微信',
  index: 'wechat',
}]

const AccountBinding = React.createClass({
  getInitialState() {
    return {
      email: null,
      tel: null,
      showBindEmail: false,
      showBindMobile: false,
      showBindOthers: false,
    }
  },
  handleBoundEmail() {
    this.setState({
      showBindEmail: true,
    })
  },
  handleBoundMobile() {
    this.setState({
      showBindMobile: true,
    })
  },
  handleBindOthers() {
    this.setState({
      showBindOthers: true,
    })
  },
  handleMaskString(string, head, tail) {
    return string.substring(0, head) + '****' + string.slice(-tail)
  },
  render() {
    const {
      user
    } = this.props
    return (
      <div className={styles.container}>
        <div style={{ marginBottom: 35 }} className={styles.row}>
          <div className={styles.label}>邮箱</div>
          <div className={styles.content}>
            {user.get('email') ? user.get('email') : <div className={styles.unbound}>未绑定</div>}
          </div>
          <Button type="ghost" className={styles.button} onClick={this.handleBoundEmail}>{user.get('email') ? '修改绑定' : '绑定'}</Button>
        </div>
        <div style={{ marginBottom: 45 }} className={styles.row}>
          <div className={styles.label}>手机号</div>
          <div className={styles.content}>
            {user.get('mobile') ? this.handleMaskString(user.get('mobile'), 3, 4) : <div className={styles.unbound}>未绑定</div>}
          </div>
          <Button type="ghost" className={styles.button} onClick={this.handleBoundMobile}>修改绑定</Button>
        </div>


        {
          SOCIAL_NAME.map((v) => {
            const {
              name,
              index,
            } = v
            const account = user.getIn(['socialAccount', index])

            return (
              <div
                style={{ marginBottom: 45 }}
                className={styles.row}
                key={index}
              >
                <div className={styles.label}>{name}</div>
                <div className={styles.content}>
                  {account ? this.handleMaskString(account, 3, 3) : <div className={styles.unbound}>未绑定</div>}
                </div>
                <Button
                  type="ghost"
                  className={styles.button}
                  onClick={this.handleBindOthers}
                >
                  {account ? '解除绑定' : '绑定'}
                </Button>
              </div>
            )
          })
        }

        {this.state.showBindEmail &&
          <BoundEmailAndPhoneModal
            type="BOUND_EMAIL"
            callback={() => {
              this.setState({ showBindEmail: false })
            }}
            onShowResetPasswordModal={() => {
              this.setState({
                showBindEmail: false,
                showPasswordReset: true,
              })
            }}
          />
        }
        {this.state.showBindMobile &&
          <BoundEmailAndPhoneModal
            type="BOUND_PHONE"
            callback={() => {
              this.setState({ showBindMobile: false })
            }}
            onShowResetPasswordModal={() => {
              this.setState({
                showBindMobile: false,
                showPasswordReset: true,
              })
            }}
          />
        }
        {this.state.showBindOthers &&
          <BoundOthersModal
            type="WECHAT"
            callback={() => {
              this.setState({ showBindOthers: false })
            }}
          />
        }
        {this.state.showPasswordReset &&
          <ResetPasswordModal
            visible
            callback={() => {
              this.setState({ showPasswordReset: false })
            }}
          />
        }
      </div>
    )
  }
})

export default AccountBinding
