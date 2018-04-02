import React from 'react'
import { Tag, Button, Input } from 'antd'
import { List } from 'immutable'
import styles from './TagGroup.scss'


const EDIT_MODE = {
  ON: 0,
  OFF: 1,
}
const TagGroup = React.createClass({
  getDefaultProps(){
    return {
      tags: List(),
    }
  },
  getInitialState() {
    return {
      tags: this.props.tags == null ? List() : this.props.tags,
      editMode: EDIT_MODE.OFF,
    }
  },
  componentWillReceiveProps(nextProps){
    if (nextProps.tags) {
      this.setState({ tags: nextProps.tags })
    }
  },
  handleRemove(key) {
    const tags = this.state.tags.filter((tag, index) => (index != key))
    this.props.onChangeTags(tags)
  },

  addTag(e) {
    const { onChangeTags } = this.props
    const tag = e.target.value
    const tags = this.state.tags
    const newTags = tags.push(tag)
    onChangeTags(newTags)
    // this.setTagEditMode(EDIT_MODE.OFF);
  },
  onTagHover(k){
    const str = 'tag' + k
    const ele = document.getElementById(str)
    ele.style.display = 'block'
  },
  onTagLeave(k){
    const str = 'tag' + k
    const ele = document.getElementById(str)
    ele.style.display = 'none'
  },
  setTagEditMode(editMode){
    this.setState({ editMode })
  },
  render() {
    const { tags, editMode } = this.state
    return (
      <div>
        {
          tags && tags.map((tag, index) => {

            return (<Tag key={index} className={styles.tag} onClick={() => this.handleRemove(index)} onMouseOver={() => this.onTagHover(index)} onMouseLeave={() => this.onTagLeave(index)}>
              <div className={styles.tagCover} id={'tag' + index}>移除</div>
              {tag}
            </Tag>)

          })
        }
        {editMode == EDIT_MODE.ON ?
          <div className={styles.addtagContainer} onClick={(e) => {e.stopPropagation()}}>
            <Input maxLength="12"
              className={styles.tagInput}
              placeholder="标签内容"
              onChange={this.handleTaginputChange}
              onBlur={this.handleTaginputBlur}
              onPressEnter={this.addTag}
            />
            <div className={styles.addIcon} onClick={() => this.setTagEditMode(EDIT_MODE.OFF)}>+</div>
          </div>
        :
          <Button className={styles.addtagBlank} style={{ width: 22, height: 22 }} size="small" type="dashed" onClick={() => this.setTagEditMode(EDIT_MODE.ON)}>
            <div style={{ display: 'inline', position: 'relative', top: -2, left: -2, fontSize: 14, color: '#ccc' }} className={styles.addIcon}>+</div>
          </Button>
        }
      </div>
    )
  },
})

export default TagGroup
