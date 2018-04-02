import React, { PropTypes } from 'react'
import _ from 'underscore'

export const AlertIcon = React.createClass({
  PropTypes: {
    width: PropTypes.number,
    height: PropTypes.number,
  },
  getDefaultProps(){
    return {
      width: 14,
      height: 14,
    }
  },
  render (){
    return (
      <div style={_.extend({ width: this.props.width, height: this.props.width, display: 'inline-block' }, this.props.style)}>
        <svg width="13px" height="13px" viewBox="0 0 13 13" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
          <title>Group</title>
          <desc>Created with Sketch.</desc>
          <defs />
          <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            <g id="修改手机4" transform="translate(-79.000000, -267.000000)">
              <g id="内容下" transform="translate(60.000000, 263.000000)">
                <g id="群组" transform="translate(19.000000, 4.000000)">
                  <g id="Group">
                    <path d="M13,6.5 C13,10.0898571 10.0898571,13 6.5,13 C2.91014286,13 0,10.0898571 0,6.5 C0,2.91014286 2.91014286,0 6.5,0 C10.0898571,0 13,2.91014286 13,6.5 L13,6.5 Z" id="Stroke-1" fill="#46A649" />
                    <path d="M8.73036342,9.06517857 C8.9091442,9.13035714 9,9.19375 9,9.25446429 C9,9.40089286 8.70838218,9.68928571 8.12807737,10.1214286 C7.34701055,10.7071429 6.62309496,11 5.95339977,11 C5.46541618,11 5.22215709,10.8026786 5.22215709,10.4089286 C5.22215709,10.2419643 5.32327081,9.72946429 5.52403283,8.87232143 L5.91383353,7.21428571 L6.01348183,6.79375 L6.09407972,6.45803571 C6.12778429,6.31607143 6.14390387,6.19553571 6.14390387,6.09910714 C6.14390387,5.89553571 6.05158265,5.79375 5.86547479,5.79375 C5.34671747,5.79375 4.7883939,6.14196429 4.18903869,6.8375 C4.0630129,6.76875 4,6.69910714 4,6.62946429 C4,6.38125 4.37661196,6.04821429 5.12690504,5.62857143 C5.88012896,5.20982143 6.47801876,5 6.92643611,5 C7.42614302,5 7.67672919,5.21160714 7.67672919,5.63392857 C7.67672919,5.71517857 7.6503517,5.88214286 7.59759672,6.13392857 L7.50674091,6.54285714 C7.49941383,6.575 7.46424385,6.74017857 7.3968347,7.03660714 L6.98651817,8.78035714 L6.88540445,9.16964286 C6.7989449,9.55625 6.75498242,9.81428571 6.75498242,9.94375 C6.75498242,10.1196429 6.83851114,10.20625 7.00410317,10.20625 C7.56242673,10.20625 8.13833529,9.82678571 8.73036342,9.06517857" id="Fill-3" fill="#FFFFFF" />
                    <path d="M8,3 C8,3.55295567 7.552,4 7.00061538,4 C6.448,4 6,3.55295567 6,3 C6,2.44704433 6.448,2 7.00061538,2 C7.552,2 8,2.44704433 8,3" id="Fill-5" fill="#FFFFFF" />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </svg>
      </div>
    )
  }
})
