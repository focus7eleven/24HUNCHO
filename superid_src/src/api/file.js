import {
  fileURL
} from './URLConfig'

const file = {
  token: {
    userAvatar: `${fileURL}/user-avatar-token`,
    affairCover: () => `${fileURL}/affair-cover-token`,
    chat: () => `${fileURL}/chat-token`,
    material: (warehouseId) => `${fileURL}/material?warehouseId=${warehouseId}`,
    announcement: (affairId) => `${fileURL}/announcement-token?affairId=${affairId}`,
    file: () => `${fileURL}/file-token`,
    verifyFile: `${fileURL}/user-id-card-token`,
    download: (affairId, roleId) => `${fileURL}/token-download?affairId=${affairId}&roleId=${roleId}`,
    delete_file: () => `${fileURL}/destroy`,
    simple_download: (path, extraInfo) => `${fileURL}/token-download-simple?path=${path}&extraInfo=${extraInfo}`,
    preview: (fileId, version) => `${fileURL}/file-preview?fileId=${fileId}&version=${version}`,
    affairAvatar: `${fileURL}/affair-avatar-token`,
    announcementAttachment: `${fileURL}/announcement-ref-token-pri`,
  },
  condense: {
    userAvatar: (avatar) => `${fileURL}/condense-user-avatar?url=${avatar}`,
    affairAvatar: (avatar) => `${fileURL}/condense-affair-avatar?url=${avatar}`,
  },
  checkName: `${fileURL}/check-name`,
  fileList: {
    get: (folderId) => `${fileURL}/children?folderId=${folderId}`
  },
  trash: {
    get: () => `${fileURL}/recycle`,
  },
  versions: {
    get: (fileId) => `${fileURL}/history?fileId=${fileId}`
  },
  logs: {
    get: (fileId) => `${fileURL}/log?fileId=${fileId}`
  },
  restore: (fileId, folderId, name) => `${fileURL}/restore?fileId=${fileId}&${!folderId ? '' : `&desFolderId=${folderId}`}&name=${encodeURIComponent(name)}`,
  rename: (id, type, newName) => `${fileURL}/rename?id=${id}&type=${type}&name=${newName}`,
  add: () => `${fileURL}/add-file`,
  folder: {
    add: (folderId, name, publicType) => `${fileURL}/add-folder?folderId=${folderId}&name=${name}&publicType=${publicType}`
  },
  search: (phrase) => `${fileURL}/file-search-meta?phrase=${phrase}`,
  delete: (fileId) => `${fileURL}/delete-file?fileId=${fileId}`,
  deleteFolder: (folderId) => `${fileURL}/remove-folder?folderId=${folderId}`,
  dir: () => `${fileURL}/dir`,
  navigationInfo: (folderId) => `${fileURL}/navigation?folderId=${folderId}`,
  publicType: {
    edit: () => `${fileURL}/edit-public`
  },
  move: () => `${fileURL}/move`,
  file_repo: {
    list: () => `${fileURL}/fileSet/list`,
    add: () => `${fileURL}/fileSet/add`,
    delete: () => `${fileURL}/fileSet/delete`,
    update: () => `${fileURL}/fileSet/update`,
  },
}
export default file