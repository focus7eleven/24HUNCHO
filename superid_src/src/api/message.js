import { baseURL, messageURL, connectURL } from './URLConfig'

const message = {
  connect: () => `${connectURL}/api/external/notification/channel/installation`,

  userNotification: (userId) => `${messageURL}/api/msg/${userId}/roles/count`,
  roleNotification: (roleId) => `${messageURL}/api/msg/${roleId}/count`,

  get: (type, roleId) => `${messageURL}/api/msg/${type}/${roleId}/all`,

  receiverReadOne: (messageId, senderRoleId) => `${baseURL}/notice/read?messageId=${messageId}&senderRoleId=${senderRoleId}`, // 接收方阅读单条消息需要调用此接口，其余的情况调用以下两个接口
  readOne: (messageId) => `${messageURL}/api/msg/${messageId}`,
  readAll: (type, roleId, time) => `${messageURL}/api/msg/${type}/${roleId}/updates?sendTime=${time}`,

  initialAffairDynamic: () => `${messageURL}/api/msg/affairs/dynamic`,
  moreDynamic: () => `${messageURL}/api/msg/affair/more`,

  sender: {
    get: (type, roleId) => `${messageURL}/api/msg/sender/${type}/${roleId}/all`,
    getByGroup: (type, roleId) => `${messageURL}/api/msg/sender/${type}/${roleId}/group`,
    groupDetail: (type, roleId) => `${messageURL}/api/msg/sender/${type}/${roleId}/group/detail`,
    userNotification: (userId) => `${messageURL}/api/msg/sender/${userId}/roles/count`,
    roleNotification: (roleId) => `${messageURL}/api/msg/sender/${roleId}/count`,
    readOne: (messageId) => `${messageURL}/api/msg/sender/${messageId}`,
  },

}

export default message
