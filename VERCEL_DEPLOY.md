# 🚀 Deploy no Vercel - Pudgy Farms

## 📋 Pré-requisitos

1. **Conta no Vercel**: [vercel.com](https://vercel.com)
2. **GitHub conectado** ao Vercel
3. **Variáveis de ambiente** configuradas

## 🔧 Passo a Passo

### 1. **Preparar o Repositório**

```bash
# Fazer commit de todas as mudanças
git add .
git commit -m "feat: prepare for Vercel deployment"
git push origin main
```

### 2. **Configurar no Vercel**

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"New Project"**
3. **Import** seu repositório GitHub
4. Configure as seguintes opções:

#### **⚙️ Configurações do Projeto:**
- **Framework Preset**: `Vite`
- **Root Directory**: `./` (padrão)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. **Variáveis de Ambiente**

No painel do Vercel, vá em **Settings > Environment Variables** e adicione:

#### **🔑 Variáveis Obrigatórias:**
```
VITE_WALLETCONNECT_PROJECT_ID=seu_project_id_aqui
VITE_SUPABASE_URL=https://nwtqiikta.....supabase.co
VITE_SUPABASE_ANON_KEY=sua_supabase_anon_key_aqui
```

#### **🔑 Variáveis Opcionais (para Web3):**
```
VITE_INFURA_KEY=sua_infura_key_aqui
VITE_ALCHEMY_KEY=sua_alchemy_key_aqui
VITE_APP_NAME=Pudgy Farms
VITE_APP_DESCRIPTION=O primeiro protocolo de tokenização de RWAnimals
VITE_APP_URL=https://pudgyfarms.vercel.app
```

### 4. **Deploy**

1. Clique em **"Deploy"**
2. Aguarde o build (2-3 minutos)
3. Sua aplicação estará disponível em: `https://pudgyfarms.vercel.app`

## 🎯 Configurações Avançadas

### **📁 Arquivo vercel.json**
Já foi criado com otimizações:
- ✅ **SPA Routing** (React Router)
- ✅ **Cache de Assets** (1 ano)
- ✅ **Headers otimizados**

### **🔧 Build Settings**
- **Node.js Version**: 18.x
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## 🚨 Troubleshooting

### **❌ Erro de Build:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **❌ Erro de Variáveis:**
- Verifique se todas as variáveis estão configuradas
- Use prefixo `VITE_` para variáveis do frontend
- Reinicie o deploy após adicionar variáveis

### **❌ Erro de Roteamento:**
- O `vercel.json` já está configurado para SPA
- Todas as rotas redirecionam para `index.html`

## 📊 Monitoramento

### **📈 Analytics:**
- Acesse **Analytics** no painel do Vercel
- Monitore performance e erros
- Configure alertas se necessário

### **🔄 Deploys Automáticos:**
- Cada push na branch `main` gera um novo deploy
- Deploys de preview para outras branches
- Rollback fácil para versões anteriores

## 🎉 Pós-Deploy

### **✅ Checklist:**
- [ ] Aplicação carregando corretamente
- [ ] Rotas funcionando (Home, Details, Farm, etc.)
- [ ] Formulários funcionando (Whitelist, RWAnimals)
- [ ] Conexão com Supabase funcionando
- [ ] Responsividade em mobile
- [ ] Performance otimizada

### **🔗 URLs Importantes:**
- **Produção**: `https://pudgyfarms.vercel.app`
- **Admin Vercel**: `https://vercel.com/dashboard`
- **Supabase**: `https://supabase.com/dashboard`

## 🚀 Próximos Passos

1. **Configurar domínio personalizado** (opcional)
2. **Configurar CDN** para assets
3. **Implementar CI/CD** avançado
4. **Configurar monitoramento** (Sentry, etc.)

---

**🎯 Sua aplicação Pudgy Farms estará online em poucos minutos!** 🐔✨
