import React from 'react'
import classNames from 'classnames'
import { Input, Icon, Modal, DatePicker, Button } from 'antd'
import Highlighter from 'react-highlight-words'

import emojione from 'emojione.js'
import currencyFormatter from '../../utils/currencyWrap'
import { getFileType, getFileTypeIcon } from 'filetype'
import { CloseIcon, File, Material, Money, ImageUpLoad, VideoConference, ClockIcon, RMBIcon, AssetIcon } from 'svg'
import config from '../../config'
import styles from './ChatRecordPanel.scss'
import { relativeTime } from 'time'


const Search = Input.Search
const { RangePicker } = DatePicker
const CHAT_SUBTYPE = window.SocketClient.Constants.CHAT_SUBTYPE
const DEFAULT_AVATOR = 'http://superid-public.oss-cn-shanghai.aliyuncs.com/person_default.png'
const MESSAGE_TYPES = {
  TEXT: CHAT_SUBTYPE.DEFAULT,
  FILE: CHAT_SUBTYPE.FILE,
  IMAGE: CHAT_SUBTYPE.IMAGE,
  VIDEO: CHAT_SUBTYPE.VIDEO.INVITATION,
  FUND: CHAT_SUBTYPE.FUND.SEND,
  MATERIAL: CHAT_SUBTYPE.MATERIAL.SEND,
  TIME: 'TIME'
}
const PAGE_SIZE = 25

export default class ChatRecordPanel extends React.Component {

  static defaultProps = {
    isGroup: false, // 是否群聊
    visible: false, // 是否显示
    group: null, // 群聊讨论组信息
    members: [], // 讨论组内成员
  }

  constructor(props) {
    super(props)
  }

  state = {
    keyword: '',
    searchType: MESSAGE_TYPES.TEXT,
    placeholder: '搜索关键词',
    messageList: [],
    hasMore: true,
    isLoadingMore: false,
    pageNumber: 0,
    startTime: 0,
    endTime: 0,
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.group || nextProps.group.key !== this.props.group.key) {
      this.props.close()
      this.setState({
        hasMore: true,
        isLoading: false,
        keyword: '',
        searchType: MESSAGE_TYPES.TEXT,
        placeholder: '搜索关键词',
        messageList: [],
        pageNumber: 0,
        startTime: 0,
        endTime: 0,
      })
    }
  }

  fetchSearch = (value, pageNumber = 0) => {
    const { group, affair } = this.props
    const { searchType } = this.state
    return new Promise((resolve) => {
      fetch(config.api.chat.message.search(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        body: JSON.stringify({
          chatId: group.key,
          query: value,
          subType: searchType,
          pageRequest: {
            pageNumber,
            pageSize: PAGE_SIZE
          }
        })
      }).then((res) => res.json()).then((res) => {
        resolve(res)
      })
    })
  }

  handleSearchInput = (value) => {
    if (value.trim() === '') {
      this.setState({
        messageList: [],
        keyword: value,
        hasMore: true,
        pageNumber: 0,
      })
      return 
    }
    this.fetchSearch(value).then((res) => {
      this.setState({ 
        messageList: res.data,
        keyword: value,
        hasMore: true,
        pageNumber: 0,
      })
    })
  }

  handleChangeSearchType = (type, placeholder) => {
    let messageList = []
    if (type === MESSAGE_TYPES.IMAGE) {
      this.setState({
        searchType: type,
        placeholder,
        keyword: '',
        messageList
      }, () => {
        this.fetchSearch(null).then((res) => {
          this.setState({
            messageList: res.data,
            hasMore: true,
            pageNumber: 0,
          })
        })
      })
      
    } else {
      this.setState({
        searchType: type,
        placeholder,
        keyword: '',
        messageList,
        hasMore: true,
        pageNumber: 0,
      })
    }
    
  }

  downloadFile = (url) => {
    let link = document.createElement('a')
    if (typeof link.download === 'string') {
      link.download = true
      link.href = url
      link.target = '_blank'
      document.body.appendChild(link) // Firefox requires the link to be in the body
      link.click()
      document.body.removeChild(link) // remove the link when done
    } else {
      location.replace(url)
    }
  }

  // 预览图片
  handlePreviewImage(url, name) {
    Modal.info({
      className: styles.imageModal,
      maskClosable: true,
      content: (
        <div>
          <img className={styles.imagePreviewer} src={url} title={name}/> 
        </div>
      ),
    })
  }

  handleChangeTimeRange = (dates) => {
    const { group, affair } = this.props
    const times = dates.map((m) => m.toDate().getTime())
    fetch(config.api.chat.message.search(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify({
        chatId: group.key,
        startTime: times[0],
        endTime: times[1],
        pageRequest: {
          pageNumber: 0,
          pageSize: PAGE_SIZE
        }
      })
    }).then((res) => res.json()).then((res) => {
      this.setState({
        messageList: res.data.filter((msg) => msg.sub !== CHAT_SUBTYPE.IMAGE),
        endTime: times[1],
        startTime: times[0]
      })
    })
  }

  handleLoadMore = () => {
    const { affair, group } = this.props
    const { startTime, endTime, keyword, pageNumber, messageList, searchType } = this.state
    
    this.setState({ isLoadingMore: true })
    if (searchType === MESSAGE_TYPES.TIME) {
      fetch(config.api.chat.message.search(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        body: JSON.stringify({
          chatId: group.key,
          startTime,
          endTime,
          pageRequest: {
            pageNumber: pageNumber + 1,
            pageSize: PAGE_SIZE,
          }
        })
      }).then((res) => res.json()).then((res) => {
        this.setState({
          isLoadingMore: false,
          messageList: messageList.concat(res.data.filter((msg) => msg.sub !== CHAT_SUBTYPE.IMAGE)),
          pageNumber: pageNumber + 1,
          hasMore: res.data.length === PAGE_SIZE
        })
      })
    } else {
      this.fetchSearch(keyword, pageNumber + 1).then((res) => {
        this.setState({
          isLoadingMore: false,
          messageList: messageList.concat(res.data.filter((msg) => msg.sub !== CHAT_SUBTYPE.IMAGE)),
          pageNumber: pageNumber + 1,
          hasMore: res.data.length === PAGE_SIZE
        })
      })
    }
  }

  renderHighlight = (content, keyword) => {
    if (keyword === '') {
      return content
    }
    
    return (
      <Highlighter
        highlightClassName="superid-chat-highlight-text"
        searchWords={[keyword]}
        autoEscape
        textToHighlight={content}
      />
    )
  }

  renderMessageContent = (message, key) => {
    const { members } = this.props
    const { keyword } = this.state
    const role = members.find((m) => m.id === message.fromRoleId)
    const roleName = role ? role.roleTitle + '-' + role.username : message.name
    const roleAvatar = role ? role.avatar : DEFAULT_AVATOR

    let content

    switch (message.sub) {
      case CHAT_SUBTYPE.DEFAULT:
        return (
          <div className={styles.textMessage} key={key}>
            <div className={styles.avatar}>
              <img src={roleAvatar} />
            </div>
            <div className={styles.right}>
              <div className={styles.title}>
                <span className="name">{roleName}</span>
                <span>{relativeTime(message.time)}</span>
              </div>
              <div className={styles.content}>
                
                {this.renderHighlight(emojione.shortnameToUnicode(message.content), keyword)}
              </div>
            </div>   
          </div>     
        )
      case CHAT_SUBTYPE.FUND.SEND:
        content = JSON.parse(message.content)
        return (
          <div className={styles.fundMessage} key={key}>
            <div className={styles.top}>
              <div className={styles.avatar}>
                <img src={roleAvatar} />
              </div>
              <div className={styles.title}>
                <span className="name">{roleName}</span>
              </div>
              <div className={styles.time}>
                <span>{relativeTime(message.time)}</span>
              </div>
            </div>
            
            <div className={styles.content}>
              <div className={styles.fundIcon}>
                <RMBIcon width={22} height={22} fill={'#ffffff'}/>
              </div>
              <div className={styles.fundInfo}>
                <div className="money">{currencyFormatter.format(content.amount, { code: content.currency })}</div>
                <div className="remark">{content.remark}</div>
              </div>
              
            </div>   
          </div>     
        )
      case CHAT_SUBTYPE.FILE:
        content = JSON.parse(message.content)
        return (
          <div className={styles.fileMessage} key={key}>
            <div className={styles.top}>
              <div className={styles.avatar}>
                <img src={roleAvatar} />
              </div>
              <div className={styles.title}>
                <span className="name">{roleName}</span>
              </div>
              <div className={styles.time}>
                <span>{relativeTime(message.time)}</span>
              </div>
            </div>
            
            <div className={styles.content} onClick={() => this.downloadFile(content.url)}>
              <div className={styles.fileIcon}>
                {getFileTypeIcon(getFileType(content.name))}
              </div>
              <div className={styles.fileInfo}>
                <div className="remark">{content.name}</div>
              </div>
              
            </div>   
          </div>     
        )
      case CHAT_SUBTYPE.IMAGE:
        content = JSON.parse(message.content)
        if (this.state.searchType !== MESSAGE_TYPES.IMAGE) {
          return null
        }

        return (
          <div className={styles.imageMessage} key={key} onClick={() => this.handlePreviewImage(content.url, content.name)}>
            <img src={content.url} />
          </div>
        )
      case CHAT_SUBTYPE.MATERIAL.SEND:
        content = JSON.parse(message.content)
        return (
          <div className={styles.materialMessage} key={key}>
            <div className={styles.top}>
              <div className={styles.avatar}>
                <img src={roleAvatar} />
              </div>
              <div className={styles.title}>
                <span className="name">{roleName}</span>
              </div>
              <div className={styles.time}>
                <span>{relativeTime(message.time)}</span>
              </div>
            </div>
            
            <div className={styles.content}>
              <div className={styles.materialIcon}>
                <AssetIcon width={22} height={22} fill={'#ffffff'}/>
              </div>
              <div className={styles.materialInfo}>
                <div className="remark">{content.remark}</div>
              </div>
              
            </div>   
          </div>     
        )
      case CHAT_SUBTYPE.VIDEO.INVITATION:
        content = JSON.parse(message.content)
        return (
          <div className={styles.textMessage} key={key}>
            <div className={styles.avatar}>
              <img src={roleAvatar} />
            </div>
            <div className={styles.right}>
              <div className={styles.title}>
                <span className="name">{roleName}</span>
                <span>{relativeTime(message.time)}</span>
              </div>
              <div className={styles.content}>
                {'发起了视频会议'}
              </div>
            </div>   
          </div>     
        )
      default:
        return null
    }
  }

  renderSearchInput = (type, placeholder) => {
    if (type === MESSAGE_TYPES.IMAGE) {
      return null
    }

    if (type === MESSAGE_TYPES.TIME) {
      return (
        <RangePicker 
          size={'default'} 
          style={{ width: 270, height: 28 }}
          onChange={this.handleChangeTimeRange}
        />
      )
    }

    return (
      <Search
        placeholder={placeholder}
        onSearch={this.handleSearchInput}
        style={{ width: 270, height: 28 }}
      />
    )
  }

  render() {
    const { visible } = this.props
    const { placeholder, keyword, searchType, messageList, isLoadingMore, hasMore } = this.state
    
    return (
      <div
        className={classNames({
          [styles.modalPanel]: true,
          [styles.chatRecordPanel]: true,
          'visible': visible
        })}
      >
        <div className={styles.panelHeader}>
          <div className={styles.title}>
            {searchType === MESSAGE_TYPES.TEXT ?
              <span>查找聊天记录</span>
                :
              <span style={{ cursor: 'pointer' }} onClick={() => this.handleChangeSearchType(MESSAGE_TYPES.TEXT, '搜索关键词')}><Icon type="left" />返回</span>
            }
          </div>
          <div className={styles.close} onClick={() => this.props.close()}>
            <CloseIcon />
          </div>
        </div>
        <div className={styles.search}>
          {this.renderSearchInput(searchType, placeholder)}
        </div>
        {((searchType === MESSAGE_TYPES.TEXT) && (keyword === '')) ? 
          <div className={styles.types}>
            <div className={styles.typeItem} onClick={() => this.handleChangeSearchType(MESSAGE_TYPES.FUND, '搜索资金')}>
              <Money height={21} width={21}/>资金
            </div>
            <div className={styles.typeItem} onClick={() => this.handleChangeSearchType(MESSAGE_TYPES.MATERIAL, '搜索物资')}>
              <Material height={21} width={21}/>物资
            </div>
            <div className={styles.typeItem} onClick={() => this.handleChangeSearchType(MESSAGE_TYPES.VIDEO, '搜索视频邀请')}>
              <VideoConference height={18} width={18}/>视频邀请
            </div>
            <div className={styles.typeItem} onClick={() => this.handleChangeSearchType(MESSAGE_TYPES.FILE, '搜索文件')}>
              <File height={21} width={21}/>文件
            </div>
            <div className={styles.typeItem} onClick={() => this.handleChangeSearchType(MESSAGE_TYPES.IMAGE, '搜索图片')}>
              <ImageUpLoad height={14} width={14} style={{ marginLeft: '4px', marginRight: '7px' }}/>图片
            </div>
            <div className={styles.typeItem} onClick={() => this.handleChangeSearchType(MESSAGE_TYPES.TIME, '搜索时间')}>
              <ClockIcon height={16} width={16} />时间
            </div>
          </div> : null
        }
        <div className={styles.panelContent}>
          <div className={classNames(styles.contentWrapper, searchType === MESSAGE_TYPES.IMAGE ? 'image' : '')}>
            {messageList.map((message, key) => {
              return this.renderMessageContent(message, key)    
            })}
          </div>     
          {
            messageList.length ?
              <div className={styles.loadMore}>
                {
                  hasMore ?
                    <Button type="primary" onClick={this.handleLoadMore} loading={isLoadingMore}>加载更多</Button>
                    :
                    <span>没有更多了</span>
                }
              </div>
              :
              null
          }
        </div>
      </div>
    )
  }
}