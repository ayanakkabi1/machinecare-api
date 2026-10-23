import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Accès refusé : token JWT manquant (en-tête Authorization: Bearer <token>)', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    const message = error.name === 'TokenExpiredError' ? 'Token JWT expiré' : 'Token JWT invalide';
    throw new AppError(message, 401);
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AppError("L'utilisateur associé à ce token n'existe plus", 401);
  }

  req.user = { userId: user._id, email: user.email };
  next();
};
