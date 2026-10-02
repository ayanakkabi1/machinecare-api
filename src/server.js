import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import { seedInitialUser } from './config/seedUser.js';

const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Variables d'environnement manquantes : ${missing.join(', ')} (voir .env.example)`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await seedInitialUser();
  app.listen(PORT, () => {
    console.log(`Serveur en ligne sur http://localhost:${PORT}`);
  });
};

start();
