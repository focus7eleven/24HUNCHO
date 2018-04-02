import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { Select, Row, Col, Tooltip, Input, Icon, Progress, message } from 'antd'
import { BLOCK_TYPES, INLINE_STYLES, COLOR_STYLE_MAP, FONT_SIZE_MAP } from './constant'
import { RichUtils, EditorState, Modifier, Entity, AtomicBlockUtils, SelectionState } from 'draft-js'
import TableComponent from './Table'
import styles from './EditorControl.scss'
import classNames from 'classnames'
import _ from 'underscore'
import { fromJS, Map } from 'immutable'
import MultipartVideoUploadMixin from 'mixins/multipart-video-upload-mixin'
import draftUtils from 'draft-utils'
import plyr from 'plyr'
import { Photo, Video, TableIcon, BreakLineIcon, DraftLink } from 'svg'
import config from '../../config'

const Option = Select.Option

const getToolTipTitle = function(type){
  switch (type) {
    case 'simuicon-h1':
      return '大标题'
    case 'simuicon-h2':
      return '中标题'
    case 'simuicon-h3':
      return '小标题'
    case 'simuicon-formatequote':
      return '引用'
    case 'simuicon-codeblock':
      return '代码'
    case 'simuicon-formatebold':
      return '加粗'
    case 'simuicon-formateitalic':
      return '倾斜'
    case 'simuicon-formateunderline':
      return '下划线'
    case 'simuicon-unorderelist':
      return '无序列表'
    case 'simuicon-orderelist':
      return '有序列表'
    default:
      return '其他'
  }
}

export const inlineStyleMap = { ...COLOR_STYLE_MAP, ...FONT_SIZE_MAP }
const blockDataStyleMap = {
  textAlignment: {
    center: 'alignment-center',
    left: 'alignment-left',
    right: 'alignment-right',
  }
}
export const getBlockStyle = (block) => {
  const blockDataClassName = block.getData().reduce((reduction, v, k) => {
    if (blockDataStyleMap[k]) {
      reduction.push(blockDataStyleMap[k][v])
    }
    return reduction
  }, [])

  switch (block.getType()) {
    case 'blockquote':
      return classNames(blockDataClassName, 'RichEditor-blockquote')
    case 'unstyled':
      return classNames(blockDataClassName, 'Main-body')
    default:
      return classNames(blockDataClassName)
  }
}

export const getBlockRender = function(block) {
  if (block.getType() === 'atomic') {
    const entityType = Entity.get(block.getEntityAt(0)).getType()
    const entityData = Entity.get(block.getEntityAt(0)).getData()
    const editable = this.state.isEditMode !== undefined ? this.state.isEditMode : true

    switch (entityType) {
      case 'breakline':
        return {
          component: () => <div className={styles.breakline} />,
          editable: false,
        }

      case 'MEDIA':
        if (entityData.type === 'video') {
          return {
            component: VideoComponent,
            editable,
            props: {
              data: fromJS(entityData.data),
              isEditable: editable,
              onStartEdit: (blockKey) => {
                if (this.state.liveEdits) {
                  this.setState({
                    liveEdits: this.state.liveEdits.set(blockKey)
                  })
                }
              },
              onFinishEdit: (blockKey) => {
                if (this.state.liveEdits) {
                  this.setState({
                    liveEdits: this.state.liveEdits.remove(blockKey)
                  })
                }
              },
              removeSelf: (blockKey) => {
                const editorState = this.state.editorState
                const contentState = editorState.getCurrentContent()
                const block = contentState.getBlockForKey(blockKey)
                const rangeToRemove = new SelectionState({
                  anchorKey: blockKey,
                  anchorOffset: 0,
                  focusKey: blockKey,
                  focusOffset: block.getLength(),
                })
                let newContentState = Modifier.removeRange(contentState, rangeToRemove, 'backward')
                newContentState = Modifier.setBlockType(
                  newContentState,
                  newContentState.getSelectionAfter(),
                  'unstyled',
                )
                let newState = EditorState.push(editorState, newContentState, 'remove-range')
                newState = EditorState.forceSelection(newState, newContentState.getSelectionAfter())
                this.handleChange(newState)
              }
            },
          }
        } else {
          return {
            component: PhotoComponent,
            editable,
            props: {
              data: fromJS(entityData.data),
              isEditable: editable,
              onStartEdit: (blockKey) => {
                if (this.state.liveEdits) {
                  this.setState({
                    liveEdits: this.state.liveEdits.set(blockKey)
                  })
                }
              },
              onFinishEdit: (blockKey) => {
                if (this.state.liveEdits) {
                  this.setState({
                    liveEdits: this.state.liveEdits.remove(blockKey)
                  })
                }
              },
              removeSelf: (blockKey) => {
                const editorState = this.state.editorState
                const contentState = editorState.getCurrentContent()
                const block = contentState.getBlockForKey(blockKey)
                const rangeToRemove = new SelectionState({
                  anchorKey: blockKey,
                  anchorOffset: 0,
                  focusKey: blockKey,
                  focusOffset: block.getLength(),
                })
                let newContentState = Modifier.removeRange(contentState, rangeToRemove, 'backward')
                newContentState = Modifier.setBlockType(
                  newContentState,
                  newContentState.getSelectionAfter(),
                  'unstyled',
                )
                let newState = EditorState.push(editorState, newContentState, 'remove-range')
                newState = EditorState.forceSelection(newState, newContentState.getSelectionAfter())
                this.handleChange(newState)
              }
            },
          }
        }
      case 'table':
        return {
          component: TableComponent,
          editable,
          props: {
            data: fromJS(entityData.data),
            isEditable: editable,
            onStartEdit: (blockKey) => {
              if (this.state.liveEdits) {
                this.setState({
                  liveEdits: this.state.liveEdits.set(blockKey)
                })
              }
            },
            onFinishEdit: (blockKey) => {
              if (this.state.liveEdits) {
                this.setState({
                  liveEdits: this.state.liveEdits.remove(blockKey)
                })
              }
            },
          }
        }
      default:
        return null
    }
  } else {
    return null
  }
}

const PhotoComponent = React.createClass({
  getInitialState(){
    return {
      progress: 0,
      loading: false,
      data: fromJS({}),
    }
  },
  componentWillMount(){
    this.setState({
      data: fromJS(this.props.blockProps.data)
    })
  },
  componentDidMount() {
    const entity = Entity.get(this.props.block.getEntityAt(0))
    const { readyForUpdateProgress, readyForUpdateImageUrl } = entity.getData()

    readyForUpdateProgress && readyForUpdateProgress((progress) => {
      this.setState({
        progress,
      })
    })
    readyForUpdateImageUrl && readyForUpdateImageUrl((url) => {
      const entityKey = this.props.block.getEntityAt(0)
      const newData = this.state.data.set('src', url)
      Entity.mergeData(
        entityKey,
        { data: newData.toJS() }
      )
      this.setState({
        data: newData,
      })
      this.props.blockProps.onFinishEdit(this.props.block.getKey())
    })
  },
  componentWillReceiveProps(nextProps) {
    this.setState({
      data: fromJS(nextProps.blockProps.data)
    })
  },

  handleImageLoaded() {
    this.setState({ loading: 'visible' })
  },
  handleRemoveImage() {
    const {
      removeSelf,
    } = this.props.blockProps
    const blockKey = this.props.block.getKey()

    removeSelf(blockKey)
  },
  handleTitleChange(evt) {
    if (this.props.blockProps.isEditable) {
      this.setState({
        data: this.state.data.set('title', evt.target.value)
      })
    }
  },
  handleBlurInput() {
    const entityKey = this.props.block.getEntityAt(0)

    Entity.mergeData(
      entityKey,
      {
        data: this.state.data.toJS(),
      }
    )
    this.props.blockProps.onFinishEdit(this.props.block.getKey())
  },

  render() {
    const { progress, loading, data } = this.state

    if (!data.get('src')) {
      return (
        <div className={styles.uploadContainer}>
          <p>图片上传中...</p>

          {/* 进度条 */}
          <Progress percent={progress} strokeWidth={5} width={200} showInfo={false} />

          <div className={styles.closeButton} onClick={this.handleRemoveImage}>
            <Icon type="close" />
          </div>
        </div>
      )
    } else {
      const blockKey = this.props.block.getKey()
      const {
        onStartEdit,
      } = this.props.blockProps

      return (
        <div className={styles.imgContainer}>
          <img style={{ visibility: loading }} className={styles.insertPhoto} src={data.get('src')} onLoad={this.handleImageLoaded} />
          <Input
            disabled={!this.props.blockProps.isEditable}
            className={styles.titleInput}
            value={data.get('title')}
            onChange={this.handleTitleChange}
            onFocus={() => onStartEdit(blockKey)}
            onBlur={this.handleBlurInput}
          />
        </div>
      )
    }
  }
})

const VideoComponent = React.createClass({
  getInitialState(){
    return {
      progress: 0,
      data: fromJS({}),
    }
  },
  componentWillMount(){
    this.setState({
      data: fromJS(this.props.blockProps.data)
    })
  },
  componentWillReceiveProps(nextProps) {
    this.setState({
      data: fromJS(nextProps.blockProps.data)
    })
  },
  componentDidMount() {
    const entity = Entity.get(this.props.block.getEntityAt(0))
    const { readyForUpdateProgress, readyForUpdateVideoUrl } = entity.getData()

    readyForUpdateProgress && readyForUpdateProgress((progress) => {
      this.setState({
        progress,
      })
    })
    readyForUpdateVideoUrl && readyForUpdateVideoUrl((url) => {
      const entityKey = this.props.block.getEntityAt(0)
      const newData = this.state.data.set('src', url)
      Entity.mergeData(
        entityKey,
        { data: newData.toJS() }
      )
      this.setState({
        data: newData,
      })
      this.props.blockProps.onFinishEdit(this.props.block.getKey())
    })

    plyr.setup(this.refs.video, {})
  },

  handleRemoveVideo() {
    const {
      removeSelf,
    } = this.props.blockProps
    const blockKey = this.props.block.getKey()

    removeSelf(blockKey)
  },
  handleTitleChange(evt) {
    if (this.props.blockProps.isEditable) {
      this.setState({
        data: this.state.data.set('title', evt.target.value)
      })
    }
  },
  handleBlurInput() {
    const entityKey = this.props.block.getEntityAt(0)

    Entity.mergeData(
      entityKey,
      { data: this.state.data.toJS() }
    )
    this.props.blockProps.onFinishEdit(this.props.block.getKey())
  },

  render() {
    const { progress, data } = this.state

    if (!data.get('src')) {
      return (
        <div className={styles.uploadContainer}>
          <p>视频上传中...</p>

          {/* 进度条 */}
          <Progress percent={progress} strokeWidth={5} width={200} showInfo={false} />

          <div className={styles.closeButton} onClick={this.handleRemoveVideo}>
            <Icon type="close" />
          </div>
        </div>
      )
    } else {
      const blockKey = this.props.block.getKey()
      const {
        onStartEdit,
      } = this.props.blockProps

      return (
        <div className={styles.videoContainer}>
          <video preload="meta" ref="video" controls>
            <source src={data.get('src')}/>
          </video>
          <Input
            disabled={!this.props.blockProps.isEditable}
            className={styles.titleInput}
            value={data.get('title')}
            onChange={this.handleTitleChange}
            onFocus={() => onStartEdit(blockKey)}
            onBlur={this.handleBlurInput}
          />
        </div>
      )
    }
  }
})

const BlockStyleButton = React.createClass({
  propTypes: {
    editorState: React.PropTypes.object.isRequired,
    type: React.PropTypes.object.isRequired,
    onChange: React.PropTypes.func.isRequired,
  },

  handleClick(e) {
    e.preventDefault()

    this.props.onChange(RichUtils.toggleBlockType(
      this.props.editorState,
      this.props.type.style,
    ))
  },

  render() {
    const {
      editorState,
      type,
    } = this.props
    const selection = editorState.getSelection()
    const blockType = editorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType()

    const iconClassName = {
      [styles.blockStyleButton]: true,
      [styles.activeBlockStyleButton]: blockType === type.style,
      [type.label]: true,
    }

    return (
      <Tooltip overlayClassName={styles.tooltip} placement="top" title={getToolTipTitle(type.label)}>
        {type.svg ? (
          <type.svg onMouseDown={this.handleClick} className={classNames(iconClassName)} />
        ) : (
          <span onMouseDown={this.handleClick} className={classNames(iconClassName)} />
        )}
      </Tooltip>
    )
  },
})

const InlineStyleButton = React.createClass({
  propTypes: {
    editorState: React.PropTypes.object.isRequired,
    type: React.PropTypes.object.isRequired,
    onChange: React.PropTypes.func.isRequired,
    enable: React.PropTypes.bool.isRequired,
  },

  handleClick(e) {
    e.preventDefault()

    if (!this.props.enable) return

    this.props.onChange(RichUtils.toggleInlineStyle(
      this.props.editorState,
      this.props.type.style,
    ))
  },

  render() {
    const {
      editorState,
      type,
    } = this.props
    const currentStyle = editorState.getCurrentInlineStyle()

    const iconClassName = {
      [styles.blockStyleButton]: true,
      [styles.activeBlockStyleButton]: currentStyle.has(type.style),
      [type.label]: true,
    }

    return (
      <Tooltip overlayClassName={styles.tooltip} placement="top" title={getToolTipTitle(type.label)}>
        {type.svg ? (
          <type.svg onMouseDown={this.handleClick} className={classNames(iconClassName)} />
        ) : (
          <span onMouseDown={this.handleClick} className={classNames(iconClassName)} />
        )}
      </Tooltip>
    )
  },
})

const InlineColorButton = React.createClass({
  propTypes: {
    editorState: React.PropTypes.object.isRequired,
    label: React.PropTypes.string.isRequired,
    onChange: React.PropTypes.func.isRequired,
    style: React.PropTypes.string.isRequired,
    afterToggle: React.PropTypes.func.isRequired,
  },

  handleToggle(e) {
    e.preventDefault()
    const { editorState } = this.props
    const toggledColor = this.props.style
    const selection = editorState.getSelection()

    // Allow one color at a time. Turn off all active colors.
    const nextContentState = Object.keys(COLOR_STYLE_MAP)
      .reduce((contentState, color) => {
        return Modifier.removeInlineStyle(contentState, selection, color)
      }, editorState.getCurrentContent())

    let nextEditorState = EditorState.push(
      editorState,
      nextContentState,
      'change-inline-style'
    )

    const currentStyle = editorState.getCurrentInlineStyle()

    // Unset style override for current color.
    if (selection.isCollapsed()) {
      nextEditorState = currentStyle.reduce((state, color) => {
        // return RichUtils.toggleInlineStyle(state, color);
        if (Object.keys(COLOR_STYLE_MAP).indexOf(color) < 0){
          if (!state.getCurrentInlineStyle().has(color)){
            state = RichUtils.toggleInlineStyle(state, color)
          }
        } else {
          state = RichUtils.toggleInlineStyle(state, color)
        }
        return state
      }, nextEditorState)
    }

    // If the color is being toggled on, apply it.
    if (!currentStyle.has(toggledColor)) {
      nextEditorState = RichUtils.toggleInlineStyle(
        nextEditorState,
        toggledColor
      )
    }

    this.props.onChange(nextEditorState)
    this.props.afterToggle()
  },


  render() {
    return (
      <div className={styles.colorSpan} style={{ 'backgroundColor': COLOR_STYLE_MAP[this.props.style].color }} onMouseDown={this.handleToggle} />
    )
  }
})

const ColorPickerIcon = React.createClass({
  propTypes: {
    editorState: PropTypes.object.isRequired,
  },

  render() {
    const {
      editorState,
    } = this.props

    const currentInlineStyle = editorState.getCurrentInlineStyle()

    const intersect = currentInlineStyle.intersect(Object.keys(COLOR_STYLE_MAP))

    const color = intersect.size ? COLOR_STYLE_MAP[intersect.first()].color : '#4a4a4a'

    return (
      <svg width="14px" height="14px" viewBox="147 8 18 18" version="1.1">
        <g id="ic_format_color_text" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd" transform="translate(147.000000, 8.000000)">
          <g id="colorIconGroup">
            <polygon id="shapeAbove" points="0 0 18 0 18 18 0 18" />
            <polygon id="shapeBelow" fill={color} points="0 15 18 15 18 18 0 18" />
            <path d="M8.25,2.25 L4.125,12.75 L5.8125,12.75 L6.6525,10.5 L11.34,10.5 L12.18,12.75 L13.8675,12.75 L9.75,2.25 L8.25,2.25 L8.25,2.25 Z M7.215,9 L9,4.2525 L10.785,9 L7.215,9 L7.215,9 Z" id="形状" fill="#4A4A4A" />
          </g>
        </g>
      </svg>
    )
  }
})

const EditorControl = React.createClass({
  propTypes: {
    onChange: PropTypes.func.isRequired,
    onImageUpload: PropTypes.func.isRequired,
    editorState: PropTypes.object.isRequired,
    className: PropTypes.string,
    affair: PropTypes.object,
  },

  mixins: [MultipartVideoUploadMixin],

  getInitialState() {
    return {
      fileName: '',
      showEditVideoModal: false,
      editingVideo: null,
      editingVideoName: '',
      uploadApi: this.props.affair ? config.api.file.token.announcement() : ''
    }
  },

  componentDidMount() {
    window.addEventListener('mousedown', this.handleFadeOut)
  },

  componentWillUnmount() {
    window.removeEventListener('mousedown', this.handleFadeOut)
  },

  // 颜色面板控制
  handleFadeIn(e){
    e.preventDefault()
    let board = this.refs.colorBoard
    board.style.display = board.style.display ? '' : 'none'
    this.refs.colorBoardTooltip.setState({ 'visible': false })
    this.setState({ showLinkPanel: false })
    e.stopPropagation()
  },
  handleFadeOut(){
    let board = this.refs.colorBoard
    board.style.display = 'none'
  },
  handleContentMouseDown(e){
    e.preventDefault()
    e.stopPropagation()
  },
  handlePhotoSelected(e){
    const files = e.target.files
    this.props.onImageUpload(files[0])
    e.target.value = ''
  },
  handleVideoSelected(evt) {
    const file = evt.target.files[0]

    if ((Math.round(file.size * 100 / (1024 * 1024)) / 100) > 500) {
      message.error('文件过大')
      return
    } else {
      this.props.onVideoUpload(file)
    }

    evt.target.value = null
  },
  handleAddTable() {
    const col = 4, row = 4

    const editorState = this.props.editorState
    const entityKey = Entity.create('table', 'MUTABLE', {
      data: {
        tableData: _.map(_.range(row), () => (_.range(col).fill(' '))),
        title: '表格默认标题',
        colWidth: _.range(col).fill(108),
      }
    })
    const nextEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ')
    this.props.onChange(nextEditorState)
  },
  handleAddLink() {
    const editorState = this.props.editorState
    const entityKey = Entity.create('LINK', 'IMMUTABLE', {
      url: 'http://',
      text: '',
      touched: false,
    })

    const nextEditorState = draftUtils.insertLinkEntity(editorState, entityKey)
    this.props.onChange(nextEditorState)
  },

  handleChangeTextAlignment(e, alignment) {
    e.preventDefault()

    const {
      editorState,
      onChange,
    } = this.props
    const newContentState = Modifier.setBlockData(editorState.getCurrentContent(), editorState.getSelection(), {
      textAlignment: alignment,
    })
    onChange(EditorState.push(editorState, newContentState))
  },
  createTable(row, col){
    const editorState = this.props.editorState
    const entityKey = Entity.create('table', 'MUTABLE', {
      columnCount: col,
      rowCount: row,
      data: {
        tableData: _.map(_.range(row), () => (_.range(col).fill(' '))),
        title: '图片默认标题',
      }
    })
    const nextEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ')
    this.props.onChange(nextEditorState)
    let board = this.refs.tableBoard
    board.style.display = board.style.display ? '' : 'none'
  },

  handleChangeBlockType(newBlockType) {
    this.props.onChange(RichUtils.toggleBlockType(
      this.props.editorState,
      newBlockType,
    ))
  },

  handleAddBreakLine() {
    const editorState = this.props.editorState
    const entityKey = Entity.create('breakline', 'MUTABLE', {})
    const nextEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ')
    this.props.onChange(nextEditorState)
  },

  handleChangeFontSize(targetFontSize) {
    const { editorState } = this.props
    const selection = editorState.getSelection()

    // Allow one type of font size at a time. Turn off all other active font sizes.
    const nextContentState = Object.keys(FONT_SIZE_MAP)
      .reduce((contentState, fontSize) => {
        return Modifier.removeInlineStyle(contentState, selection, fontSize)
      }, editorState.getCurrentContent())

    let nextEditorState = EditorState.push(
      editorState,
      nextContentState,
      'change-inline-style'
    )

    const currentStyle = editorState.getCurrentInlineStyle()

    // Unset style override for current font size.
    if (selection.isCollapsed()) {
      nextEditorState = currentStyle.reduce((state, fontSize) => {
        if (Object.keys(FONT_SIZE_MAP).indexOf(fontSize) < 0){
          if (!state.getCurrentInlineStyle().has(fontSize)){
            state = RichUtils.toggleInlineStyle(state, fontSize)
          }
        } else {
          state = RichUtils.toggleInlineStyle(state, fontSize)
        }
        return state
      }, nextEditorState)
    }

    if (!currentStyle.has(targetFontSize)) {
      nextEditorState = RichUtils.toggleInlineStyle(
        nextEditorState,
        targetFontSize
      )
    }

    this.props.onChange(nextEditorState)
  },

  getActiveBlockType() {
    const {
      editorState,
    } = this.props

    const selection = editorState.getSelection()
    return editorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType()
  },

  // Render
  renderTextAlignGroup() {
    return (
      <div className={styles.textAlignGroup}>
        <Tooltip overlayClassName={styles.tooltip} placement="top" title="左对齐">
          <span onMouseDown={(e) => {this.handleChangeTextAlignment(e, 'left')}} className={`${styles.blockStyleButton} simuicon-alignleft`} />
        </Tooltip>
        <Tooltip overlayClassName={styles.tooltip} placement="top" title="中对齐">
          <span onMouseDown={(e) => {this.handleChangeTextAlignment(e, 'center')}} className={`${styles.blockStyleButton} simuicon-aligncenter`} />
        </Tooltip>
        <Tooltip overlayClassName={styles.tooltip} placement="top" title="右对齐">
          <span onMouseDown={(e) => {this.handleChangeTextAlignment(e, 'right')}} className={`${styles.blockStyleButton} simuicon-alignright`} />
        </Tooltip>
      </div>
    )
  },
  renderColorButton(){
    // 颜色面板
    const content = (
      <Row type="flex">
        {INLINE_STYLES.colors.map((color) =>
          (<Col className={styles.colorBlock} span={6} key={color.label}>
            <InlineColorButton
              label={color.label}
              onChange={this.props.onChange}
              editorState={this.props.editorState}
              style={color.style}
              afterToggle={this.handleFadeOut}
            />
          </Col>)
        )}
      </Row>
    )

    return (
      <div className={styles.popoverStyle}>
        <div>
          <Tooltip ref="colorBoardTooltip" overlayClassName={styles.tooltip} placement="top" title="字体颜色">
            <span onMouseDown={this.handleFadeIn} className={styles.blockStyleButton}>
              <ColorPickerIcon editorState={this.props.editorState} />
            </span>
          </Tooltip>
          <div onMouseDown={this.handleContentMouseDown} ref="colorBoard" style={{ 'display': 'none' }} className={styles.colorBoard}>
            {content}
          </div>
        </div>
      </div>
    )
  },

  render() {
    const {
      editorState,
      onChange,
      liveEdits,
    } = this.props

    {/* 当前激活的字体大小 */}
    const currentInlineStyle = editorState.getCurrentInlineStyle()
    const intersect = currentInlineStyle.intersect(Object.keys(FONT_SIZE_MAP))
    const currentFontSize = intersect.first() || 'fontSize14'

    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.leftGroup}>
            {/* 选择段落的样式 */}
            <Select
              value={this.getActiveBlockType()}
              defaultValue="unstyled"
              className={styles.styleSelector}
              style={{ width: 70 }}
              dropdownStyle={{ width: 100 }}
              dropdownMatchSelectWidth={false}
              onChange={this.handleChangeBlockType}
            >
              <Option key="unstyled">正文</Option>
              <Option key="header-one">标题一</Option>
              <Option key="header-two">标题二</Option>
              <Option key="header-three">标题三</Option>
              <Option key="unordered-list-item" style={{ display: 'none' }}>无序列表</Option>
              <Option key="ordered-list-item" style={{ display: 'none' }}>有序列表</Option>
              <Option key="atomic" style={{ display: 'none' }}>多媒体</Option>
            </Select>

            <div className={styles.split} />

            {/* 选择字号 */}
            <Select
              value={currentFontSize}
              className={styles.styleSelector}
              onChange={this.handleChangeFontSize}
              style={{ width: 50 }}
            >
              {
                Map(FONT_SIZE_MAP).map((v, k) => {
                  return (
                    <Option key={k}>{v.fontSize}</Option>
                  )
                })
              }
            </Select>

            <div className={styles.split} />

            <div className={styles.textDecorationGroup}>
              <InlineStyleButton enable={!liveEdits.count()} onChange={onChange} type={INLINE_STYLES.bold} editorState={editorState} />
              <InlineStyleButton enable={!liveEdits.count()} onChange={onChange} type={INLINE_STYLES.italic} editorState={editorState} />
              <InlineStyleButton enable={!liveEdits.count()} onChange={onChange} type={INLINE_STYLES.underline} editorState={editorState} />
              {this.renderColorButton()}
            </div>

            {/* 段落对齐  */}
            {this.renderTextAlignGroup()}

            {/* 列表项 */}
            <BlockStyleButton onChange={onChange} type={BLOCK_TYPES.unorderedList} editorState={editorState} />
            <BlockStyleButton onChange={onChange} type={BLOCK_TYPES.orderedList} editorState={editorState} />

            <div className={styles.split} />

            {/* 选择字号 */}
            <Select
              value="insert"
              className={styles.styleSelector}
              style={{ width: 60, marginLeft: 5 }}
              dropdownStyle={{ width: 100 }}
              dropdownMatchSelectWidth={false}
            >
              <Option key={'insert'} style={{ display: 'none' }}>插入</Option>
              <Option key={'add_image'}>
                <div className={styles.addComponentItem}>
                  <input className={styles.invisibleInput} type="file" accept="image/jpg,image/jpeg,image/png" onChange={this.handlePhotoSelected}/>
                  <Photo />
                  <span>图片</span>
                </div>
              </Option>
              <Option key={'add_video'}>
                <div className={styles.addComponentItem}>
                  <input className={styles.invisibleInput} type="file" accept="video/mp4,video/x-m4v,video/*" onChange={this.handleVideoSelected}/>
                  <Video />
                  <span>视频</span>
                </div>
              </Option>
              <Option key={'add_table'}>
                <div className={styles.addComponentItem} onClick={this.handleAddTable}>
                  <TableIcon />
                  <span>表格</span>
                </div>
              </Option>
              <Option key={'add_breakline'}>
                <div className={styles.addComponentItem} onClick={this.handleAddBreakLine}>
                  <BreakLineIcon />
                  <span>分割线</span>
                </div>
              </Option>
              <Option key={'add_link'}>
                <div className={styles.addComponentItem} onClick={this.handleAddLink}>
                  <DraftLink />
                  <span>超链接</span>
                </div>
              </Option>
            </Select>
          </div>
        </div>
      </div>
    )
  }
})

function mapStateToProps(state) {
  return {
    user: state.get('user'),
  }
}

function mapDispatchToProps() {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(EditorControl)
