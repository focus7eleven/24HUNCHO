import _ from 'lodash'

const servers = ['100', '200', '204']
const ips = ['api.superid.cn', 'api.menkor.cn', 'api.superid.org']

const buildEnv = '' + process.env.BUILD_ENV
const localEnv = '' + (localStorage.getItem('env') || '204')
const whereami = buildEnv ? servers.indexOf(buildEnv) : servers.indexOf(localEnv)

export const getHost = () => ips[whereami]

export const getPort = () => '1443'

const ADDRESS = function() {
  const PROTOCOL = 'https://'
  const IP = getHost()
  const PORT = ':' + getPort()
  return PROTOCOL + IP + PORT
}()

let baseURL = ADDRESS + '/web'
let connectURL = ADDRESS + '/notice'
let messageURL = ADDRESS + '/msg'
let auditURL = ADDRESS + '/audit'
auditURL = baseURL // roll back 'cause audit 3.0 still broke
let authorityURL = ADDRESS + '/permission'
let authURL = ADDRESS + '/user'
let gwURL = ADDRESS + '/login'
let fileURL = ADDRESS + '/file/api'
let chatURL = ADDRESS + '/chat/api'
let affairURL = ADDRESS + '/affair'
let tssURL = ADDRESS + '/tss'

baseURL = localStorage && localStorage.getItem('apiServer') ? localStorage.getItem('apiServer') : baseURL
connectURL = localStorage && localStorage.getItem('connectServer') ? localStorage.getItem('connectServer') : connectURL
messageURL = localStorage && localStorage.getItem('messageServer') ? localStorage.getItem('messageServer') : messageURL
auditURL = localStorage && localStorage.getItem('auditServer') ? localStorage.getItem('auditServer') : auditURL
authorityURL = localStorage && localStorage.getItem('authServer') ? localStorage.getItem('authServer') : authorityURL

export default {
  debug: process.env.NODE_ENV === 'development',
  baseURL,
  authURL,
  gwURL,
  fileURL,
  chatURL,
  tssURL,
  connectURL,
  messageURL,
  affairURL,
  LEAN_CLOUD_APP_ID: 'AwntELOaCsjkh8gThrediC4g-gzGzoHsz',
}
