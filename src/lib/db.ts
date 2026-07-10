import { Pool } from 'pg';

const host = process.env.DB_HOST;
const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
const database = process.env.DB_DATABASE;
const user = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;

// In development, Next.js hot-reloading can create multiple pools.
// We store the pool globally in development to prevent connection leaks.
let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    host,
    port,
    database,
    user,
    password,
    ssl: {
      rejectUnauthorized: false // Required for some GCF/Cloud SQL connections
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} else {
  const globalPool = global as any;
  if (!globalPool.pgPool) {
    globalPool.pgPool = new Pool({
      host,
      port,
      database,
      user,
      password,
      ssl: {
        rejectUnauthorized: false
      },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  pool = globalPool.pgPool;
}

export { pool };

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`[SQL Query] duration: ${duration}ms | rows: ${res.rowCount}`);
    return res;
  } catch (error) {
    console.error(`[SQL Error] query failed: "${text}"`, error);
    throw error;
  }
}

/**
 * Returns the correct table name by prepending the team prefix for custom tables.
 * Shared SIMKOPDES global tables are left unprefixed.
 */
export function getTableName(baseName: string): string {
  const prefix = process.env.DB_PREFIX || '';
  const customTables = [
    'buyers',
    'market_requests',
    'supply_matches',
    'cooperative_scores',
    'insights',
    'users'
  ];

  if (customTables.includes(baseName)) {
    return `${prefix}${baseName}`;
  }
  return baseName;
}
