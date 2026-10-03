import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Machine from '../src/models/Machine.js';
import { createMachine } from '../src/services/machineService.js';
import { createAuthenticatedUser } from './helpers.js';

const newMachine = (reference, nom = 'Machine API', workshop = 'Atelier A', status = 'disponible') =>
  createMachine({ reference, nom, workshop, status });

describe('PUT /api/machines/:id', () => {
  let machine;
  let auth;

  beforeEach(async () => {
    ({ auth } = await createAuthenticatedUser());
    machine = await newMachine('REF-001');
  });

  it('rejette sans token (401)', async () => {
    const res = await request(app).put(`/api/machines/${machine._id}`).send({ nom: 'X' });
    expect(res.status).toBe(401);
  });

  it('rejette avec un token invalide (401)', async () => {
    const res = await request(app)
      .put(`/api/machines/${machine._id}`)
      .set({ Authorization: 'Bearer token.invalide' })
      .send({ nom: 'X' });
    expect(res.status).toBe(401);
  });

  it('met à jour et retourne 200', async () => {
    const res = await request(app)
      .put(`/api/machines/${machine._id}`)
      .set(auth)
      .send({ nom: 'Maj', workshop: 'Atelier B', status: 'en maintenance' });
    expect(res.status).toBe(200);
    expect(res.body.machine.nom).toBe('Maj');
    expect(res.body.machine.status).toBe('en maintenance');
  });

  it('met à jour partiellement', async () => {
    const res = await request(app)
      .put(`/api/machines/${machine._id}`)
      .set(auth)
      .send({ status: 'hors service' });
    expect(res.status).toBe(200);
    expect(res.body.machine.status).toBe('hors service');
    expect(res.body.machine.nom).toBe('Machine API');
  });

  it('retourne 404 si machine inexistante', async () => {
    const res = await request(app)
      .put('/api/machines/507f1f77bcf86cd799439011')
      .set(auth)
      .send({ nom: 'X' });
    expect(res.status).toBe(404);
  });

  it('retourne 400 avec ID invalide', async () => {
    const res = await request(app)
      .put('/api/machines/bad-id')
      .set(auth)
      .send({ nom: 'X' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Identifiant invalide');
  });

  it('retourne 409 si référence déjà utilisée', async () => {
    await newMachine('REF-OTHER', 'Autre', 'Atelier B');
    const res = await request(app)
      .put(`/api/machines/${machine._id}`)
      .set(auth)
      .send({ reference: 'REF-OTHER' });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('REF-OTHER');
  });

  it('autorise référence inchangée', async () => {
    const res = await request(app)
      .put(`/api/machines/${machine._id}`)
      .set(auth)
      .send({ reference: 'REF-001', nom: 'Maj nom' });
    expect(res.status).toBe(200);
    expect(res.body.machine.reference).toBe('REF-001');
  });

  it('autorise nouvelle référence unique', async () => {
    const res = await request(app)
      .put(`/api/machines/${machine._id}`)
      .set(auth)
      .send({ reference: 'REF-NEW' });
    expect(res.status).toBe(200);
    expect(res.body.machine.reference).toBe('REF-NEW');
  });

  it.each(['disponible', 'en maintenance', 'hors service'])('accepte statut "%s"', async (status) => {
    const res = await request(app)
      .put(`/api/machines/${machine._id}`)
      .set(auth)
      .send({ status });
    expect(res.status).toBe(200);
    expect(res.body.machine.status).toBe(status);
  });

  it('retourne 400 pour statut invalide', async () => {
    const res = await request(app)
      .put(`/api/machines/${machine._id}`)
      .set(auth)
      .send({ status: 'invalide' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Statut de machine inconnu');
    expect(res.body.message).toContain('disponible');
    expect(res.body.message).toContain('en maintenance');
    expect(res.body.message).toContain('hors service');
  });

  it('retourne 400 pour statut vide', async () => {
    const res = await request(app)
      .put(`/api/machines/${machine._id}`)
      .set(auth)
      .send({ status: '' });
    expect(res.status).toBe(400);
  });

  it('retourne 400 si aucun champ à modifier', async () => {
    const res = await request(app).put(`/api/machines/${machine._id}`).set(auth).send({});
    expect(res.status).toBe(400);
  });

  it('met à jour tous les champs valides', async () => {
    const res = await request(app)
      .put(`/api/machines/${machine._id}`)
      .set(auth)
      .send({
        reference: 'REF-COMPLETE',
        nom: 'Complète',
        workshop: 'Final',
        status: 'hors service',
      });
    expect(res.status).toBe(200);
    expect(res.body.machine.reference).toBe('REF-COMPLETE');
    expect(res.body.machine.nom).toBe('Complète');
    expect(res.body.machine.workshop).toBe('Final');
    expect(res.body.machine.status).toBe('hors service');
  });

  it('ne modifie pas si validation échoue', async () => {
    const res = await request(app)
      .put(`/api/machines/${machine._id}`)
      .set(auth)
      .send({ nom: 'Non sauvé', status: 'invalide' });
    expect(res.status).toBe(400);
    const r = await Machine.findById(machine._id);
    expect(r.nom).toBe('Machine API');
    expect(r.status).toBe('disponible');
  });
});

describe('POST /api/machines', () => {
  let auth;

  beforeEach(async () => {
    ({ auth } = await createAuthenticatedUser());
  });

  it('crée une machine (201) avec les dates de création et de modification', async () => {
    const res = await request(app)
      .post('/api/machines')
      .set(auth)
      .send({ reference: 'PRS-01', nom: 'Presse', workshop: 'Atelier A' });
    expect(res.status).toBe(201);
    expect(res.body.machine.status).toBe('disponible');
    expect(res.body.machine.createdAt).toBeDefined();
    expect(res.body.machine.updatedAt).toBeDefined();
  });

  it('refuse les champs obligatoires manquants (400)', async () => {
    const res = await request(app).post('/api/machines').set(auth).send({ reference: 'PRS-02' });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.champ)).toEqual(expect.arrayContaining(['nom', 'workshop']));
  });

  it('refuse une référence en doublon (409)', async () => {
    await newMachine('PRS-03');
    const res = await request(app)
      .post('/api/machines')
      .set(auth)
      .send({ reference: 'PRS-03', nom: 'Autre', workshop: 'Atelier B' });
    expect(res.status).toBe(409);
  });
});
