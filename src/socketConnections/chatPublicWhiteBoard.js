// Importa el controlador whiteBoardChat
import * as whiteBoardChat from '../controllers/chatPublicWhiteBoardController.js';

// Exporta la función que configura los eventos de socket
export default (io) => {
    io.on('connection', (socket) => {
        try {
            socket.on('whiteboard:join', whiteBoardChat.join(socket, io));
            socket.on('whiteboard:activeSockets', whiteBoardChat.activeSockets(io));
            socket.on('whiteboard:sendMessage', whiteBoardChat.sendMessage(socket, io));
            socket.on('whiteboard:sendMessagePrivate', whiteBoardChat.sendMessagePrivate(socket));
            socket.on('whiteboard:messages', whiteBoardChat.getAllMessages(io));
            socket.on('whiteboard:bellNotification', whiteBoardChat.bellNotification(socket, io));
            socket.on('whiteboard:uploadimage', whiteBoardChat.uploadimage(socket, io));
            socket.on('whiteboard:avatarStatus', whiteBoardChat.avatarStatus(socket, io));
            socket.on('whiteboard:changeColor', whiteBoardChat.changeColor(socket));
            socket.on('whiteboard:deleteMessages', whiteBoardChat.deleteAllMessages(io));
            socket.on('disconnect', whiteBoardChat.deleteDataToDataBase(socket, io));
        } catch (error) {
            console.error(error);
        }
    });
};


