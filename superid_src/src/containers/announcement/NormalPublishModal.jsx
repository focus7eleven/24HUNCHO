import moment from 'moment'
import React from 'react'
import styles from './NormalPublishModal.scss'
import { Modal, Switch, Input, Button, message, DatePicker, notification, Tag } from 'antd'
import { AddIcon } from 'svg'
import OfficialListComponent from './OfficialListComponent'
import config from '../../config'
import ChoosePublishTarget from '../task/ChoosePublishTarget'
import { genKey } from 'draft-js'
import oss from 'oss'
import _ from 'underscore'
import messageHandler from 'messageHandler'

const PUBLISH_STEP = 'PUBLISH_STEP'
const SELECT_DELAY_TIME_STEP = 'SELECT_DELAY_TIME_STEP'
const NormalPublishModal = React.createClass({
  getInitialState(){
    return {
      src: [],
      selectedMainRoleList: [],
      role: null,
      delayTime: this.getDefaultDelayTime(),
      step: PUBLISH_STEP,
      publicSwitchOn: false,
      title: '',
      content: '',
      chosenMap: null,
      isAddingReceiver: false,
      tags: [],
      isAddingTag: false,
      addingTag: '',
      isBtnClicked: false, //添加按钮状态
      tag: '', //添加标签的值
    }
  },
  componentDidMount() {
    fetch(config.api.affair.role.main_roles(), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const data = res.data

        this.setState({
          role: data.find((v) => v.roleId === this.props.affair.get('roleId')),
        })
      }
    })
  },
  handleUpload(e){
    const file = e.target.files[0]
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

    this.setState({
      progressStatus: 0,
      motionStatus: true
    })

    return oss.uploadAnnouncementFile(file, this.props.affair.get('id'), this.props.affair.get('roleId'), (progress) => {
      this.setState({
        progressStatus: progress
      })
    }).then((result) => {
      let { src } = this.state
      src.push(`${result.host}/${result.path}`)
      this.setState({
        src: src
      })
    })


  },
  getDefaultDelayTime() {
    return new Date(Date.now() + 60000)
  },
  getOfficialList() {
    let officialList = []
    if (this.state.role) {
      officialList.push(this.state.role)
    }

    officialList = officialList.concat(this.state.selectedMainRoleList.map((role) => ({
      roleTitle: role.roleTitle,
      username: role.username,
      roleId: role.roleId,
      avatar: role.avatar,
    })))
    return officialList
  },
  handleAddOfficial(v) {
    this.state.selectedMainRoleList.push(v)
    this.setState({
      selectedMainRoleList: this.state.selectedMainRoleList,
    })
  },
  handleDeleteOfficial(v) {
    this.setState({
      selectedMainRoleList: this.state.selectedMainRoleList.filter((w) => w.roleId !== v.roleId)
    })
  },
  handleTitleChange(e) {
    if (e.target.value.length > 50) return

    this.setState({
      title: e.target.value,
    })
  },
  handlePublish(delay = false){
    const { affair } = this.props
    if (!this.state.title || this.state.content == ''){
      message.error('发布标题或内容不能为空')
      return
    }
    const officialIdList = this.getOfficialList().map((v) => v.roleId)
    const chosenMap = this.state.isAddingReceiver
      ?
      this._choosePublishTarget.getChosenList()
      :
    {
      inAffair: [],
      inAlliance: [],
      outAlliance: []
    }
    const urlMap = {}
    this.state.src.map((v, k) => {
      urlMap[k] = {
        data: {
          src: v,
        },
        mutability: 'IMMUTABLE',
        type: 'MEDIA',
      }
    })
    fetch(config.api.task.announcement.post(), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-SIMU-AffairId': affair.get('id'),
        'X-SIMU-RoleId': affair.get('roleId')
      },
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      body: JSON.stringify({
        title: this.state.title,
        taskId: '0',
        isTop: 0,
        publicType: this.state.publicSwitchOn ? 0 : 3,
        authority: officialIdList,
        tag: JSON.stringify(this.state.tags),
        effectiveTime: delay ? this.state.delayTime.getTime() : null,
        failureTime: null,
        type: 1,
        content: JSON.stringify({
          blocks: [{
            data: [],
            depth: 0,
            entityRanges: [],
            text: this.state.content,
            type: 'unstyled',
            key: genKey(),
          }],
          entityMap: urlMap,
        }),
        ...chosenMap,
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0 || json.code == 20000){
        this.props.onClose()
      }
    })
  },

  renderDelayTitle() {
    return (
      <div className={styles.title}>
        <div>创建发布</div>
      </div>
    )
  },
  renderDelayFooter() {
    return (
      <div className={styles.footer}>
        <Button type="ghost" onClick={() => this.setState({ step: PUBLISH_STEP, delayTime: this.getDefaultDelayTime() })}>上一步</Button>
        <Button type="primary" onClick={() => this.handlePublish(true)}>确定</Button>
      </div>
    )
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
      notification.error({
        message: '标签长度应为2-12个字符'
      })
      return
    }
    if (tags.length >= 8) {
      notification.error({
        message: '至多添加8个标签'
      })
      return
    }
    if (tags.some((v) => v == this.state.tag)) {
      notification.error({
        message: '标签不能重复'
      })
      return
    }
    tags.push(this.state.tag)
    this.setState({
      isBtnClicked: false,
      isAddingTag: false,
      tag: '',
    })
  },
  handleDelayDateChange(v) {

    // const delayTimeDatePart = new Date(this.state.delayTime)
    // delayTimeDatePart.setHours(0, 0, 0, 0)
    this.setState({
      // delayTime: new Date(v.getTime() + this.state.delayTime.getTime() - delayTimeDatePart.getTime()),
      delayTime: v,
    })
  },
  handleDeleteImage(key){
    let { src } = this.state
    src = src.filter((v, k) => {return k != key})
    this.setState({
      src
    })
  },
  render(){
    const { src } = this.state
    return this.state.step == PUBLISH_STEP
				?
  <Modal maskClosable={false} wrapClassName={styles.normalPublishContainer}
    closable={false} footer={[]} visible
  >
    <div className={styles.body}>
      <div className={styles.header}>
        <span className={styles.left}>创建发布</span>
        <div className={styles.right}>
          <span className={styles.key}>公开:</span>
          <Switch checkedChildren="开" unCheckedChildren="关" checked={this.state.publicSwitchOn} onChange={() => this.setState({ publicSwitchOn: !this.state.publicSwitchOn })}/>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.titleAndMember}>
          <span className={styles.title}>发布标题:</span>
          <Input style={{ height: 32 }} onChange={this.handleTitleChange} value={this.state.title}/>
          <span className={styles.member}>官方:</span>
          <OfficialListComponent
            officialList={this.getOfficialList()}
            roleId={this.props.affair.get('roleId')}
            affairId={parseInt(this.props.affair.get('id'))}
            onAddOfficial={this.handleAddOfficial}
            onDeleteOfficial={this.handleDeleteOfficial}
          />
        </div>
        <div className={styles.show}>
          <textarea className={styles.input} onChange={(e) => {
            this.setState({ content: e.target.value })
          }} value={this.state.content}
          />
          <div className={styles.img}>
            {
										src.map((v, k) => {
  return <div className={styles.listItem} key={k}>
    <img src={v} />
    <div className={styles.mask}>
      <span onClick={this.handleDeleteImage.bind(null, k)}>删除</span>
    </div>
  </div>
})
										}
            {
                      this.state.src.length < 9
                        ?
                          <div className={styles.btn} onClick={() => this.refs.uploader.click()}>
                            <AddIcon height="20px" fill="#cccccc"/>
                            <input type="file" onChange={this.handleUpload} className={styles.file} ref="uploader"
                              accept={['image/jpg', 'image/jpeg', 'image/png']} onClick={(e) => {
                                e.target.value = null
                              }}
                            />
                          </div>
                        : null
                    }
          </div>
        </div>
        <div className={styles.tag}>
          <div className={styles.title}>标签:</div>
          <div className={styles.list}>
            {
                      this.state.tags.map((v, k) => {
                        return <div className={styles.tagContainer} key={k}>
                          <Tag>{v}</Tag>
                          <div className={styles.removeTagMask} onClick={this.handleRemoveTag.bind(null, v)}>移除</div>
                        </div>
                      })
                    }
            {
                      this.state.isAddingTag
                        ?
                          <div className={styles.addtagContainer} onClick={(e) => {e.stopPropagation()}}>
                            <Input maxLength="12" className={styles.tagInput} placeholder="标签内容" onChange={this.handleTaginputChange} onBlur={this.handleTaginputBlur} onPressEnter={this.handleAddTag} ref="tagInput"/>
                            <i onClick={this.handleAddTag}>+</i>
                          </div>
                        :
                          <Button type="dashed" className={styles.btn} onClick={() => {this.setState({ isAddingTag: true })}}>+</Button>
                    }
            <div style={{ clear: 'both' }} />
          </div>
        </div>
        {
                  this.state.isAddingReceiver
                    ?
                      <div className={styles.receiver}>
                        <span className={styles.text}>发布接收方:</span>
                        <ChoosePublishTarget affair={this.props.affair} ref={(ref) => this._choosePublishTarget = ref} allianceId={this.props.affair.get('allianceId')} roleId={this.props.affair.get('roleId')} affairId={parseInt(this.props.affair.get('id'))}/>
                      </div>
                    :
                      <span className={styles.addReceiver} onClick={() => {this.setState({ isAddingReceiver: true })}}>+添加接收方</span>
                }
      </div>
      <div className={styles.footer}>
        <div className={styles.right}>
          <Button type="ghost" className={styles.cancel} onClick={() => {
            this.props.onClose()
          }}
          >取消</Button>
          <Button type="ghost" className={styles.normal} onClick={() => this.setState({ step: SELECT_DELAY_TIME_STEP })}>延时发布</Button>
          <Button type="primary" className={styles.normal} onClick={() => this.handlePublish()}>确认发布</Button>
        </div>
      </div>
    </div>
  </Modal>
        :
        this.state.step == SELECT_DELAY_TIME_STEP
            ?
            //延时发布
              <Modal
                width={500}
                wrapClassName={styles.delayPublishModal}
                footer={this.renderDelayFooter()}
                title={this.renderDelayTitle()}
                closable={false}
                visible
              >
                <div className={styles.delayPublishContent}>
                  <DatePicker showTime format="YYYY-MM-DD HH:mm" value={moment(this.state.delayTime, 'YYYY-MM-DD HH:mm')} onChange={this.handleDelayDateChange} disabledDate={(current) => current && current.getTime() < Date.now()}/>
                </div>
              </Modal>
            :
            null
  }

})

export default NormalPublishModal
