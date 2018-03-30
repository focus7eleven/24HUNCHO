import React from 'react'
import { Select, Popover, Dropdown, Menu } from 'antd'
import { MoreIcon } from 'svg'
import styles from './WorkItem.scss'
import { USER_ROLE_TYPE } from 'member-role-type'
import { WORK_STATE_ATTR, WORK_STATE, OPT_TYPE } from './WorkContainer'
import AvatarList from '../../../components/avatar/AvatarList'
import RoleItem from '../../../components/RoleItem'

const Option = Select.Option
class WorkItem extends React.Component {
  constructor(props) {
    super(props)
    this.state = {

    }
  }

  handleOptWork = ({ key }) => {
    const { work } = this.props
    if ( key == OPT_TYPE.EDIT ) {
      this.props.updateCallback(work.get('id'))
    } else if ( key == OPT_TYPE.DELETE ) {
      this.props.deleteCallback(work.get('id'))
    }
  }

  handleChangeState = (key) => {
    this.props.updateCallback(this.props.work.get('id'), key)
  }

  handleShowWork = () => {
    this.props.showInfoCallback(this.props.work.get('id'))
  }
  render() {
    const { work, optRoleType, optRoleId } = this.props;
    const responsor = work.get('responsor')
    const cooperationRoles = work.get('cooperationRoles')
    const endTime = work.get('endTime')
    const state = work.get('state')
    const title = work.get('title')
    const note = work.get('note')
    const overdue = work.get('overdue')

    const isResponsor = responsor.get('roleId') == optRoleId
    const currentState = WORK_STATE_ATTR[state]

    const optMenu = (
      <Menu mode="vertical" onClick={this.handleOptWork}>
        <Menu.Item key={OPT_TYPE.EDIT+''}>编辑工作</Menu.Item>
        {(optRoleType === USER_ROLE_TYPE.TEACHER || (optRoleType === OPT_ROLE.ASSISTANT && responsor === null) || true) &&
          <Menu.Item key={OPT_TYPE.DELETE+''}>删除工作</Menu.Item>
        }
      </Menu>
    )

    const responsorEle = (
      <span className={styles.respPop}>
        <RoleItem role={responsor} />
      </span>
    )

    return (
      <div className={styles.cardContainer} onClick={this.handleShowWork}>
        <div className={styles.titleContainer}>
          {optRoleType === USER_ROLE_TYPE.TEACHER || optRoleType === USER_ROLE_TYPE.ASSISTANT
            || true ?
            <span className={styles.options} onClick={(e) => e.stopPropagation()}>
              <Dropdown overlay={optMenu}>
                <MoreIcon id="more"/>
              </Dropdown>
            </span>
          :
            null
          }

          <span className={styles.title}> {title}</span>
        </div>
        <div className={styles.info}>
          {responsor !== null &&
            <span className={styles.item}>
              <span className={styles.label}>负责人:</span>
              <Popover content={responsorEle}>
                <span className={styles.content}>
                  <RoleItem role={responsor} />
                </span>
              </Popover>
            </span>
          }
          {cooperationRoles.size !== 0 &&
            <span className={styles.item}>
              <span className={styles.label}>协作者:</span>
              <AvatarList roleList={cooperationRoles}/>
            </span>
          }
          <span className={styles.item}>
            <span className={styles.label}>截止时间：</span>
            <span className={styles.content} style={{ color: overdue ? 'red' : '#4a4a4a' }}>
              {/* {moment(endTime).format('YY/MM/DD hh:mm')} */}
              {endTime}
            </span>
          </span>

          <span className={styles.item} onClick={(e) => e.stopPropagation()}>
            <span className={styles.label}>状态：</span>
            {isResponsor || true ? (
              <Select className={styles.stateSelector} defaultValue={state.toString()} onChange={this.handleChangeState}>
                {WORK_STATE_ATTR.map((v, k) => {
                  return (
                    <Option value={k.toString()} key={k.toString()}><span className={styles.icon} style={{ background: v.icon }}/>{v.text}</Option>
                  )
                })}
              </Select>
            ) : (
              <span><span className={styles.icon} style={{ backgroundColor: currentState.icon }}/>{currentState.text}</span>
            )}

          </span>
        </div>

        <div className={styles.remark}>
          备注：{note}
        </div>
      </div>
    )
  }
}

export default WorkItem
