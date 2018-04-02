const urlFormat = (url, params) => {
  if (params) {
    let paramsArray = []
    Object.keys(params).forEach((key) => paramsArray.push(key + '=' + params[key]))
    if (url.search(/\?/) === -1) {
      url += '?' + paramsArray.join('&')
    } else {
      url += '&' + paramsArray.join('&')
    }
  }
  return url
}

export default urlFormat