import React from 'react'
import styles from './MoneyRepoCard.scss'
import { Popover, Icon, Tooltip, message } from 'antd'
import { MoreIcon, VisiblilityIcon } from 'svg'
import Slider from 'react-slick'
import currencyFormatter from '../../utils/currencyWrap'

// const DEFAULT_LOGO = 'http://simucy.oss-cn-shanghai.aliyuncs.com/user/1000006/Hw4opTh.png'

const MoneyRepoCard = React.createClass({

  getInitialState() {
    return {
      isModifying: false, // 修改资金库名称
      visible: false
    }
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps) {
      this.setState({
        isModifying: false
      })
    }
  },

  handleClick(e) {
    const classList = e.target.classList
    if (!classList.contains('slick-no-pop') && !classList.contains('anticon') && !classList.contains('more-icon')) {
      this.props.onClick(this.props.fund)
    }
  },

	// 修改资金库名称
  handleModifyName(e) {
    const { fund } = this.props

    if (e.keyCode === 13) {
      const value = e.target.value
      if (value == ''){
        message.error('名称不能为空！')
        return
      }
      this.props.onModifyName(fund, value)
    }
  },

  handleStartModify() {
    this.setState({
      isModifying: true,
      visible: false
    }, () => {
      this.input.focus()
    })
  },

  handleDeleteFund() {
    const { fund } = this.props
    this.props.onDelete(fund)
    this.handleVisibleChange(false)
  },

  handleVisibleChange(visible) {
    this.setState({ visible })
  },

  render() {
    const { fund, affair } = this.props
    const { isModifying } = this.state

    const fundName = fund.name ? fund.name : (fund.userName + fund.roleName + '的资金库')

    function SampleNextArrow(props) {
      const { className, onClick } = props
      return (
        <div
          className={className}
          onClick={onClick}
        ><Icon type="right" /></div>
      )
    }

    function SamplePrevArrow(props) {
      const { className, onClick } = props
      return (
        <div
          className={className}
          onClick={onClick}
        ><Icon type="left" /></div>
      )
    }

    const settings = {
      dots: true,
      speed: 500,
      customPaging: function() {
        return <div className="slick-no-pop"><span className="slick-no-pop" /></div>
      },
      dotsClass: 'slick-dots slick-thumb',
      nextArrow: <SampleNextArrow className="slick-no-pop"/>,
      prevArrow: <SamplePrevArrow className="slick-no-pop"/>
    }

        // 删除资源库，修改名称
    const createPopover = () => {
      return (
        <div className={styles.repoOperation}>
          <div className={styles.repoOperationItem} onClick={this.handleStartModify}>修改名称</div>
          <div className={styles.repoOperationItem} onClick={this.handleDeleteFund}>删除资金库</div>
        </div>
      )
    }

    return (
      <div className={styles.repoBox} onClick={this.handleClick}>
        <div className={styles.repoInfo}>
          {
            fund.logo || affair.get('avatar') ?
              <img className={styles.repoInfoAvator} src={fund.type == 1 ? fund.logo : this.props.affair.get('avatar')} />
              :
              <div className={styles.repoInfoAvator} style={{ backgroundColor: '#e6e6e6' }} />
          }
          {isModifying ?
            <input
              className={styles.nameInput + ' slick-no-pop'}
              defaultValue={fundName}
              onKeyDown={this.handleModifyName}
              onBlur={() => { this.setState({ isModifying: false }) }}
              ref={(c) => this.input = c}
            />
							:
            <span
              className={styles.repoInfoName + ' slick-no-pop'}
            >{fundName}</span>
					}

          {
						fund.publicType === 4 ?
  <Tooltip placement="top" title="保密" trigger="hover" overlayClassName={styles.visiblilityTooltip}>
    <span className={styles.visiblilityIcon}><VisiblilityIcon className="more-icon"/></span>
  </Tooltip>
						: null
					}

          <Popover
            content={createPopover()}
            trigger="click"
            overlayClassName={styles.iconPopover}
            placement="bottom"
            visible={this.state.visible}
            onVisibleChange={this.handleVisibleChange}
          >
            <span className={styles.moreIcon + ' more-icon'}><MoreIcon className="more-icon"/></span>
          </Popover>
        </div>
        <div className={styles.repoMoney}>
          {fund.currencyList.length > 1 ?
            <Slider className={styles.carouselContainer} {...settings}>
              {fund.currencyList.map((item, i) => {
                return (
                  <div className={styles.carouselItem} key={i}>{currencyFormatter.format(item.total, { code: item.currencyType })}</div>
                )
              })}
            </Slider>
							:
            <div className={styles.singleItem}>
              <span>{currencyFormatter.format(fund.currencyList[0].total, { code: fund.currencyList[0].currencyType })}</span>
            </div>
					}

        </div>

      </div>
    )
  }

})

export default MoneyRepoCard
