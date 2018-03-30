const sensitiveWords = "版主 管理 站长 超版 社区 元老 管理 网 公司 官方 版主 斑竹 吧主 霸主 文学 作家 文章 作品 昵称 名字 名称 人名 网站 百度 新浪 网易 搜狐 迅雷 狗狗 爱问 优酷 我乐 好123 头衔 关键字 关键词 统配符 网页 电脑 文档 浏览器 保留 主席 公司 总经理 投资商 股东 操 靠 日 黑社会 流氓 色 性爱 萌 尼玛 你妈 傻 网 攻击 黑 黄 迷药".split(' ')

export default {
  regex: {
    password: /^((?=.*[a-zA-Z])(?=.*[0-9])|(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])).{6,32}$/
  },

	// password: [{
	// 	rules: [{
	// 		required: true,
	// 		message: "请输入密码",
	// 	}],
	// 	trigger: ['onBlur'],
	// }, {
	// 	rules: [{
	// 		required: true,
	// 		pattern: /^((?=.*[a-zA-Z])(?=.*[0-9])|(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])).{6,32}$/,
	// 		message: "必须包含由字母、数字、特殊符号中的至少两种",
	// 	}],
	// 	trigger: ['onBlur'],
	// }, {
	// 	rules: [{
	// 		max: 32,
	// 		message: '密码长度不能超过32位',
	// 	}],
	// 	trigger: ['onBlur'],
	// }, {
	// 	rules: [{
	// 		min: 6,
	// 		message: '密码长度不能少于6位',
	// 	}],
	// 	trigger: ['onBlur'],
	// }],
	password: (checkPassword) => {
		return [{
			required: true,
			message: "请输入密码",
		}, {
			required: true,
			pattern: /^((?=.*[a-zA-Z])(?=.*[0-9])|(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])).{6,32}$/,
			message: "必须包含由字母、数字、特殊符号中的至少两种",
		}, {
			max: 32,
			message: '密码长度不能超过32位',
		}, {
			min: 6,
			message: '密码长度不能少于6位',
		}, {
			validator: checkPassword
		}]
	},

	username: [{
		rules: [{
			required: true,
			message: "请输入一个昵称",
		}],
		trigger: ['onBlur'],
	}, {
		rules: [{
			pattern: /^[a-zA-Z\u4e00-\u9eff]*$/i,
			message: "昵称中只允许使用汉字或字母",
		}],
		trigger: ['onBlur'],
	}, {
		rules: [{
			pattern: new RegExp(`^((?!(${sensitiveWords.join('|')})).)*$`, 'i'),
			message: "昵称中包含敏感词",
		}],
		trigger: ['onBlur'],
	}, {
		rules: [{
			max: 12,
			message: '用户名不能超过 12 个字符',
		}],
		trigger: ['onBlur'],
	}],

	phone: function(phoneAreaCode = "+86") {
		let phoneFormat = /^.*$/
		switch (phoneAreaCode) {
			case "+86":
				phoneFormat = /^1[3|4|5|7|8][0-9]{9}$/
				break
			default:
				break
		}

		return {
			validate: [{
				rules: [{
					pattern: phoneFormat,
					message: '请输入正确的手机号码',
				}, {
					required: true,
					message: '请输入手机号',
				}],
				trigger: ['onBlur'],
			}],
		}
	},

	verifyCode: {
		validate: [{
			rules: [{
				message: '请输入6位验证码',
				pattern: /^\d{6}$/i,
			}],
			trigger: ['onBlur'],
		}],
	},
}
