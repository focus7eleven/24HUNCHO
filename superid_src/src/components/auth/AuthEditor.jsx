import React from 'react'
import { connect } from 'react-redux'
import { Popover, Icon } from 'antd'
import { List } from 'immutable'
import styles from './AuthEditor.scss'

const AuthEditor = React.createClass({
  getDefaultProps(){
    return {
      disabled: false,
      showHistory: false,
      onChange: () => {},
      permissionList: List(),
      modifiedPermissionList: List(),
    }
  },
  onClickTableCell(context) {
    // 如果禁用，则屏蔽点击单元格
    if (this.props.disabled) {
      return
    }
    const { modifiedPermissionList } = this.props
    if (!(modifiedPermissionList || List()).includes(context.get('id'))) {
      // 找到同类目名的权限id列表，全部过滤后将本次点击的id加入
      const sameTypeIdList = this.props.permissionInformationList
        .filter((information) => information.get('category') == context.get('category'))
        .map((information) => information.get('id'))
      const nextModifiedPermissionList = (modifiedPermissionList || List())
        .filter((val) => !sameTypeIdList.includes(val))
        .push(context.get('id'))
      this.props.onChange && this.props.onChange(nextModifiedPermissionList.toJS())
    }
  },
  getDescription(text){
    let des = text.split(' ')
    return <div>
      {
        des.map((v, k) => {
          return <p key={k}>{v}</p>
        })
      }
    </div>
  },
  render(){
    const {
      permissionTypeNameList,
      permissionLevelNameList,
    } = this.props
    return (
      <div className={styles.content}>
        <div className={styles.header}>
          {
            permissionLevelNameList.map((v, k) => {
              return <div key={k} className={styles.block}>{v}</div>
            })
          }
        </div>
        <div className={styles.table}>
          {
            permissionTypeNameList.map((v, k) => {
              return (
                <div className={styles.row} key={k}>
                  <div className={styles.key}>{v}</div>
                  {
                    permissionLevelNameList.map((v2, k2) => {
                      const index = k * permissionLevelNameList.size + k2
                      const context = this.props.permissionInformationList.get(index)
                      return (
                        <Popover
                          key={index}
                          placement="bottom"
                          trigger="hover"
                          arrowPointAtCenter
                          autoAdjustOverflow={false}
                          content={this.getDescription(context.get('description'))}
                          overlayClassName={styles.description}
                        >
                          <div className={styles.value} onClick={() => this.onClickTableCell(context)}>
                            {(this.props.modifiedPermissionList || List()).includes(context.get('id')) ? (
                              <Icon className={this.props.disabled ? styles.checkDisabled : ''} type="check-circle" />
                            ) : (this.props.permissionList || List()).includes(context.get('id')) && this.props.showHistory ? (
                              <Icon className={styles.checkBefore} type="check-circle" />
                            ) : (
                              <Icon className={styles.checkInvalidIcon} type="check-circle" />
                            )}
                          </div>
                        </Popover>
                      )
                    })
                  }
                </div>
              )
            })
          }
        </div>
      </div>
    )
  },
})

function mapStateToProps(state) {
  return {
    permissionInformationList: state.getIn(['auth', 'permissionInformationList'], List()),
    permissionLevelNameList: state.getIn(['auth', 'permissionLevelNameList'], List()),
    permissionTypeNameList: state.getIn(['auth', 'permissionTypeNameList'], List()),
  }
}

export default connect(mapStateToProps)(AuthEditor)
