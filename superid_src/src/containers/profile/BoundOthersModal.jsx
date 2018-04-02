import React, { PropTypes } from 'react'
import styles from './BoundOthersModal.scss'
import { Modal, Button, Input, Form } from 'antd'

const Item = Form.Item
const MODAL_TYPE = {
  WECHAT: 'WECHAT',
  QQ: 'QQ',
  WEIBO: 'WEIBO',
}
const BoundOthersModal = React.createClass({
  PropTypes: {
    type: PropTypes.string,
  },
  getDefaultProps(){
    return {
      type: MODAL_TYPE.WEIBO,
    }
  },
  handleCancel(){
    this.props.callback()
  },
  renderWechat(){
    return (<div className={styles.container}>
      <div className={styles.title}>
        微信授权
      </div>
      <div className={styles.wechatContent}>
        <div className={styles.img} />
      </div>
      <div className={styles.footer}>
        <span>请使用微信扫描二维码授权绑定SuperID</span>
      </div>
    </div>)
  },
  renderQQ(){
    return (<div className={styles.container}>
      <div className={styles.title}>
        QQ授权
      </div>
      <div className={styles.QQContent}>
        <div className={styles.imgContainer}>
          <div className={styles.img} />
          <span>扫二维码</span>
        </div>
        <div className={styles.imgContainer}>
          <div className={styles.img} />
          <span>752342314</span>
        </div>
      </div>
      <div className={styles.footer}>
        <span>请使用QQ手机版扫描二维码或点击头像授权登录</span>
        <div className={styles.detail}>
          <span>授权后表明您已同意 QQ登录服务协议</span>
          <span className={styles.more}>详情</span>
        </div>
      </div>
    </div>)
  },
  renderWeibo(){
    const { getFieldDecorator } = this.props.form
    const passwordDecorator = getFieldDecorator('password', {
      rules: [
        {
          required: true,
          message: '请输入密码',
          trigger: 'onBlur',
        }
      ]
    })
    return (
      <div className={styles.container}>
        <div className={styles.title}>
            微博授权
        </div>
        <div className={styles.WeiboContent}>
          <div className={styles.imgContainer}>
            <div className={styles.img} />
            <span>扫二维码</span>
          </div>
          <div className={styles.accountLogin}>
            <Form layout="horizontal">
              <Item className={styles.row}>
                <span className={styles.label}>账号:</span>
                <Input style={{ width: 300 }}/>
              </Item>
              <Item className={styles.row}>
                <span className={styles.label}>密码:</span>
                {passwordDecorator(<Input style={{ width: 300 }} />)}
              </Item>
            </Form>
            <div className={styles.btn}>
              <Button type="ghost">取消</Button>
              <Button type="primary">登录</Button>
            </div>
          </div>
        </div>
        <div className={styles.footer}>
          <span>请使用微博手机版扫描二维码或通过账号密码授权登录</span>
          <div className={styles.detail}>
            <span>为保障账号安全 请认准本页URL地址必须以api.weibo.com开头</span>
          </div>
        </div>
      </div>
    )
  },
  render(){
    const { type } = this.props
    return (<Modal maskClosable={false}
      title={type == MODAL_TYPE.WECHAT ? '绑定微信' : type == MODAL_TYPE.QQ ? '绑定QQ' : '绑定微博'}
      width={type == MODAL_TYPE.WEIBO ? 710 : 500}
      wrapClassName={styles.boundOthersModal}
      footer={[]}
      onCancel={this.handleCancel}
      visible
            >
      {
        type == MODAL_TYPE.WECHAT ? this.renderWechat() : type == MODAL_TYPE.QQ ? this.renderQQ() : this.renderWeibo()
      }
    </Modal>)
  },
})

export default Form.create()(BoundOthersModal)