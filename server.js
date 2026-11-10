require('dotenv').config();
const { requireEnv } = require('./src/config/env');

// Fail fast before opening a port when required configuration is missing.
// A missing secret is a deploy mistake that retrying cannot fix, so unlike a
// database outage this still exits immediately.
requireEnv('JWT_SECRET');
requireEnv('DATABASE_URL');

const app = require('./src/app');
const { sequelize } = require('./src/models');
const readiness = require('./src/config/readiness');

const PORT = Number(process.env.PORT) || 3000;
// Loopback by default for local development. Render sets RENDER=true and needs
// an all-interfaces bind inside its container; HOST can override either way.
const HOST = process.env.HOST || (process.env.RENDER ? '0.0.0.0' : '127.0.0.1');

const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

/**
 * Connect and sync, retrying with exponential backoff and full jitter.
 *
 * This deliberately never gives up. A free-tier managed Postgres sleeps when
 * idle and takes 30-60s to wake; the previous code called `authenticate()` once
 * and `process.exit(1)` on failure, which turned a sleeping database into a
 * crash-loop that the platform eventually marked as a failed service. Data
 * routes answer 503 (see `readiness.requireDatabase`) until this resolves.
 */
async function connectWithRetry() {
  for (;;) {
    const attempt = readiness.recordAttempt();
    try {
      await sequelize.authenticate();
      // `sync()` is adequate for this demo's two tables. A service holding real
      // data would use sequelize-cli migrations instead, so that a column
      // rename cannot silently become a drop-and-recreate.
      await sequelize.sync();
      readiness.markReady();
      console.log(`Database ready after ${attempt} attempt(s)`);
      return;
    } catch (error) {
      readiness.markFailed(error);
      // Full jitter: a random delay inside the window, so instances restarting
      // together do not retry in lockstep against a waking database.
      const window = Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS);
      const delay = Math.round(Math.random() * window);
      console.error(
        `Database connection attempt ${attempt} failed (${error.message}); retrying in ${delay}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

const server = app.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`API documentation: http://${displayHost}:${PORT}/api-docs`);
  // Listening starts before the database is confirmed, so the platform's
  // health check succeeds immediately instead of racing a cold database.
  connectWithRetry();
});

// Drain in-flight requests and close the pool when the platform replaces the
// container, so a deploy does not surface as 502s or leaked connections.
function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    try {
      await sequelize.close();
    } catch {
      // Already closed, or never opened; nothing useful to do here.
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
