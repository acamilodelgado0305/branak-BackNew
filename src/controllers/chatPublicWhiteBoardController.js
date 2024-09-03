// Importa el modelo MessgesChatPublicWhiteBoard
import MessgesChatPublicWhiteBoard from '../models/messgesChatPublicWhiteBoard.js';

// Inicializa el sistema de chat
export const join = (socket, io) => (roomid) => {
    socket.leaveAll();
    socket.join(roomid, () => {
        console.log('Chat whiteboard conectado...', roomid);
    });
};

// Envía un mensaje por el alumno
export const sendMessage = (socket, io) => async (data) => {
    console.log('Cargando mensaje nuevo...');

    const message = new MessgesChatPublicWhiteBoard({
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
        console.log('Whiteboard: Mensaje nuevo guardado.');
        socket.broadcast.to(data.roomid).emit('whiteboard:sendMessagePrivate', { recipient: data.recipient });
    } catch (err) {
        console.error('Error guardando el mensaje:', err);
    }
};

// Obtiene todos los mensajes de la clase
export const getAllMessages = (io) => async (roomid) => {
    console.log("Obteniendo todos los mensajes...");
    try {
        const messages = await MessgesChatPublicWhiteBoard.find({ roomid });
        io.sockets.in(roomid).emit('whiteboard:messages', { messages });
    } catch (err) {
        console.error('Error obteniendo los mensajes:', err);
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
    console.log('Whiteboard: Actualización de avatar para el usuario...');

    MessgesChatPublicWhiteBoard.updateMany(
        { roomid, autorid: userId },
        { $set: { avatar: url, avatarStatus: true } },
        (err) => {
            if (err) {
                console.error('Error actualizando el avatar:', err);
            }
            io.sockets.in(roomid).emit('whiteboard:alert', {});
        }
    );
};

// Actualiza el estado del avatar del usuario
export const avatarStatus = (socket, io) => ({ status, roomid, userId }) => {
    console.log('Whiteboard: Actualización del estado del avatar...');

    MessgesChatPublicWhiteBoard.updateMany(
        { roomid, autorid: userId },
        { $set: { avatarStatus: status } },
        (err) => {
            if (err) {
                console.error('Error actualizando el estado del avatar:', err);
            }
        }
    );

    io.sockets.in(roomid).emit('whiteboard:alert', {});
};

// Cambia el color del texto
export const changeColor = (socket) => ({ roomid, textColor }) => {
    console.log('Whiteboard: Actualización del color del texto...');
    socket.broadcast.to(roomid).emit('whiteboard:changeColor', { textColor });
};

// Elimina datos de la base de datos al desconectar
export const deleteDataToDataBase = (socket, io) => () => {
    console.log('Saliendo...');
    // Aquí podrías agregar lógica para manejar la desconexión del socket.
};

// Envía un mensaje privado
export const sendMessagePrivate = (socket) => (messagePrivate) => {
    console.log('Enviando mensaje privado:', messagePrivate);
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
        console.error('Error eliminando los mensajes:', error);
    }
};

// Reactiva los sockets
export const activeSockets = (io) => (object) => {
    console.log("Reactivando los sockets en la sala", object.roomid);
    io.sockets.in(object.roomid).emit('whiteboard:reloadingSockets', null);
};
