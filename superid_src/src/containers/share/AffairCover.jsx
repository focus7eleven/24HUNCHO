import React from 'react'
import styles from './AffairCover.scss'
import { LogoIcon, NextIcon, VideoPlay } from 'svg'
import classNames from 'classnames'
import { Motion, spring } from 'react-motion'

const AffairCover = React.createClass({
  getDefaultProps() {
    return {
      covers: [],
    }
  },
  getInitialState() {
    return {
      sliderDelta: 0,
      currentSelectedCoverIndex: 0,
    }
  },

  renderCover() {
    const {
      covers
    } = this.props

    let cover = null
    // 展示当前封面
    if (covers && covers.length == 0) {
      cover = (
        <div className={styles.cover}>
          <LogoIcon width="170"/>
        </div>
      )
    } else {
      const selectedCover = covers[this.state.currentSelectedCoverIndex]
      const play = function() {
        let video = document.getElementById('videoplayer')

        if (video.paused) {
          video.play()
          document.getElementById('videoplay').style.display = 'none'
        } else {
          document.getElementById('videoplay').style.display = 'block'
          video.pause()
        }
      }

      cover = (
        <div className={styles.cover}>
          {
            selectedCover.type ? (
              <img src={covers[this.state.currentSelectedCoverIndex].url} />
            ) : (
              <div className={styles.videoDiv}>
                <div style={{ zIndex: 99 }} onClick={() => {play()}}><VideoPlay width={60} height={60}/></div>
                <video className={styles.videoPic} id="videoplayer" src={selectedCover.url} />
              </div>
            )
          }
          <div className={styles.coverDescription}>
            {covers[this.state.currentSelectedCoverIndex].description}
          </div>
        </div>
      )
    }

    return cover
  },
  renderSlider() {
    const { covers } = this.props

    return (
      <div className={styles.coverSlider}>
        {/* 向左移动 */}
        <span className={styles.prevIcon} onClick={() => this.setState({ sliderDelta: Math.max(this.state.sliderDelta - 1, 0) })}>
          <NextIcon height="23" fill={this.state.sliderDelta === 0 ? '#d9d9d9' : '#9b9b9b'} />
        </span>

        <Motion style={{ x: spring(this.state.sliderDelta * 108) }}>
          {({ x }) => {
            return (
              <div className={styles.sliderContent}>
                {
                  covers.map((cover, index) => {
                    let content = null
                    if (cover.type == 1) {
                      // 图片封面
                      content = (
                        <img src={cover.url} />
                      )
                    } else if (cover.type == 0) {
                      // 视频封面
                      content = (
                        <video src={cover.url} />
                      )
                    }

                    return (
                      <div
                        key={index}
                        className={classNames(styles.sliderCover, this.state.currentSelectedCoverIndex === index ? styles.activeSliderCover : null)}
                        style={{ transform: `translate3d(-${x}px,0,0)` }}
                        onClick={() => {
                          if (document.getElementById('videoplay')) {
                            const video = document.getElementById('videoplayer')
                            video.pause()
                            document.getElementById('videoplay').style.display = 'block'
                          }
                          this.setState({ currentSelectedCoverIndex: index })
                        }}
                      >
                        {content}
                      </div>
                    )
                  })
                }
              </div>
            )
          }}
        </Motion>

        {/* 向右移动 */}
        <span className={styles.nextIcon} onClick={() => this.setState({ sliderDelta: Math.min(Math.max(covers.length - 4, 0), this.state.sliderDelta + 1) })}>
          <NextIcon height="23" fill={this.state.sliderDelta === covers.length - 4 ? '#d9d9d9' : '#9b9b9b'} />
        </span>
      </div>
    )
  },
  render() {
    return (
      <div className={classNames(styles.container, this.props.className)}>
        {this.renderCover()}
        {this.renderSlider()}
      </div>
    )
  }
})

export default AffairCover
