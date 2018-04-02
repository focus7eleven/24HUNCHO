import {
  baseURL,
  materialURL
} from './URLConfig'

const material = {
  post: () => `${materialURL}/register`,
  detail: (warehouseId, materialId) => `${materialURL}/detail?warehouseId=${warehouseId}&materialId=${materialId}`,
  modify: (materialId) => `${materialURL}/modify?materialId=${materialId}`,
  template: {
    update: () => `${baseURL}/material/modify_template`,
    by_template_post: () => `${baseURL}/material/create_template_with_template`,
    post: (materialId, warehouseId) => `${baseURL}/material/create_template?materialId=${materialId}&warehouseId=${warehouseId}`,
    get: (warehouseId) => `${baseURL}/material/template_list?warehouseId=${warehouseId}`,
    delete: (templateId) => `${baseURL}/material/delete_template?templateId=${templateId}`,
    detail: {
      get: (templateId) => `${baseURL}/material/template_detail?templateId=${templateId}`,
    },
  },
  acquire: {
    list: () => `${materialURL}/usable`,
    post: () => `${baseURL}/material/obtainment`,
    handle: () => `${baseURL}/notice/deal_material_application`
  },
  warehouse: {
    materialList: {
      get: (warehouseId) => `${materialURL}/warehouse/materials?warehouseId=${warehouseId}`,
    },
    get: () => `${materialURL}/warehouse/list`,
    post: () => `${materialURL}/warehouse/add_scene_warehouse`,
    role_warehouse: () => `${materialURL}/warehouse/can_manage_warehouse`,
    overview: () => `${materialURL}/warehouse/overview`,
    category: {
      get: `${baseURL}/material/types`
    },
    batch_receive_material: (chatMsgId) => `${baseURL}/order/batch_receive_material?chatMsgId=${chatMsgId}`,
    receive_material: (warehouseId, chatMsgId) => `${baseURL}/order/receive_material?warehouseId=${warehouseId}&chatMsgId=${chatMsgId}`,
    send_back_material: (chatMsgId) => `${baseURL}/order/send_back_material?chatMsgId=${chatMsgId}`,
    detail: (warehouseId) => `${materialURL}/warehouse/detail?warehouseId=${warehouseId}`,
    sending: (warehouseId) => `${baseURL}/material/sending?warehouseId=${warehouseId}`,
  },
  search: {
    get: (warehouseId, name) => `${materialURL}/search_material?warehouseId=${warehouseId}&name=${name}`
  },
  public: () => `${materialURL}/public`,
  acquireInfo: () => `${baseURL}/material/show_application`
}

export default material
