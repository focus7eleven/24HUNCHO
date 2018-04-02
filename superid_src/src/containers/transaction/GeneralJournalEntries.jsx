import React from 'react'
import { Switch, DatePicker, Tabs, Modal, Select } from 'antd'
import styles from './GeneralJournalEntries.scss'
import GeneralJournalEntryFlowTable from './GeneralJournalEntryFlowTable'
import GeneralJournalReports from './GeneralJournalReports'
import config from '../../config'
import moment from 'moment'
import currencyFormatter from '../../utils/currencyWrap'
import imageNoDeal from 'images/img_no_deal.png'
import messageHandler from 'messageHandler'
const RangePicker = DatePicker.RangePicker
const Option = Select.Option
const TabPane = Tabs.TabPane
const CHOOSE_TAB = {
  RECEIVE: 1,
  SEND: 2,
}
const TABLE_COLOR = {
  RECEIVE: '#00ac00',
  SEND: '#f55b6c',
}
const CURRENCY = {
  CNY: 'CNY',
  USD: 'USD',
  JPY: 'JPY',
  EUR: 'EUR',
}
const ORDER_TYPE = {
  ALL: -1,
  FUND: 1,
  GOODS: 0,
}
const formatTime = (timeUnix) => {
  return moment(timeUnix).format('YYYY年M月D日 HH:mm')
}
const GeneralJournalEntries = React.createClass({
  getInitialState() {
    return {
      fundDetailModalData: null,
      materialDetailModalData: null,
      containChildren: false,
      tableData: {},
      chooseTab: CHOOSE_TAB.SEND,   //选择发送或者接收的tab
      currency: CURRENCY.CNY,        //当前币种
      sum: '',
      beginTime: null,
      endTime: null,
      reportsDisabled: true,        //流水报表
      reportsTableData: {},
      reportsSum: '',
    }
  },
  componentDidMount(){
    this.handleChanges(this.props)
  },
  componentWillReceiveProps(nextProps){
    if (nextProps.affair.get('id') != this.props.affair.get('id')){
      this.handleChanges(nextProps)
    }
  },
  // 获取流水表信息,流水报表中也需要此接口,用props传入到子组件中
  fetchFlows(affair, beginTime, endTime, send){
    const begin = beginTime ? beginTime.valueOf() : 0
    const end = endTime ? endTime.valueOf() : moment().valueOf()
    const funcName = this.state.containChildren && this.state.reportsDisabled ? 'contain_children_flows' : 'flows'
    fetch(config.api.order[funcName](affair.get('roleId'), affair.get('id')), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      body: JSON.stringify({
        begin: begin,
        end: end,
        send: send,
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        //只包含主事务的数据要包装一下变成类似包含子事务的数据格式
        if (!this.state.containChildren){
          this.wrapFlowsData(json.data)
        }
        let tableData = this.parseDataAsTree(json.data)
        if (this.state.reportsDisabled){
          this.setState({
            tableData: tableData,
            sum: json.data.sum,
          })
        } else {
          this.setState({
            reportsTableData: tableData,
            reportsSum: json.data.sum,
          })
        }
      } else {
        this.setState({
          tableData: {},
          sum: '',
          reportsTableData: {},
          reportsSum: '',
        })
      }
    })
  },
  // 获取模态框信息
  fetchFundDetail(orderId){
    const { affair } = this.props

    fetch(config.api.order.fund_order_detail(orderId), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        let data = json.data
        this.setState({ fundDetailModalData: data })
      }
    })
  },
  fetchMaterialDetail(orderId){
    const { affair } = this.props

    fetch(config.api.order.material_deal_detail(orderId), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0){
        let data = json.data
        this.setState({ materialDetailModalData: data })
      }
    })
  },
  // 刷新表格
  handleChanges(props){
    const affair = props.affair
    const { beginTime, endTime } = this.state
    const send = this.state.chooseTab == CHOOSE_TAB.SEND
    this.fetchFlows(affair, beginTime, endTime, send)
  },
  // 刷新流水报表
  handleOnReportsChange(beginTime, endTime, send){
    const affair = this.props.affair
    this.fetchFlows(affair, beginTime, endTime, send)
  },
  /* 将只包含主事务的数据伪装成包含子事务的数据，和包含子事务的返回数据作一致处理 */
  wrapFlowsData(data){
    data.orders = [{ id: '', level: 1, name: '主事务', orders: data.orders }]
  },
  /* 搜索以node为根的树，遍历树找到对应id的节点 */
  findNode(node, id, index = 0){
    if (node == null || (node instanceof Array && node.length == 0)){
      return null
    }
    if (!(node instanceof Array)){
      if (!!node.id && node.id == id){
        return node
      }
    } else {
      if (node.length <= index){
        return null
      }
      return this.findNode(node[index], id) || this.findNode(node, id, index + 1)
    }
  },
  /* 将包装后的主事务（调用不含子事务的流水需要包装）或者包含子事务的流水数据传入解析成树 */
  parseDataAsTree(data){
    let tableData = {}//以主事务为根node
    data.orders.sort((o1, o2) => (o1.level - o2.level)).forEach((node) => {
      let parentNode = this.findNode(tableData, node.parentId)
      if (parentNode){
        if (parentNode.children){
          parentNode.children.push(node)
        } else {
          parentNode.children = [node]
        }
      } else {
        tableData = node
      }
    })


    return tableData
  },
  /* 本方法作为props传入流水表格，点击表格中的一行需要调用本方法显示模态框 */
  handleClickTableRow(data) {
    switch (data.type) {
      case ORDER_TYPE.FUND:
        this.fetchFundDetail(data.orderId)
        break
      default:
        this.fetchMaterialDetail(data.orderId)
    }
  },
  /* 本方法作为props传入流水报表，从流水报表返回调用本方法 */
  hanldeOnDetailDisabled(){
    this.setState({
      reportsDisabled: true,
    })
  },
  renderHeader() {
    return (
      <div className={styles.header}>
        <div>{this.props.affair.get('name')}交易流水表</div>
        <div className={styles.rightGroup}>
          {/* 是否包含子事务 */}
          <div style={{ marginRight: 2 }}>包含子事务</div>
          <Switch size="large" checkedChildren="开" unCheckedChildren="关" onChange={(checked) => {this.setState({ containChildren: checked }, this.handleChanges.bind(null, this.props))}} />
        </div>
      </div>
    )
  },
  renderFontColor(){
    if (this.state.chooseTab == CHOOSE_TAB.SEND){
      return TABLE_COLOR.SEND
    }
    return TABLE_COLOR.RECEIVE
  },
  renderContent() {
    const { tableData } = this.state
    const currency = this.state.currency
    const value = this.state.sum[currency]
    const total = currencyFormatter.format(value, { code: currency })

    if (Object.keys(tableData).length === 0) {
      return (
        <div className={styles.noEntry}>
          <img src={imageNoDeal} />
          <div>暂无交易...</div>
        </div>
      )
    }

    return (
      <div className={styles.content}>
        {/* 上部的工具栏，包括币种选择，时间范围选择，和查看统计表的按钮 */}
        <div className={styles.toolBar}>
          <div>
            <Select style={{ width: '80px' }} className={styles.select} defaultValue={CURRENCY.CNY} onSelect={(value) => {this.setState({ currency: value })}}>
              <Option value={CURRENCY.CNY}>人民币</Option>
              <Option value={CURRENCY.USD}>美元</Option>
              <Option value={CURRENCY.JPY}>日元</Option>
              <Option value={CURRENCY.EUR}>欧元</Option>
            </Select>
            <RangePicker
              style={{ width: 240 }}
              className={styles.picker}
              showTime
              format="YYYY年MM月DD日"
              value={[this.state.beginTime, this.state.endTime]}
              onChange={(dates) => {
                this.setState({
                  beginTime: dates[0],
                  endTime: dates[1]
                }, this.handleChanges.bind(null, this.props))
              }}
            />
          </div>
          <div className={styles.button} onClick={() => {this.setState({ reportsDisabled: false })}}>查看流水统计报表</div>
        </div>
        {/* 下部分是一个总计金额和tab&table的组件 */}
        <div className={styles.tabContainer}>
          <div className={styles.total}>
            <div className={styles.name}>等值金额总计:</div>
            <div style={{ color: this.renderFontColor() }} className={styles.value}>{total}</div>
          </div>
          <Tabs type="card" onChange={(key) => {this.setState({ chooseTab: key }, this.handleChanges.bind(null, this.props))}}>
            <TabPane tab="发出" key={CHOOSE_TAB.SEND}>
              <GeneralJournalEntryFlowTable onClickRow={(data) => {this.handleClickTableRow(data)}} color={TABLE_COLOR.SEND} tableData={tableData} currency={this.state.currency}/>
            </TabPane>
            <TabPane tab="收到" key={CHOOSE_TAB.RECEIVE}>
              <GeneralJournalEntryFlowTable onClickRow={(data) => {this.handleClickTableRow(data)}} color={TABLE_COLOR.RECEIVE} tableData={tableData} currency={this.state.currency}/>
            </TabPane>
          </Tabs>
        </div>
      </div>
    )
  },
  //资金的模态框
  renderFundDetailModal() {
    if (!this.state.fundDetailModalData) return null
    const { context, sequence, remark, fromAllianceName,
      fromRoleName, fromFundAccount, toAllianceName, toRoleName, toFundAccount,
      createTime, modifyTime, currency, total
    } = this.state.fundDetailModalData
    const typeColor = this.renderFontColor()
    const typeName = this.state.chooseTab == CHOOSE_TAB.SEND ? '发出' : '收到'
    const typeSign = this.state.chooseTab == CHOOSE_TAB.SEND ? '-' : '+'
    const sendOrder = this.state.chooseTab == CHOOSE_TAB.SEND ? 10 : -10
    const modalHeader = (
      <div className={styles.detailModalHeader}>
        <div className={styles.transactionType} style={{ backgroundColor: typeColor }}>{typeName}</div>
        <div>关联事务：{context}</div>
      </div>
    )
    // 某次交易的详细信息。
    return (
      <Modal
        visible={!!this.state.fundDetailModalData}
        title={modalHeader}
        footer={null}
        maskClosable={false}
        wrapClassName={styles.detailModalContainer}
        onCancel={() => this.setState({ fundDetailModalData: null })}
        width={650}
      >
        {/* 订单的基本信息 */}
        <div className={styles.basicInfo}>
          <div className={styles.left}>
            <div>
              <span>流水号： </span>{sequence}
            </div>
            <div>
              <span>备注： </span>{remark}
            </div>
          </div>
          <div className={styles.right} style={{ color: typeColor }}>{typeSign}{currencyFormatter.format(total, { code: currency })}</div>
        </div>
        {/* 发送方与接收方 */}
        <div className={styles.operatorInfo}>
          <div className={styles.operator} style={{ order: sendOrder }}>
            <div>发送方：{fromAllianceName}</div>
            <div>经手角色：{fromRoleName}</div>
            <div>发送时间：{formatTime(createTime)}</div>
            <div>现实账户：{fromFundAccount.id}</div>
          </div>
          <div className={styles.operator}>
            <div>接收方：{toAllianceName}</div>
            <div>经手角色：{toRoleName}</div>
            <div>接收时间：{formatTime(modifyTime)}</div>
            <div>现实账户：{toFundAccount.id}</div>
          </div>
        </div>
      </Modal>
    )
  },
  //物资的框
  renderMaterialDetailModal() {
    if (!this.state.materialDetailModalData) return null
    const { context, sequence, remark, bridgeName, express, fromAlliance,
      fromRoleName, fromWarehouse, toAlliance, toRoleName, toWarehouse,
      createTime, modifyTime, items
    } = this.state.materialDetailModalData
    const typeColor = this.renderFontColor()
    const typeName = this.state.chooseTab == CHOOSE_TAB.SEND ? '发出' : '收到'
    const typeSign = this.state.chooseTab == CHOOSE_TAB.SEND ? '-' : '+'
    const sendOrder = this.state.chooseTab == CHOOSE_TAB.SEND ? 10 : -10
    const modalHeader = (
      <div className={styles.detailModalHeader}>
        <div className={styles.transactionType} style={{ backgroundColor: typeColor }}>{typeName}</div>
        <div>关联事务：{context}}</div>
      </div>
    )
    // 某次物资交易的详细信息。
    return (
      <Modal
        visible={!!this.state.materialDetailModalData}
        title={modalHeader}
        footer={null}
        maskClosable={false}
        wrapClassName={styles.detailModalContainer}
        onCancel={() => this.setState({ materialDetailModalData: null })}
        width={650}
      >
        {/* 订单的基本信息 */}
        <div className={styles.basicInfoGoods}>
          <div>
            <span>流水号： </span>{sequence}
          </div>
          <div>
            <span>备注： </span>{remark}
          </div>
          <div className={styles.spaceBetween}>
            <div><span>过桥方： </span>{bridgeName}</div>
            <div><span>快递单号： </span>{express}</div>
          </div>
          <div className={styles.goodsList}>
            {
              items.map((item, key) => (
                <div className={styles.item} key={key}>
                  <div className={styles.itemLeft}>
                    <div className={styles.image}><img src={item.avatar}/></div>
                    <div>{item.name}</div>
                    <div>x{item.quantity}</div>
                  </div>
                  <div className={styles.itemRight}>
                    <div style={{ color: typeColor }}>{typeSign}{currencyFormatter.format(item.price, { code: item.currency })}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
        {/* 发送方与接收方 */}
        <div className={styles.operatorInfo}>
          <div className={styles.operator}>
            <div>接收方：{toAlliance}</div>
            <div>经手角色：{toRoleName}</div>
            <div>接收时间：{formatTime(modifyTime)}</div>
            <div>接收仓库：{toWarehouse}</div>
          </div>
          <div className={styles.operator} style={{ order: sendOrder }}>
            <div>发送方：{fromAlliance}</div>
            <div>经手角色：{fromRoleName}</div>
            <div>发送时间：{formatTime(createTime)}</div>
            <div>发送仓库：{fromWarehouse}</div>
          </div>
        </div>
      </Modal>
    )
  },
  render() {
    return (
      this.state.reportsDisabled ?
        <div className={styles.container}>
          {this.renderHeader()}
          {this.renderContent()}
          {this.renderFundDetailModal()}
          {this.renderMaterialDetailModal()}
        </div>
      :
        <div style={{ height: '100%' }}>
          <GeneralJournalReports
            affair={this.props.affair}
            tableData={this.state.reportsTableData}
            sum={this.state.reportsSum}
            onDetailDisabled={this.hanldeOnDetailDisabled}
            onReportsChange={this.handleOnReportsChange}
            onClickTableRow={this.handleClickTableRow}
          />
          {this.renderFundDetailModal()}
          {this.renderMaterialDetailModal()}
        </div>
    )
  }
})
export default GeneralJournalEntries
