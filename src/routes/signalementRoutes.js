import express from 'express';
import {
  SignalementCreate,
  SignalementStatusUpdate,
} from '../controllers/signalementController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, SignalementCreate);
router.patch('/:id/statut', authenticateToken, SignalementStatusUpdate);

export default router;
