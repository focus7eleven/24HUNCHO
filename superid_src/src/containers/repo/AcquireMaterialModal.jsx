import React from 'react'
import { Modal, Input, Select, Button, Tabs, InputNumber, message } from 'antd'
import { fromJS, List, Map } from 'immutable'
import { TrashIcon, ScreenIcon, SearchIcon, CloseIcon } from 'svg'
import AffairTreeSelect from '../../components/select/AffairTreeSelect'
import styles from './AcquireMaterialModal.scss'
import config from '../../config'
import messageHandler from 'messageHandler'
const Option = Select.Option

const ASSET_TYPE = {
  REACHABLE: 0,
  APPLIABLE: 1,
}
const EDIT_MODE = {
  NONE: 0,
  EDIT: 1,
}
const DEFAULT_TYPE_CODE = '0'

const TabPane = Tabs.TabPane
const demoFilters = fromJS({
  '地区': ['南京', '上海'],
  '标签': ['SUV', '七座商务', '四驱', '前驱', '三轮'],
})
const AcquireMaterialModal = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired,
  },
  getDefaultProps() {
    return {
      categoryTree: List(),
    }
  },
  getInitialState(){
    const filters = demoFilters.map((filter, key) => {
      return filter.map((name, k) => {
        return fromJS({
          type: key,
          id: k,
          on: 0,
          name: name,
        })
      })
    })
    return {
      isSubmitting: false,
      assetList: List(),
      searchAssetList: List(),
      filters: filters,
      showSlide: false,
      selectedAffairList: [],
      selectedAssetType: DEFAULT_TYPE_CODE,
      searchText: '',
      searchTags: [],
      tags: [],
    }
  },

  fetchAssetList(){
    const { affair } = this.props
    const { selectedAffairList, searchText, selectedAssetType } = this.state

    const fetchReachableList = () => {
      return fetch(config.api.material.acquire.list(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        body: JSON.stringify({
          affairIds: selectedAffairList,
          locations: [],
          tags: [],
          keyword: searchText,
          type: selectedAssetType,
          usable: true,
        }),
      }).then((res) => res.json()).then(messageHandler)
    }

    const fetchAppliableList = () => {
      return fetch(config.api.material.acquire.list(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        affairId: affair.get('id'),
        roleId: affair.get('roleId'),
        body: JSON.stringify({
          affairIds: selectedAffairList,
          locations: [],
          tags: [],
          keyword: searchText,
          type: selectedAssetType,
          usable: false,
        }),
      }).then((res) => res.json()).then(messageHandler)
    }


    Promise.all([fetchReachableList(), fetchAppliableList()]).then((res) => {
      if (res.every((json) => json.code == 0)) {
        const reachableList = res[0].data.materials.map((asset) => {
          asset.type = ASSET_TYPE.REACHABLE
          return asset
        })
        const appliableList = res[1].data.materials.map((asset) => {
          asset.type = ASSET_TYPE.APPLIABLE
          return asset
        })
        const tags = res[0].data.tags.concat(res[1].data.tags)
        const searchAssetList = fromJS(reachableList)
          .concat(fromJS(appliableList))
          .map((asset) => asset.set('edit', EDIT_MODE.NONE).set('selected', 0))
        let assetList = this.state.assetList
        searchAssetList.forEach((searchAsset) => {
          const index = assetList.findIndex((asset) => asset.get('id') == searchAsset.get('id'))
          if (index >= 0) {
            assetList = assetList.set(index, searchAsset.set('selected', assetList.getIn([index, 'selected'])))
          } else {
            assetList = assetList.push(searchAsset)
          }
        })
        this.setState({
          searchAssetList: searchAssetList,
          assetList: assetList,
          tags,
        })
      }
    })
  },
  // 提交
  onSubmit() {
    const { affair } = this.props
    const { assetList } = this.state
    fetch(config.api.material.acquire.post(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        materialWarehouseId: this.props.materialWarehouseId,
        usableMaterials: assetList
          .filter((asset) => (asset.get('type') == ASSET_TYPE.REACHABLE && asset.get('selected') > 0))
          .map((asset) => (Map().set('materialId', asset.get('id')).set('quantity', asset.get('selected')))).toJS(),
        applicableMaterials: assetList
          .filter((asset) => (asset.get('type') == ASSET_TYPE.APPLIABLE && asset.get('selected') > 0))
          .map((asset) => (Map().set('materialId', asset.get('id')).set('quantity', asset.get('selected')))).toJS(),
      }),
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code == 0) {
        message.success('提交成功', 0.5)
        this.props.onClose()
      }
    })
  },
  handleFilterByTag(tags){
    const { searchTags } = this.state
    let result = false
    if (searchTags.length == 0){
      return true
    }
    searchTags.map((v) => {
      if (tags.toJS().indexOf(v) >= 0){
        result = true
      }
    })
    return result
  },
  // 关键词变化
  handleSearchTextChange(e){
    this.setState({
      searchText: e.target.value,
    }, this.fetchAssetList)
  },
  // 筛选事务
  handleSelectAffair(val){
    this.setState({
      selectedAffairList: val,
    }, this.fetchAssetList)
  },
  // 筛选物资类型
  handleSelectAssetType(val){
    this.setState({
      selectedAssetType: val,
    }, this.fetchAssetList)
  },
  // 点击高级筛选的任意按钮
  handleClickOption(option){
    // this.setState({
    //   filters: this.state.filters.updateIn(
    //     [option.get('type'), option.get('id')],
    //     (val) => (val.update('on', (attr) => (attr == 1 ? 0 : 1)))
    //   )
    // })
    let { searchTags } = this.state
    if (searchTags.indexOf(option) >= 0){
      searchTags = searchTags.filter((v) => {return v != option})
    }
    else {
      searchTags.push(option)
    }
    this.setState({
      searchTags,
    })
  },
  // 更新单个编辑后的物资
  handleEditAsset(asset) {
    const { searchAssetList, assetList } = this.state
    const index = searchAssetList.findIndex((val) => (val.get('id') == asset.get('id')))
    if (index >= 0) {
      this.setState({
        searchAssetList: searchAssetList.set(index, asset)
      })
    }
    const assetListIndex = assetList.findIndex((val) => (val.get('id') == asset.get('id')))
    if (assetListIndex >= 0) {
      this.setState({
        assetList: assetList.set(assetListIndex, asset)
      })
    }
  },
  renderAssetInputNumber(asset, props){
    return (
      <InputNumber
        key="InputNumber"
        min={0}
        max={asset.get('quantity') - asset.get('locked')}
        value={asset.get('selected')}
        onKeyPress={(e) => {
          if (e.charCode < 48 || e.charCode > 57) {
            e.preventDefault()
          }
        }}
        onInput={(e) => {
          const value = Math.min(e.target.value, asset.get('quantity') - asset.get('locked'))
          // forceShow 标记当前物资强制显示在右侧选择面板，点击垃圾桶图标后取消强制显示
          this.handleEditAsset(asset.set('selected', value).set('forceShow', true))
        }}
        onChange={(val) => this.handleEditAsset(asset.set('selected', val))}
        {...props}
      />
    )
  },
  // 单个物资库物资
  renderAsset(asset) {
    const isEditing = asset.get('edit', EDIT_MODE.NONE) == EDIT_MODE.EDIT
    const isSelected = asset.get('selected', 0) != 0
    return (
      <div className={styles.assetDetail} key={asset.get('id')}>
        <div className={styles.image} style={{ backgroundImage: `url(${asset.get('image')})` }}/>
        <div className={styles.detail}>
          <div className={styles.title}>{asset.get('name')}</div>
          <div className={styles.subTitle}>来自：{asset.get('affairName')}</div>
          <div className={styles.subTitle}>地区：{asset.get('location')}</div>
          <div className={styles.footer}>
            {isEditing ? [
              this.renderAssetInputNumber(asset, { size: 'small' }),
              <Button key="operation" type="primary" onClick={() => this.handleEditAsset(asset.set('edit', EDIT_MODE.NONE))}>确认</Button>
            ] :
            isSelected ? [
              <div key="input" className={styles.value}>已选：{asset.get('selected')}{asset.get('unit')}</div>,
              <Button key="operation" type="ghost" onClick={() => this.handleEditAsset(asset.set('edit', EDIT_MODE.EDIT))}>继续添加</Button>
            ] : [
              <div key="input" className={styles.value}>库存：{asset.get('quantity') - asset.get('locked')}{asset.get('unit')}</div>,
              <Button key="operation" type="ghost" onClick={() => this.handleEditAsset(asset.set('edit', EDIT_MODE.EDIT))}>添加</Button>
            ]}
          </div>
        </div>
      </div>
    )
  },
  // 物资面板
  renderAllAssetPane(assetList) {
    return (
      <div className={styles.allAssetWrapper}>
        {
          assetList.map(this.renderAsset)
        }
      </div>
    )
  },
  // 单个已选物资
  renderSelectedAsset(asset) {
    return (
      <div className={styles.selectedAsset} key={asset.get('id')}>
        <div onClick={() => this.handleEditAsset(asset.set('selected', 0).set('forceShow', false))}>
          <TrashIcon />
        </div>
        <div className={styles.context}>
          <div className={styles.name}>{asset.get('name')}</div>
          <div className={styles.affair}>来自：{asset.get('affair')}</div>
        </div>
        <div className={styles.selectNumber}>
          {this.renderAssetInputNumber(asset)}
        </div>
      </div>
    )
  },
  // 已选物资面板
  renderSelectedAssetPanePane() {
    const { assetList } = this.state
    const selectedAssetList = assetList.filter((asset) => (asset.get('selected') != 0 || asset.get('forceShow') == true))
    return (
      <div className={styles.selectedAssetWrapper}>
        <div className={styles.title}>已选物资</div>
        <div className={styles.scrollWrapper}>
          <div className={styles.subTitle}>直接调用：</div>
          {
            selectedAssetList
              .filter((asset) => (asset.get('type') == ASSET_TYPE.REACHABLE))
              .map(this.renderSelectedAsset)
          }
          <div className={styles.subTitle}>申请使用：</div>
          {
            selectedAssetList
              .filter((asset) => (asset.get('type') == ASSET_TYPE.APPLIABLE))
              .map(this.renderSelectedAsset)
          }
        </div>
      </div>
    )
  },
  renderSlide(){
    // const { filters } = this.state
    return (
      <div className={styles.slideWrapper}>
        <div className={styles.header}>
          <div className={styles.title}>高级筛选</div>
          <div className={styles.close} onClick={() => {this.setState({ showSlide: false })}}><CloseIcon /></div>
        </div>
        <div className={styles.content}>
          {
            // filters.map((filter, title) => {
            //   return (
            //     <div className={styles.filterGroup} key={title}>
            //       <div className={styles.subTitle}>{title}：</div>
            //       <div className={styles.optionGroup}>
            //         {
            //           filter.map((option) => {
            //             return (
            //               <div
            //                 key={option.get('name')}
            //                 type={option.get('on') == 1 ? 'primary' : ''}
            //                 className={styles.option}
            //                 onClick={() => {
            //                   this.handleClickOption(option)
            //                 }}
            //               >
            //                 {option.get('name')}
            //               </div>
            //             )
            //           })
            //         }
            //       </div>
            //     </div>
            //   )
            // })
          }
          <div className={styles.filterGroup}>
            <div className={styles.subTitle}>标签：</div>
            <div className={styles.optionGroup}>
              {
                      this.state.tags.map((option, key) => {
                        return (
                          <div
                            key={key}
                            className={styles.option}
                            type={this.state.searchTags.indexOf(option) >= 0 ? 'primary' : ''}
                            onClick={() => {
                              this.handleClickOption(option)
                            }}
                          >
                            {option}
                          </div>
                        )
                      })
                    }
            </div>
          </div>
        </div>
      </div>
    )
  },
  render(){
    const { isSubmitting, showSlide, selectedAssetType, searchText, searchAssetList } = this.state
    const reachableList = searchAssetList.filter((asset) => {return (asset.get('type') == ASSET_TYPE.REACHABLE) && (this.handleFilterByTag(asset.get('tags')))})
    const appliableList = searchAssetList.filter((asset) => {return (asset.get('type') == ASSET_TYPE.APPLIABLE) && (this.handleFilterByTag(asset.get('tags')))})
    const reachableTitle = (reachableList.size == 0) ? '可调用' : `可调用 (${reachableList.size})`
    const appliableTitle = (appliableList.size == 0) ? '可申请' : `可申请 (${appliableList.size})`
    return (
      <Modal
        wrapClassName={styles.acquireMaterialModal}
        visible
        closable={false}
        title="获取物资"
        okText="提交"
        confirmLoading={isSubmitting}
        width={860}
        onCancel={this.props.onClose}
        onOk={this.onSubmit}
      >
        <div className={styles.toolBar}>
          <div className={styles.left}>
            <Input
              placeholder="搜索物资名称／属性"
              onChange={this.handleSearchTextChange}
              onPressEnter={this.fetchAssetList}
              value={searchText}
            />
            <SearchIcon />
          </div>
          <div className={styles.right}>
            <Select className={styles.selectType} defaultValue={selectedAssetType} onChange={this.handleSelectAssetType}>
              <Option key={DEFAULT_TYPE_CODE} value={DEFAULT_TYPE_CODE}>全部类别</Option>
              {
                this.props.categoryTree.map((category) => {
                  return (
                    <Option key={category.get('typeCode')} value={`${category.get('typeCode')}`}>{category.get('name')}</Option>
                  )
                })
              }
            </Select>
            <AffairTreeSelect
              affair={this.props.affair}
              onChange={this.handleSelectAffair}
            />
            <Button type="ghost" shape="circle-outline" onClick={() => {this.setState({ showSlide: true })}}>
              <ScreenIcon />
            </Button>
          </div>
        </div>
        <div className={styles.container}>
          {/* 可调用和可申请的物资 */}
          <div className={styles.main}>
            <Tabs defaultActiveKey="1" size="small">
              <TabPane tab={reachableTitle} key="1">{this.renderAllAssetPane(reachableList)}</TabPane>
              <TabPane tab={appliableTitle} key="2">{this.renderAllAssetPane(appliableList)}</TabPane>
            </Tabs>
          </div>
          {/* 选择的物资 */}
          <div className={styles.side}>
            {this.renderSelectedAssetPanePane()}
          </div>
        </div>
        {/* 滑动条 */}
        <div className={styles.slide} style={{ right: showSlide ? 0 : -200 }}>
          {this.renderSlide()}
        </div>
      </Modal>
    )
  }
})

export default AcquireMaterialModal
