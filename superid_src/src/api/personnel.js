import {
  affairURL
} from './URLConfig'

const personnel = {
  search: (roleId) => `${affairURL}/personnel/search?roleId=${roleId}`,
  candidate: (roleId) => `${affairURL}/personnel/candidates?roleId=${roleId}`,
  allocate: (beOperatedRoleId, beAllocatedRoleId, operatorRoleId, reason) => `${affairURL}/personnel/allocate?beOperatedRoleId=${beOperatedRoleId}&beAllocatedRoleId=${beAllocatedRoleId}&operatorRoleId=${operatorRoleId}&reason=${reason}`,
  delete: (affairId, roleId, beOperatedUserId) => `${affairURL}/personnel/existence/delete?affairId=${affairId}&roleId=${roleId}&beOperatedUserId=${beOperatedUserId}`,
  inviteContent: (roleId, resourceId) => `${affairURL}/personnel/show?roleId=${roleId}&resourceId=${resourceId}`,
  employ_add: (beOperatedUserId) => `${affairURL}/personnel/employment/add?beOperatedUserId=${beOperatedUserId}`,
  employ_delete: (beOperatedUserId) => `${affairURL}/personnel/employment/delete?beOperatedUserId=${beOperatedUserId}`,
}

export default personnel