import Visitor from "../models/homeChatVisitors.js";
import Conversation from "../models/homeChatConversation.js";

//init de todo el sistema de chat
export const join = (socket) => (id) => {
  socket.leaveAll();
  socket.join(id, () => {
    console.log("conectaddo...", id);
  });
};

//LOGIN SIMULADO DE UN VISITANTE AL SITE
export const sendUser = (socket, io) => (visitor) => {
  let newVisitor = new Visitor({
    name: visitor.name,
    roomid: visitor.roomid,
  });

  newVisitor.save((err) => {
    if (err) {
      throw err;
    }

    //CREAMOS LA SALA DE CHAT PARA ESTE USUARIO

    let newConvesation = new Conversation({
      roomid: visitor.roomid,
      message: "",
      autor: newVisitor._id,
    });

    socket.join(visitor.roomid, () => {
      console.log("USUARIO CONECTADO A LA SALA ", visitor.roomid);
    });
    returnAllDatabase(io, true);
    newConvesation.save((err) => {
      if (err) {
        throw err;
      }
      console.log("NUEVO USUARIO!!!!");

      getMessageLogin(visitor.roomid, socket, io, null);
      notNotification(visitor.roomid, io);
    });
  });
};

async function getMessages(roomid, io) {
  //recuperamos todos los messages on chat room
  let messages = await Conversation.find({ roomid: roomid }).populate("autor");
  //setTimeout(() => {
  io.sockets.in(roomid).emit("chat:messages", { messages: messages });
  console.log("LISTADO DE MENSAJES...");
  //},2000);
}

async function getMessageLogin(roomid, socket, io, mode) {
  let messages = await Conversation.find({ roomid: roomid }).populate("autor");

  if (mode === null) {
    io.sockets.in(roomid).emit("chat:send:message", { messages: messages });
  }

  if (mode === "cliente") {
    //socket.broadcast.to(message.roomid).emit('chat:new:message:cliente', newMessage);
    io.sockets.in(roomid).emit("chat:send:message:cliente", { roomid: roomid });

    console.log("NUEVO MENSAJE ENVIADO AL CLIENTE...");
  } else if (mode === "admin") {
    //socket.broadcast.to(message.roomid).emit('chat:new:message:admin', newMessage);
    io.sockets.in(roomid).emit("chat:send:message:admin", { roomid: roomid });
    console.log("NUEVO MENSAJE ENVIADO POR EL ADMIN...");
  }
}

export const sendMessage = (socket, io) => (message) => {
  //NOTIFICACION PARA EMISOR DEL MENSAJE...
  getMessageLogin(message.roomid, socket, io, message.send);

  //SALVAR MENSAJE Y NOTIFICAR AL RESECTOR DEL MENSAJE...
  newMessageToDB(message, socket, io);
};

export const sendMessageOwner = (socket, io) => (data) => {
 const eventId = "new:message";
  Visitor.findOne(
    {
      roomid: data.roomid,
    },
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
      // io.sockets.to(data.roomid).emit('output', person, eventId)
      outputRoom(person.roomid, io, person);
    }
  );
  returnAllDatabase(socket, io, false);
};

export const uploadimage = (socket) => (data) => {
  // let roomid = data.roomid;

  socket.broadcast
    .to(data.roomid)
    .emit("chat:new:changer", { color: "", roomid: data.roomid });
  console.log("AVATAR UPDATE FOR USER...");
  Visitor.findOneAndUpdate(
    { _id: data.id },
    { avatar: data.url, avatarStatus: true },
    { upsert: true },
    function (err, doc) {
      console.log(doc);
      if (err) {
        throw err;
      }
      //getMessages(roomid ,  io );
      //setTimeout(() => {
      socket.broadcast
        .to(doc.roomid)
        .emit("chat:new:changer", { color: "", roomid: doc.roomid });
      console.log("AVATAR UPDATE FOR USER...");

      //},1000);
    }
  );
};

export const avatarStatus = (socket, io) => (data) => {
  socket.broadcast
    .to(data.roomid)
    .emit("chat:new:changer", { color: "", roomid: data.roomid });
  console.log("AVATAR UPDATE2 FOR USER...");
  Visitor.findOneAndUpdate(
    { _id: data.id },
    { avatarStatus: data.status },
    { upsert: true },
    function (err, doc) {
      if (err) {
        throw err;
      }
      // setTimeout(() => {

      //},1000);
    }
  );
};

export const changeColor = (socket) => (data) => {
  socket.broadcast
    .to(data.roomid)
    .emit("chat:new:changer", { color: data.color, roomid: data.roomid });
  console.log("COLOR UPDATE FOR USER...");

  Conversation.updateMany(
    { roomid: data.roomid },
    { textColor: data.color },
    function (err, doc) {
      if (err) {
        throw err;
      }
    }
  );

  // setTimeout(() => {

  // },1000);
};

export const updataInfoVisitor = (io) => (data) => {
  Visitor.findOneAndUpdate(
    { _id: data },
    { status: false, statusMessage: false },
    { upsert: false },
    function (err, doc) {
      if (err) {
        throw err;
      }
      console.log("UPDATE DATA STATUS , STATUSMESSAGE...");
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

module.exports = {
  join,
  init,
  exit,
  sendMessage,
  sendMessageOwner,
  uploadimage,
  avatarStatus,
  changeColor,
  sendUser,
  sendOwner,
  visitorSelect,
  bellNotification,
  getDataOnCache,
  deleteDataToDataBase,
  isTyping,
  stopTyping,
  ownerMode,
  getAllMessages,
  updataInfoVisitor,
};
