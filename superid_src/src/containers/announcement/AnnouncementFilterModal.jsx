import React from 'react'
import { Modal, Checkbox } from 'antd'
import { fromJS, List } from 'immutable'
import styles from './AnnouncementFilterModal.scss'
import { RoleSelector } from '../../components/role/RoleSelector'

const CheckboxGroup = Checkbox.Group

export const ANNOUNCEMENT_TYPE_NAME = {
  ALL: '全部',
  READY: '未发布',
  PROGRESS: '进行中',
  COMPLETE: '已完成',
  INVALID: '已失效',
}
export const ANNOUNCEMENT_TYPE = {
  ALL: -1,
  READY: 0,
  PROGRESS: 1,
  COMPLETE: 2,
  INVALID: 3,
}
const ANNOUNCEMENT_ALL = -1
export const ANNOUNCEMENT_TYPE_NAME_ALL = '所有发布'
export const ANNOUNCEMENT_TYPE_LIST = Object.values(ANNOUNCEMENT_TYPE_NAME)

export const roleList = fromJS([{
  'roleTitle': '负责人',
  'roleId': 10624,
  'username': 'xws',
  'userId': 10104,
  'avatar': 'http://superid-public.oss-cn-shanghai.aliyuncs.com/person_default.png',
  'type': 0
}])
const AnnouncementFilterModal = React.createClass({
  getInitialState(){
    return {
      visible: false,
      announcementType: [ANNOUNCEMENT_TYPE_NAME.VALID],
      selectedRoleList: List(),
      roleList: roleList,
    }
  },
  /*
  * @param values Array<String>
  * values.length cannot be 0 so if it's zero force if be [ANNOUNCEMENT_TYPE_NAME.VALID]
  */
  onCheckChange(values){
    this.setState({
      announcementType: values.length === 0 ? [ANNOUNCEMENT_TYPE_NAME.VALID] : values
    })
  },
  onRoleChange(val) {
    this.setState({
      selectedRoleList: val
    })
  },
  onOk(){
    this.props.onAdvancedFilterChange({
      announcementType: this.state.announcementType.length === 2 ?
        ANNOUNCEMENT_ALL
      :
        ANNOUNCEMENT_TYPE_LIST.indexOf(this.state.announcementType[0]),
      selectedRoleList: this.state.selectedRoleList,
    }, () => this.setState({ visible: false }))
  },
  render(){
    return (
      <div>
        <div onClick={() => this.setState({ visible: true })}>{this.props.children}</div>
        <Modal
          title="高级筛选"
          maskClosable={false}
          onCancel={() => this.setState({ visible: false })}
          onOk={this.onOk}
          visible={this.state.visible}
          wrapClassName={styles.modal}
          width={500}
        >
          <div className={styles.controlWrapper}>
            <div>发布显示：</div>
            <div>
              <CheckboxGroup
                options={ANNOUNCEMENT_TYPE_LIST}
                value={this.state.announcementType}
                onChange={this.onCheckChange}
              />
            </div>
          </div>
          <div className={styles.controlWrapper}>
            <div>参与角色：</div>
            <RoleSelector
              className={styles.roleSelector}
              roleList={this.state.roleList}
              onChange={this.onRoleChange}
              selectedRoleList={this.state.selectedRoleList}
            />
          </div>
        </Modal>
      </div>
    )
  },
})

export default AnnouncementFilterModal
