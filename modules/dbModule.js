const mysql = require('mysql');
const config = require('../config');
const util = require('util');

const DBModule = (function(){
  return {
    Init: function () {
        this._pool = mysql.createPool({
            host: config.store.mysqlHost,
            user: config.store.mysqlUser,
            password: config.store.mysqlPassword,
            database: config.store.mysqlDatabase,
            connectionLimit: config.store.ConnectionLimit,
        });
        this._pool.on('enqueue', function () {
            console.log(util.format("## Waiting for available connection slot ##"));
        });
    },
    Query: function (query, value, succEvent) {
        this._pool.getConnection(function (err, connection) {
            connection.query(query, value, function (err, rows) {
                if (err) {
                    connection.release();
                    throw err;
                }
                succEvent(rows);
                connection.release();
            });
        })
    }
})();

module.exports = DBModule;
