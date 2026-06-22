-- ARUNA (Analitik Usaha Rakyat Nusantara) Database Schema
-- Designed for Supabase / PostgreSQL

-- 1. Cooperatives Table
CREATE TABLE cooperatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    province VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    member_count INT NOT NULL DEFAULT 0,
    active_members INT NOT NULL DEFAULT 0,
    annual_revenue DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_active_members CHECK (active_members <= member_count)
);

-- 2. Commodities Table
CREATE TABLE commodities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cooperative_id UUID NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., Pertanian, Perkebunan, Peternakan, Perikanan
    monthly_capacity DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- in tons
    available_stock DECIMAL(12, 2) NOT NULL DEFAULT 0.00,  -- in tons
    unit VARCHAR(20) NOT NULL DEFAULT 'ton',
    harvest_period VARCHAR(100), -- e.g., 'Setiap 3 bulan', 'Musiman (Agustus-Oktober)'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Buyers Table (National Offtakers / Companies)
CREATE TABLE buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Market Requests Table (National Demand)
CREATE TABLE market_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    commodity_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL, -- in tons
    unit VARCHAR(20) NOT NULL DEFAULT 'ton',
    status VARCHAR(50) NOT NULL DEFAULT 'Menunggu Pemenuhan', -- 'Menunggu Pemenuhan', 'Terpenuhi Sebagian', 'Terpenuhi'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Supply Matches Table (Gotong Royong Allocation mapping)
CREATE TABLE supply_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES market_requests(id) ON DELETE CASCADE,
    cooperative_id UUID NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    allocated_quantity DECIMAL(12, 2) NOT NULL, -- quantity matched from this co-op
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(request_id, cooperative_id)
);

-- 6. Cooperative Scores Table (ARUNA Scoring system)
CREATE TABLE cooperative_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cooperative_id UUID NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE UNIQUE,
    health_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    growth_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    supply_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    final_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    grade VARCHAR(2) NOT NULL, -- 'A', 'B', 'C', 'D'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Insights Table (AI / Rule Engine Output)
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cooperative_id UUID REFERENCES cooperatives(id) ON DELETE CASCADE, -- null if it's national level insight
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'Info', -- 'Info', 'Peringatan', 'Kritis'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_cooperatives_province ON cooperatives(province);
CREATE INDEX idx_commodities_name ON commodities(name);
CREATE INDEX idx_market_requests_status ON market_requests(status);
CREATE INDEX idx_supply_matches_request ON supply_matches(request_id);
CREATE INDEX idx_cooperative_scores_final ON cooperative_scores(final_score);
