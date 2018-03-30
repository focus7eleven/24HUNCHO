import 'whatwg-fetch'
import { store } from '../index'
import { logout } from '../actions/user'
import { Message } from 'antd'

const thatFetch = window.fetch


let reloading = false
// 当服务器返回未登录时，进行相应的逻辑处理.
window.fetch = function(url, opt) {
	// console.log(url, opt);

  let localStorageHeaders = {}
  try {
    localStorageHeaders = JSON.parse(localStorage.getItem('headers'))
  } catch(e) {
    localStorageHeaders = {}
  }

  opt.headers = {
    ...(opt.headers || {}),
    ...localStorageHeaders,
  }

	// 添加 jwt 请求头部
	let jwt

	try { jwt = JSON.parse(localStorage.getItem('auth')) } catch (e) {}

    // console.log(jwt);

	if (jwt) {

		opt.headers = {
			...(opt.headers || {}),
			'Authorization': `bearer${jwt.access_token}`,
			'X-SIMU-UserId': opt.userId || 0,
      'X-SIMU-RoleId': opt.roleId || 0,
			'X-SIMU-AffairId': opt.affairId || 0,
		}
	}

	return thatFetch.apply(this, [url, opt]).then((res) => {
		res.clone().json().then(res => {
			if (res && (res.code === 401 || res.status === 401)) {
				// 为了避免循环 reload, 忽略专门进行登录检测的请求进行忽略。
				if (!~url.indexOf('ping') && !~url.indexOf('logout') && reloading == false) {
					reloading = true
					setTimeout(() => {
						logout()(store.dispatch)
						Message.error('登录已过期，请重新登录')
						reloading = false
					}, 2000)
				}
			}
		})
		// .catch((err) => {
		// 	console.log(err);
		// })
		return res
	})
}

/* save for fetch-mock */
window.originalFetch = thatFetch
