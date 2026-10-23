import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { createMachine } from '../src/services/machineService.js';
import { createAuthenticatedUser } from './helpers.js';

describe('Suivi d\'une panne : /api/signalements', () => {
  let auth;
  let user;
  let machine;

  beforeEach(async () => {
    ({ auth, user } = await createAuthenticatedUser());
    machine = await createMachine({ reference: 'PRS-01', nom: 'Presse', workshop: 'Atelier A' });
  });

  const declarer = (body = {}) =>
    request(app)
      .post('/api/signalements')
      .set(auth)
      .send({ machineId: machine._id.toString(), description: 'Fuite d\'huile', ...body });

  it('rejette sans token (401)', async () => {
    const res = await request(app).get('/api/signalements');
    expect(res.status).toBe(401);
  });

  it('déclare une panne (201) et conserve le déclarant', async () => {
    const res = await declarer();
    expect(res.status).toBe(201);
    expect(res.body.signalement.status).toBe('ouvert');
    expect(res.body.signalement.declaredBy.email).toBe(user.email);
  });

  it('refuse une description vide (400)', async () => {
    const res = await declarer({ description: '   ' });
    expect(res.status).toBe(400);
  });

  it('refuse une machine inexistante (404)', async () => {
    const res = await declarer({ machineId: '507f1f77bcf86cd799439011' });
    expect(res.status).toBe(404);
  });

  it('refuse un statut inconnu (400)', async () => {
    const { body } = await declarer();
    const res = await request(app)
      .patch(`/api/signalements/${body.signalement._id}/statut`)
      .set(auth)
      .send({ status: 'fermé' });
    expect(res.status).toBe(400);
  });

  it('suit le cycle ouvert -> en cours -> résolu avec note obligatoire', async () => {
    const { body } = await declarer();
    const url = `/api/signalements/${body.signalement._id}/statut`;

    const enCours = await request(app).patch(url).set(auth).send({ status: 'en cours' });
    expect(enCours.status).toBe(200);
    expect(enCours.body.signalement.status).toBe('en cours');

    const sansNote = await request(app).patch(url).set(auth).send({ status: 'résolu' });
    expect(sansNote.status).toBe(400);

    const resolu = await request(app)
      .patch(url)
      .set(auth)
      .send({ status: 'résolu', noteResolution: 'Joint remplacé' });
    expect(resolu.status).toBe(200);
    expect(resolu.body.signalement.noteResolution).toBe('Joint remplacé');
    expect(resolu.body.signalement.dateResolution).toBeDefined();

    const modif = await request(app)
      .patch(`/api/signalements/${body.signalement._id}`)
      .set(auth)
      .send({ description: 'Trop tard' });
    expect(modif.status).toBe(409);
  });

  it('interdit de sauter une étape (ouvert -> résolu)', async () => {
    const { body } = await declarer();
    const res = await request(app)
      .patch(`/api/signalements/${body.signalement._id}/statut`)
      .set(auth)
      .send({ status: 'résolu', noteResolution: 'Réparé' });
    expect(res.status).toBe(400);
  });

  it('filtre par machine et par statut, et renvoie l\'historique de la machine', async () => {
    await declarer();
    const autre = await createMachine({ reference: 'TOUR-01', nom: 'Tour', workshop: 'Atelier B' });
    await declarer({ machineId: autre._id.toString() });

    const parMachine = await request(app).get(`/api/signalements?machine=${machine._id}&status=ouvert`).set(auth);
    expect(parMachine.status).toBe(200);
    expect(parMachine.body.count).toBe(1);

    const historique = await request(app).get(`/api/machines/${autre._id}/signalements`).set(auth);
    expect(historique.status).toBe(200);
    expect(historique.body.count).toBe(1);
  });
});
