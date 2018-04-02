import React, { PropTypes } from 'react'
import { fromJS } from 'immutable'
import { Button, Icon, Carousel } from 'antd'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fetchUser } from '../../actions/user'
import styles from './MobileShareAffairContainer.scss'
import config from '../../config'
import superIdIcon from 'images/icon_superid_app.png'

const ShareAffairContainer = React.createClass({
  contextTypes: {
    router: PropTypes.object,
  },

  componentDidMount() {
    const shareId = this.props.params.shareId
    if (shareId) this.fetchShareInformation(shareId)
  },

  getInitialState() {
    return {
      affair: null,
      invalidLink: false,
    }
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.user.get('id') !== this.props.user.get('id')) {
      const shareId = this.props.params.shareId
      if (shareId) this.fetchShareInformation(shareId)
    }
  },

  fetchShareInformation(shareId) {
    fetch(config.api.share.affair.get(shareId), {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        // 获取与事务相关的信息
        fetch(config.api.affair.info.get(), {
          method: 'GET',
          credentials: 'include',
          affairId: res.data.targetId,
        }).then((res) => res.json()).then((res) => {
          if (res.code === 0) {
            const affair = res.data
            this.setState({
              affair: fromJS(affair),
            })
          }
        })
      } else {
        this.setState({
          invalidLink: true,
        })
      }
    })
  },

  handleOpenApp() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    const shareId = this.props.params.shareId

    if (/android/i.test(userAgent)) {
      window.location = `superid://com.simu.menkor/affair?shareId=${shareId}`
    }

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      window.location = `superid://?shareId=${shareId}`

      setTimeout(function() {
        window.location = 'https://itunes.apple.com/cn/app/微信/id414478124?mt=8'
      }, 500)
    }
  },

  handleDownloadApp() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    const shareId = this.props.params.shareId

    if (/android/i.test(userAgent)) {
      window.location = `superid://com.simu.menkor/affair?shareId=${shareId}`
    }

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      window.location = `superid://?shareId=${shareId}`

      setTimeout(function() {
        window.location = 'https://itunes.apple.com/cn/app/微信/id414478124?mt=8'
      }, 500)
    }
  },

  renderInvalidSharePanel() {
    return (
      <div className={styles.appliedPanel}>
        <div className={styles.invalidShareTitle}>
          <Icon type="cross-circle" />
          <span>该链接已失效！</span>
        </div>
      </div>
    )
  },

  renderCarousel() {
    const {
      affair,
    } = this.state
    if (!affair) return null

    // 初始化 JSON 存储的事务信息
    let covers
    try {
      covers = JSON.parse(affair.get('covers'))
    } catch (e) {
      covers = []
    }

    return (
      <Carousel>
        {
          covers.map((cover, index) => {
            return (
              <div className={styles.cover} key={index}>
                <img src={cover.url} />
                {cover.description ? <p>{cover.description}</p> : null}
              </div>
            )
          })
        }
      </Carousel>
    )
  },
  renderDescription() {
    const {
      affair,
    } = this.state
    if (!affair) return null

    return (
      <div className={styles.description}>{affair.get('description')}</div>
    )
  },
  renderFooter() {
    return (
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <img src={superIdIcon} />
          <p>SuperID</p>
        </div>

        <div className={styles.footerRight}>
          <Button size="large" type="ghost" onClick={this.handleOpenApp}>打开APP</Button>
          <Button size="large" type="primary" onClick={this.handleDownloadApp}>立即下载</Button>
        </div>
      </div>
    )
  },
  render() {

    if (this.state.invalidLink) {
      return (
        <div className={styles.container}>
          {this.renderInvalidSharePanel()}
        </div>
      )
    } else {
      return (
        <div className={styles.container}>
          {this.renderCarousel()}
          {this.renderDescription()}
          {this.renderFooter()}
        </div>
      )
    }
  }
})

function mapStateToProps(state) {
  return {
    user: state.get('user'),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchUser: bindActionCreators(fetchUser, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ShareAffairContainer)
