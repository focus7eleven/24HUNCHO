import React, { PropTypes } from 'react'
import classNames from 'classnames'
import { MenkorIcon } from 'svg'
import styles from './AffairAvatar.scss'

//todo 这里最后一种是失效事务,不是层级
export const SLOGAN_BG_COLORS = ['#7e34f0', '#f89218', '#4aaaff', '#40c176', '#f5b6a1', '#9cb1ef', '#ffe97e', '#d8d8d8']
const SLOGAN_RATIO = 0.3

const Slogan = React.createClass({
  propTypes: {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    affair: PropTypes.object.isRequired,
    scale: PropTypes.number.isRequired,
  },
  componentDidMount() {
    this.refs.canvas.getContext('2d').scale(this.props.scale, this.props.scale)
    this.updateCanvas()
  },
  componentDidUpdate() {
    this.updateCanvas()
  },
  getCanvasFrame() {
    return {
      width: this.props.width * this.props.scale * 2,
      height: this.props.height * this.props.scale * SLOGAN_RATIO * 2,
    }
  },
  updateCanvas() {
    let {
      affair,
    } = this.props

    const {
      width,
      height,
    } = this.getCanvasFrame()
    const fontSize = width / (this.props.scale * 5) - this.props.scale
    const ctx = this.refs.canvas.getContext('2d')
    const slogans = affair.get('shortName').slice(0, 5)
    ctx.fillStyle = SLOGAN_BG_COLORS[affair.get('level') - 2]
    ctx.fillRect(0, 0, width, height)
    ctx.font = `normal normal 800 ${fontSize}px "Microsoft YaHei", "PingFang SC", "Arial"`
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.fillText(slogans, width / 4, height / 2 - fontSize / 2)
  },
  render() {
    const {
      width,
      height,
    } = this.props

    return <canvas ref="canvas" style={{ width: width, height: height * SLOGAN_RATIO }} {...this.getCanvasFrame()} />
  }
})

const noop = () => {}
const AffairAvatar = React.createClass({
  propTypes: {
    affair: PropTypes.object.isRequired,
    sideLength: PropTypes.number.isRequired,
    className: PropTypes.string,
    withSlogan: PropTypes.bool, // 预览时自定义是否显示事务头像下方的简写。
    previewURL: PropTypes.string, // 预览时提供的事务头像图片。
    onClick: PropTypes.func,
  },
  getDefaultProps() {
    return {
      className: '',
      withSlogan: true,
      previewURL: null,
      onClick: noop,
    }
  },
  getInitialState() {
    return {
      fillingColor: 'rgba(255, 255, 255, 1)',
    }
  },
  componentWillReceiveProps(nextProps) {
    if (this.getAvatarUrl(this.props) !== this.getAvatarUrl(nextProps)) {
      this.setState({
        fillingColor: 'rgba(255, 255, 255, 1)',
      })
    }
  },

  handleLoadLogo(e) {
    if (this.refs.bg) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, img.width, img.height)
        const pixelData = ctx.getImageData(0, 0, 1, 1).data

        this.setState({
          fillingColor: `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`,
        })
      }
      img.src = e.target.src
    }
  },
  getAvatarUrl(props) {
    return props.affair.get('avatar')
  },

  render() {
    const {
      affair,
      sideLength,
      className,
      withSlogan,
      previewURL,
    } = this.props
    const style = {
      width: sideLength,
      height: sideLength,
      backgroundColor: this.state.fillingColor,
    }

    // 来自事务列表的 affair
    let isRoot = affair.get('level') == 1
    let avatarUrl = previewURL ? previewURL : this.getAvatarUrl(this.props)
    let slogans = affair.get('shortName')

    return (
      <div className={classNames(className, styles.container)} style={style} onClick={this.props.onClick}>
        {avatarUrl ?
          withSlogan ?
            <img onLoad={this.handleLoadLogo} ref="bg" src={avatarUrl} style={{ height: style.height * (1 - SLOGAN_RATIO * 0), width: style.width }}/>
          :
            <img onLoad={this.handleLoadLogo} ref="bg" src={avatarUrl} style={{ height: style.height, width: style.width }}/>
          :
            <MenkorIcon />
        }

        {withSlogan && slogans && !isRoot ? <Slogan width={style.width} height={style.height} scale={2} affair={affair} marginRatio={sideLength / 40} /> : null}
      </div>
    )
  },
})

export default AffairAvatar
