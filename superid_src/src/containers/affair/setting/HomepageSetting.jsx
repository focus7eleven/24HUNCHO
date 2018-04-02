import React from 'react'
import { Button, Input, Tag, Switch, Checkbox, message, Tooltip, Icon } from 'antd'
import styles from './HomepageSetting.scss'
import { VideoPlay, ImgEditIcon, DeleteIcon } from 'svg'
import AffairEditCover from '../AffairEditCover'
import AffairAddCover from '../AffairAddCover'
import config from '../../../config'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { getAffairInfo } from '../../../actions/affair'
import _ from 'underscore'

const DESCRIPTION_MAX_LENGTH = 300

const HomepageSetting = React.createClass({
  getInitialState(){
    const { affair } = this.props
    return {
      tags: affair.getTags(),
      covers: JSON.parse(affair.get('covers') || '[]'),
      description: affair.get('description'),
      resourcePublic: affair.get('resourcePublic'),
      tag: '', //添加标签的值
      isBtnClicked: false, //添加按钮状态
      isAddingTag: false, //是否在添加标签
      showCoverEditModal: false, //编辑封面modal
      chosenCover: null,
    }
  },
  componentWillReceiveProps(nextProps){
    const { affair } = nextProps
    this.setState({
      tags: affair.getTags(),
      covers: JSON.parse(affair.get('covers') || '[]'),
      description: affair.get('description'),
      resourcePublic: affair.get('resourcePublic'),
      tag: '', //添加标签的值
      isBtnClicked: false, //添加按钮状态
      isAddingTag: false, //是否在添加标签
      showCoverEditModal: false, //编辑封面modal
      chosenCover: null,
    })
  },
  //是否在首页展示公开的资源
  getResourcePublic(resourcePublic){
    return resourcePublic.includes(true)
  },
  //删除标签
  handleRemoveTag(value){
    let { tags } = this.state
    tags = tags.filter((v) => {return v != value})
    this.setState({
      tags
    })
  },
  handleTaginputChange(e){
    this.setState({
      tag: e.target.value,
    })
  },
  handleTaginputBlur(){
    let disappear = _.debounce(() => {
      this.handleAddTag()
      if (this.state.isBtnClicked){
        this.setState({
          isBtnClicked: false,
        })
        return
      }
      else {
        this.setState({
          isAddingTag: false,
        })
      }
    }, 200)
    disappear()
  },
  handleAddTag(){
    let { tags } = this.state
    this.setState({
      isBtnClicked: true,
    })
    if (this.state.tag.length < 2) {
      message.error('标签长度应为2-12个字符', 0.5)
      return
    }
    if (tags.length >= 8) {
      message.error('至多添加8个标签', 0.5)
      return
    }
    if (tags.some((v) => v == this.state.tag)) {
      message.error('标签不能重复', 0.5)
      return
    }
    tags.push(this.state.tag)
    this.setState({
      isBtnClicked: false,
      isAddingTag: false,
      tag: '',
    })
  },
  handleDescriptionInput(e) {
    let descriptionNew = e.target.value
    this.setState({
      description: descriptionNew.length > DESCRIPTION_MAX_LENGTH ? descriptionNew.substring(0, DESCRIPTION_MAX_LENGTH) : descriptionNew
    })
    let textarea = this.refs.descriptionInput.refs.input
    textarea.scrollTop = textarea.scrollHeight
  },
  handleChangePublic(type, e){
    let { resourcePublic } = this.state
    resourcePublic = resourcePublic.set(type, e.target.checked)
    this.setState({
      resourcePublic
    })
  },
  handleChangePublicAll(checked){
    let { resourcePublic } = this.state
    resourcePublic = resourcePublic.map(() => checked)
    this.setState({
      resourcePublic
    })
  },
  handleDeleteCover(index){
    let { covers } = this.state
    covers = covers.filter((v, k) => {
      return k != index
    })
    this.setState({ covers })
  },
  handleSubmit(){
    fetch(config.api.affair.homepage_change(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      body: JSON.stringify({
        covers: JSON.stringify(this.state.covers),
        description: this.state.description,
        resourcePublic: this.state.resourcePublic,

        tags: this.state.tags,
      }),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.props.getAffairInfo(this.props.affair.get('id'), this.props.affair.get('roleId'), true).then(() => {
          message.success('修改已成功保存', 0.5)
        })
      }
    })
  },
  render(){
    const { tags, covers } = this.state
    return <div className={styles.homepageSettingContainer}>
      <div className={styles.cover}>
        <div className={styles.title}>事务封面:</div>
        <div className={styles.remark}>第一张图片(视频)默认为封面首图</div>
        <div className={styles.list}>
          {covers.map((self, index) => {
            return self.type ?
              <div className={styles.item} key={index}>
                <img className={styles.block} src={self.url} />
                <div className={styles.mask}>
                  <div className={styles.name}>{self.name}</div>
                  <div className={styles.selfDescription}>{self.description}</div>
                  <Tooltip title="编辑" arrowPointAtCenter>
                    <ImgEditIcon onClick={() => {this.setState({ showCoverEditModal: true, chosenCover: index })}} className={styles.editIcon}/>
                  </Tooltip>
                  <Tooltip title="删除" arrowPointAtCenter>
                    <DeleteIcon onClick={this.handleDeleteCover.bind(null, index)} className={styles.deleteIcon}/>
                  </Tooltip>
                </div>
              </div>
            : (
              <div key={index} className={styles.item}>
                <video src={self.url} className={styles.videoPic}/>
                <VideoPlay height="16px"/>
                <div className={styles.mask}>
                  <div className={styles.name}>{self.name}</div>
                  <div className={styles.selfDescription}>{self.description}</div>
                  <Tooltip title="编辑" arrowPointAtCenter>
                    <ImgEditIcon onClick={() => {this.setState({ showCoverEditModal: true, chosenCover: index })}} className={styles.editIcon}/>
                  </Tooltip>
                  <Tooltip title="删除" arrowPointAtCenter>
                    <DeleteIcon onClick={this.handleDeleteCover.bind(null, index)} className={styles.deleteIcon}/>
                  </Tooltip>
                </div>
              </div>
            )})}
          <AffairAddCover className={styles.add} affair={this.props.affair} callback={(addCover) => {
            let { covers } = this.state
            covers.push(addCover)
            this.setState({
              covers,
              chosenCover: this.state.covers.length - 1,
              showCoverEditModal: true,
            })
          }}
          />
          <div style={{ clear: 'both' }} />
        </div>
      </div>
      <div className={styles.description}>
        <div className={styles.title}>事务描述:</div>
        <Input type="textarea" style={{ resize: 'none' }} rows={7} value={this.state.description} onChange={this.handleDescriptionInput} ref="descriptionInput" placeholder="暂时没有事务描述"/>
        <span className={styles.num}>{this.state.description.length}/300</span>
      </div>

      <div className={styles.tag}>
        <div className={styles.title}>事务标签:</div>
        <div className={styles.list}>
          {
            tags.map((v, k) => {
              return <div className={styles.tagContainer} key={k}>
                <Tag>
                  {v}
                  <Icon type="close" onClick={this.handleRemoveTag.bind(null, v)} className={styles.removeTagMask}/>
                </Tag>
              </div>
            })
          }
          {this.state.isAddingTag ? (
            <div className={styles.addtagContainer} onClick={(e) => {e.stopPropagation()}}>
              <Input maxLength="12" className={styles.tagInput} placeholder="标签内容" onChange={this.handleTaginputChange} onBlur={this.handleTaginputBlur} onPressEnter={this.handleAddTag} ref="tagInput"/>
              <i onClick={this.handleAddTag}>+</i>
            </div>
          ) : (
            <Button type="dashed" className={styles.btn} onClick={() => {this.setState({ isAddingTag: true })}}>+</Button>
          )}
          <div style={{ clear: 'both' }} />
        </div>
      </div>
      <div className={styles.resource}>
        <div className={styles.title}>需要公开资源:</div>
        <div className={styles.switch}>
          <span>是否在首页展示公开的资源</span>
          <Switch checkedChildren="开" unCheckedChildren="关" checked={this.getResourcePublic(this.state.resourcePublic)} onChange={this.handleChangePublicAll}/>
          <div style={{ clear: 'both' }} />
        </div>
        {this.getResourcePublic(this.state.resourcePublic) ?
          <div className={styles.checkbox}>
            <Checkbox onChange={this.handleChangePublic.bind(this, 'role')} checked={this.state.resourcePublic.get('role')}>公开角色</Checkbox>
            <Checkbox onChange={this.handleChangePublic.bind(this, 'fund')} checked={this.state.resourcePublic.get('fund')}>公开资金</Checkbox>
            <Checkbox onChange={this.handleChangePublic.bind(this, 'material')} checked={this.state.resourcePublic.get('material')} >公开物资</Checkbox>
            <Checkbox onChange={this.handleChangePublic.bind(this, 'announcement')} checked={this.state.resourcePublic.get('announcement')}>公开发布</Checkbox>
            <Checkbox onChange={this.handleChangePublic.bind(this, 'file')} checked={this.state.resourcePublic.get('file')}>公开文件</Checkbox>
          </div>
        : (
          <div className={styles.checkbox} />
        )}

      </div>
      <div className={styles.submit}>
        <Button type="primary" size="large" onClick={this.handleSubmit}>保存修改</Button>
      </div>
      {this.state.showCoverEditModal &&
        <AffairEditCover visible={this.state.showCoverEditModal} cover={covers[this.state.chosenCover]}
          affair={this.props.affair}
          onClose={() => {
            this.setState({ showCoverEditModal: false })
          }}
          onModifyCover={(newCover) => {
            let { covers } = this.state
            covers[this.state.chosenCover] = newCover
            this.setState({
              covers
            })
          }}
        />
      }
    </div>
  },
})

function mapStateToProps() {
  return {
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getAffairInfo: bindActionCreators(getAffairInfo, dispatch),
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(HomepageSetting)
