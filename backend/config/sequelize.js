// ================================================================
// MYSQL CONNECTION CONFIG (Sequelize)
// Replaces: config/db.js (Mongoose)
// ================================================================

const { Sequelize } = require('sequelize');

// ── Sequelize instance ────────────────────────────────────────────
const sequelize = new Sequelize(
  process.env.DB_NAME || 'pms_db',
  process.env.DB_USER || 'pms_user',
  process.env.DB_PASS || 'pms_password',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle:    10000,
    },
    define: {
      underscored:   false,
      freezeTableName: false,
      timestamps:    true,
    },
  }
);

module.exports = sequelize;
