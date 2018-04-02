import _ from 'underscore'
import {
  baseURL,
  authURL,
  affairURL,
  videoURL,
  gwURL
} from './api/URLConfig'
import {
  userAPI,
  fileAPI,
  allianceAPI,
  affairAPI,
  personnelAPI,
  announcementAPI,
  noticeAPI,
  messageAPI,
  taskAPI,
  fundAPI,
  orderAPI,
  materialAPI,
  permissionAPI,
  auditAPI,
  chatAPI,
  boardAPI,
} from './api'

// App config the for development and deployment environment.
const isProduction = process.env.NODE_ENV === 'production' // eslint-disable-line

const config = _.extend({
  // common config
  debug: !isProduction,
  LEAN_CLOUD_APP_ID: 'AwntELOaCsjkh8gThrediC4g-gzGzoHsz',
  baseURL,
  videoURL,
  gwURL,
  licodeServerUrl: 'https://www.menkor.cn:666',
}, {
  // dev config
  api: {
    ping: `${authURL}/api/external/ping`,
    login: {
      normal: `${authURL}/api/external/login`,
      test: `${authURL}/api/external/login`,
      verify: `${authURL}/api/external/check-verify-code`,
    },
    qrLoginScan: `${authURL}/api/external/scan-confirm`,
    qrLoginConfirm: `${authURL}/api/external/login-confirm`,
    logout: `${baseURL}/user/logout`,
    verifyCode: {
      get: (token) => `${baseURL}/user/verify_code?token=${token}`, // unused
      changeToken: (token) => `${authURL}/api/token-change-code?token=${token}`,
      resetPassword: {
        get: (token) => `${authURL}/api/external/reset-code?token=${token}`,
      },
      verfiyAccount: {
        post: (token, verifyCode) => `${baseURL}/user/check_token?token=${token}&verifyCode=${verifyCode}`, // TODO
      },
      login: (token) => `${authURL}/api/external/login-code?token=${token}`,
      // 登录图片验证码
      picCode: {
        get: (token) => `${authURL}/api/external/validate-code?token=${token}`,
      },
    },
    share: {
      affair: {
        post: (periodOfValidity) => `${affairURL}/share/affair?effectiveHour=${periodOfValidity}`,
        get: (shareId) => `${affairURL}/share/analysis?shortLink=${shareId}`,
        mail: {
          post: `${affairURL}/share/email`
        },
      },
      visitor: () => `${affairURL}/share/affair/info`,
    },
    constant: {
      responseCode: {
        get: `${baseURL}/constant/response_code_list`,
      },
    },
    fund: fundAPI,
    order: orderAPI,
    material: materialAPI,
    permission: permissionAPI,
    audit: auditAPI,
    user: userAPI,
    file: fileAPI,
    alliance: allianceAPI,
    affair: affairAPI,
    personnel: personnelAPI,
    announcement: announcementAPI,
    notice: noticeAPI,
    message: messageAPI,
    task: taskAPI,
    chat: chatAPI,
    board: boardAPI,
  },
})
export default config
