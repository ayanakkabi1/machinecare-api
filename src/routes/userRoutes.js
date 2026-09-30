import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createUserRules, updateProfileRules } from '../validators/userValidators.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/me', userController.getMyProfile);
router.patch('/me', updateProfileRules, validate, userController.updateMyProfile);
router.post('/', createUserRules, validate, userController.createUser);
router.get('/', userController.listUsers);

export default router;
