import React from 'react'
import styles from './PersonVerification.scss'
import moment from 'moment'
import { Input, Form, Button, Radio, message } from 'antd'
import { VerifyUploadIcon } from '../../public/svg'
import { updateAuthInfo } from '../../actions/user'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import oss from 'oss'

const FormItem = Form.Item
const RadioGroup = Radio.Group

const AUTH_STATUS = {
  NONE: 0, //未提交审核
  WAIT: 1, //审核中
  SUCCESS: 2, //审核成功
}

const VERI_TYPE = {
  ID_CARD: 0,
  PASSPORT: 1,
}

function noop() {
  return false
}
const PersonVerification = React.createClass({
  getInitialState(){
    return {
      credentialsType: this.props.authInfo.get('credentialsType'),
      credentialsPhotoUrl1: this.props.authInfo.get('credentialsPhotoUrl1'),
      credentialsPhotoUrl2: this.props.authInfo.get('credentialsPhotoUrl2'),
      credentialsPhotoUrl: this.props.authInfo.get('credentialsPhotoUrl1'), //passport
    }
  },

  handleSelectedFile(e){
    let file = e.target.files[0]
    let that = this

    let url = ''
    const id = e.target.getAttribute('id')
    oss.uploadVerifyFile(file, this.props.user.get('id')).then((res) => {
      url = `${res.host}/${res.path}`
      if (id == 'id0'){
        that.setState({
          credentialsPhotoUrl1: url
        })

      } else if ( id == 'passport') {
        that.setState({
          credentialsPhotoUrl: url
        })
      } else {
        that.setState({
          credentialsPhotoUrl2: url
        })

      }
    })




    // fileReader.readAsDataURL(file)
  },

  handleIdCardClick(e){
    const ele = e.target.getAttribute('id') == 'id0' ? this.front : this.verso
    ele.click()
  },

  handleSubmit(e){
    const { credentialsPhotoUrl1, credentialsPhotoUrl2, credentialsPhotoUrl } = this.state
    e.preventDefault()
    this.props.form.validateFields((err, value) => {
      // if (err){
      //   return
      // }
      let body = {
        credentialId: value.number,
        credentialsType: value.verification,
        realname: value.realName,
      }

      if (value.verification == VERI_TYPE.ID_CARD){
        if (credentialsPhotoUrl1 == ''){
          message.error('请上传证件照片！')
          return
        }
        if (credentialsPhotoUrl2 == ''){
          message.error('请上传证件照片！')
          return
        }

        body.credentialsPhotoUrl1 = credentialsPhotoUrl1
        body.credentialsPhotoUrl2 = credentialsPhotoUrl2


      } else {
        if (credentialsPhotoUrl == '') {
          message.error('请上传证件照片！')
          return
        }
        body.credentialsPhotoUrl1 = credentialsPhotoUrl
      }

      this.props.updateAuthInfo(body)
    })
  },

  getAuthStatus(status){
    switch (status){
      case AUTH_STATUS.NONE:
        return '未提交审核'
      case AUTH_STATUS.WAIT:
        return '正在审核'
      case AUTH_STATUS.SUCCESS:
        return '认证成功'
      default:
        return null
    }
  },

  getFormatTime(time){
    return moment(time).format('YYYY-MM-DD')
  },

  render(){
    const {
      getFieldValue,
      getFieldDecorator,
    } = this.props.form
    const { credentialsType, credentialsPhotoUrl1, credentialsPhotoUrl2, credentialsPhotoUrl } = this.state
    const { authInfo } = this.props

    const authStatus = authInfo.get('authStatus')
    const realname = authInfo.get('realname')
    const validTime = authInfo.get('validTime')
    const credentialsId = authInfo.get('credentialsId')


    let birthday = ''
    if (authStatus !== AUTH_STATUS.NONE && credentialsType === VERI_TYPE.ID_CARD){
      const year = credentialsId.slice(6, 10)
      const month = credentialsId.slice(10, 12)
      const day = credentialsId.slice(12, 14)
      birthday = year + '-' + month + '-' + day
    }


    const realNameDecorator = getFieldDecorator('realName', {
      initialValue: realname,
      rules: [{
        required: true,
        message: '请输入真实姓名！'
      }]
    })
    const verificationDecorator = getFieldDecorator('verification', { initialValue: credentialsType })
    const numberDecorator = getFieldDecorator('number', {
      rules: [{
        patterns: /(^\d{15}$)|(^\d{17}([0-9]|X)$)/,
        message: '请输入正确有效的身份证号码！'
      }, {
        required: true,
        message: '请输入身份证号码！'
      }]
    })

    const text = (
      <div className={styles.textWrapper}>
        上传文件格式支持png，jpg和bmp，大小不超过2MB<br/>
        照片需清晰且未遮挡，所有上传信息均会被SuperID妥善保管，不会用于其他商业用途或传输给第三方
      </div>
    )
    return (
      <div className={styles.container}>
        <Form layout="horizontal">

          <FormItem label="审核状态">
            <div className={styles.applyState}>{this.getAuthStatus(authStatus)}</div>
          </FormItem>

          <FormItem label="真实姓名">
            {
              authStatus === AUTH_STATUS.NONE ? realNameDecorator(
                <Input
                  type="text"
                  autoComplete="off"
                  onContextMenu={noop}
                  onPaste={noop}
                  onCopy={noop}
                  onCut={noop}
                />
              ) : <span>{realname}</span>
            }
          </FormItem>

          {authStatus !== AUTH_STATUS.SUCCESS ?
            <FormItem label="认证证件">
              {verificationDecorator(<RadioGroup>
                <Radio value={0}>身份证</Radio>
                <Radio value={1}>护照</Radio>
              </RadioGroup>)}
            </FormItem>
          :
            null
          }

          {authStatus !== AUTH_STATUS.NONE && credentialsType === VERI_TYPE.ID_CARD ?
            <FormItem label="出生日期">
              <span>{birthday}</span>
            </FormItem>
          :
            null
          }

          {getFieldValue('verification') == 0 ? [
            <FormItem label="身份证号" key={'0'}>
              {authStatus === AUTH_STATUS.NONE ? numberDecorator(
                <Input
                  type="text"
                  autoComplete="off"
                  onContextMenu={noop}
                  onPaste={noop}
                  onCopy={noop}
                  onCut={noop}
                />
              ) : <span>{credentialsId}</span>
              }
            </FormItem>
            ,
            authStatus !== AUTH_STATUS.SUCCESS ?
              <FormItem label="证件照片" key={'1'}>
                <div className={styles.firstPhotographArea}>
                  <div className={styles.photoGroup}>
                    <input type="file" ref={(el) => this.front = el} id="id0" style={{ display: 'none' }} size={2000000}
                      accept="image/jpg, image/jpeg, image/png" onChange={this.handleSelectedFile}
                    />
                    {credentialsPhotoUrl1 == '' ?
                      <div className={styles.defaultImg} onClick={() => this.front.click()}>
                        <div className={styles.iconWrapper}>
                          <VerifyUploadIcon/>
                          <div>证件正面</div>
                        </div>
                      </div>
                    : (
                      <img src={credentialsPhotoUrl1} alt="身份证正面" className={styles.uploadImg} onClick={() => this.front.click()}/>
                    )}

                    <input type="file" ref={(el) => this.verso = el} id="id1" style={{ display: 'none' }} size={2000000}
                      accept="image/jpg, image/jpeg, image/png" onChange={this.handleSelectedFile}
                    />
                    {credentialsPhotoUrl2 == '' ?
                      <div className={styles.defaultImg} onClick={() => this.verso.click()}>
                        <div className={styles.iconWrapper}>
                          <VerifyUploadIcon/>
                          <div>证件背面</div>
                        </div>
                      </div>
                    : (
                      <img src={credentialsPhotoUrl2} alt="身份证正面" className={styles.uploadImg} onClick={() => this.verso.click()}/>
                    )}
                  </div>
                  {authStatus !== AUTH_STATUS.SUCCESS ? text : null }
                </div>
              </FormItem>
            : (
              <FormItem label="有效期" key={'2'}>
                <span>{this.getFormatTime(validTime)}</span>
              </FormItem>
            )] : [(
              <FormItem label="护照号码" key={'0'}>
                {authStatus === AUTH_STATUS.NONE ? numberDecorator(
                  <Input
                    type="text"
                    autoComplete="off"
                    onContextMenu={noop}
                    onPaste={noop}
                    onCopy={noop}
                    onCut={noop}
                  />
                ) : <span>{credentialsId}</span>
                }
              </FormItem>
            ), (authStatus !== AUTH_STATUS.SUCCESS) ? (
              <FormItem label="证件照片" key={'1'}>
                <div className={styles.secondPhotographArea}>
                  <div className={styles.photoGroup}>
                    <input type="file" ref={(el) => this.passport = el} size={2000000} id="passport" style={{ display: 'none' }} accept="image/gif, image/jpg, image/jpeg, image/png" onChange={this.handleSelectedFile} onClick={(e) => e.target.value = null}/>
                    {credentialsPhotoUrl == '' ?
                      <div className={styles.defaultImg} onClick={() => this.passport.click()}>
                        <div className={styles.iconWrapper}>
                          <VerifyUploadIcon/>
                          <div>证件信息页</div>

                        </div>
                      </div>
                    : (
                      <img src={credentialsPhotoUrl} alt="证件信息页" className={styles.uploadImg} onClick={() => this.passport.click()}/>
                    )}

                  </div>
                  {authStatus !== AUTH_STATUS.SUCCESS ? text : null }
                </div>
              </FormItem>
            ) : (
              <FormItem label="有效期" key={'2'}>
                <span>{this.getFormatTime(validTime)}</span>
              </FormItem>
            )]
          }
          {authStatus === AUTH_STATUS.NONE ?
            <Button type="primary" size="large" onClick={this.handleSubmit}>提交</Button>
          :
            null
          }
        </Form>
      </div>
    )
  }
})

function mapStateToProps(state){
  return {
    authInfo: state.getIn(['user', 'authInfo']),
    user: state.get('user')
  }
}

function mapDispatchToProps(dispatch){
  return {
    updateAuthInfo: bindActionCreators(updateAuthInfo, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(PersonVerification))
