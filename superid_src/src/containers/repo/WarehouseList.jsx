import React, { PropTypes } from 'react'
import { fromJS, List, Map } from 'immutable'
import classNames from 'classnames'
import { Modal, Form, Input, Radio, message as ShowMessage } from 'antd'
import styles from './WarehouseList.scss'
import { AddIcon, ArrowRight } from 'svg'
import AffairAvatar from '../../components/avatar/AffairAvatar'
import config from '../../config'
import OfficialListComponent from '../announcement/OfficialListComponent'
import messageHandler from 'messageHandler'
import imageNoPermission from 'images/img_no_permissions.png'
import PERMISSION from 'utils/permission'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { pushURL } from 'actions/route'

const FormItem = Form.Item
const RadioGroup = Radio.Group

export const WAREHOUSE_TYPE = {
  PUBLIC: 0,
  ROLE: 10,
  SCENES: [20, 21, 22]
}

let WarehouseList = React.createClass({
  propTypes: {
    affair: PropTypes.object.isRequired,
  },
  
  getInitialState() {
    return {
      sceneWarehouseList: fromJS([]),
      roleWarehouseList: fromJS([]),
      // childrenWarehouseList: fromJS([]),
      publicWarehouse: null,

      addSceneWarehouseAuthorities: List(),
      showAddSceneWarehouse: false,
      hasNoPermission: false,
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

  fetchWarehouseList(props) {
    fetch(config.api.material.warehouse.get(), {
      affairId: props.affair.get('id'),
      roleId: props.affair.get('roleId'),
      credentials: 'include',
      method: 'GET',
    }).then((res) => res.json()).then(messageHandler).then((res) => {
      if (res.code === 0) {
        const { affairWarehouses, } = res.data

        // 公共仓库
        const publicWarehouse = fromJS(affairWarehouses[WAREHOUSE_TYPE.PUBLIC][0])
        // 场景仓库
        const sceneWarehouseList = fromJS(
          WAREHOUSE_TYPE.SCENES.reduce(
            (reduce, scene) => reduce.concat(affairWarehouses[scene] || []),
            []
          )
        )
        // 角色仓库
        const roleWarehouseList = fromJS(affairWarehouses[WAREHOUSE_TYPE.ROLE])
        // 下级子事务的仓库
        // const childrenWarehouseList = fromJS(childrenAffairWarehouses)

        this.setState({
          sceneWarehouseList,
          roleWarehouseList,
          // childrenWarehouseList,
          publicWarehouse,
          hasNoPermission: false,
        })
      }
      else if (res.code == 403){
        this.setState({
          sceneWarehouseList: List(),
          roleWarehouseList: List(),
          publicWarehouse: null,
          hasNoPermission: true,
        })
      }
    })
  },

  handleAddSceneWarehouse() {
    this.setState({
      showAddSceneWarehouse: true,
    })
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
          'X-SIMU-AffairId': affair.get('id'),
          'X-SIMU-RoleId': affair.get('roleId')
        },
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        body: JSON.stringify({
          name: values.name,
          type: values.visibility,
          leaderIds: tmp,
          description: values.description,
        }),
      }).then((res) => res.json()).then(messageHandler).then((res) => {
        if (res.code === 0) {
          this.fetchWarehouseList(this.props)
          this.setState({
            // sceneWarehouseList: this.state.sceneWarehouseList.push(fromJS({
            //   id: res.data,
            //   name: values.name,
            //   type: values.visibility,
            //   leaderId: affair.get('roleId'),
            //   description: values.description,
            //   avatar:this.state.sceneWarehouseList.get(0).get('avatar'),
            // })),
            showAddSceneWarehouse: false,
            addSceneWarehouseAuthorities: List(),
          })
        } else if (res.code === 10000) {
          this.setState({
            showAddSceneWarehouse: false
          })
        }
      })
    })
  },

  renderSceneWarehouse() {
    return this.state.sceneWarehouseList.map((sceneWarehouse) => {
      return (
        <div className={styles.warehouseCard} key={sceneWarehouse.get('id')} onClick={() => this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/assets/warehouse/${sceneWarehouse.get('id')}`)}>
          <div className={styles.type}>场景仓库</div>
          <div className={styles.content}>
            <div className={styles.avatar}>
              {sceneWarehouse.get('avatar') ? <img src={sceneWarehouse.get('avatar')} /> : null}
            </div>
            <div className={styles.name}>{`${sceneWarehouse.get('name')}场景仓库`}</div>
          </div>
        </div>
      )
    })
  },
  renderRoleWarehouse() {
    return this.state.roleWarehouseList.map((roleWarehouse) => {
      return (
        <div className={styles.warehouseCard} key={roleWarehouse.get('id')} onClick={() => this.props.pushURL(`/workspace/affair/${this.props.affair.get('id')}/repo/assets/warehouse/${roleWarehouse.get('id')}`)}>
          <div className={styles.type}>角色仓库</div>
          <div className={styles.content}>
            <div className={styles.avatar} style={{ borderRadius: '50%' }}>
              {roleWarehouse.get('avatar') ? <img src={roleWarehouse.get('avatar')} /> : null}
            </div>
            <div className={styles.name}>{`${roleWarehouse.get('name')}的仓库`}</div>
          </div>
        </div>
      )
    })
  },
  renderPublicWarehouse() {
    const affair = this.props.affair

    return this.state.publicWarehouse && (
      <div
        className={styles.warehouseCard}
        onClick={() => {
          let temp = true
          if (affair.validatePermissions(PERMISSION.ACCESS_PUBLIC_MATERIAL_WAREHOUSE) || temp) {
            this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/assets/warehouse/${this.state.publicWarehouse.get('id')}`)
          } else {
            ShowMessage.error('您没有访问权限')
          }
        }}
      >
        <div className={styles.type}>公共仓库</div>
        <div className={styles.content}>
          <div className={styles.avatar}>
            {affair.get('avatar') ? <img src={affair.get('avatar')} /> : null}
          </div>
          <div className={styles.name}>{`${this.props.affair.get('name')}公共仓库`}</div>
        </div>
      </div>
    )
  },
  renderAddSceneWarehouse() {
    return (
      <div className={classNames(styles.warehouseCard, styles.addSceneWarehouse)} onClick={this.handleAddSceneWarehouse}>
        <AddIcon />
        <div>添加场景仓库</div>
      </div>
    )
  },
  renderOwnWarehouseList() {
    return (
      <div style={{ paddingLeft: '20px', paddingTop: '20px' }}>
        <div className={styles.description}>本事务仓库列表：</div>
        <div className={styles.ownWarehouseList}>
          {this.renderPublicWarehouse()}
          {this.renderRoleWarehouse()}
          {this.renderSceneWarehouse()}
          {this.props.affair.validatePermissions(PERMISSION.CREATE_SCENE_MATERIAL_WAREHOUSE) && this.renderAddSceneWarehouse()}
        </div>
      </div>
    )
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
  renderChildrenWarehouse() {
    const affair = this.props.affair

    return (
      <div style={{ paddingLeft: '20px', marginTop: '8px' }}>
        <div className={styles.description}>下级子事务仓库：</div>
        <div className={styles.childrenWarehouseList}>
          {
            this.state.childrenWarehouseList && this.state.childrenWarehouseList.map((child) => {
              child = Map({
                name: child.get('name'),
                avatar: child.get('avatar'),
                id: child.get('affairId'),
                shortName: child.get('slogan'),
                level: affair.get('level') + 1,
              })

              return (
                <div className={styles.childCard} key={child.get('id')} onClick={() => this.props.pushURL(`/workspace/affair/${child.get('id')}/repo`)}>
                  <AffairAvatar className={styles.avatar} affair={child} sideLength={40} />
                  <p>{child.get('name')}</p>
                  <ArrowRight />
                </div>
              )
            })
          }
        </div>
      </div>
    )
  },
  renderHeader(){
    const { affair } = this.props
    return (
      <div className={styles.header}>
        <div>{`${affair.get('name')}仓库列表`}</div>
        {affair.validatePermissions(PERMISSION.CHECK_MATERIAL_TOTAL) &&
          <div
            className={styles.navigateBar}
            onClick={() => {
              this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/assets/asset`)
            }}
          >查看物资总览 >
          </div>
        }
      </div>
    )
  },
  render() {
    return !this.state.hasNoPermission ? (
      <div className={styles.container}>
        {this.renderHeader()}
        {this.renderOwnWarehouseList()}
        {this.renderAddSceneModal()}
        {/*{this.renderChildrenWarehouse()}*/}
      </div>
    )
    :
      <div className={styles.noPermission}>
        <img src={imageNoPermission}/>
        <span>您无权限查看该页面</span>
      </div>
  }
})

WarehouseList = Form.create()(WarehouseList)

export default connect(null, (dispatch) => ({ pushURL: bindActionCreators(pushURL, dispatch) }))(WarehouseList)
