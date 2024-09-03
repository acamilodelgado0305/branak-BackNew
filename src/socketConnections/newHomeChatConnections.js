export default (io) => {
    io.on('connection', (socket) => {
        try {
            socket.on('join', newHomeChat.join(socket));
            socket.on('sendMessage', newHomeChat.sendMessage(socket, io));
            socket.on('chat:messages', newHomeChat.getAllMessages(io));
            socket.on('uploadimage', newHomeChat.uploadimage(socket, io));
            socket.on('avatarStatus', newHomeChat.avatarStatus(socket, io));
            socket.on('sendUser', newHomeChat.sendUser(socket, io));
            socket.on('sendOwner', newHomeChat.sendOwner(socket, io));
            socket.on('ownerMode', newHomeChat.ownerMode(socket, io));
            socket.on('visitorSelect', newHomeChat.visitorSelect(socket, io))
            socket.on('bellNotification', newHomeChat.bellNotification(socket, io));

            //NEW ENVENTS
            socket.on('chat:init', newHomeChat.init(socket));
            socket.on('chat:exit', newHomeChat.exit(socket));
            socket.on('isTyping', newHomeChat.isTyping(socket));
            socket.on('stopTyping', newHomeChat.stopTyping(socket));
            socket.on('updateUserInfo', newHomeChat.updataInfoVisitor(io));
            socket.on('set:cache', newHomeChat.getDataOnCache(socket, io));
            socket.on('changeColor', newHomeChat.changeColor(socket));
            socket.on('delete', newHomeChat.deleteDataToDataBase(socket, io));

        } catch (error) {
            console.log(error)
        }
    });
}

