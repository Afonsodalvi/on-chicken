# 🚀 Deploy Automático no Vercel - Pudgy Farms

## 📋 Pré-requisitos

1. **Conta no Vercel**: [vercel.com](https://vercel.com)
2. **Repositório GitHub** com o código
3. **Variáveis de ambiente** configuradas

## 🎯 Deploy Automático (Recomendado)

### **Configuração Inicial (Uma vez apenas)**

1. **Acesse o Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Clique em "Add New..." → "Project"**
3. **Importe seu repositório GitHub**
4. **Configure o projeto:**
   - O Vercel detectará automaticamente que é um projeto Vite
   - Framework Preset: `Vite` (detectado automaticamente)
   - Root Directory: `./` (padrão)
   - Build Command: `npm run build` (já configurado no `vercel.json`)
   - Output Directory: `dist` (já configurado no `vercel.json`)
   - Install Command: `npm install` (já configurado no `vercel.json`)

5. **Configure as Variáveis de Ambiente** (veja seção abaixo)

6. **Clique em "Deploy"**

### **🚀 Deploy Automático Após Configuração Inicial**

Após a primeira configuração, **todos os commits na branch `main` (ou `master`) farão deploy automático**:

```bash
# 1. Fazer suas alterações no código
# 2. Fazer commit
git add .
git commit -m "feat: nova funcionalidade"

# 3. Push para GitHub
git push origin main

# ✅ Deploy automático será iniciado no Vercel!
```

**O Vercel irá:**
- ✅ Detectar o push automaticamente
- ✅ Iniciar o build
- ✅ Fazer deploy da nova versão
- ✅ Notificar você por email (se configurado)

### **📦 Deploy Manual (Opcional)**

Se precisar fazer deploy manual:

1. Acesse o projeto no Vercel Dashboard
2. Vá em **"Deployments"**
3. Clique em **"Redeploy"** ou **"Deploy"**

### **🔑 Variáveis de Ambiente**

**IMPORTANTE:** Configure as variáveis de ambiente **ANTES** do primeiro deploy!

1. No painel do Vercel, vá em **Settings → Environment Variables**
2. Adicione as seguintes variáveis:

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

#### **📝 Configuração de Ambiente:**
- Selecione **"Production"**, **"Preview"** e **"Development"** para cada variável
- Ou configure separadamente para cada ambiente se necessário

**💡 Dica:** Após adicionar variáveis, você precisará fazer um novo deploy para que elas sejam aplicadas.

## 🔄 Deploy Automático por Branch

### **Branch Principal (main/master)**
- ✅ Deploy automático para **produção**
- ✅ URL: `https://pudgyfarms.vercel.app` (ou seu domínio customizado)

### **Outras Branches**
- ✅ Deploy automático para **preview**
- ✅ URL única para cada branch: `https://pudgyfarms-git-branch-name.vercel.app`
- ✅ Perfeito para testar antes de fazer merge

### **Pull Requests**
- ✅ Deploy automático para **preview**
- ✅ Link de preview aparece automaticamente no PR do GitHub

## 🎯 Configurações Avançadas

### **📁 Arquivo vercel.json**
Já está configurado com:
- ✅ **SPA Routing** (React Router) - todas as rotas redirecionam para `index.html`
- ✅ **Cache de Assets** (1 ano para assets estáticos)
- ✅ **Headers otimizados** para performance
- ✅ **Região**: `iad1` (US East) - pode ser alterada se necessário

### **🔧 Build Settings**
- **Node.js Version**: 18.x (padrão do Vercel)
- **Build Command**: `npm run build` (definido no `vercel.json`)
- **Output Directory**: `dist` (definido no `vercel.json`)
- **Install Command**: `npm install` (definido no `vercel.json`)

### **⚙️ Configurações Recomendadas no Dashboard**

No painel do Vercel, em **Settings → General**:

1. **Production Branch**: `main` (ou `master`)
2. **Auto-assign Custom Domains**: Ativado (se tiver domínio)
3. **Vercel Analytics**: Ativado (opcional, para métricas)
4. **Web Analytics**: Ativado (opcional, para analytics)

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
- ✅ Cada push na branch `main` gera um novo deploy de produção
- ✅ Deploys de preview para outras branches e PRs
- ✅ Rollback fácil para versões anteriores
- ✅ Notificações por email (configurável)

### **📧 Notificações:**
Configure em **Settings → Notifications**:
- Email quando deploy for concluído
- Email quando deploy falhar
- Integração com Slack/Discord (opcional)

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
