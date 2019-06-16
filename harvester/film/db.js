const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mysql = require('mysql');

// Create the pool
const { host, user, password, database } = process.env;

const pool = mysql.createPool({ host, user, password, database });

exports.query = (query, params) => new Promise((resolve, reject) => {
  pool.getConnection((err, connection) => {
    if (err) {
      if (connection) connection.release();
      console.log(err);
      reject('Could not get a connection from the pool');
    } else {
      connection.query(query, params, (queryErr, rows) => {
        if (connection) connection.release();
        if (!queryErr) {
          resolve(rows);
        } else {
          console.log(queryErr);
          reject('An error occurred with the query');
        }
      });

      connection.on('error', (connectionErr) => {
        if (connection) connection.release();
        console.log(connectionErr);
        reject('An unknown error occurred with the connection');
      });
    }
  });
});

exports.close = () => {
  pool.end(() => {
    console.log('Pool closed');
  });
};
