import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  max: 5,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error("❌ Error acquiring client", err.stack);
  }
  console.log("✅ Connected to PostgreSQL successfully (pg pool)");
  release(); // Always release the test client back to the pool!
});

// Exporting a helper function to keep things clean
export const query = (text, params) => pool.query(text, params);

// Exporting the pool itself for transactions
export default pool;

// import postgres from "postgres";

// const sql = postgres({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   database: process.env.DATABASE,
//   username: process.env.DB_USERNAME,
//   password: process.env.DB_PASSWORD,
//   max: 5,
// });

// (async () => {
//   try {
//     await sql`SELECT 1`;
//     console.log("✅ Database connection established (postgres.js)");
//   } catch (err) {
//     console.error("❌ Database connection failed:", err.message);
//   }
// })();

// export default sql;
