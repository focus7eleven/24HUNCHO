import React, { PropTypes } from 'react'
import { Map, List } from 'immutable'
import { Button, Switch, Popconfirm, Tooltip, Modal, message as Messager } from 'antd'
import styles from './ConferenceContainer.scss'
import { DropUpIcon, DropDownIcon, Logo, VideoFinish, VideoSuspension, FullScreen, EnterBoardIcon } from 'svg'
import ConferenceChat, { SystemMessage } from './ConferenceChat'
import TimerMixin from 'react-timer-mixin'
import DetectRTC from 'detectrtc'
import MemberChooser from './MemberChooser'
import ConferenceNotificationList, { REFUSE_APPLY_TYPE, NO_MIC, GRANT_SCREEN, APPLY_SCREEN } from './ConferenceNotificationList'
import BoardContainer from './board/BoardContainer'

try {
  require('!erizo') // eslint-disable-line
} catch (e) {
  console.warn('Not support WebRTC.') // eslint-disable-line
}

const Erizo = window.Erizo

const W = window.innerWidth
const H = window.innerHeight

const VideoPanel = React.createClass({
  shouldComponentUpdate(nextProps) {
    return this.props.elementId !== nextProps.elementId
  },

  componentDidMount() {
    const {
      elementId,
      stream,
    } = this.props

    stream.play(elementId)
  },

  componentDidUpdate(prevProps) {
    const {
      elementId,
      stream,
    } = this.props

    prevProps.stream.stop()
    stream.play(elementId)
  },

  render() {
    const {
      elementId,
      hidden
    } = this.props
    const style = {
      width: '100%',
      height: '100%',
    }
    if (hidden) {
      style.display = 'none'
    }

    return (
      <div
        id={elementId}
        style={style}
      />
    )
  }
})

const ScreenPlayer = React.createClass({
  shouldComponentUpdate(nextProps) {
    return this.props.elementId !== nextProps.elementId
  },

  render() {
    const {
      elementId,
      stream,
    } = this.props

    if (!stream) {
      return null
    }

    return (
      <div
        id={elementId}
        style={{
          width: '100%',
          height: '100%',
        }}
        ref={() => {
          if (!stream._removed) {
            try {
              stream.show(elementId)
            } catch (e) {
              return
            }
          }
        }}
      />
    )
  }
})

const ConferenceContainer = React.createClass({
  propTypes: {
    conference: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    fetchConferenceInformation: PropTypes.func.isRequired,
    remindAttendeeJoin: PropTypes.func.isRequired,
    inviteOthers: PropTypes.func.isRequired,
    endConference: PropTypes.func.isRequired,
    role: PropTypes.object.isRequired,
    affair: PropTypes.object.isRequired,
  },
  mixins: [TimerMixin],
  getInitialState() {
    return {
      localStream: null,
      dataMap: Map(), // WebRTC 的数据交流
      streams: List(),
      room: null, // Licode room

      attendeePanelIsOpen: false, // 展开或收起参与者的面板
      suspensionMode: false,
      deltaX: 0,
      deltaY: 0,

      // TODO: 录制视频的计时
      recordDuration: 0,

      notificationList: List(),

      openInviteOthersModal: false,

      showWhiteBoard: false, // 显示白板
      boardListener: null, // 白板消息监听

      localScreenStream: null, // 桌面分享流
      shareScreen: false, // 是否分享桌面
      remoteShareScreen: false, // 远程桌面分享
      remoteScreenStreamId: '', // 远程桌面流 ID
    }
  },
  componentDidMount() {
    // 获取当前会议的基本信息
    this.props.fetchConferenceInformation(this.props.conference.get('conferenceId'), this.props.affair.get('roleId'))

    // 初始化本地的视频流
    this.initializeLocalStream(true, true)

    // 开始视频录制的计时
    this.setInterval(() => {
      this.setState({
        recordDuration: this.state.recordDuration + 1,
      })
    }, 1000)
  },

  initializeLocalStream(audio, video) {
    let localStream = Erizo.Stream({
      audio,
      video,
      data: true,
      attributes: {
        user: this.props.user.toJS(),
        isHost: false,
        muteAudio: false,
        role: this.props.role.toJS(),
      },
    })

    localStream.init()

    this.setState({
      localStream,
    }, () => {
      if (!audio && !video) {
        this.initializeRoom(this.props.conference.get('roomToken'))
      }

      localStream.addEventListener('access-accepted', () => {
        this.initializeRoom(this.props.conference.get('roomToken'))
      })
      localStream.addEventListener('access-denied', () => {
        this.initializeLocalStream(false, false)
      })
    })
  },

  addBoardListener(listener) {
    this.boardListener = listener
  },

  removeBoardListener() {
    this.boardListener = null
  },

  initializeRoom(token) {
    const room = Erizo.Room({ token: token })
    const { localStream } = this.state
    this.setState({
      room: room,
    })

    function subscribeToStreams(streams) {
      streams
        .filter((v) => (v.getID() !== localStream.getID()))
        .filter((v) => v.getAttributes())
        .forEach((v) => room.subscribe(v))
    }

    room.addEventListener('room-connected', (roomEvent) => {
      const options = { metadata: { type: 'publisher' } }
      room.publish(localStream, options)

      subscribeToStreams(roomEvent.streams)
    })

    room.addEventListener('stream-added', (streamEvent) => {
      subscribeToStreams([streamEvent.stream])
    })

    room.addEventListener('stream-subscribed', (streamEvent) => {
      const stream = streamEvent.stream

      const streams = this.state.streams.push(stream)
      this.setState({
        streams,
      })

      stream.addEventListener('stream-data', (evt) => {
        const {
          msg,
        } = evt
        const attributes = stream.getAttributes()
        const boardListener = this.boardListener

        switch (msg.type) {
          case 'APPLY_FOR_HOST':
            new Promise((resolve, reject) => {
              if (this.state.localStream.getAttributes().isHost) {
                this.setState({
                  notificationList: this.state.notificationList.push(Map({
                    id: Date.now(),
                    type: APPLY_SCREEN,
                    proposer: `${attributes.role.roleName}${attributes.user.username}`,
                    agreeCb: resolve,
                    refuseCb: reject,
                  }))
                })
              } else {
                reject()
              }
            }).then(() => {
              this.state.localStream.sendData({
                type: 'I_WILL_BE_THE_HOST',
                payload: {
                  streamId: msg.payload.streamId,
                },
              })
              this.setState({
                notificationList: this.state.notificationList.filter((v) => v.get('type') !== APPLY_SCREEN)
              })
            }).catch(() => {
              this.state.localStream.sendData({
                type: 'I_HAVE_BEEN_REJECTED',
                payload: {
                  streamId: msg.payload.streamId,
                },
              })
              this.setState({
                notificationList: this.state.notificationList.filter((v) => v.get('type') !== APPLY_SCREEN)
              })
            })
            break
          case 'MEMBERS_UPDATE':
            this.props.fetchConferenceInformation(this.props.conference.get('conferenceId'), this.props.affair.get('roleId'))
            break

          case 'I_AM_THE_HOST':
            this.handleChangeHost(msg.payload.streamId)
            break
          case 'MUTE_AUDIO':
            this.handleMuteAudio(msg.payload.streamId, msg.payload.muteAudi)
            break
          case 'I_HAVE_BEEN_REJECTED':
            if (msg.payload.streamId === this.state.localStream.getID()) {
              this.setState({
                notificationList: this.state.notificationList.push(Map({
                  type: REFUSE_APPLY_TYPE,
                  id: Date.now,
                })),
              })
            }
            break
          case 'I_WILL_BE_THE_HOST':
            if (msg.payload.streamId === this.state.localStream.getID()) {
              this.setState({
                notificationList: this.state.notificationList.push(Map({
                  type: GRANT_SCREEN,
                  id: Date.now(),
                }))
              })
            }

            this.setTimeout(() => {
              this.setState({
                notificationList: this.state.notificationList.filter((v) => v.get('type') !== GRANT_SCREEN)
              })
              this.state.localStream.sendData({
                type: 'I_AM_THE_HOST',
                payload: {
                  streamId: msg.payload.streamId,
                },
              })
              this.handleChangeHost(msg.payload.streamId)
            }, 10000)
            break
          case 'SHARE_SCREEN':
            this.setState({
              remoteShareScreen: true,
              remoteScreenStreamId: msg.payload.streamId
            })
            break
          case 'CLOSE_SCREEN':
            this.setState({
              remoteShareScreen: false,
              remoteScreenStreamId: ''
            })
            break
          case 'BOARD_MSG':
            boardListener && boardListener(msg.content)
            break
          default:
            // 其他自定义的数据（聊天）
            this.setState({
              dataMap: this.state.dataMap.update(
                stream.getID(),
                (data) => (data || Map()).update(evt.msg.type, (items) => !items ? List([evt.msg.payload]) : items.push(evt.msg.payload)),
              )
            })
            break
        }
      })

      this.setState({
        dataMap: this.state.dataMap.set(stream.getID(), Map())
      })
    })

    room.addEventListener('stream-removed', (streamEvent) => {
      const stream = streamEvent.stream
      stream._removed = true

      if (stream) {
        this.setState({
          streams: this.state.streams.filter((v) => v.getID() !== stream.getID())
        })
      }
    })

    room.connect()
  },
  getCurrentHostStream() {
    const streams = this.state.streams || List()

    return streams.find((v) => {
      const attributes = v.getAttributes()
      return attributes && attributes.isHost
    })
  },
  getFrameAnimation() {
    if (this.state.suspensionMode) {
      return {
        width: '36vw',
        height: '40vh',
        top: 0.54 * H + this.state.deltaY,
        left: 0.6 * W + this.state.deltaX,
      }
    } else {
      return {
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }
    }
  },
  getCurrentPublishStream() {
    return List(this.state.localStream ? [this.state.localStream] : [])
      .concat(this.state.streams)
      .find((v) => !!v.getAttributes().isHost)
  },

  handleChangeHost(streamId) {
    const localStream = this.state.localStream
    const attributes = localStream.getAttributes()
    attributes.isHost = localStream.getID() === streamId
    localStream.setAttributes(attributes)

    if (attributes.isHost) {
      this.state.notificationList.push(Map({
        type: GRANT_SCREEN,
        id: Date.now(),
      }))
    }

    this.setState({
      streams: this.state.streams.map((stream) => {
        const attributes = stream.getAttributes()
        attributes.isHost = stream.getID() === streamId
        stream.setAttributes(attributes)

        return stream
      }),
      localStream,
    })
  },
  handleMuteAudio(streamId, muteAudio) {
    const localStream = this.state.localStream
    if (localStream.getID() === streamId) {
      const attributes = localStream.getAttributes()
      attributes.muteAudio = muteAudio
      localStream.setAttributes(attributes)
    }

    this.setState({
      streams: this.state.streams.map((stream) => {
        if (stream.getID() === streamId) {
          const attributes = stream.getAttributes()
          attributes.muteAudio = muteAudio
          stream.setAttributes(attributes)
        }

        return stream
      }),
      localStream,
    })
  },
  handleSendData(data) {
    this.state.localStream.sendData(data)
  },
  handleMouseDown(evt) {
    const {
      clientX,
      clientY,
    } = evt

    this._isDragging = true
    this._currentX = clientX
    this._currentY = clientY
  },
  handleMouseMove(evt) {
    evt.preventDefault()
    evt.stopPropagation()

    const {
      clientX,
      clientY,
    } = evt

    if (!this._isDragging) return

    this.setState({
      deltaX: this.state.deltaX + (clientX - this._currentX),
      deltaY: this.state.deltaY + (clientY - this._currentY),
    })
    this._currentX = clientX
    this._currentY = clientY
  },
  handleMouseUp() {
    this._isDragging = false
  },
  handleMouseLeave() {
    this._isDragging = false
  },
  handleApplyForHost() {
    DetectRTC.load(() => {
      if (DetectRTC.hasWebcam === false) {
        Messager.error('无法获取摄像头')
        return
      }

      const message = SystemMessage({
        message: `${this.props.role.get('roleName')}-${this.props.user.get('username')} 申请使用屏幕`,
        timestamp: Date.now(),
        messageType: 'SystemMessage',
      })
      this.handleSendData({
        type: 'message',
        payload: {
          content: message,
        },
      })
      this.setState({
        dataMap: this.state.dataMap.update(
          this.state.localStream.getID(),
          (data) => (data || Map()).update('message', (items) => !items ? List([{ content: message.toJS() }]) : items.push({ content: message.toJS() })),
        )
      })


      const {
        localStream
      } = this.state

      const hostStream = this.getCurrentPublishStream()

      if (hostStream) {
        localStream.sendData({
          type: 'APPLY_FOR_HOST',
          payload: {
            streamId: localStream.getID(),
          },
        })
      } else {
        this.handleChangeHost(localStream.getID())

        localStream.sendData({
          type: 'I_AM_THE_HOST',
          payload: {
            streamId: localStream.getID(),
          },
        })
      }
    })
  },
  handleMuteAll() {
    this.setState({
      notificationList: this.state.notificationList.push(Map({
        id: Date.now(),
        type: NO_MIC,
      }))
    })
  },
  handleCloseNofication(notification) {
    this.setState({
      notificationList: this.state.notificationList.filter((v) => v.get('id') !== notification.get('id'))
    })
  },

  renderVideoHeader() {
    const conference = this.props.conference

    return (
      <div className={styles.videoPanelHeader}>
        <Logo />

        <div className={styles.videoTheme}>
          <div>{conference.get('name')}</div>
          {
            conference.get('chatGroupName') ? (
              <p>{`来自${conference.get('chatGroupName')}的视频通话`}</p>
            ) : null
          }
        </div>

        <div className={styles.recordingStatus}><span />视频录制中</div>
      </div>
    )
  },
  handleInviteOthers() {
    const {
      affair,
      conference,
    } = this.props
    const selectedRole = this._memberChooser.getSelectedRole()

    if (selectedRole.size) {
      this.props.inviteOthers(affair.get('id'), affair.get('allianceId'), selectedRole.map((v) => v.get('id')).toJS(), affair.get('roleId'), conference.get('conferenceId'))
        .then((res) => {
          if (res.code === 0) {
            this.props.fetchConferenceInformation(conference.get('conferenceId'), affair.get('roleId'))

            this.handleSendData({
              type: 'MEMBERS_UPDATE',
            })

            this.setState({
              openInviteOthersModal: false,
            })
          }
        })
    }
  },
  handleExitConference() {
    this.state.room && this.state.room.disconnect()
    this.props.endConference()
  },

  handleEnterBoard() {
    const { affair, conference } = this.props
    const roomId = parseInt(conference.get('conferenceId'))
    this.props.enterBoard(affair.get('id'), affair.get('roleId'), roomId, affair.get('allianceId'))
    this.setState({ showWhiteBoard: true, shareScreen: false })
  },

  handleShareScreen() {
    const { localStream, localScreenStream } = this.state

    // 判断是否有使用屏幕的权限
    if (!localStream.getAttributes().isHost) {
      Modal.warning({
        title: '您暂时无权分享桌面，请先申请屏幕。'
      })
      return
    }

    // 已有桌面分享流
    if (localScreenStream) {
      this.setState({
        shareScreen: true,
        showWhiteBoard: false
      }, () => {
        localStream.sendData({
          type: 'SHARE_SCREEN',
          payload: {
            streamId: localScreenStream.getID(),
          }
        })
      })
      return
    }

    // 初始化桌面分享流
    const screenStream = Erizo.Stream({
      video: false,
      screen: true,
      data: true,
      extensionId: 'kdedfbkiogimdecnkbnjdmepelgipoff',
      attributes: {
        screen: true,
        user: this.props.user.toJS(),
        isHost: false,
        role: this.props.role.toJS(),
      },
    })
    screenStream.init()

    // Process after user grant video access.
    const localScreenStreamAccessAccepted = new Promise((resolve) => {
      screenStream.addEventListener('access-accepted', () => {

        this.setState({
          localScreenStream: screenStream
        }, resolve)

      })
    })

    this.setState({
      localScreenStreamAccessAccepted,
    }, () => {
      this.handleChangeLocalStream()
    })
  },

  handleCloseScreenShare() {
    const { localStream } = this.state
    localStream.sendData({
      type: 'CLOSE_SCREEN',
    })
    this.setState({
      shareScreen: false
    })
  },

  handleChangeLocalStream() {
    const { room, localStream, localScreenStream } = this.state

    const options = { metadata: { type: 'publisher' } }
    room.publish(localScreenStream, options, (id) => {
      if (id !== undefined){
        this.setState({
          shareScreen: true,
          showWhiteBoard: false,
          localScreenStream
        }, () => {

          localStream.sendData({
            type: 'SHARE_SCREEN',
            payload: {
              streamId: localScreenStream.getID(),
            },
          })
        })
      }
    })
  },

  renderVideoFooter() {
    const d = this.state.recordDuration
    const { localStream } = this.state
    let muteAudio = false
    // try {
    //   muteAudio = stream.getAttributes().muteAudio
    // } catch(e) {

    // }

    return (
      <div className={styles.videoFooter}>
        <p>{`时长：${~~(d / (10 * 3600))}${~~(d / 3600 % 10)}:${~~(d / (10 * 60)) % 6}${~~(d / 60 % 10)}:${~~(d / 10) % 6}${~~(d % 10)}`}</p>

        <div className={styles.buttonGroup}>
          <Popconfirm onConfirm={this.handleExitConference} placement="top" title="确定结束通话？" overlayClassName={styles.confirmStop}>
            <div>
              <VideoFinish />
              <div>结束通话</div>
            </div>
          </Popconfirm>

          {/* {!this.state.showWhiteBoard ?
            <div onClick={() => this.setState({ suspensionMode: true })}>
              <VideoSuspension />
              <div>悬浮窗模式</div>
            </div> : null
          } */}
          <div onClick={() => this.setState({ suspensionMode: true })}>
            <VideoSuspension />
            <div>悬浮窗模式</div>
          </div>
          

          {/* 进入白板 */}
          {this.state.showWhiteBoard ?
            <div onClick={() => this.setState({ showWhiteBoard: false })}>
              <EnterBoardIcon />
              <div>退出白板</div>
            </div>
              :
            <div onClick={this.handleEnterBoard}>
              <EnterBoardIcon />
              <div>进入白板</div>
            </div>
          }

          {/* 桌面共享 */}
          {/* {this.state.shareScreen ?
            <div onClick={this.handleCloseScreenShare}>
              <ShareScreenIcon fill="#f5a623" />
              <div>停止分享</div>
            </div>
              :
            <div onClick={this.handleShareScreen}>
              <ShareScreenIcon fill="#f5a623" />
              <div>播放桌面</div>
            </div>
          } */}
        </div>

        <div className={styles.mcSwitcher}>
          <p>麦克风</p>
          <Switch
            checkedChildren="开"
            unCheckedChildren="关"
            value={!muteAudio}
            defaultChecked
            onChange={(checked) => {
              localStream.sendData({
                type: 'MUTE_AUDIO',
                payload: {
                  streamId: localStream.getID(),
                  muteAudio: !checked,
                },
              })
            }}
          />
        </div>
      </div>
    )
  },

  renderOthersAudio() {
    const otherStreams = this.state.streams
      .filter((v) => !v.getAttributes().isHost && !v.getAttributes().muteAudio)

    return otherStreams.map((stream) => {
      return (
        <VideoPanel key={stream.getID()} stream={stream} elementId={'' + stream.getID()} hidden />
      )
    })
  },

  renderVideoPanel() {
    const stream = this.getCurrentPublishStream()
    let videoArea = (
      <div style={{ backgroundColor: '#ddd', width: '100%', height: this.state.suspensionMode ? '100%' : 'calc(100% - 152px)' }} />
    )

    if (stream && stream.getAttributes()) {
      const {
        user,
      } = stream.getAttributes()
      const elementId = `stream-id-${user.id}`

      videoArea = (
        <div
          style={{ position: 'relative', backgroundColor: '#ddd', width: '100%', height: this.state.suspensionMode ? '100%' : 'calc(100% - 155px)' }}
        >
          <VideoPanel stream={stream} elementId={elementId} />
          <ConferenceNotificationList className={styles.notificationList} notifications={this.state.notificationList} handleCloseNofication={this.handleCloseNofication} />
        </div>
      )
    }

    // 加入白板
    if (this.state.showWhiteBoard) {
      const { localStream, suspensionMode } = this.state
      const { isHost } = localStream.getAttributes()
      videoArea = (
        <div
          style={{ position: 'relative', backgroundColor: '#fff', width: '100%', height: this.state.suspensionMode ? '100%' : 'calc(100% - 155px)' }}
        >
          <BoardContainer
            suspensionMode={suspensionMode}
            isHost={isHost}
            affair={this.props.affair}
            addListener={this.addBoardListener}
            removeListener={this.removeBoardListener}
            onSendData={this.handleSendData}
          />
        </div>
      )
    }

    // 本地桌面共享
    if (this.state.shareScreen) {
      const screenStream = this.state.localScreenStream
      if (screenStream && screenStream.getAttributes()) {
        const {
          user,
        } = screenStream.getAttributes()
        const screenId = `screen-stream-id-${user.id}`
        videoArea = (
          <div
            style={{ position: 'relative', backgroundColor: '#fff', width: '100%', height: this.state.suspensionMode ? '100%' : 'calc(100% - 155px)' }}
          >
            <ScreenPlayer stream={screenStream} elementId={screenId} />
          </div>
        )
      }
    }

    // 远程桌面播放
    if (this.state.remoteShareScreen) {
      const screenStream = this.state.streams.find((s) => s.getID() === this.state.remoteScreenStreamId)
      if (screenStream && screenStream.getAttributes()) {
        const {
          user,
        } = screenStream.getAttributes()
        const screenId = `screen-stream-id-${user.id}`
        videoArea = (
          <div
            style={{ position: 'relative', backgroundColor: '#fff', width: '100%', height: this.state.suspensionMode ? '100%' : 'calc(100% - 155px)' }}
          >
            <ScreenPlayer stream={screenStream} elementId={screenId} />
          </div>
        )
      }
    }

    return (
      <div className={styles.videoPanel}>
        {!this.state.suspensionMode && this.renderVideoHeader()}
        {videoArea}
        {this.renderOthersAudio()}
        {!this.state.suspensionMode && this.renderVideoFooter()}
      </div>
    )
  },
  renderMemberGroup(members, remindJoin = false) {
    return (
      <div className={styles.memberGroup}>
        {members.map((member, key) => {
          return (
            <div className={styles.member} key={key}>
              {
                remindJoin ? (
                  <Tooltip placement="top" title="点击提醒ta加入" onClick={() => this.props.remindAttendeeJoin(this.props.affair, [member.get('roleId')], this.props.role.get('roleId'), this.props.conference.get('conferenceId'))}>
                    <div className={styles.memberAvatar} style={{ cursor: 'pointer' }}>
                      {member.get('avatar') ? <img src={member.get('avatar')} /> : null}
                    </div>
                  </Tooltip>
                ) : (
                  <div className={styles.memberAvatar}>
                    {member.get('avatar') ? <img src={member.get('avatar')} /> : null}
                  </div>
                )
              }
              <p>{`${member.get('roleTitle')}－${member.get('username')}`}</p>
            </div>
          )
        })}
      </div>
    )
  },
  renderMembers() {
    const {
      attendeePanelIsOpen,
      localStream,
      streams
    } = this.state
    let speaker
    const attributes = localStream.getAttributes()
    const currentStream = this.getCurrentPublishStream()
    const attendees = this.props.conference.get('attendees') || List()
    // 统计当前参与会议人员的列表
    let enteredRoleIds = List()
    enteredRoleIds = enteredRoleIds.push(attributes.role.roleId)
    streams.map((v) => v.getAttributes()).forEach((attributes) => {
      enteredRoleIds = enteredRoleIds.push(attributes.role.roleId)
    })
    const currentAttendees = attendees.filter((v) => enteredRoleIds.find((w) => w == v.get('roleId')))

    if (currentStream) {
      const attr = currentStream.getAttributes()
      speaker = attr.user
      // speaker = speaker.set('roleName', attr.role.get('roleName'))
      speaker.roleName = attr.role.roleName
    }

    return (
      <div className={styles.members}>
        <div className={styles.speakerPanel}>
          {/* 展示发言人 */}
          <div className={styles.speaker}>
            <div className={styles.speakerAvatar}>
              {speaker && speaker.avatar ? <img src={speaker.avatar}/> : null}
            </div>
            <div className={styles.speakerTitle}>
              <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginBottom: 5 }}>发言人</p>
              <p style={{ fontSize: 14, color: 'white' }}>{speaker ? `${speaker.roleName}-${speaker.username}` : '暂无人发言'}</p>
            </div>
          </div>

          {/* 禁麦按钮 */}
          {
            attributes && attributes.isHost ? (
              <Button onClick={this.handleMuteAll}>全员禁麦</Button>
            ) : (
              <Button onClick={this.handleApplyForHost}>申请屏幕</Button>
            )
          }
        </div>

        <div className={styles.attendeePanel}>
          <div className={styles.toggleAttendee} onClick={() => this.setState({ attendeePanelIsOpen: !this.state.attendeePanelIsOpen })}>
            {`参与成员（${currentAttendees.size}/${attendees.size}）`}
            <span>{this.state.attendeePanelIsOpen ? <DropDownIcon /> : <DropUpIcon />}</span>
          </div>
          {/* 正在参与的人 */}
          {attendeePanelIsOpen ? this.renderMemberGroup(currentAttendees) : null}

          {/* 未加入的人 */}
          {attendeePanelIsOpen ? <div>未加入成员</div> : null}
          {attendeePanelIsOpen ? this.renderMemberGroup(attendees.filter((v) => !enteredRoleIds.find((w) => w == v.get('roleId'))), true) : null}

          {/* 邀请其他角色加入 */}
          {attendeePanelIsOpen ? <div className={styles.inviteOthers} onClick={() => this.setState({ openInviteOthersModal: true })}>邀请其他角色加入</div> : null}
        </div>
      </div>
    )
  },
  renderChatPanel() {
    return (
      <div className={styles.chatPanel}>
        {this.renderMembers()}
        <ConferenceChat
          dataMap={this.state.dataMap}
          className={styles.conferenceChat}
          onSendData={this.handleSendData}
          role={new Map({
            avatar: this.props.user.get('avatar'),
            roleName: this.props.role.get('roleName'),
            userName: this.props.user.get('username'),
          })}
        />
      </div>
    )
  },
  renderTipMask() {
    return (
      <div
        className={styles.tipMask}
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
        onMouseUp={this.handleMouseUp}
        onMouseLeave={this.handleMouseLeave}
      >
        <div className={styles.tipContent}>
          <p>tip：点击按住可拖动视频窗口</p>

          <div
            className={styles.fullscreen}
            onClick={() => this.setState({ suspensionMode: false })}
          >
            <FullScreen />
            全屏模式
          </div>
        </div>
      </div>
    )
  },
  renderInviteOthersModal() {
    const {
      user,
      conference,
    } = this.props

    const attendees = conference.get('attendees') || List()
    const inGroupMember = conference.getIn(['groupMember', 'groups']).reduce((r, v) => r.concat(v.get('members')), List()).filter((v) => v.get('id') != user.get('id'))

    if (this.state.openInviteOthersModal) {
      return (
        <Modal
          title="邀请其他角色加入"
          visible
          width={700}
          wrapClassName={styles.inviteOthersModal}
          onCancel={() => this.setState({ openInviteOthersModal: false })}
          onOk={this.handleInviteOthers}
        >
          <MemberChooser
            affair={this.props.affair}
            userId={user.get('id')}
            inGroupMember={inGroupMember.toJS()}
            ref={(ref) => this._memberChooser = ref}
            disabledRoleId={attendees.map((v) => v.get('roleId'))}
          />
        </Modal>
      )
    } else {
      return null
    }
  },

  render() {
    if (!this.state.localStream) {
      return null
    }
    const animation = this.getFrameAnimation()

    return (
      <div className={styles.container} style={animation}>
        {this.renderVideoPanel()}
        {!this.state.suspensionMode && this.renderChatPanel()}
        {this.state.suspensionMode && this.renderTipMask()}
        {this.renderInviteOthersModal()}
      </div>
    )
  }
})

export default ConferenceContainer
