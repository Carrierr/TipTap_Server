const mysql = require('mysql2/promise');
const config = require('../config');
const util = require('util');

const DBModule = (function(){

  const pool = mysql.createPool({
      host: config.store.mysqlHost,
      user: config.store.mysqlUser,
      password: config.store.mysqlPassword,
      database: config.store.mysqlDatabase,
      connectionLimit: config.store.ConnectionLimit,
  });

  pool.on('enqueue', () => {
      console.log(util.format("## Waiting for available connection slot ##"));
  });

  return {
    query: async function (queryString) {
        try {
            const connection = await pool.getConnection(async conn => conn);
            const result = await connection.query(queryString);
            connection.release();
            return first(result);
        }
        catch (error) {
            throw error;
        }
    }
  }
})();

module.exports = DBModule;
