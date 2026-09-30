import express from 'express';
import { login} from '../controllers/loginController.js';
import {authenticateToken} from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', login);

router.get('/protected', authenticateToken, (req, res) => {
    res.status(200).json({ message: 'Access granted to protected route', user: req.user });
});

export default router;