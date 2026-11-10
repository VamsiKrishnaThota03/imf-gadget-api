/**
 * Tracks whether the database is usable, so the HTTP listener can come up
 * before the first successful connection.
 *
 * Why this exists: a free-tier managed Postgres sleeps when idle and takes
 * 30-60s to wake. The previous startup sequence called `sequelize.authenticate()`
 * once and `process.exit(1)` on failure, so a sleeping database turned into a
 * crash-loop and the platform eventually marked the whole service failed.
 * Now the server listens immediately, the platform health check passes, and the
 * connection is retried in the background; data routes answer 503 until it lands.
 */

const state = {
  /** True once a connection has been established and models synced. */
  ready: false,
  /** Message from the most recent connection failure, for the probe payload. */
  lastError: null,
  /** How many connection attempts have been made. */
  attempts: 0,
};

module.exports = {
  isReady: () => state.ready,
  getState: () => ({ ...state }),

  markReady() {
    state.ready = true;
    state.lastError = null;
  },

  markFailed(error) {
    state.ready = false;
    state.lastError = error instanceof Error ? error.message : String(error);
  },

  recordAttempt() {
    state.attempts += 1;
    return state.attempts;
  },

  /**
   * Express middleware for routes that cannot work without the database.
   * Returns 503 with Retry-After rather than letting Sequelize throw a
   * connection error that the generic handler would report as a 500.
   */
  requireDatabase(req, res, next) {
    if (state.ready) return next();
    res.set('Retry-After', '30');
    return res.status(503).json({
      message: 'Database unavailable, the service is still starting up. Retry shortly.',
    });
  },
};
