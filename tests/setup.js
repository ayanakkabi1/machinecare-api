import { beforeAll, afterAll, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

beforeAll(async () => {
  // Démarrer un serveur MongoDB en mémoire
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Définir les variables d'environnement pour les tests
  process.env.MONGO_URI = mongoUri;
  process.env.JWT_SECRET = 'test-secret-key-for-jwt-signing';
  process.env.NODE_ENV = 'test';

  // Se connecter à MongoDB
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  // Nettoyer toutes les collections après chaque test
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  // Fermer la connexion et arrêter le serveur
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});
