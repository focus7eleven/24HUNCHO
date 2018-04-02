import React from 'react'
import { List, Map } from 'immutable'
import { Button, Tooltip, Select, Checkbox, Message } from 'antd'
import { BriefRoleSelector } from '../../../../components/role/RoleSelector'
import { } from 'svg'
import styles from './AuditEditPane.scss'
import RangeItem from './component/RangeItem'
import config from '../../../../config'
import messageHandler from 'messageHandler'
const Option = Select.Option

class AuditEditPane extends React.Component {
  static defaultProps = {
    roleList: List(),
    criteriaList: List(),
    auditModule: Map(),
    onUpdate: () => {},
  }

  static EFFECTIVE = {
    DEFAULT: 0,
    INCLUDE_SUB: 1,
    FROM_PARENT: 2,
  }

  state = {
    selectedRoleList: this.props.originalCriteria == null ?
      List()
    :
      this.props.originalCriteria
        .get('auditors')
        .map((auditor) => auditor
          .set('roleTitle', auditor.get('name').split(' ')[0])
          .set('username', auditor.get('name').split(' ')[1])
          .set('roleId', auditor.get('id'))
        ),
    applyChildren: this.props.originalCriteria == null ? false : this.props.originalCriteria.get('effectiveWay') == AuditEditPane.EFFECTIVE.INCLUDE_SUB,
    operationCriteriaId: this.props.originalCriteria == null ? -1 : this.props.originalCriteria.get('operationCriteriaId'),
    criteriaExtra: {
      value: this.props.originalCriteria == null ? {} : (this.props.originalCriteria.get('value') || Map()).toJS(),
    }
  }

  validateExtra = () => {
    const { criteriaExtra } = this.state
    const { min, max } = criteriaExtra.value
    if ((min != null && max == null) || (min == null && max != null)) {
      Message.error('范围不能为空')
      return false
    }
    if (min != null && max != null && min > max) {
      Message.error('输入范围错误')
      return false
    }
    return true
  }

  validateBasic = () => {
    if (this.state.operationCriteriaId == -1) {
      Message.error('请选择约束条件')
      return false
    }
    if (this.state.selectedRoleList.size == 0) {
      Message.error('请选择审批人')
      return false
    }
    return true
  }

  onAddCriteriaSubmit = () => {
    if (!this.validateBasic()) {
      return
    }
    if (!this.validateExtra()) {
      return
    }
    const { affair, auditModule } = this.props
    const { operationCriteriaId, criteriaExtra, selectedRoleList, applyChildren } = this.state
    fetch(config.api.audit.config.criteria.add(), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        affairId: affair.get('id'),
        addRoleId: affair.get('roleId'),
        moduleId: auditModule.get('moduleId'),
        operationId: auditModule.get('operationId'),
        addedRoleIds: selectedRoleList.map((role) => role.get('roleId')).toJS(),
        affectSubAffair: applyChildren,
        criteria: {
          operationCriteriaId: operationCriteriaId,
          ...criteriaExtra,
        }
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        Message.success('添加约束成功')
        this.onUpdate(auditModule.set('create', false))
        this.props.onRefreshModuleInfo()
      }
    })
  }

  onEditCriteriaSubmit = () => {
    if (!this.validateBasic()) {
      return
    }
    if (!this.validateExtra()) {
      return
    }
    const { auditModule, originalCriteria } = this.props
    const { operationCriteriaId, criteriaExtra, selectedRoleList, applyChildren } = this.state

    fetch(config.api.audit.config.criteria.modify(), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        criteriaId: originalCriteria.get('criteriaId'),
        criteria: {
          operationCriteriaId: operationCriteriaId,
          ...criteriaExtra,
        },
        affectSubAffair: applyChildren,
        auditRoleIds: selectedRoleList.map((role) => role.get('roleId')).toJS()
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0) {
        Message.success('修改约束成功')
        this.onUpdate(auditModule.set('edit', false))
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
        <Tooltip title={auditor.get('roleTitle') + ' ' + auditor.get('username')}>
          <img src={auditor.get('avatar')} />
        </Tooltip>
      </div>
    )
  }

  renderAddCriteria = () => {
    const { auditModule } = this.props
    return (
      <div className={styles.criteria} key="edit">
        <div className={styles.firstRow}>
          <Select placeholder="请选择约束条件" onSelect={(value) => this.setState({ operationCriteriaId: value })}>
            {this.props.criteriaList.map((criteria) => {
              return (
                <Option key={criteria.get('id')} value={criteria.get('id') + ''}>{criteria.get('criteria')}</Option>
              )
            })}
          </Select>
          {this.state.operationCriteriaId != -1
            && this.props.criteriaList.size > 0
            && this.props.criteriaList.find((item) => item.get('id') == this.state.operationCriteriaId).get('type') == 1
            &&
            <RangeItem
              min={this.state.criteriaExtra.value.min}
              max={this.state.criteriaExtra.value.max}
              onChange={(value) => {
                this.setState({
                  criteriaExtra: {
                    ...this.state.criteriaExtra,
                    value
                  }
                })
              }}
            />
          }
          <Checkbox
            checked={this.state.applyChildren}
            onChange={(e) => this.setState({ applyChildren: e.target.checked })}
          >同时作用于子事务</Checkbox>
        </div>
        <div className={styles.secondRow}>
          <div className={styles.auditorGroup}>
            <div className={styles.label}>审批人：</div>
            <BriefRoleSelector
              roleList={this.props.roleList}
              selectedRoleList={this.state.selectedRoleList}
              onChange={(selectedRoleList) => this.setState({ selectedRoleList })}
              renderAvatar={this.renderAvatar}
              searchPlaceholder="搜索事务角色"
            />
          </div>
        </div>
        <div className={styles.editActionGroup}>
          <Button size="small" type="ghost" onClick={() => this.onUpdate(auditModule.set('create', false))}>取消</Button>
          <Button type="primary" size="small" onClick={() => this.onAddCriteriaSubmit()}>添加</Button>
        </div>
      </div>
    )
  }

  renderEditCriteria = () => {
    const { auditModule } = this.props
    return (
      <div className={styles.criteria} key="edit">
        <div className={styles.firstRow}>
          <Select value={this.state.operationCriteriaId + ''} onSelect={(value) => this.setState({ operationCriteriaId: value })}>
            {this.props.criteriaList.map((criteria) => {
              return (
                <Option key={criteria.get('id')} value={criteria.get('id') + ''}>{criteria.get('criteria')}</Option>
              )
            })}
          </Select>
          {this.state.operationCriteriaId != -1
            && this.props.criteriaList.size > 0
            && this.props.criteriaList.find((item) => item.get('id') == this.state.operationCriteriaId).get('type') == 1
            &&
            <RangeItem
              min={this.state.criteriaExtra.value.min}
              max={this.state.criteriaExtra.value.max}
              onChange={(value) => {
                this.setState({
                  criteriaExtra: {
                    ...this.state.criteriaExtra,
                    value
                  }
                })
              }}
            />
          }
          <Checkbox
            checked={this.state.applyChildren}
            onChange={(e) => this.setState({ applyChildren: e.target.checked })}
          >同时作用于子事务</Checkbox>
        </div>
        <div className={styles.secondRow}>
          <div className={styles.auditorGroup}>
            <div className={styles.label}>审批人：</div>
            <BriefRoleSelector
              roleList={this.props.roleList}
              selectedRoleList={this.state.selectedRoleList}
              onChange={(selectedRoleList) => this.setState({ selectedRoleList })}
              renderAvatar={this.renderAvatar}
              searchPlaceholder="搜索事务角色"
            />
          </div>
        </div>
        <div className={styles.editActionGroup}>
          <Button size="small" type="ghost" onClick={() => this.onUpdate(auditModule.set('edit', false))}>取消</Button>
          <Button type="primary" size="small" onClick={() => this.onEditCriteriaSubmit()}>修改</Button>
        </div>
      </div>
    )
  }

  /*
  * if props contains originalCriteria, then it's to modify it, else it's to create one
  */
  render(){
    return this.props.originalCriteria == null ? this.renderAddCriteria() : this.renderEditCriteria()
  }
 }

export default AuditEditPane
