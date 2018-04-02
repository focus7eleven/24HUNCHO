import React from 'react'
import { Table } from 'antd'

const Tablet = React.createClass({
  getInitialState(){
    return {
      pagination: {
        defaultPageSize: 13,
      },
      columns: [
        {
          dataIndex: 'name',
          title: '用户名',
          // sorter:(a,b)=>a.name.localeCompare(b.name)
        }, {
          dataIndex: 'id',
          title: 'SuperId',
          // sorter:(a,b)=>a.id-b.id
        }, {
          dataIndex: 'sex',
          title: '性别',
          // sorter:(a,b)=>a.sex>b.sex?1:-1
        }, {
          dataIndex: 'role',
          title: '角色',
          // sorter:(a,b)=>a.role.length>b.role.length,
          // render:(text,record,lineindex)=><div>{text.map((self,index)=><p key={'role'+lineindex+index}>{self}</p>)}</div>
        }, {
          dataIndex: 'affair',
          title: '主事务',
          // render:(text,record,lineindex)=><div>{text.map((self,index)=><p key={'affair'+lineindex+index}>{self}</p>)}</div>
        },
      ],
    }
  },

  getDefaultProps(){
    let tableData = []
    for (let i = 0; i < 50; i++){
      tableData.push({
        key: i,
        name: 'kdot' + i,
        id: 'SuperId-' + i,
        sex: i % 2 ? '男' : '女',
        role: '123',
        affair: '345',
        // role: (i+1)%7?["工程师"]:["总经理","财务总监"],
        // affair: ["思目创意"],
      })
    }
    return {
      tableData: tableData,
    }
  },

  handleOnChange(){
    return
  },

  render(){
    return (<div>
      <Table columns={this.state.columns} dataSource={this.props.tableData} />
    </div>)
  }
})

export default Tablet
