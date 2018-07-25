const Sequelize = require("sequelize");
const config = require('../config');
const sequelize = new Sequelize(
  config.store.mysqlDatabase,
  config.store.mysqlUser,
  config.store.mysqlPassword,
  {
    host: config.store.mysqlHost,
    dialect: config.store.storeDBMS,
    port: config.store.mysqlPort,
    pool: {
      max: config.store.ConnectionLimit,
      idle: config.store.ConnectionIdle,
      waitForConnections: false /* 사용 가능한 커넥션이 없을 경우 바로 ERROR를 return | true일 경우 대기 */
    },
    timezone: "+09:00",
    logging: true
  });

module.exports = sequelize;
