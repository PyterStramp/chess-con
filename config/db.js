//Postgres

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionData = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASS,
    port: process.env.POSTGRES_PORT,    
}

const pool = new Pool(connectionData);

module.exports = pool;
