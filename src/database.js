import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const URI = process.env.MONGODB_URI;

mongoose
  .connect(URI)
  .then(() => console.log("Conectado a Mongo Branak"))
  .catch((error) => console.error(error));
