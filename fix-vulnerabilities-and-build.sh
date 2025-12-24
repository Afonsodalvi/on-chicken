#!/bin/bash

# Script para corrigir vulnerabilidades e testar o build
set -e

# Tentar carregar nvm se estiver disponível
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$HOME/.bashrc" ] && source "$HOME/.bashrc"

echo "🔍 Verificando vulnerabilidades..."
npm audit

echo ""
echo "🔧 Tentando corrigir vulnerabilidades automaticamente..."
npm audit fix

echo ""
echo "🔍 Verificando vulnerabilidades restantes..."
npm audit

echo ""
echo "🏗️  Executando build da aplicação..."
npm run build

echo ""
echo "✅ Build concluído com sucesso!"
echo "📦 Os arquivos foram gerados na pasta 'dist'"

