import 'whatwg-fetch'
import _ from 'underscore'
import {
  store
} from '../client'
import {
  logout
} from '../actions/user'
import {
  Message
} from 'antd'
import config from '../config'

const thatFetch = window.fetch
/* a, b: Request.Option */
const authEqual = ((a, b) => {
  a = a || {}
  b = b || {}
  return a.roleId == b.roleId && a.affairId == b.affairId && a.resourceId == b.resourceId
})

class RequestDebounceMap {
  constructor() {
    this.map = {}
  }

  addRequest(url, option) {
    if (this.map[url]) {
      this.map[url].push({
        method: option.method,
        body: option.body,
        option,
      })
    } else {
      this.map[url] = [{
        method: option.method,
        body: option.body,
        option,
      }]
    }
  }

  resolveRequest(url, option) {
    if (this.map[url]) {
      this.map[url] = this.map[url].filter(v =>
        _.isEqual(v.method, option.method)
        && !_.isEqual(v.body, option.body)
        && authEqual(v.option, option)
      )
    }
  }

  hasRequest(url, option) {
    console.log(this.map[url])
    if (this.map[url]) {
      return !!this.map[url].find(v =>
        _.isEqual(v.method, option.method)
        && _.isEqual(v.body, option.body)
        && authEqual(v.option, option)
      )
    } else {
      return false
    }
  }
}


let reloading = false
const requestDebounceMap = new RequestDebounceMap()
window.requestDebounceMap = requestDebounceMap
let LOGOUT_DOOR_TIMESTAMP
// 当服务器返回未登录时，进行相应的逻辑处理.
window.fetch = function(url, opt) {
  const _startTimestamp = Date.now()

  // 添加来自 localStorage 中的的请求头
  let localStorageHeaders = {}
  try {
    localStorageHeaders = JSON.parse(localStorage.getItem('headers'))
  } catch (e) {
    localStorageHeaders = {}
  }

  opt.headers = {
    ...(opt.headers || {}),
    ...localStorageHeaders,
  }

  // 添加 jwt 请求头部
  let jwt
  try {
    jwt = JSON.parse(localStorage.getItem('auth'))
  } catch (e) {}

  if (jwt) {
    opt.headers = {
      'Authorization': `bearer${jwt.access_token}`,
      'X-SIMU-RoleId': opt.roleId || 0,
      'X-SIMU-AffairId': opt.affairId || 0,
      'X-SIMU-ResourceId': opt.resourceId || 0,
      ...(opt.headers || {}),
    }
  }

  // 避免频繁发送完全相同的请求.
  if (requestDebounceMap.hasRequest(url, opt)) {
    console.warn(`频繁请求: ${url}`)
    return new Promise(() => {})
  } else {
    requestDebounceMap.addRequest(url, opt)

    return thatFetch
      .apply(this, [url, opt])
      .then((res) => {
        setTimeout(() => requestDebounceMap.resolveRequest(url, opt), 500)

        res.clone()
          .json()
          .then(res => {
            if (res && (res.code === 401 || res.status === 401)) {
              // 为了避免循环 reload, 忽略专门进行登录检测的请求进行忽略。
              if (!~url.indexOf('ping') && !~url.indexOf('logout') && !~url.indexOf('check_token') && reloading == false && (!LOGOUT_DOOR_TIMESTAMP || _startTimestamp > LOGOUT_DOOR_TIMESTAMP)) {
                reloading = true
                setTimeout(() => {
                  LOGOUT_DOOR_TIMESTAMP = Date.now()
                  logout()(store.dispatch)
                  Message.error('登录已过期，请重新登录')
                  reloading = false
                }, 2000)
              }
            }
          })
        return res
      }, (err) => {
        Message.error('网络连接不通畅，请稍后再试')
      })
  }
}

/* save for fetch-mock */
window.originalFetch = window.fetch
