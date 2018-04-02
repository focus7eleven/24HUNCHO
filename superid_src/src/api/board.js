import {
	baseURL
} from './URLConfig'

const board = {
  list: `${baseURL}/kanban/list`,
  modify_state: (announcementId, toState, time) => time ? `${baseURL}/kanban/modify_state?announcementId=${announcementId}&toState=${toState}&time=${time}` : `${baseURL}/kanban/modify_state?announcementId=${announcementId}&toState=${toState}`,
}

export default board