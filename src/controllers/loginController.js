import {loginUser} from '../services/loginService.js';

export const login = async (req, res) => {
    try {
        const{email,password} = req.body;
        if(!email || !password){
            return res.status(400).json({message:'Please provide email and password'});
        }
        const data = await loginUser(email,password);
        return res.status(200).json({message:'Login successful',...data});
    } catch (error) {
        if( error.message === 'Invalid credentials'){
            return res.status(401).json({message:error.message});
        }
        return res.status(500).json({message:'Internal server error'});
    }
};