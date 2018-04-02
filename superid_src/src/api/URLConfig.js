let getHost = function() {
  let IP = 'api.superid.org'
  if (window.SERVER_TAG == '100') { // eslint-disable-line
    IP = 'api.superid.cn'
  }
  if (window.SERVER_TAG == '200') { // eslint-disable-line
    IP = 'api.menkor.cn'
  }
  if (window.SERVER_TAG == '204') { // eslint-disable-line
    IP = 'api.superid.org'
  }

  if (localStorage && localStorage.getItem('ip')) {
    return localStorage.getItem('ip')
  }

  return IP
}

let getPort = function() {
  let PORT = '1443'
  if (localStorage) {
    const storePORT = localStorage.getItem('port')
    PORT = storePORT ? storePORT : PORT
  }
  return PORT
}

let ADDRESS = function() {
  let IP = getHost()

  return `https://${IP}:${getPort()}`
}()

window.toTestEnv = () => {
  localStorage.setItem('ip', 'api.superid.cn')
  location.reload()
}
window.toIntegrationEnv = () => {
  localStorage.setItem('ip', 'api.superid.org')
  location.reload()
}
window.toLabel = (label = '') => {
  localStorage.setItem('ip', 'api.superid.org')
  localStorage.setItem('headers', `{"X-label":"${label}"}`)
  location.reload()
}


let baseURL = ADDRESS + '/web'
let affairURL = ADDRESS + '/affair'
let connectURL = ADDRESS + '/notice'
let messageURL = ADDRESS + '/msg'
let auditURL = ADDRESS + '/audit'
let authorityURL = ADDRESS + '/permission'
let authURL = ADDRESS + '/user'
let gwURL = ADDRESS + '/login'
let videoURL = ADDRESS + '/video'
let fileURL = ADDRESS + '/file/api'
let chatURL = ADDRESS + '/chat/api'
let materialURL = ADDRESS + '/material'

baseURL = localStorage && localStorage.getItem('apiServer') ? localStorage.getItem('apiServer') : baseURL
connectURL = localStorage && localStorage.getItem('connectServer') ? localStorage.getItem('connectServer') : connectURL
messageURL = localStorage && localStorage.getItem('messageServer') ? localStorage.getItem('messageServer') : messageURL
auditURL = localStorage && localStorage.getItem('auditServer') ? localStorage.getItem('auditServer') : auditURL
authorityURL = localStorage && localStorage.getItem('authServer') ? localStorage.getItem('authServer') : authorityURL

export {
  getHost,
  getPort,
  ADDRESS,
  baseURL,
  affairURL,
  connectURL,
  messageURL,
  auditURL,
  authorityURL,
  videoURL,
  authURL,
  gwURL,
  fileURL,
  chatURL,
  materialURL,
}
