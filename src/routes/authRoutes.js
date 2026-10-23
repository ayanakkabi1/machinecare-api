import express from 'express';
import { login } from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { loginRules } from '../validators/authValidators.js';

const router = express.Router();

router.post('/login', loginRules, validate, login);

export default router;
