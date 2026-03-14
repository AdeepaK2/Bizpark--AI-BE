#!/usr/bin/env node

/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const coreDir = path.resolve(__dirname, '..');
const envPath = process.env.BIZPARK_ENV_FILE || path.join(coreDir, '.env');

const parseEnv = (raw) => {
  const result = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const idx = trimmed.indexOf('=');
    if (idx <= 0) {
      continue;
    }
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
};

if (fs.existsSync(envPath)) {
  const fileEnv = parseEnv(fs.readFileSync(envPath, 'utf8'));
  for (const [k, v] of Object.entries(fileEnv)) {
    if (process.env[k] === undefined) {
      process.env[k] = v;
    }
  }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error(`DATABASE_URL is required. Checked env file: ${envPath}`);
  process.exit(1);
}

const tables = [
  'User',
  'Business',
  'BusinessUser',
  'Website',
  'Product',
  'SocialMediaPost',
  'Template',
  'AgentTask',
];

const quoteIdent = (name) => `"${String(name).replaceAll('"', '""')}"`;

const main = async () => {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    await client.query('BEGIN');
    const results = [];

    for (const table of tables) {
      const tableRes = await client.query(
        `SELECT table_schema
         FROM information_schema.tables
         WHERE table_name = $1
           AND table_schema IN ('public', 'api', 'admin', 'runner')
         ORDER BY CASE table_schema
           WHEN 'public' THEN 1
           WHEN 'api' THEN 2
           WHEN 'admin' THEN 3
           WHEN 'runner' THEN 4
           ELSE 5
         END
         LIMIT 1`,
        [table],
      );

      if (!tableRes.rows.length) {
        results.push(`skip not found ${table}`);
        continue;
      }

      const currentSchema = tableRes.rows[0].table_schema;
      if (currentSchema === 'public') {
        results.push(`skip public.${table}`);
        continue;
      }

      await client.query(
        `ALTER TABLE ${quoteIdent(currentSchema)}.${quoteIdent(table)} SET SCHEMA "public"`,
      );
      results.push(`move ${currentSchema}.${table} -> public.${table}`);
    }

    await client.query('COMMIT');

    console.log('Schema rollback complete.');
    for (const line of results) {
      console.log(`- ${line}`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Schema rollback failed:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
