import React from 'react'
import { Modal, Input, Select, Popover } from 'antd'
import styles from './ModalCommon.scss'
import { SearchIcon, MemberCard } from 'svg'
import classNames from 'classnames'
import SimpleMemberCard from '../../../components/card/SimpleMemberCard'

const Option = Select.Option

let EnableRole = React.createClass({
  getDefaultProps() {
    return {
      visible: true,
      onCloseModal: () => {
      }
    }
  },

  getInitialState() {
    return {}
  },

  render() {
    let { visible, onCloseModal } = this.props

    const selectBefore = (
      <Select defaultValue="in">
        <Option value="in">盟内成员</Option>
        <Option value="out">盟外成员</Option>
      </Select>
    )

    return (
      <Modal
        wrapClassName={styles.commonModal}
        title="启用角色"
        visible={visible}
        onCancel={onCloseModal}
        maskClosable={false}
      >
        <div className="u-text-l-14">使用原成员：</div>
        <div style={{ marginTop: 10, marginBottom: 20 }}>
          <div className={classNames(styles.member, 'checked')}>
            <img src="http://simucy.oss-cn-shanghai.aliyuncs.com/user/1178/EnterpriseValidate/1479112747473.jpeg" alt=""/>
            <div>
              <div>
                <span>张成</span>
              </div>
              <div>ID:12231</div>
            </div>
          </div>
        </div>

        <div className="u-text-l-14">邀请新成员：</div>
        <div className={styles.searchField} style={{ marginTop: 10 }}>
          <div className={styles.selectContainer}>
            {selectBefore}
          </div>
          <Input placeholder={'搜索用户名/角色/SuperID'} style={{ paddingLeft: 88 }} />
          <span className={styles.searchIcon}><SearchIcon/></span>
        </div>

        <div className={styles.memberList}>
          <div className={styles.member}>
            <img src="http://simucy.oss-cn-shanghai.aliyuncs.com/user/1178/EnterpriseValidate/1479112747473.jpeg" alt=""/>
            <div>
              <div>
                <span>张成</span>
                <Popover trigger="hover" content={<SimpleMemberCard/>} className={styles.popover} placement="top">
                  <span><MemberCard /></span>
                </Popover>
              </div>
              <div>ID:8734947</div>
            </div>
          </div>
          <div className={classNames(styles.member, 'checked')}>
            <img src="http://simucy.oss-cn-shanghai.aliyuncs.com/user/1178/EnterpriseValidate/1479112747473.jpeg" alt=""/>
            <div>
              <div>
                <span>张成</span>
                <span><MemberCard /></span>
              </div>
              <div>ID:12231</div>
            </div>
          </div>
        </div>
      </Modal>
    )
  }
})

export default EnableRole
