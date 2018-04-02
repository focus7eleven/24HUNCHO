import {
	authorityURL
} from './URLConfig'

const permission = {
  settings: () => `${authorityURL}/api/settings`,
  role: (affairId, roleId) => `${authorityURL}/api/role/${affairId}/${roleId}`,
  setRole: (affairId, roleId) => `${authorityURL}/api/role/set/${affairId}/${roleId}`,
  alliance: (allianceId) => `${authorityURL}/api/identity/${allianceId}`,
  identity: (allianceId, identityId) => `${authorityURL}/api/identity/${allianceId}/${identityId}`,
  affair: {
    get: (affairId, roleId) => `${authorityURL}/api/role/${affairId}/${roleId}/operations`,
  },
  roleMaps: () => `${authorityURL}/api/userRolePermissions`,
  resourcePermission: {
    get: `${authorityURL}/api/userResourcePermissions`
  },
}

export default permission
