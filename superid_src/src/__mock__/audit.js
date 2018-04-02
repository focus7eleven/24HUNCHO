// import FetchMock from 'fetch-mock'
// import Mock from 'mockjs'
//
// const Random = Mock.Random
//
// FetchMock.mock(/audit\/config\/modules/, Mock.mock({
//   code: 0,
//   'data|5-10': [{
//     id: () => Random.increment(),
//     name: () => Random.ctitle(2, 2),
//   }]
// }))
//
// FetchMock.mock(/audit\/config\/[0-9]*\/[0-9]*\/info/, Mock.mock({
//   code: 0,
//   'data|5-10': [{
//     operationId: () => Random.increment(),
//     operationName: () => Random.ctitle(),
//     'auditors|1-10': [{
//       name: () => Random.cname(),
//       avatar: () => Random.image(),
//       'applyChild|0-1': 0,
//       'fromParent|0-1': 0,
//       parentAffair: () => Random.ctitle(),
//     }],
//     'criterias|0-3': [{
//       name: () => Random.ctitle(),
//       'fromParent|0-1': 0,
//       parentAffair: () => Random.ctitle(),
//       'auditors|1-3': [{
//         name: () => Random.cname(),
//         avatar: () => Random.image(),
//         'applyChild|0-1': 0,
//       }],
//     }]
//   }]
// }))
//
// FetchMock.mock(/audit\/config\/[0-9]*\/getAuditAffair/, Mock.mock({
//   code: 0,
//   'data|5-10': [{
//     id: () => Random.increment(),
//     name: () => Random.ctitle(2, 2),
//   }]
// }))
//
// FetchMock.mock(/audit\/config\/[0-9]*\/[0-9]*\/all/, Mock.mock({
//   code: 0,
//   'data|5-10': [{
//     operationId: () => Random.increment(),
//     operationName: () => Random.ctitle(),
//     addRoleName: () => Random.cname(),
//     addTime: /[0-9]{13,13}/,
//     'children|0-1': [{
//       operationId: () => Random.increment(),
//       operationName: () => Random.ctitle(),
//       addRoleName: () => Random.cname(),
//       addTime: /[0-9]{13,13}/,
//     }]
//   }]
// }))
