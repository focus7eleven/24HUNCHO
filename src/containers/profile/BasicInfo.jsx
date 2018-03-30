import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import { Form, Input, Button, Radio, Dropdown, message } from 'antd'
import { ArrowDropDown, CloseIcon } from 'svg'
import { fromJS, List } from 'immutable'
import { updateUser } from '../../actions/user'
import styles from './BasicInfo.scss'
import UserAvatarModal from './modal/UserAvatarModal'

const FormItem = Form.Item
const RadioGroup = Radio.Group

class BasicInfo extends React.Component {
  // handleNameChange = (e) => {
  //   const name = e.target.value
  //   this.updateUser({
  //     username: name
  //   })
  // }

  // handleRealNameChange = (e) => {
  //   const name = e.target.value;
  //   this.updateUser({
  //     realname: name,
  //   })
  // }

  handleGenderChange = (e) => {
    const gender = e.target.value
    this.updateUser({
      gender,
    })
  }

  handleAvatarChange = (url) => {
  	this.updateUser({
		  avatar: url
	  })
  }

  updateUser(userInfo) {
    return this.props.updateUser(userInfo, this.props.user.getIn(['auth','X-SIMU-UserId']))
	    .then(res => res.response)
	    .then((json) => {
		    if (json.code == 0) {
			    message.success('修改已保存', 0.5)
		    }
		    return json
	    })
  }

  render() {
    const {
			user,
			form: {
				getFieldDecorator,
				getFieldError,
			},
		} = this.props
    return (
      <div>
				<Form layout="horizontal" className={styles.container}>
					{/* 修改头像 */}
					<UserAvatarModal updateUserAvatar={this.handleAvatarChange}>
						<div className={styles.imageWrapper}>
							<img src={user.get('avatar')} alt="用户头像" />
							<div>修改头像</div>
						</div>
					</UserAvatarModal>
					<FormItem label="用户名">
						{user.get('realName')}
					</FormItem>
					<FormItem label="性别">
						{getFieldDecorator('gender', { initialValue: user.get('gender') })(
							<RadioGroup onChange={this.handleGenderChange}>
								<Radio value={1}>男</Radio>
								<Radio value={2}>女</Radio>
								<Radio value={0}>保密</Radio>
							</RadioGroup>
					)}
					</FormItem>
          <FormItem label="真实姓名">
						{/* {getFieldDecorator('realName', { initialValue: user.get('realName') })(
              <Input onChange={this.handleRealNameChange} />
					)} */}
            {user.get('realName')}
					</FormItem>
          <FormItem label="学号">
            {user.get('number')}
					</FormItem>
          <FormItem label="院系年级">
            {user.get('department')} {user.get('grade')} {user.get('degree')}
					</FormItem>
          <FormItem label="手机号码">
            {user.get('mobile')}
					</FormItem>
        </Form>
      </div>
    )
  }
}

const BasicInfoForm = Form.create()(BasicInfo)

function mapStateToProps(state) {
  return {
    user: state.get('user'),
  }
}
function mapDispatchToProps(dispatch) {
  return {
		// fetchUser: bindActionCreators(fetchUser, dispatch),
    updateUser: bindActionCreators(updateUser, dispatch),
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(BasicInfoForm))
