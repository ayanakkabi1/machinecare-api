import User from '../models/User.js';
import AppError from '../utils/AppError.js';

const ensureEmailAvailable = async (email, excludedUserId) => {
  const filter = { email };
  if (excludedUserId) filter._id = { $ne: excludedUserId };
  if (await User.exists(filter)) {
    throw new AppError('Cette adresse e-mail est déjà utilisée', 409);
  }
};

export const createUser = async ({ name, email, password }) => {
  await ensureEmailAvailable(email);
  return User.create({ name, email, password }); // hachage du mot de passe dans le hook pre('save')
};

export const listUsers = () => User.find().sort({ createdAt: -1 });

export const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Utilisateur introuvable', 404);
  return user;
};

export const updateProfile = async (userId, { name, email, password, currentPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('Utilisateur introuvable', 404);

  if (email !== undefined && email !== user.email) {
    await ensureEmailAvailable(email, userId);
    user.email = email;
  }
  if (name !== undefined) user.name = name;

  if (password !== undefined) {
    if (!(await user.matchPassword(currentPassword))) {
      throw new AppError('Le mot de passe actuel est incorrect', 401);
    }
    user.password = password;
  }

  return user.save();
};
