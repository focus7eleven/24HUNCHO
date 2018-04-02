import React, { PropTypes } from 'react'
import styles from './BoardCard.scss'
import { Popover } from 'antd'

const colorTheme = ['#4990e2', '#f55b6c', '#66b966']
const textTheme = ['发布', 'BUG', '需求']
const BoardCard = React.createClass({
  propTypes: {
    content: PropTypes.object.isRequired,
  },
  getTimeStr(time){
    let date = new Date(time)
    let minStr = date.getMinutes() > 9 ? date.getMinutes() : `0${date.getMinutes()}`
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${minStr}`
  },
  renderMemberPopover(){
    const list = this.props.content.joinOfficials
    return <div className={styles.memberContainer}>
      {
				list.map((v, k) => {
  return <div className={styles.row} key={k}>
    <img src={v.avatar} className={styles.avatar} />
    <span className={styles.roleTitle}>{v.roleTitle}-{v.username}</span>
  </div>
})
			}
    </div>
  },
  getTimeTitle(){
    let { content } = this.props
    if (content.state == 0){
      if (content.isDraft == 0){
        return '预计发布时间'
      }
      if (content.isDraft == 1){
        return '最后修改时间'
      }
    }
    if (content.state == 1){
      return '发布时间'
    }
    if (content.state == 2){
      return '完成时间'
    }
    if (content.state == 3){
      return '失效时间'
    }
  },
  render(){
    let { content } = this.props
    content.joinOfficials = content.joinOfficials.filter((v) => {return v != null})
    return <div className={styles.boardCardContainer}>
      <div className={styles.top}>
        <span className={styles.type} style={{ border: `1px solid ${colorTheme[content.plateType]}`, color: colorTheme[content.plateType] }}>{textTheme[content.plateType]}</span>
        <span className={styles.title}>{content.title}</span>
      </div>
      <div className={styles.member}>
        <span className={styles.officialText}>官方:</span>
        {
					content.joinOfficials.length == 1 ?
  <div className={styles.singleAvatar}>
    <img src={content.joinOfficials[0].avatar} className={styles.avatar}/>
    <span className={styles.roleTitle}>{content.joinOfficials[0].roleTitle}</span>
    <span>{content.joinOfficials[0].username}</span>
  </div>
					:
  <Popover trigger="hover" content={this.renderMemberPopover()} overlayClassName={styles.memberPopover}>
    <div className={styles.moreAvatar}>
      {
								content.joinOfficials.map((v, k) => {
  if (k < 8){
    return <img src={v.avatar} className={styles.avatar} style={{ position: 'relative', left: `-${k * 12}px`, zIndex: 10 - k }} key={k}/>
  }
})
							}
    </div>
  </Popover>

				}
      </div>
      {content.time && (
        <div className={styles.time}>
          { this.getTimeTitle() }
          &nbsp;
          { `${this.getTimeStr(content.time)}` }
        </div>
      )}
    </div>
  }
})

export default BoardCard
