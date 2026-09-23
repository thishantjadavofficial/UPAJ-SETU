-- ============================================================
-- UPAJ SETU V2 - Schema (Run in Supabase SQL Editor)
-- Adapts alongside V1 tables — adds farmer_uid to users
-- and creates all new V2 tables
-- ============================================================

-- 1. Extend existing users table with farmer_uid
ALTER TABLE users ADD COLUMN IF NOT EXISTS farmer_uid VARCHAR(20) UNIQUE;

-- 2. Licensed Buyers Directory
CREATE TABLE IF NOT EXISTS veparis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(255) NOT NULL,
  gst_number VARCHAR(15) UNIQUE,
  phone VARCHAR(15) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Global APMC Fee Settings
CREATE TABLE IF NOT EXISTS apmc_fees (
  id INT PRIMARY KEY DEFAULT 1,
  market_fee_percent NUMERIC(5,2) DEFAULT 2.00,
  farmer_unloading_fee_percent NUMERIC(5,2) DEFAULT 1.00,
  agent_commission_percent NUMERIC(5,2) DEFAULT 2.50,
  gst_percent NUMERIC(5,2) DEFAULT 5.00
);
INSERT INTO apmc_fees (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 4. Master Visit Token
CREATE TABLE IF NOT EXISTS master_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_number VARCHAR(20) UNIQUE NOT NULL,
  farmer_uid VARCHAR(20) REFERENCES users(farmer_uid),
  farmer_name VARCHAR(255),
  is_walk_in BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'BOOKED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  arrived_at TIMESTAMP WITH TIME ZONE
);

-- 5. Granular Crop Tracking
CREATE TABLE IF NOT EXISTS crop_sub_lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_id VARCHAR(30) UNIQUE NOT NULL,
  master_token_id UUID REFERENCES master_tokens(id) ON DELETE CASCADE,
  crop_name VARCHAR(100) NOT NULL,
  estimated_weight NUMERIC(10,2),
  actual_weight NUMERIC(10,2) DEFAULT NULL,
  auction_rate NUMERIC(10,2) DEFAULT NULL,
  vepari_id UUID REFERENCES veparis(id) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'PENDING'
);

-- 6. Final Settlement Records
CREATE TABLE IF NOT EXISTS v2_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_number VARCHAR(30) UNIQUE NOT NULL,
  bill_type VARCHAR(20) NOT NULL,
  crop_sub_lot_id UUID REFERENCES crop_sub_lots(id),
  master_token_id UUID REFERENCES master_tokens(id),
  gross_amount NUMERIC(12,2) NOT NULL,
  total_fees NUMERIC(12,2) NOT NULL,
  net_amount NUMERIC(12,2) NOT NULL,
  fee_breakdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE master_tokens, crop_sub_lots, v2_bills, apmc_fees, veparis;
