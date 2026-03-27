-- StackSave Seed Script
-- Run this in the Supabase SQL Editor after running migration.sql

-- 1. Insert Merchants
INSERT INTO merchants (id, name, category, is_active) VALUES
('b3a123f9-1c9f-4315-9c17-db3c6aa6bb48', 'Amazon', 'E-Commerce', true),
('f1a234f9-2c9f-4315-9c17-cc4c6aa6bb49', 'Flipkart', 'E-Commerce', true),
('c2b345f9-3c9f-4315-9c17-dd5c6aa6bb50', 'Swiggy', 'Food Delivery', true),
('d3c456f9-4c9f-4315-9c17-ee6c6aa6bb51', 'Zomato', 'Food Delivery', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Coupons
INSERT INTO coupons (merchant_id, code, discount_type, discount_value, min_order_value, max_discount, expiry_date, is_active) VALUES
-- Amazon Coupons
('b3a123f9-1c9f-4315-9c17-db3c6aa6bb48', 'SAVE20_AMA', 'PERCENTAGE', 20, 1000, 200, NOW() + INTERVAL '90 days', true),
('b3a123f9-1c9f-4315-9c17-db3c6aa6bb48', 'FLAT150_AMA', 'FLAT', 150, 800, 150, NOW() + INTERVAL '90 days', true),
('b3a123f9-1c9f-4315-9c17-db3c6aa6bb48', 'CASHBACK10_AMA', 'CASHBACK', 10, 500, 100, NOW() + INTERVAL '90 days', true),

-- Flipkart Coupons
('f1a234f9-2c9f-4315-9c17-cc4c6aa6bb49', 'SAVE20_FLI', 'PERCENTAGE', 20, 1000, 200, NOW() + INTERVAL '90 days', true),
('f1a234f9-2c9f-4315-9c17-cc4c6aa6bb49', 'FLAT150_FLI', 'FLAT', 150, 800, 150, NOW() + INTERVAL '90 days', true),
('f1a234f9-2c9f-4315-9c17-cc4c6aa6bb49', 'CASHBACK10_FLI', 'CASHBACK', 10, 500, 100, NOW() + INTERVAL '90 days', true),

-- Swiggy Coupons
('c2b345f9-3c9f-4315-9c17-dd5c6aa6bb50', 'SAVE20_SWI', 'PERCENTAGE', 20, 1000, 200, NOW() + INTERVAL '90 days', true),
('c2b345f9-3c9f-4315-9c17-dd5c6aa6bb50', 'FLAT150_SWI', 'FLAT', 150, 800, 150, NOW() + INTERVAL '90 days', true),
('c2b345f9-3c9f-4315-9c17-dd5c6aa6bb50', 'CASHBACK10_SWI', 'CASHBACK', 10, 500, 100, NOW() + INTERVAL '90 days', true),

-- Zomato Coupons
('d3c456f9-4c9f-4315-9c17-ee6c6aa6bb51', 'SAVE20_ZOM', 'PERCENTAGE', 20, 1000, 200, NOW() + INTERVAL '90 days', true),
('d3c456f9-4c9f-4315-9c17-ee6c6aa6bb51', 'FLAT150_ZOM', 'FLAT', 150, 800, 150, NOW() + INTERVAL '90 days', true),
('d3c456f9-4c9f-4315-9c17-ee6c6aa6bb51', 'CASHBACK10_ZOM', 'CASHBACK', 10, 500, 100, NOW() + INTERVAL '90 days', true);
