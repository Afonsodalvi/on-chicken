# Comandos para Corrigir Vulnerabilidades e Testar Build

Execute os seguintes comandos **na ordem** no seu terminal:

## 1. Corrigir Vulnerabilidades Automaticamente

```bash
npm audit fix
```

Este comando tentará corrigir automaticamente as vulnerabilidades que podem ser corrigidas sem quebrar compatibilidade.

## 2. Verificar Vulnerabilidades Restantes

```bash
npm audit
```

Se ainda houver vulnerabilidades após o `npm audit fix`, você verá quais são. Algumas podem requerer atenção manual.

## 3. (Opcional) Forçar Correção de Vulnerabilidades

Se ainda houver vulnerabilidades e você quiser tentar corrigi-las mesmo com risco de quebrar compatibilidade:

```bash
npm audit fix --force
```

**⚠️ ATENÇÃO:** Use `--force` apenas se necessário, pois pode atualizar dependências para versões que podem quebrar compatibilidade.

## 4. Testar o Build

Execute o build para garantir que tudo funciona corretamente:

```bash
npm run build
```

Se o build for bem-sucedido, você verá:
- Uma pasta `dist` criada com os arquivos compilados
- Mensagem de sucesso no terminal

## 5. Verificar o Resultado

Após o build, verifique se a pasta `dist` foi criada:

```bash
ls -la dist
```

## Próximos Passos

Após executar esses comandos com sucesso:
1. ✅ As vulnerabilidades estarão corrigidas (ou minimizadas)
2. ✅ O build estará funcionando corretamente
3. ✅ Você pode fazer commit e push para o Vercel fazer o deploy automaticamente

O Vercel usará o comando `npm run build` configurado no `vercel.json` para fazer o deploy.

