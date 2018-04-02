import React, { PropTypes } from 'react'
import { Editor, EditorState, convertToRaw, convertFromRaw, Entity, AtomicBlockUtils, RichUtils } from 'draft-js'
import EditorControl, { inlineStyleMap, getBlockStyle, getBlockRender } from './EditorControl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Icon, Select, Button, Spin, Progress, notification } from 'antd'
import styles from './AnnouncementEditor.scss'
import 'draft-js/dist/Draft.css'
import classNames from 'classnames'
import EditorDecorator from './EditorDecorator'
import { Map } from 'immutable'
import { Motion, spring } from 'react-motion'
import config from '../../config'
import { deleteDraft } from '../../actions/announcement'
import { modifyAnnouncement } from '../../actions/affair'
import _ from 'underscore'
import { LockIcon, TagIcon } from 'svg'
import oss from 'oss'

const Option = Select.Option

const AnnouncementEditor = React.createClass({
  propTypes: {
    initialDraft: PropTypes.object, // 从草稿开始编辑
    announcementToEdit: PropTypes.object, // 从某份发布开始编辑
    affairMemberId: PropTypes.number,
    onPublishSuccess: PropTypes.func,
    onEdited: PropTypes.func,
    hideFooter: PropTypes.bool,
    draftId: PropTypes.number,
    affairId: PropTypes.string.isRequired,
    roleId: PropTypes.number.isRequired,
  },
  childContextTypes: {
    immutableEditor: React.PropTypes.bool,
  },
  getChildContext() {
    return {
      immutableEditor: false,
    }
  },
  getDefaultProps() {
    return {
      disableSaveDraft: false,
    }
  },

  getInitialState() {
    const {
      initialDraft,
      draftId,
      announcementToEdit,
    } = this.props

    let rawContent
    if (initialDraft) {
      rawContent = JSON.parse(this.props.initialDraft.content)
      if (typeof rawContent.entityMap === 'string') {
        rawContent.entityMap = JSON.parse(rawContent.entityMap)
      }
    } else if (announcementToEdit) {
      rawContent = JSON.parse(this.props.announcementToEdit.content)
      if (typeof rawContent.entityMap === 'string') {
        rawContent.entityMap = JSON.parse(rawContent.entityMap)
      }
    } else {
      const initialEmptyRawDraftContentState = convertToRaw(EditorState.createEmpty(EditorDecorator).getCurrentContent())
      rawContent = initialEmptyRawDraftContentState
    }
    const editorState = EditorState.createWithContent(convertFromRaw(rawContent), EditorDecorator)

    return {
      editorState,
      liveEdits: Map(), // 记录哪些 block 正在被编辑。
      progress: false,
      progressStatus: 0,
      motionStatus: true,
      title: initialDraft ? initialDraft.title : (announcementToEdit ? announcementToEdit.title : ''),
      publicType: initialDraft ? initialDraft.publicType : 1,
      isPublishing: false,
      isSavingDraft: false,
      hideFooter: false,
      alertMessage: '',
      draftId: initialDraft ? draftId : 0,
      isCompleteFirstAutoSave: false,
      lastContentState: rawContent,
    }
  },
  componentDidMount() {
    // updateCS: used for passing ContentState to PublishAnnouncementComponent (aims to saving draft)
    this._savingDraft = _.debounce(this.handleSavingDraft, 3000)
    this.onChange = (editorState) => this.setState({
      editorState,
    })
  },
  componentWillUnmount() {
    this._isUnmounted = true
    window.clearTimeout(this._alertTimer)
  },
  getContent() {
    const contentState = this.state.editorState.getCurrentContent()
    const rawContent = convertToRaw(contentState)
    return JSON.stringify(rawContent)
  },
  setContent(contentString) {
    let rawContent = JSON.parse(contentString)
    const editorState = EditorState.createWithContent(convertFromRaw(rawContent), EditorDecorator)
    this.handleChange(editorState)
  },

  // Handler
  focus() {
    this.refs.editor.focus()
  },
  onTab(e) {
    const maxDepth = 4
    this.onChange(RichUtils.onTab(e, this.state.editorState, maxDepth))
  },
  forceSaveDraft() {
    return this.handleSavingDraft(convertToRaw(this.state.editorState.getCurrentContent()))
  },
  handleChange(editorState) {
    if (!this.props.announcementToEdit) {
      this._savingDraft(convertToRaw(editorState.getCurrentContent()), false)
    } else if (this.props.onEdited) {
      // 若正在编辑某个发布，通知是否发生了修改
      const raw = convertToRaw(editorState.getCurrentContent())
      _.isEqual(raw, JSON.parse(this.props.announcementToEdit.content)) ? this.props.onEdited(false, 'content') : this.props.onEdited(true, 'content')
    }

    this.setState({
      editorState,
    })
  },
  hanleEditBlock(blockKey, isFocus) {
    this.setState({
      liveEdits: isFocus ? this.state.liveEdits.set(blockKey) : this.state.liveEdits.remove(blockKey)
    })
  },

  handleImageUpload(file) {
    // 文件限制
    const regx = /^image\/(jpeg|jpg|png)$/
    if (!file || !regx.test(file.type)) {
      notification['warning']({
        message: '无法上传该类型的内容',
        description: '目前支持的图片格式有：jpg，jpeg，png',
      })
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      notification['warning']({
        message: '图片大小超过限制，请压缩后上传',
        description: '单个图片大小不超过20M',
      })
      return
    }

    // 插入图片的上传框
    let progressUpdated
    let updateImageUrl
    function readyForUpdateProgress(cb) {
      progressUpdated = cb
    }
    function readyForUpdateImageUrl(cb) {
      updateImageUrl = cb
    }
    const editorState = this.state.editorState
    const entityKey = Entity.create('MEDIA', 'MUTABLE', {
      readyForUpdateProgress,
      readyForUpdateImageUrl,
      data: {
        title: '图片默认标题',
      },
    })
    const nextEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ')
    this.handleChange(nextEditorState)

    return oss.uploadAnnouncementFile(file, this.props.affairId, this.props.roleId, (progress) => {
      progressUpdated && progressUpdated(progress)
    }).then((result) => {
      // 等待进度条加载动画完成。
      setTimeout(() => {
        updateImageUrl && updateImageUrl(`${result.host}/${result.path}`)
      }, 500)
    })
  },

  handleVideoUpload(file) {
    // 插入视频的上传框
    let progressUpdated
    let updateVideoUrl

    function readyForUpdateProgress(cb) {
      progressUpdated = cb
    }
    function readyForUpdateVideoUrl(cb) {
      updateVideoUrl = cb
    }
    const editorState = this.state.editorState
    const entityKey = Entity.create('MEDIA', 'MUTABLE', {
      type: 'video',
      readyForUpdateProgress,
      readyForUpdateVideoUrl,
      data: {
        title: '视频默认标题',
      },
    })
    const nextEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ')
    this.handleChange(nextEditorState)

    return oss.uploadAnnouncementFile(file, this.props.affairId, this.props.roleId, (progress) => {
      progressUpdated && progressUpdated(progress)
    }).then((result) => {
      // 等待进度条加载动画完成。
      setTimeout(() => {
        updateVideoUrl && updateVideoUrl(`${result.host}/${result.path}`)
      }, 500)
    })
  },

  handleAlert() {
    this.refs.alert.style.zIndex = 2
    this.refs.alert.style.opacity = 1
    this.refs.alert.style.bottom = '90px'
    this._alertTimer = setTimeout(() => {
      this.refs.alert.style.zIndex = -1
      this.refs.alert.style.opacity = 0
      this.refs.alert.style.bottom = '80px'
    }, 2000)
  },

  handleTitleChange(e) {
    if (e.target.value.length > 50) return
    this.setState({
      title: e.target.value
    })
    if (!this.props.announcementToEdit){
      this._savingDraft(convertToRaw(this.state.editorState.getCurrentContent()))
    } else {
      e.target.value === this.props.announcementToEdit.title ? this.props.onEdited(false, 'title') : this.props.onEdited(true, 'title')
    }
  },

  handlePublicTypeChange(value) {
    this.setState({
      publicType: value
    })
    !this.props.announcementToEdit ? this._savingDraft(convertToRaw(this.state.editorState.getCurrentContent())) : null
  },

  handleSavingDraft(newContentState) {
    if (this._isUnmounted || this.props.disableSaveDraft) return

    this.setState({
      isSavingDraft: true
    })

    const body = {
      announcementId: this.state.draftId,
      title: this.props.title || this.state.title || '无标题',
      content: this.getContent(),
      publicType: this.props.publicType || null,
      priority: this.props.priority || null,
      startTime: this.props.planDuration && this.props.planDuration[0] ? this.props.planDuration[0] + 0 : null,
      endTime: this.props.planDuration && this.props.planDuration[1] ? this.props.planDuration[1] + 0 : null,
    }

    return fetch(config.api.announcement.draft.post, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(body),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: this.props.affairId,
      roleId: this.props.roleId,
    }).then((res) => {
      return res.json()
    }).then((json) => {
      if (json.code == 0) {
        this.setState({
          draftId: json.data,
          isSavingDraft: false,
          isCompleteFirstAutoSave: true,
          lastContentState: newContentState
        })
      }
    })
  },
  handleKeyCommand(command) {
    const { editorState } = this.state
    const newState = RichUtils.handleKeyCommand(editorState, command)
    if (newState) {
      this.handleChange(newState)
      return true
    }
    return false
  },
  handlePublish() {
    const contentState = this.state.editorState.getCurrentContent()
    const rawContent = convertToRaw(contentState)

    if (!this.state.title.length) {
      // 空发布标题
      this.setState({
        alertMessage: '请输入发布标题'
      }, this.handleAlert)
    } else {
      const isPlainText = contentState.getBlocksAsArray().reduce((acc, curr) => acc && curr.getType() == 'unstyled', true)
      if (!contentState.getPlainText().trim().length && isPlainText) {
        // 空内容
        this.setState({
          alertMessage: '请输入发布内容'
        }, this.handleAlert)
      } else {
        // 发布发布
        this.setState({
          isPublishing: true
        })
        if (!this.props.announcementToEdit){
          // 发布发布 & 从草稿发布发布
          const form = new FormData()
          form.append('title', this.state.title)
          form.append('affairMemberId', this.props.affairMemberId)
          form.append('isTop', 0)
          form.append('publicType', this.state.publicType)
          form.append('content', JSON.stringify(rawContent))

          fetch(config.api.announcement.publish.post, {
            method: 'POST',
            redentials: 'include',
            affairId: this.props.affair.get('id'),
            roleId: this.props.affair.get('roleId'),
            body: form
          }).then((res) => {
            return res.json()
          }).then((json) => {
            if (json.code == 0) {
              notification['success']({
                message: '发布发布成功',
              })
              // 若为编辑草稿状态，则删除发布成功的草稿。
              if (this.state.draftId) {
                this.props.deleteDraft(this.state.draftId, this.props.affair)
              }
              this.props.onPublishSuccess()
            } else {
              this.setState({
                isPublishing: false
              })
              notification['error']({
                message: '发布发布失败',
              })
            }
          })
        } else {
          // 变更发布
          const form = new FormData()
          form.append('title', this.state.title)
          form.append('contentState', JSON.stringify(rawContent))
          form.append('announcementId', this.props.announcementToEdit.announcementId)
          this.props.modifyAnnouncement(form, this.props.affair).then(() => {
            this.setState({
              isPublishing: false
            })

            this.props.onPublishSuccess && this.props.onPublishSuccess()
          })
        }
      }
    }
  },

  // Render
  renderHeader() {
    return (
      <div className={styles.header}>
        <p>写作模式</p>
        <span onClick={this.handleExitFullscreen} className={`simuicon-zoomin ${styles['exit-fullscreen']}`} />
      </div>
    )
  },
  renderEditArea() {
    const {
      editorState,
      liveEdits,
    } = this.state

    return (
      <div
        style={{ width: '100%' }}
        onClick={this.focus}
      >
        {/*编辑部分*/}
        <div
          className={styles.editor}
          ref="editorContainer"
        >
          <Editor
            blockRendererFn={getBlockRender.bind(this)}
            blockStyleFn={getBlockStyle}
            editorState={editorState}
            onChange={this.handleChange}
            ref="editor"
            onTab={this.onTab}
            handleKeyCommand={this.handleKeyCommand}
            customStyleMap={inlineStyleMap}
            onFocus={() => {this.setState({ isFocus: true })}}
            onBlur={() => {this.setState({ isFocus: false })}}
            readOnly={liveEdits.count()}
          />
        </div>
      </div>
    )
  },
  render() {
    const {
      editorState,
      isFullscreenMode,
      progressStatus,
      isPublishing,
      isSavingDraft,
      isCompleteFirstAutoSave,
      alertMessage,
    } = this.state

    return (
      <div className={classNames(this.props.className, { [styles.container]: true, [styles['container-fullscreen']]: this.state.isFullscreenMode, [styles['container-focus']]: this.state.isFocus })}>
        {!this.props.hideTitleInput ? <input className={styles.title} value={this.state.title} placeholder="输入发布标题" onChange={this.handleTitleChange} /> : null}

        {/*控制栏部分*/}
        <EditorControl
          className={this.props.controlClassName}
          isFullscreenMode={isFullscreenMode}
          onEnterFullscreen={this.handleEnterFullscreen}
          onImageUpload={this.handleImageUpload}
          onVideoUpload={this.handleVideoUpload}
          onChange={this.handleChange}
          editorState={editorState}
          affair={this.props.affair}
          liveEdits={this.state.liveEdits}
        />
        {
          this.state.motionStatus ?
            <Motion defaultStyle={{ x: 0 }} style={{ x: spring(progressStatus) }}
              onRest={() => {
                const nextMotionStatus = ((progressStatus == 100) ? false : true)
                this.setState({
                  motionStatus: nextMotionStatus,
                  progressStatus: 0,
                })
              }}
            >
              {
              (value) => {
                return (
                  <div className={styles.progressBar}>
                    <Progress strokeWidth={5} percent={value.x} showInfo={false} />
                  </div>
                )
              }
            }
            </Motion> : null
        }

        <div className={styles.editView}>
          {this.renderEditArea()}
        </div>

        {!this.props.hideFooter ? (
          <div ref="footer" className={styles.footer}>
            <div className={styles.controllBar}>
              <div>
                {
                  this.props.announcementToEdit ? null :
                  <div>
                    <LockIcon fill="#40c176" height="16px" width="13px" />
                    <Select defaultValue="1" className={styles.publicity} dropdownMatchSelectWidth={false} onChange={this.handlePublicTypeChange}>
                      <Option value="0">盟客网公开</Option>
                      <Option value="1">盟内公开</Option>
                      <Option value="2">事务内公开</Option>
                    </Select>
                  </div>
                }
                <TagIcon fill="#f89219" height="12px" width="14px" />
                <Button type="dashed" className={styles.addTag}>+</Button>
              </div>
              <div>
                <span style={{ opacity: isSavingDraft || isCompleteFirstAutoSave ? '1' : '0' }}className={styles.savingDraft}>
                  {isSavingDraft ? <Spin/> : null}
                  {isSavingDraft ? '正在保存草稿...' : isCompleteFirstAutoSave ? '已保存草稿' : ''}
                </span>
                {
                  this.props.announcementToEdit ?
                    <Button size="large" loading={isPublishing} disabled={isPublishing} className={styles.publish} type="primary" onClick={this.handlePublish}>立即变更</Button>
                  :
                    <Button size="large" loading={isPublishing} disabled={isPublishing} className={styles.publish} type="primary" onClick={this.handlePublish}>立即发布</Button>
                }
              </div>
            </div>
          </div>
        ) : null}

        <div ref="alert" className={styles.alertMessage}><Icon type="cross-circle"/>{alertMessage}</div>
      </div>
    )
  }
})

export default connect(() => ({}), (dispatch) => ({
  deleteDraft: bindActionCreators(deleteDraft, dispatch),
  modifyAnnouncement: bindActionCreators(modifyAnnouncement, dispatch),
}), null, { withRef: true })(AnnouncementEditor)
