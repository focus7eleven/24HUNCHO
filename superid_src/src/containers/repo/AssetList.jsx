
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { pushURL } from 'actions/route'
import styles from './AssetList.scss'
import { Input, Button, Icon, Form, message as ShowMessage, Modal, Radio } from 'antd'
import { SearchIcon, ArrowDropDown } from 'svg'
import config from '../../config'
import { List, Map, fromJS } from 'immutable'
import OfficialListComponent from '../announcement/OfficialListComponent'

const FormItem = Form.Item
const RadioGroup = Radio.Group

const AssetList = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired,
  },
  getInitialState(){
    return {
      affairList: Map(),
      openWarehouse: List(),
      openAffair: List(),
      addSceneWarehouseAuthorities: List(),
      showAddSceneWarehouse: false,
    }
  },
  componentDidMount() {
    this.fetchWarehouseList(this.props)
  },
  componentWillReceiveProps(nextProps) {
    if ((this.props.affair.get('id') != nextProps.affair.get('id')) || (this.props.affair.get('roleId') != nextProps.affair.get('roleId'))) {
      this.fetchWarehouseList(nextProps)
    }
  },
  fetchWarehouseList(props){
    fetch(config.api.material.warehouse.overview(), {
      method: 'GET',
      credentials: 'include',
      affairId: props.affair.get('id'),
      roleId: props.affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      //默认展开当前事物的仓库
      if (json.code === 0) {
        const { affairWarehouses } = json.data
        let { affairList, openWarehouse } = this.state
        affairWarehouses['0']
          .concat(affairWarehouses['10'] || [])
          .concat(affairWarehouses['20'] || [])
          .concat(affairWarehouses['21'] || [])
          .concat(affairWarehouses['22'] || [])
          .map((v) => {
            if (v.warehouse){
              openWarehouse = openWarehouse.push(v.warehouse.id)
            }
          })
        fetch(config.api.affair.children.get(), {
          method: 'GET',
          credentials: 'include',
          affairId: props.affair.get('id'),
          roleId: props.affair.get('roleId'),
        }).then((res) => res.json()).then((json) => {
          if (json.code === 0){
            affairWarehouses.child = json.data
            affairList = affairList.set(this.props.affair.get('id'), affairWarehouses)
            this.setState({
              affairList,
              openWarehouse,
            })
          }
        })
      }
    })
  },
  handleOpenWarehouse(id){
    let { openWarehouse } = this.state
    if (openWarehouse.some((v) => {return v == id})){
      openWarehouse = openWarehouse.filter((v) => {return v != id})
    }
    else {
      openWarehouse = openWarehouse.push(id)
    }
    this.setState({
      openWarehouse
    })
  },
  handleOpenAffair(child){
    let { openAffair, affairList } = this.state
    if (openAffair.some((v) => {return v == child.id})){
      openAffair = openAffair.filter((v) => v != child.id)
      this.setState({ openAffair })
    }
    else {
      //如果该子事务已经取过
      if (affairList.some((v, k) => {return k == child.id})){
        openAffair = openAffair.push(child.id)
        this.setState({ openAffair })
      }
      else {
        fetch(config.api.material.warehouse.overview(), {
          method: 'GET',
          credentials: 'include',
          affairId: child.id,
          roleId: this.props.affair.get('roleId'),
        }).then((res) => res.json()).then((json) => {
          if (json.code === 0){
            const { affairWarehouses } = json.data
            fetch(config.api.affair.children.get(), {
              method: 'GET',
              credentials: 'include',
              affairId: child.id,
              roleId: this.props.affair.get('roleId'),
            }).then((res) => res.json()).then((json) => {
              if (json.code === 0){
                affairWarehouses.child = json.data
                affairList = affairList.set(child.id, affairWarehouses)
                openAffair = openAffair.push(child.id)
                this.setState({
                  affairList,
                  openAffair
                })
              }
            })
          }
        })
      }
    }
  },
  renderAsset(v, k){
    return (<div className={styles.warehouseContainer} key={k}>
      <div className={styles.title}>
        <div className={styles.left}>
          {
            v.warehouse.avatar
              ?
                <img src={v.warehouse.avatar} className={styles.avatar}/>
              :
                <div className={styles.avatar} style={{ backgroundColor: '#e9e9e9' }} />
          }
          <div className={styles.avatar} />
          <span className={styles.name}>{v.warehouse.name}{v.warehouse.type == 0 ? '的公共仓库' : v.warehouse.type == 10 ? '的仓库' : '场景仓库'}</span>
        </div>
        {v.materials.length === 0 ? null :
        <ArrowDropDown height="24px" fill="#9b9a9b" onClick={this.handleOpenWarehouse.bind(null, v.warehouse.id)} style={this.state.openWarehouse.some((id) => {return id == v.warehouse.id}) ? { transform: 'rotate(180deg)' } : {}}/>
      }</div>
      {
        this.state.openWarehouse.some((id) => {return id == v.warehouse.id}) && v.materials.length != 0
            ?
              <div className={styles.table}>
                <div className={styles.tableHeader}>
                  <div className={styles.assetName} style={{ color: '#9b9a9b' }}>名称</div>
                  <div className={styles.assetCode} style={{ color: '#9b9a9b' }}>编码</div>
                  <div className={styles.assetNumber} style={{ color: '#9b9a9b' }}>数量</div>
                  <div className={styles.assetUnit} style={{ color: '#9b9a9b' }}>单位</div>
                  <div className={styles.assetType} style={{ color: '#9b9a9b' }}>类别</div>
                </div>
                {v.materials.map((a, key) => {
                  return (<div className={styles.tableRow} key={key}>
                    <div className={styles.assetName}>{a.name}</div>
                    <div className={styles.assetCode}>{a.id}</div>
                    <div className={styles.assetNumber}>{a.quantity}</div>
                    <div className={styles.assetUnit}>{a.unit}</div>
                    <div className={styles.assetType}>{a.type}</div>
                  </div>)
                })}
              </div>
            :
            null
      }

    </div>)
  },
  renderAffairAsset(affairId){
    const { affairList, openAffair } = this.state
    const showAffair = affairList.get(affairId)
    return showAffair
        ?
          <div className={styles.content}>

            {
              showAffair['0'].map((v, k) => {
                return this.renderAsset(v, k)
              })
            }
            {
              showAffair['10'].map((v, k) => {
                return this.renderAsset(v, k)
              })
            }
            {
              (showAffair['20'].concat(showAffair['21'] || []).concat(showAffair['22'] || [])).map((v, k) => {
                return this.renderAsset(v, k)
              })
            }

            {
              showAffair.child.map((v, k) => {
                return (<div className={styles.childAffair} key={k}>
                  <div className={styles.header} onClick={this.handleOpenAffair.bind(null, v)}>
                    {
                      openAffair.some((id) => {
                        return id == v.id
                      })
                        ?
                          <Icon type="minus-square-o"/>
                        :
                          <Icon type="plus-square-o"/>
                    }
                    <span className={styles.affairName}>{v.name}</span>
                    <div className={styles.leftBord} style={{ backgroundColor: (openAffair.some((id) => {return id == v.id}) ? '#7e35f0' : '#f89219') }} />
                  </div>
                  {
                    openAffair.some((id) => {
                      return id == v.id
                    })
                      ?
                        this.renderAffairAsset(v.id)
                      :
                      null
                  }
                </div>)
              })

            }
          </div>
        :
        null
  },
  renderHeader(){
    return (<div className={styles.topHeader}>
      <div><span>{`${this.props.affair.get('name')}物资总览`}</span></div>
      <div className={styles.navigateBar} onClick={() => {
        this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/assets`)
      }}
      >&lt;&nbsp;返回仓库列表
      </div>
    </div>)
  },
  renderAddSceneModal() {
    const { getFieldDecorator } = this.props.form
    const { affair } = this.props
    const nameDecorator = getFieldDecorator('name', {
      validate: [{
        rules: [
          { required: true, message: '请输入仓库名' },
        ],
        trigger: 'onBlur',
      }]
    })
    return !this.state.showAddSceneWarehouse ? null : (
      <Modal
        title="添加场景仓库"
        visible
        wrapClassName={styles.addSceneWarehouseModal}
        width={500}
        onOk={this.handleAddSceneWarehouseSubmit}
        onCancel={() => this.setState({ showAddSceneWarehouse: false })}
      >
        {/* 仓库名称 */}
        <Form layout="horizontal">
          <FormItem
            label="仓库名"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
          >
            {nameDecorator(<Input />)}
          </FormItem>

          {/* 仓库可见性 */}
          <FormItem
            label="可见性"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
          >
            {getFieldDecorator('visibility', { initialValue: 20 })(<RadioGroup>
              <Radio value={20}>事务内可见</Radio>
              <Radio value={21}>盟内可见</Radio>
              <Radio value={22}>盟客网可见</Radio>
            </RadioGroup>)}
          </FormItem>

          <FormItem
            label="负责人"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
          >
            <OfficialListComponent
              roleId={affair.get('roleId')}
              affairId={parseInt(affair.get('id'))}
              canRemoveSelf
              showTitle
              usePrimaryRoleFilter
              officialList={this.state.addSceneWarehouseAuthorities.toJS()}
              onAddOfficial={(v) => this.setState({ addSceneWarehouseAuthorities: this.state.addSceneWarehouseAuthorities.push(fromJS(v)) })}
              onDeleteOfficial={(v) => {
                const nextAuthorities = this.state.addSceneWarehouseAuthorities.filter((w) => (w.get('roleId') != v.roleId))
                this.setState({ addSceneWarehouseAuthorities: nextAuthorities })
              }}
            />
          </FormItem>

          <FormItem
            label="介绍"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 15 }}
          >
            {getFieldDecorator('description', { initialValue: '' })(<Input type="textarea" autosize={{ minRows: 5, maxRows: 5 }} />)}
          </FormItem>
        </Form>
      </Modal>
    )
  },
  handleAddSceneWarehouseSubmit() {
    this.props.form.validateFields((errors, values) => {
      if (errors) {
        return
      }
      const affair = this.props.affair
      let tmp = []
      this.state.addSceneWarehouseAuthorities.map((v) => {
        tmp.push(v.get('roleId'))
      })
      if (tmp.length == 0) {
        ShowMessage.error('请选择负责人', 2)
        return
      }

      fetch(config.api.material.warehouse.post(), {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        body: JSON.stringify({
          name: values.name,
          type: values.visibility,
          leaderIds: tmp,
          description: values.description,
        }),
      }).then((res) => res.json()).then((res) => {
        if (res.code === 0) {
          this.fetchWarehouseList(this.props)
          this.setState({
            showAddSceneWarehouse: false,
          })
        } else {
          ShowMessage.error(`错误码：${res.code}`, 2)
        }
      })
    })
  },

  render(){
    return (<div className={styles.assetListContainer}>
      {this.renderHeader()}
      <div className={styles.topContent}>
        <div className={styles.header}>
          <Input placeholder="搜索物资"/>
          <SearchIcon height="16"/>
          <Button type="ghost" onClick={() => {this.setState({ showAddSceneWarehouse: true })}}>+&nbsp;添加场景仓库</Button>
        </div>
        {this.renderAffairAsset(this.props.affair.get('id'))}
        {this.renderAddSceneModal()}
      </div>
    </div>)
  }
})

export default connect(null, (dispatch) => ({ pushURL: bindActionCreators(pushURL, dispatch) }))(Form.create()(AssetList))
