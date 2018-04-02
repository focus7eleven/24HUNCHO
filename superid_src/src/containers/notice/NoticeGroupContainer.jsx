import React from 'react'
import config from '../../config'
import { DropDownIcon, LoadingIcon, TreeIcon } from 'svg'
import { notificationTime } from 'time'
import urlFormat from 'urlFormat'
import styles from './NoticeGroupContainer.scss'
import { fromJS, List } from 'immutable'
import { MESSAGE_GROUP } from '../../actions/notification'
import NoticeItem from './NoticeItem'

const NoticeGroupContainer = React.createClass({
  getInitialState(){
    return {
      groupList: List(),
    }
  },
  componentWillMount(){
    const { type, state, roleId, groupType } = this.props

    // 获取分组信息
    let params = {}
    params['group'] = groupType
    params['readState'] = state
    fetch(urlFormat(config.api.message.sender.getByGroup(type, roleId), params), {
      method: 'GET',
      json: true,
    }).then((res) => (res.json()))
      .then((json) => {
        if (json.code == 0) {
          let groups = json.data.groups
          groups.forEach((group) => {
            group.showChildren = false
            group.children = []
          })
          this.setState({ groupList: fromJS(groups) })
        }
      })
  },
  handleClickGroup(index){
    // 如果是第一次展开分组，需要加载数据
    const showChildren = this.state.groupList.getIn([index, 'showChildren'], false)
    if (!showChildren) {
      this.fetchGroupMessage(index)
    }
    this.setState({
      groupList: this.state.groupList
        .setIn([index, 'showChildren'], !showChildren),
    })
  },
  handleClickLoadMore(index){
    this.fetchGroupMessage(index)
  },
  fetchGroupMessage(index){
    this.setState({
      groupList: this.state.groupList
        .setIn([index, 'isLoading'], true),
    })

    const { type, roleId, groupType, mode } = this.props
    const { groupList } = this.state
    const group = groupList.get(index)

    const getMinTime = (noticeList) => {
      let min = new Date().getTime()
      noticeList.forEach((notice) => {
        min = Math.min(min, notice.get('sendTime'))
      })
      return min
    }

    let params = {}
    params['id'] = group.get('groupId')
    params['sendTime'] = getMinTime(group.get('children'))
    params['limit'] = 5
    params['group'] = groupType

    fetch(urlFormat(config.api.message.sender.groupDetail(type, roleId), params), {
      method: 'GET',
      json: true,
    }).then((res) => (res.json()))
      .then((json) => {
        if (json.code == 0) {
          const { notices, hasMore } = json.data
          this.setState({
            groupList: this.state.groupList
              .updateIn([index, 'children'], (children) => {
              //合并noticeId一致的消息
                const newMessages = fromJS(notices)
                newMessages.forEach((newMessage) => {
                  const index = children.findIndex((message) => (message.get('noticeId') == newMessage.get('noticeId')))
                  if (index >= 0) {
                    children = children.set(index, newMessage)
                  } else {
                    children = children.push(newMessage)
                  }
                })
                return children
              })
              .setIn([index, 'hasMore'], hasMore)
              .setIn([index, 'isLoading'], false),
          })
          this.props.updateNotificationList(roleId, mode, notices)
        }
      })
  },

  render(){
    const { groupList } = this.state
    const { roleId, mode, groupType, notificationList } = this.props

    //构造过滤器
    let messageFilter = null
    if (groupType == MESSAGE_GROUP.ROLE) {
      messageFilter = (group) => (message) => (message.get('senderRoleId') == group.get('groupId'))
    } else if (groupType == MESSAGE_GROUP.TASK) {
      messageFilter = (group) => (message) => (message.get('taskId') == group.get('groupId'))
    } else {
      messageFilter = () => () => (true)
    }

    //获取过滤后的数据并设置入分组中
    const showableGroupList = groupList.map((group) => {
      return group.set('children', notificationList.filter(messageFilter(group)))
    })
    return (
      <div className={styles.container}>
        {showableGroupList.length != 0 ?
          showableGroupList.map((group, index) => {
            return (
              <div className={styles.groupWrapper} key={group.get('groupId')}>
                <div className={styles.mainItem} onClick={() => {this.handleClickGroup(index)}}>
                  <TreeIcon className={styles.treeIcon} />
                  <div className={styles.basic}>{group.get('groupName')}：</div>
                  <div className={styles.extra}>{group.get('count')}条消息</div>
                  {group.get('count') != 0 && (
                    group.get('showChildren', false) ?
                      <DropDownIcon className={styles.dropDownIcon} style={{ transform: 'rotate(-180deg)' }} />
                    :
                      <DropDownIcon className={styles.dropDownIcon} style={{ transform: 'rotate(0deg)' }} />
                  )}
                  <div className={styles.time}>{notificationTime(group.get('maxTime'))}</div>
                </div>
                {group.get('showChildren', false) &&
                <div className={styles.subItem}>
                  {group.get('children').map((item) => {
                    return (
                      <NoticeItem
                        key={item.get('noticeId')}
                        item={item}
                        roleId={roleId}
                        mode={mode}
                        disabled={false}
                        hasIcon
                        handleContainerClose={() => {this.handleContainerClose()}}
                        updateNotificationList={(roleId, mode, data) => {this.props.updateNotificationList(roleId, mode, data)}}
                      />
                    )
                  })}
                  {group.get('hasMore', false) &&
                  <div className={styles.loadMore} onClick={() => {this.handleClickLoadMore(index)}}>
                    {group.get('isLoading') && <LoadingIcon />}
                        加载更多
                  </div>
                    }
                </div>
                }
              </div>
            )
          })
        :
          /* 如果没有分组列表，则要显示空 */
          null
        }
      </div>
    )
  }
})

export default NoticeGroupContainer
