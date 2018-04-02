import { affairURL } from './URLConfig'

const notice = {
  invitationContent: (invitationId) => `${affairURL}/notice/invitation?invitationId=${invitationId}`,
  agreeAllianceInvitation: (messageId) => `${affairURL}/notice/agree_alliance_invitation?messageId=${messageId}&reason=''`,
  rejectAllianceInvitation: (messageId, reason) => `${affairURL}/notice/reject_alliance_invitation?messageId=${messageId}&reason=${reason}`,
  agreeAffairInvitation: (messageId) => `${affairURL}/notice/agree_affair_invitation?messageId=${messageId}&reason=''`,
  rejectAffairInvitation: (messageId, reason) => `${affairURL}/notice/reject_affair_invitation?messageId=${messageId}&reason=${reason}`,
}

export default notice
