# 🐔 Pudgy Farms - Web3 Agricultural Platform

Uma plataforma completa de tokenização de animais reais (RWAnimals) com sistema de batalhas, apostas EggCoin e curso educacional de desenvolvimento blockchain.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura do Projeto](#-arquitetura-do-projeto)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Configuração do Ambiente](#-configuração-do-ambiente)
- [Banco de Dados](#-banco-de-dados)
- [Funcionalidades](#-funcionalidades)
- [Componentes Principais](#-componentes-principais)
- [Contextos e Estados](#-contextos-e-estados)
- [Serviços](#-serviços)
- [Deploy](#-deploy)
- [Personalização](#-personalização)

## 🎯 Visão Geral

O Pudgy Farms é uma plataforma Web3 que permite:

- **Tokenização de Animais Reais (RWAnimals)**: Digitalização de animais físicos em NFTs
- **Sistema de Batalhas**: Combates entre NFTs com apostas EggCoin
- **Curso Educacional**: Inscrições para curso de desenvolvimento blockchain
- **Whitelist**: Sistema de aprovação para acesso exclusivo
- **Fazenda Digital**: Interface para gerenciar coleções de animais

## 🏗️ Arquitetura do Projeto

### Frontend
- **React 18** com TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes
- **React Router** para navegação
- **Context API** para gerenciamento de estado

### Backend
- **Supabase** como backend-as-a-service
- **PostgreSQL** como banco de dados
- **Row Level Security (RLS)** para segurança
- **Real-time subscriptions** para dados dinâmicos

### Web3
- **Wagmi** para integração Ethereum
- **Viem** para interações com blockchain
- **Smart contracts** personalizáveis
- **ABIs** modulares para diferentes contratos

## 🛠️ Tecnologias Utilizadas

### Core
- **React 18.2.0** - Framework principal
- **TypeScript 5.0+** - Tipagem estática
- **Vite 4.4+** - Build tool e dev server

### UI/UX
- **Tailwind CSS 3.3+** - Framework CSS
- **shadcn/ui** - Componentes reutilizáveis
- **Lucide React** - Ícones
- **Framer Motion** - Animações (opcional)

### Estado e Navegação
- **React Router DOM 6.8+** - Roteamento
- **React Context API** - Estado global
- **React Query** - Cache e sincronização

### Web3
- **Wagmi 1.4+** - Hooks para Ethereum
- **Viem 1.0+** - Cliente Ethereum
- **@tanstack/react-query** - Cache de dados

### Backend
- **Supabase** - Backend completo
- **@supabase/supabase-js** - Cliente JavaScript

### Utilitários
- **Sonner** - Notificações toast
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas

## 📁 Estrutura de Pastas

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes base (shadcn/ui)
│   ├── Header.tsx       # Cabeçalho principal
│   ├── Footer.tsx       # Rodapé com newsletter
│   ├── Hero.tsx         # Seção hero da home
│   ├── BattleArena.tsx  # Arena de batalhas
│   ├── BattleLobby.tsx  # Lobby de batalhas
│   ├── FarmCollection.tsx # Formulário RWAnimals
│   └── ...
├── pages/               # Páginas da aplicação
│   ├── Index.tsx        # Home page
│   ├── Battle.tsx       # Página de batalhas
│   ├── Farm.tsx         # Página da fazenda
│   ├── Whitelist.tsx    # Página de whitelist
│   └── Details.tsx      # Página de detalhes
├── contexts/            # Contextos React
│   ├── LanguageContext.tsx    # Internacionalização
│   ├── BattleContext.tsx      # Estado das batalhas
│   └── Web3Provider.tsx       # Provider Web3
├── services/            # Serviços externos
│   ├── supabase.ts      # Cliente Supabase
│   └── web3.ts          # Configurações Web3
├── lib/                 # Utilitários e configurações
│   ├── abi/             # ABIs dos contratos
│   ├── utils.ts         # Funções utilitárias
│   └── constants.ts     # Constantes
├── assets/              # Recursos estáticos
│   ├── images/          # Imagens
│   ├── icons/           # Ícones
│   └── ...
└── App.tsx              # Componente raiz
```

## ⚙️ Configuração do Ambiente

### 1. Pré-requisitos
```bash
# Node.js 18+ e npm
node --version  # v18.0.0+
npm --version   # 9.0.0+
```

### 2. Instalação
```bash
# Clone o repositório
git clone <repository-url>
cd on-chicken

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp env.example .env.local
```

### 3. Variáveis de Ambiente
```env
# Supabase
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Web3 (opcional)
VITE_WALLET_CONNECT_PROJECT_ID=your-project-id
VITE_CHAIN_ID=1

# Outras configurações
VITE_APP_NAME=Pudgy Farms
VITE_APP_DESCRIPTION=Web3 Agricultural Platform
```

### 4. Executar o Projeto
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🗄️ Banco de Dados

### Configuração do Supabase

1. **Criar projeto** no [Supabase](https://supabase.com)
2. **Executar schema** completo:
```sql
-- Execute o arquivo supabase_final_schema.sql no SQL Editor
```

### Tabelas Principais

#### `wallet_whitelist`
- Endereços de carteira aprovados
- Status de aprovação
- Links de redes sociais
- Dados do usuário

#### `development_course_subscriptions`
- Emails de inscrição no curso
- Status ativo/inativo
- Origem da inscrição
- Timestamps automáticos

#### `rwanimals_collections`
- Informações das coleções
- Dados do proprietário
- Status de aprovação
- Links de imagens

#### `farm_regions` e `farm_types`
- Dados auxiliares para formulários
- Regiões brasileiras
- Tipos de fazenda

### Políticas de Segurança (RLS)
```sql
-- Execute supabase_policies.sql para configurar RLS
```

## 🎮 Funcionalidades

### 1. Sistema de Whitelist
- **Formulário de inscrição** com validação
- **Aprovação manual** por administradores
- **Status tracking** (pending/approved/rejected)
- **Integração com redes sociais**

### 2. Tokenização RWAnimals
- **Formulário completo** para submissão de coleções
- **Upload de imagens** via links
- **Seleção de região** e tipo de fazenda
- **Validação de dados** robusta
- **Status de aprovação** para coleções

### 3. Sistema de Batalhas
- **Lobby de batalhas** com lista de salas
- **Criação de batalhas** com NFTs
- **Sistema de apostas** EggCoin
- **Arena de combate** com animações
- **Cálculo de vencedor** baseado em atributos

### 4. Curso Educacional
- **Inscrição por email** no footer
- **Validação de email** em tempo real
- **Feedback visual** de sucesso/erro
- **Integração com banco** de dados

### 5. Internacionalização
- **Português e Inglês** completos
- **Troca dinâmica** de idioma
- **Traduções contextuais** para todas as funcionalidades

## 🧩 Componentes Principais

### Header
```typescript
// Navegação principal com:
// - Logo e branding
// - Menu responsivo
// - Seletor de idioma
// - Conectar carteira
// - Botão EggCoin
```

### Hero
```typescript
// Seção principal com:
// - Título e subtítulo
// - Botões de ação
// - Estatísticas do projeto
// - Botão "Saiba Mais"
```

### BattleArena
```typescript
// Arena de batalhas com:
// - Seleção de NFTs
// - Campo de batalha
// - Sistema de apostas
// - Cálculo de vencedor
// - Animações de combate
```

### FarmCollection
```typescript
// Formulário RWAnimals com:
// - Dados da coleção
// - Informações do proprietário
// - Validação completa
// - Preview em tempo real
// - Integração Supabase
```

## 🔄 Contextos e Estados

### LanguageContext
```typescript
// Gerenciamento de idiomas:
// - Estado do idioma atual
// - Função de tradução t()
// - Troca dinâmica
// - Persistência no localStorage
```

### BattleContext
```typescript
// Estado das batalhas:
// - Lista de batalhas ativas
// - Criação de batalhas
// - Entrada em batalhas
// - Sistema de apostas
// - Persistência local
```

### Web3Provider
```typescript
// Integração Web3:
// - Conexão de carteira
// - Estado da conexão
// - Interações com contratos
// - Gerenciamento de transações
```

## 🔧 Serviços

### Supabase Service
```typescript
// Operações de banco:
// - Inscrições no curso
// - Submissão de RWAnimals
// - Busca de dados
// - Tratamento de erros
```

### Web3 Service
```typescript
// Interações blockchain:
// - Conexão de carteira
// - Leitura de contratos
// - Escrita de transações
// - Eventos de contrato
```

## 🚀 Deploy

### Deploy Automático no Vercel (Recomendado)

O projeto está configurado para **deploy automático** no Vercel. Cada commit na branch `main` gera um novo deploy automaticamente.

#### ⚡ Quick Start
1. Conecte seu repositório GitHub ao Vercel: https://vercel.com/new
2. Configure as variáveis de ambiente (veja `DEPLOY_QUICK_START.md`)
3. Clique em "Deploy"
4. ✅ Pronto! Deploys automáticos ativados

#### 📚 Documentação Completa
- **Guia Rápido**: Veja `DEPLOY_QUICK_START.md`
- **Guia Completo**: Veja `VERCEL_DEPLOY.md`

#### 🔄 Como Funciona
```bash
# Fazer commit e push
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# ✅ Deploy automático será iniciado no Vercel!
```

### Deploy Manual

### Lovable (Recomendado)
1. Acesse [Lovable](https://lovable.dev)
2. Conecte o repositório
3. Configure as variáveis de ambiente
4. Clique em "Share → Publish"

### Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Build
npm run build

# Deploy manual ou via Git
```

## 🎨 Personalização

### 1. Alterar Páginas
```typescript
// Adicione novas páginas em src/pages/
// Registre as rotas em App.tsx
// Atualize o Header.tsx para navegação
```

### 2. Modificar Componentes
```typescript
// Edite componentes em src/components/
// Mantenha a estrutura de props
// Atualize as traduções se necessário
```

### 3. Atualizar ABIs
```typescript
// Substitua arquivos em src/lib/abi/
// Atualize as interfaces TypeScript
// Modifique os hooks Web3
```

### 4. Trocar Assets
```typescript
// Substitua imagens em src/assets/
// Atualize as importações
// Mantenha os nomes dos arquivos
```

### 5. Personalizar Traduções
```typescript
// Edite src/contexts/LanguageContext.tsx
// Adicione novas chaves de tradução
// Mantenha a estrutura de objetos
```

### 6. Modificar Banco de Dados
```sql
-- Edite supabase_final_schema.sql
-- Adicione novas tabelas/colunas
-- Atualize as políticas RLS
-- Modifique os serviços Supabase
```

## 📊 Monitoramento

### Analytics
- **Supabase Dashboard** - Métricas de banco
- **Vercel Analytics** - Performance frontend
- **Google Analytics** - Comportamento do usuário

### Logs
- **Console logs** para debug
- **Supabase logs** para backend
- **Error tracking** com Sentry (opcional)

## 🤝 Contribuição

1. **Fork** o repositório
2. **Crie** uma branch para sua feature
3. **Commit** suas mudanças
4. **Push** para a branch
5. **Abra** um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

- **Documentação**: Este README
- **Issues**: GitHub Issues
- **Comunidade**: Discord/Telegram
- **Email**: suporte@exemplo.com

---

**Desenvolvido com ❤️ pela equipe Omnes**

*Uma plataforma Web3 completa para a revolução agrícola digital* 🚀🌾