import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const loginUser = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('User not found');
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }
    const token = jwt.sign(
        { userId: user._id,email: user.email},
        process.env.JWT_SECRET,
        {expiresIn:'24h'}
    );
    return{
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        }
    }
}