import React from 'react'
import { Map, List, fromJS } from 'immutable'
import { Modal } from 'antd'
import ItemList from '../../../../components/list/ItemList'
import styles from './ApplyFundModal.scss'
import config from '../../../../config'
import messageHandler from 'messageHandler'
import moment from 'moment'
import urlFormat from 'urlFormat'
import currencyFormatter from 'currencyWrap'
import { getAccountTypeName, getAccountIcon } from 'utils/fund-icon'

class AcquireFundInfoModal extends React.Component {

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

    fetch(urlFormat(config.api.fund.fundAcquireInfo(), {
      operationId: message.get('resourceId')
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
            <div className={styles.role}>{`${info.get('toRoleName')} ${info.get('toAffairName')}-${info.get('toUsername')}`}</div>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>申请时间：</div>
          <div className={styles.control}>{moment(info.get('applicationTime')).format('YYYY-MM-DD hh:mm')}</div>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>金额：</div>
          <div className={styles.control}>{currencyFormatter.format(info.get('total'), { code: info.get('currency') })}</div>
        </div>
        <div className={styles.row}>
          <div className={styles.label}>转入：</div>
          <div className={styles.control}>{info.get('toPoolName')}</div>
        </div>
      </div>
    )
  }

  /* 查看视图 */
  renderCheck = () => {
    const accountList = this.state.info.get('accountInfos')
    return (accountList || List()).size > 0 && (
      <ItemList wrapClassName={styles.accountList}>
        {(accountList || List()).map((account, index) => {
          return (
            <div className={styles.account} key={index}>
              <div className={styles.icon}>{getAccountIcon(account.get('accountSubType'))}</div>
              <div className={styles.detail}>
                <div className={styles.title}>{getAccountTypeName(account.get('accountSubType'))}</div>
                <div className={styles.total}>剩余{currencyFormatter.format(account.get('balance'), { code: this.state.info.get('currency') })}</div>
              </div>
              <div className={styles.amount}>{currencyFormatter.format(account.get('amount'), { code: this.state.info.get('currency') })}</div>
            </div>
          )
        })}
      </ItemList>
    )
  }

  render() {
    const { info } = this.state
    return info && (
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
    )
  }
}

export default AcquireFundInfoModal
