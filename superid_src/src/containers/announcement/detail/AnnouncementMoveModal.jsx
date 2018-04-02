import React from 'react'
import { Modal, Select, Form, Message } from 'antd'
import { fromJS, List } from 'immutable'
import _ from 'underscore'
import config from '../../../config'
import urlFormat from 'urlFormat'
import messageHandler from 'messageHandler'
import styles from './AnnouncementMoveModal.scss'

const SEARCH_DELAY = 200

const AnnouncementMoveModal = React.createClass({
  getDefaultProps(){
    return {
      visible: true,
    }
  },
  getInitialState(){
    return {
      searchText: '',
      dataSourceList: List(),
      selected: null,
      showValidation: false,
    }
  },
  componentWillMount(){
    this.onSearch()
  },
  onSearch(keyword = '') {
    const { affair, announcement } = this.props
    fetch(urlFormat(config.api.announcement.searchForMove(), {
      targetAnnouncementId: announcement.get('announcementId'),
      title: keyword,
      lastIndex: 0,
      limit: 99,
    }), {
      method: 'GET',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        const dataSourceList = fromJS(json.data.list)
        this.setState({
          dataSourceList,
          searchText: keyword,
          hasMore: json.data.hasMore,
        })
      }
    })
  },
  onSelect(announcementId){
    this.setState({ selected: announcementId })
  },
  onCancel(){
    this.props.onCancel && this.props.onCancel()
  },
  onSubmit(){
    const { affair, announcement } = this.props
    const { selected } = this.state
    this.setState({ showValidation: true })
    if (selected) {
      fetch(urlFormat(config.api.announcement.move(), {
        toBeMovedAnnouncementId: announcement.get('announcementId'),
        announcementId: selected,
      }), {
        method: 'POST',
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        resourceId: announcement.get('announcementId'),
      }).then((res) => res.json()).then(messageHandler).then((json) => {
        if (json.code == 0) {
          Message.success('移动成功')
          this.onCancel()
        }
      })
    }
  },
  render(){
    const { visible } = this.props
    const { searchText, dataSourceList, selected, showValidation } = this.state
    const parentAnnouncement = this.props.announcement.get('parentAnnouncement')
    return (
      <Modal
        title="移动发布"
        visible={visible}
        wrapClassName={styles.modal}
        width={500}
        maskClosable={false}
        onCancel={this.onCancel}
        onOk={this.onSubmit}
      >
        <div className={styles.body}>
          <Form onSubmit={this.onSubmit}>
            <div className={styles.controlWrapper}>
              <div>当前位置</div>
              <div className={styles.breadcrumb}>
                {parentAnnouncement == null ?
                  <div className={styles.name}>无</div>
                : (
                  <div className={styles.name}>{`${parentAnnouncement.get('id')}-${parentAnnouncement.get('title')}`}</div>
                )}
              </div>
            </div>
            <div className={styles.controlWrapper}>
              <div>新的父页面</div>
              <Form.Item
                validateStatus={showValidation && selected == null ? 'error' : ''}
                help={showValidation && selected == null ? '*' : ''}
              >
                <Select
                  showSearch
                  showArrow={false}
                  filterOption={false}
                  placeholder="输入页面标题来查看建议的页面列表"
                  onSearch={_.debounce(this.onSearch, SEARCH_DELAY)}
                  onSelect={this.onSelect}
                >
                  {dataSourceList
                    .filter((announcement) => (`${announcement.get('id')}-${announcement.get('title')}`).includes(searchText))
                    .map((announcement) => {
                      const announcementId = announcement.get('id')
                      const text = `${announcement.get('id')}-${announcement.get('title')}`
                      return searchText == '' ? (
                        <Select.Option className={styles.option} key={announcementId}>
                          <div>{text}</div>
                        </Select.Option>
                      ) : (
                        <Select.Option className={styles.option} key={announcementId}>
                          <div className={styles.inline}>{text.split(searchText)[0]}</div>
                          <div className={`${styles.active} ${styles.inline}`}>{searchText}</div>
                          <div className={styles.inline}>{text.split(searchText)[1]}</div>
                        </Select.Option>
                      )
                    })}
                </Select>
              </Form.Item>
            </div>
          </Form>
        </div>
      </Modal>
    )
  },
})

export default Form.create()(AnnouncementMoveModal)
