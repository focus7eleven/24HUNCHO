import config from '../config'

const { gwURL } = config

export function createJWT(account, password, verifyCode) {
  const formData = new FormData()
  formData.append('username', account)
  formData.append('password', password)
  formData.append('client', 'frontend')
  if (verifyCode) {
    formData.append('verifyCode', verifyCode)
  }

  return window.originalFetch(`${gwURL}/oauth/token?grant_type=password`, {
    headers: {
      'Authorization': 'Basic ZnJvbnRlbmQ6ZnJvbnRlbmQ=',
    },
    method: 'POST',
    credentials: 'include',
    body: formData,
  }).then((res) => res.json())
}
