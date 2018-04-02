import {
  baseURL
} from './URLConfig'

const order = {
  pay_fund: () => `${baseURL}/order/pay_fund`,
  fund_order: (orderId) => `${baseURL}/order/fund_order?orderId=${orderId}`,
  accept_funder: (roleId, orderId, accountId, msgId, chatMsgId) => `${baseURL}/order/accept_fund?roleId=${roleId}&orderId=${orderId}&accountId=${accountId}&msgId=${msgId}&chatMsgId=${chatMsgId}`,
  reject_funder: (roleId, orderId, reason, msgId, chatMsgId) => `${baseURL}/order/reject_fund?roleId=${roleId}&orderId=${orderId}&reason=${reason}&msgId=${msgId}&chatMsgId=${chatMsgId}`,
  flows: () => `${baseURL}/order/flows`,
  contain_children_flows: (roleId, affairId) => `${baseURL}/order/contain_children_flows?roleId=${roleId}&affairId=${affairId}`,
  fund_order_detail: (orderId) => `${baseURL}/order/fund_order_detail?orderId=${orderId}`,
  material_deal_detail: (orderId) => `${baseURL}/order/material_deal_detail?orderId=${orderId}`,
  flow_report: (allianceId) => `${baseURL}/order/flow_report?allianceId=${allianceId}`,
  summary: (endTime, containsChildren) => `${baseURL}/order/summary?end=${endTime}&containsChildren=${containsChildren}`,
  alliance_deals: (toAllianceId, begin, end, containsChildren, allianceId) => `${baseURL}/order/alliance_deals?toAllianceId=${toAllianceId}&begin=${begin}&end=${end}&containsChildren=${containsChildren}&allianceId=${allianceId}`,
  send_material: () => `${baseURL}/order/send_material`,
  material_order: (orderId) => `${baseURL}/order/material_order?orderId=${orderId}`,
  material_order_record: (materialOrderId, time) => `${baseURL}/order/material_order_record?materialOrderId=${materialOrderId}&time=${time}`,
  handle_back_material: (chatMsgId) => `${baseURL}/order/handle_back_material?chatMsgId=${chatMsgId}`,
  handleApplyFund: () => `${baseURL}/order/pay_application_fund`,
  handleFundInfo: () => `${baseURL}/order/handle_fund_info`,
}

export default order