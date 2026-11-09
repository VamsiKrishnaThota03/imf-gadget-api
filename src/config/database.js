require('dotenv').config();

const sslEnabled = (process.env.DB_SSL || '').toLowerCase() === 'true';

const base = {
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
};

const withSsl = (cfg, enabled) =>
  enabled
    ? {
        ...cfg,
        dialectOptions: {
          ssl: {
            require: true,
            // Managed Postgres providers (Render, Heroku...) commonly use
            // certificates that are not in Node's default CA bundle.
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
          },
        },
      }
    : cfg;

module.exports = {
  development: withSsl(base, sslEnabled),
  test: withSsl(base, sslEnabled),
  // SSL stays on by default in production unless DB_SSL=false is set explicitly.
  production: withSsl(base, (process.env.DB_SSL || 'true').toLowerCase() !== 'false'),
};
