import Visitor from "../models/homeChatVisitors.js";
import Conversation from "../models/homeChatConversation.js";

// Init de todo el sistema de chat
export const join = (socket) => (id) => {
  socket.leaveAll();
  socket.join(id, () => {
    console.log("Conectado...", id);
  });
};

// LOGIN SIMULADO DE UN VISITANTE AL SITE
export const sendUser = (socket, io) => (visitor) => {
  let newVisitor = new Visitor({
    name: visitor.name,
    roomid: visitor.roomid,
  });

  newVisitor.save((err) => {
    if (err) {
      throw err;
    }

    // Crear la sala de chat para este usuario
    let newConversation = new Conversation({
      roomid: visitor.roomid,
      message: "",
      autor: newVisitor._id,
    });

    socket.join(visitor.roomid, () => {
      console.log("Usuario conectado a la sala ", visitor.roomid);
    });

    returnAllDatabase(io, true);

    newConversation.save((err) => {
      if (err) {
        throw err;
      }
      console.log("Nuevo usuario!!!!");

      getMessageLogin(visitor.roomid, socket, io, null);
      notNotification(visitor.roomid, io);
    });
  });
};

// Recuperar todos los mensajes de la sala de chat
async function getMessages(roomid, io) {
  let messages = await Conversation.find({ roomid: roomid }).populate("autor");
  io.sockets.in(roomid).emit("chat:messages", { messages: messages });
  console.log("Listado de mensajes...");
}

// Obtener mensaje de inicio de sesión
async function getMessageLogin(roomid, socket, io, mode) {
  let messages = await Conversation.find({ roomid: roomid }).populate("autor");

  if (mode === null) {
    io.sockets.in(roomid).emit("chat:send:message", { messages: messages });
  }

  if (mode === "cliente") {
    io.sockets.in(roomid).emit("chat:send:message:cliente", { roomid: roomid });
    console.log("Nuevo mensaje enviado al cliente...");
  } else if (mode === "admin") {
    io.sockets.in(roomid).emit("chat:send:message:admin", { roomid: roomid });
    console.log("Nuevo mensaje enviado por el admin...");
  }
}

// Enviar mensaje
export const sendMessage = (socket, io) => (message) => {
  getMessageLogin(message.roomid, socket, io, message.send);
  newMessageToDB(message, socket, io);
};

// Enviar mensaje del propietario
export const sendMessageOwner = (socket, io) => (data) => {
  const eventId = "new:message";
  Visitor.findOne(
    { roomid: data.roomid },
    (err, person) => {
      person.status = false;
      person.messages.push({
        body: data.body,
        userNameMessage: data.name,
        avatarStatus: data.avatarStatus,
        avatar: data.avatar,
        textColor: data.textColor,
        isUser: false,
      });
      person.save();
      outputRoom(person.roomid, io, person);
    }
  );
  returnAllDatabase(socket, io, false);
};

// Subir imagen de avatar
export const uploadImage = (socket) => (data) => {
  socket.broadcast
    .to(data.roomid)
    .emit("chat:new:changer", { color: "", roomid: data.roomid });

  Visitor.findOneAndUpdate(
    { _id: data.id },
    { avatar: data.url, avatarStatus: true },
    { upsert: true },
    (err, doc) => {
      if (err) throw err;
      socket.broadcast
        .to(doc.roomid)
        .emit("chat:new:changer", { color: "", roomid: doc.roomid });
    }
  );
};

// Cambiar el estado del avatar
export const avatarStatus = (socket, io) => (data) => {
  socket.broadcast
    .to(data.roomid)
    .emit("chat:new:changer", { color: "", roomid: data.roomid });

  Visitor.findOneAndUpdate(
    { _id: data.id },
    { avatarStatus: data.status },
    { upsert: true },
    (err, doc) => {
      if (err) throw err;
    }
  );
};

// Cambiar el color del texto
export const changeColor = (socket) => (data) => {
  socket.broadcast
    .to(data.roomid)
    .emit("chat:new:changer", { color: data.color, roomid: data.roomid });

  Conversation.updateMany(
    { roomid: data.roomid },
    { textColor: data.color },
    (err, doc) => {
      if (err) throw err;
    }
  );
};

// Actualizar la información del visitante
export const updateInfoVisitor = (io) => (data) => {
  Visitor.findOneAndUpdate(
    { _id: data },
    { status: false, statusMessage: false },
    { upsert: false },
    (err, doc) => {
      if (err) throw err;
      returnAllDatabase(io, false);
    }
  );
};
export const isTyping = (socket) => (data) => {
  // console.log('typing on')
  socket.broadcast.to(data.roomid).emit("isTyping", data);
};

export const stopTyping = (socket) => (data) => {
  ///// console.log('typing off')
  setTimeout(
    () => socket.broadcast.to(data.roomid).emit("stopTyping", {}),
    1000
  );
};

export const notNotification = (roomid, io) => {
  console.log("NOTIFICATION SEND");

  setTimeout(() => io.sockets.in(roomid).emit("notNotification", {}), 10000);
};

export const sendOwner = (socket, io) => (owner) => {
  Visitor.findOne({ name: owner.name }, (err, user) => {
    if (err) {
      throw err;
    }

    if (user == null) {
      let newVisitor = new Visitor({
        name: owner.name,
        isUser: owner.isUser,
      });

      newVisitor.save((err, admin) => {
        if (err) {
          throw err;
        }

        socket.emit("chat:admin:login", { admin: admin });
      });
    } else {
      socket.emit("chat:admin:login", { admin: user });
    }
  });

  returnAllDatabase(io);
};

export const ownerMode = (io) => (owner) => {
  //console.log(owner);
  returnAllDatabase(io);
};

export const visitorSelect = (socket, io) => (roomid) => {
  outputToRoom(roomid, io);
};

async function outputToRoom(roomid, io) {
  let messages = await Conversation.find({ roomid: roomid }).populate("autor");
  io.sockets.in(roomid).emit("chat:room:messages", { messages: messages });
}

async function newMessageToDB(message, socket, io) {
  try {
    const newMessage = new Conversation({
      roomid: message.roomid,
      message: message.message,
      autor: message.autor,
    });
    console.log("PROCESANDO MENSAJE...");
    await newMessage.save();
    console.log("NUEVO MENSAJE GUARDADO...");

    // setTimeout(() => {

    socket.broadcast
      .to(message.roomid)
      .emit("chat:new:message", { roomid: message.roomid });
    console.log("NUEVO MENSAJE ENVIADO AL CLIENTE...");

    // },1000);

    await Visitor.findOneAndUpdate(
      { _id: message.autor, isUser: true },
      { status: false, statusMessage: true },
      { upsert: false }
    );

    console.log("USER UPDATE...");

    returnAllDatabase(io, false);
  } catch (err) {
    console.log(err);
  }
}

async function outputToRoomAdmin(roomid, io, eventId) {
  let messages = await Conversation.find({ roomid: roomid }).populate("autor");
  io.sockets
    .in(roomid)
    .emit("chat:messages", { messages: messages, eventId: eventId });
}

//NOTIFI PARA EL USUARIO DESDE EL ADMIN
export const bellNotification = (socket, io) => (bell) => {
  io.sockets.in(bell.roomid).emit("bellNotificationChange", bell.status);
  // socket.broadcast.to(bell.roomid).emit('bellNotificationChange', bell.status); //version personal
};

export const getDataOnCache = (socket, io) => (roomid) => {
  outputToCache(roomid, socket);
};

async function outputToCache(roomid, socket) {
  let messages = await Conversation.find({ roomid: roomid }).populate("autor");
  socket.emit("chat:cache", { messages: messages });
}

export const outputRoom = (roomid, io, person) => {
  io.to(roomid).emit("output", person);
};

//ELIMINAR DATA DE VISITANTES

export const deleteDataToDataBase = (socket, io) => (data) => {
  const { _id, roomid } = data;

  socket.leave(roomid);

  Visitor.findByIdAndRemove({ _id: _id })
    .then((user) => {
      Conversation.deleteMany({ roomid: user.roomid }, function (err) {
        if (err) {
          throw err;
        }
        console.log("USUARIO + CONVERSATION DELETEE... ");
        returnAllDatabase(io, false);
        io.emit("chat:delete");
      });
    })
    .catch((error) => console.log(error));
};

//return información de los usuarios conectados
async function returnAllDatabase(io, newUser) {
  var users = [];
  //var person = await Visitor.find().limit();
  var person = await Visitor.find().sort({ _id: -1 });

  //console.log(person)
  person.forEach((doc) => {
    users.push(doc);
  });
  console.log("AQUI LLAMADO.....");
  io.emit("outputAllDatabase2", {
    users: users,
    newUser: newUser,
  });
}

export const allData = async (socket, newUser) => {
  var users = [];
  var person = await Visitor.find().limit();
  person.forEach((doc) => {
    users.push(doc);
  });
  socket.emit("outputAllDatabase", {
    users: users,
    newUser: newUser,
  });
};

export const init = (socket) => (data) => {
  socket.broadcast.emit("chat:init", "sonar");
};

export const exit = (socket) => (data) => {
  socket.broadcast.emit("chat:exit", "sonar");
};

//get all messages from database
export const getAllMessages = (io) => (roomid) => {
  getMessages(roomid, io);
};

