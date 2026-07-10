/**
 * Connectivity check: query one SIMKOPDES table and one aruna_ table on local DB.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function parseEnvFile(filePath) {
  const env = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    let value = match[2] ?? '';
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

async function main() {
  const env = parseEnvFile(path.join(__dirname, '../.env.local'));
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  const now = await pool.query('SELECT NOW() AS ts');
  const profil = await pool.query(
    'SELECT COUNT(*)::int AS count FROM profil_koperasi',
  );
  const aruna = await pool.query(
    'SELECT COUNT(*)::int AS count FROM aruna_users',
  );

  console.log('Connected to local DATABASE_URL');
  console.log(`  server time: ${now.rows[0].ts}`);
  console.log(`  profil_koperasi rows: ${profil.rows[0].count}`);
  console.log(`  aruna_users rows: ${aruna.rows[0].count}`);
  await pool.end();
}

main().catch((err) => {
  console.error('Connectivity check failed:', err.message);
  process.exit(1);
});
