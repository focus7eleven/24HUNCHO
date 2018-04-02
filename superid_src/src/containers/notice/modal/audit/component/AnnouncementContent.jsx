import React from 'react'
import { Map } from 'immutable'
import { inlineStyleMap, getBlockStyle, getBlockRender } from '../../../../announcement/EditorControl'
import { Editor, EditorState, convertFromRaw } from 'draft-js'
import EditorDecorator from '../../../../announcement/EditorDecorator'
import styles from './AnnouncementContent.scss'
import AvatarGroup from './AvatarGroup'
import Avatar from './Avatar'

const PUBLIC_NAME_LIST = ['公开', '盟内可见', '事务内可见', '本事务可见', '私密']

const AnnouncementContent = React.createClass({
  getInitialState(){
    return {
      contentData: null,
    }
  },
  getDefaultProps(){
    return {
      content: null,
    }
  },
  componentWillMount(){
    const { content } = this.props
    let contentData = Map()
    content.forEach((v) => {
      const key = v.key
      const value = v.value
      contentData = contentData.set(key, value)
    })
    this.setState({
      contentData,
    })
  },
  renderDetail(contents, type){
    let contentState = contents ? convertFromRaw(JSON.parse(contents)) : convertFromRaw(EditorState.createEmpty(EditorDecorator).getCurrentContent())
    const editorState = EditorState.createWithContent(contentState, EditorDecorator)
    const content = JSON.parse(contents)

    let imgList = []
    if (type == 1){
      let entityMap = content.entityMap

      for (let v in entityMap){
        if (entityMap[v].data){
          imgList.push(<img src={entityMap[v].data.src} key={v}/>)
        }
      }
    }

    return (
      <div className={styles.body}>
        <Editor
          className={styles.draftEditor}
          blockRendererFn={getBlockRender.bind(this)}
          blockStyleFn={getBlockStyle}
          editorState={editorState}
          customStyleMap={inlineStyleMap}
          readOnly
        />
        {type == 1 &&
          <div className={styles.imgGroup}>
            {imgList}
          </div>
        }
      </div>
    )
  },
  render(){
    const { contentData } = this.state
    const tagShow = false // 目前还没有tags,这里假数据先隐藏掉
    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.title}>{contentData.get('标题')}
            <span style={{ color: '#9b9b9b', fontWeight: 'normal' }}>（{PUBLIC_NAME_LIST[contentData.get('公开性')]}）</span>
          </div>
        </div>
        <div className={styles.wrapper}>
          <div className={styles.guest}>
            官方：
            <AvatarGroup users={contentData.get('官方')}/>
            {/* users={contentData.users} */}
          </div>
        </div>
        <div className={styles.wrapper}>
          <div className={styles.content}>
            {this.renderDetail(contentData.get('内容'), contentData.get('类型'))}
          </div>
        </div>
        <div className={styles.wrapper}>
          <div className={styles.imageGroup}>
            <div /><div />
          </div>
        </div>
        {tagShow &&
          <div className={styles.wrapper}>
            <div className={styles.tagGroup}>
              <div className={styles.tag}>思目创意</div>
              <div className={styles.tag}>团建</div>
            </div>
          </div>
        }
        {contentData.get('接收方').length != 0 &&
          <div className={styles.wrapper}>
            接收方
            {contentData.get('接收方').map((v, k) => {
              return (
                <div className={styles.receivers} key={k}>
                  <Avatar src={v.avatar} textList={[v.text]} key={k}/>
                </div>
              )
            })}
          </div>
        }
      </div>
    )
  },
})

export default AnnouncementContent
