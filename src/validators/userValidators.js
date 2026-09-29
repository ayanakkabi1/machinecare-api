import { body } from 'express-validator';

const emailRule = (chain) =>
  chain.trim().isEmail().withMessage("Format d'adresse e-mail invalide").toLowerCase();

const passwordRule = (chain) =>
  chain.isString().isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères');

export const createUserRules = [
  body('name').isString().withMessage('Le nom est obligatoire').bail().trim().notEmpty().withMessage('Le nom est obligatoire'),
  body('email').notEmpty().withMessage("L'adresse e-mail est obligatoire").bail(),
  emailRule(body('email')),
  body('password').notEmpty().withMessage('Le mot de passe est obligatoire').bail(),
  passwordRule(body('password')),
];

export const updateProfileRules = [
  body().custom((value) => {
    const allowed = ['name', 'email', 'password', 'currentPassword'];
    if (!value || !Object.keys(value).some((k) => allowed.includes(k) && k !== 'currentPassword')) {
      throw new Error('Aucun champ à modifier (name, email, password)');
    }
    return true;
  }),
  body('name').optional().isString().withMessage('Le nom ne peut pas être vide').bail().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
  emailRule(body('email').optional()),
  passwordRule(body('password').optional()),
  body('currentPassword')
    .if(body('password').exists())
    .notEmpty()
    .withMessage('Le mot de passe actuel (currentPassword) est obligatoire pour changer de mot de passe'),
];
