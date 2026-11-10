process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret';
delete process.env.DATABASE_URL;

const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');
const { sequelize } = require('../src/models');
const readiness = require('../src/config/readiness');

let token;

before(async () => {
  await sequelize.sync({ force: true });
  // The "503 until connected" gate is covered in test/readiness.test.js. Here
  // the database is up, so mark it ready exactly as server.js does once
  // connectWithRetry() succeeds.
  readiness.markReady();
});

test('rejects weak registrations', async () => {
  const res = await request(app).post('/api/auth/register').send({ username: 'ab', password: 'x' });
  assert.equal(res.status, 400);
});

test('registers without leaking the password hash and ignores extra fields', async () => {
  const res = await request(app).post('/api/auth/register').send({
    username: 'ethan',
    password: 'mission-accepted',
    id: '00000000-0000-4000-8000-000000000000',
  });
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.password, undefined);
  assert.notEqual(res.body.user.id, '00000000-0000-4000-8000-000000000000');
});

test('duplicate username returns 409', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username: 'ethan', password: 'mission-accepted' });
  assert.equal(res.status, 409);
});

test('login works and rejects bad passwords', async () => {
  const bad = await request(app)
    .post('/api/auth/login')
    .send({ username: 'ethan', password: 'nope-nope' });
  assert.equal(bad.status, 401);
  const ok = await request(app)
    .post('/api/auth/login')
    .send({ username: 'ethan', password: 'mission-accepted' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.user.password, undefined);
  token = ok.body.token;
});

test('gadget routes require a valid token', async () => {
  assert.equal((await request(app).get('/api/gadgets')).status, 401);
  assert.equal(
    (await request(app).get('/api/gadgets').set('Authorization', 'Bearer junk')).status,
    401,
  );
});

test('gadget lifecycle', async () => {
  const auth = { Authorization: `Bearer ${token}` };

  const invalid = await request(app).post('/api/gadgets').set(auth).send({});
  assert.equal(invalid.status, 400);

  const created = await request(app)
    .post('/api/gadgets')
    .set(auth)
    .send({ name: 'Laser Watch', status: 'Destroyed', missionSuccessProbability: 1 });
  assert.equal(created.status, 201);
  assert.equal(created.body.status, 'Available');
  assert.ok(
    created.body.missionSuccessProbability >= 60 && created.body.missionSuccessProbability <= 100,
  );
  assert.ok(created.body.codename);
  const { id } = created.body;

  const list = await request(app).get('/api/gadgets?status=Available').set(auth);
  assert.equal(list.status, 200);
  assert.equal(list.body.count, 1);
  assert.equal((await request(app).get('/api/gadgets?status=Bogus').set(auth)).status, 400);

  assert.equal(
    (await request(app).patch(`/api/gadgets/${id}`).set(auth).send({ codename: 'x' })).status,
    400,
  );
  assert.equal(
    (await request(app).patch(`/api/gadgets/${id}`).set(auth).send({ status: 'Lost' })).status,
    400,
  );
  const patched = await request(app)
    .patch(`/api/gadgets/${id}`)
    .set(auth)
    .send({ status: 'Deployed' });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.status, 'Deployed');

  assert.equal(
    (await request(app).patch('/api/gadgets/not-a-uuid').set(auth).send({ status: 'Deployed' }))
      .status,
    404,
  );

  const destroyed = await request(app).post(`/api/gadgets/${id}/self-destruct`).set(auth);
  assert.equal(destroyed.status, 200);
  assert.match(destroyed.body.confirmationCode, /^[A-Z0-9]{6}$/);
  assert.equal((await request(app).post(`/api/gadgets/${id}/self-destruct`).set(auth)).status, 409);

  const deleted = await request(app).delete(`/api/gadgets/${id}`).set(auth);
  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.status, 'Decommissioned');
  assert.ok(deleted.body.decommissionedAt);
});

test('many gadgets get unique codenames', async () => {
  const auth = { Authorization: `Bearer ${token}` };
  for (let i = 0; i < 40; i += 1) {
    const res = await request(app)
      .post('/api/gadgets')
      .set(auth)
      .send({ name: `Gadget ${i}` });
    assert.equal(res.status, 201);
  }
  const list = await request(app).get('/api/gadgets').set(auth);
  const codenames = new Set(list.body.gadgets.map((g) => g.codename));
  assert.equal(codenames.size, list.body.count);
});

test('malformed JSON returns 400 and swagger docs are served', async () => {
  const bad = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{bad');
  assert.equal(bad.status, 400);
  const docs = await request(app).get('/api-docs/');
  assert.equal(docs.status, 200);
});
