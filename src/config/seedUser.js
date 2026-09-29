import bcrypt from "bcrypt";
import User from "../models/User.js";

export const seedInitialUser = async () => {
    try {
        const email = process.env.INITIAL_USER_EMAIL || 'user@machinecare.com';
        const password = process.env.INITIAL_USER_PASSWORD || 'UserPassword123!';
        const name = process.env.INITIAL_USER_NAME || 'Default User';

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Initial user already exists.');
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
        name,
        email,
        password: hashedPassword
      });
        console.log('Initial user created successfully.');
    }catch(error){
        console.error('Error creating initial user:', error.message);
    }
}