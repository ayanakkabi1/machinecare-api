import express from 'express';
import { SignalementCreate } from '../controllers/signalementController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, SignalementCreate);

export default router;
