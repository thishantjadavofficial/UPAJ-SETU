-- ============================================================
-- UPAJ SETU V2 - Seed Data
-- ============================================================

-- Insert demo veparis (licensed buyers)
INSERT INTO veparis (id, company_name, gst_number, phone) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Sharma Traders Pvt Ltd', '06AAAAA0000A1Z5', '9910000001'),
  ('aaaaaaaa-0001-0001-0001-000000000002', 'Punjab Agri Exports', '03BBBBB1111B2Z6', '9910000002'),
  ('aaaaaaaa-0001-0001-0001-000000000003', 'Haryana Grain House', '06CCCCC2222C3Z7', '9910000003'),
  ('aaaaaaaa-0001-0001-0001-000000000004', 'Green Valley Commodities', '06DDDDD3333D4Z8', '9910000004'),
  ('aaaaaaaa-0001-0001-0001-000000000005', 'Kisaan Mitra Foods', '07EEEEE4444E5Z9', '9910000005')
ON CONFLICT DO NOTHING;

-- Insert V2 officers (reuse existing users table but with V2 roles if needed)
-- Gate Officer V2
INSERT INTO users (id, full_name, phone_number, role) VALUES
  ('bbbbbbbb-0002-0002-0002-000000000001', 'Suresh Gate V2', '8800000101', 'GATE'),
  ('bbbbbbbb-0002-0002-0002-000000000002', 'Ramesh Weight V2', '8800000102', 'WEIGHT'),
  ('bbbbbbbb-0002-0002-0002-000000000003', 'Anita Mandi V2', '8800000103', 'APMC'),
  ('bbbbbbbb-0002-0002-0002-000000000004', 'Vikram Agent V2', '8800000104', 'AGENT')
ON CONFLICT (id) DO NOTHING;

-- Ensure apmc_fees exists
INSERT INTO apmc_fees (id, market_fee_percent, farmer_unloading_fee_percent, agent_commission_percent, gst_percent)
VALUES (1, 2.00, 1.00, 2.50, 5.00)
ON CONFLICT (id) DO NOTHING;
