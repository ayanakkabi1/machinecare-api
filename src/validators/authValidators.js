import { body } from 'express-validator';

export const loginRules = [
  body('email').trim().notEmpty().withMessage("L'adresse e-mail est obligatoire")
    .bail().isEmail().withMessage("Format d'adresse e-mail invalide").toLowerCase(),
  body('password').notEmpty().withMessage('Le mot de passe est obligatoire'),
];
