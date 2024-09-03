// Importa Mongoose y el modelo Visitor
import mongoose from 'mongoose';
import Visitor from "../models/homeChatVisitors.js";

// Define el esquema para la colección Conversation
const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
    roomid: {
        type: String,
        required: true, // Especifica que roomid es obligatorio
    },
    textColor: {
        type: String,
        default: 'white', // Establece 'white' como valor por defecto para textColor
    },
    message: {
        type: String,
        required: true, // Especifica que message es obligatorio
    },
    autor: {
        type: Schema.Types.ObjectId,
        ref: "Visitor", // Referencia al modelo Visitor
        required: true, // Especifica que autor es obligatorio
    }  
}, { timestamps: true }); // Agrega automáticamente createdAt y updatedAt


export default mongoose.model('Conversation', ConversationSchema);
