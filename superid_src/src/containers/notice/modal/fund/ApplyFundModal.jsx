import React from 'react'
import { Map, List, fromJS } from 'immutable'
import { Modal, Input, Message } from 'antd'
import ItemList from '../../../../components/list/ItemList'
import styles from './ApplyFundModal.scss'
import config from '../../../../config'
import messageHandler from 'messageHandler'
import moment from 'moment'
import urlFormat from 'urlFormat'
import currencyFormatter from 'currencyWrap'
import fundIcon from 'fund-icon'
import { FLOAT_NUMBER } from 'utils/regex'
import AbstractAgreeRefuseModal from '../AbstractAgreeRefuseModal'

class ApplyFundModal extends React.Component {

  static defaultProps = {
    message: Map(),
    onHide: () => {}
  }

  state = {
    info: null,
    accountList: List()
  }

  componentWillMount(){
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')
    const affairId = message.get('toAffairId')

    fetch(urlFormat(config.api.fund.fundApplicationInfo(), {
      applicationId: message.get('resourceId')
    }), {
      method: 'GET',
      credentials: 'include',
      affairId: affairId,
      roleId: roleId,
      resourceId,
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        const applicationInfo = fromJS(json.data)
        this.setState({
          info: applicationInfo
        })

        /* 根据资金信息来获取本角色可以调用的账户列表 */
        !this.isReadOnly() && fetch(urlFormat(config.api.fund.realAccountList(), {
          currencyType: applicationInfo.get('currency'),
          poolId: applicationInfo.get('poolId'),
          onlyValid: true,
        }), {
          method: 'GET',
          credentials: 'include',
          roleId: roleId,
          affairId: affairId,
        }).then((res) => res.json()).then((json2) => {
          if (json2.code == 0) {
            this.setState({
              accountList: fromJS(json2.data)
            })
          }
        })
      }
    })
  }

  isReadOnly = () => {
    const { message } = this.props
    return (message.get('urls').last() || Map()).get('type') == 403
  }

  onRefuse = (reason = '') => {
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')
    const { info } = this.state
    const affairId = message.get('toAffairId')
    fetch(config.api.order.handleApplyFund(), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      affairId,
      roleId,
      resourceId,
      body: JSON.stringify({
        'accountForm': [],
        'applicationId': message.get('resourceId'),
        'agree': false,
        'reason': reason,
        'toAccountId': info.get('toAccountId'),
        'toRoleId': message.get('senderRoleId'),
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        Message.success('拒绝成功')
        this.onHide()
      }
    })
  }

  onSubmit = () => {
    const { message } = this.props
    const roleId = message.get('receiverRoleId')
    const resourceId = message.get('resourceId')
    const { info, accountList } = this.state
    const affairId = message.get('toAffairId')

    let total = 0
    accountList.forEach((account) => {
      const sendAmount = (account.get('sendAmount') || '') == '' ? 0 : Number.parseFloat(account.get('sendAmount'))
      total += sendAmount
    })
    if (total != info.get('amount')) {
      Message.error('发送金额与申请金额不一致')
      return
    }

    fetch(config.api.order.handleApplyFund(), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      affairId,
      roleId,
      resourceId,
      body: JSON.stringify({
        'accountForm': accountList
          .map((account) => fromJS({
            accountId: account.get('id'),
            amount: account.get('sendAmount') || 0,
          }))
          .filter((account) => account.get('amount') != 0)
          .toJS(),
        'applicationId': message.get('resourceId'),
        'agree': true,
        'reason': '',
        'toAccountId': info.get('toAccountId'),
        'toRoleId': message.get('senderRoleId'),
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        Message.success('发送成功')
        this.onHide()
      }
    })
  }

  onHide = () => {
    this.props.onHide()
  }

  renderContent = () => {
    const { info } = this.state
    return (
      <div className={styles.form}>
        <div className={styles.row}>
          <div className={styles.label}>申请人：</div>
          <div className={styles.control}>
            <img src={info.get('avatar')} />
            <div className={styles.role}>{`${info.get('roleName')} ${info.get('affairName')}-${info.get('username')}`}</div>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>申请时间：</div>
          <div className={styles.control}>{moment(info.get('applicationTime')).format('YYYY-MM-DD hh:mm')}</div>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>金额：</div>
          <div className={styles.control}>{currencyFormatter.format(info.get('amount'), { code: info.get('currency') })}</div>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>转出：</div>
          <div className={styles.control}>{info.get('poolName')}</div>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>转入：</div>
          <div className={styles.control}>{info.get('toPoolName')}</div>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>备注：</div>
          <div className={styles.control}>{info.get('note')}</div>
        </div>
        {info.get('state') == 2 &&
          <div className={styles.row}>
            <div className={styles.label}>拒绝理由：</div>
            <div className={styles.control}>{info.get('reason')}</div>
          </div>
        }
      </div>
    )
  }

  /* 编辑视图 */
  renderEdit = () => {
    const { accountList } = this.state
    return accountList.size > 0 && (
      <ItemList wrapClassName={styles.accountList}>
        {(accountList || List()).map((account, index) => {
          return (
            <div className={styles.account} key={index}>
              <div className={styles.icon}>{fundIcon(account.get('subType'))}</div>
              <div className={styles.detail}>
                <div className={styles.title}>{account.get('subTypeName')}</div>
                <div className={styles.total}>
                  剩余{currencyFormatter.format(account.get('amount'), { code: account.get('currency') })}
                </div>
              </div>
              <div className={styles.amount}>
                <Input
                  addonBefore={account.get('currency')}
                  placeholder="调用金额"
                  value={account.get('sendAmount') || ''}
                  onChange={(e) => {
                    let sendAmount = e.target.value
                    if (!FLOAT_NUMBER.test(sendAmount) && sendAmount != '') {
                      e.preventDefault()
                    } else {
                      this.setState({
                        accountList: this.state.accountList.update(
                          index,
                          (item) => item.set('sendAmount', sendAmount > account.get('amount') ? account.get('amount') : sendAmount)
                        )
                      })
                    }
                  }}
                />
              </div>
            </div>
          )
        })}
      </ItemList>
    )
  }

  /* 查看视图 */
  renderCheck = () => {
    const { accountList } = this.state

    return accountList.size > 0 && (
      <ItemList wrapClassName={styles.accountList}>
        {(accountList || List()).map((account, index) => {
          return (
            <div className={styles.account} key={index}>
              <div className={styles.icon} />
              <div className={styles.detail}>
                <div className={styles.title}>{account.get('subTypeName')}</div>
                <div className={styles.total}>剩余{currencyFormatter.format(account.get('amount'), { code: account.get('currency') })}</div>
              </div>
              <div className={styles.amount}>0</div>
            </div>
          )
        })}
      </ItemList>
    )
  }

  render() {
    const readOnly = this.isReadOnly()
    const { info, accountList } = this.state
    return info && (!readOnly ? (accountList &&
      <AbstractAgreeRefuseModal
        visible
        onCancel={this.onHide}
        onRefuse={(value) => {this.onRefuse(value)}}
        onAgree={this.onSubmit}
        onOk={this.onSubmit}
        wrapClassName={styles.fundModal}
        title="发送资金"
        width={500}
      >
        {this.renderContent()}
        {this.renderEdit()}
      </AbstractAgreeRefuseModal>
    ) : (
      <Modal
        visible
        onCancel={this.onHide}
        onOk={this.onSubmit}
        wrapClassName={styles.fundModal}
        title="调用资金信息"
        width={500}
        footer={null}
      >
        {this.renderContent()}
        {this.renderCheck()}
      </Modal>
    ))
  }
}

export default ApplyFundModal
