const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 1. Parse .env.local to get DB credentials
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
});

const prefix = env['DB_PREFIX'];
console.log(`Using table prefix: "${prefix}"`);

// 2. Initialize pg pool
const pool = new Pool({
  host: env['DB_HOST'],
  port: env['DB_PORT'] ? parseInt(env['DB_PORT'], 10) : 5432,
  database: env['DB_DATABASE'],
  user: env['DB_USERNAME'],
  password: env['DB_PASSWORD'],
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('Testing connection to PostgreSQL database...');
    await pool.query('SELECT NOW()');
    console.log('Connection successful!');

    // 3. Create Custom Tables
    console.log('Creating custom tables...');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${prefix}users (
        uid VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        associated_id VARCHAR(255) NULL,
        address TEXT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`- Table ${prefix}users created or already exists.`);

    // Buyers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${prefix}buyers (
        id VARCHAR(255) PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        industry VARCHAR(100) NOT NULL,
        buyer_type VARCHAR(20) DEFAULT 'industri',
        nib VARCHAR(13) NULL,
        siup VARCHAR(50) NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`- Table ${prefix}buyers created or already exists.`);

    // Market Requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${prefix}market_requests (
        id VARCHAR(255) PRIMARY KEY,
        buyer_id VARCHAR(255) NOT NULL REFERENCES ${prefix}buyers(id) ON DELETE CASCADE,
        commodity_name VARCHAR(100) NOT NULL,
        quantity DECIMAL(12, 2) NOT NULL,
        unit VARCHAR(20) NOT NULL DEFAULT 'ton',
        status VARCHAR(50) NOT NULL DEFAULT 'Menunggu Pemenuhan',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`- Table ${prefix}market_requests created or already exists.`);

    // Supply Matches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${prefix}supply_matches (
        id VARCHAR(255) PRIMARY KEY,
        request_id VARCHAR(255) NOT NULL REFERENCES ${prefix}market_requests(id) ON DELETE CASCADE,
        cooperative_id VARCHAR(255) NOT NULL,
        allocated_quantity DECIMAL(12, 2) NOT NULL,
        matched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(request_id, cooperative_id)
      )
    `);
    console.log(`- Table ${prefix}supply_matches created or already exists.`);

    // Cooperative Scores table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${prefix}cooperative_scores (
        id VARCHAR(255) PRIMARY KEY,
        cooperative_id VARCHAR(255) NOT NULL UNIQUE,
        health_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
        growth_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
        supply_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
        final_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
        grade VARCHAR(2) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`- Table ${prefix}cooperative_scores created or already exists.`);

    // Insights table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${prefix}insights (
        id VARCHAR(255) PRIMARY KEY,
        cooperative_id VARCHAR(255) NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        severity VARCHAR(50) NOT NULL DEFAULT 'Info',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`- Table ${prefix}insights created or already exists.`);

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_${prefix}requests_buyer ON ${prefix}market_requests(buyer_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_${prefix}matches_req ON ${prefix}supply_matches(request_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_${prefix}scores_coop ON ${prefix}cooperative_scores(cooperative_id)`);
    console.log('Indexes created successfully.');

    // 4. Seed Data from data.json
    console.log('Seeding mock data into custom tables...');
    const dataPath = path.join(__dirname, '../src/lib/mock/data.json');
    if (!fs.existsSync(dataPath)) {
      console.warn('Mock data.json file not found, skipping seed.');
      return;
    }

    const mockData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Seed Buyers
    if (mockData.buyers) {
      console.log(`Seeding ${mockData.buyers.length} buyers...`);
      for (const buyer of mockData.buyers) {
        await pool.query(`
          INSERT INTO ${prefix}buyers (id, company_name, city, industry, buyer_type, nib, siup, verified)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, [
          buyer.id,
          buyer.company_name,
          buyer.city,
          buyer.industry,
          buyer.buyer_type || 'industri',
          buyer.nib || '',
          buyer.siup || '',
          buyer.verified || false
        ]);
      }
    }

    // Seed Market Requests
    if (mockData.market_requests) {
      console.log(`Seeding ${mockData.market_requests.length} market requests...`);
      for (const req of mockData.market_requests) {
        await pool.query(`
          INSERT INTO ${prefix}market_requests (id, buyer_id, commodity_name, quantity, unit, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING
        `, [
          req.id,
          req.buyer_id,
          req.commodity_name,
          req.quantity,
          req.unit,
          req.status
        ]);
      }
    }

    // Seed default admin user
    await pool.query(`
      INSERT INTO ${prefix}users (uid, name, email, role, associated_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (uid) DO NOTHING
    `, [
      'mock-user-123',
      'Admin Koperasi Lampung Makmur',
      'admin.lampung@koperasi.id',
      'koperasi',
      'coop-lampung-tani'
    ]);

    console.log('Seeding completed successfully!');

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
    console.log('Pool closed. Migration process finished.');
  }
}

runMigration();
