import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import moment from 'moment'
import { Spin, Tabs, Button, Tooltip, Select, DatePicker, notification } from 'antd'
import { fromJS, Map } from 'immutable'
import { Editor, EditorState, convertToRaw, convertFromRaw } from 'draft-js'
import { ArrowRight, TableInfoEdit } from 'svg'
import styles from './ActivityDetail.scss'
import { ACTIVITY_TYPE, ACTIVITY_ATTRS } from './ActivityList'
import { USER_ROLE_TYPE } from 'member-role-type'
import EditorDecorator from '../../components/editor/EditorDecorator'
import { inlineStyleMap, getBlockStyle, getBlockRender } from '../../components/editor/EditorControl'
import RoleItem from '../../components/RoleItem'
import CommentsContainer from './comment/CommentsContainer'
import WorkContainer from './work/WorkContainer'
import HomeworkContainer from './homework/HomeworkContainer'
import FileContainer from './attachment/FileContainer'
import { getActivityDetail } from '../../actions/activity'
import EditActivityModal from '../../components/modal/EditActivityModal'
import { HOMEWORK_TYPE, HOMEWORK_TYPES } from './homework/HomeworkContainer'

const DETAIL_TAB_TYPES = ['comment', 'work', 'files', 'homework']


const TabPane = Tabs.TabPane
const Option = Select.Option

class ActivityDetail extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      isLoading: true,
      activity: fromJS({
        id: 1001,
        type: ACTIVITY_TYPE.HOMEWORK,
        title: '教学活动的标题',
        ownerRole: {
          avatar: null,
          roleTitle: '副教授',
          username: '张文玘'
        },
        createTime: '2017年12月29日 20:30',

      }),
      affairId: null,
      editActivityModalState: false,
      isEditMode: false,
      // activity: Map(),
    }
  }

  getAffairId = (props) => {
    const path = props.location.pathname
    const regex = /^\/index\/course\/\d*\/group\/(\d*)\/.*$/
    const hasGroupId = regex.exec(path)
    const affairId = hasGroupId ? hasGroupId[1] : props.match.params.id
    return affairId
  }

  componentWillMount() {
    if (this.props.roleId !== -2) {
      this.fetchActivityDetail()
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.roleId > -1) {
      this.fetchActivityDetail(nextProps)
    }
  }

  fetchActivityDetail(props = this.props) {
    const affairId = this.getAffairId(props)
    this.props.getActivityDetail(props.match.params.activityId, affairId, props.role.get('roleId')).then(json => {
      if (json.code === 0) {
        this.setState({
          activity: fromJS(json.data),
          isLoading: false,
          affairId: affairId,
        })
      } else {
        notification['error']({
          message: '获取活动详情失败',
          description: json.data,
        })
        this.setState({
          isLoading: false,
          affairId,
        })
      }
    })
  }

  handleModifyActivity = () => {
    // 编辑发布
    this.setState({ editActivityModalState: true })
  }

  handleCancelEditModal = () => {
    this.setState({ editActivityModalState: false })
  }

  handleActivityEdited = () => {
    this.setState({ editActivityModalState: false })
    this.fetchActivityDetail()
  }

  handleChangeHomeworkType = ({key}) => {
    // 对作业类型的活动，如果是老师/助教可以直接修改作业的类型
    console.log(key)
  }

  handleChangeHomeworkEndTime = (time) => {
    // 对作业类型的活动，如果是老师/助教可以直接修改作业的截止时间
    // time需要用moment进行处理
  }

  backToList = () => {
    if (this.props.match.params.groupId) {
      this.props.history.push(`/index/course/${this.props.match.params.id}/group/${this.props.match.params.groupId}/activity`)
    } else {
      this.props.history.push(`/index/course/${this.props.match.params.id}/activity`)
    }
  }

  render() {
    const { activity, isLoading, affairId, editActivityModalState } = this.state

    const type = activity.get('type')
    const role = fromJS({
      title: activity.get('createRoleTitle'),
      realName: activity.get('creatorUserName'),
      avatar: activity.get('creatorAvatar')
    })
    const homeworkType = activity.get('homeworkType')
    if (isLoading) {
      return (
        <div className={styles.loadingContainer}>
          <Spin />
        </div>
      )
    }
    const isGroup = affairId == this.props.match.params.groupId

    let rawContent = JSON.parse(activity.get('content'))
    const contentState = activity.get('content') ? convertFromRaw(rawContent) : convertFromRaw(convertToRaw(EditorState.createEmpty(EditorDecorator).getCurrentContent()))
    const editorState = EditorState.createWithContent(contentState, EditorDecorator)
    const content = JSON.parse(activity.get('content'))

    const userType = this.props.role.get('roleType')
    const isManager = userType == USER_ROLE_TYPE.TEACHER || userType == USER_ROLE_TYPE.ASSISTANT
    return (
      <div className={styles.container}>
        <div className={styles.back} onClick={this.backToList}>
          <ArrowRight />
          返回活动列表
        </div>
        <div className={styles.detailContainer}>
          {activity.size !== 0 &&
            <div className={styles.contentContainer}>
              <div className={styles.headerContainer}>
                <div className={styles.header}>
                  <div className={styles.titleContainer}>
                    <span className={styles.icon} style={{color: ACTIVITY_ATTRS[type].color, borderColor: ACTIVITY_ATTRS[type].color}}>{ACTIVITY_ATTRS[type].text}</span>
                    <span className={styles.title}>{activity.get('title')}</span>
                  </div>
                  { isGroup ?
                    <div className={styles.editContainer} onClick={this.handleModifyActivity}>
                      <TableInfoEdit />
                      编辑
                    </div>
                    :
                    (userType == USER_ROLE_TYPE.TEACHER || userType == USER_ROLE_TYPE.ASSISTANT) &&
                    <div className={styles.editContainer} onClick={this.handleModifyActivity}>
                      <TableInfoEdit />
                      编辑
                    </div>
                  }

                </div>
                <div className={styles.info}>
                  <RoleItem role={role} />
                  <div className={styles.createTime}>
                    <span>{activity.get('createRoleTitle')}-{activity.get('creatorUserName')} </span>
                    <span>最近更新于{moment(activity.get('createTime')).format('YYYY年MM月DD日 kk:mm')}</span>
                  </div>
                </div>
              </div>
              {type == ACTIVITY_TYPE.HOMEWORK &&
                <div className={styles.homeworkInfo}>
                  <div className={styles.type}>
                    <span className={styles.infoLabel}>作业类型：</span>
                    {/* <Select defaultValue={homeworkType.toString()} style={{ width: 230 }} onChange={this.handleChangeHomeworkType} disabled={userType == USER_ROLE_TYPE.STUDENT}>
                      { HOMEWORK_TYPES.map((v, k) => {
                        return <Option key={k.toString()} value={k.toString()}>{v}</Option>
                      })}
                    </Select> */}
                    <span>{ HOMEWORK_TYPES[homeworkType] }</span>
                  </div>
                  <div className={styles.endTime}>
                    <span className={styles.infoLabel}>截止时间：</span>
                    <span>{ moment(activity.get('deadline')).format("YYYY-MM-DD HH:mm:ss") }</span>
                    {/* <DatePicker
                      style={{ width: 230 }}
                      showTime
                      defaultValue={moment(activity.get('deadline'))}
                      format="YYYY/MM/DD HH:mm"
                      placeholder="作业截止日期"
                      onOk={this.handleChangeHomeworkEndTime}
                      disabled={userType == USER_ROLE_TYPE.STUDENT}
                    /> */}
                  </div>
                </div>
              }
              <div className={styles.bodyContainer}>
                <Editor
                  className={styles.draftEditor}
                  blockRendererFn={getBlockRender.bind(this)}
                  blockStyleFn={getBlockStyle}
                  editorState={editorState}
                  customStyleMap={inlineStyleMap}
                  readOnly
                />
              </div>
            </div>
          }
          <div className={styles.tabContainer}>
            <Tabs defaultActiveKey={DETAIL_TAB_TYPES[0]} size="small">
              <TabPane tab="评论" key={DETAIL_TAB_TYPES[0]} className={styles.tabPane}>
                <CommentsContainer affairId={affairId} activityId={activity.get('id')}/>
              </TabPane>
              {/* <TabPane tab="工作" key={DETAIL_TAB_TYPES[1]} className={styles.tabPane}>
                <WorkContainer />
              </TabPane> */}
              <TabPane tab="文件" key={DETAIL_TAB_TYPES[2]} className={styles.tabPane}>
                <FileContainer
                  activityId={activity.get('id')}
                  affairId={affairId}
                  isGroup={isGroup}
                />
              </TabPane>
              {
                activity.get('type') != ACTIVITY_TYPE.HOMEWORK ?
                null
                :
                <TabPane tab={isManager ?  '作业统计' : '作业提交'} key={DETAIL_TAB_TYPES[3]}>
                  <HomeworkContainer
                    activityId={activity.get('id')}
                    affairId={affairId}
                    isGroup={isGroup}
                    type={homeworkType}
                    deadline={activity.get('deadline')}
                  />
                </TabPane>
                // (userType == USER_ROLE_TYPE.STUDENT) ?
                // <TabPane tab="作业提交" key={DETAIL_TAB_TYPES[3]}>
                //   <HomeworkContainer
                //     activityId={activity.get('id')}
                //     affairId={affairId}
                //     deadline={activity.get('deadline')}
                //   />
                // </TabPane>
                // :
                // <TabPane tab="作业统计" key={DETAIL_TAB_TYPES[3]}>
                //   <HomeworkContainer
                //     activityId={activity.get('id')}
                //     affairId={affairId}
                //     deadline={activity.get('deadline')}
                //   />
                // </TabPane>
              }

            </Tabs>
          </div>
        </div>

        <EditActivityModal
          affairId={affairId}
          title={ACTIVITY_ATTRS[type].text}
          visible={editActivityModalState}
          onClose={this.handleCancelEditModal}
          onSuccess={this.handleActivityEdited}
          activity={activity}
        />
      </div>
    )
  }
}

ActivityDetail.defaultProps = {
  userType: USER_ROLE_TYPE.ASSISTANT
}

function mapStateToProps(state, props) {
  return {
    role: state.getIn(['user', 'role']),
    roleId: state.getIn(['user', 'role', 'roleId']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getActivityDetail: bindActionCreators(getActivityDetail, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ActivityDetail)
