const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(config[env].url, config[env]);

const db = {
  sequelize,
  Sequelize,
};

// Import models
db.User = require('./user')(sequelize, Sequelize);
db.Gadget = require('./gadget')(sequelize, Sequelize);

module.exports = db; 