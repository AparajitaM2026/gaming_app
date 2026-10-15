const { Client } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_u8e9bHatFTpY@ep-misty-recipe-b4mm6qtl-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function testConnection() {
  const client = new Client({ connectionString });
  try {
    console.log("Connecting to Neon PostgreSQL...");
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT NOW() as current_time, version();');
    console.log("Database Response:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Neon Connection Error:", err);
  }
}

testConnection();
