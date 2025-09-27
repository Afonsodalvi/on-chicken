# 🔧 Configuração do Supabase - Guia Completo

## 📋 Passo a Passo para Configurar o Supabase

### 1. Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Faça login na sua conta

### 2. Selecione seu Projeto
- Clique no projeto: `nwtqiiktatowmolwglfl`
- Ou crie um novo projeto se necessário

### 3. Obtenha as Chaves API
- Vá para **Settings** → **API**
- Copie a **URL** do projeto
- Copie a **anon public** key

### 4. Configure o arquivo .env
Crie um arquivo `.env` na raiz do projeto com:

```env
# Database Configuration
VITE_SUPABASE_URL=https://nwtqiiktatowmolwglfl.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_AQUI
DATABASE_URL=postgresql://postgres:OmnesOnChicken06@db.nwtqiiktatowmolwglfl.supabase.co:5432/postgres
```

### 5. Execute o SQL no Supabase
- Vá para **SQL Editor** no Supabase
- Cole o conteúdo do arquivo `supabase_final_schema.sql`
- Execute o comando

### 6. Configure as Políticas de Segurança
- Vá para **SQL Editor** no Supabase
- Cole o conteúdo do arquivo `supabase_policies.sql`
- Execute o comando
- Isso resolve o erro 406 (Not Acceptable)

### 7. Verifique as Permissões
- Vá para **Authentication** → **Policies**
- Certifique-se de que a tabela `wallet_whitelist` tem as políticas corretas

## 🔑 Onde Encontrar a Chave API

1. **Dashboard Supabase** → **Seu Projeto**
2. **Settings** (ícone de engrenagem)
3. **API** (no menu lateral)
4. **Project URL**: `https://nwtqiiktatowmolwglfl.supabase.co`
5. **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (copie esta chave)

## 🚨 Solução de Problemas

### Erro: "Invalid API key"
- ✅ Verifique se a chave está correta
- ✅ Certifique-se de que é a chave **anon public**
- ✅ Não use a chave **service_role** no frontend

### Erro: "Cannot read properties of undefined"
- ✅ Já corrigido no código
- ✅ Adicionado optional chaining (`?.`)

### Erro 406 (Not Acceptable)
- ✅ Execute o arquivo `supabase_policies.sql`
- ✅ Configure as políticas RLS (Row Level Security)
- ✅ Permita leitura e escrita para usuários anônimos

### Erro de CORS
- ✅ Configure as URLs permitidas no Supabase
- ✅ Adicione `http://localhost:8081` nas configurações

## 📊 Verificação Final

Execute esta query no SQL Editor para testar:

```sql
SELECT * FROM wallet_whitelist LIMIT 5;
```

Se retornar dados (mesmo que vazio), está funcionando!
