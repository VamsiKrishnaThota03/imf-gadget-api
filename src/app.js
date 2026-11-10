const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const gadgetRoutes = require('./routes/gadgetRoutes');
const authRoutes = require('./routes/authRoutes');
const readiness = require('./config/readiness');

const app = express();
app.disable('x-powered-by');
// Render and most PaaS hosts sit behind one proxy hop; needed for rate limiting by client IP.
app.set('trust proxy', 1);

// This is a public bearer-token API (no cookies), so any origin may call it by default.
// Set CORS_ORIGINS to a comma-separated list to restrict browser callers.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const corsOptions = allowedOrigins.length > 0 ? { origin: allowedOrigins } : {};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => res.redirect('/api-docs'));

// Liveness: the process is accepting connections. Deliberately independent of
// the database, so the platform does not restart a healthy process — and lose
// the in-progress connection retries — while the database is still waking.
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Readiness: the process can actually serve data, and why not when it cannot.
app.get('/health/ready', (req, res) => {
  const state = readiness.getState();
  if (state.ready) return res.json({ status: 'ready', attempts: state.attempts });
  res.set('Retry-After', '30');
  return res.status(503).json({
    status: 'unavailable',
    attempts: state.attempts,
    lastError: state.lastError,
  });
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'IMF Gadget API',
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
);

// Slow down credential stuffing / brute force on the auth endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 50),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});

// Both route trees need the database, so they short-circuit to a 503 with
// Retry-After until the connection is up, rather than surfacing a Sequelize
// connection error as an opaque 500.
app.use('/api/auth', authLimiter, readiness.requireDatabase, authRoutes);
app.use('/api/gadgets', readiness.requireDatabase, gadgetRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Express identifies an error handler by its four-parameter signature, so
// `next` must stay declared even though it is never called here.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ message: err.errors.map((e) => e.message).join(', ') });
  }
  console.error(err);
  return res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;
