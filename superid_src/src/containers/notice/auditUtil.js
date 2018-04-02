
import { fromJS } from 'immutable'
import config from '../../config'

let AUDIT_LIST = []
let AUDIT_MAP = {}

fetch(config.api.audit.getAuditCode, {
  method: 'GET',
}).then((res) => res.json()).then((json) => {
  if (json.code === 0){
    AUDIT_LIST = fromJS(json.data)
    AUDIT_LIST.forEach((val) => {
      AUDIT_MAP[val.get('name')] = val.get('id')
    })
  }
})

export function getAuditMap(){
  return AUDIT_MAP
}

export const AUDIT_RESULT = {
  AGREE: 0,
  REFUSE: 1,
}

export {
  AUDIT_MAP
}
