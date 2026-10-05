import {
  createSignalement,
  updateSignalementStatus,
} from '../services/signalementService.js';

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

export const SignalementStatusUpdate = async (req, res) => {
  const { status, noteResolution } = req.body;

  if (!['en cours', 'résolu'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  if (
    status === 'résolu' &&
    (typeof noteResolution !== 'string' || !noteResolution.trim())
  ) {
    return res.status(400).json({ message: 'A resolution note is required' });
  }

  try {
    const signalement = await updateSignalementStatus({
      signalementId: req.params.id,
      status,
      noteResolution,
    });

    return res.status(200).json({
      message: 'Signalement status updated successfully',
      signalement,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Signalement not found' });
    }

    console.error('Error updating signalement status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
