// Importa el modelo MessgesChatPublicWhiteBoard
import MessgesChatPublicWhiteBoard from '../models/messgesChatPublicWhiteBoard.js';

// Inicializa el sistema de chat
export const join = (socket, io) => (roomid) => {
    socket.leaveAll();
    socket.join(roomid, () => {
        console.log('chat whiteboard conectado...', roomid);
        // socket.broadcast.to(roomid).emit('whiteboard:notification', { notification: notification });
    });
};

// Envía un mensaje por el alumno
export const sendMessage = (socket, io) => async (data) => {
    console.log('cargando mensaje nuevo..');

    let message = new MessgesChatPublicWhiteBoard({
        message: data.message,
        autorid: data.autorid,
        name: data.name,
        avatar: data.avatar,
        avatarStatus: data.avatarStatus,
        color: data.color,
        isAdmin: data.isAdmin,
        roomid: data.roomid,
        private: data.private || false,
        recipient: data.recipient || null,
    });

    try {
        await message.save();
        console.log('WHITEBOARD NEW MESSAGE...');
        socket.broadcast.to(data.roomid).emit('whiteboard:sendMessagePrivate', { recipient: data.recipient });
    } catch (err) {
        console.error(err);
    }

    // io.sockets.in(data.roomid).emit('whiteboard:alert', {});
};

// Obtiene todos los mensajes de la clase
export const getAllMessages = (io) => async (roomid) => {
    console.log("enviando mensaje nuevo...");
    try {
        let messages = await MessgesChatPublicWhiteBoard.find({ "roomid": roomid });
        io.sockets.in(roomid).emit('whiteboard:messages', { messages: messages });
    } catch (err) {
        console.error(err);
    }
};

// Notificación para el usuario desde el admin
export const bellNotification = (socket, io) => (bell) => {
    io.sockets.in(bell.roomid).emit('whiteboard:bellNotificationChange', {
        status: bell.status,
        user_id: bell.userId,
        send_id: bell.send_id
    });
};

// Actualiza el avatar del usuario
export const uploadimage = (socket, io) => ({ url, roomid, userId }) => {
    console.log('WHITEBOARD AVATAR UPDATE FOR USER...');

    MessgesChatPublicWhiteBoard.updateMany(
        { "roomid": roomid, "autorid": userId },
        { $set: { avatar: url, avatarStatus: true } },
        (err) => {
            if (err) {
                console.error(err);
            }
            io.sockets.in(roomid).emit('whiteboard:alert', {});
        }
    );
};

// Actualiza el estado del avatar del usuario
export const avatarStatus = (socket, io) => ({ status, roomid, userId }) => {
    console.log('WHITEBOARD AVATAR UPDATE FOR USER...');

    MessgesChatPublicWhiteBoard.updateMany(
        { "roomid": roomid, "autorid": userId },
        { $set: { avatarStatus: status } },
        (err) => {
            if (err) {
                console.error(err);
            }
        }
    );

    io.sockets.in(roomid).emit('whiteboard:alert', {});
};

// Cambia el color del texto
export const changeColor = (socket) => ({ roomid, textColor }) => {
    console.log('WHITEBOARD COLOR UPDATE FOR USER...');
    console.log(roomid, textColor);
    socket.broadcast.to(roomid).emit('whiteboard:changeColor', { textColor: textColor });
};

// Elimina datos de la base de datos
export const deleteDataToDataBase = (socket, io) => () => {
    console.log('SALIENDO...');
};

// Envía un mensaje privado
export const sendMessagePrivate = (socket) => (messagePrivate) => {
    console.log(messagePrivate);
    socket.broadcast.to(messagePrivate.roomid).emit('whiteboard:sendMessagePrivate', {
        message: messagePrivate.message,
        recipient: messagePrivate.recipient,
        issuer: messagePrivate.issuer,
        issuerId: messagePrivate.issuerId
    });
};

// Elimina todos los mensajes del whiteboard
export const deleteAllMessages = (io) => async (object) => {
    try {
        await MessgesChatPublicWhiteBoard.deleteMany(object);
        io.sockets.in(object.roomid).emit('whiteboard:deletedSuccess', null);
    } catch (error) {
        console.error(error);
    }
};

// Reactiva los sockets
export const activeSockets = (io) => async (object) => {
    console.log("activating the websockets again in the room", object.roomid);
    io.sockets.in(object.roomid).emit('whiteboard:reloadingSockets', null);
};
