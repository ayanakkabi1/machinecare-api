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
