import React from "react";
import {MentionAround, SettingAround, TaskAround} from "svg";

export const notificationProcessor = {
    // 邀请加入盟
    53: (noti) => null,
}

// export const notificationProcessor = [
//     //type 0
//     [
//         //角色名+用户名+在 事务名称 + 提到了你，点击查看：事务名称＋时间
//         (noti) => {
//             return renderLinks1(noti, "affair", <MentionAround />);
//         },
//         //角色名+用户名+在 任务名称 + 提到了你，点击查看：任务名称＋时间
//         (noti) => {
//             return renderLinks1(noti, "task", <MentionAround />);
//         },
//     ],
//     //type 1
//     [
//         //创建任务：角色名+用户名+在+事务名称+创建了任务，点击查看：任务名称＋时间
//         (noti) => {
//             return renderLinks1(noti, "task", <TaskAround />);
//         },
//         //更新任务：角色名+用户名+在+任务名称+发布发布/上传了文件/创建了合同，点击查看：发布／文件／合同名称＋时间
//         (noti) => {
//             return renderLinks1(noti, "file", <TaskAround />);
//         },
//         //任务即将到期：任务名称+还有+n+天到期＋时间
//         (noti) => {
//             return renderLink2(noti, "task", <TaskAround />);
//         },
//         //任务已过期：任务名称+已经超期了＋时间
//         (noti) => {
//             return renderLink2(noti, "task", <TaskAround />);
//         },
//     ],
//     //type 2
//     [
//         //加入盟：角色名+用户名+已经将你加为+盟名称+的成员 ＋时间
//         (noti) => {
//             return renderLink2(noti, "user", <SettingAround />);
//         },
//         //加入事务：角色名+用户名+已经将你加为+盟名称+事务名称+的成员＋时间
//         (noti) => {
//             return renderLink2(noti, "user", <SettingAround />);
//         },
//         //盟友申请：盟名称+角色名+用户名+申请加您为盟友，立即处理＋时间
//         (noti) => {
//           let content = noti.get('content'),urls = noti.get('urls');
//             let links = [<a href="#">{content.substring(urls.get(0).get('begin'), urls.get(0).get('end'))}</a>,
//                 <a onClick="">{content.substring(urls.get(1).get('begin'), urls.get(1).get('end'))}</a>]
//             return (
//               <div className="flex">
//                     <SettingAround />
//                 <div>
//                   {content.substring(0, urls.get(1).get('begin'))}
//                   {links[1]}
//                   {content.substring(urls.get(1).get('end'), urls.get(0).get('begin'))}
//                   {links[0]}
//                 </div>
//                 </div>
//             )
//         },
//         //通过盟友申请：盟名称+角色名+用户名+通过您的盟友申请，你们已经是盟友了！
//         (noti) => {
//             return renderLink2(noti, "user", <SettingAround />)
//         },
//         //移动事务申请：角色名称+姓名+申请将事务+事务名称+移动至+父事务名称+下，立即处理 + 时间
//         (noti) => {
//           let content = noti.get('content'),urls = noti.get('urls');
//             let links = [<a href="#">{content.substring(urls.get(0).get('begin'), urls.get(0).get('end'))}</a>,
//                 <a href="#">{content.substring(urls.get(1).get('begin'), urls.get(1).get('end'))}</a>,
//                 <a href="#">{content.substring(urls.get(2).get('begin'), urls.get(2).get('end'))}</a>,
//                 <a onClick="">{content.substring(urls.get(3).get('begin'), urls.get(3).get('end'))}</a>]
//             return (
//               <div className="flex">
//                     <SettingAround />
//                 <div>
//                   {content.substring(0, urls.get(1).get('begin'))}
//                   {links[1]}
//                   {content.substring(urls.get(1).get('end'), urls.get(2).get('begin'))}
//                   {links[2]}
//                   {content.substring(urls.get(2).get('end'), urls.get(3).get('begin'))}
//                   {links[3]}
//                   {content.substring(urls.get(3).get('end'), urls.get(0).get('begin'))}
//                   {links[0]}
//                 </div>
//                 </div>
//             )
//         },
//         //移动事务申请成功：您申请将事务+事务名称+移动至+父事务名称+已成功 + 时间
//         (noti) => {
//           let content = noti.get('content'),urls = noti.get('urls');
//             let links = [<a onClick="">{content.substring(urls.get(0).get('begin'), urls.get(0).get('end'))}</a>,
//                 <a href="#">{content.substring(urls.get(1).get('begin'), urls.get(1).get('end'))}</a>]
//             return (
//               <div className="flex">
//                     <SettingAround />
//                 <div>
//                   {content.substring(0, urls.get(0).get('begin'))}
//                   {links[0]}
//                   {content.substring(urls.get(0).get('end'), urls.get(1).get('begin'))}
//                   {links[1]}
//                 </div>
//                 </div>
//             )
//         },
//         //移动事务申请失败：您申请将事务+事务名称+移动至+父事务名称+没有通过审核，联系+角色名称+姓名 + 时间
//         (noti) => {
//           let content = noti.get('content'),urls = noti.get('urls');
//             let links = [<a href="#">{content.substring(urls.get(0).get('begin'), urls.get(0).get('end'))}</a>,
//                 <a href="#">{content.substring(urls.get(1).get('begin'), urls.get(1).get('end'))}</a>,
//                 <a href="#">{content.substring(urls.get(2).get('begin'), urls.get(2).get('end'))}</a>]
//             return (
//               <div className="flex">
//                     <SettingAround />
//                 <div>
//                   {content.substring(0, urls.get(1).get('begin'))}
//                   {links[1]}
//                   {content.substring(urls.get(1).get('end'), urls.get(2).get('begin'))}
//                   {links[2]}
//                   {content.substring(urls.get(2).get('end'), urls.get(0).get('begin'))}
//                   {links[0]}
//                 </div>
//                 </div>
//             )
//         },
//     ],
// ]

//用户名在第一个且不是重要链接, 有且只有两个链接
const renderLinks1 = (noti, url, icon) =>{
  let content = noti.get('content'),urls = noti.get('urls');
    let links = [<a href="#">{content.substring(urls.get(0).get('begin'), urls.get(0).get('end'))}</a>,
        <a href="#">{content.substring(urls.get(1).get('begin'), urls.get(1).get('end'))}</a>]
    return (
      <div className="flex">
            {icon}
        <div>
              {content.substring(0, urls.get(1).get('begin'))}
              {links[1]}
              {content.substring(urls.get(1).get('end'), urls.get(0).get('begin'))}
              {links[0]}
        </div>
        </div>
    )
};

//只有一个链接
const renderLink2 = (noti, url, icon) => {
  let content = noti.get('content'),urls = noti.get('urls');
    let link = <a href="#">{content.substring(urls.get(0).get('begin'), urls.get(0).get('end'))}</a>;
    return (
        <div className="flex">
            {icon}
          <div>
            {content.substring(0, urls.get(0).get('begin'))}
            {link}
            {content.substring(urls.get(0).get('end'), content.length)}
          </div>
        </div>
    )
}

export default notificationProcessor;