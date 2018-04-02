import React from 'react'
import { Modal } from 'antd'
import styles from './WorkInfoModal.scss'
import { workStateList } from '../constant/AnnouncementConstants'
import { RoleItem } from '../../../components/role/RoleSelector'
import moment from 'moment'

const WorkInfoModal = React.createClass({

  handleCancel(){
    this.props.onCancelCallback()
  },
  render(){
    const { work } = this.props
    const currentState = workStateList.find((v) => {
      return v.get('state') == work.state
    })
    return (
      <Modal visible
        footer={null}
        title="查看工作"
        onCancel={this.handleCancel}
        wrapClassName={styles.infoModal}
      >
        <div className={styles.main}>
          <div className={styles.item}>
            <div className={styles.label}>工作名称：</div>
            <div className={styles.content}>{work.title}</div>
          </div>
          <div className={styles.item}>
            <div className={styles.label}>截止时间：</div>
            <div className={styles.content}>{moment(work.endTime).format('YYYY/MM/DD hh:ss')}</div>
          </div>
          <div className={styles.item}>
            <div className={styles.label}>状态：</div>
            <div className={styles.content}>
              <span><span className={styles.icon} style={{ backgroundColor: currentState.get('icon') }}/>{currentState.get('text')}</span>
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.label}>负责人：</div>
            <div className={styles.content}>
              {work.responsor ?
                <RoleItem role={work.responsor}/>
              :
                null
              }
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.label}>协作者：</div>
            <div className={styles.content}>
              {work.cooperationRoles.size == 0 ? (
                <span style={{ color: '#aaa' }}>无</span>
              ) : (
                work.cooperationRoles.map((v, k) => {
                  return (
                    <RoleItem role={v} key={k} />
                  )
                })
              )}
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.label}>备注：</div>
            <div className={styles.content}>{work.remark}</div>
          </div>
        </div>
      </Modal>
    )
  }
})

export default WorkInfoModal
