// backend/config/db.js
const mysql = require('mysql2/promise');

// Creamos un pool de conexiones usando las variables de .env
const pool = mysql.createPool({
  host: process.env.DB_HOST,     // Tomamos de .env
  user: process.env.DB_USER,     // Tomamos de .env
  password: process.env.DB_PASS, // Tomamos de .env
  database: process.env.DB_NAME  // Tomamos de .env
});

module.exports = pool;
