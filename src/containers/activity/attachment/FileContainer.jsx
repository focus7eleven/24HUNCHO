import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fromJS, List } from 'immutable'
import oss from 'oss'
import { notification } from 'antd'
import FileList, { ACTIVITY_FILE_TYPE } from '../../../components/list/FileList'
import { USER_ROLE_TYPE } from 'member-role-type'
import { getAttachments, uploadAttachment, deleteAttachment } from '../../../actions/activity'


class FileContainer extends React.Component {
  state = {
    fileList: List(),
    isLoading: false,
  }
  componentWillMount() {
    this.fetchFileList()
  }

  fetchFileList = () => {
    const {
      affairId,
      role,
      activityId,
    } = this.props
    this.setState({
      isLoading: true,
    })
    this.props.getAttachments(affairId, role.get('roleId'), activityId).then(res => {
      if (res.code === 0) {
        this.setState({
          fileList: fromJS(res.data),
          isLoading: false,
        })
      } else {
        notification['error']({
          message: '获取活动文件列表失败',
          description: res.data
        })
        this.setState({
          isLoading: false,
        })
      }

    })
  }

  handleSelectedFiles = (files) => {
    const { affairId, role, activityId } = this.props
    let uploadFiles = List()
    let disUploadFiles = List()
    let promiseList = []
    for (let file of files) {
      promiseList.push(oss.uploadAnnouncementAttachmentPri(file, fromJS({ id: affairId, roleId: role.get('roleId') })))
    }
    Promise.all(promiseList).then(results => {
      results = fromJS(results)
      results.forEach((res, k) => {
        let file = files[k]
        if (!res) {
          const disUpFile = {
            fileName: file.name,
            size: file.size,
          }
          disUploadFiles = disUploadFiles.push(disUpFile)
        } else {

          const upFile = {
            url: res.get('path'),
            fileName: file.name,
            size: file.size,
          }
          uploadFiles = uploadFiles.push(upFile)
        }
      })
      // 上传到数据库
      this.props.uploadAttachment(affairId, role.get('roleId'), activityId, uploadFiles.toJS()).then(res=>{
        if (res.code === 0) {
          if (disUploadFiles.size !== 0) {
            notification['warning']({
              message: '以下文件上传未成功',
              description: disUploadFiles.map((v) => {
                return v.fileName+'/n'
              })
            })
          } else {
            notification['success']({
              message: '上传成功',
            })
            this.fetchFileList()
          }
        } else {
          notification['error']({
            message: '上传失败',
            description: res.data
          })
        }
      })
    })


  }

  handleDownload = (file) => {
    const { affairId, role, activityId } = this.props
    oss.getFileTokenSimple(affairId, role.get('roleId'), file.attachmentUrl, file.fileName).then(url => {
      // 下载文件
      let link = document.createElement('a')
      if (typeof link.download == 'string') {
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

  handleDelete = (file) => {
    const { affairId, role } = this.props
    const attachmentId = file.id
    this.props.deleteAttachment(affairId, role.get('roleId'), attachmentId).then(res => {
      if (res.code === 0) {
        notification['success']({
          message: '删除成功'
        })
        this.fetchFileList()
      } else {
        notification['error']({
          message: '删除失败',
          description: res.data,
        })
      }
    })
  }

  render() {
    const { fileList, isLoading } = this.state
    const { role, isGroup } = this.props
    const roleType = role.get('roleType')

    const canUpload = isGroup ? (roleType != USER_ROLE_TYPE.ADMIN) : (roleType == USER_ROLE_TYPE.ASSISTANT || roleType == USER_ROLE_TYPE.TEACHER)
    return (
      <div>
        <FileList
          fileList={fileList}
          type={ACTIVITY_FILE_TYPE.ATTACHMENT}
          canUpload={ canUpload }
          multiple={true}
          uploadCallback={this.handleSelectedFiles}
          downloadCallback={this.handleDownload}
          deleteCallback={this.handleDelete}
          isLoading={isLoading}
        />
      </div>
    )
  }
}

function mapStateToProps(state){
  return {
    role: state.getIn(['user', 'role']),
  }
}

function mapDispatchToProps(dispatch){
  return {
    getAttachments: bindActionCreators(getAttachments, dispatch),
    uploadAttachment: bindActionCreators(uploadAttachment, dispatch),
    deleteAttachment: bindActionCreators(deleteAttachment, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(FileContainer)
