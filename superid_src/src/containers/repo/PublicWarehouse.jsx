import React from 'react'
import { Button, Tree, Popover } from 'antd'
import { fromJS, List, Map } from 'immutable'
import styles from './PublicWarehouse.scss'
import AddMaterialModal from './AddMaterialModal'
import AcquireMaterialModal from './AcquireMaterialModal'
import { MaterialSend, AbadonIcon, VerificationIcon, MaterialUnion, MaterialGroup, ResolveIcon, SplitIcon } from 'svg'
import config from '../../config'
import SendMoreAsset from './SendMoreAsset'
import { getAffairRoles } from '../../actions/affair'
import { pushURL } from 'actions/route'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { MaterialDefaultPicture, ToolIcon } from 'svg'
import imageNoPermission from 'images/img_no_permissions.png'
import messageHandler from 'messageHandler'


const TreeNode = Tree.TreeNode

const PublicWarehouse = React.createClass({
  getInitialState() {
    return {
      showAddMaterialModal: false,
      categoryTree: List(),
      materials: List(),
      showSendMoreAsset: false,
      showMoreTools: false,
      warehouse: {},
      hasNoPermission: false,
      canRender: false,
      filterType: List(),
    }
  },

  componentDidMount() {
    // this.fetchMaterialCategory()
    this.fetchFetchMaterialList(this.props)
    this.fetchWarehouseDetail(this.props)
  },

  componentWillReceiveProps(nextProps){
    if ((nextProps.affair.get('id') != this.props.affair.get('id')) || (nextProps.affair.get('roleId') != this.props.affair.get('roleId'))){
      this.fetchFetchMaterialList(nextProps)
      this.fetchWarehouseDetail(nextProps)
    }
  },

  fetchMaterialCategory() {
    fetch(config.api.material.warehouse.category.get, {
      credentials: 'include',
      method: 'GET',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.setState({
          categoryTree: fromJS(res.data),
          hasNoPermission: false,
        })
      } else if (res.code === 403) {
        this.setState({
          hasNoPermission: true,
        })
      }
    })
  },

  fetchFetchMaterialList(props) {
    const affair = props.affair
    fetch(config.api.material.warehouse.materialList.get(props.params.warehouseId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const data = fromJS(res.data)

        this.setState({
          materials: data.map((v, k) => {
            return Map({
              id: v.get('id'),
              name: v.get('name'),
              picture: v.get('image'),
              price: v.get('price'),
              quantity: v.get('quantity'),
              locked: v.get('locked'),
              unit: v.get('unit'),
              typeCode: k,
              type: v.get('type'),
              amount: 1,
            })
          })
        })
      }
    })
  },
  fetchWarehouseDetail(props){
    const { affair } = props
    fetch(config.api.material.warehouse.detail(this.props.params.warehouseId), {
      method: 'GET',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        this.setState({
          warehouse: json.data,
          canRender: true,
        })
      }
    })
  },
  handleNewMaterialModal(newMaterial) {
    if (newMaterial && newMaterial.id) {
      this.setState({
        showAddMaterialModal: false,
        materials: this.state.materials.push(fromJS({
          id: newMaterial.id,
          name: newMaterial.name,
          picture: newMaterial.image,
          typeCode: newMaterial.type,
        }))
      })
    } else {
      this.setState({
        showAddMaterialModal: false,
      })
    }
  },

  handleSendMoreAsset(){
    const { affair } = this.props
    this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true).then(() => {
      this.setState({
        showSendMoreAsset: true,
        showMoreTools: false,
      })
    })
  },

  handleShowMoreTools(visible){
    this.setState({
      showMoreTools: visible,
    })
  },


  handleShowByCategory(selected, e){
    let result = List()
    const getSeries = (node) => {
      if (node.props.children != null){
        node.props.children.map((v) => {
          result = result.push(v.key)
          getSeries(v)
        })
      }
      else {
        return
      }
    }
    if (selected.length == 0){
      this.setState({
        filterType: List(),
      })
    }
    else {

      result = result.push(selected[0])
      getSeries(e.selectedNodes[0])
      // if(e.selectedNodes[0].props.children!=null){
      //   e.selectedNodes[0].props.children.map(v=>{
      //   result=result.push(v.key)
      //   })
      // }
      this.setState({
        filterType: result,
      })
    }
  },

  renderMainPanel() {

    return (
      <div className={styles.mainPanel}>
        {this.state.materials.filter((material) => {
          if (this.state.filterType.size == 0){
            return material
          }
          else {
            if (this.state.filterType.includes(material.get('type').toString())){
              return material
            }
          }
        }).map((material, key) => {
          return (
            <div className={styles.materialItem} key={key} onClick={() => {this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/assets/warehouse/${this.props.params.warehouseId}/material/${material.get('id')}`)}}>
              <div className={styles.materialPic}>
                {material.get('picture') ? <img src={material.get('picture')} /> : <MaterialDefaultPicture />}
              </div>
              <p>{material.get('name')}</p>
            </div>
          )
        })}
      </div>
    )
  },
  renderCategoryTree(tree) {
    return tree
        ?
        tree.map((node) => (
          <TreeNode title={node.get('name')} key={node.get('typeCode')}>
            {node.get('children', List()).size ? this.renderCategoryTree(node.get('children')) : null}
          </TreeNode>
        )).toJS()
        :
        null
  },
  renderMoreTools() {
    return (
      <div className={styles.moreTools}>
        <div className={styles.tool} onClick={this.handleSendMoreAsset}>
          <MaterialSend />
          <span>发送</span>
        </div>
        <div className={styles.tool}>
          <AbadonIcon />
          <span>报废</span>
        </div>
        <div className={styles.tool}>
          <VerificationIcon />
          <span>核销</span>
        </div>
        <div className={styles.tool}>
          <MaterialUnion />
          <span>合成</span>
        </div>
        <div className={styles.tool}>
          <ResolveIcon />
          <span>分解</span>
        </div>
        <div className={styles.tool}>
          <MaterialGroup />
          <span>合并</span>
        </div>
        <div className={styles.tool}>
          <SplitIcon />
          <span>拆分</span>
        </div>
      </div>
    )
  },
  renderLeftPanel() {
    return (
      <div className={styles.leftPanel}>
        <div className={styles.gray}>
          <div style={{ marginTop: 15 }}>物资分类：</div>

          <Tree
            className={styles.categoryTree}
            onSelect={this.handleShowByCategory}
          >
            {this.renderCategoryTree(this.state.categoryTree)}
          </Tree>
        </div>

        <div className={styles.buttonGroup}>
          <div className={styles.ownersWrapper}>
            <div className={styles.key}>负责人:</div>
            {this.renderOwners(this.state.warehouse.owners)}
          </div>
          <Button
            type="ghost"
            size="large"
            onClick={() => {
              this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/assets/warehouse/${this.props.params.warehouseId}/activity`)
            }}
          >
            查看仓库动态
          </Button>
        </div>
      </div>
    )
  },
  renderHeader(){
    return (<div className={styles.header}>
      <div>
        <span style={{ color: '#4990e2', cursor: 'pointer' }} onClick={() => {this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/assets`)}}>{`${this.props.affair.get('name')}仓库`}</span>
        <span>&nbsp;>&nbsp;</span>
        <span>{`${this.state.warehouse.warehouseName || ''}`}</span>
      </div>
      <div className={styles.right}>
        <Button type="ghost" size="large" onClick={() => this.setState({ showAcquireMaterialModal: true })}>获取物资</Button>
        {this.state.showAcquireMaterialModal &&
        <AcquireMaterialModal
          materialWarehouseId={this.props.params.warehouseId}
          affair={this.props.affair}
          categoryTree={this.state.categoryTree}
          onClose={() => this.setState({ showAcquireMaterialModal: false })}
        />
        }
        <Button type="primary" size="large" onClick={() => this.setState({ showAddMaterialModal: true })}>登记物资</Button>
        <Popover
          placement="bottomRight"
          arrowPointAtCenter
          content={this.renderMoreTools()}
          trigger="click"
          visible={this.state.showMoreTools}
          onVisibleChange={this.handleShowMoreTools}
          overlayClassName={styles.toolPopover}
        >
          <div className={styles.toolIconWrapper}>
            <ToolIcon />
          </div>
        </Popover>
      </div>
    </div>)
  },
  renderOwners(owners){
    if (!owners) {
      return null
    }
    // if (owners.length == 1) {
    //   return (<div className={styles.owners}>
    //     {owners[0].avatar
    //         ?
    //           <img src={owners[0].avatar} className={styles.avatar}/>
    //         :
    //           <div className={styles.avatar} style={{ backgroundColor: '#ebebeb' }} />
    //     }
    //     <span className={styles.value}>{owners[0].roleName}-{owners[0].username}</span>
    //   </div>)
    // }
    if (owners.length >= 1) {
      const ownersListPopover = (
        <div className={styles.ownersList}>
          {
            owners.map((v, k) => {
              return (
                <div className={styles.row} key={k}>
                  {v.avatar ?
                    <img className={styles.avatar} src={v.avatar}/>
                  :
                    <div className={styles.avatar} style={{ backgroundColor: '#ebebeb' }} />
                  }
                  <span className={styles.value}>{v.roleName}-{v.username}</span>
                </div>
              )
            })
          }
        </div>
      )
      return (<Popover placement="rightBottom" trigger="hover" content={ownersListPopover} overlayClassName={styles.ownersPopover}>
        <div className={styles.owners} style={{ cursor: 'pointer' }}>
          {
            owners.map((v, k) => {
              if (k < 3) {
                return v.avatar
                    ?
                      <img src={v.avatar} className={styles.overlap} style={{ zIndex: 20 - k }} key={k}/>
                    :
                      <div className={styles.overlap} style={{ backgroundColor: '#ebebeb', zIndex: 20 - k }} key={k} />
              }
            })
          }
        </div>
      </Popover>)

    }

  },
  render() {
    const { rolelist } = this.props
    return this.state.hasNoPermission ? (
      <div className={styles.noPermission}>
        <img src={imageNoPermission}/>
        <span>您无权限查看该页面</span>
      </div>
    ) : this.state.canRender ? (
      <div className={styles.container}>
        {this.renderHeader()}
        <div className={styles.content}>
          {this.renderLeftPanel()}
          {this.renderMainPanel()}
        </div>

        {this.state.showAddMaterialModal ? <AddMaterialModal affairId={this.props.params.id} roleId={this.props.affair.get('roleId')} warehouseId={this.props.params.warehouseId} onClose={this.handleNewMaterialModal}/> : null}
        <SendMoreAsset visible={this.state.showSendMoreAsset} callback={() => {this.setState({ showSendMoreAsset: false })}} materials={this.state.materials} affair={this.props.affair} warehouseId={this.props.params.warehouseId} rolelist={rolelist}/>
      </div>
    ) : null
  }
})

function mapStateToProps(state, props){
  return {
    rolelist: state.getIn(['affair', 'affairAttender', 'currentRoles', props.affair.get('id')])
  }
}
function mapDispatchToProps(dispatch){
  return {
    getAffairRoles: bindActionCreators(getAffairRoles, dispatch),
    pushURL: bindActionCreators(pushURL, dispatch),
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(PublicWarehouse)
