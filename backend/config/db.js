const mysql = require('mysql2/promise');
require('dotenv').config();

//connection pool for MySQL database
const pool = mysql.createPool
({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//test of database connection
const testConnection = async () => {
    let connection;

    try {
        connection = await pool.getConnection();

        console.log('MySQL database connected successfully!');
    }
    catch(error) {
        console.error('MySQL database connection failed:', error.message);
    }
    finally{
        if (connection)
        {
            connection.release();
        }
    }
};

module.exports = {pool, testConnection};