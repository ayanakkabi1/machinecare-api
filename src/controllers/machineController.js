import { matchedData } from 'express-validator';
import * as machineService from '../services/machineService.js';

export const createMachine = async (req, res) => {
  const machine = await machineService.createMachine(matchedData(req));
  res.status(201).json({ message: 'Machine créée avec succès', machine });
};

export const listMachines = async (req, res) => {
  const machines = await machineService.listMachines(matchedData(req, { locations: ['query'] }));
  res.status(200).json({ count: machines.length, machines });
};

export const getMachine = async (req, res) => {
  const machine = await machineService.getMachineById(req.params.id);
  res.status(200).json({ machine });
};

export const updateMachine = async (req, res) => {
  const machine = await machineService.updateMachine(req.params.id, matchedData(req, { locations: ['body'] }));
  res.status(200).json({ message: 'Machine mise à jour avec succès', machine });
};

export const deleteMachine = async (req, res) => {
  const machine = await machineService.deleteMachine(req.params.id);
  res.status(200).json({ message: 'Machine supprimée avec succès', machine });
};

export const getMachineSignalements = async (req, res) => {
  const { machine, signalements } = await machineService.getMachineHistory(req.params.id);
  res.status(200).json({ machine, count: signalements.length, signalements });
};
