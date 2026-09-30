import { matchedData } from 'express-validator';
import * as userService from '../services/userService.js';

export const createUser = async (req, res) => {
  const user = await userService.createUser(matchedData(req));
  res.status(201).json({ message: 'Utilisateur créé avec succès', user });
};

export const listUsers = async (req, res) => {
  const users = await userService.listUsers();
  res.status(200).json({ count: users.length, users });
};

export const getMyProfile = async (req, res) => {
  const user = await userService.getUserById(req.user.userId);
  res.status(200).json({ user });
};

export const updateMyProfile = async (req, res) => {
  const user = await userService.updateProfile(req.user.userId, matchedData(req));
  res.status(200).json({ message: 'Profil mis à jour avec succès', user });
};
