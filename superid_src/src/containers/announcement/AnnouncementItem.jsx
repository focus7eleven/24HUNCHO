import React from 'react'
import { bindActionCreators } from 'redux'
import styles from './AnnouncementItem.scss'
import { connect } from 'react-redux'
import { message } from 'antd'
import { TagIcon, ChatIcon, SprigIcon } from 'svg'
import { announcementTime } from 'time'
import config from '../../config'
import messageHandler from 'messageHandler'
import { pushURL } from 'actions/route'  

const MAX_WORDCOUNT = 150
const AnnouncementItem = React.createClass({

  propTypes: {
    announcement: React.PropTypes.object.isRequired,
    hideFromLabel: React.PropTypes.bool,
  },
  getDefaultProps() {
    return {
      hideFromLabel: false,
    }
  },

  handleModifyStuck(){
    const { announcement } = this.props
    fetch(config.api.announcement.isTop.update(announcement.get('announcementId'), announcement.get('isTop') ? 0 : 1, this.props.affairMemberId), {
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        message.success('修改成功')
        this.props.onUpdate(announcement.set('isTop', announcement.get('isTop') ? false : true))
      }
    })
  },
  renderAnnouncementTitle() {
    const {
      announcement,
    } = this.props

    if (announcement.get('title')) {
      return announcement.get('title').length > 30 ? announcement.get('title').slice(30) + '...' : announcement.get('title')
    } else {
      return '无标题'
    }
  },

  render(){
    const {
      announcement,
      hideFromLabel,
    } = this.props

    let thumbContent, entityMap
    let imgList = []
    //富文本type为0 普通文本type为1
    try {
      thumbContent = announcement.get('type') == 0 ?
        (announcement.get('thumbContent') || '')
      :
        (JSON.parse(announcement.get('thumbContent')).blocks[0].text || '')

      entityMap = announcement.get('type') == 1 ?
        JSON.parse(announcement.get('thumbContent')).entityMap
      :
        null
      for ( let v in entityMap) {
        if (entityMap[v].data) {
          imgList.push(<img src={entityMap[v].data.src} key={v}/>)
        }
      }
    } catch (e) {
      /* 如果解析失败，则设置内容为thumbcontent */
      thumbContent = announcement.get('thumbContent')
    }

    return (
      <div className={styles.container}>
        <div >
          <div className={styles.header}>
            {announcement.get('isTop') ? <div className={styles.fixedToTopContainer}><span className={styles.fixedToTop}>置顶</span>
            </div> : null}
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => {
              this.props.pushURL(`/workspace/affair/${announcement.get('affairId')}/announcement/detail/${announcement.get('announcementId')}`)
            }}
            >
              {
                announcement.get('type') == 0 ?
                  <div className={styles.titleIcon}>文章</div>
                  : null
              }
              {this.renderAnnouncementTitle()}

            </div>
            <div className={styles.sprig} style={{ backgroundColor: announcement.get('isTop') ? '#f6a623' : '#cccccc' }} onClick={this.handleModifyStuck}>
              <SprigIcon />
            </div>
          </div>
          <div className={styles.announcer}>
            <div className={styles.avatar}>{announcement.get('avatar') ? <img src={announcement.get('avatar')}/> : null}</div>
            <span className={styles.name}>{announcement.get('roleName')}—</span>
            <span className={styles.role}>{announcement.get('affairName')}</span>
          </div>

          {/* 发布简要内容 */}
          {
            announcement.get('type') == 0 ?
              <div className={styles.body} ref="announcementBody">
                <div className={styles.left} style={{ width: JSON.parse(announcement.get('entityMap'))[0] ? 520 : 100 }}>
                  {thumbContent.length > MAX_WORDCOUNT ? thumbContent.slice(0, MAX_WORDCOUNT) + '...' : thumbContent}
                </div>
                {
                  JSON.parse(announcement.get('entityMap'))[0] ?
                    <div className={styles.right}>
                      {
                        JSON.parse(announcement.get('entityMap'))[0].data.type ?
                          <video preload="metadata" src={JSON.parse(announcement.get('entityMap'))[0].data.src} />
                          :
                          <img src={JSON.parse(announcement.get('entityMap'))[0].data.src}/>
                      }
                    </div>
                    :
                    null
                }
              </div>
              :
              <div className={styles.body} ref="announcementBody">
                {thumbContent.length > MAX_WORDCOUNT ? thumbContent.slice(0, MAX_WORDCOUNT) + '...' : thumbContent}
              </div>
          }

          {
              announcement.get('type') == 1
                  ?
                    <div className={styles.imgList}>
                      {imgList}
                    </div>
                  : null
            }
        </div>

        <div className={styles.footer}>
          <div className={styles.leftFoot}>
            <span>{announcementTime(announcement.get('modifyTime'))}</span>
            <span><ChatIcon width="12px" height="12px" fill="#cccccc" />会话({announcement.get('conversations') || 0})</span>
            {/* TODO: Tags */}
            <span><TagIcon width="12px" height="12px" fill="#cccccc" />标签1，标签2，标签3</span>
          </div>

          {/* 来自某事物 */}
          {!hideFromLabel ? <div className={styles.rightFoot}>
              来自: {announcement.get('affairName')}
          </div> : null}
        </div>
      </div>
    )
  }
})

function mapStateToProps() {
  return {}
}

function mapDispatchToProps(dispatch) {
  return {
    pushURL: bindActionCreators(pushURL, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AnnouncementItem)
