import { param } from 'express-validator';

export const idParamRules = [param('id').isMongoId().withMessage('Identifiant invalide')];
