import React from 'react'
import { Modal, Input, Form, Button, Upload, Icon, Select, message, Row, Col, Popconfirm, DatePicker } from 'antd'
import { fromJS, List } from 'immutable'
import { ReleaseStencil } from 'svg'
import messageHandler from 'messageHandler'
import oss from 'oss'
import AnnouncementEditor from '../AnnouncementEditor'
import { OfficialRoleSelector, GuestRoleSelector } from '../../../components/role/RoleSelector'
import config from '../../../config'
import styles from './CreateAnnouncementModal.scss'
import moment from 'moment'

const FormItem = Form.Item
const Option = Select.Option
const formItemLayout = {
  labelCol: { span: 3 },
  wrapperCol: { span: 21 },
}
const formItemHalfLayout = {
  labelCol: { span: 3 },
  wrapperCol: { span: 9 },
}
const formInlineItemLayout = {
  labelCol: { span: 7 },
  wrapperCol: { span: 17 },
}

const TEMPLATE_LIST = [{
  color: '#4a90e2',
  iconText: '发布',
  label: '普通发布',
}, {
  color: '#f45b6c',
  iconText: 'BUG',
  label: 'BUG发布',
}, {
  color: '#66b966',
  iconText: '需求',
  label: '需求发布',
}]

const BugTemplateContent = '{"entityMap":{},"blocks":[{"key":"9aiu7","text":"【BUG描述】：","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"109l4","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"1nadc","text":"【测试数据】：","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"3f6fe","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"fgimk","text":"【预期结果】：","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"bd996","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"450dh","text":"【实际结果】：","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"73hlp","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}]}'
const EmptyContent = '{"entityMap":{},"blocks":[{"key":"fs8fo","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}]}'

class CreateAnnouncementModal extends React.Component {
  static defaultProps = {
    onClose: () => {},
    roleId: 0,
    affairId: 0,
    parentAnnouncement: null,
    editAnouncement: null,
    initialDraft: null,
    confirmDraft: false, // 在取消时确认是否要保留草稿。
    showDelayPublishModal: false,
  }

  state = {
    // 被选择的官方。
    selectedOfficialRoleList: List(),
    selectedGuestList: [],
    // 是否打开选择模板的面板。
    openChooseTemplatePanel: false,
    // 当前使用的模板。
    currentTemplate: TEMPLATE_LIST[0],
    chosenTemplate: TEMPLATE_LIST[0],
    // 官方候选人
    officialRoleList: List(),
    // 默认的延迟发布时间
    delayTime: null,
    loading: false,
    disableSaveDraft: false,
  }

  componentDidMount = () => {
    this.handleFetchOfficialRoleCandidates()

    const {
      editAnouncement,
      initialDraft,
    } = this.props

    if (editAnouncement) {
      this.setState({
        currentTemplate: TEMPLATE_LIST[editAnouncement.get('plateType')],
      })
    }

    if (initialDraft) {
      this.setState({
        selectedOfficialRoleList: fromJS(initialDraft.officials),
      })
    }
  }

  handleFetchOfficialRoleCandidates = () => {
    fetch(config.api.affair.role.affair_roles(), {
      method: 'GET',
      credentials: 'include',
      roleId: this.props.roleId,
      affairId: this.props.affairId,
    }).then((res) => res.json()).then((json) => {
      if (json.code === 0) {
        const officialRoleList = fromJS(json.data || [])
        const selectedOfficialRoleList = officialRoleList.filter((v) => v.get('roleId') === this.props.roleId)

        this.setState({
          officialRoleList,
          selectedOfficialRoleList,
        })
      }
    })
  }
  handleChangeTemplate = (template) => {
    if (this.state.currentTemplate === template) {
      return
    }

    // 插入BUG模板中发布的内容
    if (template === TEMPLATE_LIST[1]) {
      this._editor.getWrappedInstance().setContent(BugTemplateContent)
    } else {
      this._editor.getWrappedInstance().setContent(EmptyContent)
    }

    this.setState({
      currentTemplate: template,
    })
  }
  handleCreate = (delayPublish = false) => {
    const {
      affairId,
      roleId,
      parentAnnouncement,
      editAnouncement,
    } = this.props
    const { selectedGuestList, delayTime } = this.state

    this.props.form.validateFields(
      (err, values) => {
        if (!err) {
          if (delayPublish && delayTime.valueOf() < Date.now()) {
            message.error('请选择一个未来的时刻')
            return
          }

          const editor = this._editor.getWrappedInstance()
          const content = JSON.parse(editor.getContent())
          const contentText = content.blocks.reduce((r, v) => r + v.text, '')
          if (contentText.length === 0 || Object.keys(content.entityMap) === 0) {
            message.error('发布内容不能为空')
            return
          }

          const attachmentUrl = JSON.stringify(values.appendix.map((v) => `${v.response.path}`))

          const chosenMap = {
            innerAffair: selectedGuestList
              .filter((v) => v.type == 'ROLE')
              .map((v) => v.payload.roleId),
            innerAlliance: selectedGuestList
              .filter((v) => v.type == 'ALLIANCE_INNER_AFFAIRE')
              .map((v) => v.payload.get('id')),
            outerAlliance: []
          }

          this.setState({
            loading: true,
            disableSaveDraft: true,
          })

          fetch(!editAnouncement ? config.api.announcement.post : config.api.announcement.update(editAnouncement.get('announcementId')), {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            affairId,
            resourceId: editAnouncement ? editAnouncement.get('announcementId') : 0,
            roleId,
            body: JSON.stringify({
              announcementId: editor.state.draftId || null,
              title: values.title,
              authority: this.state.selectedOfficialRoleList.map((v) => v.get('roleId')).toJS(),
              content: editor.getContent(),
              isTop: 0,
              plateType: TEMPLATE_LIST.indexOf(this.state.currentTemplate),
              attachmentUrl, // 附件
              effectiveTime: delayPublish ? this.state.delayTime && this.state.delayTime + 0 : null,
              publicType: parseInt(values.publicType),
              priority: parseInt(values.priority),
              requirementState: parseInt(values.requirementState),
              result: parseInt(values.result),
              parentId: parentAnnouncement ? parentAnnouncement.get('announcementId') : null,
              tags: '[]',
              startTime: values.planDuration && values.planDuration[0] ? values.planDuration[0] + 0 : null,
              endTime: values.planDuration && values.planDuration[1] ? values.planDuration[1] + 0 : null,
              ...chosenMap,
            }),
          })
            .then((res) => res.json())
            .then(messageHandler)
            .then((res) => {
              this.setState({
                loading: false,
                disableSaveDraft: false,
              })

              if (res.code === 0 || res.code === 20000) {
                setTimeout(() => {
                  // 服务器最新列表的返回需要延迟。
                  this.props.onSucceed()
                  this.props.onClose()
                }, 300)
              }
              if (res.code == 20000 ){
                this.props.onClose()
              }
            })
        }
      }
    )
  }
  handleSelectOfficialChange = (selectedRoleList) => {
    if (!selectedRoleList || selectedRoleList.size < 1) return

    this.setState({
      selectedOfficialRoleList: selectedRoleList,
    })
  }
  handleCancel = (shouldDeleteDraft) => {
    const editor = this._editor.getWrappedInstance()
    if (!shouldDeleteDraft && !this.props.editAnouncement) {
      editor.forceSaveDraft().then(() => {
        this.props.onClose()
      })

      return
    }

    if (shouldDeleteDraft && editor && editor.state.draftId) {
      editor.props.deleteDraft(editor.state.draftId, fromJS({
        id: this.props.affairId,
        roleId: this.props.roleId,
      }))
    }

    this.props.onClose()
  }
  handleDelayDateChange = (v) => {
    this.setState({
      delayTime: v,
    })
  }
  normFile = (e) => {
    if (Array.isArray(e)) {
      return e
    }
    return e && e.fileList
  }
  requestUploadAttachment = ({
    file,
    onSuccess,
    onProgress,
  }) => {
    oss.uploadAnnouncementAttachment(file, fromJS({ id: this.props.affairId, roleId: this.props.roleId }), (progress) => {
      onProgress({ percent: progress })
    }).then((res) => {
      onSuccess(res)
    })
  }

  renderTitle(hideTemplate = false) {
    const color = this.state.openChooseTemplatePanel ? '#4a90e2' : '#9b9b9b'

    return (
      <div className={styles.title}>
        <p>{this.props.parentAnnouncement ? '创建子发布' : this.props.editAnouncement ? '编辑发布' : '创建发布'}</p>

        {
          !hideTemplate && (
            <div
              className={styles.templateType}
              style={{ color: color }}
              onClick={() => this.setState({ openChooseTemplatePanel: !this.state.openChooseTemplatePanel })}
            >
              <ReleaseStencil style={{ width: 12, height: 12, marginRight: 5 }} fill={color} />
              使用模板
            </div>
          )
        }
      </div>
    )
  }
  renderAnnouncementEditor() {
    return (
      <AnnouncementEditor
        hideTitleInput
        hideFooter
        disableSaveDraft={this.state.disableSaveDraft}
        initialDraft={this.props.initialDraft}
        draftId={this.props.initialDraft && this.props.initialDraft.id}
        announcementToEdit={this.props.editAnouncement && this.props.editAnouncement.toJS()}
        className={styles.editor}
        affairId={this.props.affairId}
        roleId={this.props.roleId}
        ref={(editor) => {this._editor = editor}}
        title={this.props.form.getFieldsValue().title}
        publicType={this.props.form.getFieldsValue().publicType}
        priority={this.props.form.getFieldsValue().priority}
        planDuration={this.props.form.getFieldsValue().planDuration}
      />
    )
  }
  renderBugTemplateFormItem(getFieldDecorator) {
    return (
      <Row gutter={24}>
        {/*
        <Col span={11}>
          <FormItem
            label="重要程度"
            {...formInlineItemLayout}
          >
            {getFieldDecorator('import', {
              rules: [
                { required: true, message: '请选择发布的重要程度' },
              ],
              initialValue: this.props.editAnouncement ? this.props.editAnouncement.get('important').toString() : '2',
            })(
              <Select>
                <Option value="0">非常高</Option>
                <Option value="1">高</Option>
                <Option value="2">中</Option>
                <Option value="3">低</Option>
                <Option value="4">非常低</Option>
              </Select>
            )}
          </FormItem>
        </Col>
        */}

        <Col span={12} style={{ paddingRight: 16, paddingLeft: 0 }}>
          <FormItem
            label="处理结果"
            {...formInlineItemLayout}
          >
            {getFieldDecorator('result', {
              rules: [
                { required: true, message: '请选择该发布的处理结果' },
              ],
              initialValue: this.props.editAnouncement ? this.props.editAnouncement.get('result').toString() : '0',
            })(
              <Select>
                <Option value="0">未修复</Option>
                <Option value="1">修复</Option>
              </Select>
            )}
          </FormItem>
        </Col>
      </Row>
    )
  }
  renderRequirementTemplateFormItem(getFieldDecorator) {
    return (
      <FormItem
        {...formItemHalfLayout}
        label="需求阶段"
      >
        {getFieldDecorator('requirementState', {
          rules: [
            { required: true, message: '请选择发布的需求阶段' },
          ],
          initialValue: this.props.editAnouncement ? this.props.editAnouncement.get('requirementState').toString() : '0',
        })(
          <Select>
            <Option value="0">草稿</Option>
            <Option value="1">待开发</Option>
            <Option value="2">开发中</Option>
            <Option value="3">开发完成</Option>
          </Select>
        )}
      </FormItem>
    )
  }
  renderAnnouncement() {
    const { getFieldDecorator } = this.props.form
    const {
      editAnouncement,
      initialDraft,
    } = this.props

    return (
      <Form>
        {/* 父发布 */}
        {
          this.props.parentAnnouncement ? (
            <FormItem {...formItemLayout} label="父发布">
              <div className={styles.parentAnnouncementLabel}>
                <div className={styles.parentAnnouncementIcon}>发布</div>
                <div>{this.props.parentAnnouncement.get('title')}</div>
              </div>
            </FormItem>
          ) : null
        }

        {/* 发布标题 */}
        <FormItem {...formItemLayout} label="发布标题">
          {getFieldDecorator('title', {
            initialValue: editAnouncement ? editAnouncement.get('title') : initialDraft ? initialDraft.title : '',
            rules: [{
              required: true,
              message: '请输入发布的标题',
            }, {
              max: 50,
              message: '发布标题不能超过50字',
            }],
          })(
            <Input autoComplete="off" />
          )}
        </FormItem>

        {/* 发布内容 */}
        <FormItem {...formItemLayout} label="发布内容">
          {getFieldDecorator('content', {
            rules: [],
          })(
            this.renderAnnouncementEditor()
          )}
        </FormItem>

        {/* 附件 */}
        <FormItem
          {...formItemLayout}
          label="附件"
        >
          {getFieldDecorator('appendix', {
            valuePropName: 'fileList',
            getValueFromEvent: this.normFile,
            initialValue: [],
          })(
            <Upload
              name="appendix"
              customRequest={this.requestUploadAttachment}
            >
              <Button className={styles.uploadButton}>
                <Icon type="upload" /> 点击此处上传附件
              </Button>
            </Upload>
          )}
        </FormItem>

        {/* 官方 */}
        {!editAnouncement ? (
          <FormItem
            {...formItemLayout}
            label="官方"
          >
            {getFieldDecorator('officialRole', {
              rules: [],
            })(
              <OfficialRoleSelector
                onChange={this.handleSelectOfficialChange}
                roleList={this.state.officialRoleList}
                selectedRoleList={this.state.selectedOfficialRoleList}
                selectedGuestList={fromJS(this.state.selectedGuestList.filter((v) => v.type === 'ROLE').map((v) => fromJS(v.payload)))}
              />
            )}
          </FormItem>
        ) : null}

        {/* 接收方 */}
        {!editAnouncement ? (
          <FormItem
            {...formItemLayout}
            label="客方"
          >
            <GuestRoleSelector
              affairId={this.props.affairId}
              roleId={this.props.roleId}
              allianceId={this.props.allianceId}
              onChange={(selectedGuestList) => this.setState({ selectedGuestList })}
              selectedGuestList={this.state.selectedGuestList}
              selectedOfficialRoleList={this.state.selectedOfficialRoleList}
            />
          </FormItem>
        ) : null}

        { this.state.currentTemplate === TEMPLATE_LIST[1] ? this.renderBugTemplateFormItem(getFieldDecorator) : null }
        { this.state.currentTemplate === TEMPLATE_LIST[2] ? this.renderRequirementTemplateFormItem(getFieldDecorator) : null }

        <Row gutter={24}>
          <Col span={11}>
            {/* 可见性 */}
            <FormItem
              {...formInlineItemLayout}
              label="可见性"
            >
              {getFieldDecorator('publicType', {
                rules: [
                  { required: true, message: '请选择发布的可见性' },
                ],
                initialValue: editAnouncement ? editAnouncement.get('publicType').toString() : initialDraft ? initialDraft.publicType + '' : '2',
              })(
                <Select>
                  <Option value="0">全网公开</Option>
                  <Option value="1">盟内公开</Option>
                  <Option value="2">事务内公开</Option>
                  <Option value="3">本事务公开</Option>
                  <Option value="4">私密</Option>
                </Select>
              )}
            </FormItem>
          </Col>

          {/* 优先级 */}
          <Col span={11}>
            <FormItem
              {...formInlineItemLayout}
              label="优先级"
            >
              {getFieldDecorator('priority', {
                rules: [
                  { required: true, message: '请选择发布的优先级' },
                ],
                initialValue: editAnouncement ? editAnouncement.get('priority').toString() : initialDraft ? initialDraft.priority + '' : '0',
              })(
                <Select>
                  <Option value="2">低</Option>
                  <Option value="1">中</Option>
                  <Option value="0">高</Option>
                </Select>
              )}
            </FormItem>
          </Col>
        </Row>

        {/* 计划时间 */}
        {!editAnouncement && (
          <FormItem
            {...formItemHalfLayout}
            label="计划时间"
          >
            {getFieldDecorator('planDuration', {
              initialValue: initialDraft && initialDraft.startTime && initialDraft.endTime ? [moment(initialDraft.startTime), moment(initialDraft.endTime)] : null,
            })(
              <DatePicker.RangePicker
                style={{ height: 32 }}
                showTime
                format="YYYY/MM/DD HH:mm"
              />
            )}
          </FormItem>
        )}
      </Form>
    )
  }
  renderFooter() {
    return (
      <div className={styles.footer}>
        <div
          className={styles.delayPublish}
          onClick={() => {
            this.props.form.validateFields(
              (err) => {
                if (!err) {
                  const editor = this._editor.getWrappedInstance()
                  const content = JSON.parse(editor.getContent())
                  const contentText = content.blocks.reduce((r, v) => r + v.text, '')
                  if (contentText.length === 0 || Object.keys(content.entityMap) === 0) {
                    message.error('发布内容不能为空')
                    return
                  }

                  this.setState({ showDelayPublishModal: true })
                }
              }
            )
          }}
        >
          <Icon type="clock-circle-o" />
          延时发布
        </div>

        <div>
          { this.props.confirmDraft ? (
            <Popconfirm
              title="是否将该发布保存到草稿"
              okText="是"
              cancelText="否"
              onConfirm={() => this.handleCancel(false)}
              onCancel={() => this.handleCancel(true)}
            >
              <Button type="ghost" size="large">取消</Button>
            </Popconfirm>
          ) : (
            <Button type="ghost" size="large" onClick={() => this.handleCancel(false)}>取消</Button>
          ) }
          <Button type="primary" size="large" loading={this.state.loading} onClick={() => this.handleCreate(false)}>{this.props.editAnouncement ? '保存编辑' : '确认发布'}</Button>
        </div>
      </div>
    )
  }
  renderTemplateSelect() {
    if (!this.state.openChooseTemplatePanel) return null

    return (
      <div className={styles.templateSelect}>
        <div className={styles.chooseTemplateLabel}>选择模板：</div>
        <div className={styles.templateList}>
          {
            TEMPLATE_LIST.map((template) => {
              const currentlyUse = template === this.state.chosenTemplate

              return (
                <div
                  className={styles.templateListItem}
                  key={template.iconText}
                  style={currentlyUse ? { backgroundColor: '#fbf8ff' } : {}}
                  onClick={() => {this.setState({ chosenTemplate: template })}}
                >
                  <p style={{ color: template.color, borderColor: template.color }}>{template.iconText}</p>
                  {template.label}
                  {currentlyUse ? <Icon type="check" /> : null}
                </div>
              )
            })
          }
        </div>
        <div className={styles.buttonGroup}>
          <Button size="large" style={{ marginRight: 10 }} onClick={() => { this.setState({ openChooseTemplatePanel: false });this.setState({ chosenTemplate: this.state.currentTemplate }) }}>取消</Button>
          <Button size="large" type="primary" onClick={() => { this.setState({ openChooseTemplatePanel: false });this.handleChangeTemplate(this.state.chosenTemplate) }}>确定</Button>
        </div>
      </div>
    )
  }
  renderDelayFooter() {
    return (
      <div className={styles.footer}>
        <Button type="ghost" style={{ marginLeft: 'auto' }} onClick={() => this.setState({ showDelayPublishModal: false, delayTime: null })}>取消</Button>
        <Button type="primary" onClick={() => this.handleCreate(true)}>确定</Button>
      </div>
    )
  }
  renderDelayPublishModal() {
    if (!this.state.showDelayPublishModal) return null

    return (
      <Modal
        width={500}
        wrapClassName={styles.delayPublishModal}
        footer={this.renderDelayFooter()}
        title={this.renderTitle(true)}
        closable={false}
        visible
      >
        <div className={styles.delayPublishContent}>
          <DatePicker
            placeholder="设定延时时间"
            style={{ width: 300 }}
            showTime
            format="YYYY-MM-DD HH:mm"
            value={this.state.delayTime}
            onChange={this.handleDelayDateChange}
            disabledDate={(current) => {
              return current && current.valueOf() < moment().startOf('day')
            }}
          />
        </div>
      </Modal>
    )
  }
  render() {
    return (
      <Modal
        width={700}
        visible
        closable={false}
        title={this.renderTitle()}
        footer={this.renderFooter()}
        wrapClassName={styles.modal}
      >
        {this.renderAnnouncement()}
        {this.renderTemplateSelect()}
        {this.renderDelayPublishModal()}
      </Modal>
    )
  }
}

export default Form.create()(CreateAnnouncementModal)
