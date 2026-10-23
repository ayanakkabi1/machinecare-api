import express from 'express';
import * as signalementController from '../controllers/signalementController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { idParamRules } from '../validators/commonValidators.js';
import {
  createSignalementRules,
  listSignalementsRules,
  updateSignalementRules,
  updateStatusRules,
} from '../validators/signalementValidators.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createSignalementRules, validate, signalementController.createSignalement);
router.get('/', listSignalementsRules, validate, signalementController.listSignalements);
router.get('/:id', idParamRules, validate, signalementController.getSignalement);
router.patch('/:id', idParamRules, updateSignalementRules, validate, signalementController.updateSignalement);
router.patch('/:id/statut', idParamRules, updateStatusRules, validate, signalementController.updateSignalementStatus);

export default router;
