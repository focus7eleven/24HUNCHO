import moment from 'moment'
import React, { PropTypes } from 'react'
import { Modal, Input, DatePicker, Button, Switch, message, notification, Tag } from 'antd'
import OfficialListComponent from '../announcement/OfficialListComponent'
import styles from './PublishTaskModal.scss'
import AnnouncementEditor from '../announcement/AnnouncementEditor'
import ChoosePublishTarget from './ChoosePublishTarget'
import config from '../../config'
import _ from 'underscore'
import messageHandler from 'messageHandler'

const PUBLISH_STEP = 'PUBLISH_STEP'
const SELECT_DELAY_TIME_STEP = 'SELECT_DELAY_TIME_STEP'

const PublishTaskModal = React.createClass({
  propTypes: {
    affair: PropTypes.object.isRequired,
    taskId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
  },
  getInitialState() {
    return {
      title: '',
      publicSwitchOn: false,
      selectedMainRoleList: [],
      delayTime: this.getDefautDelayTime(),
      step: PUBLISH_STEP,
      role: null,
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
  getDefautDelayTime() {
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

  handleTitleChange(e) {
    if (e.target.value.length > 50) return

    this.setState({
      title: e.target.value,
    })
  },
  handlePublish(useDelay = false) {
    if (!this.state.title || JSON.parse(this.refs.editor.getWrappedInstance().getContent()).blocks[0].text == '') {
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

    fetch(config.api.task.announcement.post(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      body: JSON.stringify({
        title: this.state.title,
        taskId: this.props.taskId,
        isTop: 0,
        publicType: this.state.publicSwitchOn ? 0 : 3,
        content: this.refs.editor.getWrappedInstance().getContent(),
        authority: officialIdList,
        tag: JSON.stringify(this.state.tags),
        effectiveTime: useDelay ? this.state.delayTime.getTime() : null,
        failureTime: null,
        type: 0,
        ...chosenMap,
      }),
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code === 0) {
        this.props.onClose()
      }
    })
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
  handleDelayDateChange(v) {

    // const delayTimeDatePart = new Date(this.state.delayTime)
    // delayTimeDatePart.setHours(0, 0, 0, 0)
    this.setState({
      // delayTime: new Date(v.getTime() + this.state.delayTime.getTime() - delayTimeDatePart.getTime()),
      delayTime: v,
    })
  },
  handleDelayTimeChange(v) {
    const delayTimeDatePart = new Date(this.state.delayTime)
    delayTimeDatePart.setHours(0, 0, 0, 0)
    const w = new Date(v)
    w.setHours(0, 0, 0, 0)

    this.setState({
      delayTime: new Date(delayTimeDatePart.getTime() + (v - w) ),
    })
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
  renderHeader() {
    return (
      <div className={styles.header}>
        <div className={styles.headerItem}>
          <p>发布标题：</p>
          <Input style={{ width: 300 }} onChange={this.handleTitleChange} value={this.state.title} />
        </div>
        <div className={styles.headerItem}>
          <p>官方：</p>
          <OfficialListComponent officialList={this.getOfficialList()} roleId={this.props.affair.get('roleId')} affairId={parseInt(this.props.affair.get('id'))} onAddOfficial={this.handleAddOfficial} onDeleteOfficial={this.handleDeleteOfficial}/>
        </div>
      </div>
    )
  },
  renderFooter() {
    return (
      <div className={styles.footer}>
        <Button type="ghost" onClick={this.props.onClose}>取消</Button>
        <Button type="ghost" onClick={() => this.setState({ step: SELECT_DELAY_TIME_STEP })}>延时发布</Button>
        <Button type="primary" onClick={() => this.handlePublish()}>确认发布</Button>
      </div>
    )
  },
  renderTitle() {
    return (
      <div className={styles.title}>
        <div>创建发布</div>
        <div className={styles.publicSwitch}>
          <span>公开：</span>
          <Switch checkedChildren="开" unCheckedChildren="关" checked={this.state.publicSwitchOn} onChange={() => this.setState({ publicSwitchOn: !this.state.publicSwitchOn })} />
        </div>
      </div>
    )
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
        <Button type="ghost" onClick={() => this.setState({ step: PUBLISH_STEP, delayTime: this.getDefautDelayTime() })}>上一步</Button>
        <Button type="primary" onClick={() => this.handlePublish(true)}>确定</Button>
      </div>
    )
  },
  renderTag(){
    return <div className={styles.tag}>
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
  },
  renderAcceptor() {
    return this.state.isAddingReceiver
        ?
          <div className={styles.receiver}>
            <span className={styles.text}>发布接收方:</span>
            <ChoosePublishTarget ref={(ref) => this._choosePublishTarget = ref} allianceId={this.props.affair.get('allianceId')} roleId={this.props.affair.get('roleId')} affairId={parseInt(this.props.affair.get('id'))} affair={this.props.affair} />
          </div>
        :
          <div className={styles.addReceiver} onClick={() => {this.setState({ isAddingReceiver: true })}}>+添加接收方</div>
  },
  render() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return (
      <div>
        {/* 创建发布 */}
        <Modal
          width={900}
          footer={this.renderFooter()}
          title={this.renderTitle()}
          closable={false}
          wrapClassName={styles.modal}
          visible={this.state.step === PUBLISH_STEP}
        >
          <div className={styles.container}>
            {this.renderHeader()}

            <AnnouncementEditor
              hideTitleInput
              hideFooter
              className={styles.editor}
              controlClassName={styles.eidtorControl}
              ref="editor"
              affair={this.props.affair}
              title={this.state.title}
            />
            {this.renderTag()}
            {this.renderAcceptor()}
          </div>
        </Modal>

        {/* 选择延时时间 */}
        <Modal
          width={500}
          wrapClassName={styles.delayPublishModal}
          footer={this.renderDelayFooter()}
          title={this.renderDelayTitle()}
          closable={false}
          visible={this.state.step === SELECT_DELAY_TIME_STEP}
        >
          <div className={styles.delayPublishContent}>
            <DatePicker showTime format="YYYY-MM-DD HH:mm" value={moment(this.state.delayTime, 'YYYY-MM-DD HH:mm')} onChange={this.handleDelayDateChange} disabledDate={(current) => current && current.getTime() < Date.now()} />

            {/*
              <TimePicker
                value={this.state.delayTime}
                onChange={this.handleDelayTimeChange}
                format="HH:mm"
                disabledHours={() => this.state.delayTime.toDateString() === new Date().toDateString() ? _.range(new Date().getHours()) : []}
                disabledMinutes={() => this.state.delayTime.toDateString() === new Date().toDateString() ? _.range(new Date().getMinutes() + 1) : []}
              >
              </TimePicker>
            */}
          </div>
        </Modal>
      </div>
    )
  }
})

export default PublishTaskModal
