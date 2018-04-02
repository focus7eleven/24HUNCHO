import React from 'react'
import styles from './PublishAnnouncement.scss'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { NextIcon } from 'svg'
import AnnouncementEditor from './AnnouncementEditor'
import { fetchDraftDetail } from '../../actions/announcement'
import { pushURL } from 'actions/route'

const PublishAnnouncementComponent = React.createClass({
  getInitialState() {
    return {
      initialDraft: null,
    }
  },
  componentDidMount() {
    if (this.props.params.draftId && this.props.affairMemberId) {
      this.fetchDraftDetail(this.props)
    }
  },
  componentWillReceiveProps(nextProps) {
    if (this.props.affairMemberId != nextProps.affairMemberId || this.props.params.draftId != nextProps.params.draftId) {
      this.fetchDraftDetail(nextProps)
    }
  },
  fetchDraftDetail(props) {
    fetchDraftDetail(props.params.draftId, props.affairMemberId, this.props.affair).then((res) => this.setState({
      initialDraft: res.data,
    }))
  },

  handleBackdoor() {
    this.props.pushURL(`/workspace/affair/${this.props.params.id}/announcement`)
  },

  render(){
    const {
      affairMemberId,
      params,
    } = this.props
    const {
      initialDraft,
    } = this.state

    if (!affairMemberId) return null

    if (params.draftId) {
      // 编辑草稿
      return initialDraft ? (
        <div className={styles.container}>
          <div className={styles.backdoor}>
            <NextIcon height="10px" fill="#9b9b9b" />
            <span onClick={this.handleBackdoor}>返回发布列表</span>
          </div>
          <div className={styles.editorContainer}>
            <AnnouncementEditor initialDraft={initialDraft} draftId={params.draftId} affairMemberId={affairMemberId} onPublishSuccess={this.handleBackdoor} affair={this.props.affair} />
          </div>
        </div>
      ) : null
    } else {
      return (
        <div className={styles.container}>
          <div className={styles.backdoor}>
            <NextIcon height="10px" fill="#9b9b9b" />
            <span onClick={this.handleBackdoor}>返回发布列表</span>
          </div>
          <div className={styles.editorContainer}>
            <AnnouncementEditor affairMemberId={affairMemberId} onPublishSuccess={this.handleBackdoor} affair={this.props.affair} />
          </div>
        </div>
      )
    }
  }
})

function mapStateToProps(state, props) {
  const affair = state.getIn(['affair', 'affairMap', props.params.id])
  const affairMemberId = affair.get('affairMemberId')

  return {
    affairMemberId,
    affair
  }
}

function mapDispatchToProps(dispatch) {
  return {
    pushURL: bindActionCreators(pushURL, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PublishAnnouncementComponent)
