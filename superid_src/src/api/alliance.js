import { affairURL } from './URLConfig'

const alliance = {
  simple_info: (allianceIds) => `${affairURL}/alliance/simple_info?allianceIds=${allianceIds}`,
  info: (allianceId, affairId, roleId) => `${affairURL}/alliance/alliance_info?allianceId=${allianceId}&affairId=${affairId}&roleId=${roleId}`,
  post: (name, code, affairs) => `${affairURL}/alliance/create?name=${name}&affairs=${affairs}&code=${code}`,
  get: (userId) => `${affairURL}/alliance/list?userId=${userId}`,
  editName: () => `${affairURL}/alliance/edit_name`,
  editCode: () => `${affairURL}/alliance/edit_code`,
  role: {
    get: (roleId) => `${affairURL}/alliance_member/disable_roles?roleId=${roleId}` // unused
  },
  code: {
    validation: (code) => `${affairURL}/alliance/valid_code?code=${code}`
  },
  validation: {
    post: (roleId) => `${affairURL}/alliance/add_certification?roleId=${roleId}` // TODO
  },
  affairTree: {
    singleTree: (allianceId) => `${affairURL}/affair/tree?allianceId=${allianceId}`,
    outsideTree: (allianceId) => `${affairURL}/affair/outside_tree?allianceId=${allianceId}`,
  },
  simpleTree: (allianceId) => `${affairURL}/affair/simple_tree?allianceId=${allianceId}`,
  candidates: {
    search: (roleId, keyword) => `${affairURL}/alliance_member/search_all?roleId=${roleId}&keyword=${keyword}`,
  },
  member: {
    post: (roleId) => `${affairURL}/personnel/invite?roleId=${roleId}`,
    remove: (roleId, targetUserId) => `${affairURL}/alliance_member/remove?roleId=${roleId}&targetUserId=${targetUserId}` // unused
  },
  permissions: {
    get: `${affairURL}/alliance/get_permissions`,
  }
}

export default alliance
