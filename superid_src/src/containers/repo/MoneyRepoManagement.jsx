import React from 'react'
import styles from './MoneyRepoManagement.scss'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { pushURL } from 'actions/route'
import { ChinaIcon, USAIcon, JapanIcon, EnglandIcon, EuroIcon } from 'svg'
import { Icon, Table, Switch } from 'antd'
import currencyFormatter from '../../utils/currencyWrap'
import { List } from 'immutable'
import classNames from 'classnames'
import config from '../../config'
import PERMISSION from 'utils/permission'

const PropTypes = React.PropTypes

const ACCOUNT_TYPE = {
  0: '公共库',
  1: '角色库',
  2: '公共库',
}
export const CURRENCY_TYPE = {
  'CNY': '人民币',
  'USD': '美元',
  'EUR': '欧元',
  'JPY': '日元',
  'GBP': '英镑',
  'HKD': '港币'
}

export const POOL_TYPE = {
  AFFAIR: 0,
  ROLE: 1
}

const MoneyRepoManagement = React.createClass({
  propTypes: {
    affair: PropTypes.object.isRequired,
  },
  getDefaultProps() {
    return {
      isContainChildren: false,
    }
  },
  getInitialState() {
    return {
      expandedKeys: List(), //已展开的id
      currencyTypes: List(), //所有可能得货币类型
      accountMap: null, //不包含子事务的账户列表
      accountMapContainChildren: null, //包含子事务的账户列表,
      aggregate: null,
      isContainChildren: false,
    }
  },

  componentDidMount() {
    this.fetchAccountList(this.state.isContainChildren)
  },
  componentDidUpdate() {
    const { isContainChildren } = this.state
    const { accountMap, accountMapContainChildren } = this.state
    if ((isContainChildren && !accountMapContainChildren) || (!isContainChildren && !accountMap)) {
      this.fetchAccountList(isContainChildren)
    }
  },

  /**
  * 该事务获取账户列表
  * @param isContainChildren 是否包含子事务
  */
  fetchAccountList(isContainChildren = false) {
    const {
      affair
    } = this.props

    fetch(config.api.fund.account.all(isContainChildren), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      const fundAccountTree = res.data.fundAccountTree
      if (isContainChildren) {
        this.setState({
          currencyTypes: List(res.data.currencyType),
          accountMapContainChildren: fundAccountTree,
          aggregate: res.data.sumList,
          expandedKeys: List((fundAccountTree.children.map((account) => account.affairId))).push(fundAccountTree.affairId)
        })
      } else {
        this.setState({
          currencyTypes: List(res.data.currencyType),
          accountMap: fundAccountTree
        })
      }
    })
  },

  //展开合并
  handleExpand(id) {
    const { expandedKeys } = this.state

    if (expandedKeys.includes(id)) {
      this.setState({
        expandedKeys: expandedKeys.delete(expandedKeys.indexOf(id))
      })
    } else {
      this.setState({
        expandedKeys: expandedKeys.push(id)
      })
    }
  },

  colObj(text, colSpan, row = null, expanded = false) {
    return {
      children: colSpan > 2 ? <div><Icon type={expanded ? 'minus-square-o' : 'plus-square-o'} onClick={() => this.handleExpand(row.id)} />{text}</div> : text,
      props: {
        colSpan: colSpan
      }
    }
  },

  /**
   * 行类名，分为一般行、合计行、子事务行
   * @param row
   * @param index
   * @returns {*}
   */
  getRowClassName(row) {
    if (row.isTotal) {
      return styles.total
    }

    if (row.isTitle) {
      return classNames(styles.childrenTitle, `border-level-${row.level}`)
    }
  },

  /**
   * 获得表格column
   */
  getColumns() {
    const { currencyTypes, expandedKeys } = this.state
    let columns = [{
      title: '账户名称',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text, row) => {
        if (row.isTotal) {
          return this.colObj(text, 2)
        } else if (row.isTitle) {
          return this.colObj(text, 2 + currencyTypes.size, row, expandedKeys.includes(row.id))
        } else {
          return text
        }
      },
    }, {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (text, row) => {
        if (row.isTotal || row.isTitle) {
          return this.colObj(text, 0)
        } else {
          return ACCOUNT_TYPE[text]
        }
      }
    }]

    currencyTypes.map((currencyType) => {
      columns.push({
        title: `${CURRENCY_TYPE[currencyType]}（${currencyType}）`,
        dataIndex: currencyType,
        key: currencyType,
        className: styles.currency,
        render: (text, row) => {
          if (row.isTitle) {
            return this.colObj(text, 0)
          } else {
            return currencyFormatter.format(text, { code: currencyType })
          }
        },
      })
    })

    return columns
  },

  /**
   * 构造层级事务账户
   * @param account
   * @param containHeader
   */
  buildAffairRow(account, containHeader = false) {
    let result = []
    const { currencyTypes } = this.state
    if (containHeader) {
      //插入事务名称
      result.push({
        name: account.affairName,
        id: account.affairId,
        isTitle: true,
        level: account.level
      })
    }

    //插入账户行
    account.items.map((v) => {
      let row = {
        id: account.affairId + '-' + v.ownerId,
        name: v.accountName ? v.accountName + '的资金库' : v.poolName,
        type: v.type
      }
      currencyTypes.map((currency) => row[currency] = v.currencies[currency])
      result.push(row)
    })

    //插入合计行
    let row = { isTotal: true, name: '合计' }
    currencyTypes.map((currency) => row[currency] = account.sumList[currency])
    result.push(row)

    return result
  },

  /**
   * 构造Table的dataSource
   * @param accountMap
   */
  buildDataSource(accountMap) {
    if (!accountMap) return

    // const { isContainChildren } = this.props
    const { expandedKeys, isContainChildren } = this.state

    let dataSource = []
    const loop = (node, containHeader = true) => {
      if (expandedKeys.includes(node.affairId)) {
        dataSource = dataSource.concat(this.buildAffairRow(node, containHeader))

        if (node.children && node.children.length >= 0) {
          node.children.map((v) => loop(v, true))
        }
      } else {
        dataSource.push({
          name: node.affairName,
          id: node.affairId,
          isTitle: true,
          level: node.level
        })
      }
    }

    if (isContainChildren) {
      loop(accountMap, false)
    } else {
      dataSource = dataSource.concat(this.buildAffairRow(accountMap, false))
    }

    return dataSource
  },

  renderAccount() {
    // const { isContainChildren } = this.props
    const { accountMap, accountMapContainChildren, isContainChildren } = this.state

    let dataSource = null
    if (isContainChildren) {
      //包含子事务
      dataSource = this.buildDataSource(accountMapContainChildren)
    } else {
      //不包含子事务
      dataSource = this.buildDataSource(accountMap)
    }

    return (
      <Table columns={this.getColumns()}
        dataSource={dataSource}
        bordered
        pagination={false}
        useFixedHeader
        scroll={{ y: window.innerHeight - 380 }}
        rowClassName={this.getRowClassName}
        className={styles.accountTable}
      />
    )
  },

  //国旗
  renderFlag(currencyType) {
    switch (currencyType) {
      case 'CNY':
        return <ChinaIcon/>
      case 'USD':
        return <USAIcon/>
      case 'JPY':
        return <JapanIcon/>
      case 'EUR':
        return <EuroIcon/>
      case 'GBP':
        return <EnglandIcon/>
      default:
        return null
    }
  },

  //总计
  renderAggregate() {
    const { currencyTypes, aggregate } = this.state
    if (!aggregate) return

    return currencyTypes.map((currency, index) => {
      return (
        <span key={index}>
          {this.renderFlag(currency)}
          <span>{`${currency}${CURRENCY_TYPE[currency]}：`}</span>
          <span className={styles.bold}>{currencyFormatter.format(aggregate[currency], { code: currency })}</span>
        </span>
      )
    })
  },

  render() {
    const { affair } = this.props
    const { isContainChildren } = this.state

    return (
      <div className={styles.container}>
        <div className={styles.top}>
          {affair.validatePermissions(PERMISSION.CHECK_CHILD_AFFAIR_FUND) &&
            <div className={styles.switch}>
              <span>包含子事务</span>
              <Switch checkedChildren="开" unCheckedChildren="关" onChange={((visible) => {this.setState({ isContainChildren: visible });this.fetchAccountList(visible)})} checked={this.state.isContainChildren}/>
            </div>
          }
          <span
            className={styles.right}
            onClick={() => { this.props.pushURL(`/workspace/affair/${this.props.affair.get('id')}/repo/funds`) }}
          >退出管理员视角></span>
        </div>
        {isContainChildren &&
          <div className={styles.aggregate}>
            <span className={styles.bold}>总计：</span>
            <div className={styles.right}>
              {this.renderAggregate()}
            </div>
          </div>
        }
        {this.renderAccount()}
      </div>
    )
  }
})
export default connect(null, (dispatch) => ({ pushURL: bindActionCreators(pushURL, dispatch) }))(MoneyRepoManagement)
