import React, { PropTypes } from 'react'
import styles from './ModifyPublishModal.scss'
import { Modal, Input, Button, message, notification } from 'antd'
import { AddIcon } from 'svg'
import config from '../../config'
import AnnouncementEditor from './AnnouncementEditor'
import oss from 'oss'


const ModifyPublishModal = React.createClass({
  propTypes: {
    announcement: PropTypes.object.isRequired,
  },
  getDefaultProps(){
    return {
      announcement: {},
    }
  },
  getInitialState(){
    return {
      imgList: [],
      text: '',
      title: '',
    }
  },
  componentDidMount(){
    const content = JSON.parse(this.props.announcement.get('content'))

    if (this.props.announcement.get('type') == 1){
      let imgList = []
      for (var v in content.entityMap){
        if (content.entityMap[v].data){
          imgList.push(content.entityMap[v].data.src)
        }
      }
      this.setState({
        imgList,
        text: content.blocks[0].text,
        title: this.props.announcement.get('title'),
      })
    }
    else if (this.props.announcement.get('type') == 0){
      this.setState({
        title: this.props.announcement.get('title'),
      })
    }

  },
  handleCancel(){
    this.props.callback()
  },
  handleOk(){
    const { announcement, affair } = this.props
    //变更普通发布
    if (announcement.get('type') == 1){
      if (this.state.text == '' || this.state.title == ''){
        message.error('发布标题或内容不能为空')
        return
      }
      else {
        const urlMap = {}
        this.state.imgList.map((v, k) => {
          urlMap[k] = {
            data: {
              src: v
            },
            mutability: 'IMMUTABLE',
            type: 'MEDIA',
          }
        })
        let form = new FormData()
        form.append('announcementId', announcement.get('announcementId'))
        form.append('title', this.state.title)
        form.append('affairMemberId', affair.get('affairMemberId'))
        form.append('contentState', JSON.stringify({
          blocks: [{
            data: [],
            depth: 0,
            text: this.state.text,
            type: 'unstyled',
            entityRanges: [],
            key: JSON.parse(announcement.get('content')).blocks[0].key,
          }],
          entityMap: urlMap,
        }))

        fetch(config.api.announcement.version.post, {
          method: 'POST',
          credentials: 'include',
          body: form,
          affairId: affair.get('id'),
          roleId: affair.get('roleId'),
        }).then((res) => res.json()).then((json) => {
          if (json.code == 0){
            this.props.callback()
          }
        })
      }
    }
    //变更富文本发布
    else if (announcement.get('type') == 0){
      if (this.state.title == ''){
        message.error('发布标题不能为空')
        return
      }
      else {
        let form = new FormData()
        form.append('announcementId', announcement.get('announcementId'))
        form.append('title', this.state.title)
        form.append('affairMemberId', affair.get('affairMemberId'))
        form.append('contentState', this.refs.editor.getWrappedInstance().getContent())
        // console.log(this.refs.editor.getWrappedInstance().getContent())
        // console.log(typeof(this.refs.editor.getWrappedInstance().getContent()))
        fetch(config.api.announcement.version.post, {
          method: 'POST',
          credentials: 'include',
          body: form,
          affairId: affair.get('id'),
          roleId: affair.get('roleId'),
        }).then((res) => res.json()).then((json) => {
          if (json.code == 0){
            this.props.callback()
          }
        })
      }
    }
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
      let { imgList } = this.state
      imgList.push(`${result.host}/${result.path}`)
      this.setState({
        imgList: imgList
      })
    })
  },
  handleDeleteImage(key){
    let { imgList } = this.state
    imgList = imgList.filter((v, k) => {return k != key})
    this.setState({
      imgList
    })
  },
  renderNormalPublish(){
    const { imgList } = this.state
    return (
      <div className={styles.show}>
        <textarea className={styles.input} value={this.state.text} onChange={(e) => {this.setState({ text: e.target.value })}} />
        <div className={styles.imgList}>
          {
            imgList.map((v, k) => {
              return <div className={styles.listItem} key={k}>
                <img src={v} />
                <div className={styles.mask}>
                  <span onClick={this.handleDeleteImage.bind(null, k)}>删除</span>
                </div>
              </div>
            })
          }
          {
            imgList.length < 9
              ?
                <div className={styles.btn} onClick={() => this.refs.uploader.click()}>
                  <AddIcon height="24px" fill="#cccccc" />
                  <input type="file" onChange={this.handleUpload} className={styles.file} ref="uploader"
                    accept={['image/jpg', 'image/jpeg', 'image/png', 'image/gif']} onClick={(e) => {
                      e.target.value = null
                    }}
                  />
                </div>
              :
              null
          }

        </div>
      </div>
    )
  },
  renderEditorPublish(){
    const { announcement, affair } = this.props
    return (
      <div className={styles.show} style={{ padding: '0px' }}>
        <AnnouncementEditor announcementToEdit={announcement.toJS()} affairMemberId={affair.get('affairMemberId')}
          affair={this.props.affair} ref="editor" hideTitleInput
          hideFooter
        />
      </div>
    )
  },
  render(){
    const { announcement } = this.props
    return (
      <Modal
        visible
        wrapClassName={styles.modifyPublishContainer}
        width={900}
        maskClosable={false}
        closable={false}
        footer={[
          <Button key="0" className={styles.cancel} onClick={this.handleCancel} type="ghost">取消</Button>,
          <Button key="1" className={styles.ok} onClick={this.handleOk} type="primary">确认变更</Button>
        ]}
      >
        <div className={styles.body}>
          <div className={styles.header}>
            <span>变更发布</span>
          </div>
          <div className={styles.content}>
            <div className={styles.title}>
              <span className={styles.key}>发布标题:</span>
              <Input value={this.state.title} onChange={(e) => {this.setState({ title: e.target.value })}}/>
            </div>
            {announcement.get('type') == 1 ? this.renderNormalPublish() : this.renderEditorPublish()}
          </div>
        </div>
      </Modal>
    )
  },
})

export default ModifyPublishModal
