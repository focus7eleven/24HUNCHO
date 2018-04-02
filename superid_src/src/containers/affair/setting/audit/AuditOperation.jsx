import React from 'react'
import { fromJS, List, Map } from 'immutable'
import { Button, Dropdown, Menu, Tooltip, Message } from 'antd'
import { MoreIcon } from 'svg'
import styles from './AuditOperation.scss'
import config from '../../../../config'
import messageHandler from 'messageHandler'
import AuditEditPane from './AuditEditPane'

class AuditOperation extends React.Component {
  static defaultProps = {
    roleList: List(),
    auditModule: Map(),
    auditModuleIndex: -1,
    onUpdate: () => {},
  }

  static EFFECTIVE = {
    DEFAULT: 0,
    INCLUDE_SUB: 1,
    FROM_PARENT: 2,
  }

  state = {
    criteriaList: List(),
  }

  fetchCriteriaList = (operationId, onfetchFinished) => {
    fetch(config.api.audit.config.criteria.get(operationId), {
      method: 'GET',
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        const criteriaList = fromJS(json.data)
        this.setState({ criteriaList }, onfetchFinished && onfetchFinished())
      }
    })
  }

  onDeleteCriteriaSubmit = (criteria) => {
    fetch(config.api.audit.config.criteria.delete(), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        criteriaId: criteria.get('criteriaId')
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        Message.success('删除规则成功')
        this.props.onRefreshModuleInfo()
      }
    })
  }

  onUpdate = (module) => {
    this.props.onUpdate && this.props.onUpdate(module)
  }

  renderAvatar = (auditor, index) => {
    return (
      <div className={styles.avatarWrapper} key={index}>
        <Tooltip title={auditor.get('name')}>
          <img src={auditor.get('avatar')} />
        </Tooltip>
      </div>
    )
  }

  render(){
    const { auditModule } = this.props
    return (
      <div className={styles.auditWrapper} key={auditModule.get('operationId')}>
        {/* 审批头 */}
        <div className={styles.header} key="module">
          <div className={styles.name}>{auditModule.get('operationName')}</div>
          <div className={styles.right}>
            <Button
              
              onClick={() => {
                this.onUpdate(auditModule.set('create', true).set('edit', false))
                this.state.criteriaList.size == 0 && this.fetchCriteriaList(auditModule.get('operationId'))
              }}
            >
              添加规则
            </Button>
          </div>
        </div>
        {/* body only shows when criterias exist or in edit mode */}
        {((auditModule.get('moduleCriteria') || List()).size > 0 || auditModule.get('create')) &&
          <div className={styles.body}>
            {/* 审批约束 */}
            {(auditModule.get('moduleCriteria') || List())
              .sort((ca, cb) => {
                if (ca.get('operationCriteriaId') != cb.get('operationCriteriaId')) {
                  return ca.get('operationCriteriaId') - cb.get('operationCriteriaId')
                }
                return ca.get('effectiveWay') - cb.get('effectiveWay')
              })
              .map((criteria, criteriaIndex) => {
                /* @param edit   point to that which criteria is being edited */
                return auditModule.get('edit') != criteria.get('criteriaId') ? (
                  <div className={styles.criteria} key={criteriaIndex}>
                    <div className={styles.left}>
                      <div className={styles.criteriaName}>{criteria.get('criteria')}</div>
                      <div className={styles.subTitle}>
                        {criteria.get('effectiveWay') == AuditOperation.EFFECTIVE.INCLUDE_SUB ?
                          '作用于子事务'
                        : (
                          criteria.get('effectiveWay') == AuditOperation.EFFECTIVE.FROM_PARENT && `来自${criteria.get('ancestorAffairName')}`
                        )}
                      </div>
                    </div>
                    <div className={styles.right}>
                      <div className={styles.roleGroup}>
                        {(criteria.get('auditors') || List()).map(this.renderAvatar)}
                      </div>
                      {criteria.get('effectiveWay') != AuditOperation.EFFECTIVE.FROM_PARENT &&
                        <div className={styles.moreAction}>
                          <Dropdown
                            placement="bottomCenter"
                            overlay={
                              <Menu>
                                <Menu.Item>
                                  <div
                                    onClick={() => {
                                      /* 在没有约束列表的情况下需要先获取一下 */
                                      if (this.state.criteriaList.size == 0) {
                                        this.fetchCriteriaList(auditModule.get('operationId'), () => {
                                          this.onUpdate(auditModule.set('edit', criteria.get('criteriaId')).set('create', false))
                                        })
                                      } else {
                                        this.onUpdate(auditModule.set('edit', criteria.get('criteriaId')).set('create', false))
                                      }
                                    }}
                                  >编辑规则</div>
                                </Menu.Item>
                                <Menu.Item><div onClick={() => this.onDeleteCriteriaSubmit(criteria)}>删除规则</div></Menu.Item>
                              </Menu>
                            }
                          >
                            <MoreIcon />
                          </Dropdown>
                        </div>
                      }
                    </div>
                  </div>
                ) : (
                  <AuditEditPane
                    key={criteriaIndex}
                    affair={this.props.affair}
                    auditModule={auditModule}
                    originalCriteria={criteria}
                    roleList={this.props.roleList}
                    criteriaList={this.state.criteriaList}
                    onUpdate={this.onUpdate}
                    onRefreshModuleInfo={this.props.onRefreshModuleInfo}
                  />
                )
              })
            }
            {auditModule.get('create') &&
              <AuditEditPane
                affair={this.props.affair}
                auditModule={auditModule}
                roleList={this.props.roleList}
                criteriaList={this.state.criteriaList}
                onUpdate={this.onUpdate}
                onRefreshModuleInfo={this.props.onRefreshModuleInfo}
              />
            }
          </div>
        }
      </div>
    )
  }
}

export default AuditOperation
