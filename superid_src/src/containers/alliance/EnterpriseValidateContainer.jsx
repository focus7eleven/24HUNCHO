import React from 'react'
import { Modal, Icon, Select, Input, Button, Form, DatePicker, notification } from 'antd'
import styles from './EnterpriseValidateContainer.scss'
import config from '../../config'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import moment from 'moment'
import { ContentPanelHOC } from '../../enhancers/Content'
import District from '../../components/address/District'
import { verificationSubmitted } from '../../actions/alliance'
import { pushURL } from 'actions/route'
import oss from 'oss'

const FormItem = Form.Item
const Option = Select.Option

const Logo = () => <div className={styles.logo}>simu</div>

const Nav = () =>
  <div className={styles.nav}>盟真实信息认证</div>

const ValidateResult = connect(null, (dispatch) => ({ pushURL: bindActionCreators(pushURL, dispatch) }))(React.createClass({
  handleReturn(){
    this.props.pushURL('/workspace')
  },

  render(){
    return (
      <div className={styles.resultContainer}>
        <div><Icon type="check-circle-o" />提交成功！</div>
        <div>您的认证信息已成功提交！我们将尽快为您审核。</div>
        <div>审核结果将通过系统消息通知您。</div>
        <Button size="large" type="ghost" onClick={this.handleReturn} >返回主页</Button>
      </div>
    )
  }
}))

export const ValidateResultComponent = React.createClass({
  getInitialState() {
    return {
      ComponentToRender: null,
    }
  },

  componentWillMount(){
    const ComponentToRender = ContentPanelHOC(Logo, Nav, ValidateResult, 'evr')
    this.setState({ ComponentToRender })
  },

  render(){
    const { ComponentToRender } = this.state
    return (
      <ComponentToRender />
    )
  }
})

let EnterpriseValidateForm = React.createClass({

  getInitialState() {
    return {
      imageURL: '',
      imageModal: false,
      imageStatus: true,
      isSubmitting: false,
    }
  },

  handleImageUpload(e){
    const files = e.target.files
    const file = files[0]
    const regx = /^image(\/jpeg|\/jpg|\/png)$/

    if (!regx.test(file.type)){
      notification['warning']({
        message: '无法上传该类型的图片',
        description: '目前支持的图片格式有：jpg，jpeg，png',
      })
      return
    }

    if (file.size > 20 * 1024 * 1024){
      notification['warning']({
        message: '图片大小超过限制，请压缩后上传',
        description: '单个图片大小不超过20M',
      })
      return
    }
    oss.uploadAffairCover(this.props.affair, file, config.api.file.token.affairCover(), file.fileName).then((url) => {
      this.setState({ imageUrl: url, imageStatus: true })
    })
  },

  handleSubmit(){
    this.props.form.validateFieldsAndScroll((errors) => {
      if (errors) {
        return
      } else if (this.state.imageURL === ''){
        this.setState({ imageStatus: false })
        return
      } else {
        this.setState({ isSubmitting: true })
        let userInput = this.props.form.getFieldsValue()
        fetch(config.api.alliance.validation.post(this.props.newAlliance.get('ownerRoleId')), {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            companyName: userInput.epName,
            companyAddress: userInput.epAddress,
            licenseImagePath: this.state.imageURL,
            corporationName: userInput.epLegalPerson,
            companyType: userInput.epType,
            businessScope: userInput.epBusinessScope,
            registerMoney: userInput.epRegistAsset,
            setUpDate: moment(userInput.epFoundation).format('x'),
          }),
        }).then((res) => {
          return res.json()
        }).then((json) => {
          this.setState({ isSubmitting: false })
          if (json.code === 0){
            const newAllianceId = this.props.newAlliance.get('id')
            this.props.updateAlliance(newAllianceId)
            this.props.pushURL(`/workspace/alliance/${newAllianceId}/validateresult`)
          }
          // this.props.form.resetFields();
        })
        // setTimeout(()=>{
        //   this.setState({isSubmitting:false},()=>{browserHistory.push('/workspace/validateresult')});
        // },1000)
      }
    })
  },

  render() {
    const {
      form: {
        getFieldDecorator,
      }
    } = this.props

    const formItemLayout = {
      labelCol: { span: 7 },
      wrapperCol: { span: 17 },
    }

    const epTypes = [
      <Option key="私营">私营</Option>,
      <Option key="国有">国有</Option>,
      <Option key="机体">机体</Option>,
      <Option key="股份合作">股份合作</Option>,
      <Option key="联营">联营</Option>,
      <Option key="股份有限">股份有限</Option>,
      <Option key="其它内资">其它内资</Option>,
      <Option key="合资经营">合资经营</Option>,
      <Option key="合作经营">合作经营</Option>,
      <Option key="港澳台商独资经营">港澳台商独资经营</Option>,
      <Option key="港澳台商投资股份有限公司">港澳台商投资股份有限公司</Option>,
      <Option key="港澳台商投资">港澳台商投资</Option>,
      <Option key="中外合资经营">中外合资经营</Option>,
      <Option key="中外合作经营">中外合作经营</Option>,
      <Option key="外资">外资</Option>,
      <Option key="外商投资股份">外商投资股份</Option>,
    ]

    return (
      <div className={styles.container}>
        <Form className={styles.form} horizontal>
          <FormItem
            wrapperCol={{ span: 24 }}
          >
            <div style={{ fontSize: '14px', color: '#2c9300' }}>企业真实信息经过认证后，可以解除受限功能</div>
          </FormItem>
          <FormItem
            labelCol={{ span: 11 }}
            wrapperCol={{ span: 12, offset: 1 }}
            label={<div><span>企业法人营业执照正本 :</span><span style={this.state.imageStatus ? { color: '#cccccc' } : { color: '#ff3300' }}>* 图片需为完整清晰的正面图</span></div>}
            className={styles.imageZone}
          >
            {
              this.state.imageURL === '' ?
                <div className={styles.photoAddStyle}>
                  <input className={styles.invisibleInput} type="file" onChange={this.handleImageUpload}/>
                  <div>图片上传</div>
                </div>
                :
                <div className={styles.uploadAgain}>
                  <div className={styles.imageContainer}>
                    <div className={styles.image} onClick={() => {this.setState({ imageModal: true })}}>
                      <img src={this.state.imageURL} />
                    </div>
                  </div>
                  <div className={styles.reload}>
                    <input className={styles.invisibleInput} type="file" onChange={this.handleImageUpload}/>
                    <span><Icon type="reload" />重新上传</span>
                  </div>
                  <Modal
                    title="企业法人营业执照正本"
                    style={{ textAlign: 'center' }}
                    width={1600}
                    visible={this.state.imageModal}
                    footer={null}
                    onCancel={() => {this.setState({ imageModal: false })}}
                  >
                    <img src={this.state.imageURL} style={{ maxWidth: '1550px' }}/>
                  </Modal>
                </div>
            }
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="企业名称"
          >
            {getFieldDecorator(
              'epName',
                            { rules: [{ required: true, max: 32, whitespace: true, message: '请填写您的企业名称，最多32个字符' }] }
                        )(<Input size="large" placeholder="请输入您的企业名称" />)}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="成立日期"
          >
            {getFieldDecorator(
              'epFoundation',
                            { rules: [{ required: true, type: 'object', message: '请选择企业成立日期' }] }
                        )(<DatePicker style={{ width: '100%' }} size="large" />)}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="企业经营地址"
          >
            {getFieldDecorator(
              'epAddress',
                            { rules: [{ required: true, whitespace: true, message: '请填写企业的经营地址' }] }
                        )(<District width="300px" innerRef="address" />)}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="企业类型"
          >
            {getFieldDecorator(
              'epType',
                            { rules: [{ required: true, whitespace: true, message: '请选择您的企业类型' }] }
                        )(<Select size="large">{epTypes}</Select>)}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="法人姓名"
          >
            {getFieldDecorator(
              'epLegalPerson',
                            { rules: [{ required: true, max: 12, whitespace: true, message: '请输入企业的法人姓名，最多12个字符' }] }
                        )(<Input size="large" placeholder="请输入企业的法人姓名" />)}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="注册资本"
          >
            {getFieldDecorator(
              'epRegistAsset',
                            { rules: [{ required: true, whitespace: true, message: '请输入企业的注册资本' }] }
                        )(<Input type="number" size="large" addonAfter="万元" />)}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="经营范围"
          >
            {getFieldDecorator(
              'epBusinessScope',
                            { rules: [{ required: true, max: 255, whitespace: true, message: '请输入企业的经营范围，最多255个字符' }] }
                        )(<Input rows={4} type="textarea" />)}
          </FormItem>
          <FormItem >
            <Button className={styles.submitButton} size="large" type="primary" onClick={this.handleSubmit} loading={this.state.isSubmitting}>确定</Button>
          </FormItem>
        </Form>
        <div className={styles.temp} />
      </div>
    )
  }
})

EnterpriseValidateForm = Form.create()(EnterpriseValidateForm)
EnterpriseValidateForm = connect(null, (dispatch) => ({ pushURL: bindActionCreators(pushURL, dispatch) }))(EnterpriseValidateForm)

const EnterpriseValidateComponent = React.createClass({
  getInitialState() {
    return {
      ComponentToRender: null,
      newAlliance: null,
    }
  },

  componentWillMount(){
    const ComponentToRender = ContentPanelHOC(Logo, Nav, EnterpriseValidateForm, 'ev')
    // 盟id是一个Number
    const newAlliance = this.props.allianceMap.get(parseInt(this.props.routeParams.id))
    this.setState({ ComponentToRender, newAlliance })
  },
  componentWillReceiveProps(nextProps){
    const ComponentToRender = ContentPanelHOC(Logo, Nav, EnterpriseValidateForm, 'ev')
    // 盟id是一个Number
    const newAlliance = nextProps.allianceMap.get(parseInt(nextProps.routeParams.id))
    this.setState({ ComponentToRender, newAlliance })
  },

  render(){
    const { ComponentToRender, newAlliance } = this.state
    return (
      <ComponentToRender newAlliance={newAlliance} updateAlliance={this.props.verificationSubmitted} />
    )
  }
})

function mapStateToProps(state) {
  return {
    allianceMap: state.getIn(['alliance', 'allianceMap']),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    verificationSubmitted: bindActionCreators(verificationSubmitted, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(EnterpriseValidateComponent))
