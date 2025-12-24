#!/bin/bash

# Script para fazer commit limpo e trigger do deploy no Vercel

set -e

echo "🚀 Preparando deploy no Vercel..."
echo ""

# Verificar se está no git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Erro: Não é um repositório Git"
    exit 1
fi

# Verificar branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📌 Branch atual: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "⚠️  Aviso: Você não está na branch main/master"
    read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar status
echo ""
echo "📊 Status do repositório:"
git status --short

# Verificar se há mudanças
if git diff-index --quiet HEAD --; then
    echo ""
    echo "⚠️  Nenhuma mudança detectada. Criando arquivo de trigger..."
    
    # Criar arquivo de trigger
    TIMESTAMP=$(date +"%Y%m%d%H%M%S")
    echo "# Deploy trigger - $TIMESTAMP" > .deploy-trigger
    echo "Deploy acionado em $(date)" >> .deploy-trigger
    git add .deploy-trigger
    echo "✅ Arquivo .deploy-trigger criado"
else
    echo ""
    echo "✅ Mudanças detectadas, serão commitadas"
    git add .
fi

# Verificar build localmente (opcional)
echo ""
read -p "Deseja testar o build localmente antes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🏗️  Testando build localmente..."
    if npm run build; then
        echo "✅ Build local bem-sucedido!"
    else
        echo "❌ Build local falhou! Corrija os erros antes de fazer deploy."
        exit 1
    fi
fi

# Fazer commit
echo ""
echo "📝 Fazendo commit..."
COMMIT_MSG="fix: trigger deploy no Vercel - $(date +"%Y-%m-%d %H:%M:%S")"
git commit -m "$COMMIT_MSG"
echo "✅ Commit criado: $COMMIT_MSG"

# Fazer push
echo ""
echo "📤 Fazendo push para o repositório remoto..."
if git push origin "$CURRENT_BRANCH"; then
    echo ""
    echo "✅ Push realizado com sucesso!"
    echo ""
    echo "🎯 Próximos passos:"
    echo "1. Acesse https://vercel.com/dashboard"
    echo "2. Verifique se o deploy foi acionado automaticamente"
    echo "3. Se não foi, vá em Deployments → Deploy → Deploy Latest Commit"
    echo ""
    echo "💡 Se o deploy não aparecer, verifique:"
    echo "   - Settings → Git → Automatic deployments está ativado"
    echo "   - O repositório está conectado corretamente"
    echo "   - A branch de produção está configurada corretamente"
else
    echo "❌ Erro ao fazer push"
    exit 1
fi

