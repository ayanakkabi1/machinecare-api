import { body, query } from 'express-validator';
import { SIGNALEMENT_STATUSES } from '../utils/constants.js';

const statusMessage = `Statut de signalement inconnu. Valeurs possibles : ${SIGNALEMENT_STATUSES.join(', ')}`;

const descriptionRule = (chain) =>
  chain.isString().withMessage('La description ne peut pas être vide').bail().trim().notEmpty().withMessage('La description ne peut pas être vide');

export const createSignalementRules = [
  body('machineId').notEmpty().withMessage("L'identifiant de la machine (machineId) est obligatoire")
    .bail().isMongoId().withMessage('Identifiant de machine invalide'),
  body('description').exists().withMessage('La description est obligatoire').bail(),
  descriptionRule(body('description')),
];

export const updateSignalementRules = [
  body().custom((value) => {
    const allowed = ['machineId', 'description', 'status', 'noteResolution'];
    if (!value || !Object.keys(value).some((k) => allowed.includes(k))) {
      throw new Error('Aucun champ à modifier (machineId, description, status, noteResolution)');
    }
    return true;
  }),
  body('machineId').optional().isMongoId().withMessage('Identifiant de machine invalide'),
  descriptionRule(body('description').optional()),
  body('status').optional().isIn(SIGNALEMENT_STATUSES).withMessage(statusMessage),
  body('noteResolution').optional().isString().withMessage('La note de résolution doit être un texte').trim(),
];

export const updateStatusRules = [
  body('status').notEmpty().withMessage('Le statut est obligatoire').bail().isIn(SIGNALEMENT_STATUSES).withMessage(statusMessage),
  body('noteResolution').optional().isString().withMessage('La note de résolution doit être un texte').trim(),
];

export const listSignalementsRules = [
  query('status').optional().isIn(SIGNALEMENT_STATUSES).withMessage(statusMessage),
  query('machine').optional().isMongoId().withMessage('Identifiant de machine invalide'),
];
