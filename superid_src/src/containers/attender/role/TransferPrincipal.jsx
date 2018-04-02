import React from 'react'
import { Modal, Input } from 'antd'
import styles from './ModalCommon.scss'
import { LoadMoreIcon, SearchIcon, MemberCard } from 'svg'
import classNames from 'classnames'

let TransferPrincipal = React.createClass({
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

    return (
      <Modal
        wrapClassName={styles.commonModal}
        title="转移负责人"
        visible={visible}
        onCancel={onCloseModal}
        maskClosable={false}
      >
        <div className={styles.opt}>
          <div className={styles.role}>
            <img src="http://simucy.oss-cn-shanghai.aliyuncs.com/user/1178/EnterpriseValidate/1479112747473.jpeg" alt="用户"/>
            <div>
              <div>张怡</div>
              <div>CEO</div>
            </div>
          </div>
          <div className={styles.transfer}>
            <div>
              <span>转移给</span>
              <span><LoadMoreIcon /></span>
            </div>
          </div>
          <div className={styles.role}>
            <img src="http://simucy.oss-cn-shanghai.aliyuncs.com/user/1178/EnterpriseValidate/1479112747473.jpeg" alt="用户"/>
            <div>
              <div>张怡</div>
              <div>CEO</div>
            </div>
          </div>
        </div>

        <div className={styles.searchField}>
          <Input placeholder={'搜索用户名/角色/SuperID'} />
          <span className={styles.searchIcon}><SearchIcon/></span>
        </div>

        <div className={styles.memberList}>
          <div className={styles.member}>
            <img src="http://simucy.oss-cn-shanghai.aliyuncs.com/user/1178/EnterpriseValidate/1479112747473.jpeg" alt=""/>
            <div>
              <div>
                <span>张成</span>
                <span><MemberCard /></span>
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

export default TransferPrincipal