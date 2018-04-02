import {
  baseURL,
  affairURL,
  authURL
} from './URLConfig'

const affair = {
  children: {
    get: () => `${affairURL}/affair/direct_children`,
  },
  rolePublic: (affairId, roleId) => `${affairURL}/affair/role_public?affairId=${affairId}&roleId=${roleId}`,
  memberPublic: (affairId, roleId) => `${affairURL}/affair/member_public?affairId=${affairId}&roleId=${roleId}`,
  tags: {
    search: (keyword, page, size) => `${affairURL}/affair/search_tags?content=${keyword}&page=${page}&size=${size}`, // TODO
    get: (keyword) => `${affairURL}/affair/getTags?content=${keyword}`,
  },
  search: (allianceId, tag) => `${affairURL}/affair/search?allianceId=${allianceId}&tag=${tag}`, // TODO
  search_affair: (content, page, size) => `${affairURL}/affair/search?content=${content}&page=${page}&size=${size}`,
  list: {
    get: `${affairURL}/affair/list`,
  },
  historyList: {
    get: `${affairURL}/affair/history_list`, // unused
  },
  tree: {
    get: `${affairURL}/affair/forest_top`,
  },
  post: () => `${affairURL}/affair/create`,
  info: {
    update: () => `${affairURL}/affair/modify`,
    get: () => `${affairURL}/affair/info`,
  },
  plan: {
    role_view: `${baseURL}/plan/role_view`,
  },
  role: {
    all: () => `${affairURL}/affair_member/get_all_roles`,
    current: () => `${affairURL}/affair_member/role_cards`,
    announcementGuests: () => `${affairURL}/affair_member/main_roles`,
    other: () => `${affairURL}/affair_member/other_roles`,
    invite: () => `${affairURL}/affair_member/invite`,
    switch: (beSwitchedRoleId, toRoleId) => `${affairURL}/role/switch_owner?beSwitchedRoleId=${beSwitchedRoleId}&toRoleId=${toRoleId}`,
    give: () => `${affairURL}/role/create`,
    disable: (beOperatedRoleId) => `${affairURL}/role/invalid?beOperatedRoleId=${beOperatedRoleId}`,
    enable: (roleId, beOperatedRoleId) => `${affairURL}/role/enable?roleId=${roleId}&beOperatedRoleId=${beOperatedRoleId}`, // unused
    remove: (beOperatedRoleId) => `${affairURL}/affair_member/remove?beOperatedRoleId=${beOperatedRoleId}`,
    edit_authority: () => `${affairURL}/affair_member/edit_permissions`,
    main_roles: (containChildren = false) => `${affairURL}/affair_member/main_roles?containChildren=${containChildren}`,
    affair_roles: () => `${affairURL}/affair_member/affair_roles`,
    alliance_authority: () => `${affairURL}/role/edit_permissions`,
    allocate: () => `${affairURL}/role/allocate`,
    public: () => `${affairURL}/affair_member/public/roles`,
    delete: (deletedRoleId) => `${affairURL}/role/delete?deletedRoleId=${deletedRoleId}`,
    history: `${affairURL}/role/history`,
    history_types: () => `${affairURL}/role/history_types`,
    get_role_info: () => `${affairURL}/role/show_role_info`,
    get_alliance_role_info: `${affairURL}/role/alliance_role`,
    edit_tags: () => `${affairURL}/role/modify_tags`,
    modify_public_type: (publicType) => `${affairURL}/role/modify_public_type?publicType=${publicType}`,
    modify_name: (beOperatedRoleId, newTitle) => `${affairURL}/role/edit_role_title?beOperatedRoleId=${beOperatedRoleId}&newTitle=${newTitle}`,
  },
  stick: (allianceId, isStuck) => `${affairURL}/affair/stick_affair?allianceId=${allianceId}&isStuck=${isStuck}`, // TODO
  homepage: () => `${affairURL}/affair/set_homepage`,
  move: {
    post: (affairMemberId, targetAffairId) => `${affairURL}/affair/move?affairMemberId=${affairMemberId}&targetAffairId=${targetAffairId}`
  },
  covers: {
    post: () => `${affairURL}/affair/update_covers`,
  },
  description: {
    post: () => `${affairURL}/affair/update_description`,
  },
  terminate: {
    post: () => `${affairURL}/affair/disable`,
  },
  recover: () => `${affairURL}/affair/recover_affair`,
  join: {
    apply: (affairId, roleId, applyReason) => `${affairURL}/affair_member/apply?roleId=${roleId}&targetAffairId=${affairId}&applyReason=${applyReason}`,
    cancel_apply: (affairId) => `${affairURL}/affair_member/cancel_apply?targetAffairId=${affairId}`,
    agree: (applicationId, messageId) => `${affairURL}/affair_member/agree?applicationId=${applicationId}&msgId=${messageId}&dealReason=''`,
    reject: (applicationId, messageId, reason) => `${affairURL}/affair_member/reject?applicationId=${applicationId}&msgId=${messageId}&dealReason=${reason}`,
    applicationInfo: (applicationId) => `${affairURL}/affair_member/apply_affair_info?resourceId=${applicationId}`,
  },
  invite: {
    role: () => `${affairURL}/affair_member/invite`
  },
  member: {
    current: () => `${affairURL}/affair_member/search`,
    detail: (checkedUserId) => `${affairURL}/affair_member/user_info?checkedUserId=${checkedUserId}`,
    director: (affairId) => `${affairURL}/affair_member/director_card?targetAffairId=${affairId}`, // unused
    cards: (operatorRoleId) => `${affairURL}/personnel/roles?roleId=${operatorRoleId}&operatorRoleId=${operatorRoleId}`,
    cancelInvite: (beInvitedUserId, beInvitedRoleId) => `${affairURL}/personnel/invitation/delete?beInvitedUserId=${beInvitedUserId}&beInvitedRoleId=${beInvitedRoleId}`,
    applyingAffairList: () => `${affairURL}/affair_member/applying_affairs`,
  },
  tag: {
    update: (tags) => `${affairURL}/affair/update_tags?tags=${tags}` // unused
  },
  permissions: {
    get: `${affairURL}/affair/get_permissions`,
  },
  star: (affairId, star) => `${authURL}/api/star-affair?affairId=${affairId}&star=${star}`,
  starList: () => `${authURL}/api/show-star`,
  homepage_change: () => `${affairURL}/affair/homepage/info`,
  chat: {
    create: () => `${affairURL}/affair_chat/create`,
    updateMembers: () => `${affairURL}/affair_chat/update_members`
  },
  terminateInfo: () => `${affairURL}/affair/check_disable`,
}

export default affair
