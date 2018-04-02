import React from 'react'
import { Modal, Radio, Select, message } from 'antd'
import styles from './AddAnnouncementRelationModal.scss'
import config from '../../config'

const Option = Select.Option

class AddAnnouncementRelationModal extends React.Component {
  state = {
    relationFromStart: true,
    selectAnnouncement: null
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
          <p>关联发布：</p>

          <Select
            showSearch
            style={{ width: 300 }}
            value={this.state.selectAnnouncement}
            onChange={(value) => this.setState({ selectAnnouncement: value })}
            optionFilterProp="children"
            placeholder="输入发布的编号标题来查看建议的发布列表"
            filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
          >
            {this.props.announcementList.filter((v) => v.get('id') != this.props.announcement.get('announcementId')).map((v) => {
              return (
                <Option key={v.get('id').toString()}>{`${v.get('number')} - ${v.get('title')}`}</Option>
              )
            })}
          </Select>
        </div>
      </div>
    )
  }

  handleAddRelation = () => {
    if (this.state.selectAnnouncement) {
      const announcement = this.props.announcementList.find((v) => v.get('id') == this.state.selectAnnouncement)

      fetch(config.api.announcement.relation(this.props.announcement.get('announcementId'), announcement.get('id'), this.state.relationFromStart ? 0 : 1), {
        method: 'POST',
        affairId: this.props.affair.get('id'),
        roleId: this.props.affair.get('roleId'),
      }).then((res) => res.json()).then((json) => {
        if (json.code === 0) {
          this.props.onCancel()
        }
      })

    } else {
      message.error('请选择关联发布')
    }
  }

  render() {
    return (
      <Modal
        visible
        title="关联发布"
        onCancel={this.props.onCancel}
        onOk={this.handleAddRelation}
      >
        {this.renderContent()}
      </Modal>
    )
  }
}

export default AddAnnouncementRelationModal
