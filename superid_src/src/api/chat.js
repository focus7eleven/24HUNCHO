import { chatURL } from './URLConfig'

const chat = {

  getConnector: (userId) => `${chatURL}/server/connector?userId=${userId}`,
  getOfficialChatGroups: (announcementId) => `${chatURL}/chatGroup/announcementChatGroups?announcementId=${announcementId}`,
  getGuestChatGroups: (announcementId) => `${chatURL}/chatGroup/announcementChatGroupsOfGuest?announcementId=${announcementId}`,

  memberList: (groupId) => `${chatURL}/chatGroup/chatGroupMembers?groupId=${groupId}`,
  groupPermission: (groupId) => `${chatURL}/chatGroup/permissionInGroup?groupId=${groupId}`,
  leaveGroup: () => `${chatURL}/chatGroup/leaveChatGroup`,
  disbandGroup: () => `${chatURL}/chatGroup/disbandChatGroup`,

  edit: () => `${chatURL}/chatGroup/updateChatGroupName`,
  affair: {
    getChatGroups: (affairId) => `${chatURL}/chatGroup/affairChatGroups?affairId=${affairId}`,
  },
  message: {
    recent: (affairId, roleId) => `${chatURL}/message/recent?affairId=${affairId}&roleId=${roleId}`,
    search: () => `${chatURL}/message/search`
  },
}

export default chat
