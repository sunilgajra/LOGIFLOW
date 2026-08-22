import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('PG CONNECTION ERROR:', err);
  } else {
    console.log('PG CONNECTED OK:', res.rows[0]);
  }
  pool.end();
});
