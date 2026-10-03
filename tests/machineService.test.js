import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Machine from '../src/models/Machine.js';
import Signalement from '../src/models/Signalement.js';
import {
  createMachine,
  updateMachine,
  deleteMachine,
  listMachines,
} from '../src/services/machineService.js';
import { MACHINE_STATUSES } from '../src/utils/constants.js';

const newMachine = (reference, nom = 'Machine Test', workshop = 'Atelier A', status = 'disponible') =>
  createMachine({ reference, nom, workshop, status });

describe('machineService - updateMachine', () => {
  let machine;

  beforeEach(async () => {
    machine = await newMachine('REF-001');
  });

  describe('Critère 1: Mise à jour des données', () => {
    it('met à jour le nom', async () => {
      const u = await updateMachine(machine._id.toString(), { nom: 'Renommée' });
      expect(u.nom).toBe('Renommée');
      expect(u.reference).toBe('REF-001');
    });

    it("met à jour l'atelier", async () => {
      const u = await updateMachine(machine._id.toString(), { workshop: 'Atelier B' });
      expect(u.workshop).toBe('Atelier B');
    });

    it('met à jour la référence', async () => {
      const u = await updateMachine(machine._id.toString(), { reference: 'REF-002' });
      expect(u.reference).toBe('REF-002');
    });

    it('met à jour le statut', async () => {
      const u = await updateMachine(machine._id.toString(), { status: 'en maintenance' });
      expect(u.status).toBe('en maintenance');
    });

    it('met à jour plusieurs champs', async () => {
      const u = await updateMachine(machine._id.toString(), {
        nom: 'Nouveau', workshop: 'Atelier C', status: 'hors service',
      });
      expect(u.nom).toBe('Nouveau');
      expect(u.workshop).toBe('Atelier C');
      expect(u.status).toBe('hors service');
    });

    it('retourne 404 si machine inexistante', async () => {
      const id = new mongoose.Types.ObjectId();
      await expect(updateMachine(id.toString(), { nom: 'Test' }))
        .rejects.toMatchObject({ message: 'Machine introuvable', statusCode: 404 });
    });
  });

  describe('Critère 2: Unicité de la référence', () => {
    beforeEach(async () => {
      await newMachine('REF-OTHER', 'Autre', 'Atelier B');
    });

    it('rejette si référence déjà utilisée (409)', async () => {
      await expect(updateMachine(machine._id.toString(), { reference: 'REF-OTHER' }))
        .rejects.toMatchObject({ statusCode: 409 });
    });

    it('rejette une référence en doublon à la création (409)', async () => {
      await expect(newMachine('REF-OTHER')).rejects.toMatchObject({ statusCode: 409 });
    });

    it('autorise si référence inchangée', async () => {
      const u = await updateMachine(machine._id.toString(), { reference: 'REF-001' });
      expect(u.reference).toBe('REF-001');
    });

    it('autorise une nouvelle référence unique', async () => {
      const u = await updateMachine(machine._id.toString(), { reference: 'REF-NEW' });
      expect(u.reference).toBe('REF-NEW');
    });

    it('ne modifie pas la référence en cas de conflit', async () => {
      try { await updateMachine(machine._id.toString(), { reference: 'REF-OTHER' }); } catch (e) {}
      const r = await Machine.findById(machine._id);
      expect(r.reference).toBe('REF-001');
    });
  });

  describe('Critère 3: Validation du statut (enum)', () => {
    it.each(MACHINE_STATUSES)('accepte "%s"', async (status) => {
      const u = await updateMachine(machine._id.toString(), { status });
      expect(u.status).toBe(status);
    });

    it('rejette un statut invalide (erreur de validation Mongoose)', async () => {
      await expect(updateMachine(machine._id.toString(), { status: 'invalide' }))
        .rejects.toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it('le message liste les valeurs autorisées', async () => {
      const error = await updateMachine(machine._id.toString(), { status: 'invalide' }).catch((e) => e);
      expect(error.errors.status.message).toContain('Statut inconnu');
      MACHINE_STATUSES.forEach((s) => expect(error.errors.status.message).toContain(s));
    });

    it('MACHINE_STATUSES contient les 3 valeurs', () => {
      expect(MACHINE_STATUSES).toEqual(['disponible', 'en maintenance', 'hors service']);
    });
  });

  describe('Mise à jour partielle', () => {
    it('ne modifie pas les champs non fournis', async () => {
      const u = await updateMachine(machine._id.toString(), { nom: 'Seul le nom' });
      expect(u.nom).toBe('Seul le nom');
      expect(u.reference).toBe('REF-001');
      expect(u.workshop).toBe('Atelier A');
      expect(u.status).toBe('disponible');
    });

    it('gère undefined comme non fourni', async () => {
      const u = await updateMachine(machine._id.toString(), { nom: undefined, status: 'hors service' });
      expect(u.nom).toBe('Machine Test');
      expect(u.status).toBe('hors service');
    });
  });
});

describe('machineService - listMachines', () => {
  beforeEach(async () => {
    await newMachine('A-1', 'Presse', 'Atelier A', 'disponible');
    await newMachine('A-2', 'Tour', 'Atelier A', 'hors service');
    await newMachine('B-1', 'Fraiseuse', 'Atelier B', 'disponible');
  });

  it('filtre par atelier sans tenir compte de la casse', async () => {
    const machines = await listMachines({ workshop: 'atelier a' });
    expect(machines.map((m) => m.reference)).toEqual(['A-1', 'A-2']);
  });

  it('filtre par état', async () => {
    const machines = await listMachines({ status: 'disponible' });
    expect(machines).toHaveLength(2);
  });

  it('combine atelier et état', async () => {
    const machines = await listMachines({ workshop: 'Atelier A', status: 'hors service' });
    expect(machines.map((m) => m.reference)).toEqual(['A-2']);
  });
});

describe('machineService - deleteMachine', () => {
  it('supprime une machine sans signalement', async () => {
    const machine = await newMachine('DEL-1');
    await deleteMachine(machine._id.toString());
    expect(await Machine.findById(machine._id)).toBeNull();
  });

  it('refuse de supprimer une machine qui possède des signalements (409)', async () => {
    const machine = await newMachine('DEL-2');
    await Signalement.create({
      machine: machine._id,
      declaredBy: new mongoose.Types.ObjectId(),
      description: 'Panne moteur',
    });
    await expect(deleteMachine(machine._id.toString())).rejects.toMatchObject({ statusCode: 409 });
    expect(await Machine.findById(machine._id)).not.toBeNull();
  });
});
