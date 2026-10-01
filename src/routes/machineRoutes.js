import express from 'express';
import * as machineController from '../controllers/machineController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { idParamRules } from '../validators/commonValidators.js';
import { createMachineRules, listMachinesRules, updateMachineRules } from '../validators/machineValidators.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createMachineRules, validate, machineController.createMachine);
router.get('/', listMachinesRules, validate, machineController.listMachines);
router.get('/:id', idParamRules, validate, machineController.getMachine);
router.patch('/:id', idParamRules, updateMachineRules, validate, machineController.updateMachine);
router.put('/:id', idParamRules, updateMachineRules, validate, machineController.updateMachine);
router.delete('/:id', idParamRules, validate, machineController.deleteMachine);
router.get('/:id/signalements', idParamRules, validate, machineController.getMachineSignalements);

export default router;
