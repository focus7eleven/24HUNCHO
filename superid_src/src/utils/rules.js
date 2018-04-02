const sensitiveWords = "性爱 尼玛 你妈".split(' ')

export default {
  // password: [{
  //   rules: [{
  //     required: true,
  //     message: "请输入密码",
  //   }],
  //   trigger: ['onBlur'],
  // }, {
  //   rules: [{
  //     required: true,
  //     pattern: /^((?=.*[a-zA-Z])(?=.*[0-9])|(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[@#$%&\/=?_.,:;\\-])|(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[@#$%&\/=?_.,:;\\-])).{6,32}$/,
  //     message: "必须包含由字母、数字、特殊符号中的至少两种",
  //   }],
  //   trigger: ['onBlur'],
  // }, {
  //   rules: [{
  //     max: 32,
  //     message: '密码长度不能超过32位',
  //   }],
  //   trigger: ['onBlur'],
  // }, {
  //   rules: [{
  //     min: 6,
  //     message: '密码长度不能少于6位',
  //   }],
  //   trigger: ['onBlur'],
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
      max: 12,
      message: '用户名不能超过 12 个字符',
    }],
    trigger: ['onBlur'],
  }, {
    rules: [{
      pattern: /^[a-zA-Z\u4e00-\u9fa5]*$/i,
      message: "昵称中只允许使用汉字或字母",
    }],
    trigger: ['onBlur'],
  }, {
    rules: [{
      pattern: new RegExp(`^((?!(${sensitiveWords.join('|')})).)*$`, 'i'),
      message: "昵称中包含敏感词",
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
    rules: [{
      required: true,
      message: '请输入验证码',
    }, {
      pattern: /^[0-9]*$/,
      message: '请输入数字',
    }, {
      message: '请输入6位验证码',
      pattern: /^\d{6}$/i,
    }],
    trigger: ['onBlur', 'onChange'],
    validateFirst: true,
  },
}
