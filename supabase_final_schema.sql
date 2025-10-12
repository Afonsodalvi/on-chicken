-- =====================================================
-- SCHEMA COMPLETO PARA PUDGY FARMS
-- Execute este comando no SQL Editor do Supabase
-- Inclui: Whitelist, Development Course, RWAnimals
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
-- TABELAS ADICIONAIS - DEVELOPMENT COURSE
-- =====================================================

-- 9. Criar tabela para emails do curso de desenvolvimento
CREATE TABLE IF NOT EXISTS development_course_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    source VARCHAR(50) DEFAULT 'website',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Criar índices para development_course_subscriptions
CREATE INDEX IF NOT EXISTS idx_development_course_email ON development_course_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_development_course_active ON development_course_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_development_course_created ON development_course_subscriptions(created_at);

-- 11. Criar trigger para development_course_subscriptions
CREATE TRIGGER update_development_course_updated_at 
    BEFORE UPDATE ON development_course_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Comentários para development_course_subscriptions
COMMENT ON TABLE development_course_subscriptions IS 'Armazena emails de inscrição no curso de desenvolvimento blockchain';
COMMENT ON COLUMN development_course_subscriptions.email IS 'Email do usuário inscrito';
COMMENT ON COLUMN development_course_subscriptions.subscribed_at IS 'Data e hora da inscrição';
COMMENT ON COLUMN development_course_subscriptions.is_active IS 'Se a inscrição está ativa';
COMMENT ON COLUMN development_course_subscriptions.source IS 'Origem da inscrição (website, app, etc.)';

-- =====================================================
-- TABELAS ADICIONAIS - RWANIMALS COLLECTIONS
-- =====================================================

-- 13. Criar tabela para informações dos RWAnimals
CREATE TABLE IF NOT EXISTS rwanimals_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    images_link TEXT NOT NULL,
    region VARCHAR(100) NOT NULL,
    farm_type VARCHAR(100) NOT NULL,
    total_nfts INTEGER NOT NULL CHECK (total_nfts > 0),
    owner_email VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    farm_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id)
);

-- 14. Criar índices para rwanimals_collections
CREATE INDEX IF NOT EXISTS idx_rwanimals_owner_email ON rwanimals_collections(owner_email);
CREATE INDEX IF NOT EXISTS idx_rwanimals_status ON rwanimals_collections(status);
CREATE INDEX IF NOT EXISTS idx_rwanimals_region ON rwanimals_collections(region);
CREATE INDEX IF NOT EXISTS idx_rwanimals_farm_type ON rwanimals_collections(farm_type);
CREATE INDEX IF NOT EXISTS idx_rwanimals_created ON rwanimals_collections(created_at);

-- 15. Criar trigger para rwanimals_collections
CREATE TRIGGER update_rwanimals_updated_at 
    BEFORE UPDATE ON rwanimals_collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 16. Comentários para rwanimals_collections
COMMENT ON TABLE rwanimals_collections IS 'Armazena informações das coleções de RWAnimals (Real World Animals)';
COMMENT ON COLUMN rwanimals_collections.collection_name IS 'Nome da coleção de animais';
COMMENT ON COLUMN rwanimals_collections.description IS 'Descrição detalhada dos animais';
COMMENT ON COLUMN rwanimals_collections.images_link IS 'Link para as imagens dos animais';
COMMENT ON COLUMN rwanimals_collections.region IS 'Região da fazenda';
COMMENT ON COLUMN rwanimals_collections.farm_type IS 'Tipo da fazenda';
COMMENT ON COLUMN rwanimals_collections.total_nfts IS 'Número máximo de NFTs que podem ser tokenizados';
COMMENT ON COLUMN rwanimals_collections.owner_email IS 'Email do proprietário da fazenda';
COMMENT ON COLUMN rwanimals_collections.status IS 'Status da aprovação da coleção';

-- =====================================================
-- TABELAS AUXILIARES - REGIÕES E TIPOS DE FAZENDA
-- =====================================================

-- 17. Criar tabela de regiões brasileiras
CREATE TABLE IF NOT EXISTS farm_regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    state VARCHAR(2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Inserir regiões brasileiras
INSERT INTO farm_regions (name, state) VALUES
('Norte', 'AC'), ('Norte', 'AM'), ('Norte', 'AP'), ('Norte', 'PA'), ('Norte', 'RO'), ('Norte', 'RR'), ('Norte', 'TO'),
('Nordeste', 'AL'), ('Nordeste', 'BA'), ('Nordeste', 'CE'), ('Nordeste', 'MA'), ('Nordeste', 'PB'), ('Nordeste', 'PE'), ('Nordeste', 'PI'), ('Nordeste', 'RN'), ('Nordeste', 'SE'),
('Centro-Oeste', 'DF'), ('Centro-Oeste', 'GO'), ('Centro-Oeste', 'MT'), ('Centro-Oeste', 'MS'),
('Sudeste', 'ES'), ('Sudeste', 'MG'), ('Sudeste', 'RJ'), ('Sudeste', 'SP'),
('Sul', 'PR'), ('Sul', 'RS'), ('Sul', 'SC')
ON CONFLICT (name) DO NOTHING;

-- 19. Criar tabela de tipos de fazenda
CREATE TABLE IF NOT EXISTS farm_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. Inserir tipos de fazenda
INSERT INTO farm_types (name, description) VALUES
('Avicultura', 'Fazenda especializada em criação de aves (galinhas, patos, perus)'),
('Suinocultura', 'Fazenda especializada em criação de suínos'),
('Bovinocultura', 'Fazenda especializada em criação de bovinos (gado de corte e leite)'),
('Caprinocultura', 'Fazenda especializada em criação de caprinos'),
('Ovinocultura', 'Fazenda especializada em criação de ovinos'),
('Piscicultura', 'Fazenda especializada em criação de peixes'),
('Apicultura', 'Fazenda especializada em criação de abelhas'),
('Mista', 'Fazenda com múltiplos tipos de criação animal'),
('Experimental', 'Fazenda para pesquisa e desenvolvimento'),
('Sustentável', 'Fazenda com foco em práticas sustentáveis')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- VIEWS E RELATÓRIOS
-- =====================================================

-- 21. View para relatórios de inscrições no curso
CREATE OR REPLACE VIEW course_subscriptions_report AS
SELECT 
    DATE(created_at) as subscription_date,
    COUNT(*) as total_subscriptions,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_subscriptions
FROM development_course_subscriptions
GROUP BY DATE(created_at)
ORDER BY subscription_date DESC;

-- 22. View para relatórios de RWAnimals
CREATE OR REPLACE VIEW rwanimals_report AS
SELECT 
    region,
    farm_type,
    status,
    COUNT(*) as total_collections,
    SUM(total_nfts) as total_potential_nfts
FROM rwanimals_collections
GROUP BY region, farm_type, status
ORDER BY region, farm_type;

-- 23. View consolidada de estatísticas gerais
CREATE OR REPLACE VIEW project_stats AS
SELECT 
    (SELECT COUNT(*) FROM wallet_whitelist) as total_whitelist_requests,
    (SELECT COUNT(*) FROM development_course_subscriptions) as total_course_subscriptions,
    (SELECT COUNT(*) FROM rwanimals_collections) as total_rwanimals_collections,
    (SELECT COUNT(*) FROM wallet_whitelist WHERE status = 'approved') as approved_whitelist,
    (SELECT COUNT(*) FROM rwanimals_collections WHERE status = 'approved') as approved_rwanimals;

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL - REMOVER EM PRODUÇÃO)
-- =====================================================

-- 24. Inserir dados de exemplo para Development Course
INSERT INTO development_course_subscriptions (email, source) VALUES
('joao@exemplo.com', 'website'),
('maria@fazenda.com.br', 'website'),
('pedro@agro.com', 'website'),
('ana@chickens.com', 'website'),
('carlos@farm.com.br', 'website')
ON CONFLICT (email) DO NOTHING;

-- 25. Inserir dados de exemplo para RWAnimals
INSERT INTO rwanimals_collections (
    collection_name,
    description,
    images_link,
    region,
    farm_type,
    total_nfts,
    owner_email,
    owner_name,
    farm_name,
    status
) VALUES
(
    'Golden Chickens from São José Farm',
    'Coleção de galinhas caipiras da raça Rhode Island Red, criadas em sistema livre com alimentação orgânica. Animais selecionados por sua produtividade e resistência.',
    'https://drive.google.com/drive/folders/1ABC123XYZ',
    'Sudeste',
    'Avicultura',
    500,
    'joao@fazenda.com',
    'João Silva',
    'Fazenda São José',
    'approved'
),
(
    'Premium Pigs from Green Valley',
    'Suínos da raça Large White criados em sistema intensivo com foco em bem-estar animal. Animais certificados para produção de carne de alta qualidade.',
    'https://ipfs.io/ipfs/QmExample123',
    'Sul',
    'Suinocultura',
    200,
    'maria@greenvalley.com',
    'Maria Santos',
    'Green Valley Farm',
    'pending'
),
(
    'Organic Cows from Mountain Ranch',
    'Gado Nelore criado em pastagens orgânicas certificadas. Animais selecionados por sua genética superior e adaptação ao clima tropical.',
    'https://drive.google.com/drive/folders/2DEF456UVW',
    'Centro-Oeste',
    'Bovinocultura',
    1000,
    'pedro@mountainranch.com',
    'Pedro Oliveira',
    'Mountain Ranch',
    'approved'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
-- Execute esta query para verificar se tudo foi criado corretamente:
-- SELECT table_name, column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name IN ('wallet_whitelist', 'development_course_subscriptions', 'rwanimals_collections', 'farm_regions', 'farm_types')
-- ORDER BY table_name, ordinal_position;
-- =====================================================
