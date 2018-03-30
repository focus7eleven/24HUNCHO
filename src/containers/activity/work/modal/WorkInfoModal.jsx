import React from 'react'
import { Modal } from 'antd'
import styles from './WorkInfoModal.scss'
import { WORK_STATE_ATTR } from '../WorkContainer'
import RoleItem from '../../../../components/RoleItem'

class WorkInfoModal extends React.Component {

  handleCancel = () => {
    this.props.onCancelCallback()
  }
  render(){
    const { work } = this.props
    const currentState = WORK_STATE_ATTR.find((v,k) => {
      return k == work.get('state')
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
            <div className={styles.content}>{work.get('title')}</div>
          </div>
          <div className={styles.item}>
            <div className={styles.label}>截止时间：</div>
            <div className={styles.content}>{work.get('endTime')}</div>
          </div>
          <div className={styles.item}>
            <div className={styles.label}>状态：</div>
            <div className={styles.content}>
              <span><span className={styles.icon} style={{ backgroundColor: currentState.icon }}/>{currentState.text}</span>
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.label}>负责人：</div>
            <div className={styles.content}>
              {work.get('responsor') ?
                <RoleItem role={work.get('responsor')} />
              :
                null
              }
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.label}>协作者：</div>
            <div className={styles.content}>
              {work.get('cooperationRoles').map((v, k) => {
                return (
                  <RoleItem role={v} key={k} />
                )
              })}
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.label}>备注：</div>
            <div className={styles.content}>{work.get('note')}</div>
          </div>
        </div>
      </Modal>
    )
  }
}

export default WorkInfoModal
