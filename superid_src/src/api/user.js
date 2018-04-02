import { authURL, affairURL } from './URLConfig'

const user = {
  post: `${authURL}/api/external/register`,
  get: `${authURL}/api/info`,
  avatar: (userId) => `${authURL}/api/avatar/${userId}`,
  password: {
    update: (oldPwd, newPwd) => `${authURL}/api/change-pwd?oldPwd=${oldPwd}&newPwd=${newPwd}`,
    check: (pwd) => `${authURL}/api/check-pwd?password=${pwd}`, //检查密码是否正确
  },
  baseinfo: {
    update: `${authURL}/api/modify-base`,
  },
  publicType: {
    update: `${authURL}/api/modify-public`,
  },
  superId: {
    check: (superId) => `${authURL}/api/verify-superid?superid=${superId}`,
    update: (superId) => `${authURL}/api/modify-superId?superId=${superId}`
  },
  tags: {
    update: `${authURL}/api/modify-tags`,
  },
  regist: {
    get: (token) => `${authURL}/api/external/register-code?token=${token}`,
  },
  authInfo: {
    get: `${authURL}/api/auth-info`,
    update: `${authURL}/api/modify-auth`,
  },
  reset: `${authURL}/api/external/forget-pwd`,
  updateMobileOrEmail: (account, code) => `${authURL}/api/change-mobile-or-email?account=${account}&verifyCode=${code}`,
  roleList: `${affairURL}/role/list`,
  roleInfo: `${affairURL}/role/get_role_info`,
}

export default user
