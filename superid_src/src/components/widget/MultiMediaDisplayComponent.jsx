import React from 'react'
import styles from './MultiMediaDisplayComponent.scss'
const MIME_TYPE = {
  VIDEO: /(mp4$)/i,
  IMAGE: /(jpg$)|(jpeg$)|(png$)/i,
  AUDIO: /(mp3$)/i,
  DOC: /(doc$)|(docx$)/,
  whichType: function (type){
    if (this.VIDEO.test(type)){
      return 'VIDEO'
    } else if (this.IMAGE.test(type)){
      return 'IMAGE'
    } else if (this.AUDIO.test(type)){
      return 'AUDIO'
    } else if (this.DOC.test(type)){
      return 'WORD'
    } else {
      return 'OTHER'
    }
  }
}
const MultiMediaDisplayComponent = React.createClass({
  getDefaultProps(){
    return {
      url: 'http://simucy.oss-cn-shanghai.aliyuncs.com/test.scss/media.mp4',
      style: { width: '400px', height: '400px' }
    }
  },
  renderMedia(){
    let type = MIME_TYPE.whichType.call(MIME_TYPE, this.props.url)
    switch (type) {
      case 'VIDEO':
        return (
          <video className={styles.media} controls>
            <source src={this.props.url}/>
          </video>
        )
      case 'AUDIO':
        return (
          <audio controls>
            <source className={styles.media} src={this.props.url}/>
          </audio>
        )
      case 'IMAGE':
        return <img className={styles.media} src={this.props.url}/>
      case 'WORD':
        // return <iframe style={{width:'100%',height:'100%'}} src="http://docs.google.com/gview?url=http://simucy.oss-cn-shanghai.aliyuncs.com/test/media.doc&embedded=true"></iframe>
        return <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${this.props.url}`} width="100%" height="100%" frameBorder="0">This is an embedded <a target="_blank" href="http://office.com">Microsoft Office</a> document, powered by <a target="_blank" href="http://office.com/webapps">Office Online</a>.</iframe>
      case 'OTHER':
        return (
          <object className={styles.media} data={this.props.url} />
        )
      default:
        return null
    }
  },
  render(){
    return (
      <div style={this.props.style}>
        {this.renderMedia()}
      </div>
    )
  }
})

export default MultiMediaDisplayComponent
