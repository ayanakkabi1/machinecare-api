import { createUser } from '../services/userService.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const user = await createUser({ name, email, password });
    return res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('❌ [registerUser] Error:', error);
    const status = error.statusCode || 500;
    const message = status < 500 ? error.message : 'Internal server error';
    return res.status(status).json({ message });
  }
};

