import { CompositeDecorator, Entity } from 'draft-js'
import React from 'react'
import { Tooltip, Popover, Input } from 'antd'
import styles from './EditorDecorator.scss'

// Link
const Link = React.createClass({
  contextTypes: {
    immutableEditor: React.PropTypes.bool,
  },

  getInitialState() {
    const {
      entityKey,
    } = this.props
    const {
      url,
      text,
      touched,
    } = Entity.get(entityKey).getData()

    return {
      url,
      text,
      showAddPanel: !touched,
      showEditPanel: false,
    }
  },

  componentWillReceiveProps(nextProps) {
    const data = Entity.get(nextProps.entityKey).getData()

    this.setState({
      url: data.url,
      text: data.text,
      showAddPanel: !data.touched,
    })
  },

  handleClickLink(url) {
    const win = window.open(url, '_blank')
    win.focus()
  },

  handleCancelEdit() {
    const {
      entityKey,
    } = this.props
    const {
      url,
      text,
    } = Entity.get(entityKey).getData()

    Entity.mergeData(
      entityKey,
      {
        touched: true,
      }
    )

    this.setState({
      url,
      text,
      showEditPanel: false,
      showAddPanel: false,
    })
  },

  handleConfirmEdit() {
    const {
      entityKey,
    } = this.props

    Entity.mergeData(
      entityKey,
      {
        text: this.state.text,
        url: this.state.url,
        touched: true,
      }
    )

    this.setState({
      showEditPanel: false,
      showAddPanel: false
    })
  },

  handleRemoveSelf() {
    const {
      entityKey,
    } = this.props

    Entity.mergeData(
      entityKey,
      {
        text: '',
        url: '',
        touched: true,
      }
    )

    this.setState({
      showEditPanel: false,
      showAddPanel: false,
      text: '',
      url: '',
    })
  },

  handleVisibleChange(visible) {
    if (this.state.showEditPanel && !visible) {
      this.setState({
        showEditPanel: visible,
      })
    }
  },

  renderAddLink() {
    const {
      text,
      url,
    } = this.state

    return (
      <div className={styles.addLinkContent}>
        <div className={styles.linkField}>
          <p>链接名:</p>
          <Input value={text} onChange={(evt) => this.setState({ text: evt.target.value })} />
        </div>
        <div className={styles.linkField}>
          <p>链接地址:</p>
          <Input value={url} onChange={(evt) => this.setState({ url: evt.target.value })} />
        </div>
        <div className={styles.buttonGroup}>
          <div className={styles.cancelButton} onClick={this.handleCancelEdit}>取消</div>
          <div className={styles.confirmButton} onClick={this.handleConfirmEdit}>确定</div>
        </div>
      </div>
    )
  },

  renderEditLink() {
    return (
      <div className={styles.editLink}>
        <div className={styles.url} onClick={() => this.handleClickLink(this.state.url)}>{this.state.url}</div>
        <div className={styles.editButton} onClick={() => this.setState({ showEditPanel: false, showAddPanel: true })}>编辑</div>
        <div className={styles.split} />
        <div className={styles.editButton} onClick={this.handleRemoveSelf}>移除</div>
      </div>
    )
  },

  render(){
    return (
      <Popover
        visible={!this.context.immutableEditor && (this.state.showAddPanel || this.state.showEditPanel)}
        trigger="click"
        placement="bottom"
        content={this.state.showEditPanel ? this.renderEditLink() : this.renderAddLink()}
        onVisibleChange={this.handleVisibleChange}
      >
        {this.state.text ? (
          <a
            contentEditable={false}
            className={styles.link}
            onClick={() => {
              if (this.context.immutableEditor) {
                this.handleClickLink(this.state.url)
              } else {
                this.setState({ showEditPanel: true })
              }
            }}
          >
            {this.state.text}
          </a>
        ) : <a />}
      </Popover>
    )
  },
})
function findLinkEntities(contentBlock, callback) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity()
      return (
        entityKey !== null &&
        Entity.get(entityKey).getType() === 'LINK'
      )
    },
    callback
  )
}

// Replace part
function findReplaceEntities(contentBlock, callback) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity()
      return (
        entityKey !== null &&
        Entity.get(entityKey).getType() === 'REPLACE'
      )
    },
    callback
  )
}
const Replace = React.createClass({
  render(){
    const {
      entityKey,
    } = this.props
    const {
      text,
    } = Entity.get(entityKey).getData()

    return (
      <Tooltip placement="bottom" title="修改的内容">
        <div style={{ backgroundColor: '#ffdd89' }} className={styles.diffEntity}><span style={{ color: '#e77509', verticalAlign: 'sub', whiteSpace: 'nowrap', marginRight: 5, marginLeft: 5 }}> * </span>{text}</div>
      </Tooltip>
    )
  },
})

// Delete part
function findDeleteEntities(contentBlock, callback) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity()
      return (
        entityKey !== null &&
        Entity.get(entityKey).getType() === 'DELETE'
      )
    },
    callback
  )
}
const Delete = React.createClass({
  render(){
    const {
      entityKey,
    } = this.props
    const {
      text,
    } = Entity.get(entityKey).getData()

    return (
      <Tooltip placement="bottom" title="删除的内容">
        <div style={{ backgroundColor: '#ffb6b6' }} className={styles.diffEntity}><span style={{ color: '#c30016', whiteSpace: 'nowrap', marginRight: 5, marginLeft: 5 }}> - </span>{text}</div>
      </Tooltip>
    )
  },
})

// Insert part
function findInsertEntities(contentBlock, callback) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity()
      return (
        entityKey !== null &&
        Entity.get(entityKey).getType() === 'INSERT'
      )
    },
    callback
  )
}
const Insert = React.createClass({
  render(){
    const {
      entityKey,
    } = this.props
    const {
      text,
    } = Entity.get(entityKey).getData()

    return (
      <Tooltip placement="bottom" title="新增的内容">
        <div style={{ backgroundColor: '#b8e986' }} className={styles.diffEntity}><span style={{ color: '#278503', whiteSpace: 'nowrap', marginRight: 5, marginLeft: 5 }}> + </span>{text}</div>
      </Tooltip>
    )
  },
})

const EditorDecorator = new CompositeDecorator([{
  strategy: findLinkEntities,
  component: Link,
}, {
  strategy: findReplaceEntities,
  component: Replace,
}, {
  strategy: findDeleteEntities,
  component: Delete,
}, {
  strategy: findInsertEntities,
  component: Insert,
}])

export default EditorDecorator
