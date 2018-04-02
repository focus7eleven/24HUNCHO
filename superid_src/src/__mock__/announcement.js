// import FetchMock from 'fetch-mock'
// import Mock from 'mockjs'

// const Random = Mock.Random
// const announcementItem = {
//   'affairId|1-10000': 1,
//   'affairName': () => Random.ctitle(),
//   'allTaskNum|29-76': 1,
//   'announcementId|5000-10000': 1,
//   'childAnnouncementNum|0-72': 1,
//   'commentNum|0-100': 0,
//   'creatorId|1-10000': 0,
//   'creatorUserId|1-10000': 0,
//   'entityMap': 'string',
//   'finishedTaskNum|0-19': 0,
//   'index|2000-9990': 200,
//   'meetingNum|1-100': 0,
//   'modifyTime': /^[0-9]{13,13}/,
//   'params': {
//     'additionalProp1': 'string',
//     'additionalProp2': 'string',
//     'additionalProp3': 'string'
//   },
//   'parentId|1-10000': 0,
//   'plateType|0-2': 0,
//   'thumbContent': 'string',
//   'title': () => Random.csentence(),
//   'top|1': true,
//   'type': 0,
//   'username': () => Random.cname(),
//   'roleName': () => Random.ctitle(),
//   'fakeContent': () => Random.cparagraph(),
//   'tags': /^\[("[a-zA-Z]{3,7}",){0,5}"[a-zA-Z]{3,7}"\]/,
//   'memberType|0-3': 0,
//   'parentAnnouncement|1': [{
//     'index|1-1999': 0,
//     'announcementId|1-4999': 1,
//     'title': () => Random.csentence(),
//   },
//     null
//   ],
// }
// const meetingItem = {
//   address: () => Random.ctitle(),
//   beginTime: /^[0-9]{13,13}/,
//   lastTime: () => Random.integer(1, 10),
//   meetingId: () => Random.increment(),
//   name: () => Random.cname(),
//   note: () => Random.csentence(),
//   joinRoles: [
//     {
//       avatar: '',
//       roleId: () => Random.integer(100, 2000),
//       roleTitle: () => Random.ctitle(),
//       type: 0,
//       userId: () => Random.integer(2011, 4455),
//       username: () => Random.cname()
//     }
//   ],
//   state: () => Random.integer(0, 1),
//   'meetingFiles|0-2': [{
//     fileUrl: '',
//     fileName: /^[a-zA-Z]{1,15}\.[(jpg)|(png)|(pdf)]/,
//   }],
// }
// FetchMock.mock(/announcement\/overview_inner/, {
//   code: 0,
//   data: Mock.mock({
//     'hasMore|1': true,
//     'list|10-20': [announcementItem],
//   })
// })
//
// FetchMock.mock(/announcement\/details\?announcementId=\d+/, {
//   code: 0,
//   data: Mock.mock({
//     // 'memberType|0-3': 0,
//     'memberType': 3,
//   })
// })
//
// FetchMock.mock(/announcement\/overview_outer/, {
//   code: 0,
//   data: Mock.mock({
//     'hasMore|1': true,
//     'list|10-20': [announcementItem],
//   })
// })
//
// function getRole(){
//   return Mock.mock({
//     'avatar': Random.image(),
//     'roleId': Random.natural(),
//     'roleTitle': Random.ctitle(),
//     'type':0,
//     'userId|+1': 3550,
//     'username': Random.cname()
//   })
// }
//
// function getAvatar(){
//   return Random.image()
// }
//
// function getSentence(){
//   return Random.csentence()
// }
//
// function getTitle(){
//   return Random.ctitle()
// }
//
// function getName(){
//   return Random.cname()
// }
//
// function getTime(){
//   return Random.date(dateFormat)
// }
//
// function getNatural(){
//   return Random.natural()
// }
//
// function getPagraph(){
//   return Random.cparagraph()
// }
//
// FetchMock.mock(/announcement\/add_comment/, (url, option) => {
//   const body = JSON.parse(option.body)
//   return {
//     code: 0,
//     data: Mock.mock(
//       {
//         'id|+1': 1050,
//         'role': getRole(),
//         'toRole': body.toRoleId !== null ? getRole() : null,
//         'createTime': Random.now(dateFormat),
//         'content': body.content,
//       }
//     )
//   }
//
// })
//
// //移除评论
// FetchMock.mock(/announcement\/remove_comment\?commentId=\d+&announcementId=\d+/, {
//   code: 0,
//   data: null,
// })

// 更新标签
// FetchMock.mock(/announcement\/tags/, {
//   code: 0,
//   data: null,
// })

//
// //获取动态列表
// FetchMock.mock(/announcement\/dynamic\/announcementId=\d+/, () => {
//   // const limit = JSON.parse(option.body).limit
//   return {
//     code: 0,
//     data: Mock.mock({
//       'hasMore': true,
//       'simpleDynamicVOs|10':[
//         {
//           'announcementId':1001,
//           'avatar': getAvatar(),
//           'operationDescription': getSentence(),
//           'roleId|+1':1000,
//           'roleName': getTitle(),
//           'title': getTitle(),
//           'username': getName(),
//           'modifyTime': getTime(),
//           'type|0-3': 0,
//           'param':{
//             'respAvatar': getAvatar(),
//             'endTime':getTime(),
//             'startTime': getTime(),
//             'lastTime': null,
//             'place':getTitle(),
//             'subType|0-2': 0,
//           }
//         }
//       ]
//
//     })
//   }
// })
//
//
// //获取官客房列表
// FetchMock.mock(/announcement_member\/(authority|guest)\?announcementId=\d+/, () => {
//   let rolesList = []
//   for (let i = 0; i < 10 ; i ++){
//     rolesList.push(getRole())
//   }
//   return {
//     code: 0,
//     data: rolesList,
//   }
// })
//
// //移除官客方
// FetchMock.mock(/announcement_member\/remove/, {
//   code: 0,
//   data: null,
// })
//
// FetchMock.mock(/announcement\/create_task/, () => {
//   // const body = JSON.parse(options.body)
//   return {
//     code: 0,
//     data: null,
//   }
// })
//
// FetchMock.mock(/announcement\/modify_task/, () => {
//   return {
//     code: 0,
//     data: null,
//   }
// })
//
// FetchMock.mock(/announcement\/show_task_list/, () => {
//   return {
//     code: 0,
//     data: Mock.mock({
//       'hasMore': true,
//       'taskList|10': [{
//         'createRoleId|+1': getNatural(),
//         'name': getTitle(),
//         'note': getPagraph(),
//         'offTime': getTime(),
//         'createTime': getTime(),
//         'overdue|1': true,
//         'roles|5':[getRole()],
//         'ownerRole': getRole(),
//         'state|0-4': 0,
//         'taskId|+1': getNatural(),
//       }]
//     })
//   }
// })
//
// FetchMock.mock(/announcement\/delete_task/, () => {
//   return {
//     code: 0,
//     data: null,
//   }
// })


// FetchMock.mock(/announcement\/create_new/, {
//   code: 0,
//   data: Mock.mock({})
// })
// FetchMock.mock(/announcement\/create_new/, {
//   code: 0,
//   data: Mock.mock({})
// })
// FetchMock.mock(/announcement\/direct_child_announcement/, {
//   code: 0,
//   data: Mock.mock({
//     'hasMore|1': true,
//     'list|10-20': [announcementItem],
//   })
// })
// FetchMock.mock(/announcement\/details/, {
//   code: 0,
//   data: Mock.mock(announcementItem)
// })
// FetchMock.mock(/announcement\/search_for_move/, {
//   code: 0,
//   data: Mock.mock({
//     'hasMore|1': true,
//     'list|5-50': [announcementItem],
//   })
// })
// FetchMock.mock(/announcement\/move/, {
//   code: 0,
//   data: Mock.mock({})
// })
// FetchMock.mock(/announcement\/create_new/, {
//   code: 0,
//   data: Mock.mock({})
// })
// /*
// *  会议相关
// */
// FetchMock.mock(/announcement\/create_meeting/, {
//   code: 0,
//   data: Mock.mock({})
// })
// FetchMock.mock(/announcement\/modify_meeting/, {
//   code: 0,
//   data: Mock.mock({})
// })
// FetchMock.mock(/announcement\/delete_meeting/, {
//   code: 0,
//   data: Mock.mock({})
// })
// FetchMock.mock(/announcement\/cancel_meeting/, {
//   code: 0,
//   data: Mock.mock({})
// })
// FetchMock.mock(/announcement\/show_meeting_list/, {
//   code: 0,
//   data: Mock.mock({
//     'hasMore|1': true,
//     'list|5-50': [meetingItem],
//   })
// })
// FetchMock.mock(/announcement\/show_meeting/, {
//   code: 0,
//   data: Mock.mock(meetingItem)
// })
// FetchMock.mock(/announcement\/comment_list\?announcementId=\d+/, {
//   code: 0,
//   data: Mock.mock(function(){
//     let result=[]
//     for (let i = 0; i < 10; i ++){
//       let item = null
//       if (i%2===0){
//         item = {
//           'createTime':Random.date('yyyy-MM-dd hh:mm:ss'),
//           'id|+1': 1000,
//           'content':Random.csentence(),
//           'role':{
//             'avatar': Random.image(),
//             'roleId|+1': 2000,
//             'roleTitle': Random.ctitle(),
//             'type': 0,
//             'userId|+1': 3000,
//             'username': Random.cname(),
//           },
//           'toRole': {
//             'avatar': Random.image(),
//             'roleId|+1': 2500,
//             'roleTitle': Random.ctitle(),
//             'type':0,
//             'userId|+1': 3500,
//             'username': Random.cname()
//           }
//         }
//       } else {
//         item = {
//           'createTime':Random.date('yyyy-MM-dd hh:mm:ss'),
//           'id|+1': 1000,
//           'content':Random.csentence(),
//           'role':{
//             'avatar': Random.image(),
//             'roleId|+1': 2000,
//             'roleTitle': Random.ctitle(),
//             'type': 0,
//             'userId|+1': 3000,
//             'username': Random.cname(),
//           },
//           'toRole': null,
//         }
//       }
//       result.push(item)
//     }
//     return result
//   })
// })
