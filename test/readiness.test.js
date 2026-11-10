/**
 * Covers the degraded-start behaviour that keeps this service alive when its
 * managed Postgres is asleep.
 *
 * The regression being guarded: the service used to call `authenticate()` once
 * at boot and `process.exit(1)` on failure, so a sleeping free-tier database
 * became a crash-loop and the platform marked the service failed. The listener
 * must now come up first, liveness must pass, and data routes must answer 503
 * with Retry-After until the connection lands.
 *
 * This file runs in its own process (node:test isolates files), so the module
 * state it sets up cannot leak into api.test.js.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret';
delete process.env.DATABASE_URL;

const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');
const readiness = require('../src/config/readiness');

test('liveness passes before the database has ever connected', async () => {
  // Nothing has called markReady(): this is the state at the instant the
  // listener opens, which is when the platform's health check first fires.
  assert.equal(readiness.isReady(), false);

  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(typeof res.body.uptime, 'number');
});

test('readiness reports 503 with the reason while the database is down', async () => {
  readiness.markFailed(new Error('getaddrinfo ENOTFOUND db.example.test'));

  const res = await request(app).get('/health/ready');
  assert.equal(res.status, 503);
  assert.equal(res.body.status, 'unavailable');
  assert.match(res.body.lastError, /ENOTFOUND/);
  assert.equal(res.headers['retry-after'], '30');
});

test('data routes answer 503, not 500, while the database is down', async () => {
  readiness.markFailed(new Error('connection refused'));

  for (const path of ['/api/gadgets', '/api/auth/login']) {
    const res = await request(app).post(path).send({ username: 'a', password: 'b' });
    assert.equal(res.status, 503, `${path} should be 503 while the database is down`);
    assert.equal(res.headers['retry-after'], '30');
    assert.match(res.body.message, /Database unavailable/);
  }
});

test('the 503 gate does not block the docs or the root redirect', async () => {
  readiness.markFailed(new Error('still down'));

  // These must stay reachable, otherwise the live demo looks dead whenever the
  // free database is asleep.
  const root = await request(app).get('/');
  assert.equal(root.status, 302);
  assert.equal(root.headers.location, '/api-docs');

  const docs = await request(app).get('/api-docs/');
  assert.equal(docs.status, 200);
});

test('attempt counter increases and readiness clears the last error', async () => {
  const before = readiness.getState().attempts;
  readiness.recordAttempt();
  readiness.recordAttempt();
  assert.equal(readiness.getState().attempts, before + 2);

  readiness.markFailed(new Error('transient'));
  assert.equal(readiness.getState().lastError, 'transient');

  readiness.markReady();
  assert.equal(readiness.isReady(), true);
  assert.equal(readiness.getState().lastError, null);

  const res = await request(app).get('/health/ready');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ready');
});
