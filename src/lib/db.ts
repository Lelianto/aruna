import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

const host = process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost';
const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
const database = process.env.DB_DATABASE || process.env.POSTGRES_DATABASE || 'postgres';
const user = process.env.DB_USERNAME || process.env.POSTGRES_USER || 'postgres';
const password = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres';

// In development, Next.js hot-reloading can create multiple pools.
// We store the pool globally in development to prevent connection leaks.
let pool: Pool;

// The shared hackathon Postgres instance can have highly variable network
// latency (connection setup has been observed to take anywhere from ~700ms
// to over 2.5s), so a short timeout here causes frequent, transient
// "Connection terminated due to connection timeout" failures.
const CONNECTION_TIMEOUT_MS = 10000;

const sslConfig = {
  rejectUnauthorized: false,
};

const createPool = () =>
  new Pool({
    ...(connectionString
      ? { connectionString }
      : {
          host,
          port,
          database,
          user,
          password,
        }),
    ssl: sslConfig,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  });

if (process.env.NODE_ENV === 'production') {
  pool = createPool();
} else {
  const globalPool = global as typeof globalThis & { pgPool?: Pool };
  if (!globalPool.pgPool) {
    globalPool.pgPool = createPool();
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
