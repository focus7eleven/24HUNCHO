import React from 'react'
import { Modal, Form, Input, message } from 'antd'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import config from '../../../config'
import styles from './SuperIDChangeModal.scss'
import { updateSuperID } from '../../../actions/user'

const FormItem = Form.Item

const SuperIDChangeModal = React.createClass({


	checkSuperID(rule, value, callback){
		fetch(config.api.user.superId.check(value), {
			method: 'GET'
		}).then((res) => res.json()).then((res) => {
			if (res.code===0){
				callback()
			} else if (res.code===-1){
				callback('该superID已被占用，请重新输入！')
			}


		})
	},

	onOk(){
		this.props.form.validateFields((err, value) => {
			if (err){
				return
			}
			this.props.updateSuperID(value.code).then((res) => {
				if (res.code===0){
					message.success('申请成功，请耐心等待')
					this.props.cancelCallback()
				}

			})

		})
	},

	render(){
		const { superId, cancelCallback } = this.props
		const { getFieldDecorator } = this.props.form


		return (
			<Modal
				title="申请superID"
				visible
				wrapClassName={styles.modal}
				onOk={this.onOk}
				onCancel={cancelCallback}
			>
				<Form horizontal>
					<FormItem label="现有ID">
						<p>{superId}</p>
					</FormItem>
					<FormItem label="新ID" hasFeedback>
						{getFieldDecorator('code', {
							rules: [
                { required: true, message: 'superID需要为3-18位字母与数字组合' },
                { pattern: /^[a-zA-Z0-9]{3,18}$/, message: 'superID需要为3-18位字母与数字组合' },
                { validator: this.checkSuperID },
							],
						}) (
							<Input placeholder="3-18个英文字母与数字组合" />
              )}

					</FormItem>
					<FormItem label="变更理由" >
						{getFieldDecorator('reason')( <Input placeholder="请输入变更的原因" type="textarea"/>)}
					</FormItem>
				</Form>

			</Modal>
		)
	}
})

function mapStateToProps(state){
	return {
		user: state.get('user')
	}
}

function mapDispatchToProps(dispatch){
	return {
		updateSuperID: bindActionCreators(updateSuperID, dispatch)
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(Form.create()(SuperIDChangeModal))