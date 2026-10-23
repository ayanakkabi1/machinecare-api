import { body, query } from 'express-validator';
import { MACHINE_STATUSES } from '../utils/constants.js';

const statusMessage = `Statut de machine inconnu. Valeurs possibles : ${MACHINE_STATUSES.join(', ')}`;

const requiredText = (field, label) =>
  body(field).isString().withMessage(`${label} est obligatoire`).bail().trim().notEmpty().withMessage(`${label} est obligatoire`);

const optionalText = (field, label) =>
  body(field).optional().isString().withMessage(`${label} ne peut pas être vide`).bail().trim().notEmpty().withMessage(`${label} ne peut pas être vide`);

export const createMachineRules = [
  requiredText('reference', 'La référence'),
  requiredText('nom', 'Le nom'),
  requiredText('workshop', "L'atelier"),
  body('status').optional().isIn(MACHINE_STATUSES).withMessage(statusMessage),
];

export const updateMachineRules = [
  body().custom((value) => {
    const allowed = ['reference', 'nom', 'workshop', 'status'];
    if (!value || !Object.keys(value).some((k) => allowed.includes(k))) {
      throw new Error('Aucun champ à modifier (reference, nom, workshop, status)');
    }
    return true;
  }),
  optionalText('reference', 'La référence'),
  optionalText('nom', 'Le nom'),
  optionalText('workshop', "L'atelier"),
  body('status').optional().isIn(MACHINE_STATUSES).withMessage(statusMessage),
];

export const listMachinesRules = [
  query('status').optional().isIn(MACHINE_STATUSES).withMessage(statusMessage),
  query('workshop').optional().isString().trim(),
];
