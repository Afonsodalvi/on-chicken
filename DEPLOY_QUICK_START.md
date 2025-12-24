# 🚀 Quick Start - Deploy Automático Vercel

## ⚡ Setup Rápido (5 minutos)

### 1️⃣ **Conectar Repositório ao Vercel**

1. Acesse: https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Selecione seu repositório GitHub
4. Clique em **"Import"**

### 2️⃣ **Configurar Variáveis de Ambiente**

No painel do Vercel, vá em **Settings → Environment Variables** e adicione:

```bash
# Obrigatórias
VITE_WALLETCONNECT_PROJECT_ID=seu_project_id
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_key_supabase

# Opcionais
VITE_INFURA_KEY=sua_infura_key
VITE_ALCHEMY_KEY=sua_alchemy_key
```

**⚠️ IMPORTANTE:** Selecione **Production**, **Preview** e **Development** para cada variável!

### 3️⃣ **Deploy**

1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos
3. ✅ Pronto! Sua aplicação estará online

## 🔄 Deploy Automático

Após a configuração inicial, **todos os commits na branch `main` farão deploy automático**:

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

**✅ O Vercel detecta automaticamente e faz o deploy!**

## 📋 Checklist Pós-Deploy

- [ ] Aplicação carregando corretamente
- [ ] Rotas funcionando (Home, Details, Farm, Battle, Mint)
- [ ] Conexão com carteira funcionando
- [ ] Conexão com Supabase funcionando
- [ ] Responsividade em mobile
- [ ] Performance otimizada

## 🔗 Links Úteis

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Documentação Completa**: Veja `VERCEL_DEPLOY.md`

---

**🎉 Pronto! Seu deploy automático está configurado!**

