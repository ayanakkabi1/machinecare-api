import User from '../models/User.js';

/**
 * Creates a new user.
 * Throws if the email is already taken.
 */
export const createUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  const user = new User({ name, email, password });
  await user.save(); // password hashing handled by pre-save hook

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
};

