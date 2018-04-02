import React from 'react'
import { fromJS, List } from 'immutable'
import { Button } from 'antd'
import styles from './AuditIndexContainer.scss'
import config from '../../../../config'
import AuditModal from './AuditModal'
import AuditOperation from './AuditOperation'

class AuditIndexContainer extends React.Component {
  state = {
    auditOperationList: List(),
    auditModuleNameList: List(),
    roleList: List(),
    showMyAudit: false,
    activeModuleId: -1,
  }

  componentWillMount(){
    const { affair } = this.props
    if (this.state.auditModuleNameList.size === 0) {
      fetch(config.api.audit.config.modules(), {
        method: 'GET',
      }).then((res) => res.json()).then((json) => {
        if (json.code === 0) {
          this.setState({
            auditModuleNameList: fromJS(json.data)
          }, () => this.fetchAuditModuleInfo(this.props.affair.get('id'), this.state.auditModuleNameList.getIn([0, 'id'])))
        }
      })
    } else {
      this.fetchAuditModuleInfo(this.props.affair.get('id'), this.state.auditModuleNameList.getIn([0, 'id']))
    }
    fetch(config.api.affair.role.main_roles(), {
      method: 'GET',
      credentials: 'include',
      roleId: affair.get('roleId'),
      affairId: affair.get('id'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          roleList: fromJS(json.data || []),
        })
      }
    })
  }

  componentWillReceiveProps(nextProps){
    this.fetchAuditModuleInfo(nextProps.affair.get('id'), this.state.activeModuleId, false)
  }

  fetchAuditModuleInfo = (affairId, moduleId, shouldActivateModule = true) => {
    if (moduleId < 0 ) {
      return 
    }
    if (shouldActivateModule) {
      this.setState({
        activeModuleId: moduleId
      })
    }
    fetch(config.api.audit.config.operation.get(affairId, moduleId), {
      method: 'GET',
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        const fetchedOperationList = fromJS(json.data)
        this.setState({
          auditOperationList: fetchedOperationList.map((operation) => operation.set('moduleId', moduleId))
        })
      }
    })
  }

  onRefreshModuleInfo = () => {
    this.fetchAuditModuleInfo(this.props.affair.get('id'), this.state.activeModuleId, false)
  }

  onUpdateModule = (module, index) => {
    this.setState({
      auditOperationList: this.state.auditOperationList.set(index, module)
    })
  }

  render(){
    const { affair } = this.props
    const { auditModuleNameList } = this.state
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.tabGroup}>
            {auditModuleNameList && auditModuleNameList.map((module) => (
              <div
                key={module.get('id')}
                data-status={this.state.activeModuleId == module.get('id') ? 'active' : ''}
                onClick={() => this.fetchAuditModuleInfo(affair.get('id'), module.get('id'))}
              >
                {module.get('name')}
              </div>
            ))}
          </div>
          <div className={styles.button}>
            <Button type="primary" size="large" onClick={() => this.setState({ showMyAudit: true })}>需我审批</Button>
          </div>
        </div>
        <div className={styles.content}>
          {this.state.auditOperationList.map((auditModule, auditModuleIndex) => (
            <AuditOperation
              key={auditModule.get('operationId')}
              affair={this.props.affair}
              auditModule={auditModule}
              auditModuleIndex={auditModuleIndex}
              roleList={this.state.roleList}
              onUpdate={(nextModule) => this.onUpdateModule(nextModule, auditModuleIndex)}
              onRefreshModuleInfo={this.onRefreshModuleInfo}
            />
          ))}
        </div>
        {this.state.showMyAudit &&
          <AuditModal
            affair={this.props.affair}
            onCancel={() => this.setState({ showMyAudit: false })}
            onRefreshModuleInfo={this.onRefreshModuleInfo}
          />
        }
      </div>
    )
  }
}

export default AuditIndexContainer
