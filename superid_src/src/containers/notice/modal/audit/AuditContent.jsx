import React from 'react'
import { fromJS } from 'immutable'
import moment from 'moment'
import { Icon } from 'antd'
import Avatar from './component/Avatar'
import AnnouncementContent from './component/AnnouncementContent'
import ListWrapper from './component/ListWrapper'
import PermissionWrapper from './component/PermissionWrapper'
import { AUDIT_MAP, AUDIT_RESULT } from '../../auditUtil'
import { getAccountIcon, getFundIconText } from 'fund-icon'
import styles from './AuditContent.scss'

const AUDIT_ROW = {
  DEFAULT: 0,
  PUBLIC_TYPE: 1,
  PRINCIPAL: 2,
  APPLY_ROLE: 4,
  RESULT: 6,
  RESP_ROLES: 15,
  ASSET_DETAIL: 17,
  FUND_TYPE_LIST: 19,
  FUND_DETAIL: 20,
  TIME: 21,
  INVALID_ROLE: 22,
  FUND_SEND_ACCOUNT: 25,
  MODIFY_PERMISSION: 26,
  MODIFY_PERMISSION_DETAIL: 27,
}

const PUBLIC_TYPE_NAME_MAP = {
  0: '公开',
  1: '盟内可见',
  2: '事务内可见',
  3: '本事务可见',
  4: '私密',
  20: '事务内可见',
  21: '盟内可见',
  22: '盟客网可见',
}

const ACCOUNT_NAME = {
  0: '现金',
  10: '中国工商银行',
  11: '中国交通银行',
  12: '中国农业银行',
  200: '支付宝',
  201: '微信钱包',
}

const AuditContent = React.createClass({
  getDefaultProps(){
    return {
      auditType: AUDIT_MAP.CREATE_ANNOUNCEMENT,
      content: {
        form: null,
        applyTime: null,
      },
    }
  },
  /* 获取格式化时间 */
  getFormatTime(time){
    return moment(time).format('YYYY-MM-DD HH:mm')
  },
  /* 普通表单渲染模板 */
  renderForm(){
    const form = this.props.content.form
    return (
      <div className={styles.main}>
        {/* return means that component does not need a label, break means it needs one */}
        {form.map((row, idx) => {
          let value = row.value
          let valueComponent = null
          switch (row.componentType) {
            case AUDIT_ROW.PUBLIC_TYPE:
              valueComponent = PUBLIC_TYPE_NAME_MAP[value]
              break

            case AUDIT_ROW.DEFAULT:
              valueComponent = value
              break
            case AUDIT_ROW.PRINCIPAL:
              valueComponent = (
                <span>{value.allianceName}-{value.name}</span>
              )
              break
            case AUDIT_ROW.APPLY_ROLE:
              valueComponent = (
                <Avatar
                  src={value.avatar}
                  textList={[value.roleTitle, value.username]}
                />
              )
              break
            case AUDIT_ROW.RESP_ROLES:
              valueComponent = (
                <div className={styles.avatarGroup}>
                  {value.map((v, k) => {
                    return (
                      <Avatar
                        src={v.avatar}
                        textList={[v.text]}
                        key={k}
                      />
                    )
                  })}
                </div>
              )
              break
            case AUDIT_ROW.TIME:
              valueComponent = value.text
              break
            case AUDIT_ROW.ASSET_DETAIL:
              return <ListWrapper key={idx} type={ListWrapper.TYPE.MATERIAL} list={value} />
            case AUDIT_ROW.FUND_DETAIL:
              return <ListWrapper key={idx} type={ListWrapper.TYPE.FUND} list={value} />
            case AUDIT_ROW.FUND_TYPE_LIST:
              valueComponent = (
                <div className={styles.fundTypeList}>
                  {value.map((code, index) => {
                    const iconText = getFundIconText(code)
                    return (
                      <div key={index} className={styles.fundType}>{iconText.svg}{iconText.text}</div>
                    )
                  })}
                </div>
              )
              break
            case AUDIT_ROW.FUND_SEND_ACCOUNT:
              valueComponent = (
                <div className={styles.sendAccount}>
                  <div className={styles.accountIcon}>{getAccountIcon(value.subType)}</div>
                  <div className={styles.accountName}>{ACCOUNT_NAME[value.subType]}</div>
                  <div className={styles.accountNumber}>{value.accountNumber && `(${value.accountNumber})`}</div>
                </div>
              )
              break
            case AUDIT_ROW.INVALID_ROLE:
              valueComponent = value.text
              break
            case AUDIT_ROW.RESULT:
              valueComponent = (
                <div className={styles.resultWrapper}>
                  <div className={styles.time}>{this.getFormatTime(value.time)}</div>
                  <div className={styles.role}>{value.roleInfo}</div>
                  {value.result == AUDIT_RESULT.AGREE ?
                    <div className={styles.resultAgree}>已同意</div>
                  : (
                    <div className={styles.resultRefuse}>已拒绝</div>
                  )}
                  {value.result == AUDIT_RESULT.REFUSE &&
                    <div className={styles.reasonWrapper}>
                      <span>拒绝理由:</span>
                      <span className={styles.reason}>{value.reason == null ? '无' : value.reason}</span>
                    </div>
                  }
                </div>
              )
              break
            case AUDIT_ROW.MODIFY_PERMISSION:
              valueComponent = (
                <div className={styles.permissionLine}>
                  <div className={styles.info}>{value.originalIdentity}</div>
                  <div className={styles.tag}><Icon type="double-right" /></div>
                  <div className={styles.info}>{value.newIdentity}</div>
                </div>
              )
              break
            case AUDIT_ROW.MODIFY_PERMISSION_DETAIL:
              return (
                <PermissionWrapper
                  originalPermissionList={fromJS(value.originalPermissionList)}
                  newPermissionList={fromJS(value.newPermissionList)}
                />
              )
            default:
              valueComponent = typeof value == 'string' ? value : JSON.stringify(value)
          }

          return (
            <div className={styles.row} key={idx}>
              <div className={styles.label}>{row.key}</div>
              <div
                className={styles.value}
                style={row.componentType === AUDIT_ROW.RESULT ? { width: '100%' } : {}}
              >{valueComponent}</div>
            </div>
          )
        })
        }
      </div>
    )
  },
  /* 根据auditType渲染不同的内容 */
  render(){
    const { content, auditType } = this.props
    if (content == null || auditType == -1) {
      return null
    }

    switch (auditType) {
      case AUDIT_MAP.CREATE_ANNOUNCEMENT:
        return (
          <AnnouncementContent content={content.form}/>
        )
      case AUDIT_MAP.CREATE_SUB_AFFAIR:
      case AUDIT_MAP.CREATE_ROLE:
      case AUDIT_MAP.MANAGE_ROLE_ASSUME:
      case AUDIT_MAP.INVALID_ROLE:
      case AUDIT_MAP.RECOVER_ROLE:
      case AUDIT_MAP.UPLOAD_FILE:
      case AUDIT_MAP.SEND_MATERIAL:
      case AUDIT_MAP.CREATE_TASK:
      case AUDIT_MAP.CREATE_SCENE_WAREHOUSE:
      case AUDIT_MAP.SEND_FUND:
      default:
        return this.renderForm()
    }
  },
})

export default AuditContent
