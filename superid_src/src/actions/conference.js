import config from '../config'
import axios from 'axios'

const PRESENTER_ROLE = 'presenter'

export const START_CONFERENCE = 'START_CONFERENCE'
export function startConference(affair, groupId, selectedRole, roomName, recordingOption, recordingPath) {
  return (dispatch) => {
    return fetch(`${config.videoURL}/meeting/create_room`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        roomName,
        affairId: affair.get('id'),
        allianceId: affair.get('allianceId'),
        chatGroupId: groupId,
        ids: selectedRole.map((v) => v.get('id')).push(affair.get('roleId')).toArray(),
        operatorRoleId: affair.get('roleId'),
        recordState: recordingOption,
        recordPath: recordingPath,
      }),
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const data = res.data

        return axios.post(`${config.licodeServerUrl}/createToken/`, {
          username: affair.get('roleId').toString(),
          room: data.id.toString(),
          role: PRESENTER_ROLE,
        }).then((res) => {
          if (res.status === 200) {
            dispatch({
              type: START_CONFERENCE,
              payload: {
                conferenceId: data.id,
                token: res.data,
              },
            })

            return {
              conferenceId: data.id,
              conferenceName: data.name.toString(),
            }
          }
        })
      }
    })
  }
}

export function enterConference(conferenceId, roleId) {
  return (dispatch) => {
    return axios.post(`${config.licodeServerUrl}/createToken/`, {
      username: roleId.toString(),
      room: conferenceId.toString(),
      role: PRESENTER_ROLE,
    }).then((res) => {
      if (res.status === 200) {
        dispatch({
          type: START_CONFERENCE,
          payload: {
            conferenceId,
            token: res.data,
          },
        })
      }
    })
  }
}

export function inviteOthers(affairId, allianceId, ids, roleId, conferenceId) {
  return () => {
    return fetch(`${config.videoURL}/meeting/invite`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        affairId,
        allianceId,
        ids,
        operatorRoleId: roleId,
        roomId: conferenceId,
      })
    }).then((res) => res.json())
  }
}

export const END_CONFERENCE = 'END_CONFERENCE'
export function endConference() {
  return (dispatch) => {
    dispatch({
      type: END_CONFERENCE,
    })
  }
}

export const FETCH_CONFERENCE_INFORMATION = 'FETCH_CONFERENCE_INFORMATION'
export const FETCH_CONFERENCE_ATTENDEES = 'FETCH_CONFERENCE_ATTENDEES'
export const FETCH_CONFERENCE_GROUP_MEMBER = 'FETCH_CONFERENCE_GROUP_MEMBER'
export function fetchConferenceInformation(conferenceId, roleId) {
  return (dispatch) => {
    // 获取会议的基本信息。
    fetch(`${config.videoURL}/meeting/info?roomId=${conferenceId}`, {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        dispatch({
          type: FETCH_CONFERENCE_INFORMATION,
          payload: res.data,
        })
      }

      return res
    }).then((res) => {
      // 获取会议讨论组的成员
      if (res.code === 0) {
        const data = res.data
        // 获取讨论组的成员列表
        fetch(config.api.chat.memberList(data.chatGroupId), {
          method: 'GET',
          credentials: 'include',
          affairId: data.affairId,
          roleId: roleId,
        }).then((res) => res.json()).then((res) => {
          if (res.code === 0) {
            dispatch({
              type: FETCH_CONFERENCE_GROUP_MEMBER,
              payload: res.data,
            })
          }
        })
      }
    })

    // 获取应该参与视频会议的所有成员。
    fetch(`${config.videoURL}/meeting/members?roomId=${conferenceId}`, {
      method: 'GET',
      credentials: 'include',
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        dispatch({
          type: FETCH_CONFERENCE_ATTENDEES,
          payload: res.data,
        })
      }
    })
  }
}

export const REMIND_JOIN = 'REMIND_JOIN'
export function remindAttendeeJoin(affair, remindList, roleId, roomId) {
  return () => {
    fetch(`${config.videoURL}/meeting/remind`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        affairId: affair.get('id'),
        allianceId: affair.get('allianceId'),
        ids: remindList,
        operatorRoleId: roleId,
        roomId: roomId,
      })
    })
  }
}

export const REFUSE_CONFERENCE_INVITATION = 'REFUSE_CONFERENCE_INVITATION'
export function refuseConferenceInvitation(notificationId) {
  return (dispatch) => {
    dispatch({
      type: REFUSE_CONFERENCE_INVITATION,
      payload: {
        notificationId,
      },
    })
  }
}




export const ENTER_BOARD = 'ENTER_BOARD'
export function enterBoard(affairId, roleId, roomId, allianceId) {
  return (dispatch) => {
    fetch(`${config.videoURL}/board/list?roomId=${roomId}`, {
      method: 'GET',
      credentials: 'include',
      affairId: affairId,
      roleId: roleId
    }).then((res) => res.json()).then((res) => {
      if (res.code === 0) {
        const list = res.data
        if (list && list.length > 0) {
          const board = list[0]
          dispatch({
            type: ENTER_BOARD,
            board
          })
        } else {
          // 调用 create board 接口

          fetch(`${config.videoURL}/board/create`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            affairId: affairId,
            roleId: roleId,
            body: JSON.stringify({
              roleId: roleId,
              allianceId: allianceId,
              roomId: roomId,
            })
          }).then((res) => res.json()).then((res) => {
            if (res.code === 0) {
              const board = res.data
              dispatch({
                type: ENTER_BOARD,
                board
              })
            }
          })
        }
      }
    })
  }
}
