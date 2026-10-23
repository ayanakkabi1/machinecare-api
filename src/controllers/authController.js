import { matchedData } from 'express-validator';
import { loginUser } from '../services/authService.js';

export const login = async (req, res) => {
  const { email, password } = matchedData(req);
  const { token, user } = await loginUser(email, password);
  res.status(200).json({ message: 'Connexion réussie', token, user });
};
