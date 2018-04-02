import React from 'react'
import { Modal, Popover, Icon, Button, Message } from 'antd'
import { fromJS, List, Map } from 'immutable'
import { AuditConstrant } from 'svg'
import styles from './AuditModal.scss'
import config from '../../../../config'
import moment from 'moment'

const AFFAIR_ITEM_HEIGHT = 30

class AuditModal extends React.Component {

  state = {
    affairList: List(),
    operationMap: Map(),
    activeAffairId: (this.props.affair || Map()).get('id'),
    activeAffairIndex: 0,
  }

  componentWillMount() {
    const { affair } = this.props
    fetch(config.api.audit.config.role.affairList(affair.get('roleId')), {
      method: 'GET',
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          affairList: fromJS(json.data).filter((item) => item.get('affairId') != affair.get('id')),
        })
      }
    })
    this.fetchOperationList(affair.get('id'), affair.get('roleId'))
  }

  fetchOperationList = (affairId, roleId) => {
    fetch(config.api.audit.config.role.operationList(affairId, roleId), {
      method: 'GET',
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          operationMap: this.state.operationMap.set(affairId, fromJS(json.data))
        })
      }
    })
  }

  onCancelAuditSubmit = (criteria) => {
    const { affair } = this.props
    const { activeAffairId } = this.state
    fetch(config.api.audit.config.role.removeSelf(), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operatorRoleId: affair.get('roleId'),
        criteriaId: criteria.get('criteriaId'),
      }),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        Message.success('取消成功')
        this.fetchOperationList(activeAffairId, affair.get('roleId'))
        this.props.onRefreshModuleInfo()
      }
    })
  }

  render() {
    const { affair } = this.props
    const { activeAffairId, activeAffairIndex } = this.state
    const cursorTop = ((activeAffairIndex == 0 ? 1 : 2) + activeAffairIndex) * AFFAIR_ITEM_HEIGHT
    return (
      <Modal
        title="需我审批"
        visible
        wrapClassName={styles.modal}
        onCancel={() => this.props.onCancel && this.props.onCancel()}
        onOk={() => this.props.onCancel && this.props.onCancel()}
      >
        <div className={styles.aside}>
          <div className={styles.cursor} style={{ top: cursorTop }}/>
          <div className={styles.title}>本事务：</div>
          <div
            className={styles.affair}
            data-status={activeAffairId == affair.get('id') ? 'active' : ''}
            onClick={() => this.setState({
              activeAffairId: affair.get('id'),
              activeAffairIndex: 0,
            })}
          >
            {affair.get('name')}
          </div>
          <div className={styles.title}>其他事务：</div>
          <div className={styles.affairGroup}>
            {this.state.affairList.map((affair, index) => {
              return (
                <div
                  key={affair.get('affairId')}
                  className={styles.affair}
                  data-status={activeAffairId == affair.get('affairId') ? 'active' : ''}
                  onClick={() => this.setState({
                    activeAffairId: affair.get('affairId'),
                    activeAffairIndex: index + 1,
                  })}
                >
                  {affair.get('affairName')}
                </div>
              )
            })}
          </div>
        </div>
        <div className={styles.main}>
          {this.state.operationMap.get(activeAffairId, List()).map((operation, operationIndex) => {
            return (
              <div key={operation.get('operationId')} className={styles.operation}>
                <div key="title" className={styles.title}>{operation.get('operationName')}</div>
                {(operation.get('criteriaInfoList') || List()).map((subOperation, subOperationIndex) => {
                  return (
                    <div key={subOperation.get('criteriaId')} className={styles.operation}>
                      <div key="icon" className={styles.icon}><AuditConstrant /></div>
                      <div className={styles.titleWrapper}>
                        <div key="title" className={styles.title}>{subOperation.get('formatCriteria')}</div>
                        <div className={styles.subTitle}>{subOperation.get('affectSubAffair') && '作用于子事务'}</div>
                      </div>
                      <div key="content" className={styles.content}>
                        <div className={styles.item}>添加人：{subOperation.get('addRoleName')}</div>
                        <div className={styles.item}>添加时间：{moment(Number.parseInt(subOperation.get('addTime'))).format('YYYY-MM-DD')}</div>
                      </div>
                      <Popover
                        overlayClassName={styles.overlay}
                        placement="bottom"
                        visible={subOperation.get('popover')}
                        content={
                          <div className={styles.main}>
                            <div className={styles.content}><Icon type="exclamation-circle" />确认不再审批？</div>
                            <div className={styles.actionGroup}>
                              <Button
                                type="ghost"
                                onClick={() => this.setState({
                                  operationMap: this.state.operationMap.updateIn(
                                    [activeAffairId, operationIndex, 'criteriaInfoList', subOperationIndex],
                                    (item) => item.set('popover', false)
                                  )
                                })}
                              >否</Button>
                              <Button type="primary" onClick={() => this.onCancelAuditSubmit(subOperation)}>是</Button>
                            </div>
                          </div>
                        }
                      >
                        <div
                          key="link"
                          className={styles.linkButton}
                          onClick={() => this.setState({
                            operationMap: this.state.operationMap.updateIn(
                              [activeAffairId, operationIndex, 'criteriaInfoList', subOperationIndex],
                              (item) => item.set('popover', true)
                            )
                          })}
                        >不再审批</div>
                      </Popover>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </Modal>
    )
  }
}

export default AuditModal
