/**
 * In-memory Postgres emulation used only by the test suite (pg-mem is a dev
 * dependency). It papers over the two catalog features Sequelize's ENUM
 * support needs that pg-mem does not implement.
 */
const { Sequelize } = require('sequelize');

module.exports = function createMemorySequelize() {
  // eslint-disable-next-line global-require
  const { newDb } = require('pg-mem');
  const mem = newDb();

  mem.public.interceptQueries((sql) => {
    // Sequelize checks pg_enum for existing enum types: report none.
    if (sql.includes('JOIN pg_enum')) return [];
    // Sequelize wraps CREATE TYPE in a DO block, which pg-mem cannot parse.
    const match = sql.match(/DO '?\s*BEGIN (CREATE TYPE .*?);\s*EXCEPTION/s);
    if (match) {
      mem.public.none(match[1].replace(/''/g, "'"));
      return [];
    }
    return null;
  });

  return new Sequelize({
    dialect: 'postgres',
    dialectModule: mem.adapters.createPg(),
    logging: false,
  });
};
