import React from 'react'
import { Button } from 'antd'
import CreateActivityModal from '../../components/modal/CreateActivityModal'
import NewFolderModal from '../../components/modal/NewFolderModal'

class TestModalContainer extends React.Component {
  state = {
    createActivity1: false,
    createActivity2: false,
    newFolder: false,
  }

  handleOpen = (type) => {
    let obj = {}
    obj[type] = true
    this.setState(obj)
  }

  handleClose = (type) => {
    let obj = {}
    obj[type] = false
    this.setState(obj)
  }

  render() {
    const { createActivity1, createActivity2, newFolder } = this.state
    return (
      <div style={{padding: 100}}>
        <Button onClick={this.handleOpen.bind(this, 'createActivity1')}>创建作业</Button>
        <Button onClick={this.handleOpen.bind(this, 'createActivity2')}>创建考试</Button>
        <Button onClick={this.handleOpen.bind(this, 'newFolder')}>上传文件夹</Button>

        <CreateActivityModal title="作业" visible={createActivity1} onClose={this.handleClose.bind(this, 'createActivity1')}/>
        <CreateActivityModal title="考试" visible={createActivity2} onClose={this.handleClose.bind(this, 'createActivity2')}/>
        <NewFolderModal visible={newFolder} onClose={this.handleClose.bind(this, 'newFolder')}/>
      </div>
    )
  }
}

export default TestModalContainer
