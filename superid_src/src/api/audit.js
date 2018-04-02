import { auditURL } from './URLConfig'

const audit = {
  addAuditors: `${auditURL}/config/addAuditors`,
  getAffair: (roleId) => `${auditURL}/config/${roleId}/getAuditAffair`,
  getAudit: (affairId, roleId) => `${auditURL}/config/${affairId}/${roleId}/all`,
  getAuditCode: `${auditURL}/config/operations`,
  cancel: `${auditURL}/config/cancelAudit`,
  remove: `${auditURL}/config/removeAuditor`,
  info: (affairId, moduleId) => `${auditURL}/config/${affairId}/${moduleId}/info`,
  handle: `${auditURL}/handle`,
  content: (auditId, operationId) => `${auditURL}/${auditId}/${operationId}/info`,
  contentSender: (auditId) => `${auditURL}/${auditId}/info`,

  config: {
    modules: () => `${auditURL}/config/modules`,
    operation: {
      get: (affairId, moduleId) => `${auditURL}/config/${affairId}/${moduleId}/info`,
    },
    criteria: {
      get: (operationId) => `${auditURL}/config/${operationId}/criteria`,
      add: () => `${auditURL}/config/addCriteria`,
      modify: () => `${auditURL}/config/modifyCriteria`,
      delete: () => `${auditURL}/config/deleteCriteria`,
    },
    role: {
      affairList: (roleId) => `${auditURL}/config/${roleId}/getAuditAffair`,
      operationList: (affairId, roleId) => `${auditURL}/config/${affairId}/${roleId}/all`,
      removeSelf: () => `${auditURL}/config/removeAuditor`,
    },
  }
}

export default audit
