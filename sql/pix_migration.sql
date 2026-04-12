-- =====================================================
-- PIX PAYMENT INTEGRATION TABLES
-- Execute no SQL Editor do Supabase
-- =====================================================

-- 1. Tabela de usuários PIX (baseada em email, sem necessidade de wallet)
CREATE TABLE IF NOT EXISTS pix_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf VARCHAR(14),
    name VARCHAR(255),
    cdp_wallet_id VARCHAR(255),
    cdp_wallet_address VARCHAR(42),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pix_users_email ON pix_users(email);
CREATE INDEX IF NOT EXISTS idx_pix_users_wallet ON pix_users(cdp_wallet_address);

-- 2. Tabela de pedidos PIX (ciclo de vida: pending -> paid -> minting -> minted)
CREATE TABLE IF NOT EXISTS pix_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES pix_users(id),
    email VARCHAR(255) NOT NULL,
    token_id INTEGER NOT NULL CHECK (token_id BETWEEN 1 AND 18),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price_usd_cents INTEGER NOT NULL,  -- preço original em centavos de dólar
    price_brl INTEGER NOT NULL,        -- preço convertido em centavos de real
    exchange_rate NUMERIC(10,4),       -- cotação USD/BRL usada na conversão
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','paid','minting','minted','mint_failed','failed','expired','refunded')),
    stripe_payment_intent_id VARCHAR(255),
    idempotency_key VARCHAR(255) UNIQUE,
    pix_qr_code TEXT,
    pix_copy_paste TEXT,
    pix_expires_at TIMESTAMPTZ,
    recipient_wallet_address VARCHAR(42),
    tx_hash VARCHAR(66),
    paid_at TIMESTAMPTZ,
    minted_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pix_orders_user ON pix_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_orders_email ON pix_orders(email);
CREATE INDEX IF NOT EXISTS idx_pix_orders_status ON pix_orders(status);
CREATE INDEX IF NOT EXISTS idx_pix_orders_stripe ON pix_orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_pix_orders_created ON pix_orders(created_at);

-- 3. Log de minting (auditoria de tentativas)
CREATE TABLE IF NOT EXISTS mint_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES pix_orders(id),
    wallet_address VARCHAR(42) NOT NULL,
    token_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    tx_hash VARCHAR(66),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','submitted','confirmed','failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mint_log_order ON mint_log(order_id);
CREATE INDEX IF NOT EXISTS idx_mint_log_wallet ON mint_log(wallet_address);

-- 4. Preços dos NFTs em USD (centavos de dólar)
-- A conversão para BRL é feita em tempo real no servidor usando cotação atual
CREATE TABLE IF NOT EXISTS nft_prices (
    token_id INTEGER PRIMARY KEY CHECK (token_id BETWEEN 1 AND 18),
    price_usd_cents INTEGER NOT NULL, -- preço em centavos de dólar (ex: 6500 = $65.00)
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preços conforme Shop.tsx: Token 1=$65 (mais raro) até Token 10=$20 (mais comum)
INSERT INTO nft_prices (token_id, price_usd_cents) VALUES
    (1, 6500), (2, 6000), (3, 5500), (4, 5000), (5, 4500),
    (6, 4000), (7, 3500), (8, 3000), (9, 2500), (10, 2000),
    (11, 20000), (12, 20000), (13, 20000), (14, 20000),
    (15, 20000), (16, 20000), (17, 20000), (18, 20000)
ON CONFLICT (token_id) DO NOTHING;

-- 5. Triggers para updated_at
DROP TRIGGER IF EXISTS update_pix_users_updated_at ON pix_users;
CREATE TRIGGER update_pix_users_updated_at
    BEFORE UPDATE ON pix_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pix_orders_updated_at ON pix_orders;
CREATE TRIGGER update_pix_orders_updated_at
    BEFORE UPDATE ON pix_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS (Row Level Security)
ALTER TABLE pix_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mint_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_prices ENABLE ROW LEVEL SECURITY;

-- Preços: leitura pública
CREATE POLICY "nft_prices_public_read" ON nft_prices
    FOR SELECT USING (true);

-- Demais tabelas: apenas service_role (server-side)
CREATE POLICY "pix_users_service_role" ON pix_users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "pix_orders_service_role" ON pix_orders
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "mint_log_service_role" ON mint_log
    FOR ALL USING (auth.role() = 'service_role');

-- Leitura pública de pedidos (frontend polling via order ID)
CREATE POLICY "pix_orders_public_read" ON pix_orders
    FOR SELECT USING (true);
