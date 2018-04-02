import React from 'react'
import { connect } from 'react-redux'
import { fromJS, List } from 'immutable'
import { Input, Select, DatePicker } from 'antd'
import { SearchIcon } from 'svg'
import styles from './InteractAnnouncementContainer.scss'
import InteractAnnouncementGroup, { TEMPLATE, TEMPLATE_ATTRS } from './InteractAnnouncementGroup'
import { RoleSelector } from 'components/role/RoleSelector'
import { ANNOUNCEMENT_TYPE, ANNOUNCEMENT_TYPE_NAME } from '../AnnouncementFilterModal'
import config from '../../../config'
import messageHandler from 'messageHandler'
import moment from 'moment'
import imageNoRelease from 'images/img_no_release.png'

const Option = Select.Option
const RangePicker = DatePicker.RangePicker

const TEMPLATE_ALL = {
  index: -1,
  name: '全部',
}

const InteractAnnouncementContainer = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired,
  },
  getInitialState() {
    return {
      containChild: false,
      showCreateAnnouncementModal: false,
      announcementList: List(),
      filters: {
        keyword: '',
        plateType: `${TEMPLATE_ALL.index}`,
        dateRange: [],
        announcementType: ANNOUNCEMENT_TYPE.PROGRESS,
        roleList: List(),
        selectedRoleList: List(),
      },
    }
  },
  componentWillMount(){
    this.onSearch()
    this.fetchMainRoles()
  },
  componentWillReceiveProps(nextProps){
    if (nextProps.affair && nextProps.affair.get('id') != this.props.affair.get('id')) {
      this.onSearch(nextProps)
      this.fetchMainRoles()
    }
  },
  fetchMainRoles(){
    const { affair } = this.props
    fetch(config.api.affair.role.main_roles(), {
      method: 'GET',
      credentials: 'include',
      roleId: affair.get('roleId'),
      affairId: affair.get('id'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        this.setState({
          filters: {
            ...this.state.filters,
            roleList: fromJS(json.data || [])
          }
        })
      }
    })
  },
  onSearch(nextProps){
    this.setState({
      isLoading: true,
    })
    const { affair } = nextProps || this.props
    const { filters, containChild } = this.state
    fetch(config.api.announcement.outer(), {
      method: 'POST',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        containChild: containChild,
        content: (filters.keyword && filters.keyword != '') ? filters.keyword : null,
        plateType: filters.plateType,
        startTime: filters.dateRange.length != 0 ? filters.dateRange[0].valueOf() : null,
        endTime: filters.dateRange.length != 0 ? filters.dateRange[1].valueOf() : null,
        state: filters.announcementType,
        roleIds: filters.selectedRoleList.map((role) => role.get('roleId')).toJS(),
        lastTime: moment().valueOf(),
        limit: 20,
      }),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        const announcementList = fromJS(json.data.list)
        this.setState({
          announcementList,
          hasMore: json.data.hasMore,
          isLoading: false,
        })
      }
    })
  },
  onContainChild(val) {
    this.setState({
      containChild: val
    }, this.onSearch)
  },
  onSearchTextChange(e) {
    this.setState({
      filters: {
        ...this.state.filters,
        keyword: e.target.value,
      }
    }, this.onSearch)
  },
  /*
  * 筛选发布模板类型
  * @param index:String(Number) 发布模板枚举值
  */
  onPlateTypeChange(index) {
    this.setState({
      filters: {
        ...this.state.filters,
        plateType: Number.parseInt(index)
      }
    }, this.onSearch)
  },
  onAnnouncementTypeChange(announcementType) {
    this.setState({
      filters: {
        ...this.state.filters,
        announcementType
      }
    }, this.onSearch)
  },
  /*
  * @param dates:Array<moment>
  */
  onDateRangeChange(dates) {
    this.setState({
      filters: {
        ...this.state.filters,
        dateRange: dates,
      }
    }, this.onSearch)
  },
  onFilterRoleChange(selectedRoleList) {
    this.setState({
      filters: {
        ...this.state.filters,
        selectedRoleList,
      }
    }, this.onSearch)
  },
  render() {
    const { isLoading } = this.state

    let announcementGroupList = List()
    this.state.announcementList.forEach((announcement) => {
      const continious = announcementGroupList.size > 0 && announcementGroupList.last().get('id') == announcement.get('creatorId')
      if (continious) {
        announcementGroupList = announcementGroupList.update(
          announcementGroupList.size - 1,
          (group) => group.update(
            'items',
            (items) => items.push(announcement)
          )
        )
      } else {
        let announcementGroup = fromJS({
          id: announcement.get('creatorId'),
          items: fromJS([]).push(announcement),
        })
        announcementGroupList = announcementGroupList.push(announcementGroup)
      }
    })
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.title}>{`${this.props.affair.get('name')}协作发布`}</div>
        </div>
        <div className={styles.body}>
          <div className={styles.toolGroup}>
            <div className={styles.filterGroup}>
              <div className={styles.typeField}>
                <div className={styles.label}>类型：</div>
                <Select defaultValue={`${TEMPLATE_ALL.index}`} onChange={this.onPlateTypeChange}>
                  <Option key={TEMPLATE_ALL.index} value={`${TEMPLATE_ALL.index}`}>{TEMPLATE_ALL.name}</Option>
                  {Object.values(TEMPLATE).map((val) => {
                    const text = TEMPLATE_ATTRS[val].typeName || TEMPLATE_ATTRS[val].text
                    return (
                      <Option key={val} value={`${val}`}>{text}</Option>
                    )
                  })}
                </Select>
              </div>
              <div className={styles.divider} />
              <div className={styles.typeField + ' ' + styles.typeFieldWider}>
                <div className={styles.label}>状态：</div>
                <Select defaultValue={`${ANNOUNCEMENT_TYPE.PROGRESS}`} onChange={this.onAnnouncementTypeChange}>
                  <Option key={ANNOUNCEMENT_TYPE.ALL} value={`${ANNOUNCEMENT_TYPE.ALL}`}>{ANNOUNCEMENT_TYPE_NAME.ALL}</Option>
                  <Option key={ANNOUNCEMENT_TYPE.READY} value={`${ANNOUNCEMENT_TYPE.READY}`}>{ANNOUNCEMENT_TYPE_NAME.READY}</Option>
                  <Option key={ANNOUNCEMENT_TYPE.PROGRESS} value={`${ANNOUNCEMENT_TYPE.PROGRESS}`}>{ANNOUNCEMENT_TYPE_NAME.PROGRESS}</Option>
                  <Option key={ANNOUNCEMENT_TYPE.COMPLETE} value={`${ANNOUNCEMENT_TYPE.COMPLETE}`}>{ANNOUNCEMENT_TYPE_NAME.COMPLETE}</Option>
                  <Option key={ANNOUNCEMENT_TYPE.INVALID} value={`${ANNOUNCEMENT_TYPE.INVALID}`}>{ANNOUNCEMENT_TYPE_NAME.INVALID}</Option>
                </Select>
              </div>
              <div className={styles.divider} />
              <div className={styles.typeField}>
                <div className={styles.label}>角色：</div>
                <RoleSelector
                  className={styles.roleSelector}
                  roleList={this.state.filters.roleList}
                  onChange={this.onRoleChange}
                  selectedRoleList={this.state.filters.selectedRoleList}
                  onChange={this.onFilterRoleChange}
                >
                  <div className={styles.selectorText}>
                    {this.state.filters.selectedRoleList.size == 0 ?
                      '全部'
                    : (
                      this.state.filters.selectedRoleList.map((item) => item.get('roleTitle') + '－' + item.get('username')).toJS().join('、')
                    )}
                  </div>
                </RoleSelector>
              </div>
              <div className={styles.divider} />
              <div className={styles.typeField}>
                <div className={styles.label}>起止时间：</div>
                <RangePicker value={this.state.filters.dateRange} onChange={this.onDateRangeChange} />
              </div>
              <div className={styles.divider} />
              <div className={styles.searchField}>
                <SearchIcon />
                <Input placeholder="搜索关键词" value={this.state.filters.keyword} onChange={this.onSearchTextChange} />
              </div>
            </div>
          </div>
          <div className={styles.listContainer}>
            {announcementGroupList.map((announcementGroup, index) => {
              return (
                <InteractAnnouncementGroup
                  key={index}
                  announcementGroup={announcementGroup}
                  affair={this.props.affair}
                />
              )
            })}
            {(this.state.announcementList.size === 0 && !isLoading) &&
              <div className={styles.noAnnouncement}>
                <img key="img" src={imageNoRelease}/>
                <div key="text">暂无发布</div>
              </div>
            }
          </div>
        </div>
      </div>
    )
  },
})

export default connect((state, props) => {
  return {
    affair: state.getIn(['affair', 'affairMap', props.params.id])
  }
})(InteractAnnouncementContainer)
