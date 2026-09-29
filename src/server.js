import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import mongoose from 'mongoose';
import { seedInitialUser } from './config/seedUser.js';

dotenv.config();

const app = express();

app.use(express.json());

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur en ligne sur http://localhost:${PORT}`);
});
console.log("Test de Hot Reload!");

mongoose.connect(process.env.MONGO_URI).then(async() => {
  console.log('Connected to MongoDB');
  await seedInitialUser(); 
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error.message);
});