require('dotenv').config();

/**
 * Read a required environment variable and fail fast with a clear message
 * when it is missing. No secret fallbacks are provided on purpose.
 */
const requireEnv = (name) => {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and set it.`,
    );
  }
  return value;
};

module.exports = { requireEnv };
