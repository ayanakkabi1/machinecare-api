import Machine from '../models/Machine.js';
import Signalement from '../models/Signalement.js';
import AppError from '../utils/AppError.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureReferenceAvailable = async (reference, excludedId) => {
  const filter = { reference };
  if (excludedId) filter._id = { $ne: excludedId };
  if (await Machine.exists(filter)) {
    throw new AppError(`La référence "${reference}" est déjà utilisée par une autre machine`, 409);
  }
};

export const createMachine = async ({ reference, nom, workshop, status }) => {
  await ensureReferenceAvailable(reference);
  return Machine.create({ reference, nom, workshop, status });
};

export const listMachines = ({ workshop, status } = {}) => {
  const filter = {};
  if (workshop) filter.workshop = new RegExp(`^${escapeRegex(workshop)}$`, 'i');
  if (status) filter.status = status;
  return Machine.find(filter).sort({ workshop: 1, reference: 1 });
};

export const getMachineById = async (id) => {
  const machine = await Machine.findById(id);
  if (!machine) throw new AppError('Machine introuvable', 404);
  return machine;
};

export const updateMachine = async (id, { reference, nom, workshop, status }) => {
  const machine = await getMachineById(id);

  if (reference !== undefined && reference !== machine.reference) {
    await ensureReferenceAvailable(reference, id);
    machine.reference = reference;
  }
  if (nom !== undefined) machine.nom = nom;
  if (workshop !== undefined) machine.workshop = workshop;
  if (status !== undefined) machine.status = status;

  return machine.save();
};

/**
 * Une machine qui possède des signalements n'est pas supprimée : on conserve
 * l'historique des pannes. Il faut plutôt la passer à l'état "hors service".
 */
export const deleteMachine = async (id) => {
  const machine = await getMachineById(id);

  const signalementsCount = await Signalement.countDocuments({ machine: machine._id });
  if (signalementsCount > 0) {
    throw new AppError(
      `Suppression impossible : la machine possède ${signalementsCount} signalement(s). ` +
        'Pour conserver l\'historique, passez plutôt son état à "hors service".',
      409
    );
  }

  await machine.deleteOne();
  return machine;
};

export const getMachineHistory = async (id) => {
  const machine = await getMachineById(id);
  const signalements = await Signalement.find({ machine: machine._id })
    .sort({ createdAt: -1 })
    .populate('declaredBy', 'name email')
    .populate('resolvedBy', 'name email');
  return { machine, signalements };
};
