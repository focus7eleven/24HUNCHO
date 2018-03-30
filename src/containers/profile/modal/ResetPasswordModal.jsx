import React from 'react'
import styles from './ResetPasswordModal.scss'
import ResetPasswordForm from './ResetPasswordForm'
import { Modal, Tabs } from 'antd'
import { IphoneIcon, ShareMail } from 'svg'

const TabPane = Tabs.TabPane

export const RESET_TYPE = {
	PHONE: 0,
	EMAIL: 1,
}

class ResetPasswordModal extends React.Component {
	componentWillReceiveProps(nextProps) {
		if (nextProps.visible) {
			// this.resetByPhoneForm && this.resetByPhoneForm.resetFields()
			// this.resetByEmailForm && this.resetByEmailForm.resetFields()
		}
	}

	handleCancel = () => {
		this.props.callback()
	}

	render(){
		const { user, visible } = this.props
		const mobile = user.get('mobile')
		const email = user.get('email')
		const hasMobile = mobile != null && mobile != ''
		const hasEmail = email != null && email != ''
		const defaultActiveKey = hasMobile ? 'phone' : 'email'

		return (
			<Modal maskClosable={false} title="重置密码" wrapClassName={styles.resetPasswordModal} width={500} visible={visible} footer={[]} onCancel={this.handleCancel}>
				<div className={styles.container}>
					<Tabs defaultActiveKey={defaultActiveKey}>
						<TabPane
							disabled={!hasMobile}
							tab={<div className={styles.title}><IphoneIcon height="16"/><span>手机验证</span></div>}
							key="phone"
						>
							<ResetPasswordForm handleCancel={this.handleCancel} resetType={RESET_TYPE.PHONE} user={user} />
						</TabPane>
						<TabPane
							disabled={!hasEmail}
							tab={<div className={styles.title}><ShareMail height="16"/><span>邮箱验证</span></div>}
							key="email"
						>
							<ResetPasswordForm handleCancel={this.handleCancel} resetType={RESET_TYPE.EMAIL} user={user} />
						</TabPane>
					</Tabs>
				</div>
			</Modal>
		)
	}
}

export default ResetPasswordModal
