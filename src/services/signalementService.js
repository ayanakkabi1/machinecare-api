import Machine from '../models/Machine.js';
import Signalement from '../models/Signalement.js';
import AppError from '../utils/AppError.js';
import { SIGNALEMENT_TRANSITIONS } from '../utils/constants.js';

const populateSignalement = (query) =>
  query
    .populate('machine', 'reference nom workshop status')
    .populate('declaredBy', 'name email')
    .populate('resolvedBy', 'name email');

const ensureMachineExists = async (machineId) => {
  if (!(await Machine.exists({ _id: machineId }))) {
    throw new AppError("Machine introuvable : impossible d'associer le signalement", 404);
  }
};

const findSignalementOrFail = async (id) => {
  const signalement = await Signalement.findById(id);
  if (!signalement) throw new AppError('Signalement introuvable', 404);
  return signalement;
};

const applyStatusChange = (signalement, { status, noteResolution }, userId) => {
  const allowed = SIGNALEMENT_TRANSITIONS[signalement.status];
  if (!allowed.includes(status)) {
    throw new AppError(
      `Transition de statut non autorisée : "${signalement.status}" -> "${status}". ` +
        'Cycle attendu : ouvert -> en cours -> résolu',
      400
    );
  }

  if (status === 'résolu') {
    if (!noteResolution) {
      throw new AppError('Une note de résolution (noteResolution) est obligatoire pour marquer le signalement comme résolu', 400);
    }
    signalement.noteResolution = noteResolution;
    signalement.dateResolution = new Date();
    signalement.resolvedBy = userId;
  }

  signalement.status = status;
};

export const createSignalement = async ({ machineId, description, userId }) => {
  await ensureMachineExists(machineId);
  const signalement = await Signalement.create({
    machine: machineId,
    declaredBy: userId,
    description,
    status: 'ouvert',
  });
  return populateSignalement(Signalement.findById(signalement._id));
};

export const listSignalements = ({ machine, status } = {}) => {
  const filter = {};
  if (machine) filter.machine = machine;
  if (status) filter.status = status;
  return populateSignalement(Signalement.find(filter).sort({ createdAt: -1 }));
};

export const getSignalementById = async (id) => {
  const signalement = await populateSignalement(Signalement.findById(id));
  if (!signalement) throw new AppError('Signalement introuvable', 404);
  return signalement;
};

export const updateSignalement = async (id, { machineId, description, status, noteResolution }, userId) => {
  const signalement = await findSignalementOrFail(id);

  if (signalement.status === 'résolu') {
    throw new AppError('Un signalement résolu ne peut plus être modifié', 409);
  }

  if (noteResolution !== undefined && status !== 'résolu') {
    throw new AppError('La note de résolution se renseigne uniquement lors du passage au statut "résolu"', 400);
  }

  if (machineId !== undefined) {
    await ensureMachineExists(machineId);
    signalement.machine = machineId;
  }
  if (description !== undefined) signalement.description = description;
  if (status !== undefined && status !== signalement.status) {
    applyStatusChange(signalement, { status, noteResolution }, userId);
  }

  await signalement.save();
  return getSignalementById(signalement._id);
};

export const updateSignalementStatus = async (id, { status, noteResolution }, userId) => {
  const signalement = await findSignalementOrFail(id);

  if (signalement.status === status) {
    throw new AppError(`Le signalement est déjà au statut "${status}"`, 400);
  }

  applyStatusChange(signalement, { status, noteResolution }, userId);
  await signalement.save();
  return getSignalementById(signalement._id);
};
