import React from 'react'
import { Tag, Input, Tooltip, Button, message, Icon } from 'antd'
import styles from './EditableTagGroup.scss'
import classNames from 'classnames'

class EditableTagGroup extends React.Component {
  static defaultProps = {
    onTagsChange: () => {},
    tags: [],
    distinctWarning: true,
  }

  state = {
    tags: this.props.tags || [],
    inputVisible: false,
    inputValue: '',
  };

  handleClose = (removedTag) => {
    const tags = this.state.tags.filter((tag) => tag !== removedTag)

    this.props.onTagsChange(tags)
    this.setState({ tags })
  }

  showInput = () => {
    this.setState({ inputVisible: true }, () => this.input.focus())
  }

  handleInputChange = (e) => {
    this.setState({ inputValue: e.target.value })
  }

  handleInputConfirm = () => {
    const state = this.state
    const inputValue = state.inputValue.trim()
    let tags = state.tags || []
    if (tags.indexOf(inputValue) >= 0) {
      this.props.distinctWarning && message.warning('请不要添加重复标签哦')
    } else if (tags.length >= 8){
      message.warning('标签的个数不能超过8个')
      this.setState({
        inputVisible: false,
      })
      return
    } else if (inputValue.length > 15){
      message.warning('标签的长度为1到15个字符')
      this.setState({
        inputVisible: false,
      })
      return
    } else if (inputValue != null & inputValue !== '' ) {
      tags = [...tags, inputValue]
      this.props.onTagsChange(tags)
      this.setState({
        tags,
        inputVisible: false,
        inputValue: '',
      })
    } else {
      this.setState({
        inputVisible: false,
      })
    }
  }

  saveInputRef = (input) => this.input = input

  render() {
    const { style, className, immutable } = this.props
    const { tags, inputVisible, inputValue } = this.state
    return (
      <div
        style={style || {}}
        className={classNames(className, styles.tagGroup)}
      >
        {(tags || []).map((tag, index) => {
          const isLongTag = tag.length > 20
          const tagElem = (
            <Tag style={{ marginTop: 5 }} key={tag} closable={!immutable} afterClose={() => this.handleClose(tag)}>
              {isLongTag ? `${tag.slice(0, 20)}...` : tag}
            </Tag>
          )
          return isLongTag ? <Tooltip title={tag} key={index}>{tagElem}</Tooltip> : tagElem
        })}
        {!immutable && inputVisible && (
          <div style={{ position: 'relative' }}>
            <Input
              ref={this.saveInputRef}
              type="text"
              size="small"
              placeholder="标签内容"
              style={{ width: 78, marginTop: 5, paddingRight: 20 }}
              value={inputValue}
              onChange={this.handleInputChange}
              onBlur={this.handleInputConfirm}
              onPressEnter={this.handleInputConfirm}
            />
            <Icon type="plus" style={{ position: 'absolute', right: 5, top: 9, color: '#926dea' }}/>
          </div>
        )}
        {!immutable && !inputVisible && <Button className={styles.addTagButton} style={{ marginTop: 5 }} size="small" type="dashed" onClick={this.showInput}><Icon type="plus" /></Button>}
      </div>
    )
  }
}

export default EditableTagGroup
