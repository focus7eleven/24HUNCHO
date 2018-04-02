import {
  List,
  fromJS
} from 'immutable'
import config from '../config'
import {
  message
} from 'antd'

message.config({
  top: window.innerHeight - 64,
  duration: 1,
})

let CODE = List()

fetch(config.api.constant.responseCode.get, {
  method: 'GET',
  credentials: 'include',
  json: true,
}).then((res) => res.json()).then((json) => {
  if (json.code === 0) {
    CODE = fromJS(json.data)
  }
})

const messageHandler = function(res) {
  const {
    code
  } = res
  if (!!code) {
    const error = CODE.find(v => v.get('value') === code.toString())
    /* 当前code == 10000 的情况需要弹出绿色框，之后如果有新的情况，需要让后端重新整合一下 */
    if (code == 20000 && error) {
      message.info(error.get('description'), 0.8)
    } else if (error) {
      message.error(error.get('description'), 0.8)
    } else {
      message.error(`未知错误(code=${code})`)
    }
  }

  return res
}

export default messageHandler
