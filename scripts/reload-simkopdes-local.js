/**
 * Copy SIMKOPDES tables from hackathon shared Postgres into local DATABASE_URL.
 *
 * Source (in order):
 *   1. DATABASE_URL_COMPETITION in .env.local
 *   2. Fallback: public hackathon participant creds documented in gcp_deployment_plan.md
 *
 * Target: DATABASE_URL in .env.local (e.g. localhost:5432/aruna_dev)
 *
 * Usage: node scripts/reload-simkopdes-local.js
 */
const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL must be set in .env.local');
  process.exit(1);
}

if (!process.env.DATABASE_URL_COMPETITION) {
  const password = encodeURIComponent('*H4ck4thonK3men0P2026@');
  process.env.DATABASE_URL_COMPETITION =
    `postgresql://hackathon_participant_2026:${password}@34.101.155.200:5432/hackathon_2026`;
  console.log('Using hackathon shared Postgres source (see gcp_deployment_plan.md)');
}

const copyScript = path.join(__dirname, 'archive/copy-simkopdes-data.js');
const result = spawnSync(process.execPath, [copyScript], {
  stdio: 'inherit',
  env: process.env,
  cwd: path.join(__dirname, '..'),
});

process.exit(result.status ?? 1);
