import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import styles from './MenkorHeader.scss'
import { Notice, ArrowDropDown, MenkorBigIcon } from 'svg'
import { fetchUser, logout } from '../actions/user'
import { pushURL } from 'actions/route'


export const MenkorHeaderHOC = (Component) => {
  const MenkorHeader = React.createClass({
    componentDidMount(){
      this.props.fetchUser()
    },
    render(){
      const { user } = this.props
      return (
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.menkorIcon}>
              <MenkorBigIcon />
            </div>
            <div className={styles.tools}>
              <div className={styles.buttonGroup}>
                <div className={styles.button}>首页</div>
                <div className={styles.button}>解决方案</div>
                <div className={styles.buttonRound} onClick={() => this.props.pushURL('/workspace')}>超级账号</div>
              </div>
              <div className={styles.divider} />
              <div className={styles.icon}>
                <Notice />
              </div>
              <div className={styles.avatar}>
                <div className={styles.imageContainer}>
                  <div className={styles.image} style={{ backgroundImage: `url(${user.get('avatar')})` }}/>
                </div>
                <div className={styles.name}>{user.get('username')}</div>
                <div className={styles.menu}>
                  <ArrowDropDown />
                </div>
              </div>
            </div>
          </div>
          <div className={styles.context}>
            <Component {...this.props} />
          </div>
        </div>
      )
    },
  })

  function mapStateToProps(state) {
    return {
      user: state.get('user'),
    }
  }

  function mapDispatchToProps(dispatch) {
    return {
      fetchUser: bindActionCreators(fetchUser, dispatch),
      logout: bindActionCreators(logout, dispatch),
      pushURL: bindActionCreators(pushURL, dispatch),
    }
  }

  return connect(mapStateToProps, mapDispatchToProps)(MenkorHeader)
}
