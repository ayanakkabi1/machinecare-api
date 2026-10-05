import { createSignalement } from '../services/signalementService.js';

export const SignalementCreate = async (req, res) => {
  const { machineId: requestedMachineId, machine, description } = req.body;
  const machineId = requestedMachineId || machine;

  if (!machineId) {
    return res.status(400).json({ message: 'machineId is required' });
  }

  if (typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ message: 'description is required' });
  }

  try {
    const signalement = await createSignalement({
      machineId,
      description: description.trim(),
      userId: req.user._id,
    });

    return res.status(201).json({
      message: 'Signalement created successfully',
      signalement,
    });
  } catch (error) {
    if (error.statusCode === 404 || error.name === 'CastError') {
      return res.status(404).json({ message: 'Machine not found' });
    }

    console.error('Error creating signalement:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
