import React from 'react'
import { Modal, Radio, Select, message } from 'antd'
import styles from './AddWorkRelationModal.scss'
import config from '../../config'

const Option = Select.Option

class AddWorkRelationModal extends React.Component {
  state = {
    relationFromStart: true,
    selectWork: null
  }

  renderContent() {
    return (
      <div className={styles.container}>
        <div className={styles.field}>
          <p>关联方式：</p>
          <Radio checked={this.state.relationFromStart} onChange={(e) => this.setState({ relationFromStart: e.target.checked })}>开始时开始</Radio>
          <Radio checked={!this.state.relationFromStart} onChange={(e) => this.setState({ relationFromStart: !e.target.checked })}>结束时开始</Radio>
        </div>
        <div className={styles.field}>
          <p>关联工作：</p>

          <Select
            showSearch
            style={{ width: 300 }}
            value={this.state.selectWork}
            onChange={(value) => this.setState({ selectWork: value })}
            optionFilterProp="children"
            placeholder="输入工作的编号标题来查看建议的工作列表"
            filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
          >
            {this.props.workList.filter((v) => v.get('announcementTaskId') != this.props.work.get('announcementTaskId')).map((v) => {
              return (
                <Option key={v.get('announcementTaskId').toString()}>{v.get('name')}</Option>
              )
            })}
          </Select>
        </div>
      </div>
    )
  }

  handleAddRelation = () => {
    if (this.state.selectWork) {
      const selectWork = this.props.workList.find((v) => v.get('announcementTaskId') == this.state.selectWork)

      fetch(config.api.announcement.detail.task.relation(this.props.work.get('announcementTaskId'), selectWork.get('announcementTaskId'), this.state.relationFromStart ? 0 : 1), {
        method: 'POST',
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
      }).then((res) => res.json()).then((json) => {
        if (json.code === 0) {
          this.props.onCancel()
        }
      })
    } else {
      message.error('请选择关联工作')
    }
  }

  render() {
    return (
      <Modal
        visible
        title="关联工作"
        onCancel={this.props.onCancel}
        onOk={this.handleAddRelation}
      >
        {this.renderContent()}
      </Modal>
    )
  }
}

export default AddWorkRelationModal
