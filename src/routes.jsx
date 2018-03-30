import React from 'react'
import Bundle from './components/route/Bundle'
import AppContainer from './containers/AppContainer'
import LoginControlHOC from './containers/AccessControlContainer'
import BaseContainer from 'bundle-loader?lazy!./containers/BaseContainer'
import LoginContainer from 'bundle-loader?lazy!./containers/LoginContainer'
import AnnouncementEditor from 'bundle-loader?lazy!./components/editor/AnnouncementEditor'
import CanvasContainer from 'bundle-loader?lazy!./containers/test/CanvasContainer'
import TestContainer from 'bundle-loader?lazy!./containers/test/TestContainer'
import CourseInfoContainer from 'bundle-loader?lazy!./containers/course/CourseInfoContainer'
import DepartmentInfoContainer from 'bundle-loader?lazy!./containers/course/DepartmentInfoContainer'
import CourseIndexContainer from 'bundle-loader?lazy!./containers/course/CourseIndexContainer'
import ActivityList from 'bundle-loader?lazy!./containers/activity/ActivityList'
import ActivityDetail from 'bundle-loader?lazy!./containers/activity/ActivityDetail'
import MemberContainer from 'bundle-loader?lazy!./containers/member/MemberContainer'
import FileListContainer from 'bundle-loader?lazy!./containers/file/FileListContainer'
import ChatContainer from 'bundle-loader?lazy!./containers/chat/ChatContainer'
import GroupContainer from 'bundle-loader?lazy!./containers/group/GroupContainer'
import TestModalContainer from 'bundle-loader?lazy!./containers/test/TestModalContainer'
import TestCardContainer from 'bundle-loader?lazy!./containers/test/TestCardContainer'
import SVGDemoComponent from 'bundle-loader?lazy!./containers/test/SVGDemoComponent'

import MyNoticeContainer from 'bundle-loader?lazy!./containers/notification/myNotice/MyNoticeContainer'

const Loading = () => (<div>Loading...</div>)

// 通过 bundle-loader & createComponent 实现按需加载
const createComponent = component => props => (
  <Bundle load={component}>
    {
      Comp => (Comp ? <Comp {...props} /> : <Loading />)
    }
  </Bundle>
)

const routes = [{
  path: '/',
  component: AppContainer,
  routes: [{
    path: '/login',
    component: createComponent(LoginContainer)
  }, {
    path: '/index',
    component: LoginControlHOC(createComponent(BaseContainer)),
    routes: [{
        path: '/index/department/:departmentId/info',
        exact: true,
        component: createComponent(DepartmentInfoContainer)
      }, {
        path: '/index/course/:id/info',
        exact: true,
        component: createComponent(CourseInfoContainer)
      }, {
        path: '/index/course/:id/member',
        exact: true,
        component: createComponent(MemberContainer)
      }, {
        path: '/index/course/:id/activity',
        exact: true,
        component: createComponent(ActivityList)
      }, {
        path: '/index/course/:id/activity/:activityId',
        exact: true,
        component: createComponent(ActivityDetail)
      }, {
        path: '/index/course/:id/file/:folderId/path=:path',
        exact: true,
        component: createComponent(FileListContainer)
      }, {
        path: '/index/course/:id/group',
        exact: true,
        component: createComponent(GroupContainer),
      }, {
        path: '/index/course/:id/chat',
        exact: true,
        component: createComponent(ChatContainer),
      }, {
        path: '/index/course/:id/group/:groupId/member',
        exact: true,
        component: createComponent(MemberContainer)
      }, {
        path: '/index/course/:id/group/:groupId/file/:folderId/path=:path',
        exact: true,
        component: createComponent(FileListContainer)
      }, {
        path: '/index/course/:id/group/:groupId/activity',
        exact: true,
        component: createComponent(ActivityList)
      }, {
        path: '/index/course/:id/group/:groupId/chat',
        exact: true,
        component: createComponent(ChatContainer)
      }, {
        path: '/index/course/:id/group/:groupId/activity/:activityId',
        exact: true,
        component: createComponent(ActivityDetail),
      }]
  }, {
    path: '/test',
    component: createComponent(TestContainer),
    routes: [{
      path: '/test/editor',
      component: createComponent(AnnouncementEditor)
    }, {
      path: '/test/card',
      component: createComponent(TestCardContainer)
    }, {
      path: '/test/svg',
      component: createComponent(SVGDemoComponent)
    }, {
      path: '/test/modal',
      component: createComponent(TestModalContainer)
    }, {
      path: '/test/canvas',
      component: createComponent(CanvasContainer)
    }, {
      path: '/test/myNotice',
      component: createComponent(MyNoticeContainer)
    }]
  }]
}]

export default routes
