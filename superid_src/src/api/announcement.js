import {
  baseURL
} from './URLConfig'

const announcement = {
  post: `${baseURL}/announcement/create_new`,
  update: (announcementId) => `${baseURL}/announcement/save?announcementId=${announcementId}`,
  inner: () => `${baseURL}/announcement/search_inner`,
  outer: () => `${baseURL}/announcement/search_outer`,
  searchForMove: () => `${baseURL}/announcement/search_for_move`,
  move: () => `${baseURL}/announcement/move`,
  invalid: (announcementId, containChild = false) => `${baseURL}/announcement/invalid?announcementId=${announcementId}&containChild=${containChild}`,
  recover: (announcementId, containChild = false) => `${baseURL}/announcement/recover?announcementId=${announcementId}&containChild=${containChild}`,
  follow: (announcementId, roleId, allianceId, follow) => `${baseURL}/announcement_member/${follow ? 'follow' : 'cancel_follow' }?announcementId=${announcementId}&roleId=${roleId}&allianceId=${allianceId}`,
  followers: (announcementId, allianceId) => `${baseURL}/announcement_member/follower?announcementId=${announcementId}&allianceId=${allianceId}`,
  apply: (announcementId, roleId, allianceId, reason) => `${baseURL}/announcement_member/apply?announcementId=${announcementId}&roleId=${roleId}&allianceId=${allianceId}&reason=${reason}`,
  handleAgreeApply: (operationId, affairId, roleId, agree) => `${baseURL}/announcement_member/handle_apply?operationId=${operationId}&affairId=${affairId}&roleId=${roleId}&agree=${agree}`,
  applicationInfo: (operationId, roleId) => `${baseURL}/announcement_member/show_apply?operationId=${operationId}&roleId=${roleId}`,
  overview: () => `${baseURL}/announcement/overview_public`,
  relation: (announcementId, shipAnnouncementId, type) => `${baseURL}/plan/add_announcement_ship?announcementId=${announcementId}&shipAnnouncementId=${shipAnnouncementId}&type=${type}`,
  remove_relation: (announcementId, shipAnnouncementId) => `${baseURL}/plan/remove_announcement_ship?announcementId=${announcementId}&shipAnnouncementId=${shipAnnouncementId}`,
  tag: {
    update: (announcementId, tags) => `${baseURL}/announcement/modifyTags?tags=${tags}&announcementId=${announcementId}`,
  },
  question: {
    list: {
      get: (type, announcementId, allianceId, roleId, affairId) => `${baseURL}/announcement/quiz_list?type=${type}&announcementId=${announcementId}&allianceId=${allianceId}&roleId=${roleId}&affairId=${affairId}`,
    },
    post: `${baseURL}/announcement/modify_quiz`,
  },
  inviteContent: (operationId, roleId) => `${baseURL}/announcement_member/show?operationId=${operationId}&roleId=${roleId}`,
  publish: {
    post: `${baseURL}/announcement/create`,
  },
  withChildren: {
    get: (affairId, roleId) => `${baseURL}/announcement/announcement_children?affairId=${affairId}&roleId=${roleId}`,
  },
  draft: {
    list: {
      get: () => `${baseURL}/announcement/draft_ids`,
    },
    post: `${baseURL}/announcement/save/save_draft_draft`,
    get: (id) => `${baseURL}/announcement/draft_detail?draftId=${id}`,
    delete: `${baseURL}/announcement/delete_draft`,
  },
  get: () => `${baseURL}/announcement/overview`,
  query: {
    get: (roleId, affairId, isContainChild = false, page, size, queryString, startTime, endTime) => {
      if (queryString == '' && startTime == null) {
        return `${baseURL}/announcement/search?roleId=${roleId}&affairId=${affairId}&containChild=${isContainChild}&page=${page}&size=${size}`
      } else if (queryString == '' && startTime != null) {
        return `${baseURL}/announcement/search?roleId=${roleId}&affairId=${affairId}&containChild=${isContainChild}&page=${page}&size=${size}&startTime=${startTime}&endTime=${endTime}`
      } else if (queryString != '' && startTime == null) {
        return `${baseURL}/announcement/search?content=${queryString}&roleId=${roleId}&affairId=${affairId}&containChild=${isContainChild}&page=${page}&size=${size}`
      } else {
        return `${baseURL}/announcement/search?content=${queryString}&roleId=${roleId}&affairId=${affairId}&containChild=${isContainChild}&page=${page}&size=${size}&startTime=${startTime}&endTime=${endTime}`
      }
    }
  },
  info: {
    get: (queryString, allianceId) => `${baseURL}/announcement/overview?ids=${queryString}&allianceId=${allianceId}`
  },
  detail: {
    duration: {
      update: (announcementId) => `${baseURL}/announcement/save?announcementId=${announcementId}`,
    },
    get: (announcementId, offsetHead = 0, offsetTail = 0, version = 0) => `${baseURL}/announcement/details?announcementId=${announcementId}&offsetHead=${offsetHead}&offsetTail=${offsetTail}&version=${version}`,
    officials: {
      get: (announcementId) => `${baseURL}/announcement_member/authority?announcementId=${announcementId}`,
      post: () => `${baseURL}/announcement_member/add_authority`,
      delete: (announcementId, roleId, operatorId, allianceId, type) => `${baseURL}/announcement_member/remove?announcementId=${announcementId}&roleId=${roleId}&operatorId=${operatorId}&allianceId=${allianceId}&type=${type}`,
    },
    file: {
      get: (announcementId) => `${baseURL}/announcement_file/show_file?announcementId=${announcementId}`
    },
    guests: {
      innerAffair: {
        get: (announcementId) => `${baseURL}/announcement_member/affair_member?announcementId=${announcementId}`,
      },
      innerAlliance: {
        get: (announcementId) => `${baseURL}/announcement_member/alliance_member?announcementId=${announcementId}`,
      },
      menkor: {
        get: (announcementId) => `${baseURL}/announcement_member/guest?announcementId=${announcementId}`,
      },
      delete: (announcementId, roleId, operatorId, allianceId, type) => `${baseURL}/announcement_member/remove?announcementId=${announcementId}&allianceId=${allianceId}&roleId=${roleId}&operatorId=${operatorId}&type=${type}`,
      role: {
        post: `${baseURL}/announcement_member/add_guest_role`,
      },
      affair: {
        post: `${baseURL}/announcement_member/add_guest_affair`
      },
    },
    removeMember: (announcementId, roleId, type) => `${baseURL}/announcement_member/remove?announcementId=${announcementId}&roleId=${roleId}&type=${type}`,
    comments: {
      get: (announcementId) => `${baseURL}/announcement/comment_list?announcementId=${announcementId}`,
      post: `${baseURL}/announcement/add_comment`,
      delete: (commentId, announcementId) => `${baseURL}/announcement/remove_comment?commentId=${commentId}&announcementId=${announcementId}`,
      modifyPublic: `${baseURL}/announcement/hold_comment`,
    },
    news: (announcementId) => `${baseURL}/announcement/dynamic?announcementId=${announcementId}`,
    task: {
      getRelations: (id) => `${baseURL}/plan/ship_announcement_task?announcementTaskId=${id}`,
      relation: (id, shipId, type) => `${baseURL}/plan/add_task_ship?announcementTaskId=${id}&shipAnnouncementTaskId=${shipId}&type=${type}`,
      get: (workId, type = 0) => `${baseURL}/announcement_task/show_task?announcementTaskId=${workId}&type=${type}`,
      create: (choose = 0) => `${baseURL}/announcement_task/create_task?choose=${choose}`,
      modify: (announcementTaskId, type = 0) => `${baseURL}/announcement_task/modify_task?announcementTaskId=${announcementTaskId}&type=${type}`,
      keyTask: (taskId) => `${baseURL}/announcement_task/key_task?announcementTaskId=${taskId}`,
      getList: (announcementId) => `${baseURL}/announcement_task/show_task_list?announcementId=${announcementId}`,
      delete: (announcementTaskId, announcementId) => `${baseURL}/announcement_task/delete_task?announcementTaskId=${announcementTaskId}&announcementId=${announcementId}`,
      read: {
        post: (announcementTaskId) => `${baseURL}/my/modify_read_state?announcementTaskId=${announcementTaskId}`,
      },
      attachment: {
        post: () => `${baseURL}/announcement_file/save_file_log`,
        delete: (fileId) => `${baseURL}/announcement_file/delete_file?fileId=${fileId}`,
      }
    },
    meeting: {
      create: () => `${baseURL}/announcement/create_meeting`,
      modify: () => `${baseURL}/announcement/modify_meeting`,
      delete: () => `${baseURL}/announcement/delete_meeting`,
      cancel: () => `${baseURL}/announcement/cancel_meeting`,
      get: () => `${baseURL}/announcement/show_meeting`,
      list: () => `${baseURL}/announcement/show_meeting_list`,
    },
    subAnnouncementList: () => `${baseURL}/announcement/direct_child_announcement`
  },
  publicType: {
    update: (announcementId, publicType) => `${baseURL}/announcement/modify_public?announcementId=${announcementId}&publicType=${publicType}`,
  },
  isTop: {
    update: (announcementId, isTop) => `${baseURL}/announcement/modify_stuck?announcementId=${announcementId}&isStuck=${isTop}`, // unused
  },
  version: {
    // 变更发布, 因为是新增一个version, 所以是post
    post: `${baseURL}/announcement/save`,
    // 获取所有版本
    get: (announcementId) => `${baseURL}/announcement/all_version?announcementId=${announcementId}`,
  },
  guest: {
    invitation: {
      post: () => `${baseURL}/announcement_member/invite`,
    },
    agree: {
      post: () => `${baseURL}/announcement_member/agree`,
      delete: () => `${baseURL}/announcement_member/reject`,
    },
    affairInvitation: {
      post: () => `${baseURL}/announcement_member/transpond`,
    },
  },
  chat: {
    createGroup: () => `${baseURL}/announcement_chat/create`,
    updateMembers: () => `${baseURL}/announcement_chat/update_members`,



    groupList: (announcementId, subType) => `${baseURL}/announcement/chat_group_list?announcementId=${announcementId}&subType=${subType}`,
    guestGroupList: (announcementId, allianceId) => `${baseURL}/announcement/receiver_chat_group_list?announcementId=${announcementId}&allianceId=${allianceId}`,
    guestInfo: (announcementId) => `${baseURL}/announcement_member/receiver_info?announcementId=${announcementId}`,
    invite: `${baseURL}/announcement_member/invite_in_group`,
    exit: (groupId) => `${baseURL}/chat/exit?groupId=${groupId}`
  }
}

export default announcement
