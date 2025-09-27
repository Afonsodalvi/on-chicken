-- =====================================================
-- SCHEMA FINAL PARA WHITELIST PUDGY FARMS
-- Execute este comando no SQL Editor do Supabase
-- =====================================================

-- 1. Criar tabela principal (se não existir)
CREATE TABLE IF NOT EXISTS wallet_whitelist (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    user_name VARCHAR(255),
    email VARCHAR(255),
    twitter_post_url TEXT,
    instagram_post_url TEXT,
    linkedin_post_url TEXT,
    other_social_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by VARCHAR(255),
    notes TEXT
);

-- 2. Atualizar tabela existente (se já existir)
-- Remove colunas antigas e adiciona novas
DO $$ 
BEGIN
    -- Remove colunas antigas se existirem
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_whitelist' AND column_name = 'twitter_handle') THEN
        ALTER TABLE wallet_whitelist DROP COLUMN twitter_handle;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_whitelist' AND column_name = 'discord_handle') THEN
        ALTER TABLE wallet_whitelist DROP COLUMN discord_handle;
    END IF;
    
    -- Adiciona novas colunas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_whitelist' AND column_name = 'twitter_post_url') THEN
        ALTER TABLE wallet_whitelist ADD COLUMN twitter_post_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_whitelist' AND column_name = 'instagram_post_url') THEN
        ALTER TABLE wallet_whitelist ADD COLUMN instagram_post_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_whitelist' AND column_name = 'linkedin_post_url') THEN
        ALTER TABLE wallet_whitelist ADD COLUMN linkedin_post_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_whitelist' AND column_name = 'other_social_url') THEN
        ALTER TABLE wallet_whitelist ADD COLUMN other_social_url TEXT;
    END IF;
END $$;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_wallet_whitelist_address ON wallet_whitelist(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_whitelist_status ON wallet_whitelist(status);
CREATE INDEX IF NOT EXISTS idx_wallet_whitelist_created_at ON wallet_whitelist(created_at);

-- 4. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_wallet_whitelist_updated_at ON wallet_whitelist;
CREATE TRIGGER update_wallet_whitelist_updated_at 
    BEFORE UPDATE ON wallet_whitelist 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Criar view para estatísticas
CREATE OR REPLACE VIEW whitelist_stats AS
SELECT 
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as requests_today
FROM wallet_whitelist;

-- 7. Comentários para documentação
COMMENT ON TABLE wallet_whitelist IS 'Tabela para gerenciar whitelist de endereços de carteira do Pudgy Farms';
COMMENT ON COLUMN wallet_whitelist.wallet_address IS 'Endereço da carteira Ethereum (0x...)';
COMMENT ON COLUMN wallet_whitelist.status IS 'Status da aprovação: pending, approved, rejected';
COMMENT ON COLUMN wallet_whitelist.user_name IS 'Nome do usuário (opcional)';
COMMENT ON COLUMN wallet_whitelist.email IS 'Email do usuário (opcional)';
COMMENT ON COLUMN wallet_whitelist.twitter_post_url IS 'URL do post no Twitter compartilhando o projeto';
COMMENT ON COLUMN wallet_whitelist.instagram_post_url IS 'URL do post no Instagram compartilhando o projeto';
COMMENT ON COLUMN wallet_whitelist.linkedin_post_url IS 'URL do post no LinkedIn compartilhando o projeto';
COMMENT ON COLUMN wallet_whitelist.other_social_url IS 'URL de outras redes sociais compartilhando o projeto';

-- 8. Inserir dados de exemplo (opcional - remover em produção)
INSERT INTO wallet_whitelist (wallet_address, user_name, status) VALUES 
('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 'Admin User', 'approved'),
('0x8ba1f109551bD432803012645Hac136c', 'Test User', 'pending')
ON CONFLICT (wallet_address) DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
-- Execute esta query para verificar se tudo foi criado corretamente:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'wallet_whitelist' 
-- ORDER BY ordinal_position;
-- =====================================================
