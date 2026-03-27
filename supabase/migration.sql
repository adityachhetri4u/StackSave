-- ============================================================
-- StackSave Database Migration
-- Execute this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM Types
-- ============================================================
DO $$ BEGIN
    CREATE TYPE discount_type_enum AS ENUM ('FLAT', 'PERCENTAGE', 'CASHBACK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Merchants Table
-- ============================================================
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Cards Table
-- ============================================================
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    card_type TEXT NOT NULL,
    cashback_rate NUMERIC DEFAULT 0,
    max_cap NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- ============================================================
-- Card Merchant Rules Table (PRIMARY reward source)
-- ============================================================
CREATE TABLE IF NOT EXISTS card_merchant_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    category TEXT,
    reward_multiplier NUMERIC DEFAULT 0,
    special_cashback NUMERIC DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cmr_card_id ON card_merchant_rules(card_id);
CREATE INDEX IF NOT EXISTS idx_cmr_merchant_id ON card_merchant_rules(merchant_id);

-- ============================================================
-- Coupons Table
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type discount_type_enum NOT NULL,
    discount_value NUMERIC NOT NULL,
    min_order_value NUMERIC DEFAULT 0,
    max_discount NUMERIC DEFAULT 0,
    expiry_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_coupons_merchant_id ON coupons(merchant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, expiry_date);

-- ============================================================
-- Recommendations Table
-- ============================================================
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    cart_value NUMERIC NOT NULL,
    final_price NUMERIC NOT NULL,
    total_savings NUMERIC NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Cards: users can only see/manage their own cards
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards" ON cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards" ON cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" ON cards
    FOR DELETE USING (auth.uid() = user_id);

-- Recommendations: users can only see their own history
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations" ON recommendations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations" ON recommendations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Merchants: public read access
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active merchants" ON merchants
    FOR SELECT USING (is_active = true);

-- Coupons: public read access
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons" ON coupons
    FOR SELECT USING (is_active = true);

-- Card Merchant Rules: accessible if user owns the card
ALTER TABLE card_merchant_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rules for own cards" ON card_merchant_rules
    FOR SELECT USING (
        card_id IN (SELECT id FROM cards WHERE user_id = auth.uid())
    );

-- ============================================================
-- Service role bypass (for backend operations)
-- The FastAPI backend connects with the service role key
-- which bypasses RLS. This is the intended pattern.
-- ============================================================
