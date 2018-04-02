import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { pushURL } from 'actions/route'
import { Tabs, Input, notification } from 'antd'
import styles from './WarehouseActivity.scss'
import config from '../../config'
import { SearchIcon } from 'svg'
import currencyFormatter from '../../utils/currencyWrap'
import FeedbackModal from './FeedbackModal'

const TabPane = Tabs.TabPane

const TRANSFER_TAB = 'TRANSFER_TAB'
const TRANSFORM_TAB = 'TRANSFORM_TAB'
const SENDING_TAB = 'SENDING_TAB'
const INVALID_TAB = 'INVALID_TAB'

const WarehouseActivity = React.createClass({
  getInitialState() {
    return {
      currentTab: SENDING_TAB,
      warehouse: {},
      sending: [],
      showFeedback: false,
      showOrder: {},
      showAsset: {},
      searchText: '',
    }
  },
  componentDidMount(){
    this.fetchWarehouseDetail(this.props)
    this.fetchSending(this.props)
  },
  componentWillReceiveProps(nextProps){
    if (nextProps.affair.get('id') != this.props.affair.get('id')){
      this.fetchWarehouseDetail(nextProps)
      this.fetchSending(nextProps)
    }
  },
  fetchWarehouseDetail(props){
    const { affair } = props
    fetch(config.api.material.warehouse.detail(props.params.warehouseId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.setState({
          warehouse: json.data,
        })
      }
    })
  },
  fetchSending(props){
    const { affair } = props
    fetch(config.api.material.warehouse.sending(props.params.warehouseId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      this.setState({
        sending: json.data,
      })
    })
  },
  fetchOrderDetail(asset){
    fetch(config.api.order.material_order(asset.orderId), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.setState({
          showOrder: json.data,
        })
      }
    })
  },
  getTime(str){
    let date = new Date(str)
    let Y = date.getFullYear() + '年'
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '月'
    let D = date.getDate() + '日 '
    return Y + M + D
  },
  handleOpenOrderDetail(asset){
    fetch(config.api.order.material_order(asset.orderId), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.setState({
          showAsset: asset,
          showOrder: json.data,
          showFeedback: true,
        })
      }
    })
  },
  handleRemindOrder(v){
    fetch(config.api.fund.remind(v.orderId), {
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        notification.success({
          message: '已发送提醒消息'
        })
      }
    })
  },
  handleCancelOrder(v){
    fetch(config.api.fund.cancel(v.orderId), {
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        notification.success({
          message: '已取消本次发送',
        })
        this.fetchSending(this.props)
      }
    })
  },
  renderSendingTab() {
    const { searchText } = this.state
    const sending = this.state.sending.filter((obj) => (obj.name.includes(searchText)))
    // 发送中物资表格
    return (
      <div className={styles.table}>
        {/* 时间 */}
        <div className={styles.col}>
          <div className={styles.header}>发送时间</div>
          {
            sending.map((v, k) => {
              return (<div className={styles.data} key={k} onClick={this.handleOpenOrderDetail.bind(null, v)}>
                {this.getTime(v.time)}
              </div>)
            })
          }
        </div>
        <div className={styles.col} style={{ width: '200px' }}>
          <div className={styles.header}>物资名</div>
          {
            sending.map((v, k) => {
              // const nameStrs = v.name.split(searchText)
              return (<div className={styles.data} key={k} onClick={this.handleOpenOrderDetail.bind(null, v)}>
                {v.name}
              </div>)
            })
          }
        </div>
        {/* 数量 */}
        <div className={styles.col}>
          <div className={styles.header}>数量</div>
          {
            sending.map((v, k) => {
              return (<div className={styles.data} key={k} onClick={this.handleOpenOrderDetail.bind(null, v)}>
                {v.quantity}
              </div>)
            })
          }
        </div>
        {/* 单位 */}
        <div className={styles.col}>
          <div className={styles.header}>单位</div>
          {
            sending.map((v, k) => {
              return (<div className={styles.data} key={k} onClick={this.handleOpenOrderDetail.bind(null, v)}>
                {v.unit}
              </div>)
            })
          }
        </div>
        {/* 价值 */}
        <div className={styles.col}>
          <div className={styles.header}>价值</div>
          {
            sending.map((v, k) => {
              return (<div className={styles.data} key={k} onClick={this.handleOpenOrderDetail.bind(null, v)}>
                {currencyFormatter.format(v.price, { code: v.currency })}
              </div>)
            })
          }
        </div>
        {/* 接收方 */}
        <div className={styles.col}>
          <div className={styles.header}>接收方</div>
          {
            sending.map((v, k) => {
              return (<div className={styles.data} key={k} onClick={this.handleOpenOrderDetail.bind(null, v)}>
                {v.toRole}
              </div>)
            })
          }
        </div>
        {/*操作*/}
        <div className={styles.col}>
          <div className={styles.header}>操作</div>
          {
            sending.map((v, k) => {
              return (<div className={styles.data} key={k} style={{ cursor: 'auto' }}>
                <span className={styles.link} onClick={this.handleRemindOrder.bind(null, v)}>提醒接收</span>
                <span className={styles.link} onClick={this.handleCancelOrder.bind(null, v)}>取消发送</span>
              </div>)
            })
          }
        </div>
      </div>
    )
  },
  renderHeader(){
    return (<div className={styles.header}>
      <div>
        <span style={{ color: '#4990e2', cursor: 'pointer' }} onClick={() => {this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/assets`)}}>{`${this.props.affair.get('name')}仓库`}</span>
        <span>&nbsp;>&nbsp;</span>
        <span style={{ color: '#4990e2', cursor: 'pointer' }} onClick={() => {this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/assets/warehouse/${this.props.params.warehouseId}`)}}>{`${this.state.warehouse.warehouseName ? this.state.warehouse.warehouseName : ''}`}</span>
        <span>&nbsp;>&nbsp;</span>
        <span>仓库动态</span>
      </div>
      <div className={styles.right}>
        <Input placeholder="搜索物资" value={this.state.searchText} onChange={(e) => this.setState({ searchText: e.target.value })} />
        <SearchIcon fill="#9b9b9b" height="16px"/>
      </div>
    </div>)
  },
  render() {
    return (
      <div className={styles.container}>
        {this.renderHeader()}
        <div className={styles.content}>
          <Tabs onChange={(key) => this.setState({ currentTab: key })} type="card">
            <TabPane tab="转移记录" key={TRANSFER_TAB} />
            <TabPane tab="转化记录" key={TRANSFORM_TAB} />
            <TabPane tab="发送中物资" key={SENDING_TAB}>{this.renderSendingTab()}</TabPane>
            <TabPane tab="失效物资" key={INVALID_TAB}>{this.renderSendingTab()}</TabPane>
          </Tabs>
        </div>
        <FeedbackModal visible={this.state.showFeedback} order={this.state.showOrder} showAsset={this.state.showAsset} callback={() => {this.setState({ showFeedback: false, showOrder: {}, showAsset: {} })}} affair={this.props.affair} fetchOrderDetail={this.fetchOrderDetail}/>
      </div>
    )
  }
})

export default connect(null, (dispatch) => ({ pushURL: bindActionCreators(pushURL, dispatch) }))(WarehouseActivity)
