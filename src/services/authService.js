import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');

  // Même message pour un e-mail inconnu ou un mauvais mot de passe : on ne révèle pas quels comptes existent
  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Adresse e-mail ou mot de passe incorrect', 401);
  }

  const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

  return { token, user };
};
