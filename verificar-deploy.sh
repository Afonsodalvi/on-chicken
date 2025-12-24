#!/bin/bash

# Script para verificar status do deploy no Vercel

echo "🔍 Verificando status do Git..."
echo ""

# Verificar branch atual
echo "📌 Branch atual:"
git branch --show-current
echo ""

# Verificar commits recentes
echo "📝 Últimos 5 commits:"
git log --oneline -5
echo ""

# Verificar status
echo "📊 Status do repositório:"
git status
echo ""

# Verificar remote
echo "🔗 Repositório remoto:"
git remote -v
echo ""

echo "✅ Verificações concluídas!"
echo ""
echo "📋 Próximos passos:"
echo "1. Verifique se está na branch 'main' ou 'master'"
echo "2. Verifique se o commit foi feito e push foi enviado"
echo "3. Acesse https://vercel.com/dashboard e verifique:"
echo "   - Se o projeto está conectado ao repositório"
echo "   - Se 'Automatic deployments' está ativado"
echo "   - Se há algum deploy pendente ou com erro"
echo ""
echo "💡 Se o deploy não aparecer, tente:"
echo "   git commit --allow-empty -m 'chore: trigger vercel deploy'"
echo "   git push origin main"

