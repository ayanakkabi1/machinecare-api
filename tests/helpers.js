import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';

// Crée un utilisateur en base et renvoie l'en-tête Authorization avec un JWT valide
export const createAuthenticatedUser = async (overrides = {}) => {
  const user = await User.create({
    name: 'Testeur',
    email: 'testeur@machinecare.com',
    password: 'Password123!',
    ...overrides,
  });
  const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, auth: { Authorization: `Bearer ${token}` } };
};
