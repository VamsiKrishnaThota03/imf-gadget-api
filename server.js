require('dotenv').config();
const { requireEnv } = require('./src/config/env');

// Fail fast before opening a port when required configuration is missing.
requireEnv('JWT_SECRET');
requireEnv('DATABASE_URL');

const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = Number(process.env.PORT) || 3000;
// Loopback by default for local development. Render sets RENDER=true and needs
// an all-interfaces bind inside its container; HOST can override either way.
const HOST = process.env.HOST || (process.env.RENDER ? '0.0.0.0' : '127.0.0.1');

sequelize
  .authenticate()
  .then(() => sequelize.sync())
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`Server is running on http://${HOST}:${PORT}`);
      console.log(`API documentation: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error('Failed to start: could not connect to the database.', error.message);
    process.exit(1);
  });
