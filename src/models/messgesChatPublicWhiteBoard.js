// Importa Mongoose
import mongoose from 'mongoose';

// Crea una instancia del esquema de Mongoose
const { Schema } = mongoose;

// Define el esquema para el modelo MessgesChatPublicWhiteBoard
const MessgesChatPublicWhiteBoard = new Schema({
  roomid: { type: String },
  message: { type: String },
  autorid: { type: String },
  name: { type: String },
  avatar: { type: String },
  avatarStatus: { type: Boolean, default: false },
  color: { type: String },
  isAdmin: { type: Boolean, default: false },
  private: { type: Boolean, default: false },
  recipient: { type: String, default: null }
}, { timestamps: true });

// Exporta el modelo MessgesChatPublicWhiteBoard
export default mongoose.model('MessgesChatPublicWhiteBoard', MessgesChatPublicWhiteBoard);
