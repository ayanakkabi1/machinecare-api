import Machine from '../models/machine.js';
import Signalement from '../models/signalement.js';

export const createSignalement = async ({ machineId, description, userId }) => {
  const machine = await Machine.findById(machineId);
  if (!machine) {
    const error = new Error('Machine not found');
    error.statusCode = 404;
    throw error;
  }

  return Signalement.create({
    machine: machine._id,
    declaredBy: userId,
    description,
    status: 'ouvert',
  });
};

const nextStatuses = {
  ouvert: 'en cours',
  'en cours': 'résolu',
};

export const updateSignalementStatus = async ({ signalementId, status, noteResolution }) => {
  const signalement = await Signalement.findById(signalementId);
  if (!signalement) {
    const error = new Error('Signalement not found');
    error.statusCode = 404;
    throw error;
  }

  if (nextStatuses[signalement.status] !== status) {
    const error = new Error('Invalid status transition');
    error.statusCode = 400;
    throw error;
  }

  if (status === 'résolu' && (typeof noteResolution !== 'string' || !noteResolution.trim())) {
    const error = new Error('A resolution note is required');
    error.statusCode = 400;
    throw error;
  }

  signalement.status = status;
  if (status === 'résolu') {
    signalement.noteResolution = noteResolution.trim();
    signalement.dateResolution = new Date();
  }

  return signalement.save();
};
