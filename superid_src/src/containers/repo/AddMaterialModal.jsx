import React, { PropTypes } from 'react'
import { Modal, Switch, Menu, Dropdown, Form, Input, Select, TreeSelect, Col, Tag, Button, notification } from 'antd'
import { AddIcon, DeleteIcon, MoreIcon } from 'svg'
import { List, fromJS, Map } from 'immutable'
import classNames from 'classnames'
import AnnouncementEditor from '../announcement/AnnouncementEditor'
import oss from 'oss'
import { MaterialDefaultPicture } from 'svg'
import styles from './AddMaterialModal.scss'
import config from '../../config'

const FormItem = Form.Item
const Option = Select.Option
const CHOOSE_TEMPLATE = 'CHOOSE_TEMPLATE'
const CREATE_TEMPLATE = 'CREATE_TEMPLATE'
const UNITS = ['个', '只', '量', '台', '箱', '件', '辆', '本', '包', '杯', '盒', '千克', '克', '毫克', '吨', '公斤', '斤', '两', '米', '千米', '分米', '厘米', '毫米', '微米', '英寸', '立方米', '立方厘米', '升', '毫升']

// function formatTreeData(treeData) {
//   treeData.forEach((data) => {
//     data.label = data.name
//     data.value = data.typeCode.toString()

//     formatTreeData(data.children)
//   })
// }

let AddMaterialModal = React.createClass({
  propTypes: {
    onClose: PropTypes.func.isRequired,
    warehouseId: PropTypes.string.isRequired,
    affairId: PropTypes.string.isRequired,
    roleId: PropTypes.number.isRequired,
  },

  componentDidMount() {
    // 获取分类列表
    // fetch(config.api.material.warehouse.category.get, {
    //   credentials: 'include',
    //   method: 'GET',
    //   affairId: this.props.affairId,
    //   roleId: this.props.roleId,
    // }).then((res) => res.json()).then((res) => {
    //   if (res.code === 0) {
    //     const treeData = res.data
    //     formatTreeData(treeData)
    //
    //     this.setState({
    //       treeData: treeData,
    //     })
    //   }
    // })

    // 获取仓库列表
    fetch(config.api.material.warehouse.get(), {
      credentials: 'include',
      method: 'GET',
      affairId: this.props.affairId,
      roleId: this.props.roleId,
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.setState({
          warehouseList: fromJS(res.data.affairWarehouses)
            .reduce((reduction, v) => reduction.concat(v), List())
        })
      }
    })

    //this.fetchTemplateList()
  },

  fetchTemplateList() {
    // 获取模板列表
    fetch(config.api.material.template.get(this.props.warehouseId), {
      credentials: 'include',
      method: 'GET',
      affairId: this.props.affairId,
      roleId: this.props.roleId,
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const data = res.data

        this.setState({
          templateList: fromJS(data),
        })
      }
    })
  },

  getInitialState() {
    return {
      modifyingTemplate: false,
      attributes: List(),
      treeData: [],
      currencyType: 'CNY',
      pictureUrl: '',
      isPublic: true,
      templateStep: null,
      warehouseList: List(), // 查找模板时的库列表。
      materialList: List(), // 创建模板时的物资列表。
      createTemplateCurrentWarehouse: null, // 正在使用该仓库的物资创建模板
      selectedMaterial: null, // 创建模板时，用户当前选中的物资
      selectedTemplate: null, // 使用模板创建物资时，用户当前选中的模板
      templateList: List(), // 模板列表
      useTemplateToCreate: false, // 正在使用模板创建物资
      tags: [],
      isAddingTag: false,
      addingTagValue: '',
      needFocus: -1,
      priceValid: {
        status: '',
        help: ''
      },
      hasRepeatAttr: false,
    }
  },
  handleSaveTemplate() {
    this.props.form.validateFields((errors, values) => {
      if (errors){
        return
      }

      const body = {
        id: this.state.selectedTemplate,
        name: values.name,
        currency: this.state.currencyType,
        price: values.price || null,
        quantity: parseInt(values.quantity),
        unit: values.unit,
        description: this.refs.editor.getWrappedInstance().getContent(),
        attribute: this.state.attributes.filter((v) => v.name && v.content).map((v) => ({ left: v.name, right: v.content })).toJS(),
        image: this.state.pictureUrl,
        type: parseInt(values.materialType),
        publicType: this.state.isPublic ? 0 : 10,
        warehouseId: this.props.warehouseId,
        tag: [],
      }

      fetch(config.api.material.template.update(), {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        affairId: this.props.affairId,
        roleId: this.props.roleId,
        body: JSON.stringify(body),
      }).then((res) => res.json()).then((res) => {
        if (res.code === 0) {
          this.setState({
            modifyingTemplate: false,
            useTemplateToCreate: false,
            templateStep: CHOOSE_TEMPLATE,
          })
          this.fetchTemplateList()
        }
      })
    })
  },
  handleCreateNewTemplateByTemplate() {
    this.props.form.validateFields((errors, values) => {
      if (errors){
        return
      }

      const body = {
        name: values.name,
        currency: this.state.currencyType,
        price: values.price || null,
        quantity: parseInt(values.quantity),
        unit: values.unit,
        description: this.refs.editor.getWrappedInstance().getContent(),
        attribute: this.state.attributes.filter((v) => v.name && v.content).map((v) => ({ left: v.name, right: v.content })).toJS(),
        image: this.state.pictureUrl,
        type: parseInt(values.materialType),
        publicType: this.state.isPublic ? 0 : 10,
        warehouseId: this.props.warehouseId,
        tag: [],
      }

      fetch(config.api.material.template.by_template_post(), {
        credentials: 'include',
        method: 'POST',
        affairId: this.props.affairId,
        roleId: this.props.roleId,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }).then((res) => res.json()).then((res) => {
        if (res.code === 0) {
          this.setState({
            modifyingTemplate: false,
            templateStep: CHOOSE_TEMPLATE,
            useTemplateToCreate: false,
          })
          this.fetchTemplateList()
        }
      })
    })
  },
  handleDeleteTemplate() {
    // 删除用户当前选择的模板
    fetch(config.api.material.template.delete(this.state.selectedTemplate), {
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affairId,
      roleId: this.props.roleId,
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.setState({
          selectedTemplate: null,
          templateList: this.state.templateList.filter((v) => v.get('id') != this.state.selectedTemplate),
        })
      }
    })
  },
  handleCreateMaterialByTemplate(modifyTemplate = false) {
    fetch(config.api.material.template.detail.get(this.state.selectedTemplate), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affairId,
      roleId: this.props.roleId,
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const data = res.data

        this.props.form.setFieldsValue({
          name: data.name,
          price: data.price ? data.price.toString() : data.price,
          materialType: data.type.toString(),
          unit: data.unit.toString(),
          quantity: data.quantity.toString(),
        })

        let attribute = JSON.parse(data.attribute)
        if (attribute) {
          attribute = List(attribute.map((v) => ({ name: v.left, content: v.right })))
        } else {
          attribute = List()
        }

        data.description && this.refs.editor.getWrappedInstance().setContent(data.description)
        this.setState({
          attributes: List(attribute),
          currencyType: data.currency,
          modifyingTemplate: modifyTemplate,
          pictureUrl: data.image,
          publicType: data.publicType === 0 ? true : false,
          useTemplateToCreate: !modifyTemplate,
          templateStep: null,
        })
      }
    })
  },
  handleAddAttribute() {
    if (this.state.attributes.size > 128){
      notification.error({
        message: '属性不能超过128个'
      })
      return
    }
    this.setState({
      attributes: this.state.attributes.push({
        name: '',
        content: '',
      }),
      needFocus: this.state.attributes.size,
    })
  },
  handleUploadPicture(evt) {
    const file = evt.target.files[0]

    oss.uploatMaterialFile(this.props.affairId, this.props.roleId, file, this.props.warehouseId).then((res) => {
      this.setState({
        pictureUrl: `${res.host}/${res.path}`,
      })
    })
  },
  // 用户选择某个仓库中的物资来创建模板
  handleUseWarehouseMaterial(warehouseId) {
    fetch(config.api.material.warehouse.materialList.get(warehouseId), {
      method: 'GET',
      credentials: 'include',
      affairId: this.props.affairId,
      roleId: this.props.roleId,
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const data = fromJS(res.data)

        this.setState({
          createTemplateCurrentWarehouse: warehouseId,
          materialList: data.reduce((reduction, v) => {
            return reduction.push(Map({
              id: v.get('id'),
              name: v.get('name'),
              picture: v.get('image'),
            }))
          }, List())
        })
      }
    })
  },
  handleCreateTemplate() {
    fetch(config.api.material.template.post(this.state.selectedMaterial, this.state.createTemplateCurrentWarehouse), {
      method: 'POST',
      credentials: 'include',
      affairId: this.props.affairId,
      roleId: this.props.roleId,
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        this.setState({
          templateStep: CHOOSE_TEMPLATE,
        })
        this.fetchTemplateList()
      }
    })
  },
  handleDeleteAttributes(key) {
    this.setState({
      attributes: this.state.attributes.splice(key, 1),
    })
  },
  handleAddMaterialSubmit() {
    if (!this.handlePriceCheck(this.state.price)){
      return
    }
    if (this.handleCheckAttribute()){
      notification.error({
        message: '属性名不能重复'
      })
      return
    }
    this.props.form.validateFields((errors, values) => {
      if (errors){
        return
      }

      const body = {
        name: values.name,
        currency: this.state.currencyType,
        price: this.state.price || null,
        quantity: parseInt(values.quantity),
        unit: values.unit,
        description: this.refs.editor.getWrappedInstance().getContent(),
        attribute: this.state.attributes.filter((v) => v.name && v.content).map((v) => ({ left: v.name, right: v.content })).toJS(),
        image: this.state.pictureUrl,
        type: parseInt(values.materialType),
        publicType: this.state.isPublic ? 0 : 10,
        warehouseId: this.props.warehouseId,
        tag: this.state.tags,
      }

      fetch(config.api.material.post(), {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        affairId: this.props.affairId,
        roleId: this.props.roleId,
        body: JSON.stringify(body),
      }).then((res) => res.json()).then((res) => {
        if (res.code === 0) {
          body.id = res.data
          this.cleanState()
          this.props.onClose(body)
        }
        else {
          notification.error({
            message: '没有操作权限'
          })
        }
      })
    })
  },
  handleCancel(){
    this.cleanState()
    this.props.onClose()
  },
  cleanState(){
    this.setState({ tags: [], isAddingTag: false, addingTagValue: '' })
  },
  handleAddTagOnchange(e){
    this.setState({
      addingTagValue: e.target.value,
    })
  },
  handleAddTagOnBlur(){
    let { tags } = this.state
    if (this.state.addingTagValue.length == 0){
      this.setState({
        isAddingTag: false,
      })
      return
    }
    if (this.state.addingTagValue.length > 8){
      notification.error({
        message: '标签长度应为1-8个字符'
      })
      this.setState({
        isAddingTag: false,
      })
      return
    }
    if (this.state.tags.length == 8){
      notification.error({
        message: '至多添加8个标签'
      })
      this.setState({
        isAddingTag: false,
      })
      return
    }
    if (tags.some((v) => v == this.state.addingTagValue)){
      notification.error({
        message: '标签不能重复'
      })
      this.setState({
        isAddingTag: false,
      })
      return
    }
    tags.push(this.state.addingTagValue)
    this.setState({
      isAddingTag: false,
      tags: tags,
      addingTagValue: '',
    })
  },
  handleAddTagPressEnter(){
    let { tags } = this.state
    if (this.state.addingTagValue.length > 8){
      notification.error({
        message: '标签长度应为1-8个字符'
      })
      return
    }
    if (this.state.tags.length == 8){
      notification.error({
        message: '至多添加8个标签'
      })
      return
    }
    if (tags.some((v) => v == this.state.addingTagValue)){
      notification.error({
        message: '标签不能重复'
      })
      return
    }
    tags.push(this.state.addingTagValue)
    this.setState({
      isAddingTag: false,
      tags: tags,
      addingTagValue: '',
    })
  },
  handleRemoveTag(tag){
    this.setState({
      tags: this.state.tags.filter((v) => {return v != tag})
    })
  },

  handlePriceChange(e){
    this.setState({ price: e.target.value })
  },
  handlePriceCheck(value){
    if (isNaN(value)){
      this.setState({
        priceValid: {
          status: 'error',
          help: '请输入数字',
        }
      })
      return false
    }
    else if (parseFloat(value).toFixed(2).toString().length > 15){
      this.setState({
        priceValid: {
          status: 'error',
          help: '数额过大',
        }
      })
      return false
    }
    else if (value == ''){
      this.setState({
        priceValid: {
          status: 'error',
          help: '价格不能为空',
        }
      })
      return false
    } else {
      this.setState({
        price: parseFloat(value).toFixed(2),
        priceValid: {
          status: '',
          help: '',
        }
      })
      return true
    }
  },
  handlePriceOnBlur(e){
    this.handlePriceCheck(e.target.value)
  },
  handleCheckAttribute(){
    let flag = false
    let attr = this.state.attributes
    attr.map((i, m) => {
      attr.map((j, n) => {
        if ((i.name == j.name) && (m != n)){
          flag = true
        }
      })
    })
    return flag
  },
  renderTitle() {
    const deactiveTemplate = true
    return (
      <div className={styles.title}>
        <div>{this.state.modifyingTemplate ? '修改模板' : this.state.useTemplateToCreate ? '模板登记物资' : '登记物资'}</div>

        {
          (!this.state.modifyingTemplate && !deactiveTemplate) ? (
            <div
              className={styles.useTemplate}
              onClick={() => this.setState({ templateStep: CHOOSE_TEMPLATE })}
            >{!this.state.useTemplateToCreate ? '使用模板' : '更换模板'}</div>
          ) : null
        }

        <div className={styles.public}>
          公开：<Switch checkedChildren="开" unCheckedChildren="关" checked={this.state.isPublic} onChange={(checked) => this.setState({ isPublic: checked })}/>
        </div>
      </div>
    )
  },
  renderBasicInformation() {
    const { getFieldDecorator } = this.props.form
    const hideType = true
    const nameDecorator = getFieldDecorator('name', {
      validate: [{
        rules: [
          { required: true, message: '请输入物资名称' },
          { max: 16, message: '物资名称需少于16字符' },
        ],
        trigger: 'onBlur',
      }]
    })
    const typeDecorator = getFieldDecorator('materialType', {
      validate: [{
        rules: [],
        trigger: 'onBlur',
      }],
      initialValue: this.state.treeData[0] && this.state.treeData[0].value.toString(),
    })
    const unitDecorator = getFieldDecorator('unit', {
      validate: [{
        rules: [
          { required: true, message: '请输入数量单位' },
          { max: 3, message: '数量单位不能超过3个字符' },
        ],
        trigger: 'onBlur',
      }]
    })
    const quantityDecorator = getFieldDecorator('quantity', {
      validate: [{
        rules: [{
          pattern: /^\d+(\.\d{1,2})?$/,
          message: '请输入数字,且小数点后最多保留两位'
        }, {
          required: true,
          message: '请输入物资数量'
        }],
        trigger: 'onBlur',
      }]
    })
    const priceSelect = (
      <Select value={this.state.currencyType} style={{ width: 70 }}>
        <Option value="CNY">CNY</Option>
      </Select>
    )

    let uploadArea = null
    // 当用户未上传图片时，使用默认图。
    if (!this.state.pictureUrl) {
      uploadArea = (
        <div className={styles.materialPicture}>
          <MaterialDefaultPicture />

          <div className={styles.uploadTip} style={{ opacity: 1 }}>
            <div className={styles.uploadTipBox}>
              <AddIcon fill="#ccc" />
              <span>上传主图</span>
            </div>
          </div>
        </div>
      )
    } else {
      uploadArea = (
        <div className={styles.materialPicture}>
          <img src={this.state.pictureUrl} />

          <div className={styles.uploadTip}>
            <div className={styles.uploadTipBox}>
              <AddIcon fill="#ccc" />
              <span>重新上传</span>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={styles.basicInformation}>
        {/* 物资的图片描述 */}
        <div className={styles.image} onClick={() => this.refs.uploader.click()}>
          {uploadArea}

          <input
            type="file"
            ref="uploader"
            style={{
              display: 'none'
            }}
            onChange={this.handleUploadPicture}
            accept={['image/jpg', 'image/jpeg', 'image/png', 'image/gif']}
          />
        </div>

        {/* 物资的基本信息 */}
        <Form
          horizontal
        >
          <FormItem
            label="物资名称"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
          >
            {nameDecorator(<Input />)}
          </FormItem>

          <FormItem
            label="价格"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            validateStatus={this.state.priceValid.status}
            help={this.state.priceValid.help}
          >
            <Input placeholder="--" addonBefore={priceSelect} value={this.state.price} onChange={this.handlePriceChange} onBlur={this.handlePriceOnBlur}/>
          </FormItem>
          {!hideType &&
            <FormItem
              label="类别"
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
            >
              {typeDecorator(
                <TreeSelect
                  style={{ width: 300 }}
                  dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                  treeData={this.state.treeData}
                  placeholder="请选择类别"
                />
              )}
            </FormItem>
          }

          <FormItem
            label="数量"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
          >
            <Col span="9">
              <FormItem>
                {quantityDecorator(<Input />)}
              </FormItem>
            </Col>
            <Col span="5" className={styles.unitLabel}>
              单位：
            </Col>
            <Col span="10">
              <FormItem>
                {unitDecorator(
                  <Select
                    showSearch
                    style={{ fontSize: 14 }}
                    optionFilterProp="children"
                    notFoundContent="无法找到该单位"
                  >
                    {
                    UNITS.map((unit, k) => {
                      return (
                        <Option value={unit} key={k}>{unit}</Option>
                      )
                    })
                  }
                  </Select>
                )}
              </FormItem>
            </Col>
          </FormItem>

          <FormItem
            label="标签"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
          >
            {this.renderTags()}
          </FormItem>
        </Form>
      </div>
    )
  },

  renderTags() {
    const { tags, isAddingTag } = this.state

    return (
      <div className={styles.tagsRow}>
        {tags.map((tag, k) =>
          (
            <div className={styles.tag} key={k}>
              <div className={styles.hover} onClick={this.handleRemoveTag.bind(null, tag)}>移除</div>
              <Tag>{tag}</Tag>
            </div>
          )
        )}
        {
          isAddingTag
              ?
                <Input className={styles.addTagInput} maxLength="12" ref={(input) => {if (input){input.refs.input.focus()}}} value={this.state.addingTagValue} onChange={this.handleAddTagOnchange} onBlur={this.handleAddTagOnBlur} onPressEnter={this.handleAddTagPressEnter}/>
              :
                <Button size="small" type="dashed" onClick={() => {
                  if (this.state.tags.length >= 8){
                    notification.error({
                      message: '至多添加8个标签'
                    })
                    return
                  } else {
                    this.setState({ isAddingTag: true })
                  }
                }} className={styles.addBtn}
                >+</Button>
        }
      </div>
    )
  },
  renderAttributes() {
    return (
      <div>
        参数：
        <div className={styles.attributes}>
          {
            this.state.attributes.map((attr, k) => {
              return (
                <div className={styles.attribute} key={k}>
                  <span onClick={this.handleDeleteAttributes.bind(this, k)}><DeleteIcon /></span>
                  <Input placeholder="属性名" value={attr.name} onChange={(evt) => {if (evt.target.value.length > 8){notification.error({ message: '属性名长度不能超过8位' });return} this.setState({ attributes: this.state.attributes.update(k, (attr) => {attr.name = evt.target.value;return attr}) })}} ref={(input) => {if (k == this.state.needFocus && input){input.refs.input.focus();this.setState({ needFocus: -1 })}}}/>
                  <span>-</span>
                  <Input placeholder="属性值" value={attr.content} onChange={(evt) => {if (evt.target.value.length > 16){notification.error({ message: '属性名长度不能超过16位' });return} this.setState({ attributes: this.state.attributes.update(k, (attr) => {attr.content = evt.target.value;return attr}) })}}/>
                </div>
              )
            })
          }

          <div className={styles.addAttribute} onClick={this.handleAddAttribute}>+ 添加属性</div>
        </div>
      </div>
    )
  },
  renderTemplateActions() {
    return (
      <Menu>
        <Menu.Item key="0">
          <div onClick={() => this.handleCreateMaterialByTemplate(true)}>修改</div>
        </Menu.Item>
        <Menu.Item key="1">
          <div onClick={this.handleDeleteTemplate}>删除</div>
        </Menu.Item>
      </Menu>
    )
  },
  renderChooseTemplate() {
    return (
      <div className={styles.chooseTemplate}>
        <div>选择模板</div>

        {/* 模板列表 */}
        <div className={styles.templateList}>
          {
            this.state.templateList.map((template) => {
              return (
                <div className={styles.template} key={template.get('id')}>
                  <div className={styles.material} key={template.get('id')}>
                    <div className={classNames(styles.picture, this.state.selectedTemplate === template.get('id') ? styles.selectedMaterial : null)} onClick={() => this.setState({ selectedTemplate: template.get('id') })}>
                      {template.get('image') ? <img src={template.get('image')} /> : null}
                      {this.state.selectedTemplate === template.get('id') ? <Dropdown overlay={this.renderTemplateActions()} trigger={['click']}><MoreIcon /></Dropdown> : null}
                    </div>
                    <div className={styles.name}>{template.get('name')}</div>
                  </div>
                </div>
              )
            })
          }

          {/* 添加模板 */}
          <div
            className={styles.addTemplate}
            onClick={() => {
              this.handleUseWarehouseMaterial(this.props.warehouseId.toString())
              this.setState({
                templateStep: CREATE_TEMPLATE,
              })
            }}
          >
            <AddIcon />
          </div>
        </div>

        <div className={styles.btnGroup}>
          <Button type="ghost" onClick={() => this.setState({ templateStep: null })}>取消</Button>
          <Button type="primary" onClick={() => this.handleCreateMaterialByTemplate()} disabled={!this.state.selectedTemplate}>确定</Button>
        </div>
      </div>
    )
  },
  renderCreateTemplate() {
    return (
      <div className={styles.chooseTemplate}>
        <div>创建模板</div>

        {/*选择库*/}
        <Select onChange={this.handleUseWarehouseMaterial} value={this.state.createTemplateCurrentWarehouse}>
          {
            this.state.warehouseList.map((v) => <Option value={v.get('id').toString()} key={v.get('id')}>{v.get('name')}</Option>)
          }
        </Select>

        {/* 模板列表 */}
        <div className={styles.templateList}>
          {
            this.state.materialList.map((v) => (
              <div className={styles.material} key={v.get('id')}>
                <div className={classNames(styles.picture, this.state.selectedMaterial === v.get('id') ? styles.selectedMaterial : null)} onClick={() => this.setState({ selectedMaterial: v.get('id') })}>
                  {v.get('picture') ? <img src={v.get('picture')} /> : null}
                </div>
                <div className={styles.name}>{v.get('name')}</div>
              </div>
            ))
          }
        </div>

        <div className={styles.btnGroup}>
          <Button type="ghost" onClick={() => this.setState({ templateStep: CHOOSE_TEMPLATE })}>返回选择模板</Button>
          <Button type="primary" onClick={this.handleCreateTemplate} disabled={!this.state.selectedMaterial}>
            创建为模板
          </Button>
        </div>
      </div>
    )
  },
  renderDescription() {
    return (
      <div>
        <div>描述：</div>

        <AnnouncementEditor
          hideTitleInput
          hideFooter
          className={styles.editor}
          controlClassName={styles.eidtorControl}
          ref="editor"
          affair={Map({
            id: this.props.affairId,
            roleId: this.props.roleId,
          })}
        />
      </div>
    )
  },
  renderFooter() {
    if (this.state.modifyingTemplate) {
      return (
        <div className={styles.footer}>
          <Button onClick={this.handleCancel} type="ghost" onClick={() => {
            this.setState({
              templateStep: CHOOSE_TEMPLATE,
              modifyingTemplate: false,
            })
          }}
          >返回选择模板</Button>
          <Button onClick={this.handleCancel} type="ghost" onClick={this.handleCreateNewTemplateByTemplate}>创建为新模板</Button>
          <Button onClick={this.handleSaveTemplate} type="primary">保存</Button>
        </div>
      )
    } else {
      return (
        <div className={styles.footer}>
          <Button onClick={this.handleCancel} type="ghost">取消</Button>
          <Button onClick={this.handleAddMaterialSubmit} type="primary">登记</Button>
        </div>
      )
    }
  },
  render() {
    return (
      <Modal
        title={this.renderTitle()}
        visible
        closable={false}
        wrapClassName={styles.container}
        width={900}
        footer={this.renderFooter()}
      >
        {this.renderBasicInformation()}
        {this.renderAttributes()}
        {this.renderDescription()}
        {this.state.templateStep === CHOOSE_TEMPLATE ? this.renderChooseTemplate() : null}
        {this.state.templateStep === CREATE_TEMPLATE ? this.renderCreateTemplate() : null}
      </Modal>
    )
  }
})

AddMaterialModal = Form.create()(AddMaterialModal)

export default AddMaterialModal
