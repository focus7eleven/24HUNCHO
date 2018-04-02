import React from 'react'
import styles from './FirmVerificationContainer.scss'
import { Form, Icon, Input, Button, Select, DatePicker } from 'antd'
import PERMISSION from 'utils/permission'
const FormItem = Form.Item

const FirmVerificationContainer = React.createClass({
  render(){
    const { affair } = this.props
    return (
      <div className={styles.container}>
        <div className={styles.row}>
          <Form layout="horizontal">
            <FormItem label="企业名称">
              <Input />
            </FormItem>
            <FormItem label="企业经营地址">
              <Input type="textarea"/>
            </FormItem>
            <FormItem label="法人姓名">
              <Input />
            </FormItem>
            <FormItem label="公司类型">
              <Select />
            </FormItem>
            <FormItem label="经营范围">
              <Input />
            </FormItem>
            <FormItem label="注册资本">
              <Input addonAfter="万元"/>
            </FormItem>
            <FormItem label="成立日期">
              <DatePicker />
            </FormItem>
          </Form>
          <div className={styles.licenseWrapper}>
            <div className={styles.title}>企业法人营业执照：</div>
            <div className={styles.description}>图片需为完整清晰的正面图</div>
            <div className={styles.license}>
              {affair.validatePermissions(PERMISSION.APPLY_ALLIANCE_AUTH) && [
                <Icon key="icon" type="upload" />,
                <p key="pho">上传照片</p>
              ]}
            </div>
          </div>
        </div>
        {affair.validatePermissions(PERMISSION.APPLY_ALLIANCE_AUTH) &&
          <div className={styles.buttonWrapper}>
            <Button size="large" type="primary">确定</Button>
          </div>
        }
      </div>
    )
  }
})

export default FirmVerificationContainer
