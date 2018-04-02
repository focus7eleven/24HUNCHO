import React from 'react'
// import { fromJS } from 'immutable'
import styles from './AddLockedModal.scss'
import { Modal } from 'antd'
import config from '../../config'
import messageHandler from '../../utils/messageHandler'
import { GongShangIcon, JiaoTongIcon, NongYeIcon, AliPayIcon, WechatIcon, CashIcon } from 'svg'
import currencyFormatter from '../../utils/currencyWrap'


const AccountIconMap = {
  // 0: <CashIcon fill="#ffa64d" height={36} style={{ marginLeft: '10px', marginRight: '7px' }}/>,
  0: <CashIcon fill="#ffa64d" height={36} style={{ marginLeft: '-5px', marginRight: '9px' }}/>,
  10: <GongShangIcon height={24} />,
  11: <JiaoTongIcon height={24} />,
  12: <NongYeIcon height={24} />,
  200: <AliPayIcon height={24} />,
  201: <WechatIcon height={24} />
}

const AddLockedModal = React.createClass({

  getInitialState() {
    return {
      showLocked: [],
    }
  },

  componentWillMount() {
    const { affair, poolId, currencyType } = this.props
    fetch(config.api.fund.show_locked(currencyType, poolId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        const showLocked = json.data
        this.setState({ showLocked })
      }
    })

  },

  getTime(str){
    let date = new Date(str)
    let Y = date.getFullYear() + '.'
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '.'
    let D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' '
    let H = date.getHours() + ':'
    let Min = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ' '
    return Y + M + D + H + Min
  },

  handleCancel() {
    this.props.onCancel()
  },



  render() {
    return (<Modal visible onCancel={this.handleCancel} wrapClassName={styles.AddLockedModal} title="查看锁定金额" >
      <div className={styles.content} />

      <div className={styles.moneyChangeContainer}>
        {
          this.state.showLocked.map((v, k) => {
            return (
              <div className={styles.row} key={k}>
                <div className={styles.detail}>
                  <div className={styles.title}>交易-转给&nbsp;{v.toRoleName}</div>
                  <div className={styles.time}>发起时间:&nbsp;{this.getTime(v.sendTime)}</div>
                  <div className={styles.place}>发起位置:&nbsp;{v.allianceName}</div>
                </div>
                <div className={styles.count}>
                  <div className={styles.avatar}>{AccountIconMap[v.subType] }</div>
                  <div className={styles.column}>
                    <div className={styles.number}>-{currencyFormatter.format(v.amount, { code: this.props.currencyType })}</div>
                    <div className={styles.wait}>待对方确认</div>
                  </div>
                </div>
              </div>
            )
          })
        }

      </div>

    </Modal>)
  }
})

export default AddLockedModal
