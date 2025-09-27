-- =====================================================
-- POLÍTICAS DE SEGURANÇA PARA WHITELIST
-- Execute este comando no SQL Editor do Supabase
-- =====================================================

-- 1. Habilitar RLS (Row Level Security) na tabela
ALTER TABLE wallet_whitelist ENABLE ROW LEVEL SECURITY;

-- 2. Política para INSERT (qualquer um pode inserir)
CREATE POLICY "Permitir inserção de novos registros" ON wallet_whitelist
    FOR INSERT 
    WITH CHECK (true);

-- 3. Política para SELECT (qualquer um pode ler)
CREATE POLICY "Permitir leitura de todos os registros" ON wallet_whitelist
    FOR SELECT 
    USING (true);

-- 4. Política para UPDATE (apenas para administradores - opcional)
-- Descomente se quiser permitir atualizações apenas para admins
-- CREATE POLICY "Permitir atualização para administradores" ON wallet_whitelist
--     FOR UPDATE 
--     USING (auth.role() = 'service_role');

-- 5. Política para DELETE (apenas para administradores - opcional)
-- Descomente se quiser permitir exclusões apenas para admins
-- CREATE POLICY "Permitir exclusão para administradores" ON wallet_whitelist
--     FOR DELETE 
--     USING (auth.role() = 'service_role');

-- =====================================================
-- VERIFICAÇÃO DAS POLÍTICAS
-- =====================================================
-- Execute esta query para verificar se as políticas foram criadas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'wallet_whitelist';

-- =====================================================
-- TESTE DE CONECTIVIDADE
-- =====================================================
-- Execute esta query para testar se está funcionando:
-- SELECT COUNT(*) FROM wallet_whitelist;
