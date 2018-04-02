import React, { PropTypes } from 'react'
import _ from 'underscore'

const processingStyle = { fill: '#A75123' }
const processedStyle = { fill: '#CCCCCC' }

export const IDIdentifyIcon = React.createClass({
  PropTypes: {
    width: PropTypes.number,
    height: PropTypes.number,
    style: PropTypes.object,
    active: PropTypes.bool, //当前步骤是否在这
  },
  getDefaultProps(){
    return {
      width: 60,
      height: 60,
      active: false,
    }
  },
  render(){
    const {
      active
    } = this.props
    return (
      <div style={_.extend({ width: this.props.width, height: this.props.height }, this.props.style)}>
        <svg version="1.1" id="图层_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          viewBox="0 0 48 48" style={{ enableBackground: 'new 0 0 48 48' }} xmlSpace="preserve"
        >
          <g>
            <g>
              <path style={{ fill: '#FFFFFF' }} d="M41.1,9.2c3.4,4,5.5,9.1,5.5,14.8c0,12.5-10.1,22.6-22.6,22.6S1.4,36.5,1.4,24S11.5,1.4,24,1.4
            c3.1,0,6.1,0.6,8.8,1.8"
              />
              <path style={!active ? processedStyle : processingStyle} d="M24,48C10.8,48,0,37.2,0,24S10.8,0,24,0c3.2,0,6.4,0.6,9.3,1.9c0.7,0.3,1.1,1.1,0.8,1.9
            c-0.3,0.7-1.1,1.1-1.9,0.8c-2.6-1.1-5.4-1.7-8.2-1.7C12.3,2.8,2.8,12.3,2.8,24c0,11.7,9.5,21.2,21.2,21.2
            c11.7,0,21.2-9.5,21.2-21.2c0-5.1-1.8-10-5.2-13.8c-0.5-0.6-0.4-1.5,0.1-2c0.6-0.5,1.5-0.4,2,0.1C45.9,12.7,48,18.2,48,24
            C48,37.2,37.2,48,24,48z"
              />
            </g>
            <g>
              <g>
                <path style={!active ? processedStyle : processingStyle} d="M35.7,34c-0.8,0-1.4-0.6-1.4-1.4c0-5.7-4.6-10.3-10.3-10.3c-5.7,0-10.3,4.6-10.3,10.3c0,0.8-0.6,1.4-1.4,1.4
              c-0.8,0-1.4-0.6-1.4-1.4c0-7.2,5.9-13.1,13.1-13.1c7.2,0,13.1,5.9,13.1,13.1C37.1,33.3,36.5,34,35.7,34z"
                />
                <g>
                  <circle style={{ fill: '#FFFFFF' }} cx="24" cy="16" r="4.9"/>
                  <path style={!active ? processedStyle : processingStyle} d="M24,22.3c-3.5,0-6.3-2.8-6.3-6.3s2.8-6.3,6.3-6.3s6.3,2.8,6.3,6.3S27.5,22.3,24,22.3z M24,12.4
                c-1.9,0-3.5,1.6-3.5,3.5c0,1.9,1.6,3.5,3.5,3.5s3.5-1.6,3.5-3.5C27.5,14,25.9,12.4,24,12.4z"
                  />
                </g>
              </g>
              <path style={!active ? processedStyle : processingStyle} d="M24.2,38.4c-7.4,0-12.7-4.7-12.8-4.8c-0.6-0.5-0.6-1.4-0.1-2c0.5-0.6,1.4-0.6,2-0.1l0,0
            c0.4,0.4,10.2,9,21.5-0.1c0.6-0.5,1.5-0.4,2,0.2c0.5,0.6,0.4,1.5-0.2,2C32.2,37.2,27.9,38.4,24.2,38.4z"
              />
            </g>
          </g>
        </svg>
      </div>
    )
  }
})

export const PhoneIdentifyIcon = React.createClass({
  PropTypes: {
    width: PropTypes.number,
    height: PropTypes.number,
    style: PropTypes.object,
    active: PropTypes.bool, //当前步骤是否在这
  },
  getDefaultProps(){
    return {
      width: 60,
      height: 60,
      active: false,
    }
  },
  render(){
    const {
      active
    } = this.props
    return (
      <div style={_.extend({ width: this.props.width, height: this.props.height }, this.props.style)}>
        <svg version="1.1" id="图层_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          viewBox="0 0 48 48" style={{ enableBackground: 'new 0 0 48 48' }} xmlSpace="preserve"
        >
          <g>
            <g>
              <path style={{ fill: '#FFFFFF' }} d="M41.1,9.2c3.4,4,5.5,9.1,5.5,14.8c0,12.5-10.1,22.6-22.6,22.6S1.4,36.5,1.4,24S11.5,1.4,24,1.4
        c3.1,0,6.1,0.6,8.8,1.8"
              />
              <path style={!active ? processedStyle : processingStyle} d="M24,48C10.8,48,0,37.2,0,24S10.8,0,24,0c3.2,0,6.4,0.6,9.3,1.9c0.7,0.3,1.1,1.1,0.8,1.9
        c-0.3,0.7-1.1,1.1-1.9,0.8c-2.6-1.1-5.4-1.7-8.2-1.7C12.3,2.8,2.8,12.3,2.8,24c0,11.7,9.5,21.2,21.2,21.2
        c11.7,0,21.2-9.5,21.2-21.2c0-5.1-1.8-10-5.2-13.8c-0.5-0.6-0.4-1.5,0.1-2c0.6-0.5,1.5-0.4,2,0.1C45.9,12.7,48,18.2,48,24
        C48,37.2,37.2,48,24,48z"
              />
            </g>
            <g>
              <g>
                <path style={!active ? processedStyle : processingStyle} d="M30.1,34.7H17.5c-0.5,0-0.9-0.4-0.9-0.9v-2.5c0-0.5,0.4-0.9,0.9-0.9h12.6c0.5,0,0.9,0.4,0.9,0.9v2.5
        C31,34.2,30.6,34.7,30.1,34.7z"
                />
                <path style={!active ? processedStyle : processingStyle} d="M30.1,36.1H17.5c-1.3,0-2.4-1.1-2.4-2.4v-2.5c0-1.3,1.1-2.4,2.4-2.4h12.6c1.3,0,2.4,1.1,2.4,2.4v2.5
        C32.4,35,31.4,36.1,30.1,36.1z M17.9,33.3h11.7v-1.6H17.9V33.3z"
                />
              </g>
              <path style={!active ? processedStyle : processingStyle} d="M28.1,37.1h-8.1c-2.9,0-5.2-2.3-5.2-5.2V16c0-2.9,2.3-5.2,5.2-5.2h8.1c2.9,0,5.2,2.3,5.2,5.2V32
        C33.2,34.8,30.9,37.1,28.1,37.1z M19.9,13.7c-1.3,0-2.4,1.1-2.4,2.4V32c0,1.3,1.1,2.4,2.4,2.4h8.1c1.3,0,2.4-1.1,2.4-2.4V16
        c0-1.3-1.1-2.4-2.4-2.4H19.9z"
              />
              <ellipse style={{ fill: '#FFFFFF' }} cx="23.8" cy="32.5" rx="1" ry="1"/>
            </g>
          </g>
        </svg>
      </div>
    )
  }
})

export const FinishIcon = React.createClass({
  PropTypes: {
    width: PropTypes.number,
    height: PropTypes.number,
    style: PropTypes.object,
    active: PropTypes.bool, //当前步骤是否在这
  },
  getDefaultProps(){
    return {
      width: 60,
      height: 60,
      active: false,
    }
  },
  render(){
    const {
      active
    } = this.props
    return (
      <div style={_.extend({ width: this.props.width, height: this.props.height }, this.props.style)}>
        <svg version="1.1" id="图层_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          viewBox="0 0 48 48" style={{ enableBackground: 'new 0 0 48 48' }} xmlSpace="preserve"
        >
          <g>
            <path style={!active ? processedStyle : processingStyle} d="M24,48C10.8,48,0,37.2,0,24S10.8,0,24,0c3.2,0,6.4,0.6,9.3,1.9c0.7,0.3,1.1,1.1,0.8,1.9
        c-0.3,0.7-1.1,1.1-1.9,0.8c-2.6-1.1-5.4-1.7-8.2-1.7C12.3,2.8,2.8,12.3,2.8,24c0,11.7,9.5,21.2,21.2,21.2
        c11.7,0,21.2-9.5,21.2-21.2c0-5.1-1.8-10-5.2-13.8c-0.5-0.6-0.4-1.5,0.1-2c0.6-0.5,1.5-0.4,2,0.1C45.9,12.7,48,18.2,48,24
        C48,37.2,37.2,48,24,48z"
            />
            <path style={!active ? processedStyle : processingStyle} d="M21.5,34.5l-10.1-7.3c-0.6-0.5-0.8-1.3-0.3-2c0.5-0.6,1.3-0.8,2-0.3l7.5,5.5c2.1-3.5,8.1-12.7,14.5-16.1
        c0.7-0.4,1.5-0.1,1.9,0.6c0.4,0.7,0.1,1.5-0.6,1.9C29.3,20.6,22.3,33,22.2,33.1L21.5,34.5z"
            />
          </g>
        </svg>
      </div>
    )
  }
})

export const NextIcon = React.createClass({
  PropTypes: {
    width: PropTypes.number,
    height: PropTypes.number,
    style: PropTypes.object,
    active: PropTypes.bool, //当前步骤是否在这
  },
  getDefaultProps(){
    return {
      width: 14,
      height: 22,
      active: false,
    }
  },
  render(){
    const {
      active
    } = this.props
    return (
      <div style={_.extend({ width: this.props.width, height: this.props.height }, this.props.style)}>
        <svg width="13px" height="21px" viewBox="117 13 13 21" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
          <desc>Created with Sketch.</desc>
          <defs />
          <g id="导向" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd" transform="translate(117.000000, 14.000000)">
            <rect id="Rectangle-2" style={!active ? processedStyle : processingStyle} transform="translate(6.505342, 5.801474) rotate(47.000000) translate(-6.505342, -5.801474) " x="-0.494657778" y="4.80147427" width="14" height="2" />
            <rect id="Rectangle-2-Copy" style={!active ? processedStyle : processingStyle} transform="translate(6.274402, 14.405569) rotate(-44.000000) translate(-6.274402, -14.405569) " x="-0.725598441" y="13.4055694" width="14" height="2" />
          </g>
        </svg>
      </div>
    )
  }
})

export const EmailIdentifyIcon = React.createClass({
  PropTypes: {
    width: PropTypes.number,
    height: PropTypes.number,
    style: PropTypes.object,
    active: PropTypes.bool, //当前步骤是否在这
  },
  getDefaultProps(){
    return {
      width: 60,
      height: 60,
      active: false,
    }
  },
  render(){
    const {
      active
    } = this.props
    return (
      <div style={_.extend({ width: this.props.width, height: this.props.height }, this.props.style)}>
        <svg viewBox="0 0 51 51" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
          <title>群组 2</title>
          <desc>Created with Sketch.</desc>
          <defs>
            <rect id="path-1" x="11" y="15" width="25" height="18" rx="4" />
            <mask id="mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="25" height="18" fill="white">
              <use xlinkHref="#path-1" />
            </mask>
            <path d="M20.084874,18.3065319 C21.6502805,16.7507452 24.1834774,14.2169192 25.7452252,12.6447602 L28.7238107,9.64631827 C30.2845298,8.07519481 31.5497426,8.59254594 31.5497426,10.7947318 L31.5497426,20.8011575 C31.5497426,23.0065322 29.7587443,24.7943417 27.5565585,24.7943417 L17.5501327,24.7943417 C15.344758,24.7943417 14.8293396,23.5297698 16.3913678,21.9773407 L20.084874,18.3065319 Z" id="path-3" />
            <mask id="mask-4" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="16.0609946" height="16.0572152" fill="white">
              <use xlinkHref="#path-3" />
            </mask>
          </defs>
          <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            <g id="修改邮箱8" transform="translate(-224.000000, -102.000000)" stroke={!active ? processedStyle.fill : processingStyle.fill}>
              <g id="群组-2-copy" transform="translate(226.000000, 104.000000)">
                <g id="群组-2">
                  <path d="M41.2884215,8.13894782 C44.8513689,12.260211 47.0063162,17.6320005 47.004632,23.5073689 C47.0021057,36.4875794 36.4774741,47.0071583 23.4981057,47.004632 C10.5178952,47.0021057 -0.00252586089,36.4774741 4.54896352e-07,23.4981057 C0.00252677069,10.5178952 10.5271583,-0.00252586089 23.5073689,4.54896358e-07 C26.7520005,0.00084256016 29.8433689,0.659368876 32.6551583,1.84926361" id="Stroke-1-Copy" strokeWidth="3" strokeLinecap="round" />
                  <use id="Rectangle-6" mask="url(#mask-2)" strokeWidth="6" xlinkHref="#path-1" />
                  <use id="Rectangle" mask="url(#mask-4)" strokeWidth="6" transform="translate(23.519245, 16.765734) rotate(-315.000000) translate(-23.519245, -16.765734) " xlinkHref="#path-3" />
                </g>
              </g>
            </g>
          </g>
        </svg>
      </div>
    )
  }
})
