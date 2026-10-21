import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

if (fs.existsSync(path.join(rootDir, '.env.local'))) {
  dotenv.config({ path: path.join(rootDir, '.env.local') });
} else {
  dotenv.config({ path: path.join(rootDir, '.env') });
}

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL is missing.');
  process.exit(1);
}

// Extract password from connection string
const urlMatch = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@/);
const password = urlMatch ? decodeURIComponent(urlMatch[2]) : null;

async function tryConnect(connStr, label) {
  console.log(`🔄 Trying connection via [${label}]...`);
  const client = new pg.Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log(`✅ Connected successfully via [${label}]!`);
    return client;
  } catch (err) {
    console.log(`⚠️ Connection via [${label}] failed: ${err.message}`);
    await client.end().catch(() => {});
    return null;
  }
}

async function runMigrations() {
  let client = await tryConnect(connectionString, 'DATABASE_URL from .env.local');

  // If pooler tenant was not found, try Direct Connection
  if (!client && password) {
    const directConnStr = `postgresql://postgres:${encodeURIComponent(password)}@db.lwlryzfcvxwjwshvorfu.supabase.co:5432/postgres`;
    client = await tryConnect(directConnStr, 'Direct Host db.lwlryzfcvxwjwshvorfu.supabase.co:5432');
  }

  // Also try IPv4 pooler if direct fails
  if (!client && password) {
    const poolerUsEast1 = `postgresql://postgres.lwlryzfcvxwjwshvorfu:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`;
    client = await tryConnect(poolerUsEast1, 'US East 1 Pooler');
  }

  if (!client) {
    console.error('\n❌ Could not connect using any candidate endpoints. Please check project status.');
    process.exit(1);
  }

  try {
    const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`\n⏳ Running migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      await client.query(sql);
      console.log(`✅ ${file} applied successfully.`);
    }

    console.log('\n🔍 Verifying public tables in Supabase...');
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tableNames = res.rows.map((r) => r.table_name);
    console.log('📊 Existing tables in public schema:', tableNames);

    console.log('\n🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY! Database is ready.');
  } catch (err) {
    console.error('❌ Migration query failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
