# Configuração do Supabase

## Variáveis de Ambiente Necessárias

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Exemplo de Configuração

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Como Obter as Chaves

1. Acesse o painel do Supabase
2. Vá em Settings > API
3. Copie a URL do projeto
4. Copie a chave anon/public

## Tabelas Criadas

### 1. development_course_subscriptions
- Armazena emails de inscrição no curso de desenvolvimento
- Campos: id, email, subscribed_at, is_active, created_at

### 2. rwanimals_collections
- Armazena informações das coleções de RWAnimals
- Campos: id, collection_name, description, images_link, region, farm_type, total_nfts, owner_email, owner_name, farm_name, status, created_at

## Funcionalidades Implementadas

### Development Course
- ✅ Formulário de inscrição no Footer
- ✅ Validação de email
- ✅ Feedback visual de sucesso
- ✅ Inserção no banco de dados

### RWAnimals
- ✅ Página completa de submissão
- ✅ Formulário com validação
- ✅ Seleção de região e tipo de fazenda
- ✅ Upload de imagens via link
- ✅ Inserção no banco de dados
- ✅ Página de confirmação

## Rotas Adicionadas

- `/rwanimals` - Página de submissão de RWAnimals
- Link no Header para acesso fácil

## Próximos Passos

1. Configure as variáveis de ambiente
2. Teste as funcionalidades
3. Verifique os dados no painel do Supabase
4. Implemente notificações por email (opcional)