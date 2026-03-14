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

const moves = [
  { table: 'User', targetSchema: 'api' },
  { table: 'Business', targetSchema: 'api' },
  { table: 'BusinessUser', targetSchema: 'api' },
  { table: 'Website', targetSchema: 'api' },
  { table: 'Product', targetSchema: 'api' },
  { table: 'SocialMediaPost', targetSchema: 'api' },
  { table: 'Template', targetSchema: 'admin' },
  { table: 'AgentTask', targetSchema: 'runner' },
];

const quoteIdent = (name) => `"${String(name).replaceAll('"', '""')}"`;

const main = async () => {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    await client.query('BEGIN');

    await client.query('CREATE SCHEMA IF NOT EXISTS api');
    await client.query('CREATE SCHEMA IF NOT EXISTS admin');
    await client.query('CREATE SCHEMA IF NOT EXISTS runner');

    const results = [];

    for (const move of moves) {
      const tableRes = await client.query(
        `SELECT table_schema
         FROM information_schema.tables
         WHERE table_name = $1
           AND table_schema IN ('public', 'api', 'admin', 'runner')
         ORDER BY CASE table_schema
           WHEN 'api' THEN 1
           WHEN 'admin' THEN 2
           WHEN 'runner' THEN 3
           WHEN 'public' THEN 4
           ELSE 5
         END
         LIMIT 1`,
        [move.table],
      );

      if (!tableRes.rows.length) {
        throw new Error(`Table "${move.table}" not found in public/api/admin/runner.`);
      }

      const currentSchema = tableRes.rows[0].table_schema;

      if (currentSchema === move.targetSchema) {
        results.push(`skip ${currentSchema}.${move.table}`);
        continue;
      }

      await client.query(
        `ALTER TABLE ${quoteIdent(currentSchema)}.${quoteIdent(move.table)} SET SCHEMA ${quoteIdent(
          move.targetSchema,
        )}`,
      );
      results.push(`move ${currentSchema}.${move.table} -> ${move.targetSchema}.${move.table}`);
    }

    await client.query('COMMIT');

    console.log('Schema split migration complete.');
    for (const line of results) {
      console.log(`- ${line}`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Schema split migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
