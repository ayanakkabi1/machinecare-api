import express from 'express';
import { MachineCreate } from '../controllers/machineController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, MachineCreate);

export default router;