import React from 'react'
import styles from './AssetDetail.scss'
import { Button, Tag, Table, Timeline, Input, notification, Switch, Select, Tooltip, message } from 'antd'
import { TableInfoEdit, SplitIcon, ResolveIcon, DiscardeIcon, VerificationIcon, TagIcon, ManageIcon, EditIcon, ImgEditIcon, MaterialDefaultPicture } from 'svg'
import classnames from 'classnames'
import { Motion, spring } from 'react-motion'
import config from '../../config'
import currencyFormatter from '../../utils/currencyWrap'
import SendAssetModal from './SendAssetModal'
import { getAffairRoles } from '../../actions/affair'
import { pushURL } from 'actions/route'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import AnnouncementEditor from '../announcement/AnnouncementEditor'
import { Map } from 'immutable'
import { Editor, EditorState, convertFromRaw, convertToRaw } from 'draft-js'
import EditorDecorator from '../announcement/EditorDecorator'
import { inlineStyleMap, getBlockStyle, getBlockRender } from '../announcement/EditorControl'
import _ from 'underscore'
import AssetImageModal from './AssetImageModal'
import messageHandler from '../../utils/messageHandler'

const view = ['DESCRIBE', 'COMPOSE', 'HISTORY']
const Option = Select.Option
const AssetDetail = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired,
  },
  getInitialState(){
    return {
      chosenView: view[0],
      changingParams: false,
      showingMoreParams: false,
      detail: {},
      isAddingTag: false,
      addingTag: '',
      isBtnClicked: false,
      showSendAsset: false,
      warehouse: {},
      editingDescription: false,
      isChangingPrice: false,
      changingCurrencyValue: '',
      changingPriceValue: '',
      isChangingPic: false,
    }
  },
  componentDidMount(){
    this.fetchDetail(this.props)
    this.fetchWarehouseDetail(this.props)

  },
  componentWillReceiveProps(nextProps){
    if ((this.props.affair.get('id') != nextProps.affair.get('id')) || (this.props.affair.get('roleId') != nextProps.affair.get('roleId'))){
      this.fetchDetail(nextProps)
      this.fetchWarehouseDetail(nextProps)
    }
  },
  componentDidUpdate(){
    if (this.state.isAddingTag){
      this.refs.tagInput.refs.input.focus()
    }
  },
  fetchDetail(props){
    fetch(config.api.material.detail(props.params.warehouseId, props.params.materialId), {
      method: 'GET',
      credentials: 'include',
      affairId: props.affair.get('id'),
      roleId: props.affair.get('roleId'),
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0){
        this.setState({
          detail: json.data,
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
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.setState({
          warehouse: json.data,
        })
      }
    })
  },
  handleAddTagOnchange(e){
    this.setState({
      addingTag: e.target.value,
    })
  },
  handleAddTagOnblur(){
    let disappear = _.debounce(() => {
      if (this.state.isBtnClicked){
        this.setState({
          isBtnClicked: false,
        })
        return
      }
      else {
        this.setState({
          isAddingTag: false,
        })
      }
    }, 200)
    disappear()
  },
  handleAddTag(){
    const { affair } = this.props
    const { detail, addingTag } = this.state
    let tag = eval(detail.tag)
    this.setState({
      isBtnClicked: true,
    })
    if (addingTag.length < 2 || addingTag.length > 12) {
      notification.error({
        message: '标签长度应为2-12个字符'
      })
      return
    }
    if (tag.some((v) => {
      return v == addingTag
    })) {
      notification.error({
        message: '标签内容不能重复'
      })
      return
    }
    if (tag){
      tag.push(addingTag)
    }
    else {
      tag = [addingTag]
    }
    fetch(config.api.material.modify(this.props.params.materialId), {
      method: 'POST',
      credentials: 'include',
      affairId: affair.get('id'),
      roleId: affair.get('roleId'),
      resourceId: this.props.params.materialId,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tags: tag
      })
    }).then((res) => res.json()).then(messageHandler).then((json) => {
      if (json.code === 0){
        this.setState({
          isBtnClicked: false,
          isAddingTag: false,
          addingTag: '',
        })
        this.fetchDetail(this.props)
      }
      // else {
      //   notification.error({
      //     message: '没有操作权限'
      //   })
      // }
    })
  },
  handleSendAsset(){
    const { affair } = this.props
    this.props.getAffairRoles(affair.get('roleId'), affair.get('id'), true).then(() => {
      this.setState({
        showSendAsset: true,
      })
    })
  },
  handleModifyDescription(){
    fetch(config.api.material.modify(this.props.params.materialId), {
      method: 'POST',
      credentials: 'include',
      roleId: this.props.affair.get('roleId'),
      affairId: this.props.affair.get('id'),
      resourceId: this.props.params.materialId,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: this.refs.editor.getWrappedInstance().getContent()
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.setState({
          editingDescription: false,
        })
        this.fetchDetail(this.props)
      }
      else {
        notification.error({
          message: '保存失败'
        })
      }
    })
  },
  handleChangePublic(value){
    const { detail } = this.state

    fetch(config.api.material.modify(this.props.params.materialId), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      resourceId: this.props.params.materialId,
      body: JSON.stringify({
        tags: eval(detail.tag),
        currency: detail.currency,
        price: detail.price,
        description: detail.description,
        publicType: value == true ? 0 : 10,
      }),
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.fetchDetail(this.props)
        notification.success({
          message: '修改成功!'
        })
      }
      else if (json.code == 8003){
        notification.error({
          message: '修改失败',
          description: '没有操作权限'
        })
      }
      else {
        notification.error({
          message: '修改失败'
        })
      }
    })
  },
  handleChangePrice(){
    const { detail } = this.state
    fetch(config.api.material.modify(this.props.params.materialId), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      resourceId: this.props.params.materialId,
      body: JSON.stringify({
        tags: eval(detail.tag),
        currency: this.state.changingCurrencyValue ? this.state.changingCurrencyValue : detail.currency,
        price: this.state.changingPriceValue ? this.state.changingPriceValue : detail.price,
        description: detail.description,
        publicType: detail.publicType,
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0) {
        this.fetchDetail(this.props)
        this.setState({
          changingPriceValue: '',
          changingCurrencyValue: '',
          isChangingPrice: false,
        })
      }
    })
  },
  handleDeleteTag(v){
    const { detail } = this.state
    let tag = eval(this.state.detail.tag)
    tag = tag.filter((w) => {return w != v})
    fetch(config.api.material.modify(this.props.params.materialId), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affair.get('id'),
      roleId: this.props.affair.get('roleId'),
      resourceId: this.props.params.materialId,
      body: JSON.stringify({
        tags: tag,
        currency: detail.currency,
        price: detail.price,
        description: detail.description,
        publicType: detail.publicType,
      })
    }).then((res) => res.json()).then((json) => {
      if (json.code == 0){
        this.fetchDetail(this.props)
      }
      else {
        message.error('没有操作权限')
      }
    })
  },

  renderLessParams(params){
    if (params.length % 4 != 0) {
      let need = 4 - params.length % 4
      for (let i = 0; i < need; i++) {
        params.push({
          left: '',
          right: '',
        })
      }
    }
    return params != []
      ?
      params.map((v, k) => {
        if (k < 12) {
          return parseInt(k / 4) % 2 == 0
            ?
            (<div className={styles.paramBlock} key={k} style={{ backgroundColor: '#fafafa' }}>
              <span className={styles.key}>{v.left}</span>
              <span className={styles.value}>{v.right}</span>
            </div>)
            :
            (<div className={styles.paramBlock} key={k}>
              <span className={styles.key}>{v.left}</span>
              <span className={styles.value}>{v.right}</span>
            </div>)
        }
      })
      :
      null
  },
  renderMoreParams(params){
    if (params.length % 4 != 0){
      let need = 4 - params.length % 4
      for (let i = 0;i < need;i++){
        params.push({
          left: '',
          right: '',
        })
      }
    }
    return params.map((v, k) => {
      return parseInt(k / 4) % 2 == 0
        ?
        (<div className={styles.paramBlock} key={k} style={{ backgroundColor: '#fafafa' }}>
          <span className={styles.key}>{v.left}</span>
          <span className={styles.value}>{v.right}</span>
        </div>)
        :
        (<div className={styles.paramBlock} key={k}>
          <span className={styles.key}>{v.left}</span>
          <span className={styles.value}>{v.right}</span>
        </div>)
    })
  },
  renderDescribe(){
    let contentState = this.state.detail.description ? convertFromRaw(JSON.parse(this.state.detail.description)) : convertFromRaw(convertToRaw(EditorState.createEmpty(EditorDecorator).getCurrentContent()))
    const editorState = EditorState.createWithContent(contentState, EditorDecorator)
    const announcementToEdit = {
      'content': this.state.detail.description,
    }


    let params = []
    if (this.state.detail.attribute){
      params = JSON.parse(this.state.detail.attribute) || []
    }
    return (<div className={styles.describeContainer} ref="params">
      {
        params
          ?
            <div className={styles.params}>
              {
                this.state.showingMoreParams ? this.renderMoreParams(params) : this.renderLessParams(params)
              }
            </div>
          : null
      }

      {
        params.length < 12
          ?
            <div className={styles.btn} onClick={() => {
              this.setState({ changingParams: true })
            }}
            >
              <EditIcon fill="#4a90e2" height="16px" width="16px"/>
              <span>修改参数</span>
            </div>
          :
          !this.state.showingMoreParams
            ?
              <div className={styles.btn} onClick={() => {
                this.setState({ showingMoreParams: true })
              }}
              >
                <span>更多参数</span>
              </div>
            :
              <div className={styles.btn} onClick={() => {
                this.setState({ changingParams: true })
              }}
              >
                <EditIcon fill="#4a90e2" height="16px" width="16px"/>
                <span>修改参数</span>
              </div>
      }
      <div className={styles.bottom} style={{ borderTop: this.state.editingDescription ? '' : '1px solid #e9e9e9' }}>
        {
          this.state.editingDescription
            ?
              <AnnouncementEditor
                hideTitleInput
                hideFooter
                className={styles.editor}
                controlClassName={styles.eidtorControl}
                ref="editor"
                affair={Map({
                  id: this.props.affair.get('id'),
                  roleId: this.props.affair.get('roleId'),
                })}
                announcementToEdit={announcementToEdit}
              />
            :
              <div className={styles.text} ref="announcementBody">
                <Editor
                  className={styles.draftEditor}
                  blockRendererFn={getBlockRender.bind(this)}
                  blockStyleFn={getBlockStyle}
                  editorState={editorState}
                  customStyleMap={inlineStyleMap}
                  readOnly
                />
              </div>
        }

        {
          this.state.editingDescription
            ?
              <div className={styles.btn}>
                <Button type="ghost" size="large" onClick={() => {
                  this.setState({ editingDescription: false })
                }}
                >取消</Button>
                <Button type="primary" size="large" onClick={this.handleModifyDescription}>保存</Button>
              </div>
              :
              <div className={styles.btn}>
                <div className={styles.svg} onClick={() => {
                  this.setState({ editingDescription: true })
                }}
                >
                  <TableInfoEdit height="16px" fill="#4990e2"/>
                  <span>编辑描述</span>
                </div>
              </div>
        }

      </div>
    </div>)
  },
  renderCompose(){
    const columns = [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '编号',
        dataIndex: 'code',
        key: 'code',
      },
      {
        title: '数量',
        dataIndex: 'number',
        key: 'number',
      },
      {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
      },
      {
        title: '生产人',
        dataIndex: 'producer',
        key: 'producer',
      }
    ]
    //const testdata=[{ key:'1', name:'发动机支架', code:'0123456', number:2, unit:'个', producer:'配公布技工-李工' }, { key:'1', name:'发动机支架', code:'0123456', number:2, unit:'个', prodecer:'配公布技工-李工' }, { key:'1', name:'发动机支架', code:'0123456', number:2, unit:'个', prodecer:'配公布技工-李工' }]
    const testdata = []
    return (<div className={styles.composeContainer}>
      <Table dataSource={testdata} columns={columns} pagination={false} />
      <div className={styles.btn}>
        <ManageIcon height="16px" fill="#4a90e2"/>
        <span>维护</span>
      </div>
    </div>)
  },
  renderHistory(){
    const history = eval(this.state.detail.history)
    return history
        ?
          <div className={styles.historyContainer}>
            <Timeline>
              {
              history.map((v, k) => {
                let date = new Date(v.time)
                let Y = date.getFullYear() + '-'
                let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-'
                let D = date.getDate() + ''
                return (<Timeline.Item color="#926dea" key={k}>
                  <div className={styles.event}>
                    <span className={styles.eventName}>{v.operation}</span>
                    <span className={styles.eventRole}>{v.operator}</span>
                    <span className={styles.eventTime}>{Y + M + D}</span>
                  </div>
                </Timeline.Item>)
              })
            }
            </Timeline>
          </div>
        :
        null
  },

  renderHeader(){
    return (<div className={styles.header}>
      <div>
        <span style={{ color: '#4990e2', cursor: 'pointer' }} onClick={() => {this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/assets`)}}>{`${this.props.affair.get('name')}仓库`}</span>
        <span>&nbsp;>&nbsp;</span>
        <span style={{ color: '#4990e2', cursor: 'pointer' }} onClick={() => {this.props.pushURL(`/workspace/affair/${this.props.params.id}/repo/assets/warehouse/${this.props.params.warehouseId}`)}}>{`${this.state.warehouse.warehouseName ? this.state.warehouse.warehouseName : ''}`}</span>
        <span>&nbsp;>&nbsp;</span>
        <span>物资详情</span>
      </div>
      <div className={styles.right}>
        <span className={styles.key}>公开:</span>
        <Switch checkedChildren="开" unCheckedChildren="关" onChange={this.handleChangePublic} checked={this.state.detail.publicType == 0}/>
      </div>
    </div>)
  },

  render(){
    const { chosenView, detail, isAddingTag, showSendAsset } = this.state
    const currencySelect = (<Select defaultValue={detail.currency} onChange={(value) => {this.setState({ changingCurrencyValue: value })}}>
      <Option value="CNY">CNY</Option>
      <Option value="USD">USD</Option>
      <Option value="EUR">EUR</Option>
      <Option value="JPY">JPY</Option>
      <Option value="GBP">GBP</Option>
    </Select>)
    return detail.id
            ?
              <div className={styles.detailContainer}>
                {/*头部*/}
                {this.renderHeader()}
                <div className={styles.content}>
                  <div className={styles.top} ref="top">
                    <div className={styles.info}>
                      {
                        detail.image
                          ?
                            <div className={styles.pic}>
                              <div className={styles.hover}>
                                <ImgEditIcon onClick={() => {this.setState({ isChangingPic: true })}}/>
                              </div>
                              <img src={detail.image} className={styles.img}/>
                            </div>
                          :
                            <div className={styles.pic}>
                              <div className={styles.hover}>
                                <Tooltip title="编辑" arrowPointAtCenter>
                                  <ImgEditIcon onClick={() => {this.setState({ isChangingPic: true })}}/>
                                </Tooltip>
                              </div>
                              <MaterialDefaultPicture />
                            </div>
                      }

                      <div className={styles.detail}>
                        <div className={styles.assetName}>
                          {detail.name}
                          <div className={styles.test}>可用</div>
                        </div>
                        {
                          this.state.isChangingPrice
                            ?
                              <div className={styles.assetPrice}>
                                <Input addonBefore={currencySelect} ref={(input) => {if (input){input.refs.input.focus()}}} defaultValue={detail.price} onChange={(e) => {this.setState({ changingPriceValue: e.target.value })}}/>
                                <Button type="primary" size="large" onClick={this.handleChangePrice}>保存</Button>
                              </div>
                            :
                              <div className={styles.assetPrice}>
                                <span className={styles.price}>{currencyFormatter.format(detail.price, { code: detail.currency })}/{detail.unit}</span>
                                <span className={styles.btn} onClick={() => {this.setState({ isChangingPrice: true })}}>更改</span>
                              </div>
                        }

                        <div className={styles.otherInfo}>
                          <div className={styles.column}>
                            <span className={styles.x}>编号</span>
                            <span className={styles.x}>拥有人</span>
                          </div>
                          <div className={styles.column}>
                            <span className={styles.y}>{detail.id}</span>
                            <span className={styles.y}>{detail.ownerName}</span>
                          </div>
                          <div className={styles.column}>
                            <span className={styles.x}>库存</span>
                            <span className={styles.x}>类型</span>
                          </div>
                          <div className={styles.column}>
                            <span className={styles.y}>{`${detail.quantity - detail.locked} ${detail.unit}`}</span>
                            <span className={styles.y}>{detail.typeName}</span>
                          </div>
                        </div>
                        <div className={styles.tag}>
                          <TagIcon fill="#f89219" height="16px"/>
                          <span className={styles.text}>标签:</span>
                          {
                eval(detail.tag)
                  ?
                  eval(detail.tag).map((v, k) => {
                    return (<div className={styles.tagContainer} onClick={this.handleDeleteTag.bind(null, v)} key={k}>
                      <div className={styles.mask}>移除</div>
                      <Tag key={k}>{v}</Tag>
                    </div>)
                  })
                  :
                  null
              }
                          {
                isAddingTag
                  ?
                    <div className={styles.addtagContainer} onClick={(e) => {
                      e.stopPropagation()
                    }}
                    >
                      <Input maxLength="12" className={styles.tagInput} placeholder="标签内容" onChange={this.handleAddTagOnchange} onBlur={this.handleAddTagOnblur} onPressEnter={this.handleAddTag} ref="tagInput"/>
                      <i onClick={this.handleAddTag}>+</i>
                    </div>
                  :
                    <Button type="dashed" onClick={() => {
                      this.setState({ isAddingTag: true })
                    }}
                    >+</Button>
              }
                        </div>
                        <div className={styles.operation}>
                          <Button type="primary" size="large" onClick={this.handleSendAsset}>发送</Button>
                          <div className={styles.svg}>
                            <SplitIcon height="16px" fill="#926dea"/>
                            <span>拆分</span>
                          </div>
                          <div className={styles.svg}>
                            <ResolveIcon height="16px" fill="#926dea"/>
                            <span>分解</span>
                          </div>
                          <div className={styles.svg}>
                            <DiscardeIcon height="16px" fill="#926dea"/>
                            <span>报废</span>
                          </div>
                          <div className={styles.svg}>
                            <VerificationIcon height="16px" fill="#926dea"/>
                            <span>核销</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/*中间*/}
                  <div className={styles.middle}>
                    <div className={styles.tabRow}>
                      <div className={classnames(styles.tab, chosenView == view[0] ? styles.chosenTab : null)} onClick={() => {
                        this.setState({ chosenView: view[0] })
                      }}
                      >描述
                      </div>
                      <div className={classnames(styles.tab, chosenView == view[1] ? styles.chosenTab : null)} onClick={() => {
                        this.setState({ chosenView: view[1] })
                      }}
                      >构成
                      </div>
                      <div className={classnames(styles.tab, chosenView == view[2] ? styles.chosenTab : null)} onClick={() => {
                        this.setState({ chosenView: view[2] })
                      }}
                      >历史
                      </div>
                      <Motion style={{ left: spring(view.indexOf(chosenView) * 85) }}>
                        {
                        (motionstyle) => <div className={styles.motion} style={{ left: motionstyle.left }}/>
                      }
                      </Motion>
                    </div>
                    {
                    chosenView == view[0] ? this.renderDescribe() : chosenView == view[1] ? this.renderCompose() : this.renderHistory()
                  }
                  </div>
                </div>
                <SendAssetModal visible={showSendAsset} callback={() => {
                  this.setState({ showSendAsset: false })
                }} sendingAsset={detail} affair={this.props.affair}
                />
                {
      this.state.isChangingPic
        ?
          <AssetImageModal callback={() => {this.setState({ isChangingPic: false });this.fetchDetail(this.props)}} image={this.state.detail.image} affair={this.props.affair} materialId={this.state.detail.id} warehouseId={this.props.params.warehouseId}/>
        :
        null
    }
              </div>
            :
            null


  }
})

function mapStateToProps(){
  return {}
}
function mapDispatchToProps(dispatch){
  return {
    getAffairRoles: bindActionCreators(getAffairRoles, dispatch),
    pushURL: bindActionCreators(pushURL, dispatch)
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(AssetDetail)
