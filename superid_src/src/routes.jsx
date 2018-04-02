import React from 'react'
import { syncHistoryWithStore } from 'react-router-redux'
import { DefaultHeaderHOC } from './enhancers/Header'
import { LoginControlHOC } from './enhancers/AccessControlContainer'
import { Router, Route, browserHistory, IndexRoute, IndexRedirect, Redirect } from 'react-router' // eslint-disable-line
import AnnouncementEditor from './containers/announcement/AnnouncementEditor'
import EnterpriseValidateComponent, { ValidateResultComponent } from './containers/alliance/EnterpriseValidateContainer'
import AffairIndexContainer from './containers/affair/AffairIndexContainer'
import NoticeContainer from './containers/notice/NoticeContainer'
import AffairHomepageContainer from './containers/affair/AffairHomepageContainer'
import AffairFileContainer from './containers/file/AffairFileContainer'
import FileTrashContainer from './containers/file/FileTrashContainer'
import FileListContainer from './containers/file/FileListContainer'
import GeneralJournalEntries from 'containers/transaction/GeneralJournalEntries'
import GeneralJournalSummaryEntries from 'containers/transaction/GeneralJournalSummaryEntries'
import AnnouncementListContainer from './containers/announcement/AnnouncementListContainer'
import AnnouncementIndexContainer from './containers/announcement/AnnouncementIndexContainer'
import InnerAnnouncementContainer from './containers/announcement/inner/InnerAnnouncementContainer'
import InteractAnnouncementContainer from './containers/announcement/interact/InteractAnnouncementContainer'
import AnnouncementMoveModal from './containers/announcement/detail/AnnouncementMoveModal'
import AnnouncementMeetingModal from './containers/announcement/detail/AnnouncementMeetingModal'
import CurrentRoleContainer from './containers/attender/role/CurrentRoleContainer'
import HistoryRoleContainer from './containers/attender/role/HistoryRoleContainer'
import CurrentMemberContainer from './containers/attender/member/CurrentMemberContainer'
import AddAllianceMemberContainer from './containers/alliance/AddAllianceMemberContainer'
import PublishAnnouncementContainer from './containers/announcement/PublishAnnouncement'
import SVGDemoComponent from './components/SVGDemoComponent'
import AnnouncementDetail from './containers/announcement/AnnouncementDetail'
import AnnouncementDetailNew from './containers/announcement/AnnouncementDetailNew'
import EditLogoModal from './components/modal/EditLogoModal'
import TaskIndexContainer from './containers/task/TaskIndexContainer'
import TaskDetailContainer from './containers/task/TaskDetailContainer'
import WarehouseList from './containers/repo/WarehouseList'
import PublicWarehouse from './containers/repo/PublicWarehouse'
import AssetList from './containers/repo/AssetList'
import AssetDetail from './containers/repo/AssetDetail'
import WarehouseActivity from './containers/repo/WarehouseActivity'
import ShareAffairContainer from './containers/share/ShareAffairContainer'
import MobileShareAffairContainer from './containers/share/MobileShareAffairContainer'
import AffairPlanContainer from './containers/plan/AffairPlanContainer'
import { VideoConferenceHOC } from './containers/conference/VideoConferenceHOC'
import CreateAnnouncementModal from './containers/announcement/create/CreateAnnouncementModal'
import MoneyRepoContainer from './containers/repo/MoneyRepoContainer'
import MoneyRepoManagement from 'containers/repo/MoneyRepoManagement'
import AssetRepoContainer from './containers/repo/AssetRepoContainer'

import RoleContainer from './containers/profile/RoleDetailMultiple'
import AuditIndexContainer from './containers/affair/setting/audit/AuditIndexContainer'
import AffairChatContainer from './containers/chat/AffairChatContainer'
import BoardContainer from './containers/board/BoardContainer'

import AffairBasicSettingContainer from 'containers/affair/setting/AffairBasicSettingContainer'
import FirmVerificationContainer from 'containers/affair/setting/FirmVerificationContainer'
import AuthContainer from 'containers/affair/setting/AuthContainer'
import HomepageSetting from 'containers/affair/setting/HomepageSetting'

import NavRoute from 'components/route/NavRoute'
import PERMISSION from 'utils/permission'
import FileRepoContainer from './containers/file/FileRepoContainer'

const componentCacheWrapper = (func) => {
  let context = {}

  return (nextState, cb) => func(nextState, cb, context)
}

const routes = (store) => (
  <Router history={syncHistoryWithStore(browserHistory, store, { selectLocationState: (state) => state.get('routing') })}>
    <Route path="/bound" getComponent={(nextState, cb) => {
      require(['./containers/profile/BoundOthersModal'], (Component) => {
        cb(null, Component.default)
      })
    }}
    />
    <Route path="/" getComponent={(nextState, cb) => {
      require(['./containers/AppContainer'], (Component) => {
        cb(null, Component.default)
      })
    }}
    >
      <IndexRedirect to="workspace" />
      <Route path="login" getComponent={(nextState, cb) => {
        require(['./containers/LoginContainer'], (Component) => {
          cb(null, Component.default)
        })
      }}
      />
      <Route path="signup" getComponent={(nextState, cb) => {
        require(['./containers/LoginContainer'], (Component) => {
          cb(null, Component.default)
        })
      }}
      />
      <Route path="reset" getComponent={(nextState, cb) => {
        require(['./containers/LoginContainer'], (Component) => {
          cb(null, Component.default)
        })
      }}
      />
      <Route path="profile" getComponent={(nextState, cb) => {
        require(['./containers/profile/ProfileContainer'], (Component) => {
          cb(null, LoginControlHOC(DefaultHeaderHOC(Component.default)))
        })
      }}
      />

      <Route path="menkor" getComponent={(nextState, cb) => {
        require(['./containers/MenkorContainer', './enhancers/MenkorHeader'], (Component, MenkorHeaderHOC) => {
          cb(null, LoginControlHOC(MenkorHeaderHOC.MenkorHeaderHOC(Component.default)))
        })
      }}
      >
        <IndexRoute getComponent={(nextState, cb) => {
          require(['./containers/menkor/MenkorIndexContainer'], (Component) => {
            cb(null, Component.default)
          })
        }}
        />
        <Route path="(:id)" getComponent={(nextState, cb) => {
          require(['./containers/menkor/detail/MenkorDetailContainer'], (Component) => {
            cb(null, Component.default)
          })
        }}
        />
      </Route>

      <Route path="workspace"
        getComponent={componentCacheWrapper((nextState, cb, context) => {
          require(['./containers/WorkspaceContainer'], (Component) => {
            context.cache = context.cache || LoginControlHOC(VideoConferenceHOC(DefaultHeaderHOC(Component.default)))
            cb(null, context.cache)
          })
        })}
      >
        <Route path="alliance/(:id)/verification" component={EnterpriseValidateComponent} />
        <Route path="plan/(:id)" component={AffairPlanContainer} />
        <Route path="affair/(:id)" component={AffairIndexContainer}>
          <IndexRoute component={AffairHomepageContainer} />
          <Route path="editLogo" component={EditLogoModal} />
          <Route path="announcement2">
            <IndexRoute component={AnnouncementListContainer} />
            <Route path="publish" component={PublishAnnouncementContainer} />
            <Route path="draft/(:draftId)" component={PublishAnnouncementContainer} />
            <Route path="detail/(:announcementid)" component={AnnouncementDetail} />

          </Route>
          <Route
            path="announcement"
            component={(props) =>
              <NavRoute
                {...props}
                path="announcement"
                options={[
                  { tabName: '内部发布', tabPath: 'inner', permission: PERMISSION.ENTER_PUBLISH_STORE },
                  { tabName: '协作发布', tabPath: 'interact', permission: PERMISSION.ENTER_PUBLISH_STORE },
                ]}
              />
            }
          >
            <IndexRedirect to="inner" />
            <Route path="inner" component={InnerAnnouncementContainer} />
            <Route path="interact" component={InteractAnnouncementContainer}/>
            <Route path="inner/detail/(:announcementid)" component={AnnouncementDetailNew} />
            <Route path="interact/detail/(:announcementid)" component={AnnouncementDetailNew} />
            <Route path="detail/(:announcementid)" component={AnnouncementDetailNew} />
          </Route>
          <Route path="file" component={AffairFileContainer}>
            {/*<IndexRedirect to="0/path=%2F" /> */}
            <IndexRedirect to="repo" />
            <Route path="repo" component={FileRepoContainer} />
            <Route path="trash/path=(:path)" component={FileTrashContainer} />
            <Route path="(:folderId)/path=(:path)" component={FileListContainer} />
            <Redirect from="trash" to="trash/path=%2F" />
            <Redirect from="(:folderId)/path" to="(:folderId)/path=%2F" />
          </Route>
          <Route
            path="role"
            component={(props) =>
              <NavRoute
                {...props}
                path="role"
                options={[
                  { tabName: '当前角色', tabPath: 'current', permission: PERMISSION.ENTER_ROLE_STORE },
                  { tabName: '历史角色', tabPath: 'history', permission: PERMISSION.CHECK_HISTORY_ROLE },
                ]}
              />
            }
          >
            <IndexRedirect to="current" />
            <Route path="current" component={CurrentRoleContainer} />
            <Route path="history" component={HistoryRoleContainer} />
          </Route>
          <Route path="task" component={TaskIndexContainer} />
          <Route path="task/(:taskId)" component={TaskDetailContainer} />
          <Route
            path="transaction"
            component={(props) =>
              <NavRoute
                {...props}
                path="transaction"
                options={[
                  { tabName: '流水表', tabPath: 'flow', permission: null },
                  { tabName: '往来汇总表', tabPath: 'summary', permission: null },
                ]}
              />
            }
          >
            <IndexRedirect to="flow" />
            <Route path="flow" component={GeneralJournalEntries} />
            <Route path="summary" component={GeneralJournalSummaryEntries} />
          </Route>
          <Route
            path="repo"
            component={(props) =>
              <NavRoute
                {...props}
                path="repo"
                options={[
                  { tabName: '成员库', tabPath: 'members', permission: PERMISSION.ENTER_MEMBER_STORE },
                  { tabName: '资金库', tabPath: 'funds', permission: PERMISSION.ENTER_FUND_STORE },
                  { tabName: '物资库', tabPath: 'assets', permission: PERMISSION.ENTER_MATERIAL_STORE },
                ]}
              />
            }
          >
            <IndexRedirect to="members" />
            <Route path="members" component={CurrentMemberContainer} />
            <Route
              path="funds"
              component={(props) => {
                const { children, ...otherProps } = props
                return props.affair && React.cloneElement(children, otherProps)
              }}
            >
              <IndexRoute component={MoneyRepoContainer} />
              <Route path="managerView" component={MoneyRepoManagement} />
            </Route>
            <Route path="assets" component={AssetRepoContainer}>
              <IndexRoute component={WarehouseList}/>
              <Route path="warehouse/(:warehouseId)" component={PublicWarehouse} />
              <Route path="warehouse/(:warehouseId)/activity" component={WarehouseActivity} />
              <Route path="warehouse/(:warehouseId)/material/(:materialId)" component={AssetDetail} />
              <Route path="asset" component={AssetList} />
            </Route>
          </Route>

          <Route path="chat" component={AffairChatContainer} />
          <Route
            path="setting"
            component={(props) =>
              <NavRoute
                {...props}
                path="setting"
                options={[
                  { tabName: '基本信息', tabPath: 'basic', permission: null },
                  { tabName: '认证信息', tabPath: 'verification', permission: null },
                  { tabName: '权限设置', tabPath: 'auth', permission: null },
                  { tabName: '审批设置', tabPath: 'audit', permission: PERMISSION.SET_APPROVAL },
                  // { tabName: '首页设置', tabPath: 'homepage', permission: PERMISSION.SET_AFFAIR_HOME },
                ]}
              />
            }
          >
            <IndexRedirect to="basic" />
            <Route path="basic" component={AffairBasicSettingContainer} />
            <Route path="verification" component={FirmVerificationContainer} />
            <Route path="auth" component={AuthContainer} />
            <Route path="audit" component={AuditIndexContainer} />
            <Route path="homepage" component={HomepageSetting} />
          </Route>
          <Redirect from="*" to="/workspace/affair/(:id)" />
        </Route>
        <Route path="board/(:id)" component={BoardContainer} />
        <Route path="alliance/(:id)/validateresult" component={ValidateResultComponent} />
        <Route path="addAllianceMember" component={AddAllianceMemberContainer} />
        <Route path="notifications" component={NoticeContainer} />
      </Route>

      <Route path="draft" component={LoginControlHOC(AnnouncementEditor)} />

      <Route path="svg" component={SVGDemoComponent} />

      <Route path="share/(:shareId)" component={ShareAffairContainer} />

      <Route path="mobile/share/(:shareId)" component={MobileShareAffairContainer} />

      <Route path="roleDetail/(:affairId)/(:optId)/(:id)" component={LoginControlHOC(DefaultHeaderHOC(RoleContainer))}/>

      <Route path="test">
        <Route path="announcement" component={AnnouncementIndexContainer}>
          <IndexRedirect to="inner" />
          <Route path="inner" component={InnerAnnouncementContainer} />
          <Route path="interact" component={InteractAnnouncementContainer} />
          <Route path="create_announcement" component={CreateAnnouncementModal} />
          <Route path="move" component={AnnouncementMoveModal} />
          <Route path="meeting" component={AnnouncementMeetingModal} />
          /*announcement detail fake page*/
          <Route path="detail/(:detailId)" component={AnnouncementDetailNew} />
        </Route>
      </Route>
    </Route>
  </Router>
)

export default routes
