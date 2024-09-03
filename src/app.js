import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import chatPublicWhiteBoard from "./socketConnections/chatPublicWhiteBoard.js";
import chatConnections from "./socketConnections/newHomeChatConnections.js"


// Carga las variables de entorno desde el archivo .env
dotenv.config();

// Crea el servidor HTTP
const server = http.createServer();

// Configura Socket.IO con el servidor HTTP
const io = new SocketIOServer(server, {
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Configura los eventos de Socket.IO
chatPublicWhiteBoard(io);
chatConnections(io);

// Crea la aplicación Express
const app = express();

// Incluye los módulos necesarios para la autenticación
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: ["https://lanet.app.la-net.co", "http://localhost:5173"],
  })
);
app.use(express.json());

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  // Puedes enviar una respuesta de error al cliente o realizar otras acciones aquí
  res.status(500).send("Error interno del servidor");
});

const PORT = process.env.PORT || 3005;

// Inicia el servidor HTTP
server.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});

export default app;
