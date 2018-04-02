import React, { PropTypes } from 'react'
import { fromJS } from 'immutable'
import { Button, Tag, Icon, Modal, Form, Input, Select, Message } from 'antd'
import { Logo, BackArrow } from 'svg'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { UserProfile } from '../../enhancers/Header'
import { LoginPanel } from '../LoginContainer'
import { fetchUser, fetchUserRoleList } from '../../actions/user'
import { followAffair, getAffairInfo } from '../../actions/affair'
import { pushURL } from 'actions/route'
import styles from './ShareAffairContainer.scss'
import AffairAvatar from '../../components/avatar/AffairAvatar'
import AffairCover from './AffairCover'
import config from '../../config'
import urlFormat from 'urlFormat'
import messageHandler from 'messageHandler'

// 当前页面
const AFFAIR_PAGE = 'AFFAIR_PAGE'
const LOGIN_PANEL = 'LOGIN_PANEL'
const SIGNUP_PANEL = 'SIGNUP_PANEL'
const APPLIED_PANEL = 'APPLIED_PANEL'
const INVALID_SHARE_PANEL = 'INVALID_SHARE_PANEL'

const FormItem = Form.Item
const Option = Select.Option

let ShareAffairContainer = React.createClass({
  contextTypes: {
    router: PropTypes.object,
  },

  getInitialState() {
    return {
      currentPanel: AFFAIR_PAGE,
      affair: null,
      showApplyModal: false, // 展示申请加入事务的 Modal 框
    }
  },

  componentWillMount() {
    this.props.fetchUser().then((res) => {
      /* if user logined, should use affairId from shareInfo to fetch whether the user had stared this affair, else just fetch shareInfo */
      if (res && res.response) {
        this.fetchShareInfo((affair) => {
          this.props.getAffairInfo(affair.get('id'), 0).then((json) => {
            if (json.code == 0 ){
              this.setState({
                affair: affair.set('star', !!json.data.star).set('affairMemberId', json.data.affairMemberId)
              })
            }
          })
        })
      } else {
        this.fetchShareInfo()
      }
    })
  },
  componentWillReceiveProps(nextProps){
    if (nextProps.user.get('id') == 0){
      this.setState({
        affair: this.state.affair.delete('star').delete('affairMemberId')
      })
    }
    else {
      this.fetchShareInfo((affair) => {
        this.props.getAffairInfo(affair.get('id'), 0).then((json) => {
          if (json.code == 0 ){
            this.setState({
              affair: affair.set('star', !!json.data.star).set('affairMemberId', json.data.affairMemberId)
            })
          }
        })
      })
    }
  },
  fetchShareInfo(onSucceed) {
    const shareId = this.props.params.shareId
    if (shareId) {
      fetch(urlFormat(config.api.share.visitor(), {
        shortLink: shareId
      }), {
        method: 'GET',
        credentials: 'include',
      }).then((res) => res.json()).then((json) => {
        if (json.code == 0) {
          const affair = fromJS(json.data)
          if (onSucceed) {
            onSucceed(affair)
          } else {
            this.setState({ affair })
          }
        } else {
          this.setState({ currentPanel: INVALID_SHARE_PANEL })
        }
      })
    }
  },

  handlePostLogin() {
    this.props.fetchUser()
    this.setState({
      currentPanel: AFFAIR_PAGE,
      showUserPanel: false,
    })
  },

  handleEnterAffair() {
    this.props.fetchUserRoleList()
    if (this.props.user.get('auth')) {
      this.setState({
        showApplyModal: true,
      })
    } else {
      this.setState({
        showUserPanel: true,
        userPanel: LOGIN_PANEL,
      })
    }
  },

  handleSubmitApply() {
    this.props.form.validateFields((errors, values) => {
      if (errors) {
        return
      }

      const {
        role,
        description,
      } = values

      const affair = this.state.affair

      fetch(config.api.affair.join.apply(affair.get('id'), role, description), {
        method: 'POST',
        credentials: 'include',
        affairId: affair.get('id'),
        roleId: role,
      }).then((res) => res.json()).then(messageHandler).then((res) => {
        if (res.code === 0) {
          this.setState({
            currentPanel: APPLIED_PANEL,
            showApplyModal: false,
          })
        }
      })
    })
  },
  handleToggleFollow() {
    const { affair } = this.state
    const { user } = this.props
    if (user.get('auth')) {
      followAffair(affair.get('id'), !affair.get('star')).then(messageHandler).then((res) => {
        if (res.code === 0) {
          Message.success(affair.get('star') ? '取消关注成功' : '关注成功')
          this.setState({
            affair: affair.update('star', (star) => !star)
          })
        }
      })
    } else {
      this.setState({
        showUserPanel: true,
        userPanel: LOGIN_PANEL,
      })
    }
  },

  renderHeader() {
    return (
      <div className={styles.header}>
        <Logo />
        {this.props.user && this.props.user.get('auth') ?
          <UserProfile
            disableUserCenter
            disableLogout
          />
        : (
          <div className={styles.loginOrSignup}>
            <div onClick={() => this.setState({ showUserPanel: true, userPanel: SIGNUP_PANEL })}>注册</div>
            <span />
            <div onClick={() => this.setState({ showUserPanel: true, userPanel: LOGIN_PANEL })}>登录</div>
          </div>
        )}
      </div>
    )
  },
  renderAffair() {
    const {
      affair,
    } = this.state

    if (!affair) return null

    // 初始化 JSON 存储的事务信息
    let covers, tags
    try {
      covers = JSON.parse(affair.get('covers') || '[]')
      tags = JSON.parse(affair.get('tags') || '[]')
    } catch (e) {
      covers = []
      tags = []
    }
    return (
      <div className={styles.affairContainer}>
        <div className={styles.affairHeader}>
          <div className={styles.affairHeaderLeft}>
            <AffairAvatar sideLength={40} affair={affair} />
            <p>{affair.get('name') == affair.get('allianceName') ? `${affair.get('name')}` : `${affair.get('allianceName')} ${affair.get('name')}`}</p>
          </div>

          <div>
            {!affair.get('affairMemberId') &&
              <Button type="ghost" size="large" style={{ marginRight: 10 }} onClick={this.handleToggleFollow}>{affair.get('star') ? '取消关注' : '关注'}</Button>
            }
            {affair.get('affairMemberId') ? (
              <Button type="primary" size="large" disabled>已加入</Button>
            ) : (
              <Button type="primary" size="large" onClick={this.handleEnterAffair}>加入事务</Button>
            )}

          </div>
        </div>

        <div className={styles.affairContent}>
          <AffairCover className={styles.affairCover} covers={covers} />
          <div className={styles.affairContentRightPanel}>
            <div className={styles.affairDescription}>{affair.get('description')}</div>
            <div className={styles.tags}>
              {
                tags.map((tag, index) => (<Tag key={index}>{tag}</Tag>))
              }
            </div>
          </div>
        </div>
      </div>
    )
  },
  renderAppliedPanel() {
    return (
      <div className={styles.appliedPanel}>
        <div className={styles.appliedPanelTitle}>
          <Icon type="check-circle" />
          <span>申请已提交！</span>
        </div>
        <p>您的加入事务申请已经成功提交！我们将尽快为您审核完毕，审核结果将通过消息通知您。</p>
        <Button type="primary" size="large" onClick={() => this.props.pushURL(`/workspace/affair/${this.state.affair.get('id')}`)}>进入首页</Button>
      </div>
    )
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
  renderContent() {
    if (this.state.currentPanel === AFFAIR_PAGE) {
      return this.renderAffair()
    }

    if (this.state.currentPanel === APPLIED_PANEL) {
      return this.renderAppliedPanel()
    }

    if (this.state.currentPanel === INVALID_SHARE_PANEL) {
      return this.renderInvalidSharePanel()
    }
  },
  renderApplyModal() {
    const {
      getFieldDecorator,
    } = this.props.form

    const formItemLayout = {
      labelCol: { span: 7 },
      wrapperCol: { span: 14 },
    }

    const selectDecorator = getFieldDecorator('role', {
      rules: [
        { required: true, message: '请选择您的申请角色' },
      ],
    })

    const textareaDecorator = getFieldDecorator('description', {
      rules: [
        { required: true, message: '请输入申请的理由' },
      ],
    })

    return (
      <Modal
        title="申请加入事务"
        visible={this.state.showApplyModal}
        onCancel={() => this.setState({ showApplyModal: false })}
        onOk={this.handleSubmitApply}
      >
        <Form layout="horizontal">
          <FormItem
            {...formItemLayout}
            label="申请角色"
          >
            {selectDecorator(<Select placeholder="请选择申请角色">
              {
                this.props.user.get('roles').map((role, index) => {
                  return (
                    <Option value={role.get('roleId').toString()} key={index}>{`${role.get('allianceName')}－${role.get('roleName')}`}</Option>
                  )
                })
              }
            </Select>)}
          </FormItem>

          <FormItem
            {...formItemLayout}
            label="申请理由"
          >
            {textareaDecorator(<Input type="textarea" rows={10} placeholder="在此输入申请理由" name="textarea" />)}
          </FormItem>
        </Form>
      </Modal>
    )
  },

  render() {
    return (
      <div className={this.state.showUserPanel ? `${styles.container} ${styles.transparentContainer}` : styles.container}>
        {this.renderHeader()}
        {this.renderContent()}
        {this.renderApplyModal()}
        <div className={styles.wrapper} style={{ zIndex: this.state.showUserPanel ? 4 : -1 }}/>

        <div className={styles.userValidation} style={{ zIndex: this.state.showUserPanel ? 8 : -1 }}>
          <LoginPanel
            isGoldTheme
            disableRoute
            wrapClassName={styles.loginPanel}
            initialPanel={this.state.userPanel}
            cbAfterLogin={this.handlePostLogin}
          />
          <div className={styles.backButton} onClick={() => this.setState({ showUserPanel: false })}>
            <BackArrow />
            <div className={styles.text}>返回加入事务</div>
          </div>
        </div>
      </div>
    )
  }
})

ShareAffairContainer = Form.create()(ShareAffairContainer)

function mapStateToProps(state) {
  return {
    user: state.get('user'),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchUser: bindActionCreators(fetchUser, dispatch),
    fetchUserRoleList: bindActionCreators(fetchUserRoleList, dispatch),
    getAffairInfo: bindActionCreators(getAffairInfo, dispatch),
    pushURL: bindActionCreators(pushURL, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ShareAffairContainer)
