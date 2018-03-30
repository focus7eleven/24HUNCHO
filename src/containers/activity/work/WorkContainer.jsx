import React from 'react'
import { fromJS } from 'immutable'
import { Button, message } from 'antd'
import styles from './WorkContainer.scss'
import WorkItem from './WorkItem'
import { USER_ROLE_TYPE } from 'member-role-type'
import CreateWorkModal from './modal/CreateWorkModal'
import WorkInfoModal from './modal/WorkInfoModal'

export const WORK_STATE = {
  WAIT_BEGIN: 0,
  ONGOING: 1,
  PENDING: 2,
  FINISHED: 3,
  CANCELED: 4
}

export const WORK_STATE_ATTR = [
  { icon: 'green', text: '未开始' },
  { icon: '#926dea', text: '进行中' },
  { icon: '#f45b6c', text: '暂停中' },
  { icon: '#55cce9', text: '已完成' },
  { icon: '#9b9b9b', text: '已取消' }
]

export const OPT_TYPE = {
  EDIT: 0,
  CREATE: 1,
  DELETE: 2
}

export const UPDATE_TYPE = {
  SIMPLE: 0, // 更改某个状态（工作状态）
  COMPLEX: 1, // 使用modal进行更新
}

class WorkContainer extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      showEditWorkModal: false,
      currentWorkId: null,
      showWorkInfoModal: false,
    }
  }

  onShowWorkInfo = (id) => {
    this.setState({
      showWorkInfoModal: true,
      currentWorkId: id
    })
  }

  onCreateWork = () => {
    this.setState({
      showEditWorkModal: true,
      currentWorkId: null
    })
  }

  onUpdateWork = (id, changeState) => {
    const currentWork = this.props.workList.find((v) => {
      if (v.get('id') == id) {
        return v
      }
    })
    if (!currentWork) {
      console.log('未找到对应id的工作',id)
      return
    }
    if (changeState) {
      //更新工作状态
      const formValue = {
        name: currentWork.get('title'),
        note: currentWork.get('note'),
        offTime: currentWork.get('endTime'),
        roleId: currentWork.get('responsor').get('roleId'),
        roleIds: currentWork.get('cooperationRoles'),
        state: changeState
      }
      this.handleUpdateWork(formValue)
    } else {
      // 需要更新整个工作，展示修改工作的modal
      this.setState({
        showEditWorkModal: true,
        currentWorkId: id,
      })
    }
  }

  handleCreateWork = (value) => {
    console.log('create', value)
  }

  handleUpdateWork = (value) => {
    console.log('update', value)
  }

  handleDeleteWork = (id) => {
    console.log('delete', id)
  }

  render() {
    const { workList, optRoleType } = this.props;
    const { showEditWorkModal, currentWorkId, showWorkInfoModal } = this.state;

    const currentWork = workList.find((v) => {
      if (v.get('id') == currentWorkId) {
        return v
      }
    })

    return (
      <div className={styles.container}>
        <div className={styles.title}>
          工作列表
          <Button type="primary" size="small" className={styles.createBtn} onClick={this.onCreateWork}>新建工作</Button>
        </div>
        <div className={styles.listContainer}>
          {workList.map((v, k) => {
            return (
              <WorkItem
                key={k}
                work={v}
                optRoleType={optRoleType}
                updateCallback={this.onUpdateWork}
                deleteCallback={this.handleDeleteWork}
                showInfoCallback={this.onShowWorkInfo}
              />
            )
          })}
        </div>
        { showEditWorkModal &&
          <CreateWorkModal
            type={ currentWorkId ? OPT_TYPE.EDIT : OPT_TYPE.CREATE }
            work={ currentWork }
            onCancelCallback={ () => this.setState({ showEditWorkModal: false, currentWorkId: null}) }
            submitCallback={ currentWorkId ? this.handleUpdateWork : this.handleCreateWork }
          />
        }

        { showWorkInfoModal &&
          <WorkInfoModal
            work={currentWork}
            onCancelCallback={() => this.setState({ showWorkInfoModal: false, currentWorkId: null})}
          />
        }
      </div>
    )
  }
}

WorkContainer.defaultProps = {
  optRoleId: 1001,
  optRoleType: USER_ROLE_TYPE.TEACHER,
  workList: fromJS([
    {
      id: 1001,
      title: '工作标题',
      responsor: {
        roleTitle: '前端开发',
        username: '张文玘',
        avatar: '',
        roleId: 1001,
      },
      cooperationRoles: [
        {
          roleTitle: '安卓',
          username: '张文玘',
          avatar: '',
          roleId: 1002,
        }, {
          roleTitle: '前端开发',
          username: '陈硕',
          avatar: '',
          roleId: 1003
        }, {
          roleTitle: '需求',
          username: '刘立丹',
          avatar: '',
          roleId: 1004
        }, {
          roleTitle: '后端',
          username: '魏天',
          avatar: '',
          roleId: 1005
        }
      ],
      endTime: '2017年12月25日',
      note: '这里是备注这里是备注这里是备注这里是备注这里是备注这里是备注',
      state: WORK_STATE.WAIT_BEGIN,
      overdue: false,
    }
  ])
}

export default WorkContainer
