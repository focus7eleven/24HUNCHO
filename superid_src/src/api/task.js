import { baseURL } from './URLConfig'

const task = {
  get: (taskId) => `${baseURL}/task/detail?taskId=${taskId}`,
  list: (key) => `${baseURL}/task/list?key=${key}`,
  create: () => `${baseURL}/task/create`,
  announcement: {
    post: () => `${baseURL}/announcement/create_new`,
    top: (isTop) => `${baseURL}/announcement/tops?isTop=${isTop}`,
  },
  edit: (taskId) => `${baseURL}/task/edit?taskId=${taskId}`,
  change_admin: (taskId, targetRoleId) => `${baseURL}/task/change_admin?taskId=${taskId}&targetRoleId=${targetRoleId}`,
  publishes: {
    get: (taskId) => `${baseURL}/task/announcement_timeline?taskId=${taskId}`,
  },
  overview: () => `${baseURL}/task/overview`,
  work: {
    all: `${baseURL}/my/show_work`,
  },
}

export default task
