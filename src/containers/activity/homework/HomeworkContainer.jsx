import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fromJS, List } from 'immutable'
import { Button, Row, Col, Table, notification, Upload } from 'antd'
import moment from 'moment'
import oss from 'oss'
import styles from './HomeworkContainer.scss'
import LateWorkModal from './modal/LateWorkModal'
import { USER_ROLE_TYPE } from 'member-role-type'
import { ACTIVITY_FILE_TYPE } from '../../../components/list/FileList'

import FileList from '../../../components/list/FileList'
import {
  getHomeworkSubmits,
  getHomeworkStatistics,
  submitHomework
} from '../../../actions/activity'

export const HOMEWORK_TYPE = {
  NORMAL: 0,
  GROUP: 1,
}

export const HOMEWORK_TYPES = ["普通作业", "小组作业"]


class HomeworkContainer extends React.Component {

  state = {
    showLateWorkModal: false,
    homeworkList: List(),
    isLoading: true,
    statistics: {
      submitted: 0,
      toSubmit: 0,
      total: 0,
    }
  }

  componentWillMount() {
    const {
      affairId,
      activityId,
      role,
      getHomeworkSubmits,
      getHomeworkStatistics,
      isGroup,
    } = this.props
    const needStatistics = (role.get('roleType') == USER_ROLE_TYPE.ASSISTANT || role.get('roleType') == USER_ROLE_TYPE.TEACHER) && !isGroup
    const getList = getHomeworkSubmits(affairId, role.get('roleId'), activityId)
    let promiseList = [getList]
    if (needStatistics) {
      const getStatistics = getHomeworkStatistics(affairId, role.get('roleId'), activityId)
      promiseList.push(getStatistics)
    }
    Promise.all(promiseList).then(res => {
      let homeworkList = this.state.homeworkList
      let statistics = this.state.statistics
      if (res[0].code === 0) {
        homeworkList = fromJS(res[0].data)
      } else {
        notification['error']({
          message: '获取提交作业列表失败',
          description: res[0].data
        })
      }

      if (res[1] && res[1].code === 0) {
        statistics = res[1].data
      } else if (res[1]){
        notification['error']({
          message: '获取作业统计数据失败',
          description: res[1].data
        })
      }

      this.setState({
        homeworkList,
        statistics,
        isLoading: false,
      })
    })
  }

  handleDownload = (file) => {
    const { affairId, role, activityId } = this.props
    oss.getFileTokenSimple(affairId, role.get('roleId'), file.attachmentUrl.toString(), file.fileName).then(url => {
      // 下载文件
      let link = document.createElement('a')
      // console.log(url)
      if (typeof link.download === 'string') {
        document.body.appendChild(link)
        link.download = file.fileName
        link.href = url
        link.click()
        document.body.removeChild(link)
      } else {
        location.replace(url)
      }
    })
  }

  handleDownloadBatch = (fileName) => {
    const { homeworkList } = this.state
    const { affairId, role } = this.props
    const paths = homeworkList.map((v) => {
      return v.get('attachmentUrl')
    }).toJS()
    const formData = new FormData()
    formData.append('paths', paths)
    oss.getBatchDownloadToken(affairId, role.get('roleId'), formData).then(url => {
      // 下载文件
      let link = document.createElement('a')
      console.log(url)
      if (typeof link.download === 'string') {
        document.body.appendChild(link)
        link.download = ''
        link.href = url
        link.click()
        document.body.removeChild(link)
      } else {
        location.replace(url)
      }
    })
  }

  handleRemind = (userId) => {
    console.log('remind ' + userId + 'to commit homework')
  }


  handleSelectedFiles = (files) => {
    const { affairId, role, activityId } = this.props
    for (let file of files) {
      oss.uploadAnnouncementSubmit(file, fromJS({ id: affairId, roleId: role.get('roleId') }), activityId).then(res => {
        if (res) {
          this.props.submitHomework(affairId, role.get('roleId'), activityId, file.name, files.size, res.path).then(res => {
            if (res.code === 0) {
              this.handleUpdateList()
              notification['success']({
                message: '上传成功',
              })
            }
          })
        }
      })
    }

  }

  handleUpdateList = () => {
    const { affairId, role, activityId } = this.props
    this.setState({
      isLoading: true,
    })
    this.props.getHomeworkSubmits(affairId, role.get('roleId'), activityId).then(res => {
      if (res.code === 0) {
        this.setState({
          homeworkList: fromJS(res.data),
          isLoading: false,
        })
      } else {
        notification['error']({
          message: '获取作业列表失败',
          description: res.data
        })
        this.setState({
          isLoading: false,
        })
      }
    })
  }

  render() {
    const {
      role,
      deadline,
      type,
      isGroup,
      affairId,
    } = this.props
    const {
      homeworkList,
      showLateWorkModal,
      statistics,
      isLoading,
    } = this.state

    const userType = role.get('roleType')

    let remainTime = moment(deadline).endOf('day').fromNow()
    if (remainTime.indexOf('前') >= 0) {
      remainTime = '已截止'
    }
    const isManager = userType == USER_ROLE_TYPE.TEACHER || userType == USER_ROLE_TYPE.ASSISTANT
    const canUpload = (type == HOMEWORK_TYPE.GROUP && !isManager && userType != USER_ROLE_TYPE.STUDENT) || (type == HOMEWORK_TYPE.NORMAL && !isManager) // 考虑作业提交，如果是学生角色（非小组 组员/组长），说明在课程的活动列表下，不允许在课程活动中提交作业

    const canDownloadBatch = !isGroup && (userType == USER_ROLE_TYPE.TEACHER || userType == USER_ROLE_TYPE.ASSISTANT)
    return (
      <div className={styles.container}>
        {!isGroup && (userType === USER_ROLE_TYPE.ASSISTANT || userType === USER_ROLE_TYPE.TEACHER) &&
          <div className={styles.statistics}>
            <Row>
              <Col span={10}>
                <div className={styles.item}>
                  <span className={styles.label}>参与人数/组数：</span>{statistics.total}
                </div>
              </Col>
              <Col span={8}>
                <div className={styles.item}>
                  <span className={styles.label}>提交：</span>{statistics.submitted}
                </div>
              </Col>
              <Col span={6}>
                <div className={styles.item}>
                  <span className={styles.label}>未交：</span>{statistics.toSubmit}
                </div>
              </Col>
              <Col span={10}>
                <div className={styles.item}>
                  <span className={styles.label}>截止时间：</span>{moment(deadline).format('YYYY年MM月DD日 dddd hh:mm:ss')}
                </div>
              </Col>
              <Col span={8}>
                <div className={styles.item}>
                  <span className={styles.label}>剩余时间：</span>{remainTime}
                </div>
              </Col>
            </Row>
          </div>
        }
        <FileList
          type={ACTIVITY_FILE_TYPE.HOMEWORK}
          deadline={deadline}
          fileList={homeworkList}
          canUpload={canUpload}
          isLoading={isLoading}
          canDownloadBatch={canDownloadBatch}
          downloadCallback={this.handleDownload}
          uploadCallback={this.handleSelectedFiles}
          downloadBatchCallback={this.handleDownloadBatch}
        />
        { showLateWorkModal &&
          <LateWorkModal
            onCancelCallback={() => this.setState({ showLateWorkModal: false })}
            onRemindCallback={() => this.handleRemind}
          />
        }

      </div>
    )
  }
}

function mapStateToProps(state, props) {
  return {
    role: state.getIn(['user', 'role'])
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getHomeworkSubmits: bindActionCreators(getHomeworkSubmits, dispatch),
    getHomeworkStatistics: bindActionCreators(getHomeworkStatistics, dispatch),
    submitHomework: bindActionCreators(submitHomework, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HomeworkContainer)
