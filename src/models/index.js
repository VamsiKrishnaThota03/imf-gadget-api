const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');
const { requireEnv } = require('../config/env');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env] || config.development;

let sequelize;
if (env === 'test' && !process.env.DATABASE_URL) {
  // Tests run against an in-memory Postgres emulation (dev dependency only).

  sequelize = require('./memoryDb')();
} else {
  sequelize = new Sequelize(requireEnv('DATABASE_URL'), dbConfig);
}

const db = {
  sequelize,
  Sequelize,
};

db.User = require('./user')(sequelize, DataTypes);
db.Gadget = require('./gadget')(sequelize, DataTypes);

module.exports = db;
