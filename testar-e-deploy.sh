#!/bin/bash

# Script para testar build e fazer deploy no Vercel

set -e

echo "🔍 Verificando vercel.json..."
if node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf8'))" 2>/dev/null; then
    echo "✅ vercel.json é válido"
else
    echo "❌ vercel.json tem erros!"
    exit 1
fi

echo ""
echo "🏗️  Testando build localmente..."
npm run build

if [ -d "dist" ]; then
    echo "✅ Build bem-sucedido! Pasta dist criada."
else
    echo "❌ Build falhou! Pasta dist não foi criada."
    exit 1
fi

echo ""
echo "🚀 Fazendo deploy no Vercel..."
vercel --prod

echo ""
echo "✅ Deploy concluído!"

