import React from 'react'
import styles from './GeneralJournalEntryFlowTable.scss'
import currencyFormatter from '../../utils/currencyWrap'
import { ClockIcon, ArrowIcon, ArrowDropDown } from 'svg'

const ORDER_TYPE = {
  ALL: -1,
  FUND: 1,
  GOODS: 0,
}
const TIME_ORDER = {
  ASC: 1,
  DESC: -1,
}


const GeneralJournalEntryFlowTable = React.createClass({

  getInitialState(){
    return {
      timeOrder: TIME_ORDER.ASC,   //表格行的时间顺序
      chooseTypeDisabled: true,     //是否显示选择查看交易类型的框，资金或物资或全部
      chooseType: ORDER_TYPE.ALL,  //选择的类型
    }
  },
  componentWillMount(){
    this.setState({ tableData: this.props.tableData })
  },
  componentWillReceiveProps(nextProps){

    this.setState({ tableData: nextProps.tableData })
  },
  handleClickTableRow(data){
    if (this.props.onClickRow){
      this.props.onClickRow(data)
    }
  },
  renderAffairData(affairData){
    if (!affairData || !affairData.orders){
      return null
    }
    {/* 按照类型筛选,按照currency再次筛选,按照时间排序 */}
    let orders = affairData.orders
    .filter((order) => {
      if (this.state.chooseType == ORDER_TYPE.ALL){
        return true
      }
      return order.tradeType == this.state.chooseType
    })
    .filter((order) => {
      return order.currency == this.props.currency
    })
    .sort((o1, o2) => {
      return (o1.orderId * 1 - o2.orderId * 1) * this.state.timeOrder
    })

    return (
      orders.map((data, index) => {
        return (
          <div className={styles.tableRow} key={data.orderId} onClick={() => {this.handleClickTableRow(data)}}>
            <div className={styles.tableDataIndex}>{index + 1}</div>
            <div className={styles.tableDataType}>{data.tradeType == ORDER_TYPE.FUND ? '资金' : '物资'}</div>
            <div className={styles.tableDataId}>{data.sequence}</div>
            <div className={styles.tableDataReceiver}>{data.toAlliance}</div>
            <div className={styles.tableDataOperator}>
              <div className={styles.avatar}>
                {data.avatar ? <img src={data.avatar} /> : null}
              </div>
              {`${data.roleTitle}－${data.username}`}
            </div>
            <div style={{ color: this.props.color }} className={styles.tableDataCount}>{currencyFormatter.format(data.total, { code: data.currency })}</div>
            <div className={styles.tableDataAddup}>{currencyFormatter.format(data.accumulation == null ? 0 : data.accumulation[data.currency], { code: data.currency })}</div>
          </div>
        )
      })
    )
  },
  renderChildren(childrenData){
    if (!childrenData || childrenData.length == 0){
      return null
    }
    return (childrenData.map((affairData, index) => {
      return (
        <div className={styles.subTable} key={index}>
          <div className={styles.subHeader} onClick={() => {affairData.show = !affairData.show;this.setState({})}}>
            {affairData.show ?
              <div className={styles.iconMinus} />
            :
              <div className={styles.icon} />
            }
            <div className={styles.text}>{affairData.name}</div>
          </div>
          {affairData.show ?
            <div>
              {this.renderAffairData(affairData)}
              {this.renderChildren(affairData.children)}
            </div>
          :
            null
          }
        </div>
      )

    }))
  },
  render() {
    return (
      <div className={styles.table}>
        {/* 表头 */}
        <div className={styles.tableHeader}>
          <div className={styles.icons} style={{ width: 30, flexShrink: 0 }}
            onClick={() => {
              if (this.state.timeOrder == TIME_ORDER.ASC){
                this.setState({ timeOrder: TIME_ORDER.DESC })
              } else {
                this.setState({ timeOrder: TIME_ORDER.ASC })
              }
            }}
          >
            {this.state.timeOrder == TIME_ORDER.ASC ?
              <div className={styles.arrowIcon}><ArrowIcon /></div>
            : (
              <div className={styles.arrowIcon} style={{ transform: 'rotate(180deg)' }}><ArrowIcon /></div>
            )}
            <div className={styles.clockIcon}><ClockIcon /></div>
          </div>
          <div className={styles.headerType} style={{ width: 70, flexShrink: 0 }} onClick={() => {this.setState({ chooseTypeDisabled: !this.state.chooseTypeDisabled })}}>
            类型
            <div className={styles.arrowDropDown}><ArrowDropDown /></div>
            {this.state.chooseTypeDisabled ?
              null
            : (
              <div className={styles.chooseTypeBox}>
                <div onClick={() => {this.setState({ chooseTypeDisabled: true, chooseType: ORDER_TYPE.ALL })}}>全部</div>
                <div onClick={() => {this.setState({ chooseTypeDisabled: true, chooseType: ORDER_TYPE.FUND })}}>资金</div>
                <div onClick={() => {this.setState({ chooseTypeDisabled: true, chooseType: ORDER_TYPE.GOODS })}}>物资</div>
              </div>
            )}
          </div>
          <div className={styles.flowNumber}>交易流水号</div>
          <div className={styles.receiver}>接收方</div>
          <div className={styles.operator}>经手角色</div>
          <div className={styles.amount}>等值金额</div>
          <div className={styles.amount}>累计金额</div>
        </div>
        {/* 表格数据，包括主事务和各级子事务（如果没有子事务则只渲染主事务） */}
        <div className={styles.tableContent}>
          {this.renderAffairData(this.state.tableData)}
          {this.state.tableData ? this.renderChildren(this.state.tableData.children) : null}
        </div>
      </div>
    )
  },
})

export default GeneralJournalEntryFlowTable
