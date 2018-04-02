import * as io from 'socket.io-client'
const url = "http://192.168.1.100:3000";
let instance = null;
class SocketService {

    /**
     * socket.io的初始化,连接,收到消息、回执消息时需要执行的操作
     */
    constructor() {
        if(!instance) {
            instance = this;
        }else {
            return;
        }
        
        this.watchingMessageCallbacks = [];
        this.watchingMessageKeys = [];
        this.onResponseCallbacks = [];

        this.socket = io.connect(url);
        this.socket.on("connect", () => {
            console.log('connect to server');
        });
        this.socket.on('connect_error', () => {
            console.log('Connection failed');
            // this.connectionFailedSource.next(true);
        });
        this.socket.on('message', (msg) => {
            this.onMessage(msg);
        });
        this.socket.on('response', (result) => {
            this.onResponse(result);
        });
        this.socket.on('unread_cout_reponse', (unReadMessages) => {
            console.log('unread_count_response');
            console.log(unReadMessages);
        });
    }

    /**
     * 收到消息后,调用所有的收消息回调函数
     * @param msg
     */
    onMessage(msg):void {
        //call all listener)
        for (let i = 0; i < this.watchingMessageKeys.length; i++) {
            this.watchingMessageCallbacks[this.watchingMessageKeys[i]](msg);
        }
    }

    /**
     * response, 根据内容判断是发送消息回执还是获取未读消息,根据requestId调用回调函数
     * @param result
     */
    onResponse(result):void {
        console.log(result);

        if (result.error) {
            //error
            console.error('error response');
            return;
        }

        if (result.id) {
            //如果有id,则是发送消息的回执
            console.log('receive send message response');
        } else if (result.msg) {
            //如果有消息,则是获取未读消息
            console.log('unRead response');
        }

        if (this.onResponseCallbacks[result.requestId]) {
            this.onResponseCallbacks[result.requestId](result);
            delete this.onResponseCallbacks[result.requestId];
        } else {
            console.error('none response callback');
        }
    }

    /**
     * 注册聊天
     * @param requestId
     * @param userId
     */
    signIn(requestId, token, userId, responseCallback):void {
        this.onResponseCallbacks[requestId] = responseCallback;
        this.socket.emit('sign_in', requestId, token, userId, 'web');
    }

    /**
     * 绑定收消息的回调函数,如果已经绑定直接返回
     * @param func
     * @param listenerId
     */
    bindListener(func, listenerId):void {
        if (this.watchingMessageKeys.indexOf(listenerId) != -1) {
            return;
        }
        this.watchingMessageKeys.push(listenerId);
        this.watchingMessageCallbacks[listenerId] = func;
    }

    /**
     * 发送消息
     * @param requestId
     * @param message
     * @param responseCallback, 收到消息后执行的回调函数
     */
    sendMessage(requestId, message, responseCallback) {
        if (this.onResponseCallbacks[requestId]) {
            return;
        }
        this.onResponseCallbacks[requestId] = responseCallback;
        this.socket.emit('send_message', requestId, message);
    }

    /**
     * 标记单人聊天的最后阅读时间
     * @param userId
     * @param fromRole
     * @param toRole
     * @param affairId
     */
    markSingleReadTime(userId, fromRole, toRole, affairId):void {
        this.socket.emit('mark_read_time', userId, {
            key: this.mergeRole(fromRole, toRole),
            affairId: affairId
        });
    }

    /**
     * 标记讨论组聊天的最后阅读时间
     * @param userId
     * @param groupId
     */
    markGroupReadTime(userId, groupId):void {
        this.socket.emit('mark_read_time', userId, {groupId: groupId});
    }

    /**
     * 获得单人聊天的未读消息
     * @param requestId
     * @param userId
     * @param fromRole
     * @param toRole
     * @param affairId
     * @param responseCallback
     */
    getUnreadSingleMessages(requestId, userId, fromRole, toRole, affairId, responseCallback):void {
        if (this.onResponseCallbacks[requestId]) {
            return;
        }
        this.onResponseCallbacks[requestId] = responseCallback;
        this.socket.emit('unread_message_count', requestId, userId, {
            key: this.mergeRole(fromRole, toRole),
            affairId: affairId
        });
    }

    /**
     * 获得讨论组聊天的未读消息
     * @param requestId
     * @param userId
     * @param groupId
     * @param responseCallback
     */
    getUnreadGroupMessages(requestId, userId, groupId, responseCallback):void {
        if (this.onResponseCallbacks[requestId]) {
            return;
        }
        this.onResponseCallbacks[requestId] = responseCallback;
        this.socket.emit('unread_message_count', requestId, userId, {groupId: groupId});
    }

    getSingleHistoryMessages(requestId, affairId, fromRole, toRole, limit:number, responseCallback, endTime, beginTime) {
        this.onResponseCallbacks[requestId] = responseCallback;
        this.socket.emit(
            'find_message',
            requestId,
            limit,
            {
                affairId: affairId,
                key: this.mergeRole(fromRole, toRole)
            },
            endTime || Date.now(),
            beginTime
        )
        ;
    }

    getGroupHistoryMessages(requestId, groupId, limit, responseCallback, beginTime, endTime) {
        this.onResponseCallbacks[requestId] = responseCallback;
        this.socket.emit('find_message', requestId, limit, {groupId: groupId}, endTime || Date.now(), beginTime);
    }

    /**
     * 随机获得requestId,根据时间戳
     * @returns {string}
     */
    getRequestId() {
        var requestId = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 20; i++) {
            requestId += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return Date.now() + requestId;
    }

    /**
     * 连接两个role生成key,小的在前
     * @param role1
     * @param role2
     * @returns {string}
     */
    mergeRole(role1, role2) {
        return role1 < role2 ? (role1 + '@' + role2) : (role2 + "@" + role1);
    }


}

export default SocketService = new SocketService();
