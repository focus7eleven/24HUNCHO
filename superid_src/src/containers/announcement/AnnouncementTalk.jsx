import React from 'react'
import styles from './AnnouncementTalk.scss'
import ChatBox from '../../components/chat/ChatBox'
import material1 from 'images/material1.jpeg'
import _ from 'underscore'
import { Motion, spring } from 'react-motion'


const AnnouncementTalk = React.createClass({
  getInitialState(){
    return {
      chosenId: -1,
      slideTop: 0,
    }
  },
  renderOfficial(){
    const arr = _.range(10)
    const list = arr.map((v, k) => {
      return {
        id: k,
        url: material1,
        name: k,
        msg: '客方回复的消息内容客方回复的消息内容客方回复的消息内容',
      }
    })
    const handleClick = (v) => {
      this.setState({
        chosenId: v.id,
        slideTop: v.id * 44,
      })
    }
    const handleScroll = () => {}

    return (<div className={styles.guestContainer}>
      <Motion style={{ top: spring(this.state.slideTop) }}>
        {(motionstyle) =>
          (<div className={styles.guestList} onWheel={handleScroll}>
            {list.map((v, k) => {
              return (<div className={styles.box} key={k} onClick={handleClick.bind(null, v)}>
                <div className={styles.radius}>
                  <div className={styles.avatar}>
                    <img src={v.url} style={this.state.chosenId == v.id ? { border: '1px solid #926dea', boxShadow: '0 0 0 2px #f0ebf8' } : null} />
                  </div>
                  <div className={styles.content}>
                    <span className={styles.name} style={this.state.chosenId == v.id ? { color: '#926dea' } : null}>{v.name}</span>
                    <span className={styles.msg}>{v.msg}</span>
                  </div>
                </div>
              </div>)
            })}
            <div className={styles.slide} style={{ top: motionstyle.top }} />
          </div>)

                }

      </Motion>

      <div className={styles.rightContainer}>
        <div className={styles.chatContainer}>
          <div className={styles.content}>
            <div className={styles.right}>
              <div className={styles.title}>
                <span>13:04 官方1-角色名称</span>
              </div>
              <div className={styles.msg}>
                <span>1</span>
                <div className={styles.bulge} />
              </div>
              <div className={styles.avatar}>
                <img src={material1}/>
              </div>
            </div>
            <div className={styles.left}>
              <div className={styles.title}>
                <span>13:04 官方1-角色名称</span>
              </div>
              <div className={styles.avatar}>
                <img src={material1}/>
              </div>
              <div className={styles.msg}>
                <span>测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试
                                    内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容</span>
                <div className={styles.bulge} />
              </div>
            </div>
          </div>
          <div className={styles.chatBox}>
            <ChatBox />
          </div>
        </div>
      </div>

    </div>)
  },
  renderGuest(){
    return (<div className={styles.chatContainer}>
      <div className={styles.content}>
        <div className={styles.right}>
          <div className={styles.title}>
            <span>13:04 官方1-角色名称</span>
          </div>
          <div className={styles.msg}>
            <span>1</span>
            <div className={styles.bulge} />
          </div>
          <div className={styles.avatar}>
            <img src={material1}/>
          </div>
        </div>
        <div className={styles.left}>
          <div className={styles.title}>
            <span>13:04 官方1-角色名称</span>
          </div>
          <div className={styles.avatar}>
            <img src={material1}/>
          </div>
          <div className={styles.msg}>
            <span>测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测
                            试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容测试内容</span>
            <div className={styles.bulge} />
          </div>
        </div>
      </div>
      <div className={styles.chatBox}>
        <ChatBox />
      </div>
    </div>)
  },

  render(){
    return (<div className={styles.container}>
      {/*{this.renderGuest()}*/}
      {this.renderOfficial()}
    </div>)

  }
})

export default AnnouncementTalk
