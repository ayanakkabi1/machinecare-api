import { matchedData } from 'express-validator';
import * as signalementService from '../services/signalementService.js';

export const createSignalement = async (req, res) => {
  const { machineId, description } = matchedData(req);
  const signalement = await signalementService.createSignalement({
    machineId,
    description,
    userId: req.user.userId,
  });
  res.status(201).json({ message: 'Signalement créé avec succès', signalement });
};

export const listSignalements = async (req, res) => {
  const signalements = await signalementService.listSignalements(matchedData(req, { locations: ['query'] }));
  res.status(200).json({ count: signalements.length, signalements });
};

export const getSignalement = async (req, res) => {
  const signalement = await signalementService.getSignalementById(req.params.id);
  res.status(200).json({ signalement });
};

export const updateSignalement = async (req, res) => {
  const signalement = await signalementService.updateSignalement(
    req.params.id,
    matchedData(req, { locations: ['body'] }),
    req.user.userId
  );
  res.status(200).json({ message: 'Signalement mis à jour avec succès', signalement });
};

export const updateSignalementStatus = async (req, res) => {
  const signalement = await signalementService.updateSignalementStatus(
    req.params.id,
    matchedData(req, { locations: ['body'] }),
    req.user.userId
  );
  res.status(200).json({ message: 'Statut du signalement mis à jour avec succès', signalement });
};
