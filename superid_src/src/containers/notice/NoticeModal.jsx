import React from 'react' //eslint-disable-line
import AllianceInvitationModal from './modal/invitation/AllianceInvitationModal'
import AffairInvitationModal from './modal/invitation/AffairInvitationModal'
import AnnouncementInvitationModal from './modal/invitation/AnnouncementInvitationModal'
import AffairApplicationModal from './modal/invitation/AffairApplicationModal'
import AnnouncementApplicationModal from './modal/invitation/AnnouncementApplicationModal'

import ReceiveMaterialModal from './modal/material/ReceiveMaterialModal'
import RefusedMaterialModal from './modal/material/RefusedMaterialModal'
import AcquireMaterialModal from './modal/material/AcquireMaterialModal'

import FundDetailModal from './modal/fund/FundDetailModal'
import ReceiveFundModal from './modal/fund/ReceiveFundModal'
import ApplyFundModal from './modal/fund/ApplyFundModal'
import AcquireFundInfoModal from './modal/fund/AcquireFundInfoModal'

import AuditModal from './modal/audit/AuditModal'
import AuditInfoModal from './modal/audit/AuditInfoModal'

/* props: { message : Notification, onHide: () => Void } */
const NoticeModal = (props) => {
  let ModalComponent = () => <span />
  const lastURL = (props.message.get('urls').last() || Map())
  const code = lastURL.get('type')
  switch (code) {
    case 100:
    //事务邀请
      ModalComponent = AffairInvitationModal
      break
    case 200:
    //盟邀请
      ModalComponent = AllianceInvitationModal
      break
    case 300:
    //接收物资
      ModalComponent = ReceiveMaterialModal
      break
    case 301:
    //发送处理拒绝物资
      ModalComponent = RefusedMaterialModal
      break
    case 302:
    //获取物资处理
      ModalComponent = AcquireMaterialModal
      break
    case 400:
    //接收资金
      ModalComponent = ReceiveFundModal
      break
    case 401:
    case 403:
    //401 获取资金处理
    //403 获取资金处理结果
      ModalComponent = ApplyFundModal
      break
    case 402:
    //资金交易详情
      ModalComponent = FundDetailModal
      break
    case 404:
    //调用资金详情
      ModalComponent = AcquireFundInfoModal
      break
    case 501:
    //发布邀请
      ModalComponent = AnnouncementInvitationModal
      break
    case 502:
    //发布申请
      ModalComponent = AnnouncementApplicationModal
      break
    case 600:
    //处理申请事务
      ModalComponent = AffairApplicationModal
      break
    case 11000:
    //审批处理
      ModalComponent = AuditModal
      break
    case 11001:
    //审批详情
      ModalComponent = AuditInfoModal
      break
    default:
      ModalComponent = () => <span />
  }
  return <ModalComponent {...props} />
}

export default NoticeModal
